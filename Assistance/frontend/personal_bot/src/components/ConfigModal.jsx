// frontend/personal_bot/src/components/ConfigModal.jsx
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { MODE_INFO, MODE_LABEL } from "../utils/constants";

const NAMES = { assistant: "Nova", Girlfriend: "Aria", Boyfriend: "Aiden" };

export default function ConfigModal({ options, initial, saving, error, onSave, onCancel }) {
  const tb = options.token_budget || { min: 500, max: 32000, default: 3000 };

  const [type, setType] = useState(initial?.assistant_type || "assistant");
  const [persona, setPersona] = useState(initial?.relationship_persona || "");
  const [traits, setTraits] = useState({
    assistant: initial?.assistant_type === "assistant" ? initial.personality_traits : [],
    romantic: initial?.assistant_type === "romantic" ? initial.personality_traits : [],
  });
  const [style, setStyle] = useState(initial?.conversation_style || options.styles[0]);
  const [name, setName] = useState(initial?.display_name || NAMES.assistant);
  const [nameTouched, setNameTouched] = useState(!!initial);
  const [language, setLanguage] = useState(initial?.preferred_language || "English");
  const [length, setLength] = useState(initial?.response_length || "Balanced");
  const [greeting, setGreeting] = useState(initial?.greeting || "");
  const [prompt, setPrompt] = useState(initial?.custom_prompt || "");
  const [mode, setMode] = useState(initial?.memory_mode || "session");
  const [budget, setBudget] = useState(initial?.token_budget || tb.default);
  const [adult, setAdult] = useState(initial?.adult_confirmed || false);
  const [errs, setErrs] = useState([]);

  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(initial?.provider || "");
  const [model, setModel] = useState(initial?.model || "");
  const [models, setModels] = useState([]);
  const [mState, setMState] = useState({ loading: false, error: "" });

  const romantic = type === "romantic";
  const traitList = romantic ? options.romantic_traits : options.assistant_traits;
  const selected = traits[type];
  const activeProvider = providers.find((p) => p.id === provider);
  const modelOptions = model && !models.includes(model) ? [model, ...models] : models;

  useEffect(() => {
    api
      .providers()
      .then((list) => {
        setProviders(list);
        setProvider((cur) => cur || list.find((p) => p.configured)?.id || "");
      })
      .catch((e) => setMState({ loading: false, error: e.message }));
  }, []);

  function loadModels(pid, refresh = false) {
    if (!pid) return;
    setMState({ loading: true, error: "" });
    api
      .models(pid, refresh)
      .then((list) => {
        setModels(list);
        setModel((m) => (list.includes(m) ? m : list[0] || m));
        setMState({ loading: false, error: list.length ? "" : "No models returned for this provider." });
      })
      .catch((e) => {
        setModels([]);
        setMState({ loading: false, error: e.message });
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadModels(provider), [provider]);

  function chooseProvider(id) {
    setProvider(id);
    setModel("");
    setModels([]);
  }

  function chooseType(t) {
    setType(t);
    if (!nameTouched) setName(t === "assistant" ? NAMES.assistant : persona ? NAMES[persona] : name);
  }

  function choosePersona(p) {
    setPersona(p);
    if (!nameTouched) setName(NAMES[p]);
  }

  function toggle(t) {
    setTraits((s) => ({
      ...s,
      [type]: s[type].includes(t) ? s[type].filter((x) => x !== t) : [...s[type], t],
    }));
  }

  function reset() {
    setType("assistant");
    setPersona("");
    setTraits({ assistant: [], romantic: [] });
    setStyle(options.styles[0]);
    setName(NAMES.assistant);
    setNameTouched(false);
    setLanguage("English");
    setLength("Balanced");
    setGreeting("");
    setPrompt("");
    setMode("session");
    setBudget(tb.default);
    setAdult(false);
    setModel(models[0] || "");
    setErrs([]);
  }

  function submit(e) {
    e.preventDefault();
    const list = [];
    const budgetNum = Number(budget);
    if (romantic && !persona) list.push("Choose Girlfriend or Boyfriend.");
    if (romantic && !adult) list.push("Confirm you are 18 or older to use romantic mode.");
    if (!selected.length) list.push("Select at least one personality trait.");
    if (!name.trim()) list.push("Enter a name for your companion.");
    if (!provider) list.push("Choose an AI provider.");
    if (!model) list.push("Choose a model.");
    if (!Number.isInteger(budgetNum) || budgetNum < tb.min || budgetNum > tb.max)
      list.push(`Token budget must be between ${tb.min} and ${tb.max}.`);
    setErrs(list);
    if (list.length) return;
    onSave({
      assistant_type: type,
      relationship_persona: romantic ? persona : null,
      display_name: name.trim(),
      personality_traits: selected,
      conversation_style: style,
      preferred_language: language.trim() || "English",
      response_length: length,
      greeting: greeting.trim(),
      custom_prompt: prompt.trim(),
      provider,
      model,
      token_budget: budgetNum,
      memory_mode: mode,
      adult_confirmed: romantic && adult,
    });
  }

  return (
    <div className="backdrop">
      <form className="modal" onSubmit={submit} aria-labelledby="cfg-title">
        <h1 id="cfg-title">{initial ? "Companion settings" : "Set up your companion"}</h1>

        <fieldset>
          <legend>Assistant type</legend>
          <div className="cards">
            <label className="card">
              <input type="radio" name="type" checked={!romantic} onChange={() => chooseType("assistant")} />
              <span className="card-body">
                <strong>🧭 Personal Assistant</strong>
                <small>Motivation, emotional support, everyday guidance, productivity, learning and career growth.</small>
              </span>
            </label>
            <label className="card">
              <input type="radio" name="type" checked={romantic} onChange={() => chooseType("romantic")} />
              <span className="card-body">
                <strong>💞 Romantic AI Companion</strong>
                <small>A customizable AI that talks with a fictional romantic persona you choose.</small>
              </span>
            </label>
          </div>
        </fieldset>

        {romantic && (
          <fieldset>
            <legend>Persona</legend>
            <div className="row">
              {options.personas.map((p) => (
                <label key={p} className="radio">
                  <input type="radio" name="persona" checked={persona === p} onChange={() => choosePersona(p)} />
                  {p}
                </label>
              ))}
            </div>
            <label className="radio check">
              <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
              I confirm I am 18 or older. I understand this is a fictional AI persona, not a real person.
            </label>
          </fieldset>
        )}

        <label className="field">
          Companion name
          <input
            value={name}
            maxLength={40}
            onChange={(e) => {
              setName(e.target.value);
              setNameTouched(true);
            }}
          />
        </label>

        <fieldset>
          <legend>AI provider & model</legend>
          <div className="stack">
            <label className="field">
              Provider
              <select value={provider} onChange={(e) => chooseProvider(e.target.value)}>
                <option value="" disabled>
                  Select provider…
                </option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id} disabled={!p.configured}>
                    {p.label} — {p.configured ? `key ${p.key_preview}` : "no API key in .env"}
                  </option>
                ))}
              </select>
            </label>
            {activeProvider?.configured && <small>API key in use: {activeProvider.key_preview}</small>}
            <label className="field">
              Model
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!provider || mState.loading}>
                {!modelOptions.length && <option value="">{mState.loading ? "Loading models…" : "No models available"}</option>}
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <button type="button" className="btn ghost sm" disabled={!provider || mState.loading} onClick={() => loadModels(provider, true)}>
                Refresh models
              </button>
              {mState.error && <span className="error">{mState.error}</span>}
            </div>
          </div>
        </fieldset>

        <label className="field">
          How should the bot behave? (optional)
          <textarea
            rows={4}
            maxLength={1500}
            value={prompt}
            placeholder="e.g. Talk like a close friend, keep messages short, call me Dheeraj, remind me to take breaks."
            onChange={(e) => setPrompt(e.target.value)}
          />
          <small>{prompt.length}/1500</small>
        </label>

        <fieldset>
          <legend>Personality traits</legend>
          <div className="chips">
            {traitList.map((t) => (
              <label key={t} className="chip">
                <input type="checkbox" checked={selected.includes(t)} onChange={() => toggle(t)} />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Conversation style</legend>
          <div className="chips">
            {options.styles.map((s) => (
              <label key={s} className="chip">
                <input type="radio" name="style" checked={style === s} onChange={() => setStyle(s)} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Memory</legend>
          <div className="stack">
            {options.memory_modes.map((m) => (
              <label key={m} className="radio">
                <input type="radio" name="memory" checked={mode === m} onChange={() => setMode(m)} />
                <span>
                  <strong>{MODE_LABEL[m]}</strong>
                  <small className="block">{MODE_INFO[m]}</small>
                </span>
              </label>
            ))}
            {mode !== "disabled" && (
              <label className="field">
                Token budget (max conversation history per reply)
                <input
                  type="number"
                  min={tb.min}
                  max={tb.max}
                  step={100}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
                <small>
                  {tb.min}–{tb.max} tokens
                </small>
              </label>
            )}
          </div>
        </fieldset>

        <details>
          <summary>Advanced settings</summary>
          <div className="stack pad">
            <label className="field">
              Preferred language
              <input value={language} maxLength={30} onChange={(e) => setLanguage(e.target.value)} />
            </label>
            <label className="field">
              Response length
              <select value={length} onChange={(e) => setLength(e.target.value)}>
                {options.lengths.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Greeting message (optional)
              <input value={greeting} maxLength={300} placeholder="Hey, how was your day?" onChange={(e) => setGreeting(e.target.value)} />
            </label>
            <button type="button" className="btn ghost" onClick={reset}>
              Reset configuration
            </button>
          </div>
        </details>

        {[...errs, ...(error ? [error] : [])].map((m) => (
          <p key={m} className="error" role="alert">
            {m}
          </p>
        ))}

        <div className="row end">
          {onCancel && (
            <button type="button" className="btn ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="btn primary" disabled={saving}>
            {saving ? "Saving…" : initial ? "Save settings" : "Start chatting"}
          </button>
        </div>
      </form>
    </div>
  );
}