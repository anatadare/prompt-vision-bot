#!/usr/bin/env python3
"""Tambah fallback model otomatis ke callJerouter() di src/index.js.
Jalankan dari folder proyek:  python3 patch_fallback.py
"""
import sys
p = "src/index.js"
s = open(p, encoding="utf-8").read()

if "JEROUTER_FALLBACK_MODEL" in s:
    print("Sudah dipatch sebelumnya, tidak ada yang diubah.")
    sys.exit(0)

start_marker = "  const requestBody = { model, messages };"
end_marker = "  let data;\n\n  try {\n    data = JSON.parse(rawText);"
a = s.index(start_marker)
b = s.index(end_marker)

NEW_BLOCK = r'''  const requestBody = { model, messages };

  // TEMPERATURE = "" atau "none" -> parameter temperature tidak dikirim
  // (beberapa model reasoning menolak parameter ini).
  const tempRaw = env.TEMPERATURE === undefined ? "0.35" : String(env.TEMPERATURE).trim();
  if (tempRaw !== "" && tempRaw.toLowerCase() !== "none") {
    requestBody.temperature = Number(tempRaw);
  }

  // MAX_TOKENS (opsional, di wrangler.toml [vars]) -> batasi panjang output.
  const maxTokensRaw = env.MAX_TOKENS ? Number(env.MAX_TOKENS) : 0;
  if (maxTokensRaw > 0) {
    requestBody.max_tokens = maxTokensRaw;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 520, 522, 524]);
  const MAX_HTTP_RETRIES = 1;

  // Daftar model: utama dulu, lalu cadangan (JEROUTER_FALLBACK_MODEL) bila timeout/error server.
  const modelList = [model];
  if (env.JEROUTER_FALLBACK_MODEL && env.JEROUTER_FALLBACK_MODEL !== model) {
    modelList.push(env.JEROUTER_FALLBACK_MODEL);
  }

  let response;
  let rawText = "";

  for (let m = 0; m < modelList.length; m++) {
    requestBody.model = modelList[m];

    for (let i = 0; i <= MAX_HTTP_RETRIES; i++) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });

        rawText = await response.text();

        if (!RETRYABLE_STATUS.has(response.status) || i === MAX_HTTP_RETRIES) {
          break;
        }

        console.warn("JEROUTER_RETRY", { model: modelList[m], attempt: i, status: response.status });
      } catch (err) {
        if (i === MAX_HTTP_RETRIES && m === modelList.length - 1) throw err;
        if (i === MAX_HTTP_RETRIES) break;
        console.warn("JEROUTER_NETWORK_RETRY", { model: modelList[m], attempt: i, err: String(err) });
      }

      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }

    // Sukses -> selesai. Gagal server/timeout dan masih ada model cadangan -> coba model berikutnya.
    if (response && response.ok) break;
    if (m < modelList.length - 1) {
      console.warn("JEROUTER_FALLBACK", { from: modelList[m], to: modelList[m + 1], status: response?.status });
    }
  }

'''

open(p + ".bak", "w", encoding="utf-8").write(s)
s = s[:a] + NEW_BLOCK + s[b:]
open(p, "w", encoding="utf-8").write(s)
print("Patch berhasil. Backup: src/index.js.bak")
