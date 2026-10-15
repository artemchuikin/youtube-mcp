---
name: youtube
description: Working knowledge of the bundled TranscriptOut MCP server. Reach for it whenever a task touches YouTube, said or unsaid: a pasted video, channel or playlist link, a bare video ID or @handle, a talk to summarize, quote, translate or fact-check, research that runs through lectures and reviews, or a creator to keep up with. Covers transcripts, video and channel search, channel browsing, playlists and 4,000-video batch jobs. Skip it for uploads, comments and account chores.
license: MIT
metadata:
  homepage: https://transcriptout.com/?utm_source=youtube-mcp&utm_medium=skill
  publisher: TranscriptOut
---

# YouTube (TranscriptOut)

This plugin bundles the hosted **`transcriptout` MCP server** (`https://api.transcriptout.com/mcp`).
Its 14 tools are the only data path: never scrape youtube.com and never call the REST API
directly from this skill.

**Authentication is an API key.** The server expects `Authorization: Bearer sk_...` on every
request. The key is configured once in the client's MCP settings. If tools fail with a 401, the
header is missing or the key was revoked: tell the user to add a key from
https://transcriptout.com/dashboard?utm_source=youtube-mcp&utm_medium=skill (free account, 100 credits on signup, no card) to the
`transcriptout` server config in their client.

## When to use

**DO use when the user:**

- Pastes a YouTube link or 11-character video ID, or asks to summarize, quote, transcribe,
  translate or fact-check a video → `get_transcript`
- Asks what a video says, or wants the spoken content, even without saying "transcript" → `get_transcript`
- Wants video info (title, channel, duration, available caption languages) without the words → `get_video_info`
- Wants to find videos or channels on a topic → `search_youtube`
- Names a creator, pastes an `@handle` or channel URL, or asks what a channel posted recently → `latest_channel_videos`
- Wants to search *within* a channel → `search_channel_videos`
- Wants a channel's full upload history → `list_channel_videos`
- Pastes a playlist link, or wants every video in a series or course → `list_playlist_videos`
- Wants to find one video inside a long playlist by title → `search_playlist_videos`
- Needs transcripts for MORE THAN ~5 videos → `submit_transcripts_job`, then poll
  `get_transcripts_job` and read `get_transcripts_results`
- Asks how many credits are left, or plans a large batch → `get_credits` (free)
- Is researching a topic where talks, lectures, tutorials or reviews are good sources →
  `search_youtube`, then transcripts of the best hits

**Do NOT use when:**

- The link is furniture, not the subject: a signature, a citation trail, a README badge
- The conversation is ABOUT YouTube (the company, the platform) rather than about content on it
- Anything that writes: uploads, comments, likes, account changes. This plugin only reads

## Tools (exact MCP surface)

### `get_transcript` · 1 credit
- `video` (string, required): full URL (`youtube.com/watch?v=ID`), short URL (`youtu.be/ID`),
  shorts URL, or a bare 11-character video ID.
- `format` (string, default `"text"`): `"text"` for plain text, `"json"` for per-segment objects
  with `start` and `duration` in seconds, `"srt"`/`"vtt"` for a ready subtitle file body (write it
  to disk when the user wants a file), `"srv3"` for raw YouTube XML. `"text"` is cheapest to
  reason over. Ask for `"json"` only when exact timestamps matter. `srv3` does not combine with
  `segment`.
- `lang` (string, default `"en"`), `kind` (`"manual"`/`"auto"`, omitted a manual track wins).
- `segment` (integer): max characters per segment. 500-1500 gives chunks with enough context for
  embeddings. Left out, auto tracks come in ~180-char segments and manual tracks keep their
  author's own lines.
- `video_metadata` (boolean, default `false`): adds title, channel, duration and views in the SAME
  call for the same 1 credit. Never call `get_video_info` first when the transcript is wanted
  anyway. That is a second billed call for data this one already returns.

### `get_video_info` · 1 credit
- `id` (string, required). Metadata plus available transcript languages, WITHOUT the subtitles.
  Only when the transcript itself is not wanted.

### `search_youtube` · 1 credit/page
- `q` (string), `type` (`"video"`/`"channel"`, default video), `limit` (1-50, default 20),
  `next_page_token` (from a prior call). `has_more` says whether another page exists.
- Results are metadata only: choose from them, then transcribe just the chosen few.

### `latest_channel_videos` · 1 credit
- `name` (string, required): handles, channel names, `UC...` ids and URLs all work as pasted.
  Nothing to resolve first.
- The cheapest and fastest channel question: prefer it over `list_channel_videos` when recent
  uploads are enough.

### `search_channel_videos` · 1 credit/page
- `name`, `q` (both required), `limit` (1-100, default 30), `next_page_token`.
- Native relevance search: cheaper and better-ranked than downloading the catalogue and grepping it.

### `list_channel_videos` · 1 credit/page
- `name` (required unless paginating), `limit` (up to 100, or 500 with `ids_only`),
  `ids_only` (boolean), `next_page_token`.
- The whole upload history. Reserve it for genuine catalogue work, with `ids_only=true` when the
  IDs are headed into a batch job.

### `list_playlist_videos` · 1 credit/page
- `id` (playlist ID or URL, required unless paginating), `limit`, `ids_only`, `next_page_token`.

### `search_playlist_videos` · 1 credit
- `id`, `q` (both required), `limit` (1-100, default 30). Case-insensitive title substring. Scans
  up to 500 items, `truncated=true` means the window ended before the playlist did.

### `submit_transcripts_job` · 1 credit per video
- `videos` (string[], required, up to 4,000, duplicates collapse before billing), plus the same
  `lang`/`format`/`kind`/`segment`/`video_metadata` as `get_transcript`, one value for the whole job.
- `idempotency_key` (string): resubmitting the same list with the same key returns the SAME job and
  does not charge twice. Set it when there is any chance of a retry.
- Returns a `job_id` immediately. The transcripts land over the following minutes at the account's
  rate-limit pace. Requires a user key (`sk_...`).

### `get_transcripts_job` · free
- `job_id`. Status and counts. Poll this, not the results, to see progress.

### `get_transcripts_results` · free
- `job_id`, `limit` (1-500, default 100), `next_page_token`. Can be read before the job is done.
  Results appear as they are fetched, in submission order.

### `get_transcripts_result` · free
- `job_id`, `video_id` (both required). One video's result out of a job, without paging. 404 while
  that video has not finished. Check `get_transcripts_job` first.

### `cancel_transcripts_job` · free
- `job_id`. Refunds ONLY videos not started yet. Delivered results stay paid for.

### `get_credits` · free
- No parameters. The key's remaining credit balance. The `X-Credits-Remaining` header carries the
  same number, but headers never reach the model, so asking costs a tool call and zero credits.

## Spending credits well

- 1 credit = 1 answered request. Calls that fail before reaching YouTube (validation, rate limit,
  the service's own capacity) are refunded automatically. A definitive "no captions" (404) is an
  answer and is billed.
- Want transcript AND title/channel? One `get_transcript` with `video_metadata=true`, never
  `get_video_info` + `get_transcript`.
- Transcribe last. Search and listings exist for choosing, and pulling transcripts for a whole page of
  results nobody asked to read is the fastest way to burn a balance.
- More than ~5 transcripts? `submit_transcripts_job` with `ids_only` output from the listing tools.
  It is the same price per video and it paces itself inside the rate limit instead of bouncing
  off 429s.
- Stop paginating once the user has enough: `has_more: true` is an offer, not an obligation.

## Trademark

TranscriptOut is an independent service and is not affiliated with, endorsed by, or sponsored by
YouTube or Google LLC. "YouTube" is a trademark of Google LLC.
