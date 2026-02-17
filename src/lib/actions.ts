import { api } from "./api";

export interface ActionDef {
  execute: (args: Record<string, unknown>) => Promise<unknown>;
  describe: (args: Record<string, unknown>) => string;
}

function renderArgs(
  args: Record<string, unknown>,
  params: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string") {
      let rendered = value;
      for (const [paramId, paramValue] of Object.entries(params)) {
        rendered = rendered.replaceAll(`{{${paramId}}}`, paramValue);
      }
      result[key] = rendered;
    } else {
      result[key] = value;
    }
  }
  return result;
}

const registry: Record<string, ActionDef> = {
  create_agent: {
    execute: (args) =>
      api.createAgent(
        args.agentId as string,
        args.modelProfileId as string | undefined,
        args.independent as boolean | undefined,
      ),
    describe: (args) =>
      `Create ${args.independent ? "independent " : ""}agent "${args.agentId}"`,
  },
  setup_identity: {
    execute: (args) =>
      api.setupAgentIdentity(
        args.agentId as string,
        args.name as string,
        args.emoji as string | undefined,
      ),
    describe: (args) => {
      const emoji = args.emoji ? ` ${args.emoji}` : "";
      return `Set identity: ${args.name}${emoji}`;
    },
  },
  bind_channel: {
    execute: (args) =>
      api.assignChannelAgent(
        args.channelType as string,
        args.peerId as string,
        args.agentId as string,
      ),
    describe: (args) =>
      `Bind ${args.channelType} channel → agent "${args.agentId}"`,
  },
  config_patch: {
    execute: (args) =>
      api.applyConfigPatch(
        args.patchTemplate as string,
        args.params as Record<string, string>,
      ),
    describe: () => "",
  },
  set_global_model: {
    execute: (args) => api.setGlobalModel(args.profileId as string),
    describe: (args) => `Set default model to ${args.profileId}`,
  },
};

export function getAction(actionType: string): ActionDef | undefined {
  return registry[actionType];
}

export interface ResolvedStep {
  index: number;
  action: string;
  label: string;
  args: Record<string, unknown>;
  description: string;
}

export function resolveSteps(
  steps: { action: string; label: string; args: Record<string, unknown> }[],
  params: Record<string, string>,
): ResolvedStep[] {
  return steps.map((step, index) => {
    const resolved = renderArgs(step.args, params);
    if (step.action === "config_patch") {
      resolved.params = params;
    }
    const actionDef = getAction(step.action);
    const description = actionDef?.describe(resolved) || step.label;
    return {
      index,
      action: step.action,
      label: step.label,
      args: resolved,
      description: description || step.label,
    };
  });
}

export async function executeStep(step: ResolvedStep): Promise<void> {
  const actionDef = getAction(step.action);
  if (!actionDef) {
    throw new Error(`Unknown action type: ${step.action}`);
  }
  await actionDef.execute(step.args);
}
