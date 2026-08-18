[CmdletBinding()]
param(
    [string]$SiteRoot = (Join-Path $PSScriptRoot '..\dist'),
    [ValidateRange(1024, 65535)]
    [int]$Port = 4173,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

if (-not (Test-Path -LiteralPath $SiteRoot -PathType Container)) {
    throw "Site directory not found: $SiteRoot`nRun npm run build first when using the source project."
}

$resolvedRoot = (Resolve-Path -LiteralPath $SiteRoot).Path
$rootPrefix = $resolvedRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'
    '.mjs' = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg' = 'image/svg+xml'
    '.jpg' = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.png' = 'image/png'
    '.webp' = 'image/webp'
    '.gif' = 'image/gif'
    '.ico' = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2' = 'font/woff2'
    '.txt' = 'text/plain; charset=utf-8'
}

$listener = $null
$activePort = $Port
for ($candidatePort = $Port; $candidatePort -le [Math]::Min($Port + 20, 65535); $candidatePort++) {
    try {
        $candidate = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $candidatePort)
        $candidate.Start()
        $listener = $candidate
        $activePort = $candidatePort
        break
    }
    catch {
        if ($candidate) { $candidate.Stop() }
    }
}

if (-not $listener) {
    throw "Unable to start the site on ports $Port through $([Math]::Min($Port + 20, 65535))."
}

$url = "http://127.0.0.1:$activePort/"
Write-Host ''
Write-Host 'CinePalette is running' -ForegroundColor Green
Write-Host "URL: $url"
Write-Host "Site: $resolvedRoot"
Write-Host 'Close this window to stop the local site.' -ForegroundColor DarkGray
Write-Host ''

if (-not $NoBrowser) {
    Start-Process $url
}

function Send-Response {
    param(
        [Parameter(Mandatory = $true)]$Stream,
        [Parameter(Mandatory = $true)][int]$StatusCode,
        [Parameter(Mandatory = $true)][string]$StatusText,
        [Parameter(Mandatory = $true)][string]$ContentType,
        [Parameter(Mandatory = $true)][byte[]]$Body,
        [bool]$IncludeBody = $true
    )

    $header = "HTTP/1.1 $StatusCode $StatusText`r`n" +
        "Content-Type: $ContentType`r`n" +
        "Content-Length: $($Body.Length)`r`n" +
        "Cache-Control: no-cache`r`n" +
        "X-Content-Type-Options: nosniff`r`n" +
        "Connection: close`r`n`r`n"
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($IncludeBody -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 10000
            $client.SendTimeout = 10000
            $stream = $client.GetStream()
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 8192, $true)
            $requestLine = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

            while ($true) {
                $line = $reader.ReadLine()
                if ([string]::IsNullOrEmpty($line)) { break }
            }

            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) { continue }
            $method = $parts[0].ToUpperInvariant()
            if ($method -notin @('GET', 'HEAD')) {
                $body = [Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
                Send-Response -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $body -IncludeBody ($method -ne 'HEAD')
                continue
            }

            $rawPath = ($parts[1] -split '\?')[0]
            $decodedPath = [Uri]::UnescapeDataString($rawPath)
            if ($decodedPath -eq '/') { $decodedPath = '/index.html' }
            $relativePath = $decodedPath.TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
            $candidatePath = [IO.Path]::GetFullPath((Join-Path $resolvedRoot $relativePath))

            $insideRoot = $candidatePath.Equals($resolvedRoot, [StringComparison]::OrdinalIgnoreCase) -or
                $candidatePath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)
            if (-not $insideRoot) {
                $body = [Text.Encoding]::UTF8.GetBytes('Forbidden')
                Send-Response -Stream $stream -StatusCode 403 -StatusText 'Forbidden' -ContentType 'text/plain; charset=utf-8' -Body $body -IncludeBody ($method -ne 'HEAD')
                continue
            }

            if (Test-Path -LiteralPath $candidatePath -PathType Container) {
                $candidatePath = Join-Path $candidatePath 'index.html'
            }

            if (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
                $body = [Text.Encoding]::UTF8.GetBytes('Not Found')
                Send-Response -Stream $stream -StatusCode 404 -StatusText 'Not Found' -ContentType 'text/plain; charset=utf-8' -Body $body -IncludeBody ($method -ne 'HEAD')
                continue
            }

            $extension = [IO.Path]::GetExtension($candidatePath).ToLowerInvariant()
            $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
            $body = [IO.File]::ReadAllBytes($candidatePath)
            Send-Response -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType $contentType -Body $body -IncludeBody ($method -ne 'HEAD')
        }
        catch {
            Write-Warning $_.Exception.Message
        }
        finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
