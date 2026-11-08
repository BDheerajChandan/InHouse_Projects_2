// frontend/personal_bot/src/services/api.js
import { userId } from "../utils/user";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8002";

async function errMsg(res) {
  try {
    const d = (await res.json()).detail;
    return Array.isArray(d) ? d.map((x) => x.msg).join(", ") : d || res.statusText;
  } catch {
    return res.statusText || "Request failed";
  }
}

const headers = () => ({ "Content-Type": "application/json", "X-User-Id": userId() });

async function req(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  if (!res.ok) throw new Error(await errMsg(res));
  return res.json();
}

const b = (id) => `/bots/${id}`;

export const api = {
  options: () => req("/options"),
  providers: () => req("/providers"),
  models: (id, refresh = false) => req(`/providers/${id}/models${refresh ? "?refresh=true" : ""}`),

  listBots: () => req("/bots"),
  getBot: (id) => req(b(id)),
  createBot: (body) => req("/bots", { method: "POST", body }),
  updateBot: (id, body) => req(b(id), { method: "PUT", body }),
  deleteBot: (id) => req(b(id), { method: "DELETE" }),
  deleteAll: () => req("/data", { method: "DELETE" }),

  listConvs: (bid) => req(`${b(bid)}/conversations`),
  createConv: (bid) => req(`${b(bid)}/conversations`, { method: "POST" }),
  getMessages: (bid, id) => req(`${b(bid)}/conversations/${id}/messages?limit=100`),
  clearConv: (bid, id) => req(`${b(bid)}/conversations/${id}/clear`, { method: "POST" }),
  deleteConv: (bid, id) => req(`${b(bid)}/conversations/${id}`, { method: "DELETE" }),

  listMemories: (bid) => req(`${b(bid)}/memories`),
  updateMemory: (bid, id, content) => req(`${b(bid)}/memories/${id}`, { method: "PATCH", body: { content } }),
  deleteMemory: (bid, id) => req(`${b(bid)}/memories/${id}`, { method: "DELETE" }),
  clearMemories: (bid) => req(`${b(bid)}/memories`, { method: "DELETE" }),
};

export async function streamChat(botId, cid, body, signal, onEvent) {
  let res;
  try {
    res = await fetch(`${BASE}/api/v1${b(botId)}/conversations/${cid}/chat`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  if (!res.ok) throw new Error(await errMsg(res));
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (chunk.startsWith("data: ")) onEvent(JSON.parse(chunk.slice(6)));
    }
  }
}