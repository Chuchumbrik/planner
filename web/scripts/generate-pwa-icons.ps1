# Generates simple PWA icons (Windows, System.Drawing)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$webRoot = Split-Path $PSScriptRoot -Parent
$public = Join-Path $webRoot 'public'

function Export-Png {
  param([int]$Size, [string]$Path)
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::FromArgb(255, 24, 24, 27))
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 52, 211, 153))
  $fontSize = [Math]::Max(12, [int]($Size / 4))
  $font = [System.Drawing.Font]::new('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = 'Center'
  $format.LineAlignment = 'Center'
  $rect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
  $g.DrawString('M', $font, $brush, $rect, $format)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Export-Png -Size 192 -Path (Join-Path $public 'pwa-192.png')
Export-Png -Size 512 -Path (Join-Path $public 'pwa-512.png')
Write-Host 'OK:' (Join-Path $public 'pwa-192.png')
