$ErrorActionPreference = 'Stop'
$status = 'unknown'
try {
  $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3100/' -TimeoutSec 180
  $status = "STATUS=$($r.StatusCode) LEN=$($r.Content.Length)"
  Set-Content -Path 'F:\Fatiha-web\_home.html' -Value $r.Content -Encoding UTF8
} catch {
  $status = "ERR=$($_.Exception.Message)"
}
Set-Content -Path 'F:\Fatiha-web\_home_status.txt' -Value $status -Encoding UTF8
