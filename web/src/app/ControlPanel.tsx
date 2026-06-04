import { useState, useCallback } from "react";
import { useSessionState, useSessionDispatch } from "../state/SessionProvider";
import { setAgentFull, appendMutation, appendChatMessage } from "../state/sessionActions";
import { createMutationRecord } from "../state/mutationLog";
import { AgentState } from "../state/sessionTypes";
import "./control-panel.css";

// ─── MVP preset option sets ────────────────────────────────────────────────

const PERSONA_PRESETS = ["helpful", "analytical", "creative"] as const;
type PersonaPreset = (typeof PERSONA_PRESETS)[number];

const TONE_OPTIONS = ["friendly", "formal", "casual"] as const;
type ToneOption = (typeof TONE_OPTIONS)[number];

const AVATAR_PRESETS = ["humanoid", "robot", "abstract"] as const;
type AvatarPreset = (typeof AVATAR_PRESETS)[number];

const IDLE_POSES = ["standing", "waiting", "thinking"] as const;
type IdlePose = (typeof IDLE_POSES)[number];

// Accent color swatches available in the MVP
const ACCENT_COLORS = [
  { hex: "#4CC9F0", label: "Cyan" },
  { hex: "#6c63ff", label: "Violet" },
  { hex: "#FF6B6B", label: "Coral" },
  { hex: "#4ECDC4", label: "Teal" },
  { hex: "#FFE66D", label: "Yellow" },
] as const;

const MAX_DISPLAY_NAME_LENGTH = 50;

// ─── Draft type ────────────────────────────────────────────────────────────

/** Editable subset of AgentState — excludes the immutable `id` field. */
type AgentDraft = {
  displayName: string;
  personaPreset: PersonaPreset;
  tone: ToneOption;
  behavior: {
    curiosity: number;
    formality: number;
    skepticism: number;
  };
  appearance: {
    avatarPreset: AvatarPreset;
    accentColor: string;
    idlePose: IdlePose;
  };
};

function agentToDraft(agent: AgentState): AgentDraft {
  return {
    displayName: agent.displayName,
    personaPreset: (PERSONA_PRESETS as readonly string[]).includes(agent.personaPreset)
      ? (agent.personaPreset as PersonaPreset)
      : PERSONA_PRESETS[0],
    tone: (TONE_OPTIONS as readonly string[]).includes(agent.tone)
      ? (agent.tone as ToneOption)
      : TONE_OPTIONS[0],
    behavior: {
      curiosity: agent.behavior.curiosity,
      formality: agent.behavior.formality,
      skepticism: agent.behavior.skepticism,
    },
    appearance: {
      avatarPreset: (AVATAR_PRESETS as readonly string[]).includes(
        agent.appearance.avatarPreset,
      )
        ? (agent.appearance.avatarPreset as AvatarPreset)
        : AVATAR_PRESETS[0],
      accentColor: agent.appearance.accentColor,
      idlePose: (IDLE_POSES as readonly string[]).includes(agent.appearance.idlePose)
        ? (agent.appearance.idlePose as IdlePose)
        : IDLE_POSES[0],
    },
  };
}

/** Returns an error string if the draft is invalid, or null when valid. */
function validateDraft(draft: AgentDraft): string | null {
  const name = draft.displayName.trim();
  if (name.length === 0) return "Display name must not be empty.";
  if (name.length > MAX_DISPLAY_NAME_LENGTH)
    return `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`;
  if (!(PERSONA_PRESETS as readonly string[]).includes(draft.personaPreset))
    return "Invalid persona preset.";
  if (!(TONE_OPTIONS as readonly string[]).includes(draft.tone)) return "Invalid tone.";
  if (!(AVATAR_PRESETS as readonly string[]).includes(draft.appearance.avatarPreset))
    return "Invalid avatar preset.";
  if (!(IDLE_POSES as readonly string[]).includes(draft.appearance.idlePose))
    return "Invalid idle pose.";
  return null;
}

// ─── Sub-components ────────────────────────────────────────────────────────

type SliderRowProps = {
  label: string;
  name: string;
  value: number;
  onChange: (v: number) => void;
};

function SliderRow({ label, name, value, onChange }: SliderRowProps) {
  return (
    <div className="cp-slider-row">
      <label htmlFor={name} className="cp-label">
        {label}
        <span className="cp-slider-value" aria-live="polite">
          {Math.round(value * 100)}%
        </span>
      </label>
      <input
        id={name}
        name={name}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        className="cp-slider"
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
      />
    </div>
  );
}

// ─── Main ControlPanel component ──────────────────────────────────────────

export function AgentControlPanel() {
  const state = useSessionState();
  const dispatch = useSessionDispatch();

  // Local draft — changes here do NOT touch shared state until Apply is clicked
  const [draft, setDraft] = useState<AgentDraft>(() => agentToDraft(state.agent));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastApplyStatus, setLastApplyStatus] = useState<string | null>(null);

  // ── Draft setters ────────────────────────────────────────────────────────

  const setIdentityField = useCallback(
    <K extends keyof Pick<AgentDraft, "displayName" | "personaPreset" | "tone">>(
      field: K,
      value: AgentDraft[K],
    ) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
      setValidationError(null);
    },
    [],
  );

  const setBehaviorField = useCallback(
    (field: keyof AgentDraft["behavior"], value: number) => {
      setDraft((prev) => ({
        ...prev,
        behavior: { ...prev.behavior, [field]: value },
      }));
    },
    [],
  );

  const setAppearanceField = useCallback(
    <K extends keyof AgentDraft["appearance"]>(
      field: K,
      value: AgentDraft["appearance"][K],
    ) => {
      setDraft((prev) => ({
        ...prev,
        appearance: { ...prev.appearance, [field]: value },
      }));
    },
    [],
  );

  // ── Apply handler ────────────────────────────────────────────────────────

  const handleApply = useCallback(() => {
    const err = validateDraft(draft);
    if (err) {
      setValidationError(err);
      setLastApplyStatus(null);
      return;
    }
    setValidationError(null);

    // 1 — Single state update for all agent fields
    const agentUpdates: Partial<Omit<AgentState, "id">> = {
      displayName: draft.displayName.trim(),
      personaPreset: draft.personaPreset,
      tone: draft.tone,
      behavior: { ...draft.behavior },
      appearance: { ...draft.appearance },
    };
    dispatch(setAgentFull(agentUpdates));

    const now = Date.now();

    // 2 — Record one MutationRecord
    const mutation = createMutationRecord({
      source: "control-panel",
      target: "agent",
      summary: `Agent updated: ${draft.displayName.trim()} / ${draft.personaPreset} / ${draft.tone}`,
      status: "applied",
      timestamp: now,
      payload: agentUpdates as Record<string, unknown>,
    });
    dispatch(appendMutation(mutation));

    // 3 — Append one concise chat context message
    dispatch(
      appendChatMessage({
        id: `ctx-agent-${now}`,
        content: `[Agent updated] Name: "${draft.displayName.trim()}", persona: ${draft.personaPreset}, tone: ${draft.tone}, avatar: ${draft.appearance.avatarPreset}.`,
        timestamp: now,
        sender: "system",
      }),
    );

    setLastApplyStatus("Changes applied.");
  }, [draft, dispatch]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <section
      className="cp-root"
      data-testid="agent-control-panel"
      aria-label="Agent controls"
    >
      <h2 className="cp-heading">Agent</h2>

      {/* ── Identity group ─────────────────────────────────────────────── */}
      <fieldset className="cp-group" data-testid="agent-identity-group">
        <legend className="cp-group-legend">Identity</legend>

        <div className="cp-field">
          <label htmlFor="agent-display-name" className="cp-label">
            Display name
          </label>
          <input
            id="agent-display-name"
            name="displayName"
            type="text"
            className="cp-text-input"
            value={draft.displayName}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            onChange={(e) => setIdentityField("displayName", e.target.value)}
            data-testid="agent-display-name-input"
          />
        </div>

        <div className="cp-field">
          <label htmlFor="agent-persona" className="cp-label">
            Persona
          </label>
          <select
            id="agent-persona"
            name="personaPreset"
            className="cp-select"
            value={draft.personaPreset}
            onChange={(e) =>
              setIdentityField("personaPreset", e.target.value as PersonaPreset)
            }
            data-testid="agent-persona-select"
          >
            {PERSONA_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="cp-field">
          <label htmlFor="agent-tone" className="cp-label">
            Tone
          </label>
          <select
            id="agent-tone"
            name="tone"
            className="cp-select"
            value={draft.tone}
            onChange={(e) => setIdentityField("tone", e.target.value as ToneOption)}
            data-testid="agent-tone-select"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* ── Behavior group ─────────────────────────────────────────────── */}
      <fieldset className="cp-group" data-testid="agent-behavior-group">
        <legend className="cp-group-legend">Behavior</legend>

        <SliderRow
          label="Curiosity"
          name="behavior-curiosity"
          value={draft.behavior.curiosity}
          onChange={(v) => setBehaviorField("curiosity", v)}
        />
        <SliderRow
          label="Formality"
          name="behavior-formality"
          value={draft.behavior.formality}
          onChange={(v) => setBehaviorField("formality", v)}
        />
        <SliderRow
          label="Skepticism"
          name="behavior-skepticism"
          value={draft.behavior.skepticism}
          onChange={(v) => setBehaviorField("skepticism", v)}
        />
      </fieldset>

      {/* ── Appearance group ───────────────────────────────────────────── */}
      <fieldset className="cp-group" data-testid="agent-appearance-group">
        <legend className="cp-group-legend">Appearance</legend>

        <div className="cp-field">
          <label htmlFor="agent-avatar" className="cp-label">
            Avatar
          </label>
          <div
            className="cp-segmented"
            role="group"
            aria-label="Avatar preset"
            id="agent-avatar"
          >
            {AVATAR_PRESETS.map((ap) => (
              <button
                key={ap}
                type="button"
                className={`cp-segment-btn${draft.appearance.avatarPreset === ap ? " cp-segment-btn--active" : ""}`}
                aria-pressed={draft.appearance.avatarPreset === ap}
                onClick={() => setAppearanceField("avatarPreset", ap)}
                data-testid={`avatar-preset-${ap}`}
              >
                {ap.charAt(0).toUpperCase() + ap.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="cp-field">
          <span className="cp-label" id="accent-color-label">
            Accent color
          </span>
          <div
            className="cp-swatches"
            role="group"
            aria-labelledby="accent-color-label"
            data-testid="accent-color-swatches"
          >
            {ACCENT_COLORS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                className={`cp-swatch${draft.appearance.accentColor === hex ? " cp-swatch--active" : ""}`}
                style={{ backgroundColor: hex }}
                aria-label={`${label} (${hex})`}
                aria-pressed={draft.appearance.accentColor === hex}
                onClick={() => setAppearanceField("accentColor", hex)}
                data-testid={`accent-color-${label.toLowerCase()}`}
              />
            ))}
          </div>
        </div>

        <div className="cp-field">
          <label htmlFor="agent-idle-pose" className="cp-label">
            Idle pose
          </label>
          <select
            id="agent-idle-pose"
            name="idlePose"
            className="cp-select"
            value={draft.appearance.idlePose}
            onChange={(e) => setAppearanceField("idlePose", e.target.value as IdlePose)}
            data-testid="agent-idle-pose-select"
          >
            {IDLE_POSES.map((pose) => (
              <option key={pose} value={pose}>
                {pose.charAt(0).toUpperCase() + pose.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* ── Validation / status feedback ───────────────────────────────── */}
      {validationError && (
        <p className="cp-error" role="alert" data-testid="agent-validation-error">
          {validationError}
        </p>
      )}
      {lastApplyStatus && !validationError && (
        <p className="cp-status" aria-live="polite" data-testid="agent-apply-status">
          {lastApplyStatus}
        </p>
      )}

      {/* ── Apply button ───────────────────────────────────────────────── */}
      <button
        type="button"
        className="cp-apply-btn"
        onClick={handleApply}
        data-testid="apply-agent-changes-btn"
      >
        Apply Agent Changes
      </button>
    </section>
  );
}
