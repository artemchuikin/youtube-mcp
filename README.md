<!-- mcp-name: com.transcriptout/youtube-transcript-and-youtube-search -->

<p align="center">
  <a href="https://transcriptout.com/?utm_source=youtube-mcp&utm_medium=readme">
    <img src="public/brand/logo-512.png" width="120" height="120" alt="TranscriptOut" />
  </a>
</p>

<h1 align="center">YouTube Transcript &amp; Search MCP Server</h1>

<p align="center">
  <b>Let your AI agent read YouTube.</b><br/>
  Transcripts in five formats, native video and channel search, channel and playlist listings,
  and background jobs that deliver up to 4,000 transcripts at a time. 14 tools behind one hosted
  endpoint. Nothing runs on your machine.
</p>

<p align="center">
  <a href="https://cursor.com/en/install-mcp?name=transcriptout&config=eyJ1cmwiOiJodHRwczovL2FwaS50cmFuc2NyaXB0b3V0LmNvbS9tY3AifQ=="><img alt="Install in Cursor" src="https://img.shields.io/badge/Cursor-Install_MCP-000000?style=for-the-badge&logo=cursor&logoColor=white"/></a>
  <a href="https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22transcriptout%22%2C%22url%22%3A%22https%3A%2F%2Fapi.transcriptout.com%2Fmcp%22%7D"><img alt="Install in VS Code" src="https://img.shields.io/badge/VS_Code-Install_MCP-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white"/></a>
</p>

<p align="center">
  <a href="https://transcriptout.com/?utm_source=youtube-mcp&utm_medium=readme"><img src="https://img.shields.io/badge/Website-transcriptout.com-FF3B00?style=for-the-badge" alt="Website"/></a>
  <a href="https://transcriptout.com/docs?utm_source=youtube-mcp&utm_medium=readme"><img src="https://img.shields.io/badge/Docs-API_Reference-06B6D4?style=for-the-badge&logo=readthedocs&logoColor=white" alt="Docs"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-4CAF50?style=for-the-badge" alt="MIT License"/></a>
</p>

<p align="center">
  <a href="#-why">Why</a> ·
  <a href="#-quick-start">Quick start</a> ·
  <a href="#-the-14-tools">Tools</a> ·
  <a href="#-install-in-your-client">Install</a> ·
  <a href="#-recipes">Recipes</a> ·
  <a href="#-pricing-and-limits">Pricing</a> ·
  <a href="#-when-a-call-fails">Errors</a>
</p>

---

## 🎬 Why

Everyone who works with an agent has run this exchange at least once.

```txt
You:   Summarize this. https://www.youtube.com/watch?v=kCc8FmEb1nY
Agent: I'm not able to watch videos. If you paste the transcript here, I'll gladly help!
```

The transcript is precisely the thing the agent cannot get on its own. With this server
connected, the same message simply resolves.

```txt
You:   Summarize this. https://www.youtube.com/watch?v=kCc8FmEb1nY
Agent: → get_transcript(video="kCc8FmEb1nY", video_metadata=true)      1 credit

       That's "Let's build GPT: from scratch, in code, spelled out" by Andrej
       Karpathy, 1:56:20. He starts from an empty file and a bigram model,
       derives self-attention step by step, and ends with a working GPT that...
```

Reading one video is rarely where the job ends. Here is how the three ways of getting YouTube
data into an agent actually compare.

|                          | This server | Local yt-dlp / scraper MCP | Google YouTube Data API |
| ------------------------ | ----------- | -------------------------- | ----------------------- |
| Transcripts              | ✅ any public video, 5 formats | ⚠️ blocked on datacenter IPs, breaks when YouTube changes markup | ❌ not served at all |
| Setup                    | ✅ a URL and an API key | ❌ local install, binaries to keep alive | ❌ Cloud project, OAuth consent screens |
| YouTube search           | ✅ native, 1 credit per page | ❌ | ⚠️ 100 quota units per search |
| Channels & playlists     | ✅ 100 videos/page, or 500 bare IDs | ❌ one video at a time | ⚠️ quota-metered per item |
| Bulk transcripts         | ✅ 4,000 per background job | ❌ | ❌ |
| RAG-ready chunking       | ✅ 20-5,000 chars, word-level timestamps | ❌ | ❌ |
| When YouTube changes     | ✅ fixed server-side, nothing to update | ❌ you patch and redeploy | ✅ |
| Failed calls             | ✅ credits refund themselves | ❌ your retry logic | ⚠️ quota spent anyway |

---

## ⚡ Quick start

**1. Get an API key.** Sign up at [transcriptout.com](https://transcriptout.com/?utm_source=youtube-mcp&utm_medium=readme) and create a key
in the [dashboard](https://transcriptout.com/dashboard?utm_source=youtube-mcp&utm_medium=readme). New accounts receive 100 free credits and
no card is asked. Keys start with `sk_` and are shown once.

**2. Point your client at the server.** It speaks streamable HTTP and authenticates with one
Bearer header.

```json
{
  "mcpServers": {
    "transcriptout": {
      "url": "https://api.transcriptout.com/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

One-click buttons for Cursor and VS Code sit at the top of this page. Exact snippets for the rest
live under [Install in your client](#-install-in-your-client).

**3. Paste a link.**

```txt
Summarize this talk and pull the three strongest quotes.
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

The agent picks `get_transcript` on its own, reads the timed text and answers from it. Every
response carries an `X-Credits-Remaining` header, so the budget stays in view the whole session.

---

## 🧰 The 14 tools

All 14 tools are exposed automatically once you connect. **Most calls cost 1 credit.** Credits
are refunded automatically when a call fails before reaching YouTube (validation errors, rate
limits, our own capacity), so you pay for answers, not for failures. A definitive "this video has no
captions" is an answer and is billed like one.

### 1. `get_transcript` · 1 credit

Fetch the transcript of any YouTube video. `format=text` (default) returns plain readable text,
cheapest for a model to reason over, and `format=json` returns timed segments.

| Parameter        | Type    | Default      | Description                                                    |
| ---------------- | ------- | ------------ | -------------------------------------------------------------- |
| `video`          | string  | **required** | YouTube URL (full or short) or 11-char video ID                |
| `lang`           | string  | `"en"`       | Language code of the track (`en`, `de`, ...)                   |
| `format`         | string  | `"text"`     | `"text"` (plain text), `"json"` (segments with `start`/`duration` in seconds), `"srt"`/`"vtt"` (subtitle file body), `"srv3"` (raw YouTube XML) |
| `kind`           | string  | auto-detect  | `"manual"` or `"auto"`. Left out, a manual track wins and auto is the fallback |
| `segment`        | integer | see below    | Max characters per segment. 500-1500 makes RAG-ready chunks    |
| `video_metadata` | boolean | `false`      | Add title, channel, duration and views in the SAME call, same 1 credit |

Left out, `segment` cuts auto-generated tracks into ~180-character segments and returns manual
tracks exactly as their author broke them. Pass it whenever you need one size regardless of which
track answers.

**Example output (`format=json`):**

```json
{
  "video_id": "dQw4w9WgXcQ",
  "language": "en",
  "kind": "manual",
  "transcript": [
    { "text": "Never gonna give you up", "start": 18.0, "duration": 4.12 },
    { "text": "Never gonna let you down", "start": 22.12, "duration": 3.85 }
  ]
}
```

> `srt` and `vtt` come back as complete subtitle file bodies, ready to be written to disk by the
> agent. `srv3` is the raw source XML and does not combine with `segment`.

### 2. `get_video_info` · 1 credit

Metadata for one video (title, channel, duration, views, thumbnails) plus the list of available
transcript languages, WITHOUT downloading the subtitles.

| Parameter | Type   | Default      | Description                |
| --------- | ------ | ------------ | -------------------------- |
| `id`      | string | **required** | YouTube video ID or URL    |

> **Credit hygiene:** if you are going to fetch the transcript anyway, call `get_transcript` with
> `video_metadata=true` instead. It returns both for one credit where these are two calls and two.

### 3. `search_youtube` · 1 credit/page

Search YouTube for videos or channels. Paginate with `next_page_token`. `has_more` tells you
whether another page exists.

| Parameter         | Type    | Default   | Description                          |
| ----------------- | ------- | --------- | ------------------------------------ |
| `q`               | string  | required* | Search query (*unless paginating)    |
| `type`            | string  | `"video"` | `"video"` or `"channel"`             |
| `limit`           | integer | `20`      | Results per page, 1-50               |
| `next_page_token` | string  |           | Token from a previous result         |

### 4. `list_channel_videos` · 1 credit/page

List videos from a channel's Videos tab, newest first. Accepts an `@handle`, a channel name, a
`UC...` channel ID or a channel URL.

| Parameter         | Type    | Default   | Description                                        |
| ----------------- | ------- | --------- | -------------------------------------------------- |
| `name`            | string  | required* | `@handle`, channel name, `UC...` ID or URL         |
| `limit`           | integer | `100`     | Page size, up to 500 with `ids_only`               |
| `ids_only`        | boolean | `false`   | Return just `video_ids[]`, up to 500 per page      |
| `next_page_token` | string  |           | Token from a previous result                       |

> `ids_only=true` is the cheap way to feed `submit_transcripts_job`.

### 5. `search_channel_videos` · 1 credit/page

Search inside one channel using YouTube's native relevance search. A result whose title lacks the
query word is normal. Results are ranked by relevance, not by substring.

| Parameter         | Type    | Default   | Description                          |
| ----------------- | ------- | --------- | ------------------------------------ |
| `name`            | string  | required  | `@handle`, channel name, `UC...` ID or URL |
| `q`               | string  | required  | Query to search within the channel   |
| `limit`           | integer | `30`      | Results per page, 1-100              |
| `next_page_token` | string  |           | Pagination token                     |

### 6. `latest_channel_videos` · 1 credit

The ~15 most recent videos of a channel from its RSS feed. The fastest and cheapest way to check
what a channel published recently.

| Parameter | Type   | Default      | Description                                |
| --------- | ------ | ------------ | ------------------------------------------ |
| `name`    | string | **required** | `@handle`, channel name, `UC...` ID or URL |

### 7. `list_playlist_videos` · 1 credit/page

Every video of a playlist in playlist order. Accepts a `PL...` playlist ID or a URL with `list=`.

| Parameter         | Type    | Default   | Description                                   |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `id`              | string  | required* | Playlist ID or URL                            |
| `limit`           | integer | `100`     | Page size, up to 500 with `ids_only`          |
| `ids_only`        | boolean | `false`   | Return just `video_ids[]`, up to 500 per page |
| `next_page_token` | string  |           | Pagination token                              |

### 8. `search_playlist_videos` · 1 credit

Find videos inside a playlist by a substring of the title (case-insensitive). YouTube has no native
playlist search, so this scans up to 500 playlist items. `truncated=true` means there may be more
matches beyond the scanned window.

| Parameter | Type    | Default  | Description                        |
| --------- | ------- | -------- | ---------------------------------- |
| `id`      | string  | required | Playlist ID or URL                 |
| `q`       | string  | required | Substring to match in video titles |
| `limit`   | integer | `30`     | Max matches, 1-100                 |

### 9. `submit_transcripts_job` · 1 credit per video

Queue transcripts for MANY videos at once (up to 4,000) and get a `job_id` back immediately. The
work continues in the background at your rate limit's pace. Use this instead of calling
`get_transcript` in a loop for more than a handful of videos.

| Parameter         | Type     | Default      | Description                                          |
| ----------------- | -------- | ------------ | ---------------------------------------------------- |
| `videos`          | string[] | **required** | Video IDs or URLs, up to 4,000. Duplicates collapse BEFORE billing |
| `lang`            | string   | `"en"`       | One language for the whole job                       |
| `format`          | string   | `"text"`     | `"text"`, `"json"`, `"srt"`, `"vtt"` or `"srv3"`, one for the whole job |
| `kind`            | string   | auto-detect  | `"manual"` or `"auto"`                               |
| `segment`         | integer  |              | One segment size for the whole job                   |
| `video_metadata`  | boolean  | `false`      | Metadata per video, no extra cost                    |
| `idempotency_key` | string   |              | Resubmitting the same list with the same key returns the SAME job, no double charge |

Requires a user key (`sk_...`). Credits are charged on submit and refunded per video when a video
could not be delivered through our fault.

### 10. `get_transcripts_job` · free

Progress of a batch job: status (`queued`/`running`/`done`/`cancelled`), how many videos are ready,
failed and pending. Polling a job you already paid for costs nothing.

### 11. `get_transcripts_results` · free

Finished transcripts from a batch job, in the order submitted, paged with `next_page_token`
(`limit` 1-500, default 100). Results appear as they are fetched, so you can read before the job is
done. Each entry is exactly what `get_transcript` returns for that video, plus its status.

### 12. `get_transcripts_result` · free

One video's result out of a batch job, by its video id, without paging through the whole result
set. A 404 means the job does not exist or this video has not finished yet, so check
`get_transcripts_job` before concluding anything.

| Parameter  | Type   | Default      | Description                                    |
| ---------- | ------ | ------------ | ---------------------------------------------- |
| `job_id`   | string | **required** | Job id from `submit_transcripts_job`           |
| `video_id` | string | **required** | One of the video ids the job was submitted with |

### 13. `cancel_transcripts_job` · free

Cancel a batch job. Credits are refunded ONLY for videos not started yet. Anything already fetched
stays in the results and stays paid for.

### 14. `get_credits` · free

The remaining credit balance of the key, with no parameters. The balance also rides in the
`X-Credits-Remaining` header of every response, but headers are invisible to the model, so the
number a user actually asks about needs a tool. Handy right before a large batch too, since the
batch charges 1 credit per video on submit.

---

## 🔌 Install in your client

The server is remote, so every install below is a config entry and nothing more. All of them want the same two values, the URL and the Bearer header from [Quick start](#-quick-start).

> **Worth doing once, a standing rule for your client**
>
> With this in your client's rules/instructions, pasting a YouTube link is enough and the word
> "transcript" never has to be typed:
>
> ```txt
> Whenever a YouTube link or video ID appears in my message, call the
> transcriptout get_transcript tool first and answer from the transcript,
> whether I asked for a summary, a quote, a translation or a question.
> ```

<details>
<summary><b>Install in Cursor (One-Click / Manual)</b></summary>

**One-Click Install:**

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=transcriptout&config=eyJ1cmwiOiJodHRwczovL2FwaS50cmFuc2NyaXB0b3V0LmNvbS9tY3AifQ==)

After installing, open the server settings and add the `Authorization` header with your key.

**Manual configuration** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "transcriptout": {
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Code (CLI)</b></summary>

```sh
claude mcp add --transport http transcriptout https://api.transcriptout.com/mcp \
  --header "Authorization: Bearer YOUR_API_KEY"
```

</details>

<details>
<summary><b>Claude Desktop & Claude Web</b></summary>

Claude's custom connectors authenticate remote servers via OAuth, which TranscriptOut does not
offer yet (API keys only). On desktop, use **Claude Code** (see above), which supports API-key
headers. OAuth support is on the roadmap. Watch the [changelog](https://transcriptout.com/changelog?utm_source=youtube-mcp&utm_medium=readme).

</details>

<details>
<summary><b>Install in VS Code</b></summary>

[<img alt="Install in VS Code" src="https://img.shields.io/badge/VS_Code-Install_TranscriptOut_MCP-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22transcriptout%22%2C%22url%22%3A%22https%3A%2F%2Fapi.transcriptout.com%2Fmcp%22%7D)

Or add this to VS Code user settings (`settings.json`):

```json
"mcp.servers": {
  "transcriptout": {
    "type": "http",
    "url": "https://api.transcriptout.com/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}
```

</details>

<details>
<summary><b>Install in OpenAI Agent Builder</b></summary>

1. Create a new Agent
2. Under "Actions" or "Tools", add a new **MCP Server**
3. URL: `https://api.transcriptout.com/mcp`
4. Auth Type: **API Key**
5. Paste your API key from the [dashboard](https://transcriptout.com/dashboard?utm_source=youtube-mcp&utm_medium=readme)

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "transcriptout": {
      "serverUrl": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Cline</b></summary>

```json
{
  "mcpServers": {
    "transcriptout": {
      "url": "https://api.transcriptout.com/mcp",
      "type": "streamableHttp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

In Zed `settings.json`:

```json
{
  "context_servers": {
    "transcriptout": {
      "source": "remote",
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

```json
{
  "mcpServers": {
    "transcriptout": {
      "type": "streamable-http",
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Amp</b></summary>

```sh
amp mcp add transcriptout https://api.transcriptout.com/mcp --header "Authorization: Bearer YOUR_API_KEY"
```

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

In `settings.json` under `augment.advanced`:

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "transcriptout",
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  ]
}
```

</details>

<details>
<summary><b>Install in Kilo Code</b></summary>

In `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "transcriptout": {
      "type": "streamable-http",
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in JetBrains AI Assistant</b></summary>

In Settings → Tools → AI Assistant → MCP:

```json
{
  "mcpServers": {
    "transcriptout": {
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

In `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "transcriptout": {
      "httpUrl": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Qwen Coder</b></summary>

In `~/.qwen/settings.json`:

```json
{
  "mcpServers": {
    "transcriptout": {
      "httpUrl": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Google Antigravity</b></summary>

```json
{
  "mcpServers": {
    "transcriptout": {
      "serverUrl": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Trae</b></summary>

```json
{
  "mcpServers": {
    "transcriptout": {
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in LM Studio</b></summary>

In `mcp.json`:

```json
{
  "mcpServers": {
    "transcriptout": {
      "url": "https://api.transcriptout.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Warp</b></summary>

In Settings → AI → MCP:

```json
{
  "transcriptout": {
    "url": "https://api.transcriptout.com/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Perplexity Desktop</b></summary>

In Settings → Connectors → Advanced:

```json
{
  "url": "https://api.transcriptout.com/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

</details>

---

## 🧩 Install as an Agent Plugin

This repository root is a conformant **[Agent Plugins 1.0.0](https://agent-plugins.org/specification)**
package, the portable format supported by ChatGPT, Codex, Cursor, GitHub Copilot, Kiro and VS Code.
One install gets you the MCP server **and** a bundled `youtube` skill that teaches your agent when
to use each tool and how not to waste credits.

```text
plugin.json                # manifest
mcp.json                   # hosted MCP server, streamable-http
skills/youtube/SKILL.md    # when + how to use the 14 tools
```

**VS Code.** Command Palette → **Chat: Install Plugin From Source**, then paste:

```txt
https://github.com/artemchuikin/youtube-mcp
```

Or register a local clone in `settings.json`:

```json
"chat.pluginLocations": { "/absolute/path/to/youtube-mcp": true }
```

**Cursor.** **Customize** in the sidebar → find the plugin → **Install**. For a local clone:

```bash
git clone https://github.com/artemchuikin/youtube-mcp ~/.cursor/plugins/local/transcriptout
```

Then **Developer: Reload Window**.

**ChatGPT, Codex, GitHub Copilot, Kiro, any other client.** Point your client's plugin mechanism at
this repository, or at a local clone. Agent Plugins 1.0.0 standardizes the *package format*, not
installation, so each client owns its own install flow.

There are **no credentials in this package**, Agent Plugins 1.0.0 forbids embedded secrets. The
server authenticates with an API key you add in your client's MCP settings (see
[Keys and security](#-keys-and-security)). Verify the package yourself:

```bash
curl -sO https://agent-plugins.org/schemas/1.0.0/plugin.schema.json
curl -sO https://agent-plugins.org/schemas/1.0.0/mcp.schema.json
npx ajv-cli@5 validate --spec=draft2020 -s plugin.schema.json -d plugin.json
npx ajv-cli@5 validate --spec=draft2020 -s mcp.schema.json    -d mcp.json
```

---

## 🔑 Keys and security

- A key is shown once, at creation. Keep it in an environment variable and out of version control.
- A leaked key dies the moment you revoke it in the [dashboard](https://transcriptout.com/dashboard?utm_source=youtube-mcp&utm_medium=readme).
  An account holds up to 20 keys, so give every machine its own.
- Prefer to stay in the chat? An agent with the companion
  [youtube-skills](https://github.com/artemchuikin/youtube-skills) installed can open the account
  and mint the key for you, by email and a 6-digit code, no browser involved.
- There is no OAuth flow yet, so clients whose connectors cannot send a custom header (Claude
  Desktop and Claude Web) should go through Claude Code for now.

## 🐳 Run it locally

The hosted endpoint needs no install, but stdio-only clients, sandboxes and container platforms
sometimes want a process of their own. The repo carries one: `server.js` is a complete local MCP
server (official SDK, stdio transport) whose 14 tools each make one HTTPS call to the TranscriptOut
REST API — the same shape as any SaaS-backed MCP server.

```bash
# as a container
docker build -t transcriptout-mcp https://github.com/artemchuikin/youtube-mcp.git
docker run -i -e TRANSCRIPTOUT_API_KEY=sk_your_key transcriptout-mcp

# or straight from a checkout (Node 20+)
npm install && TRANSCRIPTOUT_API_KEY=sk_your_key node server.js
```

Without a key it still connects and lists all tools; tool calls answer with a clear 401 that says
where to get one. Tool definitions ship in `tools.json` and refresh from the live catalog at
startup when the network allows, so the local list never goes stale.

---

## 🍳 Recipes

Every prompt below is paste-able as written.

| Use Case                        | Example Prompt                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| 📝 **Summarize a video**        | "Summarize the key points from this video: [URL]"                                              |
| 🔍 **Research a topic**         | "Search YouTube for the 5 most-watched videos on neural radiance fields and summarize each."      |
| 🧠 **Study notes**              | "Create study notes from this MIT lecture series playlist: [PLAYLIST URL]"                     |
| ⚖️ **Compare perspectives**     | "Compare arguments in these two videos: [URL1] [URL2]"                                         |
| 🌐 **Translate**                | "Translate this video's transcript to Spanish: [URL]"                                          |
| ✍️ **Repurpose content**        | "Turn this video into a 1,500-word blog post: [URL]"                                           |
| 📡 **Monitor a creator**        | "Each morning, list new uploads from @kurzgesagt and tell me which to watch."                 |
| 🏛️ **Build a content database** | "Pull every video ID from @3blue1brown and queue a transcript batch for all of them."          |
| 🎯 **Competitor analysis**      | "Search inside @fireship for any video about [competitor product] and summarize the takeaways." |
| 🧩 **RAG ingestion**            | "Fetch this playlist's transcripts as JSON with segment=1000 and load them into the index."    |

**The bulk recipe spelled out.** "Archive a whole channel" is four tool calls, not a script:

1. `list_channel_videos` with `ids_only=true`: up to 500 video IDs per page
2. `submit_transcripts_job` with those IDs (up to 4,000, duplicates dropped before billing,
   `idempotency_key` makes a retry free)
3. `get_transcripts_job` until `status` is `done`. The job paces itself inside your rate limit
4. `get_transcripts_results` page by page, readable while the job still runs

Anything the service fails to deliver is refunded per video, so the bill matches the archive.

---

## 💳 Pricing and limits

| Plan             | Price                  | Credits                     | Rate Limit  |
| ---------------- | ---------------------- | --------------------------- | ----------- |
| **Free**         | $0                     | 100 on signup (one-time)    | 200 req/min |
| **Starter**      | $4.49/month            | 1,000/month                 | 200 req/min |
| **Starter Annual** | $45.29/year (~$3.77/mo) | 1,000/month               | 200 req/min |
| **Scale**        | slider up to $198.99/mo | up to 100,000/month        | 200 req/min |

- Subscriptions are a slider from 1,000 to 100,000 credits/month in steps of 1,000, and the per-1,000
  rate falls with volume (10,000/mo is $27.49, not $44.90). The annual discount grows with volume,
  from ~16% to ~35%.
- **1 credit = 1 answered request.** Calls that fail before reaching YouTube (validation, rate
  limit, our capacity) are refunded automatically. The running balance rides in the
  `X-Credits-Remaining` header.
- One-time credit packs that never expire can be bought on top of an active subscription.
- [View pricing](https://transcriptout.com/?utm_source=youtube-mcp&utm_medium=readme#pricing) · [Manage billing](https://transcriptout.com/billing?utm_source=youtube-mcp&utm_medium=readme)

---

## 🧯 When a call fails

<details>
<summary><b>Authentication errors (401)</b></summary>

- Verify your API key starts with `sk_`
- Check for extra spaces when copying
- Ensure the key is active in your [dashboard](https://transcriptout.com/dashboard?utm_source=youtube-mcp&utm_medium=readme)
- Revoked keys fail immediately. Issue a new one in the dashboard
</details>

<details>
<summary><b>No credits (402)</b></summary>

- Check your balance in the [dashboard](https://transcriptout.com/dashboard?utm_source=youtube-mcp&utm_medium=readme)
- Subscribe or buy a credit pack at [transcriptout.com/billing](https://transcriptout.com/billing?utm_source=youtube-mcp&utm_medium=readme)
</details>

<details>
<summary><b>Video not available (404 / 410 / 451)</b></summary>

- `404`: the video has no captions on the requested language/track, or the ID is wrong. This is a
  definitive answer, retrying won't change it.
- `410`: the video was removed.
- `451`: age-restricted or members-only content.
</details>

<details>
<summary><b>Rate limiting (429) and capacity (503)</b></summary>

- Respect the `Retry-After` header. Both are refunded automatically
- For bulk work use `submit_transcripts_job`: it paces itself inside your rate limit instead of
  bouncing off it
</details>

<details>
<summary><b>Errors are structured</b></summary>

Every error body is `{"ok": false, "code": "...", "detail": "...", "request_id": "req_..."}`.
Branch on the machine-readable `code`, not on the human text. Include `request_id` when contacting
support.
</details>

---

## 🌐 Prefer plain REST?

Building an app instead of an agent? The same backend ships as a JSON REST API, with the same
five transcript formats plus raw file download (`download=true`).

|                 | MCP                    | REST API                                              |
| --------------- | ---------------------- | ----------------------------------------------------- |
| **Best for**    | AI assistants & agents | Apps & backend services                               |
| **Setup**       | Add a URL + key        | Code integration                                      |
| **Get started** | This README            | [API docs →](https://transcriptout.com/docs?utm_source=youtube-mcp&utm_medium=readme)          |

Base URL: `https://api.transcriptout.com/v1`

Client libraries wrap it for Python and Node.js. Both are drop-in replacements for the popular
open-source ones, so switching is one import line.

```bash
pip install transcriptout   # replaces youtube-transcript-api
npm i transcriptout         # replaces youtube-transcript
```

Source: [youtube-transcript-python](https://github.com/artemchuikin/youtube-transcript-python) ·
[youtube-transcript-js](https://github.com/artemchuikin/youtube-transcript-js)

---

## 🔗 Links

- 🌐 **Website:** [transcriptout.com](https://transcriptout.com/?utm_source=youtube-mcp&utm_medium=readme)
- 📚 **Docs:** [transcriptout.com/docs](https://transcriptout.com/docs?utm_source=youtube-mcp&utm_medium=readme)
- 🧰 **Agent skills (same backend, no MCP required):** [github.com/artemchuikin/youtube-skills](https://github.com/artemchuikin/youtube-skills)
- 🐍 **Python library:** [github.com/artemchuikin/youtube-transcript-python](https://github.com/artemchuikin/youtube-transcript-python)
- 📦 **Node.js library:** [github.com/artemchuikin/youtube-transcript-js](https://github.com/artemchuikin/youtube-transcript-js)
- 💬 **Contact:** support@transcriptout.com

---

## 📇 MCP Registry

This server is published to the official [Model Context Protocol Registry](https://registry.modelcontextprotocol.io/)
under the name:

```
com.transcriptout/youtube-transcript-and-youtube-search
```

---

TranscriptOut is an independent service and is not affiliated with, endorsed by, or sponsored by
YouTube or Google LLC. "YouTube" is a trademark of Google LLC.

<p align="center">
  <sub>© 2026 TranscriptOut · Released under the <a href="./LICENSE">MIT License</a></sub>
</p>
