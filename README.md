# ElevenLabs MCP Server for Claude Code

An MCP (Model Context Protocol) server that provides ElevenLabs AI audio capabilities to Claude Code. Industry-leading text-to-speech, sound effects, music generation, voice cloning, transcription, and more.

## Features

| Tool | Description |
|------|-------------|
| `text_to_speech` | Convert text to natural speech with 29+ languages and voice controls |
| `sound_effects` | Generate sound effects from text descriptions |
| `generate_music` | Generate studio-grade music from text descriptions |
| `list_voices` | Browse and search available voices |
| `clone_voice` | Create instant voice clones from audio samples |
| `speech_to_speech` | Transform audio to use a different voice |
| `transcribe` | Speech-to-text with speaker diarization (90+ languages) |
| `voice_isolation` | Isolate vocals from background noise |

## Getting Your API Key

1. Go to [elevenlabs.io](https://elevenlabs.io) and create an account
2. Click your profile icon → **API Keys**
3. Create a new API key
4. Copy the key for setup below

## Quick Setup

### Windows (PowerShell)

```powershell
.\setup.ps1 -ApiKey "YOUR_ELEVENLABS_API_KEY"
```

### macOS / Linux

```bash
chmod +x setup.sh
./setup.sh YOUR_ELEVENLABS_API_KEY
```

### Manual Setup

```bash
# Install dependencies and build
npm install

# Add to Claude Code
claude mcp add -s user ElevenLabs -e ELEVENLABS_API_KEY="YOUR_KEY" -- node "C:/path/to/dist/index.js"
```

Then restart Claude Code.

## Configuration

All configuration is via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ELEVENLABS_API_KEY` | Yes | — | Your ElevenLabs API key |
| `ELEVENLABS_DEFAULT_VOICE` | No | `Rachel` | Default voice name for TTS |
| `ELEVENLABS_OUTPUT_DIR` | No | `./generated-media` | Directory for saved audio files |
| `ELEVENLABS_TIMEOUT` | No | `120000` | API timeout in milliseconds |

## Usage Examples

### Text to Speech
> "elevenlabs tts: Hello world, this is a test"
> "elevenlabs speak with voice Adam: Welcome to the show"

### Sound Effects
> "elevenlabs sfx: thunder rumbling in the distance with rain"
> "elevenlabs sound effect: wooden door creaking open slowly"

### Music Generation
> "elevenlabs music: lo-fi hip hop beat with piano and soft drums"

### Voice Cloning
> "elevenlabs clone voice from my-recording.wav, name it MyVoice"

### Transcription
> "elevenlabs transcribe this audio file: recording.mp3"

### Voice Isolation
> "elevenlabs isolate vocals from noisy-recording.mp3"

## Available TTS Models

| Model | Languages | Speed | Best For |
|-------|-----------|-------|----------|
| `eleven_multilingual_v2` | 29 | Balanced | General use (default) |
| `eleven_v3` | 70+ | ~500ms | Latest quality, dramatic delivery |
| `eleven_turbo_v2_5` | 32 | ~250ms | Fast, balanced quality |
| `eleven_flash_v2_5` | 32 | ~75ms | Ultra-fast, real-time |

## Development

```bash
# Run in development mode (no build needed)
npm run dev

# Build
npm run build

# Start production
npm start
```

## License

MIT
