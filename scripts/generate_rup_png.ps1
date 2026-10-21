Add-Type -AssemblyName System.Drawing

$width = 2600
$height = 1440
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bitmap)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background: Crisp Canvas White
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
[void]$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# Brushes
$titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))     # Slate 900
$subtitleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105)) # Slate 600
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$cardBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(65, 78, 98))     # Rich Slate
$cardBorderBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(51, 65, 85)) # Slate 700
$phaseBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(140, 155, 175)) # Slate 400

# Pens
$containerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(215, 222, 232), 2.5) # Soft border
$arrowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(71, 85, 105), 3.0)
$arrowHeadBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(71, 85, 105))

# Fonts
$titleFont = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Regular)
$phaseFont = New-Object System.Drawing.Font("Segoe UI", 17, [System.Drawing.FontStyle]::Bold)
$cardFont = New-Object System.Drawing.Font("Segoe UI", 15.5, [System.Drawing.FontStyle]::Bold)

# Helper function to create rounded rectangle path
function Get-RoundedRectPath {
    param(
        [float]$x,
        [float]$y,
        [float]$w,
        [float]$h,
        [float]$r
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2.0
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc([float]($x + $w - $d), $y, $d, $d, 270, 90)
    $path.AddArc([float]($x + $w - $d), [float]($y + $h - $d), $d, $d, 0, 90)
    $path.AddArc($x, [float]($y + $h - $d), $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

# Helper to draw rounded rectangle
function Draw-RoundedRect {
    param(
        [float]$x,
        [float]$y,
        [float]$w,
        [float]$h,
        [float]$r,
        [System.Drawing.Brush]$fillBrush,
        [System.Drawing.Pen]$strokePen = $null
    )
    $path = Get-RoundedRectPath $x $y $w $h $r
    if ($fillBrush) {
        [void]$g.FillPath($fillBrush, $path)
    }
    if ($strokePen) {
        [void]$g.DrawPath($strokePen, $path)
    }
    $path.Dispose()
}

# Helper to draw clean arrow
function Draw-Arrow {
    param(
        [float]$x1,
        [float]$y1,
        [float]$x2,
        [float]$y2
    )
    [void]$g.DrawLine($arrowPen, $x1, $y1, $x2, $y2)
    
    # Arrow head
    $headLen = 14.0
    $headWidth = 8.0
    $p1 = New-Object System.Drawing.PointF($x2, $y2)
    $p2 = New-Object System.Drawing.PointF([float]($x2 - $headLen), [float]($y2 - $headWidth))
    $p3 = New-Object System.Drawing.PointF([float]($x2 - $headLen), [float]($y2 + $headWidth))
    [void]$g.FillPolygon($arrowHeadBrush, @($p1, $p2, $p3))
}

# 1. Main Title Header (Centered at top)
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

$titleRect = New-Object System.Drawing.RectangleF(0, 50, $width, 50)
[void]$g.DrawString("RATIONAL UNIFIED PROCESS (RUP)", $titleFont, $titleBrush, $titleRect, $sfCenter)

$subtitleRect = New-Object System.Drawing.RectangleF(0, 105, $width, 35)
[void]$g.DrawString("Superlines Bus Ticketing & Reservation System - Software Development Methodology", $subtitleFont, $subtitleBrush, $subtitleRect, $sfCenter)

# 2. Main Outer Card Container
$boxX = 90.0
$boxY = 160.0
$boxW = 2420.0
$boxH = 1200.0
$boxR = 24.0

# Container shadow
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(12, 0, 0, 0))
$shadowPath = Get-RoundedRectPath ($boxX + 5) ($boxY + 5) $boxW $boxH $boxR
[void]$g.FillPath($shadowBrush, $shadowPath)
$shadowPath.Dispose()

# Container background & border
Draw-RoundedRect $boxX $boxY $boxW $boxH $boxR $whiteBrush $containerPen

# 3. Columns & Phase Layout
$colCount = 4
$colW = 510.0
$spacing = [float](($boxW - 160.0 - ($colCount * $colW)) / ($colCount - 1))
$startX = [float]($boxX + 80.0)

$phases = @(
    @{
        Title = "Inception";
        Cards = @(
            "Identify Scope and Requirements",
            "Problem Analysis",
            "Feasibility",
            "Requirements Gathering"
        )
    },
    @{
        Title = "Elaboration";
        Cards = @(
            "System Design and Architecture",
            "UI/UX Design",
            "Database Design",
            "System Modeling",
            "Prototyping"
        )
    },
    @{
        Title = "Construction";
        Cards = @(
            "System Build and Development",
            "Coding",
            "Integration",
            "Feature Dev",
            "Testing"
        )
    },
    @{
        Title = "Transition";
        Cards = @(
            "Deployment and Release",
            "System Testing",
            "User Training",
            "Deployment",
            "Maintenance"
        )
    }
)

# Top Phase Pills Y
$phaseY = [float]($boxY + 60.0)
$phaseH = 75.0
$phaseR = 36.0

# Top Arrow Y
$arrowY = [float]($phaseY + ($phaseH / 2.0))

for ($c = 0; $c -lt $colCount; $c++) {
    $curX = [float]($startX + ($c * ($colW + $spacing)))
    $phase = $phases[$c]

    # Draw Phase Header Pill
    Draw-RoundedRect $curX $phaseY $colW $phaseH $phaseR $phaseBgBrush $null

    # Phase Text
    $phaseRect = New-Object System.Drawing.RectangleF($curX, $phaseY, $colW, $phaseH)
    [void]$g.DrawString($phase.Title, $phaseFont, $whiteBrush, $phaseRect, $sfCenter)

    # Draw connecting arrow to next phase
    if ($c -lt $colCount - 1) {
        $arrowStartX = [float]($curX + $colW + 16.0)
        $arrowEndX = [float]($curX + $colW + $spacing - 16.0)
        Draw-Arrow $arrowStartX $arrowY $arrowEndX $arrowY
    }

    # Draw Vertical Cards under this phase
    $startYCards = [float]($phaseY + $phaseH + 50.0)
    $cardH = 150.0
    $cardGap = 40.0
    $cardR = 24.0

    for ($row = 0; $row -lt $phase.Cards.Count; $row++) {
        $cardY = [float]($startYCards + ($row * ($cardH + $cardGap)))
        $cardText = $phase.Cards[$row]

        # Draw Card Rounded Rectangle
        Draw-RoundedRect $curX $cardY $colW $cardH $cardR $cardBgBrush $null

        # Draw Text inside Card (multi-line supported, vertically centered)
        $cardTextRect = New-Object System.Drawing.RectangleF([float]($curX + 25.0), [float]($cardY + 12.0), [float]($colW - 50.0), [float]($cardH - 24.0))
        [void]$g.DrawString($cardText, $cardFont, $whiteBrush, $cardTextRect, $sfCenter)
    }
}

# Output file paths
$publicPath = "D:\reservationandticketingsystem\public\system_rup.png"
$artifactPath = "C:\Users\magop\.gemini\antigravity-ide\brain\0665fde9-cd96-4956-be21-d700a31c053b\system_rup.png"

$bitmap.Save($publicPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Save($artifactPath, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "SUCCESS: Generated RUP PNG at $publicPath and $artifactPath"
