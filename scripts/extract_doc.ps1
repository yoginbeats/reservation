Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxPath = 'd:\JILWC48\Superlines2026.docx'
$outputPath = 'd:\reservationandticketingsystem\paper.md'

$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.GetEntry('word/document.xml')
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

[xml]$doc = $xmlContent
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')

$paragraphs = $doc.SelectNodes('//w:p', $ns)
$lines = [System.Collections.Generic.List[string]]::new()
foreach ($p in $paragraphs) {
    $nodes = $p.SelectNodes('.//w:t', $ns)
    $text = ''
    if ($nodes) {
        foreach ($node in $nodes) {
            $text += $node.InnerText
        }
    }
    $lines.Add($text)
}

[System.IO.File]::WriteAllLines($outputPath, $lines, [System.Text.Encoding]::UTF8)
Write-Host "Success! Extracted $($lines.Count) lines."
