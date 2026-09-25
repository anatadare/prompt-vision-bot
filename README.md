# Prompt Vision Bot

Telegram + Cloudflare Workers bot that takes a **reference image + natural-language instruction** and returns a detailed image-generation/editing prompt.

**Default vision model:** `qwen3.8-max`

## What it does

```text
Telegram user
    ↓
Reference image + instruction
    ↓
Cloudflare Worker
    ↓
Jerouter V2 / OpenAI-compatible API
    ↓
Qwen3.8-Max Vision
    ↓
Detailed image-editing prompt
    ↓
Telegram
```

The prompt generator is designed around **PRESERVE → CHANGE → CONSTRAIN** so unrelated details are not accidentally changed.

## Project structure

```text
prompt-vision-bot/
├── src/
│   └── index.js
├── .dev.vars.example
├── .gitignore
├── package.json
├── README.md
└── wrangler.toml
```

## GitHub safety

This repository is safe to upload to GitHub as a template. **Do not commit:**

- Telegram bot tokens
- Jerouter API keys
- `.dev.vars`
- `.env` files
- Cloudflare-generated local files

Secrets are configured separately in Cloudflare.

## 1. Clone and install

```bash
npm install
```

## 2. Create Cloudflare KV

```bash
npx wrangler kv namespace create SESSION_KV
```

Copy the returned namespace ID into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SESSION_KV"
id = "YOUR_KV_NAMESPACE_ID"
```

## 3. Configure Jerouter

Update this value in `wrangler.toml`:

```toml
JEROUTER_BASE_URL = "https://YOUR-JEROUTER-ENDPOINT/v1"
```

The current code expects an OpenAI-compatible endpoint:

```text
POST {JEROUTER_BASE_URL}/chat/completions
```

with multimodal `messages` and `image_url`.

> If Jerouter V2 uses a different endpoint or request format, update `callJerouter()` in `src/index.js` after checking the Jerouter API documentation.

## 4. Add secrets

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put JEROUTER_API_KEY
```

For local development, copy `.dev.vars.example` to `.dev.vars` and fill in the values. `.dev.vars` is ignored by Git.

## 5. Test locally

```bash
npm run dev
```

Health endpoint:

```text
GET /health
```

## 6. Deploy

```bash
npm run deploy
```

## 7. Connect Telegram webhook

After deployment, set the webhook to:

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<YOUR-WORKER-DOMAIN>/telegram/webhook
```

Replace `<TOKEN>` and `<YOUR-WORKER-DOMAIN>` with your actual values.

## Bot usage

### Method A — photo + caption

Send a photo with an instruction as its caption.

Example:

```text
Change the pose to a seated sideways pose while preserving the person, outfit, room, furniture, lighting, and overall visual identity.
```

### Method B — photo first

1. Send the reference photo.
2. Send the instruction in the next message.
3. The bot keeps the image temporarily in KV and generates the prompt.

Pending images expire after 30 minutes.

## Environment variables

| Variable | Location | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Secret | Telegram Bot API token |
| `JEROUTER_API_KEY` | Secret | Jerouter API key |
| `JEROUTER_BASE_URL` | `wrangler.toml` | Jerouter API base URL |
| `JEROUTER_MODEL` | `wrangler.toml` | Vision model name |
| `TEMPERATURE` | `wrangler.toml` | LLM temperature |
| `MAX_IMAGE_BYTES` | `wrangler.toml` | Maximum downloaded image size |
| `MIN_PROMPT_WORDS` | `wrangler.toml` | Minimum words in the generated prompt (default 250) |
| `MAX_PROMPT_WORDS` | `wrangler.toml` | Maximum words in the generated prompt (default 500) |
| `MAX_IMAGES_PER_SCENE` | `wrangler.toml` | Maximum number of reference photos accepted for one scene (default 5) |

### Negative prompt

Every generated prompt now includes a negative prompt section appended after the main prompt:

```
<main prompt, 250-500 words>

Negative prompt: distorted body proportions, extra fingers, deformed hands, ...
```

The negative prompt is a short comma-separated list (not counted toward the 250-500 word limit) that always guards against bad anatomy/proportions and against drifting away from what the main prompt describes (identity, outfit, environment, pose). It always refers back to the main prompt rather than introducing new ideas.
| `SESSION_KV` | `wrangler.toml` | Temporary image-session storage |

## Notes

- The Worker does not generate the final image; it generates the **prompt** for another image-generation/editing model.
- Text such as “same person” is only an instruction. Actual identity consistency depends on the downstream image model and its reference-image capabilities.
- The current implementation converts Telegram images to base64 data URLs before sending them to Jerouter.
