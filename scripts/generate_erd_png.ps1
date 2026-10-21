Add-Type -AssemblyName System.Drawing

$width = 2500
$height = 1800
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bitmap)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 19, 22))
[void]$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# Colors & Brushes
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 189, 248))
$amberBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(251, 191, 36))
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(52, 211, 153))
$purpleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(192, 132, 252))
$grayTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(161, 161, 170))
$darkGrayTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 120, 130))

$tableHeaderBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 30, 36))
$tableBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22, 24, 29))
$rowAltBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, 28, 34))
$highlightRowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 38, 46))

$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(82, 82, 91), 2)
$innerLinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45, 48, 56), 1.5)
$relationPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 155, 170), 2.5)
$tellerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(52, 211, 153), 2.2) # Emerald for teller
$conductorPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(251, 191, 36), 2.2) # Amber for conductor

# Fonts
$titleFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
$tableHeaderFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
$typeFont = New-Object System.Drawing.Font("Consolas", 11, [System.Drawing.FontStyle]::Regular)
$nameFont = New-Object System.Drawing.Font("Consolas", 12.5, [System.Drawing.FontStyle]::Bold)
$keyFont = New-Object System.Drawing.Font("Consolas", 10.5, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)

# Title Block
[void]$g.DrawString("SUPERLINES TICKETING & RESERVATION SYSTEM", $titleFont, $whiteBrush, 80, 45)
[void]$g.DrawString("UPDATED RELATIONAL DATABASE ENTITY-RELATIONSHIP DIAGRAM (ERD)", $subtitleFont, $cyanBrush, 80, 88)
[void]$g.DrawString("Supabase PostgreSQL | Centralized Admin, Teller, Conductor & Passenger Architecture", $subtitleFont, $grayTextBrush, 80, 112)

# Helper function to draw table
function Draw-Table {
    param(
        [string]$name,
        [float]$x,
        [float]$y,
        [float]$w,
        [array]$columns,
        [System.Drawing.Brush]$accentBrush
    )

    $headerH = 46.0
    $rowH = 34.0
    $totalH = $headerH + ($columns.Count * $rowH)

    # Box shadow effect
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(8, 0, 0, 0))
    [void]$g.FillRectangle($shadowBrush, [float]($x + 6), [float]($y + 6), [float]$w, [float]$totalH)

    # Main Card background
    [void]$g.FillRectangle($tableBgBrush, [float]$x, [float]$y, [float]$w, [float]$totalH)

    # Header fill
    [void]$g.FillRectangle($tableHeaderBrush, [float]$x, [float]$y, [float]$w, [float]$headerH)

    # Top accent line
    $accentPen = New-Object System.Drawing.Pen($accentBrush, 4)
    [void]$g.DrawLine($accentPen, [float]$x, [float]$y, [float]($x + $w), [float]$y)

    # Header Title
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $headerRect = New-Object System.Drawing.RectangleF([float]$x, [float]$y, [float]$w, [float]$headerH)
    [void]$g.DrawString($name.ToUpper(), $tableHeaderFont, $whiteBrush, $headerRect, $sf)

    # Header bottom line
    [void]$g.DrawLine($borderPen, [float]$x, [float]($y + $headerH), [float]($x + $w), [float]($y + $headerH))

    # Column divisions (Type: 135px, Name: 175px, Key: remaining width)
    $colTypeW = 135.0
    $colNameW = 175.0
    $colKeyW  = [float]($w - $colTypeW - $colNameW)

    $col1X = [float]$x
    $col2X = [float]($x + $colTypeW)
    $col3X = [float]($col2X + $colNameW)

    # Draw Rows
    for ($i = 0; $i -lt $columns.Count; $i++) {
        $curY = [float]($y + $headerH + ($i * $rowH))
        $col = $columns[$i]

        # Row zebra
        if ($i % 2 -eq 1) {
            [void]$g.FillRectangle($rowAltBrush, [float]$x, [float]$curY, [float]$w, [float]$rowH)
        }
        if ($col.Key -like "*PK*") {
            [void]$g.FillRectangle($highlightRowBrush, [float]$x, [float]$curY, [float]$w, [float]$rowH)
        }

        # Horizontal separator
        if ($i -gt 0) {
            [void]$g.DrawLine($innerLinePen, [float]$x, [float]$curY, [float]($x + $w), [float]$curY)
        }

        # Column vertical dividers
        [void]$g.DrawLine($innerLinePen, [float]$col2X, [float]$curY, [float]$col2X, [float]($curY + $rowH))
        [void]$g.DrawLine($innerLinePen, [float]$col3X, [float]$curY, [float]$col3X, [float]($curY + $rowH))

        # Draw Type (Col 1)
        $typeRect = New-Object System.Drawing.RectangleF([float]($col1X + 8), [float]($curY + 7), [float]($colTypeW - 12), [float]$rowH)
        [void]$g.DrawString($col.Type, $typeFont, $cyanBrush, $typeRect)

        # Draw Name (Col 2)
        $nameRect = New-Object System.Drawing.RectangleF([float]($col2X + 8), [float]($curY + 6), [float]($colNameW - 12), [float]$rowH)
        [void]$g.DrawString($col.Name, $nameFont, $whiteBrush, $nameRect)

        # Draw Key / Constraint (Col 3)
        $keyRect = New-Object System.Drawing.RectangleF([float]($col3X + 8), [float]($curY + 7), [float]($colKeyW - 12), [float]$rowH)
        $keyBrush = if ($col.Key -eq "PK") { $amberBrush } elseif ($col.Key -like "*FK*") { $purpleBrush } else { $darkGrayTextBrush }
        [void]$g.DrawString($col.Key, $keyFont, $keyBrush, $keyRect)
    }

    # Outer border
    [void]$g.DrawRectangle($borderPen, [float]$x, [float]$y, [float]$w, [float]$totalH)

    $res = @{
        X = $x; Y = $y; W = $w; H = $totalH;
        TopMid = @{ X = ($x + ($w / 2.0)); Y = $y };
        BottomMid = @{ X = ($x + ($w / 2.0)); Y = ($y + $totalH) };
        LeftMid = @{ X = $x; Y = ($y + ($totalH / 2.0)) };
        RightMid = @{ X = ($x + $w); Y = ($y + ($totalH / 2.0)) };
    }
    return $res
}

# Helper to draw connector lines with labels
function Draw-Relation {
    param(
        [hashtable]$from,
        [hashtable]$to,
        [string]$label,
        [object[]]$waypoints = @(),
        [hashtable]$labelPos = $null,
        [System.Drawing.Pen]$customPen = $null
    )

    $usePen = if ($customPen) { $customPen } else { $relationPen }

    $points = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    $points.Add((New-Object System.Drawing.PointF([float]$from.X, [float]$from.Y)))
    if ($waypoints) {
        foreach ($item in $waypoints) {
            if ($item -is [System.Collections.IDictionary]) {
                $points.Add((New-Object System.Drawing.PointF([float]$item.X, [float]$item.Y)))
            } elseif ($item -is [System.Collections.IEnumerable]) {
                foreach ($sub in $item) {
                    if ($sub -is [System.Collections.IDictionary]) {
                        $points.Add((New-Object System.Drawing.PointF([float]$sub.X, [float]$sub.Y)))
                    }
                }
            }
        }
    }
    $points.Add((New-Object System.Drawing.PointF([float]$to.X, [float]$to.Y)))

    # Draw lines
    for ($i = 0; $i -lt $points.Count - 1; $i++) {
        [void]$g.DrawLine($usePen, $points[$i], $points[$i+1])
    }

    # Target point circle
    $lastP = $points[$points.Count - 1]
    $radius = 6.0
    [void]$g.FillEllipse($tableHeaderBrush, [float]($lastP.X - $radius), [float]($lastP.Y - $radius), [float]($radius * 2), [float]($radius * 2))
    [void]$g.DrawEllipse($usePen, [float]($lastP.X - $radius), [float]($lastP.Y - $radius), [float]($radius * 2), [float]($radius * 2))

    # Start point ring
    $firstP = $points[0]
    [void]$g.FillEllipse($tableHeaderBrush, [float]($firstP.X - 5), [float]($firstP.Y - 5), 10.0, 10.0)
    [void]$g.DrawEllipse($usePen, [float]($firstP.X - 5), [float]($firstP.Y - 5), 10.0, 10.0)

    # Draw relation label pill
    if ($label) {
        $midX = [float](($firstP.X + $lastP.X) / 2.0)
        $midY = [float](($firstP.Y + $lastP.Y) / 2.0)
        if ($labelPos) {
            $midX = [float]$labelPos.X
            $midY = [float]$labelPos.Y
        } elseif ($points.Count -gt 2) {
            $midX = [float]$points[1].X
            $midY = [float]$points[1].Y
        }

        $labelSize = $g.MeasureString($label, $labelFont)
        $padX = 14.0; $padY = 6.0
        $pillW = [float]($labelSize.Width + $padX * 2.0)
        $pillH = [float]($labelSize.Height + $padY * 2.0)
        $pillX = [float]($midX - ($pillW / 2.0))
        $pillY = [float]($midY - ($pillH / 2.0))

        $pillBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(25, 27, 33))
        $pillBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 95, 105), 1.5)

        [void]$g.FillRectangle($pillBgBrush, $pillX, $pillY, $pillW, $pillH)
        [void]$g.DrawRectangle($pillBorderPen, $pillX, $pillY, $pillW, $pillH)

        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $labelRect = New-Object System.Drawing.RectangleF($pillX, $pillY, $pillW, $pillH)
        [void]$g.DrawString($label, $labelFont, $whiteBrush, $labelRect, $sf)
    }
}

# -------------------------------------------------------------
# TABLE DEFINITIONS (INCLUDING TELLER & CONDUCTOR ROLES)
# -------------------------------------------------------------

# 1. BUSES (Top Center-Right)
$busesCols = @(
    @{ Type = "uuid"; Name = "id"; Key = "PK" },
    @{ Type = "text"; Name = "bus_number"; Key = "UNIQUE" },
    @{ Type = "int"; Name = "capacity"; Key = "41, 43, 49" },
    @{ Type = "text"; Name = "bus_type"; Key = "AIRCON / DELUXE" }
)
$buses = Draw-Table "BUSES" 1420 150 540 $busesCols $cyanBrush

# 2. TRIPS (Directly Below BUSES)
$tripsCols = @(
    @{ Type = "uuid"; Name = "id"; Key = "PK" },
    @{ Type = "uuid"; Name = "bus_id"; Key = "FK -> BUSES.id" },
    @{ Type = "text"; Name = "origin"; Key = "Daet / Cubao / PITX" },
    @{ Type = "text"; Name = "destination"; Key = "Daet / Cubao / PITX" },
    @{ Type = "timestamptz"; Name = "departure_time"; Key = "NOT NULL" },
    @{ Type = "decimal"; Name = "price"; Key = "850.00 - 1100.00" }
)
$trips = Draw-Table "TRIPS" 1390 460 600 $tripsCols $cyanBrush

# 3. PROFILES (Middle Left)
$profilesCols = @(
    @{ Type = "uuid"; Name = "id"; Key = "PK (auth.users)" },
    @{ Type = "text"; Name = "full_name"; Key = "NOT NULL" },
    @{ Type = "text"; Name = "email"; Key = "UNIQUE" },
    @{ Type = "text"; Name = "phone"; Key = "09XXXXXXXXX" },
    @{ Type = "timestamptz"; Name = "created_at"; Key = "NOW()" }
)
$profiles = Draw-Table "PROFILES" 100 460 620 $profilesCols $greenBrush

# 4. USER_ROLES (Directly Below PROFILES with ALL 4 ROLES)
$rolesCols = @(
    @{ Type = "uuid"; Name = "id"; Key = "PK" },
    @{ Type = "uuid"; Name = "user_id"; Key = "FK (auth.users)" },
    @{ Type = "text"; Name = "role"; Key = "ADMIN, TELLER, CONDUCTOR, CLIENT" },
    @{ Type = "uuid"; Name = "terminal_id"; Key = "FK (Assigned Station for Teller)" }
)
$userRoles = Draw-Table "USER_ROLES" 100 850 640 $rolesCols $greenBrush

# 5. RESERVATIONS (Central Ledger with Teller & Online Attributes)
$resCols = @(
    @{ Type = "uuid"; Name = "id"; Key = "PK" },
    @{ Type = "uuid"; Name = "customer_id"; Key = "FK (auth.users)" },
    @{ Type = "uuid"; Name = "trip_id"; Key = "FK -> TRIPS.id" },
    @{ Type = "uuid"; Name = "created_by"; Key = "FK (Teller ID or Passenger ID)" },
    @{ Type = "text"; Name = "booking_source"; Key = "ONLINE (GCash) / WALK_IN (Teller)" },
    @{ Type = "text"; Name = "seat_number"; Key = "#01 - #49" },
    @{ Type = "text"; Name = "passenger_name"; Key = "NOT NULL" },
    @{ Type = "decimal"; Name = "total_price"; Key = "NET FARE" },
    @{ Type = "text"; Name = "status"; Key = "CONFIRMED / PENDING" }
)
$reservations = Draw-Table "RESERVATIONS" 1360 810 680 $resCols $purpleBrush

# 6. TICKETS (Bottom Left of Center with Conductor Verification)
$ticketsCols = @(
    @{ Type = "uuid"; Name = "id"; Key = "PK" },
    @{ Type = "uuid"; Name = "reservation_id"; Key = "FK (UNIQUE)" },
    @{ Type = "text"; Name = "qr_code"; Key = "UNIQUE (QR Boarding Token)" },
    @{ Type = "uuid"; Name = "verified_by"; Key = "FK -> Conductor ID" },
    @{ Type = "timestamptz"; Name = "verified_at"; Key = "Onboard Boarding Check" },
    @{ Type = "text"; Name = "status"; Key = "VALID / BOARDED / USED" }
)
$tickets = Draw-Table "TICKETS" 1020 1340 600 $ticketsCols $amberBrush

# 7. PAYMENTS (Bottom Right of Center)
$paymentsCols = @(
    @{ Type = "uuid"; Name = "id"; Key = "PK" },
    @{ Type = "uuid"; Name = "reservation_id"; Key = "FK" },
    @{ Type = "decimal"; Name = "amount"; Key = "NOT NULL" },
    @{ Type = "text"; Name = "payment_method"; Key = "GCash (Online) / Cash (Teller)" },
    @{ Type = "text"; Name = "status"; Key = "PAID / PENDING / REFUNDED" },
    @{ Type = "text"; Name = "transaction_id"; Key = "GCASH-REF / POS-TX" }
)
$payments = Draw-Table "PAYMENTS" 1680 1340 600 $paymentsCols $amberBrush


# -------------------------------------------------------------
# RELATIONSHIP CONNECTORS
# -------------------------------------------------------------

# BUSES -> TRIPS ("assigned to") - Straight vertical
Draw-Relation $buses.BottomMid $trips.TopMid "assigned to"

# PROFILES -> USER_ROLES ("has role") - Straight vertical
Draw-Relation $profiles.BottomMid $userRoles.TopMid "has role"

# PROFILES -> RESERVATIONS ("makes (online)")
$profRight = @{ X = [float]($profiles.X + $profiles.W); Y = [float]($profiles.Y + 70.0) }
$resLeft1  = @{ X = [float]$reservations.X; Y = [float]($reservations.Y + 50.0) }
$makesWP1  = @{ X = 960.0; Y = [float]$profRight.Y }
$makesWP2  = @{ X = 960.0; Y = [float]$resLeft1.Y }
$makesLabelPos = @{ X = 960.0; Y = [float](($profRight.Y + $resLeft1.Y) / 2.0) }
Draw-Relation $profRight $resLeft1 "makes (online)" -waypoints @($makesWP1, $makesWP2) -labelPos $makesLabelPos

# USER_ROLES -> RESERVATIONS ("teller issues walk-in")
$rolesRight = @{ X = [float]($userRoles.X + $userRoles.W); Y = [float]($userRoles.Y + 60.0) }
$resLeft2   = @{ X = [float]$reservations.X; Y = [float]($reservations.Y + 140.0) }
$tellerWP1  = @{ X = 1040.0; Y = [float]$rolesRight.Y }
$tellerWP2  = @{ X = 1040.0; Y = [float]$resLeft2.Y }
$tellerLabelPos = @{ X = 1040.0; Y = [float](($rolesRight.Y + $resLeft2.Y) / 2.0) }
Draw-Relation $rolesRight $resLeft2 "teller issues (walk-in)" -waypoints @($tellerWP1, $tellerWP2) -labelPos $tellerLabelPos -customPen $tellerPen

# USER_ROLES -> TICKETS ("conductor verifies / boards")
$rolesBottom = @{ X = [float]($userRoles.X + ($userRoles.W * 0.70)); Y = [float]($userRoles.Y + $userRoles.H) }
$tickLeft    = @{ X = [float]$tickets.X; Y = [float]($tickets.Y + 60.0) }
$condWP1     = @{ X = [float]$rolesBottom.X; Y = [float]$tickLeft.Y }
$condLabelPos = @{ X = [float](($rolesBottom.X + $tickLeft.X) / 2.0); Y = [float]$tickLeft.Y }
Draw-Relation $rolesBottom $tickLeft "conductor verifies (boarded)" -waypoints @($condWP1) -labelPos $condLabelPos -customPen $conductorPen

# TRIPS -> RESERVATIONS ("has") - Straight vertical
$hasMidY = [float](($trips.BottomMid.Y + $reservations.TopMid.Y) / 2.0)
$hasLabelPos = @{ X = [float]$trips.BottomMid.X; Y = $hasMidY }
Draw-Relation $trips.BottomMid $reservations.TopMid "has" -labelPos $hasLabelPos

# RESERVATIONS -> TICKETS ("generates") - Down-left
$resBottomY = [float]($reservations.Y + $reservations.H)
$tickStart = @{ X = [float]($reservations.X + 160.0); Y = $resBottomY }
Draw-Relation $tickStart $tickets.TopMid "generates"

# RESERVATIONS -> PAYMENTS ("requires") - Down-right
$payStart = @{ X = [float]($reservations.X + $reservations.W - 160.0); Y = $resBottomY }
Draw-Relation $payStart $payments.TopMid "requires"


# -------------------------------------------------------------
# SAVE PNG TO BOTH ARTIFACT & PUBLIC DIRECTORY
# -------------------------------------------------------------

$artifactPath = "C:\Users\magop\.gemini\antigravity-ide\brain\0665fde9-cd96-4956-be21-d700a31c053b\system_erd_updated.png"
$publicPath = "D:\reservationandticketingsystem\public\system_erd.png"

$bitmap.Save($artifactPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Save($publicPath, [System.Drawing.Imaging.ImageFormat]::Png)

Write-Output "SUCCESS: Generated ERD PNG at $publicPath and $artifactPath"
