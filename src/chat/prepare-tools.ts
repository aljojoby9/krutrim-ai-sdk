import {
  type LanguageModelV3FunctionTool,
  type LanguageModelV3ProviderTool,
  type LanguageModelV3ToolChoice,
  type SharedV3Warning,
  UnsupportedFunctionalityError,
} from '@ai-sdk/provider';

type KrutrimTools = Array<{
  type: 'function';
  function: {
    name: string;
    description: string | undefined;
    parameters: unknown;
  };
}>;

export function prepareTools({
  tools,
  toolChoice,
}: {
  tools?: Array<LanguageModelV3FunctionTool | LanguageModelV3ProviderTool>;
  toolChoice?: LanguageModelV3ToolChoice;
}): {
  tools: KrutrimTools | undefined;
  tool_choice:
    | { type: 'function'; function: { name: string } }
    | 'auto'
    | 'none'
    | 'required'
    | undefined;
  toolWarnings: SharedV3Warning[];
} {
  const finalTools = tools?.length ? tools : undefined;
  const toolWarnings: SharedV3Warning[] = [];

  if (finalTools == null) {
    return { tools: undefined, tool_choice: undefined, toolWarnings };
  }

  const krutrimTools: KrutrimTools = [];

  for (const tool of finalTools) {
    if (tool.type === 'provider') {
      toolWarnings.push({ type: 'unsupported', feature: tool.name });
    } else {
      krutrimTools.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      });
    }
  }

  if (toolChoice == null) {
    return { tools: krutrimTools, tool_choice: undefined, toolWarnings };
  }

  const type = toolChoice.type;

  switch (type) {
    case 'auto':
    case 'none':
    case 'required':
      return { tools: krutrimTools, tool_choice: type, toolWarnings };
    case 'tool':
      return {
        tools: krutrimTools,
        tool_choice: {
          type: 'function',
          function: { name: toolChoice.toolName },
        },
        toolWarnings,
      };
    default: {
      const _exhaustive: never = type;
      throw new UnsupportedFunctionalityError({
        functionality: `Unsupported tool choice type: ${_exhaustive}`,
      });
    }
  }
}
