#!/bin/bash
# ElevenLabs MCP Server Setup Script
# Usage: ./setup.sh YOUR_ELEVENLABS_API_KEY
# Installs with 'user' scope (available in all your projects)

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${BLUE}ElevenLabs MCP Server Setup${NC}"
echo ""

# Check if API key was provided
API_KEY="$1"
if [ -z "$API_KEY" ]; then
    echo -e "${RED}Please provide your ElevenLabs API key${NC}"
    echo "Usage: ./setup.sh YOUR_ELEVENLABS_API_KEY"
    echo ""
    echo "Get an API key at: https://elevenlabs.io → Profile → API Keys"
    exit 1
fi

# Check Node.js version
echo "Checking requirements..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed.${NC}"
    echo "Download it at: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ is required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found${NC}"

# Check Claude Code
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Claude Code CLI not found. Please install it first:${NC}"
    echo "npm install -g @anthropic-ai/claude-code"
    exit 1
fi
echo -e "${GREEN}✓ Claude Code CLI found${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install dependencies and build
echo ""
echo "Installing dependencies and building..."
cd "$SCRIPT_DIR"
npm install --quiet

# Verify build output exists
if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo "Building server..."
    npm run build
fi

if [ ! -f "$SCRIPT_DIR/dist/index.js" ]; then
    echo -e "${RED}Build failed — dist/index.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server built successfully${NC}"

# Remove any existing MCP configuration
echo ""
echo "Configuring Claude Code..."
claude mcp remove ElevenLabs 2>/dev/null || true

# Add MCP server with user scope and API key as environment variable
claude mcp add -s user ElevenLabs -e "ELEVENLABS_API_KEY=$API_KEY" -- node "$SCRIPT_DIR/dist/index.js"

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "You can now use ElevenLabs in Claude Code from any directory!"
echo ""
echo -e "${YELLOW}IMPORTANT: Restart Claude Code for changes to take effect.${NC}"
echo ""
echo "Available tools:"
echo -e "${GRAY}  • text_to_speech         - Convert text to natural speech${NC}"
echo -e "${GRAY}  • sound_effects          - Generate sound effects from text${NC}"
echo -e "${GRAY}  • generate_music         - Generate music from text${NC}"
echo -e "${GRAY}  • list_voices            - Browse available voices${NC}"
echo -e "${GRAY}  • clone_voice            - Clone a voice from audio samples${NC}"
echo -e "${GRAY}  • speech_to_speech       - Transform audio to a different voice${NC}"
echo -e "${GRAY}  • transcribe             - Speech to text (90+ languages)${NC}"
echo -e "${GRAY}  • voice_isolation        - Isolate vocals from background noise${NC}"
