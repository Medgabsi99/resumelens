$Url='https://ucyqobzlnuqmbagccdgn.supabase.co/storage/v1/bucket'
$Body = @{ name='pdfs'; public=$true } | ConvertTo-Json
$Headers = @{ Authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjeXFvYnpsbnVxbWJhZ2NjZGduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEzNTAyMSwiZXhwIjoyMDk0NzExMDIxfQ.l_a59utWkAU5EoTbpnyPWbdfxBpLBppcF-jv3W7-OFk' }
Invoke-RestMethod -Uri $Url -Method Post -Body $Body -Headers $Headers -ContentType 'application/json'
Write-Output 'Created bucket (or already existed)'
