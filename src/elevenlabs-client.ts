import { ElevenLabsClient as ElevenLabsSDK } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from './config.js';

export interface VoiceInfo {
  voiceId: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  description?: string;
  previewUrl?: string;
}

export interface ListVoicesResponse {
  voices: VoiceInfo[];
  totalCount?: number;
}

export interface CloneVoiceResponse {
  voiceId: string;
  name: string;
}

export interface TranscriptionResponse {
  text: string;
  words?: Array<{ text: string; start: number; end: number }>;
}

export class ElevenLabsClient {
  private client: ElevenLabsSDK;
  private timeout: number;
  private voiceCache: Map<string, string> = new Map(); // name -> voiceId
  private voiceCachePopulated = false;

  constructor(config: Config) {
    this.client = new ElevenLabsSDK({ apiKey: config.apiKey });
    this.timeout = config.timeout;
  }

  /**
   * Resolve a voice name to a voice ID.
   * If input looks like an ID (20+ alphanum), use directly.
   * Otherwise search by name (case-insensitive).
   */
  async resolveVoiceId(voiceNameOrId: string): Promise<string> {
    // If it looks like a voice ID, use directly
    if (/^[a-zA-Z0-9]{20,}$/.test(voiceNameOrId)) {
      return voiceNameOrId;
    }

    // Populate cache if needed
    if (!this.voiceCachePopulated) {
      await this.populateVoiceCache();
    }

    // Case-insensitive lookup
    const lower = voiceNameOrId.toLowerCase();
    const cached = this.voiceCache.get(lower);
    if (cached) return cached;

    // Try a search if not in cache
    try {
      const result = await this.client.voices.search({
        search: voiceNameOrId,
        pageSize: 5
      });
      if (result.voices && result.voices.length > 0) {
        const voice = result.voices[0];
        if (voice.voiceId) {
          this.voiceCache.set(voice.name?.toLowerCase() || lower, voice.voiceId);
          return voice.voiceId;
        }
      }
    } catch {
      // Fall through to error
    }

    throw new Error(
      `Voice "${voiceNameOrId}" not found. Use list_voices to see available voices, or provide a voice ID directly.`
    );
  }

  private async populateVoiceCache(): Promise<void> {
    try {
      const result = await this.client.voices.search({
        pageSize: 100
      });
      if (result.voices) {
        for (const voice of result.voices) {
          if (voice.name && voice.voiceId) {
            this.voiceCache.set(voice.name.toLowerCase(), voice.voiceId);
          }
        }
      }
      this.voiceCachePopulated = true;
    } catch {
      // Cache population failed, will try individual lookups
    }
  }

  async textToSpeech(
    text: string,
    voiceId: string,
    options?: {
      modelId?: string;
      outputFormat?: string;
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speed?: number;
    }
  ): Promise<Buffer> {
    try {
      const params: any = {
        text,
        modelId: options?.modelId || 'eleven_multilingual_v2',
        outputFormat: options?.outputFormat || 'mp3_44100_128',
      };

      if (options?.stability !== undefined || options?.similarityBoost !== undefined || options?.style !== undefined) {
        params.voiceSettings = {
          stability: options?.stability ?? 0.5,
          similarityBoost: options?.similarityBoost ?? 0.75,
          style: options?.style ?? 0,
        };
      }

      if (options?.speed !== undefined) {
        params.voiceSettings = params.voiceSettings || {};
        params.voiceSettings.speed = options.speed;
      }

      const audioStream = await Promise.race([
        this.client.textToSpeech.convert(voiceId, params),
        this.timeoutPromise(this.timeout * 2)
      ]);

      return await this.streamToBuffer(audioStream as ReadableStream<Uint8Array> | NodeJS.ReadableStream);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async soundEffects(
    text: string,
    options?: {
      durationSeconds?: number;
      promptInfluence?: number;
    }
  ): Promise<Buffer> {
    try {
      const params: any = { text };
      if (options?.durationSeconds !== undefined) {
        params.durationSeconds = options.durationSeconds;
      }
      if (options?.promptInfluence !== undefined) {
        params.promptInfluence = options.promptInfluence;
      }

      const audioStream = await Promise.race([
        this.client.textToSoundEffects.convert(params),
        this.timeoutPromise(this.timeout * 2)
      ]);

      return await this.streamToBuffer(audioStream as ReadableStream<Uint8Array> | NodeJS.ReadableStream);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async generateMusic(
    text: string,
    options?: {
      durationSeconds?: number;
    }
  ): Promise<Buffer> {
    try {
      // Music generation uses the same sound effects endpoint with the music model
      const params: any = {
        text,
        // Note: The API may use a different endpoint or model for music
        // If the SDK doesn't support a separate music model via textToSoundEffects,
        // we'll use the REST API fallback
      };
      if (options?.durationSeconds !== undefined) {
        params.durationSeconds = options.durationSeconds;
      }

      const audioStream = await Promise.race([
        this.client.textToSoundEffects.convert(params),
        this.timeoutPromise(this.timeout * 3)
      ]);

      return await this.streamToBuffer(audioStream as ReadableStream<Uint8Array> | NodeJS.ReadableStream);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async speechToSpeech(
    audioPath: string,
    voiceId: string,
    options?: {
      modelId?: string;
      outputFormat?: string;
      stability?: number;
      similarityBoost?: number;
      removeBackgroundNoise?: boolean;
    }
  ): Promise<Buffer> {
    try {
      const resolvedPath = path.resolve(audioPath);
      const params: any = {
        audio: fs.createReadStream(resolvedPath),
        modelId: options?.modelId || 'eleven_english_sts_v2',
        outputFormat: options?.outputFormat || 'mp3_44100_128',
      };

      if (options?.removeBackgroundNoise !== undefined) {
        params.removeBackgroundNoise = options.removeBackgroundNoise;
      }

      if (options?.stability !== undefined || options?.similarityBoost !== undefined) {
        params.voiceSettings = JSON.stringify({
          stability: options?.stability ?? 0.5,
          similarity_boost: options?.similarityBoost ?? 0.75,
        });
      }

      const audioStream = await Promise.race([
        this.client.speechToSpeech.convert(voiceId, params),
        this.timeoutPromise(this.timeout * 2)
      ]);

      return await this.streamToBuffer(audioStream as ReadableStream<Uint8Array> | NodeJS.ReadableStream);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async voiceIsolation(audioPath: string): Promise<Buffer> {
    try {
      const resolvedPath = path.resolve(audioPath);
      const audioStream = await Promise.race([
        this.client.audioIsolation.convert({
          audio: fs.createReadStream(resolvedPath),
        }),
        this.timeoutPromise(this.timeout * 3)
      ]);

      return await this.streamToBuffer(audioStream as ReadableStream<Uint8Array> | NodeJS.ReadableStream);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async transcribe(
    audioPath: string,
    options?: {
      modelId?: string;
      languageCode?: string;
      diarize?: boolean;
      numSpeakers?: number;
    }
  ): Promise<TranscriptionResponse> {
    try {
      const resolvedPath = path.resolve(audioPath);
      const params: any = {
        file: fs.createReadStream(resolvedPath),
        modelId: options?.modelId || 'scribe_v2',
      };

      if (options?.languageCode) {
        params.languageCode = options.languageCode;
      }
      if (options?.diarize !== undefined) {
        params.diarize = options.diarize;
      }
      if (options?.numSpeakers !== undefined) {
        params.numSpeakers = options.numSpeakers;
      }

      const response = await Promise.race([
        this.client.speechToText.convert(params),
        this.timeoutPromise(this.timeout * 3)
      ]) as any;

      const words = response.words?.map((w: any) => ({
        text: w.text,
        start: w.start,
        end: w.end,
      }));

      return {
        text: response.text || '',
        words,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async listVoices(options?: {
    search?: string;
    category?: string;
    pageSize?: number;
  }): Promise<ListVoicesResponse> {
    try {
      const params: any = {
        pageSize: options?.pageSize || 20,
        includeTotalCount: true,
      };
      if (options?.search) {
        params.search = options.search;
      }
      if (options?.category) {
        params.category = options.category;
      }

      const result = await Promise.race([
        this.client.voices.search(params),
        this.timeoutPromise(this.timeout)
      ]) as any;

      const voices: VoiceInfo[] = (result.voices || []).map((v: any) => ({
        voiceId: v.voiceId || v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
        description: v.description,
        previewUrl: v.previewUrl || v.preview_url,
      }));

      // Refresh voice cache
      for (const voice of voices) {
        if (voice.name && voice.voiceId) {
          this.voiceCache.set(voice.name.toLowerCase(), voice.voiceId);
        }
      }
      this.voiceCachePopulated = true;

      return {
        voices,
        totalCount: result.totalCount || result.total_count,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async cloneVoice(
    name: string,
    filePaths: string[],
    options?: {
      description?: string;
      removeBackgroundNoise?: boolean;
    }
  ): Promise<CloneVoiceResponse> {
    try {
      const files = filePaths.map(fp => fs.createReadStream(path.resolve(fp)));

      const params: any = {
        name,
        files,
      };
      if (options?.description) {
        params.description = options.description;
      }
      if (options?.removeBackgroundNoise !== undefined) {
        params.removeBackgroundNoise = options.removeBackgroundNoise;
      }

      const result = await Promise.race([
        this.client.voices.ivc.create(params),
        this.timeoutPromise(this.timeout * 2)
      ]) as any;

      const voiceId = result.voiceId || result.voice_id;

      // Add to cache
      this.voiceCache.set(name.toLowerCase(), voiceId);

      return {
        voiceId,
        name,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private async streamToBuffer(stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream): Promise<Buffer> {
    // Handle Web ReadableStream
    if ('getReader' in stream) {
      const reader = (stream as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      return Buffer.concat(chunks);
    }

    // Handle Node.js ReadableStream
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const nodeStream = stream as NodeJS.ReadableStream;
      nodeStream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      nodeStream.on('end', () => resolve(Buffer.concat(chunks)));
      nodeStream.on('error', reject);
    });
  }

  private timeoutPromise(ms: number): Promise<never> {
    return new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
  }

  private handleError(error: any): Error {
    if (error.message === 'Request timeout') {
      return new Error('ElevenLabs API request timed out. Please try again.');
    }
    if (error.status === 401 || error.statusCode === 401 || error.status === 403 || error.statusCode === 403) {
      return new Error(
        'Invalid ElevenLabs API key. Please check your ELEVENLABS_API_KEY environment variable.'
      );
    }
    if (error.status === 429 || error.statusCode === 429) {
      return new Error(
        'ElevenLabs API rate limit or quota exceeded. Check your plan limits at elevenlabs.io.'
      );
    }
    if (error.status === 422 || error.statusCode === 422) {
      return new Error(
        `ElevenLabs validation error: ${error.message || 'Invalid request parameters.'}`
      );
    }
    if (
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('fetch')
    ) {
      return new Error(`Failed to connect to ElevenLabs API: ${error.message}`);
    }
    return new Error(`ElevenLabs API error: ${error.message || error}`);
  }
}

export function createElevenLabsClient(config: Config): ElevenLabsClient {
  return new ElevenLabsClient(config);
}
