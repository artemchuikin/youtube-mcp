# Builds and runs the local MCP server (server.js): 14 YouTube tools over stdio, each backed by
# one HTTPS call to the TranscriptOut REST API — the same shape as any SaaS-backed MCP server.
# The hosted streamable-HTTP endpoint at https://api.transcriptout.com/mcp remains the zero-install
# path; this image is for stdio clients, sandboxes and catalog deployments.
#
# Run it:
#   docker run -i -e TRANSCRIPTOUT_API_KEY=sk_your_key transcriptout-mcp
#
# Without a key the server still connects and lists all tools; tool calls answer with a clear 401
# that says where to get one (free, 100 credits on signup).
FROM node:22-alpine

WORKDIR /app
COPY package.json server.js tools.json ./
RUN npm install --omit=dev && npm cache clean --force

ENV TRANSCRIPTOUT_API_KEY=""

CMD ["node", "server.js"]
