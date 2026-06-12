$uri='http://localhost:3004/api/export-pdf';
$payload = @{ template='classic'; result=@{ score=88; summary='Great'; suggestions=@(); strengths=@(); weaknesses=@() }; targetRole='Software Engineer'; jobDescription='Build apps'; resumeText='Experienced dev' } | ConvertTo-Json -Compress
$r = Invoke-WebRequest -Uri $uri -Method POST -ContentType 'application/json' -Body $payload -UseBasicParsing
$contentType = $r.Headers['Content-Type']
if ($contentType -like 'application/json*') {
  $json = $r.Content | ConvertFrom-Json
  if ($json.success -and $json.url) {
    $out = 'exported-uploaded.pdf'
    Invoke-WebRequest -Uri $json.url -OutFile $out -UseBasicParsing
    Write-Output "Downloaded $out from $($json.url)"
  } else {
    Write-Output "JSON response but no url: $($r.Content)"
  }
} else {
  $out = 'exported-fallback.pdf'
  $r.RawContentStream.Position = 0
  $fs = [System.IO.File]::Create($out)
  $r.ContentStream.CopyTo($fs)
  $fs.Close()
  Write-Output "Saved PDF to $out (fallback)"
}