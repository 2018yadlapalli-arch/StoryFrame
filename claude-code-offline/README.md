# Claude Code — Offline Install (Linux x64 / glibc)

Files to install [Claude Code](https://github.com/anthropics/claude-code) on a Linux
x64 (glibc) machine that has **no internet access**.

Version: `2.1.196`

## Why two pieces

`npm install @anthropic-ai/claude-code` normally downloads a ~245 MB native binary at
postinstall time. That download needs internet, so for an offline box the binary is
shipped separately:

| Piece | Where | Notes |
|-------|-------|-------|
| Native binary (`...-linux-x64-2.1.196.tgz`, ~73 MB) | **GitHub Release** of this repo | Too big for the repo; download from Releases |
| npm wrapper (`anthropic-ai-claude-code-2.1.196.tgz`, ~20 KB) | this folder | Optional — only needed for the npm install route |
| `install-linux.sh` | this folder | One-command installer |

## Install (no Node.js required)

1. Download `anthropic-ai-claude-code-linux-x64-2.1.196.tgz` from this repo's
   [Releases](../../releases) page.
2. Put it next to `install-linux.sh`, then run:

   ```bash
   bash install-linux.sh
   ```

That extracts the standalone `claude` executable to `~/.local/bin/claude`. Ensure
`~/.local/bin` is on your `PATH`, then verify:

```bash
claude --version
```

## Using Vertex AI

Create `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_USE_VERTEX": "1",
    "CLOUD_ML_REGION": "us-east5",
    "ANTHROPIC_VERTEX_PROJECT_ID": "your-gcp-project-id"
  }
}
```

Authenticate with `gcloud auth application-default login` (or set
`GOOGLE_APPLICATION_CREDENTIALS`). Note: running models via Vertex AI still requires
network access to Google Cloud — only the *install* is offline.
