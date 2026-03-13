param(
  [string]$Root = (Get-Location).Path
)

$directories = @(
  "shared/src",
  "server/prisma",
  "server/src/common",
  "server/src/config",
  "server/src/constants",
  "server/src/lib",
  "server/src/middleware",
  "server/src/modules/admin",
  "server/src/modules/auth",
  "server/src/modules/bookings",
  "server/src/modules/listings",
  "server/src/modules/payments",
  "server/src/modules/reviews",
  "server/src/modules/upload",
  "server/src/routes",
  "server/src/types"
)

foreach ($directory in $directories) {
  $path = Join-Path $Root $directory
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
}

Write-Output "Dreamboat backend folders created under $Root"
