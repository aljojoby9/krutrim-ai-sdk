import {
  type LanguageModelV3Prompt,
  UnsupportedFunctionalityError,
} from '@ai-sdk/provider';
import { convertUint8ArrayToBase64 } from '@ai-sdk/provider-utils';
import type { KrutrimChatPrompt } from './types';

export function convertToChatMessages(
  prompt: LanguageModelV3Prompt,
): KrutrimChatPrompt {
  const messages: KrutrimChatPrompt = [];

  for (const message of prompt) {
    switch (message.role) {
      case 'system': {
        messages.push({ role: 'system', content: message.content });
        break;
      }

      case 'user': {
        if (message.content.length === 1 && message.content[0].type === 'text') {
          messages.push({
            role: 'user',
            content: message.content[0].text,
          });
          break;
        }

        messages.push({
          role: 'user',
          content: message.content.map((part) => {
            switch (part.type) {
              case 'text': {
                return { type: 'text' as const, text: part.text };
              }
              case 'file': {
                let imageData: string;
                if (typeof part.data === 'string') {
                  if (
                    part.data.startsWith('http://') ||
                    part.data.startsWith('https://') ||
                    part.data.startsWith('data:')
                  ) {
                    imageData = part.data;
                  } else {
                    imageData = `data:${part.mediaType};base64,${part.data}`;
                  }
                } else if (part.data instanceof URL) {
                  imageData = part.data.toString();
                } else {
                  imageData = `data:${part.mediaType};base64,${convertUint8ArrayToBase64(part.data)}`;
                }

                return {
                  type: 'image_url' as const,
                  image_url: { url: imageData },
                };
              }
              default: {
                const _exhaustive: never = part;
                throw new UnsupportedFunctionalityError({
                  functionality: `Unsupported content part type: ${JSON.stringify(_exhaustive)}`,
                });
              }
            }
          }),
        });
        break;
      }

      case 'assistant': {
        let text = '';
        const toolCalls: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }> = [];

        for (const part of message.content) {
          switch (part.type) {
            case 'text': {
              text += part.text;
              break;
            }
            case 'tool-call': {
              toolCalls.push({
                id: part.toolCallId,
                type: 'function',
                function: {
                  name: part.toolName,
                  arguments:
                    typeof part.input === 'string'
                      ? part.input
                      : JSON.stringify(part.input),
                },
              });
              break;
            }
            case 'tool-result': {
              break;
            }
            default: {
              // reasoning / file / etc. — skip for OpenAI-compat mapping
              break;
            }
          }
        }

        messages.push({
          role: 'assistant',
          content: text || null,
          tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
        });
        break;
      }

      case 'tool': {
        for (const part of message.content) {
          if (part.type === 'tool-result') {
            messages.push({
              role: 'tool',
              tool_call_id: part.toolCallId,
              content: JSON.stringify(part.output),
            });
          }
        }
        break;
      }

      default: {
        const _exhaustive: never = message;
        throw new Error(`Unsupported role: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }

  return messages;
}
