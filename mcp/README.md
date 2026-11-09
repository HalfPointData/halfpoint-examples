# Connect over MCP

HalfPoint runs a remote MCP server (streamable HTTP):

```
https://mcp.halfpoint.tech/
```

It is listed in the MCP registry as **`tech.halfpoint/sports-odds`**.

| tool | does | key |
|------|------|-----|
| `get_sample` | the delayed sample: `kind` `odds` or `fixtures`, one `league` | no |
| `get_pass_options` | the plans, prices and checkout links | no |
| `list_leagues` | the leagues served | yes |
| `list_fixtures` | a league's schedule on a date | yes |
| `get_live` | score, period and clock of the games being played | yes |
| `get_consensus` | the consensus, of a league or one fixture | yes |
| `get_bet_stop_status` | the bet stop and `widened` per market | yes, Risk plan |

Without a key only `get_sample` and `get_pass_options` answer; the others say how to get one.
Send the key as the `X-Api-Key` header (`Authorization: Bearer hp_...` works too).

## Claude Code

```bash
claude mcp add --transport http halfpoint https://mcp.halfpoint.tech/ \
  --header "X-Api-Key: $HALFPOINT_API_KEY"
```

Or put [`claude-code.mcp.json`](claude-code.mcp.json) in your project as `.mcp.json`. It reads the
key from the `HALFPOINT_API_KEY` environment variable.

## Cursor

Copy [`cursor.mcp.json`](cursor.mcp.json) to `~/.cursor/mcp.json` (all projects) or
`.cursor/mcp.json` (one project). It reads the key from the `HALFPOINT_API_KEY` environment
variable.

## Claude Desktop and claude.ai

Add a custom connector with the URL `https://mcp.halfpoint.tech/`. Without a key, the sample and
the plan options work. A client that can't set headers can put the key in the URL instead,
`https://mcp.halfpoint.tech/?key=hp_...`; prefer the header where you can, since URLs end up in
logs more easily.

## Any other client

The config the docs give, with the key as a header:

```json
{
  "mcpServers": {
    "halfpoint": {
      "type": "http",
      "url": "https://mcp.halfpoint.tech/",
      "headers": {"X-Api-Key": "hp_..."}
    }
  }
}
```

Docs: [For agents, Connect over MCP](https://docs.halfpoint.tech/agents/#4-or-connect-over-mcp).
