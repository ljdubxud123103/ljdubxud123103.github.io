export async function exportScreenshot(imageUrl: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Failed to create blob')); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/jpeg', 0.95);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

function inkOn(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.92)';
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export interface PaletteCardData {
  imageUrl: string;
  palette: string[];
  title: string;
  meta: string;
  hue: number;
  saturation: number;
  brightness: number;
  filename: string;
}

export async function exportPaletteCard(data: PaletteCardData): Promise<void> {
  const img = await loadImage(data.imageUrl);

  const W = 1080;
  const pad = 56;
  const imgW = W - pad * 2;
  const imgH = Math.min(Math.round((img.naturalHeight / img.naturalWidth) * imgW), 620);
  const paletteH = 132;
  const paletteGap = 10;
  const swatchW = (imgW - paletteGap * (data.palette.length - 1)) / data.palette.length;

  const imgBottom = pad + imgH;
  const paletteTop = imgBottom + 44;
  const paletteBottom = paletteTop + paletteH;
  const titleTop = paletteBottom + 44;
  const metaTop = titleTop + 60;
  const dataTop = metaTop + 46;
  const H = dataTop + 30 + 58;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const sans = `-apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  const mono = `"SF Mono", "Cascadia Mono", Consolas, monospace`;

  ctx.fillStyle = '#101114';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  roundedRectPath(ctx, pad, pad, imgW, imgH, 22);
  ctx.clip();
  const scale = Math.max(imgW / img.naturalWidth, imgH / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  ctx.drawImage(img, pad + (imgW - drawW) / 2, pad + (imgH - drawH) / 2, drawW, drawH);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  data.palette.forEach((hex, i) => {
    const x = pad + i * (swatchW + paletteGap);
    ctx.fillStyle = hex;
    roundedRectPath(ctx, x, paletteTop, swatchW, paletteH, 16);
    ctx.fill();

    ctx.fillStyle = inkOn(hex);
    ctx.font = `600 22px ${mono}`;
    ctx.fillText(hex.toUpperCase(), x + swatchW / 2, paletteTop + paletteH - 22);
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2f2f0';
  ctx.font = `700 46px ${sans}`;
  ctx.fillText(data.title, pad, titleTop + 42);

  ctx.fillStyle = '#9a9ba1';
  ctx.font = `400 27px ${sans}`;
  ctx.fillText(data.meta, pad, metaTop + 28);

  ctx.fillStyle = '#6d6e74';
  ctx.font = `600 24px ${mono}`;
  const dataText = `HUE ${Math.round(data.hue)}°   SAT ${Math.round(data.saturation * 100)}%   BRI ${Math.round(data.brightness * 100)}%`;
  ctx.fillText(dataText, pad, dataTop + 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#55565c';
  ctx.font = `600 20px ${mono}`;
  ctx.fillText('CINEPALETTE', W - pad, H - 34);

  downloadCanvas(canvas, data.filename);
}
