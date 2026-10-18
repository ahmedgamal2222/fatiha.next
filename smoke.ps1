$ErrorActionPreference = 'SilentlyContinue'
$root = 'F:\Fatiha-web'
$log = Join-Path $root '_smoke_dev.log'
$statusFile = Join-Path $root '_smoke_status.txt'

$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "npx next dev -p 3100 > `"$log`" 2>&1" -WorkingDirectory $root -PassThru -WindowStyle Hidden

$results = @()
$home = $null
for ($i = 0; $i -lt 100; $i++) {
  Start-Sleep -Seconds 2
  try {
    $home = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3100/' -TimeoutSec 15
    break
  } catch { }
}

if ($home) {
  $results += "HOME=OK status=$($home.StatusCode) len=$($home.Content.Length)"
  Set-Content -Path (Join-Path $root '_smoke_home.html') -Value $home.Content -Encoding UTF8
  foreach ($path in @('/al-qerat', '/login', '/fatiha-exam')) {
    try {
      $r = Invoke-WebRequest -UseBasicParsing -Uri ("http://localhost:3100" + $path) -TimeoutSec 60
      $results += "$path=OK status=$($r.StatusCode) len=$($r.Content.Length)"
    } catch {
      $results += "$path=ERR $($_.Exception.Message)"
    }
  }
} else {
  $results += 'HOME=ERR server not reachable'
}

Set-Content -Path $statusFile -Value $results -Encoding UTF8
try { taskkill /PID $p.Id /T /F | Out-Null } catch { }
