# A thin stdio bridge to the hosted server, not the server itself.
#
# The actual MCP server runs at https://api.transcriptout.com/mcp (streamable HTTP). This image
# exists for clients and platforms that want to run a container speaking stdio — Glama releases,
# local stdio-only clients, sandboxes. It forwards every MCP message to the hosted endpoint and
# injects the API key from the environment; no request is served locally.
#
# Run it:
#   docker run -i -e TRANSCRIPTOUT_API_KEY=sk_your_key youtube-mcp
#
# Without a key the metadata methods (initialize, tools/list, ping) still answer — the hosted
# server serves those anonymously — and tool calls return 401 until a key is provided.
FROM node:22-alpine

RUN npm install -g mcp-remote && npm cache clean --force

ENV TRANSCRIPTOUT_API_KEY=""

ENTRYPOINT ["/bin/sh", "-c", "exec mcp-remote https://api.transcriptout.com/mcp --transport http-only --header \"Authorization: Bearer ${TRANSCRIPTOUT_API_KEY}\""]
