Add-Type -AssemblyName System.Drawing
$color = [Drawing.Color]::FromArgb(255, 124, 58, 237)
$base = Join-Path $PSScriptRoot "..\public\icons"
foreach ($s in @(192, 512)) {
  $bmp = New-Object Drawing.Bitmap $s, $s
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.Clear($color)
  $g.Dispose()
  $path = Join-Path $base "icon-${s}x${s}.png"
  $bmp.Save($path, [Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Wrote $path"
}
