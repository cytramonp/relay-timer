param(
  [Parameter(Mandatory=$true)][string]$UnsignedBundle,
  [Parameter(Mandatory=$true)][string]$OutputBundle,
  [Parameter(Mandatory=$true)][string]$KeyDirectory,
  [Parameter(Mandatory=$true)][string]$SourceRevision,
  [string]$JavaHome = $env:JAVA_HOME
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $UnsignedBundle)) { throw 'Unsigned input bundle is missing' }
if (Test-Path -LiteralPath $OutputBundle) { throw 'Output already exists; choose a new artifact path' }
if (-not (Test-Path -LiteralPath "$JavaHome/bin/jarsigner.exe")) { throw 'Set JavaHome to a trusted JDK containing jarsigner' }
$keyConfig = Get-Content -LiteralPath "$KeyDirectory/credentials.json" -Raw | ConvertFrom-Json
$env:CORPTIMER_LOCAL_STORE_PASSWORD = $keyConfig.storePassword
$env:CORPTIMER_LOCAL_KEY_PASSWORD = $keyConfig.keyPassword
try {
  Copy-Item -LiteralPath $UnsignedBundle -Destination $OutputBundle
  & "$JavaHome/bin/jarsigner.exe" -keystore "$KeyDirectory/upload-keystore.p12" -storetype PKCS12 -storepass:env CORPTIMER_LOCAL_STORE_PASSWORD -keypass:env CORPTIMER_LOCAL_KEY_PASSWORD -sigalg SHA256withRSA -digestalg SHA-256 $OutputBundle $keyConfig.alias
  if ($LASTEXITCODE -ne 0) { throw 'Bundle signing failed' }
  & "$JavaHome/bin/jarsigner.exe" -verify $OutputBundle
  if ($LASTEXITCODE -ne 0) { throw 'Bundle signature verification failed' }
  $certificate = & "$JavaHome/bin/keytool.exe" -printcert -jarfile $OutputBundle
  if ($LASTEXITCODE -ne 0 -or $certificate -match 'Android Debug') { throw 'Wrong or missing upload certificate' }
  if (($certificate -join "`n") -notmatch 'SHA256:\s*([A-Fa-f0-9:]+)') { throw 'Upload certificate fingerprint is missing' }
  $fingerprint = $Matches[1].Replace(':','').ToUpperInvariant()
  if ($fingerprint -ne 'BC2A570E7F8A08509ACDFB0F9756E395C3EDD091A1FB276030A76E1FE8430BB2') { throw 'Unexpected upload certificate fingerprint' }
  $report = @{
    sourceRevision = $SourceRevision
    version = '0.4.0'
    versionCode = 6
    signedLocally = $true
    privateKeyTransferred = $false
    unsignedSha256 = (Get-FileHash -LiteralPath $UnsignedBundle -Algorithm SHA256).Hash
    aabSha256 = (Get-FileHash -LiteralPath $OutputBundle -Algorithm SHA256).Hash
    uploadCertificateSha256 = $fingerprint
    playPurchasesEnabled = $false
    googleSignInConfigured = $false
    releaseScope = 'Internal testing preparation; publisher setup and live store tests pending'
  }
  $report | ConvertTo-Json | Set-Content -LiteralPath "$OutputBundle.build.json" -Encoding utf8
  Write-Output 'Signed AAB and public build report created. Private key stayed local.'
} finally {
  Remove-Item Env:CORPTIMER_LOCAL_STORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:CORPTIMER_LOCAL_KEY_PASSWORD -ErrorAction SilentlyContinue
  $keyConfig = $null
}
