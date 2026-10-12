import type { RequestContext } from "@mastra/core/request-context";
import type { ProcessInputStepArgs, ProcessOutputStepArgs, Processor } from "@mastra/core/processors";
import type { TurnCaps } from "./caps";
import { estimateCostUsd } from "./pricing";

/**
 * RequestContext key holding the current turn's TurnBudget. Set only by the server
 * (src/chat-api.ts). Delegated sub-agents get a shallow copy of the caller's RequestContext, so
 * they see the same TurnBudget object and their model calls count toward the same turn.
 */
export const TURN_BUDGET_KEY = "botcompany.turnBudget";

export type CapReason = "cost" | "tokens";

/** Shape of the `data-turn-usage` stream part (and of the usage saved on the reply). */
export type TurnUsage = {
  costUsd: number;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  /** Input tokens served from the provider's prompt cache (part of inputTokens), when reported. */
  cachedInputTokens?: number;
  steps: number;
  capCostUsd: number;
  capTokens: number;
  capped: boolean;
  reason: CapReason | null;
  /** True on the last part of a turn. */
  final: boolean;
  /** The turn's Neatlogs trace id (set by src/chat-api.ts on what it streams and saves). */
  traceId?: string;
};

type StepUsage = { inputTokens?: number; outputTokens?: number; totalTokens?: number; cachedInputTokens?: number };

/** Usage and caps of one chat turn: every model step of the agent and of any agent it delegates to. */
export class TurnBudget {
  inputTokens = 0;
  outputTokens = 0;
  cachedInputTokens = 0;
  costUsd = 0;
  steps = 0;
  reason: CapReason | null = null;
  /** Called after every recorded model step (the server streams it as `data-turn-usage`). */
  onStep?: (usage: TurnUsage) => void;

  constructor(readonly caps: TurnCaps) {}

  get tokens(): number {
    return this.inputTokens + this.outputTokens;
  }

  get capped(): boolean {
    return this.reason !== null;
  }

  /** Adds one model step's usage, then marks the turn capped once either cap is exceeded. */
  record(modelId: string | undefined, usage: StepUsage | undefined): void {
    const input = safeCount(usage?.inputTokens);
    // Reasoning tokens are part of the output count; if a provider reports a larger total, the
    // difference is counted as output so nothing goes uncounted.
    const output = Math.max(safeCount(usage?.outputTokens), safeCount(usage?.totalTokens) - input);
    this.inputTokens += input;
    const cached = Math.min(safeCount(usage?.cachedInputTokens), input);
    this.outputTokens += output;
    this.cachedInputTokens += cached;
    this.costUsd += estimateCostUsd(modelId, input, output, cached);
    this.steps += 1;
    if (!this.reason) {
      if (this.costUsd > this.caps.costCapUsd) this.reason = "cost";
      else if (this.tokens > this.caps.tokenCap) this.reason = "tokens";
    }
    this.onStep?.(this.snapshot(false));
  }

  snapshot(final: boolean): TurnUsage {
    return {
      costUsd: round(this.costUsd),
      tokens: this.tokens,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      cachedInputTokens: this.cachedInputTokens,
      steps: this.steps,
      capCostUsd: this.caps.costCapUsd,
      capTokens: this.caps.tokenCap,
      capped: this.capped,
      reason: this.reason,
      final,
    };
  }

  /** User-facing explanation, used as the note on a capped reply. */
  cappedMessage(): string {
    if (this.reason === "cost") {
      return `Stopped: this reply reached its cost limit (about $${this.costUsd.toFixed(4)} used of $${this.caps.costCapUsd} per message). You can raise the limit for this agent and ask again.`;
    }
    if (this.reason === "tokens") {
      return `Stopped: this reply reached its token limit (${this.tokens.toLocaleString("en-US")} used of ${this.caps.tokenCap.toLocaleString("en-US")} tokens per message). You can raise the limit for this agent and ask again.`;
    }
    return "";
  }
}

export function turnBudgetFrom(requestContext: RequestContext | undefined): TurnBudget | undefined {
  const value = typeof requestContext?.get === "function" ? requestContext.get(TURN_BUDGET_KEY) : undefined;
  return value instanceof TurnBudget ? value : undefined;
}

/**
 * Enforces the turn's caps on every agent it is attached to (all agents, so delegated sub-agents
 * count too). After each model step it records the step's usage; once a cap is exceeded it trips
 * the run (TripWire), so no further model call happens. Mastra still executes the tool calls that
 * capping step already requested; a delegation among them is stopped before its first model call.
 * A run without a TurnBudget in its RequestContext (CLI, `mastra dev`) is not limited.
 */
class TurnBudgetProcessor implements Processor<"turn-budget"> {
  readonly id = "turn-budget";
  readonly name = "Turn usage caps";

  // Before each model call: a turn that is already capped (e.g. a sub-agent delegated by the
  // step that hit the cap) never calls the model. Also notes this step's model for pricing.
  processInputStep({ requestContext, abort, model, state }: ProcessInputStepArgs): void {
    const budget = turnBudgetFrom(requestContext);
    if (!budget) return;
    if (budget.capped) abort(budget.cappedMessage(), { metadata: budget.snapshot(false) });
    state[MODEL_STATE_KEY] = typeof model === "object" && model ? `${model.provider}/${model.modelId}` : undefined;
  }

  // After each model call: count its usage, and stop the run once a cap is exceeded.
  processOutputStep({ requestContext, usage, abort, messageList, state }: ProcessOutputStepArgs) {
    const budget = turnBudgetFrom(requestContext);
    if (!budget) return messageList;
    const modelId = state[MODEL_STATE_KEY];
    budget.record(typeof modelId === "string" ? modelId : undefined, usage);
    if (budget.capped) abort(budget.cappedMessage(), { metadata: budget.snapshot(false) });
    return messageList;
  }
}

const MODEL_STATE_KEY = "modelId";

export const turnBudgetProcessor = new TurnBudgetProcessor();

function safeCount(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function round(usd: number): number {
  return Math.round(usd * 1e6) / 1e6;
}

/** Spread into every Agent config: `...turnCapProcessors`. */
export const turnCapProcessors = {
  inputProcessors: [turnBudgetProcessor],
  outputProcessors: [turnBudgetProcessor],
};
