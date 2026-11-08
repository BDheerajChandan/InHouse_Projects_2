// frontend/personal_bot/src/pages/BotPage.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import ConfigModal from "../components/ConfigModal";
import Chat from "../components/Chat";

export default function BotPage() {
  const { botId } = useParams();
  const nav = useNavigate();
  const [options, setOptions] = useState(null);
  const [bot, setBot] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    setBot(null);
    setLoadErr("");
    Promise.all([api.options(), api.getBot(botId)])
      .then(([o, b]) => {
        setOptions(o);
        setBot(b);
      })
      .catch((e) => setLoadErr(e.message));
  }, [botId]);

  async function save(payload) {
    setSaving(true);
    setError("");
    try {
      setBot(await api.updateBot(botId, payload));
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadErr)
    return (
      <div className="screen">
        <p className="error">{loadErr}</p>
        <Link className="btn primary" to="/">Back to bots</Link>
      </div>
    );
  if (!bot || !options) return <div className="screen">Loading…</div>;

  return (
    <>
      <Chat
        key={botId}
        botId={botId}
        cfg={bot}
        onBack={() => nav("/")}
        onDeleted={() => nav("/")}
        onSettings={() => {
          setError("");
          setEditing(true);
        }}
      />
      {editing && (
        <ConfigModal
          options={options}
          initial={bot}
          saving={saving}
          error={error}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      )}
    </>
  );
}