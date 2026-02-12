# ElevenLabs MCP Server

MCP server that brings ElevenLabs to Claude Code — text-to-speech, sound effects, music generation, voice cloning, speech-to-speech, transcription, and voice isolation. 8 tools for industry-leading AI audio. Supports Multilingual v2, v3, Turbo, Flash, and Scribe models.

## Quick Start

### Step 1: Get Your API Key

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Create an account or sign in
3. Click your profile icon → **API Keys**
4. Generate and copy the key (you'll need it in Step 3)

### Step 2: Install Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Claude Code CLI** - [Installation guide](https://docs.anthropic.com/claude-code)

### Step 3: Install the MCP Server

#### 3.1 Clone the repository

```text
git clone https://github.com/wynandw87/claude-code-elevenlabs-mcp.git
cd claude-code-elevenlabs-mcp
```

#### 3.2 Install dependencies

**macOS / Linux / Windows:**
```text
npm install
```

> **Note:** Dependencies are installed and the server is built automatically in one step.

#### 3.3 Register with Claude Code

Choose your install scope:

| Scope | Flag | Who can use it |
|-------|------|----------------|
| **User** (recommended) | `-s user` | You, in any project |
| **Project** | `-s project` | Anyone who clones this repo |
| **Local** | `-s local` | Only in current directory |

Replace `YOUR_API_KEY` with your actual ElevenLabs API key, and use the full path to `dist/index.js`.

> **Tip:** To get the full path, run this from the cloned directory:
> - macOS/Linux: `echo "$(pwd)/dist/index.js"`
> - Windows: `echo %cd%\dist\index.js`

**macOS / Linux:**
```text
claude mcp add -s user ElevenLabs -e ELEVENLABS_API_KEY=YOUR_API_KEY -- node /full/path/to/dist/index.js
```

**Windows (CMD):**
```text
claude mcp add -s user ElevenLabs -e "ELEVENLABS_API_KEY=YOUR_API_KEY" -- node "C:\full\path\to\dist\index.js"
```

**Windows (PowerShell):**
```text
claude mcp add -s user ElevenLabs -e "ELEVENLABS_API_KEY=YOUR_API_KEY" '--' node "C:\full\path\to\dist\index.js"
```

#### Alternative: Use Setup Scripts

The setup scripts handle dependency installation, building, and registration automatically.

**macOS / Linux:**
```text
chmod +x setup.sh
./setup.sh YOUR_API_KEY
```

**Windows (PowerShell):**
```text
.\setup.ps1 -ApiKey YOUR_API_KEY
```

**Or use the npm helper (if API key is set in environment):**
```text
export ELEVENLABS_API_KEY=YOUR_API_KEY
npm run install:claude
```

### Step 4: Restart Claude Code

Close and reopen Claude Code for the changes to take effect.

### Step 5: Verify Installation

```text
claude mcp list
```

You should see `ElevenLabs` listed with a Connected status.

---

## Features

### Speech Generation
- **Text-to-Speech** (`text_to_speech`) - Convert text to natural speech with voice/emotion controls and 29+ languages
- **Speech-to-Speech** (`speech_to_speech`) - Transform audio to use a different voice while preserving emotion and cadence

### Sound & Music
- **Sound Effects** (`sound_effects`) - Generate sound effects from text descriptions
- **Music Generation** (`generate_music`) - Generate studio-grade music from text descriptions

### Voice Management
- **List Voices** (`list_voices`) - Browse and search available voices with filtering
- **Clone Voice** (`clone_voice`) - Create instant voice clones from audio samples

### Audio Processing
- **Transcription** (`transcribe`) - Speech-to-text with speaker diarization (90+ languages)
- **Voice Isolation** (`voice_isolation`) - Isolate vocals from background noise

---

## Usage

Once installed, use trigger phrases to invoke ElevenLabs:

| Trigger | Tool | Example |
|---------|------|---------|
| `elevenlabs tts`, `elevenlabs speak` | Text-to-Speech | "elevenlabs speak: Hello, welcome to the demo" |
| `elevenlabs sfx`, `elevenlabs sound effect` | Sound Effects | "elevenlabs sfx: thunder rumbling in the distance" |
| `elevenlabs music`, `elevenlabs compose` | Generate Music | "elevenlabs music: lo-fi hip hop with soft piano" |
| `elevenlabs voices`, `elevenlabs list voices` | List Voices | "elevenlabs list voices matching female" |
| `elevenlabs clone`, `elevenlabs clone voice` | Clone Voice | "elevenlabs clone voice from recording.wav" |
| `elevenlabs voice change`, `elevenlabs sts` | Speech-to-Speech | "elevenlabs voice change audio.mp3 to Adam" |
| `elevenlabs transcribe`, `elevenlabs stt` | Transcribe | "elevenlabs transcribe meeting.mp3" |
| `elevenlabs isolate`, `elevenlabs clean audio` | Voice Isolation | "elevenlabs isolate vocals from noisy-recording.mp3" |

Or ask naturally:

- *"Use ElevenLabs to convert this text to speech with the Rachel voice"*
- *"Generate a sound effect of a spaceship engine starting up"*
- *"Create some lo-fi background music with ElevenLabs"*
- *"Show me the available ElevenLabs voices"*
- *"Clone a voice from my recording.wav file"*
- *"ElevenLabs transcribe this audio file"*
- *"Clean up the background noise in this recording with ElevenLabs"*

---

## Tool Reference

### text_to_speech

Convert text to natural speech. ElevenLabs' flagship feature with industry-leading quality.

**Parameters:**
- `text` (string, required) - The text to convert to speech
- `voice` (string, optional) - Voice name (e.g., "Rachel", "Adam") or voice ID (default: `Rachel`)
- `model` (string, optional) - TTS model (default: `eleven_multilingual_v2`)
- `stability` (number, optional) - Voice stability 0.0-1.0 (lower = more expressive)
- `similarity_boost` (number, optional) - Voice clarity 0.0-1.0 (higher = closer to original)
- `style` (number, optional) - Style exaggeration 0.0-1.0
- `speed` (number, optional) - Speech speed 0.25-4.0 (default: 1.0)
- `output_format` (string, optional) - Audio format (default: `mp3_44100_128`)
- `save_path` (string, optional) - File path to save the audio

### sound_effects

Generate sound effects from text descriptions.

**Parameters:**
- `text` (string, required) - Description of the sound effect (e.g., "wooden door creaking open slowly")
- `duration_seconds` (number, optional) - Duration 0.5-30 seconds (auto-determined if omitted)
- `prompt_influence` (number, optional) - How closely to follow the prompt 0.0-1.0 (default: 0.3)
- `save_path` (string, optional) - File path to save the audio

### generate_music

Generate studio-grade music from text descriptions.

**Parameters:**
- `text` (string, required) - Description of the music (e.g., "epic orchestral score for a movie trailer")
- `duration_seconds` (number, optional) - Duration 0.5-30 seconds (auto-determined if omitted)
- `save_path` (string, optional) - File path to save the audio

### list_voices

Browse and search available ElevenLabs voices.

**Parameters:**
- `search` (string, optional) - Search query to filter voices by name, description, or labels
- `category` (string, optional) - `"premade"`, `"cloned"`, `"generated"`, `"professional"`
- `page_size` (integer, optional) - Number of voices to return (default: 20, max: 100)

### clone_voice

Create an instant voice clone from audio samples. Requires 1-2 minutes of clear audio.

**Parameters:**
- `name` (string, required) - Name for the cloned voice
- `files` (string[], required) - Array of absolute paths to audio files
- `description` (string, optional) - Description of the voice
- `remove_background_noise` (boolean, optional) - Apply audio isolation to samples before cloning

### speech_to_speech

Transform audio to use a different voice while preserving emotion and cadence.

**Parameters:**
- `audio_path` (string, required) - Absolute path to the source audio file
- `voice` (string, required) - Target voice name or ID
- `model` (string, optional) - STS model (default: `eleven_english_sts_v2`)
- `stability` (number, optional) - Voice stability 0.0-1.0
- `similarity_boost` (number, optional) - Voice clarity 0.0-1.0
- `remove_background_noise` (boolean, optional) - Remove background noise from source
- `save_path` (string, optional) - File path to save the audio

### transcribe

Transcribe audio to text with optional speaker diarization. Supports 90+ languages.

**Parameters:**
- `audio_path` (string, required) - Absolute path to the audio file
- `model` (string, optional) - `"scribe_v2"` (default, 90+ languages), `"scribe_v1"`
- `language_code` (string, optional) - ISO 639-1 language code (e.g., "en", "es", "fr")
- `diarize` (boolean, optional) - Identify which speaker is talking
- `num_speakers` (integer, optional) - Expected number of speakers (up to 32)

### voice_isolation

Isolate vocals from background noise in audio files.

**Parameters:**
- `audio_path` (string, required) - Absolute path to the audio file to process
- `save_path` (string, optional) - File path to save the isolated audio

---

## Supported Models

### Text-to-Speech Models
| Model | Languages | Latency | Best For |
|-------|-----------|---------|----------|
| `eleven_multilingual_v2` | 29 | Balanced | Default — general use, voiceovers |
| `eleven_v3` | 70+ | ~500ms | Latest quality, dramatic delivery |
| `eleven_turbo_v2_5` | 32 | ~250ms | Fast, balanced quality |
| `eleven_flash_v2_5` | 32 | ~75ms | Ultra-fast, real-time apps |

### Speech-to-Speech Models
| Model | Best For |
|-------|----------|
| `eleven_english_sts_v2` | Default — English voice conversion |

### Transcription Models
| Model | Languages | Best For |
|-------|-----------|----------|
| `scribe_v2` | 90+ | Default — high accuracy with diarization |
| `scribe_v1` | Multiple | Previous generation |

### Sound Effects / Music Models
| Model | Best For |
|-------|----------|
| `eleven_text_to_sound_v2` | Sound effect generation |
| `eleven_music` | Music generation |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ELEVENLABS_API_KEY` | Yes | — | ElevenLabs API key |
| `ELEVENLABS_DEFAULT_VOICE` | No | `Rachel` | Default voice name for TTS |
| `ELEVENLABS_TIMEOUT` | No | `120000` | API timeout in ms |
| `ELEVENLABS_OUTPUT_DIR` | No | `./generated-media` | Directory for auto-saved audio |

---

## How It Works

This MCP server uses the official `@elevenlabs/elevenlabs-js` SDK to communicate with ElevenLabs models. It connects to Claude Code via stdio transport.

**Voice name resolution:** You can use voice names (e.g., "Rachel", "Adam") instead of voice IDs. The server resolves names automatically via a cached voice lookup.

**Tools provided:**
| Tool | API Endpoint | Default Model |
|------|-------------|---------------|
| `text_to_speech` | Text-to-Speech | `eleven_multilingual_v2` |
| `sound_effects` | Text-to-Sound-Effects | `eleven_text_to_sound_v2` |
| `generate_music` | Text-to-Sound-Effects | `eleven_music` |
| `list_voices` | Voices Search | — |
| `clone_voice` | Instant Voice Cloning | — |
| `speech_to_speech` | Speech-to-Speech | `eleven_english_sts_v2` |
| `transcribe` | Speech-to-Text | `scribe_v2` |
| `voice_isolation` | Audio Isolation | — |

---

## Development

```text
npm run build    # Build for production
npm start        # Start production server
```

## Troubleshooting

### Fix API Key

If you entered the wrong API key, remove and reinstall:

```text
claude mcp remove ElevenLabs
```

Then reinstall using the command from Step 3.3 above (use the same scope you originally installed with).

### MCP Server Not Showing Up

Check if the server is installed:

```text
claude mcp list
```

If not listed, follow Step 3 to install it.

### Server Won't Start

1. **Verify your API key** is valid at [elevenlabs.io](https://elevenlabs.io) → Profile → API Keys

2. **Check Node.js version** (needs 18+):
   ```text
   node --version
   ```

3. **Ensure the server was built:**
   ```text
   npm run build
   ```

### Connection Errors

1. **Check that `dist/index.js` exists** — if not, run `npm run build`
2. **Verify the path is absolute** in your `claude mcp add` command
3. **Restart Claude Code** after any configuration changes

### Timeout Errors

- Audio generation can be slower than text — the default timeout is 120 seconds
- Increase `ELEVENLABS_TIMEOUT` environment variable for slow connections

### View Current Configuration

```text
claude mcp list
```

---

## Contributing

Pull requests welcome! Please keep it simple and beginner-friendly.

## License

MIT

---

Made for the Claude Code community
