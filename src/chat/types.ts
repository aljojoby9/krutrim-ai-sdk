export type KrutrimChatPrompt = Array<KrutrimMessage>;

export type KrutrimMessage =
  | KrutrimSystemMessage
  | KrutrimUserMessage
  | KrutrimAssistantMessage
  | KrutrimToolMessage;

export interface KrutrimSystemMessage {
  role: 'system';
  content: string;
}

export interface KrutrimUserMessage {
  role: 'user';
  content: string | Array<KrutrimContentPart>;
}

export type KrutrimContentPart = KrutrimContentPartText | KrutrimContentPartImage;

export interface KrutrimContentPartImage {
  type: 'image_url';
  image_url: { url: string };
}

export interface KrutrimContentPartText {
  type: 'text';
  text: string;
}

export interface KrutrimAssistantMessage {
  role: 'assistant';
  content?: string | null;
  tool_calls?: Array<KrutrimMessageToolCall>;
}

export interface KrutrimMessageToolCall {
  type: 'function';
  id: string;
  function: {
    arguments: string;
    name: string;
  };
}

export interface KrutrimToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
}
