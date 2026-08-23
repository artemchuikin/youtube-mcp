#!/usr/bin/env node
// Local MCP server for TranscriptOut: 14 YouTube tools over stdio, backed by the REST API at
// api.transcriptout.com. This IS a server, not a proxy — tools are declared and executed here,
// and each handler makes one HTTPS call to the corresponding REST endpoint, the same way any
// SaaS-backed MCP server (Stripe, Exa, Tavily) talks to its cloud.
//
// Configuration comes from the environment:
//   TRANSCRIPTOUT_API_KEY   sk_... key from https://transcriptout.com/dashboard. Optional for
//                           connecting and listing tools; required for tool calls.
//   TRANSCRIPTOUT_API_BASE  override for testing (default https://api.transcriptout.com).
//
// Tool definitions live in tools.json (a snapshot of the hosted catalog). At startup the server
// tries to refresh them from the live catalog — anonymously, tools/list is free — and silently
// keeps the snapshot when offline, so the container works in sandboxes with no egress.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const BASE = (process.env.TRANSCRIPTOUT_API_BASE || "https://api.transcriptout.com").replace(/\/+$/, "");
const KEY = (process.env.TRANSCRIPTOUT_API_KEY || "").trim();

const here = path.dirname(fileURLToPath(import.meta.url));
let TOOLS = JSON.parse(readFileSync(path.join(here, "tools.json"), "utf8"));

// name -> how the REST API is called. `body: true` sends the arguments as JSON instead of query
// params; `{placeholders}` in the path are filled from arguments and removed from the rest.
const ROUTES = {
  get_transcript:          { method: "GET",  path: "/v1/transcript" },
  get_video_info:          { method: "GET",  path: "/v1/video" },
  search_youtube:          { method: "GET",  path: "/v1/search" },
  list_channel_videos:     { method: "GET",  path: "/v1/channel/videos" },
  search_channel_videos:   { method: "GET",  path: "/v1/channel/search" },
  latest_channel_videos:   { method: "GET",  path: "/v1/channel/latest" },
  list_playlist_videos:    { method: "GET",  path: "/v1/playlist/videos" },
  search_playlist_videos:  { method: "GET",  path: "/v1/playlist/search" },
  submit_transcripts_job:  { method: "POST", path: "/v1/transcripts", body: true },
  get_transcripts_job:     { method: "GET",  path: "/v1/transcripts/{job_id}" },
  get_transcripts_results: { method: "GET",  path: "/v1/transcripts/{job_id}/results" },
  get_transcripts_result:  { method: "GET",  path: "/v1/transcripts/{job_id}/results/{video_id}" },
  cancel_transcripts_job:  { method: "POST", path: "/v1/transcripts/{job_id}/cancel" },
  get_credits:             { method: "GET",  path: "/auth/me" },
};

async function refreshTools() {
  try {
    const r = await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      signal: AbortSignal.timeout(4000),
    });
    const d = await r.json();
    if (Array.isArray(d?.result?.tools) && d.result.tools.length) TOOLS = d.result.tools;
  } catch {
    // offline or the catalog is unreachable: the embedded snapshot serves
  }
}

function failure(status, code, detail, requestId) {
  return {
    content: [{ type: "text", text: JSON.stringify({ ok: false, code, detail, request_id: requestId ?? null }) }],
    isError: true,
  };
}

function renderText(name, data) {
  // A text transcript reads better as text: header, separator, the words. Everything else is JSON.
  if (name === "get_transcript" && typeof data?.transcript === "string") {
    const head = ["video_id", "language", "kind"].filter((k) => data[k]).map((k) => `${k}: ${data[k]}`).join("\n");
    const rest = { ...data };
    delete rest.transcript;
    const meta = data.metadata ? `\n${JSON.stringify(data.metadata)}` : "";
    return head ? `${head}${meta}\n---\n${data.transcript}` : data.transcript;
  }
  return JSON.stringify(data);
}

async function callTool(name, args) {
  const route = ROUTES[name];
  if (!route) return failure(404, "unknown_tool", `Unknown tool: ${name}`);
  if (!KEY) {
    return failure(401, "unauthorized",
      "TRANSCRIPTOUT_API_KEY is not set. Create a free key at https://transcriptout.com/dashboard " +
      "(100 credits on signup, no card) and pass it as an environment variable.");
  }

  const rest = { ...args };
  const filled = route.path.replace(/\{(\w+)\}/g, (_, k) => {
    const v = rest[k];
    delete rest[k];
    return encodeURIComponent(String(v ?? ""));
  });

  const headers = { authorization: `Bearer ${KEY}`, accept: "application/json" };
  let url = `${BASE}${filled}`;
  let body;
  if (route.body) {
    if (rest.idempotency_key != null) {
      headers["idempotency-key"] = String(rest.idempotency_key);
      delete rest.idempotency_key;
    }
    headers["content-type"] = "application/json";
    body = JSON.stringify(rest);
  } else {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(rest)) if (v != null) q.set(k, String(v));
    const qs = q.toString();
    if (qs) url += `?${qs}`;
  }

  let resp;
  try {
    resp = await fetch(url, { method: route.method, headers, body, signal: AbortSignal.timeout(120_000) });
  } catch (e) {
    return failure(503, "unreachable", `Could not reach ${BASE}: ${e?.message ?? e}`);
  }

  let envelope;
  try {
    envelope = await resp.json();
  } catch {
    return failure(resp.status, "bad_response", `Non-JSON response (HTTP ${resp.status})`);
  }
  if (!resp.ok || envelope?.ok === false) {
    return failure(resp.status, envelope?.code ?? "error", envelope?.detail ?? `HTTP ${resp.status}`,
      envelope?.request_id);
  }

  const data = envelope?.data ?? envelope;
  return {
    content: [{ type: "text", text: renderText(name, data) }],
    structuredContent: data,
    isError: false,
  };
}

const server = new Server(
  { name: "youtube-transcript-api", title: "YouTube Transcript & Search MCP Server", version: "1.0.2" },
  { capabilities: { tools: { listChanged: false } } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) =>
  callTool(req.params.name, req.params.arguments ?? {}));

await refreshTools();
await server.connect(new StdioServerTransport());
console.error(`transcriptout mcp: ${TOOLS.length} tools, backend ${BASE}, key ${KEY ? "set" : "NOT set"}`);
