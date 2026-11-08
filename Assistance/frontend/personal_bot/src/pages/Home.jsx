// frontend/personal_bot/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import ConfigModal from "../components/ConfigModal";
import { MODE_LABEL } from "../utils/constants";
import "./Home.css";

const label = (b) =>
  b.assistant_type === "romantic" ? `Romantic AI · ${b.relationship_persona}` : "Personal Assistant";

export default function Home() {
  const nav = useNavigate();
  const [options, setOptions] = useState(null);
  const [bots, setBots] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadErr, setLoadErr] = useState("");

  function load() {
    setLoadErr("");
    Promise.all([api.options(), api.listBots()])
      .then(([o, l]) => {
        setOptions(o);
        setBots(l);
      })
      .catch((e) => setLoadErr(e.message));
  }

  useEffect(load, []);

  async function create(payload) {
    setSaving(true);
    setError("");
    try {
      const bot = await api.createBot(payload);
      nav(`/bots/${bot.id}`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  async function remove(bot) {
    if (!window.confirm(`Delete "${bot.display_name}" with all its chats and memories?`)) return;
    try {
      await api.deleteBot(bot.id);
      setBots((l) => l.filter((x) => x.id !== bot.id));
    } catch (e) {
      setLoadErr(e.message);
    }
  }

  if (loadErr && !bots)
    return (
      <div className="screen">
        <p className="error">{loadErr}</p>
        <button className="btn primary" onClick={load}>Retry</button>
      </div>
    );
  if (!bots || !options) return <div className="screen">Loading…</div>;

  return (
    <div className="home">
      <div className="home-head">
        <h1>My Bots</h1>
        <button className="btn primary" onClick={() => { setError(""); setCreating(true); }}>
          + Create new bot
        </button>
      </div>

      {loadErr && <p className="error" role="alert">{loadErr}</p>}

      {bots.length === 0 ? (
        <p className="empty">No bots yet. Create your first one.</p>
      ) : (
        <div className="bot-grid">
          {bots.map((b) => (
            <div key={b.id} className="bot-card">
              <div className="top">
                <div className="avatar" aria-hidden="true">{b.display_name[0].toUpperCase()}</div>
                <div className="meta">
                  <strong>{b.display_name}</strong>
                  <small>{label(b)}</small>
                </div>
              </div>
              <div className="tags">
                <span className="badge">{MODE_LABEL[b.memory_mode]}</span>
                <span className="badge">{b.model}</span>
              </div>
              <div className="row">
                <Link className="btn primary sm" to={`/bots/${b.id}`}>Open chat</Link>
                <button className="btn ghost sm danger" onClick={() => remove(b)}>Delete</button>
              </div>
            </div>
          ))}
          <button className="bot-new" onClick={() => { setError(""); setCreating(true); }}>
            <span>+</span>
            Create new bot
          </button>
        </div>
      )}

      {creating && (
        <ConfigModal
          options={options}
          initial={null}
          saving={saving}
          error={error}
          onSave={create}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  );
}