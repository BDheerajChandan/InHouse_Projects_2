// frontend/personal_bot/src/components/Panel.jsx
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { MODE_INFO, MODE_LABEL } from "../utils/constants";

export default function Panel({ botId, cfg, convId, onClose, onOpen, onCurrentGone, onCleared, onDeleted }) {
  const [tab, setTab] = useState("memory");
  const [mems, setMems] = useState([]);
  const [convs, setConvs] = useState([]);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setErr("");
      const [m, c] = await Promise.all([api.listMemories(botId), api.listConvs(botId)]);
      setMems(m);
      setConvs(c);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  async function run(fn) {
    try {
      setErr("");
      await fn();
    } catch (e) {
      setErr(e.message);
    }
  }

  const saveEdit = () =>
    run(async () => {
      await api.updateMemory(botId, edit.id, edit.content);
      setMems((m) => m.map((x) => (x.id === edit.id ? { ...x, content: edit.content } : x)));
      setEdit(null);
    });

  const delMem = (id) =>
    run(async () => {
      await api.deleteMemory(botId, id);
      setMems((m) => m.filter((x) => x.id !== id));
    });

  const clearMems = () =>
    window.confirm("Delete all saved memories of this bot?") &&
    run(async () => {
      await api.clearMemories(botId);
      setMems([]);
    });

  const delConv = (id) =>
    window.confirm("Delete this conversation?") &&
    run(async () => {
      await api.deleteConv(botId, id);
      setConvs((c) => c.filter((x) => x.id !== id));
      if (id === convId) onCurrentGone();
    });

  const clearCurrent = () =>
    window.confirm("Clear all messages in the current conversation?") &&
    run(async () => {
      await api.clearConv(botId, convId);
      onCleared();
    });

  const deleteBot = () =>
    window.confirm(`Delete "${cfg.display_name}" with all its chats and memories? This cannot be undone.`) &&
    run(async () => {
      await api.deleteBot(botId);
      onDeleted();
    });

  return (
    <aside className="panel" aria-label="Memory and chats">
      <div className="row between">
        <div className="tabs" role="tablist">
          {["memory", "chats"].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
              {t === "memory" ? "Memory" : "Chats"}
            </button>
          ))}
        </div>
        <button className="icon" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
      </div>

      {err && <p className="error" role="alert">{err}</p>}

      {tab === "memory" ? (
        <div className="stack">
          <p>
            <strong>{MODE_LABEL[cfg.memory_mode]}</strong>
            <small className="block">{MODE_INFO[cfg.memory_mode]}</small>
          </p>
          {cfg.memory_mode !== "long_term" && mems.length > 0 && (
            <small className="block">Saved memories below are not used in this mode.</small>
          )}
          {mems.length === 0 && <small className="block">No saved memories.</small>}
          {mems.map((m) => (
            <div key={m.id} className="item">
              {edit?.id === m.id ? (
                <>
                  <input value={edit.content} maxLength={200} onChange={(e) => setEdit({ ...edit, content: e.target.value })} />
                  <div className="row">
                    <button className="btn primary sm" onClick={saveEdit}>Save</button>
                    <button className="btn ghost sm" onClick={() => setEdit(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <span>{m.content}</span>
                  <div className="row">
                    <button className="btn ghost sm" onClick={() => setEdit({ id: m.id, content: m.content })}>Edit</button>
                    <button className="btn ghost sm danger" onClick={() => delMem(m.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {mems.length > 0 && (
            <button className="btn ghost danger" onClick={clearMems}>Clear all memories</button>
          )}
        </div>
      ) : (
        <div className="stack">
          {convId && <button className="btn ghost" onClick={clearCurrent}>Clear current conversation</button>}
          {convs.length === 0 && <small className="block">No conversations yet.</small>}
          {convs.map((c) => (
            <div key={c.id} className={`item ${c.id === convId ? "current" : ""}`}>
              <button className="link" onClick={() => onOpen(c.id)}>{c.title}</button>
              <button className="btn ghost sm danger" onClick={() => delConv(c.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <button className="btn ghost danger wipe" onClick={deleteBot}>Delete this bot</button>
    </aside>
  );
}