# ElevenLabs MCP Server Setup Script for Windows
# Usage: .\setup.ps1 -ApiKey "YOUR_ELEVENLABS_API_KEY"
# Installs with 'user' scope (available in all your projects)

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$ErrorActionPreference = "Stop"

Write-Host "ElevenLabs MCP Server Setup" -ForegroundColor Blue
Write-Host ""

# Check Node.js version
Write-Host "Checking requirements..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v 2>&1
    if ($nodeVersion -match "v(\d+)") {
        $major = [int]$Matches[1]
        if ($major -lt 18) {
            Write-Host "Node.js 18+ is required. Found: $nodeVersion" -ForegroundColor Red
            exit 1
        }
        Write-Host "Node.js $nodeVersion found" -ForegroundColor Green
    }
} catch {
    Write-Host "Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Download it at: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    npm --version | Out-Null
    Write-Host "npm found" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check Claude Code CLI
try {
    claude --version 2>&1 | Out-Null
    Write-Host "Claude Code CLI found" -ForegroundColor Green
} catch {
    Write-Host "Claude Code CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
    exit 1
}

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $scriptDir "dist" "index.js"

# Install dependencies and build
Write-Host ""
Write-Host "Installing dependencies and building..." -ForegroundColor Yellow
Push-Location $scriptDir
npm install --quiet

# Verify build output exists
if (-not (Test-Path $serverPath)) {
    Write-Host "Building server..." -ForegroundColor Yellow
    npm run build
}

Pop-Location

if (-not (Test-Path $serverPath)) {
    Write-Host "Build failed - dist/index.js not found" -ForegroundColor Red
    exit 1
}
Write-Host "Server built successfully" -ForegroundColor Green

# Remove any existing MCP configuration
Write-Host ""
Write-Host "Configuring Claude Code..." -ForegroundColor Yellow
try {
    claude mcp remove ElevenLabs 2>$null
} catch {
    # Ignore if not exists
}

# Add MCP server with user scope and API key as environment variable
claude mcp add -s user ElevenLabs -e "ELEVENLABS_API_KEY=$ApiKey" -- node $serverPath

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use ElevenLabs in Claude Code from any directory!" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Restart Claude Code for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "Available tools:" -ForegroundColor White
Write-Host "  - text_to_speech         - Convert text to natural speech" -ForegroundColor Gray
Write-Host "  - sound_effects          - Generate sound effects from text" -ForegroundColor Gray
Write-Host "  - generate_music         - Generate music from text" -ForegroundColor Gray
Write-Host "  - list_voices            - Browse available voices" -ForegroundColor Gray
Write-Host "  - clone_voice            - Clone a voice from audio samples" -ForegroundColor Gray
Write-Host "  - speech_to_speech       - Transform audio to a different voice" -ForegroundColor Gray
Write-Host "  - transcribe             - Speech to text (90+ languages)" -ForegroundColor Gray
Write-Host "  - voice_isolation        - Isolate vocals from background noise" -ForegroundColor Gray
