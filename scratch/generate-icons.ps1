Add-Type -AssemblyName System.Drawing

$srcFile = "public\logos\bookguard-app-icon.png"
if (-not (Test-Path $srcFile)) {
    Write-Error "Source icon not found: $srcFile"
    exit 1
}

if (-not (Test-Path "public\icons")) {
    New-Item -ItemType Directory -Path "public\icons" -Force | Out-Null
}

$srcImage = [System.Drawing.Image]::FromFile((Resolve-Path $srcFile).Path)

function Resize-Image($width, $height, $destPath, $padPercent = 0) {
    $destBitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    if ($padPercent -gt 0) {
        # Maskable safe padding (80% inner area)
        $padX = [int]($width * $padPercent)
        $padY = [int]($height * $padPercent)
        $drawW = $width - (2 * $padX)
        $drawH = $height - (2 * $padY)
        $graphics.DrawImage($srcImage, $padX, $padY, $drawW, $drawH)
    } else {
        $graphics.DrawImage($srcImage, 0, 0, $width, $height)
    }

    $destBitmap.Save((Join-Path (Get-Location) $destPath), [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destBitmap.Dispose()
    Write-Host "Generated $destPath ($($width)x$($height))"
}

Resize-Image 192 192 "public\icons\icon-192.png"
Resize-Image 512 512 "public\icons\icon-512.png"
Resize-Image 512 512 "public\icons\icon-maskable-512.png" 0.10
Resize-Image 180 180 "public\apple-touch-icon.png"
Resize-Image 32 32 "public\favicon.png"
Copy-Item "public\favicon.png" "public\favicon.ico" -Force
Write-Host "Generated public\favicon.ico"

$srcImage.Dispose()
Write-Host "All PWA icons generated successfully!"
