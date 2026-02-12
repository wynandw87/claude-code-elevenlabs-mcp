#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './config.js';
import { createElevenLabsClient } from './elevenlabs-client.js';

async function main() {
  try {
    const config = loadConfig();
    const client = createElevenLabsClient(config);

    const server = new Server(
      {
        name: 'elevenlabs-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Register tools/list handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'text_to_speech',
            description: "Convert text to natural speech using ElevenLabs' industry-leading TTS. Saves audio file to disk. Trigger: 'elevenlabs tts', 'elevenlabs speak', or 'elevenlabs text to speech'.",
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'The text to convert to speech',
                  maxLength: 10000
                },
                voice: {
                  type: 'string',
                  description: 'Voice name (e.g., "Rachel", "Adam", "Bella") or voice ID. Use list_voices to see options.',
                  default: 'Rachel'
                },
                model: {
                  type: 'string',
                  description: 'TTS model: "eleven_multilingual_v2" (default, 29 languages), "eleven_v3" (latest), "eleven_turbo_v2_5" (fast), "eleven_flash_v2_5" (ultra-fast)'
                },
                stability: {
                  type: 'number',
                  description: 'Voice stability (0.0-1.0). Lower = more expressive, higher = more consistent. Default: 0.5',
                  minimum: 0,
                  maximum: 1
                },
                similarity_boost: {
                  type: 'number',
                  description: 'Voice clarity/similarity (0.0-1.0). Higher = closer to original voice. Default: 0.75',
                  minimum: 0,
                  maximum: 1
                },
                style: {
                  type: 'number',
                  description: 'Style exaggeration (0.0-1.0). Higher = more expressive delivery. Default: 0',
                  minimum: 0,
                  maximum: 1
                },
                speed: {
                  type: 'number',
                  description: 'Speech speed (0.25-4.0). Default: 1.0',
                  minimum: 0.25,
                  maximum: 4.0
                },
                output_format: {
                  type: 'string',
                  description: 'Audio format: "mp3_44100_128" (default), "mp3_44100_192", "pcm_44100", "pcm_24000", "pcm_16000"',
                  enum: ['mp3_44100_128', 'mp3_44100_192', 'mp3_22050_32', 'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_44100']
                },
                save_path: {
                  type: 'string',
                  description: 'File path to save the audio. If not provided, auto-saves to output directory.'
                }
              },
              required: ['text']
            }
          },
          {
            name: 'sound_effects',
            description: "Generate sound effects from text descriptions using ElevenLabs. Great for game audio, video production, and creative projects. Trigger: 'elevenlabs sfx', 'elevenlabs sound effect', or 'elevenlabs generate sound'.",
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Description of the sound effect to generate (e.g., "thunder rumbling in the distance", "wooden door creaking open slowly")',
                  maxLength: 1000
                },
                duration_seconds: {
                  type: 'number',
                  description: 'Duration in seconds (0.5-30). Auto-determined if omitted.',
                  minimum: 0.5,
                  maximum: 30
                },
                prompt_influence: {
                  type: 'number',
                  description: 'How closely to follow the text prompt (0.0-1.0). Default: 0.3',
                  minimum: 0,
                  maximum: 1
                },
                save_path: {
                  type: 'string',
                  description: 'File path to save the audio. If not provided, auto-saves to output directory.'
                }
              },
              required: ['text']
            }
          },
          {
            name: 'generate_music',
            description: "Generate studio-grade music from text descriptions using ElevenLabs. Trigger: 'elevenlabs music', 'elevenlabs generate music', or 'elevenlabs compose'.",
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Description of the music to generate (e.g., "lo-fi hip hop beat with piano and soft drums", "epic orchestral score for a movie trailer")',
                  maxLength: 1000
                },
                duration_seconds: {
                  type: 'number',
                  description: 'Duration in seconds (0.5-30). Auto-determined if omitted.',
                  minimum: 0.5,
                  maximum: 30
                },
                save_path: {
                  type: 'string',
                  description: 'File path to save the audio. If not provided, auto-saves to output directory.'
                }
              },
              required: ['text']
            }
          },
          {
            name: 'list_voices',
            description: "List and search available ElevenLabs voices. Trigger: 'elevenlabs voices', 'elevenlabs list voices', or 'show elevenlabs voices'.",
            inputSchema: {
              type: 'object',
              properties: {
                search: {
                  type: 'string',
                  description: 'Search query to filter voices by name, description, or labels'
                },
                category: {
                  type: 'string',
                  description: 'Filter by category: "premade", "cloned", "generated", "professional"',
                  enum: ['premade', 'cloned', 'generated', 'professional']
                },
                page_size: {
                  type: 'integer',
                  description: 'Number of voices to return (default: 20, max: 100)',
                  default: 20,
                  minimum: 1,
                  maximum: 100
                }
              }
            }
          },
          {
            name: 'clone_voice',
            description: "Create an instant voice clone from audio samples. Requires 1-2 minutes of clear audio. Trigger: 'elevenlabs clone', 'elevenlabs clone voice', or 'elevenlabs create voice'.",
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name for the cloned voice'
                },
                files: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of absolute paths to audio files for cloning (1-2 minutes of clear audio recommended)'
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the voice'
                },
                remove_background_noise: {
                  type: 'boolean',
                  description: 'Apply audio isolation to samples before cloning (default: false)',
                  default: false
                }
              },
              required: ['name', 'files']
            }
          },
          {
            name: 'speech_to_speech',
            description: "Transform audio to use a different voice while preserving emotion and cadence. Trigger: 'elevenlabs voice change', 'elevenlabs speech to speech', or 'elevenlabs sts'.",
            inputSchema: {
              type: 'object',
              properties: {
                audio_path: {
                  type: 'string',
                  description: 'Absolute path to the source audio file'
                },
                voice: {
                  type: 'string',
                  description: 'Target voice name or ID to apply'
                },
                model: {
                  type: 'string',
                  description: 'STS model: "eleven_english_sts_v2" (default)'
                },
                stability: {
                  type: 'number',
                  description: 'Voice stability (0.0-1.0). Default: 0.5',
                  minimum: 0,
                  maximum: 1
                },
                similarity_boost: {
                  type: 'number',
                  description: 'Voice clarity/similarity (0.0-1.0). Default: 0.75',
                  minimum: 0,
                  maximum: 1
                },
                remove_background_noise: {
                  type: 'boolean',
                  description: 'Remove background noise from source audio (default: false)',
                  default: false
                },
                save_path: {
                  type: 'string',
                  description: 'File path to save the audio. If not provided, auto-saves to output directory.'
                }
              },
              required: ['audio_path', 'voice']
            }
          },
          {
            name: 'transcribe',
            description: "Transcribe audio to text using ElevenLabs Scribe with optional speaker diarization. Supports 90+ languages. Trigger: 'elevenlabs transcribe', 'elevenlabs stt', or 'elevenlabs speech to text'.",
            inputSchema: {
              type: 'object',
              properties: {
                audio_path: {
                  type: 'string',
                  description: 'Absolute path to the audio file to transcribe'
                },
                model: {
                  type: 'string',
                  description: 'Transcription model: "scribe_v2" (default, 90+ languages), "scribe_v1"',
                  enum: ['scribe_v2', 'scribe_v1']
                },
                language_code: {
                  type: 'string',
                  description: 'Language code (ISO 639-1, e.g., "en", "es", "fr") to improve accuracy'
                },
                diarize: {
                  type: 'boolean',
                  description: 'Identify which speaker is talking (default: false)',
                  default: false
                },
                num_speakers: {
                  type: 'integer',
                  description: 'Expected number of speakers (up to 32). Helps improve diarization accuracy.',
                  minimum: 1,
                  maximum: 32
                }
              },
              required: ['audio_path']
            }
          },
          {
            name: 'voice_isolation',
            description: "Isolate vocals from background noise in audio files. Great for cleaning up recordings. Trigger: 'elevenlabs isolate', 'elevenlabs voice isolation', or 'elevenlabs clean audio'.",
            inputSchema: {
              type: 'object',
              properties: {
                audio_path: {
                  type: 'string',
                  description: 'Absolute path to the audio file to process'
                },
                save_path: {
                  type: 'string',
                  description: 'File path to save the isolated audio. If not provided, auto-saves to output directory.'
                }
              },
              required: ['audio_path']
            }
          }
        ]
      };
    });

    // Helper: save binary to disk
    function saveFile(data: Buffer, savePath: string): string {
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(savePath, data);
      return savePath;
    }

    // Helper: generate auto save path
    function getAutoSavePath(outputDir: string, prefix: string, ext: string = 'mp3'): string {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${prefix}-${timestamp}.${ext}`;
      return path.resolve(outputDir, filename);
    }

    // Helper: get file extension from output format
    function getExtFromFormat(format: string): string {
      if (format.startsWith('mp3')) return 'mp3';
      if (format.startsWith('pcm')) return 'pcm';
      if (format.startsWith('ulaw') || format.startsWith('alaw')) return 'wav';
      return 'mp3';
    }

    // Register tools/call handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'text_to_speech': {
            const schema = z.object({
              text: z.string().min(1),
              voice: z.string().optional(),
              model: z.string().optional(),
              stability: z.number().min(0).max(1).optional(),
              similarity_boost: z.number().min(0).max(1).optional(),
              style: z.number().min(0).max(1).optional(),
              speed: z.number().min(0.25).max(4.0).optional(),
              output_format: z.string().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);

            const voiceName = input.voice || config.defaultVoice;
            const voiceId = await client.resolveVoiceId(voiceName);
            const format = input.output_format || 'mp3_44100_128';

            const audioBuffer = await client.textToSpeech(input.text, voiceId, {
              modelId: input.model,
              outputFormat: format,
              stability: input.stability,
              similarityBoost: input.similarity_boost,
              style: input.style,
              speed: input.speed,
            });

            const ext = getExtFromFormat(format);
            const savePath = input.save_path || getAutoSavePath(config.outputDir, 'speech', ext);
            const savedTo = saveFile(audioBuffer, savePath);

            return {
              content: [{
                type: 'text',
                text: `Audio saved to: ${savedTo}\nVoice: ${voiceName}\nModel: ${input.model || 'eleven_multilingual_v2'}\nFormat: ${format}\nSize: ${(audioBuffer.length / 1024).toFixed(1)} KB`
              }]
            };
          }

          case 'sound_effects': {
            const schema = z.object({
              text: z.string().min(1),
              duration_seconds: z.number().min(0.5).max(30).optional(),
              prompt_influence: z.number().min(0).max(1).optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);

            const audioBuffer = await client.soundEffects(input.text, {
              durationSeconds: input.duration_seconds,
              promptInfluence: input.prompt_influence,
            });

            const savePath = input.save_path || getAutoSavePath(config.outputDir, 'sfx', 'mp3');
            const savedTo = saveFile(audioBuffer, savePath);

            return {
              content: [{
                type: 'text',
                text: `Sound effect saved to: ${savedTo}\nDescription: ${input.text}\nSize: ${(audioBuffer.length / 1024).toFixed(1)} KB`
              }]
            };
          }

          case 'generate_music': {
            const schema = z.object({
              text: z.string().min(1),
              duration_seconds: z.number().min(0.5).max(30).optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);

            const audioBuffer = await client.generateMusic(input.text, {
              durationSeconds: input.duration_seconds,
            });

            const savePath = input.save_path || getAutoSavePath(config.outputDir, 'music', 'mp3');
            const savedTo = saveFile(audioBuffer, savePath);

            return {
              content: [{
                type: 'text',
                text: `Music saved to: ${savedTo}\nDescription: ${input.text}\nSize: ${(audioBuffer.length / 1024).toFixed(1)} KB`
              }]
            };
          }

          case 'list_voices': {
            const schema = z.object({
              search: z.string().optional(),
              category: z.enum(['premade', 'cloned', 'generated', 'professional']).optional(),
              page_size: z.number().int().min(1).max(100).optional()
            });
            const input = schema.parse(args);

            const result = await client.listVoices({
              search: input.search,
              category: input.category,
              pageSize: input.page_size,
            });

            let responseText = '';
            if (result.totalCount !== undefined) {
              responseText += `**Found ${result.totalCount} voice(s)**\n\n`;
            }

            responseText += '| Name | Voice ID | Category | Labels |\n';
            responseText += '|------|----------|----------|--------|\n';

            for (const voice of result.voices) {
              const labels = voice.labels
                ? Object.entries(voice.labels).map(([k, v]) => `${k}: ${v}`).join(', ')
                : '';
              responseText += `| ${voice.name} | ${voice.voiceId} | ${voice.category || ''} | ${labels} |\n`;
            }

            return { content: [{ type: 'text', text: responseText }] };
          }

          case 'clone_voice': {
            const schema = z.object({
              name: z.string().min(1),
              files: z.array(z.string()).min(1),
              description: z.string().optional(),
              remove_background_noise: z.boolean().optional()
            });
            const input = schema.parse(args);

            // Validate all files exist
            for (const filePath of input.files) {
              const resolved = path.resolve(filePath);
              if (!fs.existsSync(resolved)) {
                return {
                  content: [{ type: 'text', text: `Audio file not found: ${resolved}` }],
                  isError: true
                };
              }
            }

            const result = await client.cloneVoice(input.name, input.files, {
              description: input.description,
              removeBackgroundNoise: input.remove_background_noise,
            });

            return {
              content: [{
                type: 'text',
                text: `Voice cloned successfully!\nName: ${result.name}\nVoice ID: ${result.voiceId}\n\nYou can now use this voice with text_to_speech by setting voice: "${result.name}" or voice: "${result.voiceId}"`
              }]
            };
          }

          case 'speech_to_speech': {
            const schema = z.object({
              audio_path: z.string().min(1),
              voice: z.string().min(1),
              model: z.string().optional(),
              stability: z.number().min(0).max(1).optional(),
              similarity_boost: z.number().min(0).max(1).optional(),
              remove_background_noise: z.boolean().optional(),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);

            const audioPath = path.resolve(input.audio_path);
            if (!fs.existsSync(audioPath)) {
              return {
                content: [{ type: 'text', text: `Audio file not found: ${audioPath}` }],
                isError: true
              };
            }

            const voiceId = await client.resolveVoiceId(input.voice);

            const audioBuffer = await client.speechToSpeech(audioPath, voiceId, {
              modelId: input.model,
              stability: input.stability,
              similarityBoost: input.similarity_boost,
              removeBackgroundNoise: input.remove_background_noise,
            });

            const savePath = input.save_path || getAutoSavePath(config.outputDir, 'sts', 'mp3');
            const savedTo = saveFile(audioBuffer, savePath);

            return {
              content: [{
                type: 'text',
                text: `Converted audio saved to: ${savedTo}\nTarget voice: ${input.voice}\nSize: ${(audioBuffer.length / 1024).toFixed(1)} KB`
              }]
            };
          }

          case 'transcribe': {
            const schema = z.object({
              audio_path: z.string().min(1),
              model: z.enum(['scribe_v2', 'scribe_v1']).optional(),
              language_code: z.string().optional(),
              diarize: z.boolean().optional(),
              num_speakers: z.number().int().min(1).max(32).optional()
            });
            const input = schema.parse(args);

            const audioPath = path.resolve(input.audio_path);
            if (!fs.existsSync(audioPath)) {
              return {
                content: [{ type: 'text', text: `Audio file not found: ${audioPath}` }],
                isError: true
              };
            }

            const result = await client.transcribe(audioPath, {
              modelId: input.model,
              languageCode: input.language_code,
              diarize: input.diarize,
              numSpeakers: input.num_speakers,
            });

            let responseText = `**Transcription:**\n\n${result.text}`;

            if (result.words && result.words.length > 0) {
              responseText += `\n\n---\n*${result.words.length} words detected*`;
            }

            return { content: [{ type: 'text', text: responseText }] };
          }

          case 'voice_isolation': {
            const schema = z.object({
              audio_path: z.string().min(1),
              save_path: z.string().optional()
            });
            const input = schema.parse(args);

            const audioPath = path.resolve(input.audio_path);
            if (!fs.existsSync(audioPath)) {
              return {
                content: [{ type: 'text', text: `Audio file not found: ${audioPath}` }],
                isError: true
              };
            }

            const audioBuffer = await client.voiceIsolation(audioPath);

            const savePath = input.save_path || getAutoSavePath(config.outputDir, 'isolated', 'mp3');
            const savedTo = saveFile(audioBuffer, savePath);

            return {
              content: [{
                type: 'text',
                text: `Isolated audio saved to: ${savedTo}\nSource: ${audioPath}\nSize: ${(audioBuffer.length / 1024).toFixed(1)} KB`
              }]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: error.message || 'An error occurred' }],
          isError: true
        };
      }
    });

    // Start server with stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('ElevenLabs MCP Server v1.0.0 running');

    process.on('SIGINT', async () => {
      console.error('Shutting down ElevenLabs MCP Server...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Shutting down ElevenLabs MCP Server...');
      await server.close();
      process.exit(0);
    });
  } catch (error: any) {
    console.error('Failed to start ElevenLabs MCP Server:', error.message);
    process.exit(1);
  }
}

main();
