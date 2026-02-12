export interface Config {
  apiKey: string;
  defaultVoice: string;
  timeout: number;
  outputDir: string;
}

export const TTS_MODELS = [
  'eleven_v3',
  'eleven_multilingual_v2',
  'eleven_turbo_v2_5',
  'eleven_flash_v2_5',
] as const;

export const STS_MODELS = [
  'eleven_english_sts_v2',
] as const;

export const STT_MODELS = [
  'scribe_v2',
  'scribe_v1',
] as const;

export const SFX_MODELS = [
  'eleven_text_to_sound_v2',
] as const;

export const MUSIC_MODELS = [
  'eleven_music',
] as const;

export const OUTPUT_FORMATS = [
  'mp3_44100_128',
  'mp3_44100_192',
  'mp3_22050_32',
  'pcm_16000',
  'pcm_22050',
  'pcm_24000',
  'pcm_44100',
  'ulaw_8000',
  'alaw_8000',
] as const;

export function loadConfig(): Config {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ElevenLabs API key not configured. Please set the ELEVENLABS_API_KEY environment variable.\n' +
      'Get your API key at: https://elevenlabs.io → Profile → API Keys'
    );
  }

  const defaultVoice = process.env.ELEVENLABS_DEFAULT_VOICE || 'Rachel';
  const outputDir = process.env.ELEVENLABS_OUTPUT_DIR || './generated-media';

  const timeoutStr = process.env.ELEVENLABS_TIMEOUT;
  const timeout = timeoutStr ? parseInt(timeoutStr, 10) : 120000;

  if (timeout <= 0) {
    throw new Error('ELEVENLABS_TIMEOUT must be a positive number');
  }

  return {
    apiKey,
    defaultVoice,
    timeout,
    outputDir
  };
}
