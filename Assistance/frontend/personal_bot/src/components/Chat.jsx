// frontend/personal_bot/src/components/Chat.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { api, streamChat } from "../services/api";
import { APP_LABEL, MODE_LABEL } from "../utils/constants";
import Markdown from "./Markdown";
import Panel from "./Panel";

const patchLast = (list, fn) => list.map((x, i) => (i === list.length - 1 ? fn(x) : x));

export default function Chat({ botId, cfg, onBack, onSettings, onDeleted }) {
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState(false);
  const abortRef = useRef(null);
  const listRef = useRef(null);
  const stickRef = useRef(true);
  const busyRef = useRef(false);

  const openConv = useCallback(
    async (id) => {
      setLoading(true);
      setNotice("");
      try {
        setMessages(await api.getMessages(botId, id));
        setConvId(id);
      } catch (e) {
        setNotice(e.message);
      } finally {
        setLoading(false);
      }
    },
    [botId]
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listConvs(botId);
        if (list.length) await openConv(list[0].id);
        else setLoading(false);
      } catch (e) {
        setNotice(e.message);
        setLoading(false);
      }
    })();
  }, [botId, openConv]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onScroll() {
    const el = listRef.current;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function run({ content = "", regenerate = false }) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice("");
    const ctl = new AbortController();
    abortRef.current = ctl;
    const rid = crypto.randomUUID();
    let placed = false;
    let saved = false;
    try {
      let cid = convId;
      if (!cid) {
        cid = (await api.createConv(botId)).id;
        setConvId(cid);
      }
      setMessages((m) => {
        const base = regenerate
          ? m.filter((x, i) => !(i === m.length - 1 && x.role === "assistant"))
          : [...m, { key: rid, role: "user", content }];
        return [...base, { key: rid + "a", role: "assistant", content: "", pending: true }];
      });
      placed = true;
      stickRef.current = true;
      await streamChat(botId, cid, { content, request_id: rid, regenerate }, ctl.signal, (ev) => {
        saved = true;
        if (ev.type === "delta") setMessages((m) => patchLast(m, (x) => ({ ...x, content: x.content + ev.text })));
        else if (ev.type === "done") setMessages((m) => patchLast(m, (x) => ({ ...x, id: ev.id, pending: false })));
        else if (ev.type === "error") throw new Error(ev.message);
      });
    } catch (e) {
      if (!placed) setNotice(e.message);
      else if (e.name === "AbortError") setMessages((m) => patchLast(m, (x) => ({ ...x, pending: false })));
      else
        setMessages((m) =>
          patchLast(m, (x) => ({ ...x, pending: false, error: e.message, retry: { content, saved } }))
        );
    } finally {
      busyRef.current = false;
      setBusy(false);
      abortRef.current = null;
    }
  }

  function send() {
    const t = input.trim();
    if (!t || busyRef.current) return;
    setInput("");
    run({ content: t });
  }

  function retry(msg) {
    if (msg.retry.saved) run({ regenerate: true });
    else {
      setMessages((m) => m.slice(0, -2));
      run({ content: msg.retry.content });
    }
  }

  function newChat() {
    abortRef.current?.abort();
    setConvId(null);
    setMessages([]);
    setNotice("");
  }

  function exportChat() {
    const text = messages
      .filter((m) => m.content)
      .map((m) => `**${m.role === "user" ? "You" : cfg.display_name}:** ${m.content}`)
      .join("\n\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    a.download = `${cfg.display_name}-chat.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  const visible = messages.filter((m) => m.content || m.pending || m.error);
  const last = visible[visible.length - 1];
  const label =
    cfg.assistant_type === "romantic" ? `Romantic AI · ${cfg.relationship_persona}` : "Personal Assistant";

  return (
    <div className="chat">
      <header className="header">
        <button className="btn ghost sm" onClick={onBack}>← Bots</button>
        <div className="avatar" aria-hidden="true">{cfg.display_name[0].toUpperCase()}</div>
        <div className="who">
          <strong>{cfg.display_name}</strong>
          <small>{label}</small>
        </div>
        <span className="badge" title="Current memory mode">{MODE_LABEL[cfg.memory_mode]}</span>
        <div className="row">
          <button className="btn ghost sm" onClick={() => setPanel((p) => !p)}>Memory & chats</button>
          <button className="btn ghost sm" onClick={onSettings}>Settings</button>
          {visible.length > 0 && <button className="btn ghost sm" onClick={exportChat}>Export</button>}
          <button className="btn primary sm" onClick={newChat}>New chat</button>
        </div>
      </header>

      <div className="body">
        <main className="messages" ref={listRef} onScroll={onScroll} aria-live="polite">
          {loading && <p className="muted center-text">Loading…</p>}
          {!loading && visible.length === 0 && (
            <div className="msg bot">
              <div className="bubble">
                {cfg.greeting || `Hi, I'm ${cfg.display_name}. What's on your mind today?`}
              </div>
            </div>
          )}
          {visible.map((m, i) => (
            <div key={m.id || m.key} className={`msg ${m.role === "user" ? "me" : "bot"}`}>
              <div className={`bubble ${m.error ? "failed" : ""}`}>
                {m.content ? <Markdown text={m.content} /> : m.pending ? <span className="dots">Thinking…</span> : null}
                {m.error && (
                  <div className="row">
                    <span className="error">{m.error}</span>
                    <button className="btn ghost sm" onClick={() => retry(m)} disabled={busy}>Retry</button>
                  </div>
                )}
              </div>
              {m.role === "assistant" && m.content && !m.pending && (
                <div className="row actions">
                  <button className="link" onClick={() => navigator.clipboard.writeText(m.content)}>Copy</button>
                  {i === visible.length - 1 && !busy && !m.error && (
                    <button className="link" onClick={() => run({ regenerate: true })}>Regenerate</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {notice && <p className="error" role="alert">{notice}</p>}
        </main>

        {panel && (
          <Panel
            botId={botId}
            cfg={cfg}
            convId={convId}
            onClose={() => setPanel(false)}
            onOpen={(id) => openConv(id)}
            onCurrentGone={newChat}
            onCleared={() => setMessages([])}
            onDeleted={onDeleted}
          />
        )}
      </div>

      <footer className="composer">
        <div className="row grow">
          <textarea
            rows={1}
            value={input}
            placeholder={`Message ${cfg.display_name}…`}
            aria-label="Message"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={4000}
          />
          {busy ? (
            <button className="btn danger" onClick={() => abortRef.current?.abort()}>Stop</button>
          ) : (
            <button className="btn primary" onClick={send} disabled={!input.trim() || last?.pending}>Send</button>
          )}
        </div>
        <small className="muted">
          {cfg.display_name} is an AI, not a real person. · {APP_LABEL}
        </small>
      </footer>
    </div>
  );
}