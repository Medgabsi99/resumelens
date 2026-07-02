# tools/create-bucket.ps1
# Creates the 'pdfs' Supabase Storage bucket on a fresh environment.
# Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell (or .env.local),
#        then run:  .\tools\create-bucket.ps1

$Url = "$env:SUPABASE_URL/storage/v1/bucket"
$Key = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $Url -or -not $Key) {
    Write-Error "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as environment variables."
    exit 1
}

$Body    = @{ name = 'pdfs'; public = $true } | ConvertTo-Json
$Headers = @{ Authorization = "Bearer $Key" }

Invoke-RestMethod -Uri $Url -Method Post -Body $Body -Headers $Headers -ContentType 'application/json'
Write-Output 'Created bucket (or already existed)'
