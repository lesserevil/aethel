import { useState, useCallback, useMemo } from "react";
import { useSessionState, useSessionDispatch } from "../../state/SessionProvider";
import {
  setEnvironmentPreset,
  toggleObjectEnabled,
  appendChatMessage,
  appendMutation,
  resetSession,
} from "../../state/sessionActions";
import { createMutationRecord } from "../../state/mutationLog";
import { ChatMessage, MutationRecord } from "../../state/sessionTypes";
import { baselineSession } from "../../state/baselineSession";
import "./ControlPanel.css";

/**
 * ControlPanel - Left column environment controls with draft/apply/reset flow
 *
 * Features:
 * - Environment preset select
 * - Time-of-day control
 * - Lighting preset/intensity control
 * - Ambience/weather preset
 * - Object list with enabled toggles
 * - Apply Environment Changes button (validates draft, updates state, records mutation, adds chat message)
 * - Reset Scene button (restores baseline, records reset mutation, clears draft, preserves chat)
 */

// Preset options for dropdowns
const ENVIRONMENT_PRESETS = [
  { value: "laboratory", label: "Laboratory" },
  { value: "office", label: "Office" },
  { value: "outdoor", label: "Outdoor" },
  { value: "studio", label: "Studio" },
] as const;

const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "day", label: "Day" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
] as const;

const LIGHTING_PRESETS = [
  { value: "bright", label: "Bright" },
  { value: "natural", label: "Natural" },
  { value: "dim", label: "Dim" },
  { value: "dramatic", label: "Dramatic" },
] as const;

const AMBIENCE_PRESETS = [
  { value: "quiet", label: "Quiet" },
  { value: "peaceful", label: "Peaceful" },
  { value: "busy", label: "Busy" },
  { value: "industrial", label: "Industrial" },
] as const;

const WEATHER_PRESETS = [
  { value: "clear", label: "Clear" },
  { value: "cloudy", label: "Cloudy" },
  { value: "rainy", label: "Rainy" },
  { value: "sunny", label: "Sunny" },
] as const;

type EnvironmentPresetValue = (typeof ENVIRONMENT_PRESETS)[number]["value"];
type TimeOfDayValue = (typeof TIME_OF_DAY_OPTIONS)[number]["value"];
type LightingValue = (typeof LIGHTING_PRESETS)[number]["value"];
type AmbienceValue = (typeof AMBIENCE_PRESETS)[number]["value"];
type WeatherValue = (typeof WEATHER_PRESETS)[number]["value"];

type DraftEnvironmentState = {
  preset: EnvironmentPresetValue;
  timeOfDay: TimeOfDayValue;
  lighting: LightingValue;
  ambience: AmbienceValue;
  weather: WeatherValue;
};

const INITIAL_DRAFT: DraftEnvironmentState = {
  preset: "laboratory",
  timeOfDay: "day",
  lighting: "bright",
  ambience: "peaceful",
  weather: "clear",
};

export function ControlPanel() {
  const state = useSessionState();
  const dispatch = useSessionDispatch();

  // Local draft state for environment controls
  const [draft, setDraft] = useState<DraftEnvironmentState>(INITIAL_DRAFT);
  const [objectDrafts, setObjectDrafts] = useState<Record<string, boolean>>({});
  const [applyStatus, setApplyStatus] = useState<
    "idle" | "applying" | "success" | "error"
  >("idle");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<
    "idle" | "resetting" | "success" | "error"
  >("idle");
  const [resetError, setResetError] = useState<string | null>(null);

  // Initialize object drafts from current environment state
  const objects = useMemo(() => state.environment.objects, [state.environment.objects]);

  // Sync draft with current state when environment changes (but preserve user edits)
  // Only initialize once or on reset
  const [draftInitialized, setDraftInitialized] = useState(false);

  if (!draftInitialized) {
    setDraft({
      preset: state.environment.preset as EnvironmentPresetValue,
      timeOfDay: state.environment.timeOfDay as TimeOfDayValue,
      lighting: state.environment.lighting as LightingValue,
      ambience: state.environment.ambience as AmbienceValue,
      weather: state.environment.weather as WeatherValue,
    });
    const initialObjectDrafts: Record<string, boolean> = {};
    objects.forEach((obj) => {
      initialObjectDrafts[obj.id] = obj.enabled;
    });
    setObjectDrafts(initialObjectDrafts);
    setDraftInitialized(true);
  }

  // Handler for environment preset changes
  const handlePresetChange = useCallback((value: EnvironmentPresetValue) => {
    setDraft((prev) => ({ ...prev, preset: value }));
  }, []);

  // Handler for time of day changes
  const handleTimeOfDayChange = useCallback((value: TimeOfDayValue) => {
    setDraft((prev) => ({ ...prev, timeOfDay: value }));
  }, []);

  // Handler for lighting changes
  const handleLightingChange = useCallback((value: LightingValue) => {
    setDraft((prev) => ({ ...prev, lighting: value }));
  }, []);

  // Handler for ambience changes
  const handleAmbienceChange = useCallback((value: AmbienceValue) => {
    setDraft((prev) => ({ ...prev, ambience: value }));
  }, []);

  // Handler for weather changes
  const handleWeatherChange = useCallback((value: WeatherValue) => {
    setDraft((prev) => ({ ...prev, weather: value }));
  }, []);

  // Handler for object toggle changes
  const handleObjectToggle = useCallback((id: string, enabled: boolean) => {
    setObjectDrafts((prev) => ({ ...prev, [id]: enabled }));
  }, []);

  // Validate the draft payload
  const validateDraft = useCallback(
    (
      draftEnv: DraftEnvironmentState,
      objDrafts: Record<string, boolean>,
    ): string | null => {
      // Check all required fields are present
      if (!draftEnv.preset) return "Environment preset is required";
      if (!draftEnv.timeOfDay) return "Time of day is required";
      if (!draftEnv.lighting) return "Lighting preset is required";
      if (!draftEnv.ambience) return "Ambience preset is required";
      if (!draftEnv.weather) return "Weather preset is required";

      // Validate against known values
      const validPresets = ENVIRONMENT_PRESETS.map(
        (p) => p.value,
      ) as EnvironmentPresetValue[];
      if (!validPresets.includes(draftEnv.preset))
        return `Invalid environment preset: ${draftEnv.preset}`;

      const validTimes = TIME_OF_DAY_OPTIONS.map((t) => t.value) as TimeOfDayValue[];
      if (!validTimes.includes(draftEnv.timeOfDay))
        return `Invalid time of day: ${draftEnv.timeOfDay}`;

      const validLighting = LIGHTING_PRESETS.map((l) => l.value) as LightingValue[];
      if (!validLighting.includes(draftEnv.lighting))
        return `Invalid lighting preset: ${draftEnv.lighting}`;

      const validAmbience = AMBIENCE_PRESETS.map((a) => a.value) as AmbienceValue[];
      if (!validAmbience.includes(draftEnv.ambience))
        return `Invalid ambience preset: ${draftEnv.ambience}`;

      const validWeather = WEATHER_PRESETS.map((w) => w.value) as WeatherValue[];
      if (!validWeather.includes(draftEnv.weather))
        return `Invalid weather preset: ${draftEnv.weather}`;

      // Validate object IDs exist
      const validObjectIds = new Set(objects.map((o) => o.id));
      for (const id of Object.keys(objDrafts)) {
        if (!validObjectIds.has(id)) return `Invalid object ID: ${id}`;
      }

      return null;
    },
    [objects],
  );

  // Generate a concise summary of changes
  const generateChangeSummary = useCallback(
    (draftEnv: DraftEnvironmentState, objDrafts: Record<string, boolean>): string => {
      const changes: string[] = [];

      if (draftEnv.preset !== state.environment.preset) {
        changes.push(`preset: ${draftEnv.preset}`);
      }
      if (draftEnv.timeOfDay !== state.environment.timeOfDay) {
        changes.push(`time: ${draftEnv.timeOfDay}`);
      }
      if (draftEnv.lighting !== state.environment.lighting) {
        changes.push(`lighting: ${draftEnv.lighting}`);
      }
      if (draftEnv.ambience !== state.environment.ambience) {
        changes.push(`ambience: ${draftEnv.ambience}`);
      }
      if (draftEnv.weather !== state.environment.weather) {
        changes.push(`weather: ${draftEnv.weather}`);
      }

      const toggledObjects = objects.filter((obj) => objDrafts[obj.id] !== obj.enabled);
      if (toggledObjects.length > 0) {
        changes.push(`${toggledObjects.length} object(s) toggled`);
      }

      return changes.length > 0
        ? `Environment updated: ${changes.join(", ")}`
        : "Environment updated (no changes)";
    },
    [state.environment, objects],
  );

  // Handle Apply Environment Changes
  const handleApply = useCallback(async () => {
    const validationError = validateDraft(draft, objectDrafts);
    if (validationError) {
      setApplyError(validationError);
      setApplyStatus("error");
      return;
    }

    setApplyStatus("applying");
    setApplyError(null);

    try {
      // Apply environment changes
      dispatch(setEnvironmentPreset(draft));

      // Apply object toggles
      Object.entries(objectDrafts).forEach(([id, enabled]) => {
        const currentObj = objects.find((o) => o.id === id);
        if (currentObj && currentObj.enabled !== enabled) {
          dispatch(toggleObjectEnabled(id, enabled));
        }
      });

      // Create mutation record
      const mutation: MutationRecord = createMutationRecord({
        source: "control-panel",
        target: "environment",
        summary: generateChangeSummary(draft, objectDrafts),
        status: "applied",
        payload: {
          environment: draft,
          objectToggles: objectDrafts,
        },
      });
      dispatch(appendMutation(mutation));

      // Add system message to chat
      const systemMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        content: `[System] ${generateChangeSummary(draft, objectDrafts)}`,
        timestamp: Date.now(),
        sender: "system",
      };
      dispatch(appendChatMessage(systemMessage));

      setApplyStatus("success");
      // Reset status after a brief delay
      setTimeout(() => setApplyStatus("idle"), 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to apply changes";
      setApplyError(errorMessage);
      setApplyStatus("error");
    }
  }, [
    draft,
    objectDrafts,
    objects,
    state.environment,
    dispatch,
    validateDraft,
    generateChangeSummary,
  ]);

  // Handle Reset Scene
  const handleReset = useCallback(async () => {
    setResetStatus("resetting");
    setResetError(null);

    try {
      // Reset session (preserves chat history)
      dispatch(resetSession());

      // Create reset mutation record
      const mutation: MutationRecord = createMutationRecord({
        source: "control-panel",
        target: "session",
        summary: "Scene reset to baseline",
        status: "applied",
        payload: { action: "reset_baseline" },
      });
      dispatch(appendMutation(mutation));

      // Add system message to chat
      const systemMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        content: "[System] Scene reset to baseline configuration",
        timestamp: Date.now(),
        sender: "system",
      };
      dispatch(appendChatMessage(systemMessage));

      // Reset local draft state to baseline
      setDraft({
        preset: baselineSession.environment.preset as EnvironmentPresetValue,
        timeOfDay: baselineSession.environment.timeOfDay as TimeOfDayValue,
        lighting: baselineSession.environment.lighting as LightingValue,
        ambience: baselineSession.environment.ambience as AmbienceValue,
        weather: baselineSession.environment.weather as WeatherValue,
      });

      const baselineObjectDrafts: Record<string, boolean> = {};
      baselineSession.environment.objects.forEach((obj) => {
        baselineObjectDrafts[obj.id] = obj.enabled;
      });
      setObjectDrafts(baselineObjectDrafts);

      setResetStatus("success");
      setTimeout(() => setResetStatus("idle"), 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset scene";
      setResetError(errorMessage);
      setResetStatus("error");
    }
  }, [dispatch]);

  // Check if draft has changes from current state
  const hasChanges = useMemo(() => {
    if (draft.preset !== state.environment.preset) return true;
    if (draft.timeOfDay !== state.environment.timeOfDay) return true;
    if (draft.lighting !== state.environment.lighting) return true;
    if (draft.ambience !== state.environment.ambience) return true;
    if (draft.weather !== state.environment.weather) return true;

    for (const obj of objects) {
      if (objectDrafts[obj.id] !== obj.enabled) return true;
    }
    return false;
  }, [draft, objectDrafts, state.environment, objects]);

  return (
    <aside
      className="control-panel"
      id="control-panel"
      role="region"
      aria-label="Environment controls"
      data-testid="control-panel"
    >
      <header className="control-panel__header">
        <h2 className="control-panel__title">Environment Controls</h2>
      </header>

      <div className="control-panel__content">
        {/* Environment Preset */}
        <section
          className="control-panel__section"
          data-testid="section-environment-preset"
        >
          <label htmlFor="env-preset" className="control-panel__label">
            Environment Preset
          </label>
          <select
            id="env-preset"
            className="control-panel__select"
            value={draft.preset}
            onChange={(e) => handlePresetChange(e.target.value as EnvironmentPresetValue)}
            data-testid="select-environment-preset"
          >
            {ENVIRONMENT_PRESETS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        {/* Time of Day */}
        <section className="control-panel__section" data-testid="section-time-of-day">
          <label htmlFor="time-of-day" className="control-panel__label">
            Time of Day
          </label>
          <select
            id="time-of-day"
            className="control-panel__select"
            value={draft.timeOfDay}
            onChange={(e) => handleTimeOfDayChange(e.target.value as TimeOfDayValue)}
            data-testid="select-time-of-day"
          >
            {TIME_OF_DAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        {/* Lighting Preset */}
        <section className="control-panel__section" data-testid="section-lighting">
          <label htmlFor="lighting" className="control-panel__label">
            Lighting
          </label>
          <select
            id="lighting"
            className="control-panel__select"
            value={draft.lighting}
            onChange={(e) => handleLightingChange(e.target.value as LightingValue)}
            data-testid="select-lighting"
          >
            {LIGHTING_PRESETS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        {/* Ambience */}
        <section className="control-panel__section" data-testid="section-ambience">
          <label htmlFor="ambience" className="control-panel__label">
            Ambience
          </label>
          <select
            id="ambience"
            className="control-panel__select"
            value={draft.ambience}
            onChange={(e) => handleAmbienceChange(e.target.value as AmbienceValue)}
            data-testid="select-ambience"
          >
            {AMBIENCE_PRESETS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        {/* Weather */}
        <section className="control-panel__section" data-testid="section-weather">
          <label htmlFor="weather" className="control-panel__label">
            Weather
          </label>
          <select
            id="weather"
            className="control-panel__select"
            value={draft.weather}
            onChange={(e) => handleWeatherChange(e.target.value as WeatherValue)}
            data-testid="select-weather"
          >
            {WEATHER_PRESETS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        {/* Object Toggles */}
        <section className="control-panel__section" data-testid="section-objects">
          <h3 className="control-panel__subsection-title">Scene Objects</h3>
          <div className="control-panel__object-list">
            {objects.map((obj) => (
              <label
                key={obj.id}
                className="control-panel__object-item"
                data-testid={`object-toggle-${obj.id}`}
              >
                <input
                  type="checkbox"
                  checked={objectDrafts[obj.id] ?? obj.enabled}
                  onChange={(e) => handleObjectToggle(obj.id, e.target.checked)}
                  className="control-panel__checkbox"
                  data-testid={`checkbox-${obj.id}`}
                />
                <span className="control-panel__object-label">{obj.label}</span>
                <span className="control-panel__object-type">{obj.type}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="control-panel__actions">
          <button
            className="control-panel__btn control-panel__btn--primary"
            onClick={handleApply}
            disabled={applyStatus === "applying" || !hasChanges}
            data-testid="btn-apply-environment"
            aria-busy={applyStatus === "applying"}
          >
            {applyStatus === "applying" ? "Applying..." : "Apply Environment Changes"}
          </button>

          <button
            className="control-panel__btn control-panel__btn--secondary"
            onClick={handleReset}
            disabled={resetStatus === "resetting"}
            data-testid="btn-reset-scene"
            aria-busy={resetStatus === "resetting"}
          >
            {resetStatus === "resetting" ? "Resetting..." : "Reset Scene"}
          </button>
        </div>

        {/* Status Messages */}
        {(applyStatus === "success" || applyStatus === "error") && (
          <div
            className={`control-panel__status control-panel__status--${applyStatus}`}
            data-testid="apply-status"
            role="alert"
            aria-live="polite"
          >
            {applyStatus === "success"
              ? "Environment changes applied"
              : `Error: ${applyError}`}
          </div>
        )}

        {(resetStatus === "success" || resetStatus === "error") && (
          <div
            className={`control-panel__status control-panel__status--${resetStatus}`}
            data-testid="reset-status"
            role="alert"
            aria-live="polite"
          >
            {resetStatus === "success"
              ? "Scene reset to baseline"
              : `Error: ${resetError}`}
          </div>
        )}
      </div>
    </aside>
  );
}

export default ControlPanel;
