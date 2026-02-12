$ErrorActionPreference = 'SilentlyContinue'
$repo = 'C:\Users\Matt\.openclaw\workspace\superbowl'
$checkUrl = 'http://localhost:3000'

function Test-DevUp {
  try {
    $r = Invoke-WebRequest -Uri $checkUrl -UseBasicParsing -TimeoutSec 3
    return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
  } catch {
    return $false
  }
}

function Start-DevServer {
  Start-Process powershell -WindowStyle Minimized -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy','Bypass',
    '-Command',
    "cd '$repo'; npm run dev -- --webpack"
  ) | Out-Null
}

while ($true) {
  if (-not (Test-DevUp)) {
    Start-DevServer
    Start-Sleep -Seconds 8
  }
  Start-Sleep -Seconds 20
}
