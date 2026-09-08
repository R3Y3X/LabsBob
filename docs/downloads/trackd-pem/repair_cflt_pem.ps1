# Normalize a TechZone OpenSSH PEM for Windows OpenSSH. Never prints the key.
# No python3. CRLF is the usual Windows paste failure; wrap 70 then 76 if needed.
param(
    [string]$PemPath = ""
)

$ErrorActionPreference = "Stop"

if (-not $PemPath) {
    $PemPath = Join-Path $PSScriptRoot "cflt-vsi-key.pem"
}

function Fail([string]$Message) {
    Write-Error "ERROR: $Message"
    exit 1
}

if (-not (Test-Path -LiteralPath $PemPath)) {
    Fail "no existe $PemPath — créalo con BEGIN/END, guárdalo (Ctrl+S) y no lo pegues en el chat."
}

$bytes = [System.IO.File]::ReadAllBytes($PemPath)
if ($bytes.Length -eq 0) {
    Fail "el PEM está vacío (0 bytes). Pega BEGIN→END, guarda el archivo y reintenta. No lo pegues en el chat."
}

$sshKeygen = $null
$bundled = Join-Path $env:WINDIR "System32\OpenSSH\ssh-keygen.exe"
if (Test-Path -LiteralPath $bundled) {
    $sshKeygen = $bundled
} else {
    $cmd = Get-Command ssh-keygen.exe -ErrorAction SilentlyContinue
    if ($cmd) { $sshKeygen = $cmd.Source }
}
if (-not $sshKeygen) {
    Fail "ssh-keygen.exe no está instalado. Usa OpenSSH de Windows (C:\Windows\System32\OpenSSH\). La extensión CCH es opcional."
}

$offset = 0
if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $offset = 3
}
$text = [System.Text.Encoding]::UTF8.GetString($bytes, $offset, $bytes.Length - $offset)
$text = $text -replace "`r`n", "`n" -replace "`r", "`n"
$lines = @()
foreach ($rawLine in $text.Split("`n")) {
    $line = $rawLine.Trim()
    if ($line) { $lines += $line }
}

$begin = "-----BEGIN OPENSSH PRIVATE KEY-----"
$end = "-----END OPENSSH PRIVATE KEY-----"
if ($lines.Count -lt 3 -or $lines[0] -ne $begin -or $lines[$lines.Count - 1] -ne $end) {
    Fail "el archivo no tiene el bloque BEGIN/END OPENSSH PRIVATE KEY completo."
}

$bodyLines = $lines[1..($lines.Count - 2)]
$body = ($bodyLines -join "").Replace(" ", "")
if (-not $body) {
    Fail "el cuerpo base64 del PEM está vacío."
}

function Write-WrappedPem([int]$Width) {
    $chunks = New-Object System.Collections.Generic.List[string]
    $chunks.Add($begin)
    for ($i = 0; $i -lt $body.Length; $i += $Width) {
        $len = [Math]::Min($Width, $body.Length - $i)
        $chunks.Add($body.Substring($i, $len))
    }
    $chunks.Add($end)
    $payload = ($chunks -join "`n") + "`n"
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($PemPath, $payload, $utf8)
}

function Restrict-PemAcl {
    & icacls $PemPath /inheritance:r /grant:r "${env:USERNAME}:F" | Out-Null
}

function Test-Pem {
    Restrict-PemAcl
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $out = & $sshKeygen -y -f $PemPath 2>$null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prevEap
    if ($code -ne 0 -or -not $out) { return $false }
    $kind = ($out | Select-Object -First 1).ToString().Trim().Split(" ")[0]
    if (-not $kind) { return $false }
    Write-Host "ok $kind"
    return $true
}

Write-WrappedPem 70
if (Test-Pem) { exit 0 }
Write-WrappedPem 76
if (Test-Pem) { exit 0 }
Fail "ssh-keygen sigue en invalid format. No regeneres la clave. Confirma BEGIN/END completos, guarda el archivo y reintenta."
