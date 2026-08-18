@echo off
chcp 65001 >nul
title CinePalette 本地网站
set "PROJECT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%scripts\serve-static.ps1" -SiteRoot "%PROJECT_DIR%dist"
if errorlevel 1 (
  echo.
  echo 启动失败。请确认 dist 文件夹存在；使用源码时先执行 npm run build。
  pause
)
