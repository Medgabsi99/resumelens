$uri='http://localhost:3004/';
for ($i=0; $i -lt 60; $i++) {
  try {
    $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 2;
    if ($r.StatusCode -eq 200) { Write-Output 'UP'; break }
  } catch { Start-Sleep -s 1 }
}
$payload = @{ template='classic'; result='Sample resume text'; targetRole='Software Engineer'; jobDescription='Build apps'; resumeText='Experienced dev' } | ConvertTo-Json -Compress
Invoke-WebRequest -Uri 'http://localhost:3004/api/export-pdf' -Method POST -ContentType 'application/json' -Body $payload -OutFile export-test.pdf -UseBasicParsing
Write-Output 'Saved export-test.pdf'