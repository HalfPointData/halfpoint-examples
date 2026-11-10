# Fair odds API for coding agents

HalfPoint publishes one fair price per game, built from live order books and updated as they move. For a coding agent, this repository has an [`AGENTS.md`](../AGENTS.md) (and a `CLAUDE.md` that imports it) that says which example to start from, the environment variable to read the key from, and where the docs are.

What an agent can read without a key:

- The free sample answers without a key: one league, delayed, 10 fixtures.
- https://docs.halfpoint.tech/llms.txt lists every documentation page as Markdown.
- Both API hosts serve an OpenAPI 3.0 description of every route, its parameters and errors, without a key.

You can use it over REST with an API key, or as tools over MCP. An MCP server (streamable HTTP) at https://mcp.halfpoint.tech/ offers the same data as tools. Without a key, only get_sample and get_pass_options answer.

- Examples: [positive EV](../python/positive_ev.py), [distance from fair](../python/distance_from_fair.py), [line movement](../python/line_movement.py), with TypeScript versions in [`typescript/`](../typescript/)
- MCP client configs: [`mcp/`](../mcp/)
- Docs for agents: https://docs.halfpoint.tech/agents/
