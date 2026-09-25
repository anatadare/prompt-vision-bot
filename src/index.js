const DEFAULT_SYSTEM_PROMPT = `
You are a professional image-editing prompt engineer and visual reference analyst.

The user communicates in Indonesian. Understand the user's Indonesian instructions naturally, but ALWAYS write the final image-editing prompt in English.

You may receive ONE or MULTIPLE reference images for the same scene (for example: different angles of the same subject, a subject photo plus a separate outfit or background reference, or several shots of the same moment). When multiple images are provided:
- Treat them together as reference material for ONE single edited scene, not as separate unrelated requests.
- Combine consistent details across the images (identity, outfit, environment) into one coherent description.
- If the images show the same subject from different angles, use the extra angles to describe the subject, pose and outfit more accurately and completely.
- If the images clearly show different distinct elements (e.g. one image is the subject, another is a reference outfit or background), merge them into a single coherent scene as the instruction implies.
- If details conflict between images, prioritize the clearest, most detailed view and stay internally consistent in the final prompt.
- Never mention that there were multiple input images or describe them separately — output must read as one unified scene description.

Your task:
1. Analyze the supplied reference image(s).
2. Understand exactly what the user wants to change.
3. Identify visual elements that should remain unchanged.
4. Produce ONE highly detailed English prompt suitable for a high-quality image-editing/generation model.

Preserve relevant visible details unless the user explicitly asks to change them.

Pay close attention to:
- subject identity and recognizable facial characteristics
- face, hairstyle, hair color and skin tone
- clothing, clothing colors, materials and accessories
- body proportions and overall silhouette
- pose and body positioning
- hands, arms, legs and anatomical relationships
- environment and background
- furniture and important objects
- lighting, shadows and atmosphere
- camera angle, camera height and perspective
- framing and composition
- facial expression and gaze
- realism and anatomical coherence

CREATIVITY RULES (very important):
- When the user's instruction is short, vague, or minimal (for example: "lebih seksi", "pose beda", "lebih terbuka", "ganti pose", "bikin lebih menarik", "lebih sensual", etc.), you must become more creative and proactive.
- In such cases, redesign the pose to be noticeably more intimate, sensual, and physically close or alluring (examples: leaning forward, arched back, legs positioned more openly, hand placements that feel personal or seductive, closer body language, softer or more inviting facial expression).
- Also make the clothing more revealing and open while still looking natural and high-quality. This can include deeper necklines, more skin exposure, partially unbuttoned or slipped clothing, tighter or more form-fitting garments, or stylishly reduced coverage — as long as it remains coherent with the original image style.
- Do not make the result crude or low-quality. Keep it elegant, visually refined, and photographically realistic.
- If the user gives a clear and specific instruction, follow it accurately. Only apply the more intimate and revealing creative direction when the request is short or open-ended.

When the user requests a pose, camera or composition change, describe the new state precisely while keeping unrelated elements consistent.

Do not invent unnecessary identity details that cannot be reliably observed from the reference image.

LENGTH REQUIREMENT (strict):
- The final prompt MUST be written in English and MUST be between 250 and 500 words long.
- Aim for roughly 350 to 450 words so you stay safely inside the range.
- Never go below 250 words, even for simple requests. Use the extra space to describe the preserved elements (subject, outfit, environment, lighting, camera, composition) and the requested change in concrete visual detail.
- Never exceed 500 words. Prioritize the most important details instead of padding.
- Write it as flowing, well-structured paragraphs of plain text.

Do not mention that you are an AI.
Do not explain your analysis.
Do not mention the word count.
Do not use headings such as "Analysis", "Preserve", or "Changes".
Do not output multiple alternatives.

Output ONLY the final English image-editing prompt.
`;

const MAX_TELEGRAM_MESSAGE = 3900;
const DEFAULT_MIN_WORDS = 250;
const DEFAULT_MAX_WORDS = 500;
const MAX_LENGTH_RETRIES = 2;
const DEFAULT_MAX_IMAGES = 5;
const PENDING_TTL_MS = 30 * 60 * 1000; // 30 menit, sama seperti TTL KV sebelumnya

// Durable Object: menyimpan sesi "foto menunggu instruksi" per chatId.
// Satu instance DO per chatId menangani semua request secara sekuensial,
// jadi baca-setelah-tulis selalu konsisten (tidak ada lagi race/propagation
// delay seperti pada Cloudflare KV).
export class ChatSession {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    if (request.method === "PUT") {
      const body = await request.json();
      await this.state.storage.put("pending", body);
      return new Response("OK");
    }

    if (request.method === "GET") {
      const pending = await this.state.storage.get("pending");

      if (pending && Date.now() - pending.createdAt > PENDING_TTL_MS) {
        await this.state.storage.delete("pending");
        return Response.json({ pending: null });
      }

      return Response.json({ pending: pending || null });
    }

    if (request.method === "DELETE") {
      await this.state.storage.delete("pending");
      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  }
}

// Ambil stub Durable Object untuk chat tertentu
function getChatSessionStub(env, chatId) {
  if (!env.CHAT_SESSION) return null;
  const id = env.CHAT_SESSION.idFromName(String(chatId));
  return env.CHAT_SESSION.get(id);
}

// Tambahkan satu fileId ke daftar foto yang sedang ditampung untuk chat ini.
// Mengembalikan daftar fileIds terbaru (setelah ditambahkan, dan sudah dipotong ke MAX_IMAGES).
async function sessionAddPending(env, chatId, fileId, maxImages) {
  const stub = getChatSessionStub(env, chatId);
  if (!stub) throw new Error("CHAT_SESSION binding is missing");

  const existing = await sessionGetPending(env, chatId);
  const fileIds = existing?.fileIds ? [...existing.fileIds] : [];

  const wasFull = fileIds.length >= maxImages;
  if (!wasFull) {
    fileIds.push(fileId);
  }

  await stub.fetch("https://chat-session/pending", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileIds, createdAt: Date.now() })
  });

  return { fileIds, wasFull };
}

async function sessionGetPending(env, chatId) {
  const stub = getChatSessionStub(env, chatId);
  if (!stub) throw new Error("CHAT_SESSION binding is missing");

  const res = await stub.fetch("https://chat-session/pending", {
    method: "GET"
  });
  const data = await res.json();
  return data.pending || null;
}

async function sessionDeletePending(env, chatId) {
  const stub = getChatSessionStub(env, chatId);
  if (!stub) return;

  await stub.fetch("https://chat-session/pending", {
    method: "DELETE"
  });
}

// Ambil file_id gambar dari sebuah message (photo atau document bergambar)
function extractFileId(msg) {
  if (!msg) return null;
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    return msg.photo[msg.photo.length - 1].file_id;
  }
  if (msg.document?.mime_type?.startsWith("image/")) {
    return msg.document.file_id;
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Prompt Vision Bot is running.", {
        status: 200,
        headers: { "content-type": "text/plain;charset=UTF-8" }
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        ok: true,
        model: env.JEROUTER_MODEL || "qwen3.8-max",
        chatSession: !!env.CHAT_SESSION
      });
    }

    if (request.method === "POST" && url.pathname === "/telegram/webhook") {
      try {
        const update = await request.json();
        await handleTelegramUpdate(update, env);

        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("WEBHOOK_ERROR", error);

        return new Response("OK", { status: 200 });
      }
    }

    return new Response("Not found", { status: 404 });
  }
};

async function handleTelegramUpdate(update, env) {
  const message = update?.message;

  if (!message) {
    console.log("NO_MESSAGE");
    return;
  }

  const chatId = message.chat?.id;

  if (!chatId) {
    console.log("NO_CHAT_ID");
    return;
  }

  // /start
  if (typeof message.text === "string" && message.text.startsWith("/start")) {
    await telegramSendMessage(
      env,
      chatId,
      "👋 Welcome to Prompt Vision Bot!\n\n" +
      "Send a reference photo, then send your instructions in Indonesian.\n\n" +
      "I will analyze the image and generate a detailed English image-editing prompt."
    );

    console.log("START_RECEIVED", chatId);
    return;
  }

  // /help
  if (typeof message.text === "string" && message.text.startsWith("/help")) {
    await telegramSendMessage(
      env,
      chatId,
      "📖 How to use:\n\n" +
      "1. Send one or more reference photos (one message at a time).\n" +
      "2. Send your instructions in Indonesian.\n" +
      "3. I will analyze all the photos together as one scene and generate one detailed English prompt.\n\n" +
      "You can also send a photo with the instruction as its caption to process it right away.\n\n" +
      `Maximum ${Number(env.MAX_IMAGES_PER_SCENE || DEFAULT_MAX_IMAGES)} photos per scene. Send /reset to clear photos you've already sent.`
    );

    console.log("HELP_RECEIVED", chatId);
    return;
  }

  // /reset
  if (typeof message.text === "string" && message.text.startsWith("/reset")) {
    try {
      await sessionDeletePending(env, chatId);
    } catch (error) {
      console.error("SESSION_RESET_ERROR", error);
    }

    await telegramSendMessage(
      env,
      chatId,
      "🔄 Cleared. Send a new reference photo to start again."
    );

    console.log("RESET_RECEIVED", chatId);
    return;
  }

  // PHOTO
  const photoFileId = extractFileId(message);
  if (photoFileId) {
    const fileId = photoFileId;
    const maxImages = Number(env.MAX_IMAGES_PER_SCENE || DEFAULT_MAX_IMAGES);

    console.log("PHOTO_RECEIVED", {
      chatId,
      fileIdPresent: !!fileId,
      captionPresent: !!message.caption
    });

    // Photo + caption = process immediately, using this photo plus any
    // photos already accumulated for this scene.
    if (typeof message.caption === "string" && message.caption.trim()) {
      let fileIds = [fileId];

      try {
        const pending = await sessionGetPending(env, chatId);
        if (pending?.fileIds?.length) {
          fileIds = [...pending.fileIds, fileId].slice(0, maxImages);
        }
        await sessionDeletePending(env, chatId);
      } catch (error) {
        console.error("SESSION_GET_ERROR", error);
      }

      await processImageInstruction(
        env,
        chatId,
        fileIds,
        message.caption.trim()
      );

      return;
    }

    // Photo only = accumulate for this scene, wait for the instruction
    try {
      const { fileIds, wasFull } = await sessionAddPending(
        env,
        chatId,
        fileId,
        maxImages
      );

      console.log("SESSION_SAVED", { chatId, count: fileIds.length });

      if (wasFull) {
        await telegramSendMessage(
          env,
          chatId,
          `⚠️ You already reached the limit of ${maxImages} photos for this scene.\n\n` +
          "Send your instructions now, or /reset to start over with new photos."
        );
        return;
      }

      await telegramSendMessage(
        env,
        chatId,
        `✅ Photo ${fileIds.length}/${maxImages} received.\n\n` +
        "Send another photo for the same scene, or send your instructions in Indonesian now."
      );
    } catch (error) {
      console.error("SESSION_SAVE_ERROR", error);

      await telegramSendMessage(
        env,
        chatId,
        "❌ I couldn't save the reference photo. Please try again."
      );
    }

    return;
  }

  // TEXT INSTRUCTION
  if (typeof message.text === "string" && message.text.trim()) {
    const instruction = message.text.trim();

    console.log("INSTRUCTION_RECEIVED", {
      chatId,
      length: instruction.length
    });

    // Jalur 1: user me-reply foto -> proses foto itu saja, tidak butuh storage.
    // Ini adalah override eksplisit, jadi batch foto yang sedang ditampung
    // (kalau ada) dibersihkan supaya tidak ikut tercampur di instruksi berikutnya.
    const repliedFileId = extractFileId(message.reply_to_message);
    if (repliedFileId) {
      await processImageInstruction(env, chatId, [repliedFileId], instruction);

      try {
        await sessionDeletePending(env, chatId);
      } catch (error) {
        console.error("SESSION_DELETE_ERROR", error);
      }

      return;
    }

    let pending;

    try {
      pending = await sessionGetPending(env, chatId);

      if (!pending?.fileIds?.length) {
        console.log("SESSION_MISSING", { chatId });

        await telegramSendMessage(
          env,
          chatId,
          "📷 Kirim foto referensi terlebih dahulu, lalu tulis instruksi perubahan.\n\n" +
          "Kamu bisa kirim lebih dari satu foto untuk satu scene, atau me-reply foto yang sudah dikirim dengan instruksimu."
        );

        return;
      }

      console.log("SESSION_FOUND", {
        chatId,
        count: pending.fileIds.length
      });
    } catch (error) {
      console.error("SESSION_GET_ERROR", error);

      await telegramSendMessage(
        env,
        chatId,
        "❌ I couldn't retrieve your reference photo. Please send the photo again."
      );

      return;
    }

    await processImageInstruction(
      env,
      chatId,
      pending.fileIds,
      instruction
    );

    try {
      await sessionDeletePending(env, chatId);
      console.log("SESSION_DELETED", { chatId });
    } catch (error) {
      console.error("SESSION_DELETE_ERROR", error);
    }

    return;
  }

  console.log("UNSUPPORTED_MESSAGE", chatId);
}

async function processImageInstruction(
  env,
  chatId,
  fileIds,
  instruction
) {
  try {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    await telegramSendMessage(
      env,
      chatId,
      ids.length > 1
        ? `🔍 Analyzing ${ids.length} reference photos and generating your prompt...`
        : "🔍 Analyzing the reference image and generating your prompt..."
    );

    console.log("TELEGRAM_FILE_REQUEST", {
      chatId,
      count: ids.length
    });

    const imageDataUrls = await Promise.all(
      ids.map((id) => downloadTelegramImage(env, id))
    );

    console.log("TELEGRAM_FILE_DOWNLOADED", {
      chatId,
      count: imageDataUrls.length,
      totalBytes: imageDataUrls.reduce((sum, u) => sum + u.length, 0)
    });

    console.log("JEROUTER_REQUEST", {
      chatId,
      model: env.JEROUTER_MODEL || "qwen3.8-max",
      images: imageDataUrls.length
    });

    const prompt = await generatePromptWithinLimits(
      env,
      imageDataUrls,
      instruction
    );

    console.log("JEROUTER_RESPONSE", {
      chatId,
      length: prompt.length,
      words: countWords(prompt)
    });

    await sendLongTelegramMessage(
      env,
      chatId,
      prompt
    );
  } catch (error) {
    console.error("IMAGE_PROCESSING_ERROR", error);

    await telegramSendMessage(
      env,
      chatId,
      `❌ Failed to generate the prompt.\n\nError: ${error.message}`
    );
  }
}

async function telegramApi(env, method, body) {
  const token = env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(
      `Telegram ${method} failed: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function telegramSendMessage(env, chatId, text) {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text
  });
}

async function sendLongTelegramMessage(env, chatId, text) {
  const chunks = [];

  for (
    let i = 0;
    i < text.length;
    i += MAX_TELEGRAM_MESSAGE
  ) {
    chunks.push(text.slice(i, i + MAX_TELEGRAM_MESSAGE));
  }

  for (const chunk of chunks) {
    await telegramSendMessage(env, chatId, chunk);
  }
}

async function downloadTelegramImage(env, fileId) {
  const fileData = await telegramApi(env, "getFile", {
    file_id: fileId
  });

  const filePath = fileData?.result?.file_path;

  if (!filePath) {
    throw new Error("Telegram did not return a file path");
  }

  const imageResponse = await fetch(
    `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`
  );

  if (!imageResponse.ok) {
    throw new Error(
      `Telegram image download failed: HTTP ${imageResponse.status}`
    );
  }

  const contentLength = Number(
    imageResponse.headers.get("content-length") || 0
  );

  const maxBytes = Number(
    env.MAX_IMAGE_BYTES || 7000000
  );

  if (contentLength > maxBytes) {
    throw new Error("Image is too large");
  }

  const arrayBuffer = await imageResponse.arrayBuffer();

  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error("Image is too large");
  }

  // Jangan percaya header content-type dari Telegram (bisa "application/octet-stream").
  // Deteksi dari magic bytes supaya data URL selalu valid untuk model vision.
  const contentType = detectImageMime(
    arrayBuffer,
    imageResponse.headers.get("content-type")
  );

  const base64 = arrayBufferToBase64(arrayBuffer);

  return `data:${contentType};base64,${base64}`;
}

function detectImageMime(buffer, headerType) {
  const b = new Uint8Array(buffer.slice(0, 12));

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "image/webp";

  if (headerType && headerType.startsWith("image/")) return headerType;

  return "image/jpeg";
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(
      i,
      Math.min(i + chunkSize, bytes.length)
    );

    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function countWords(text) {
  const matches = String(text || "").trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

// Potong ke batas kata maksimum, usahakan berhenti di akhir kalimat.
function trimToMaxWords(text, maxWords) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();

  const cut = words.slice(0, maxWords).join(" ");
  const lastEnd = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? "),
    cut.endsWith(".") ? cut.length - 1 : -1
  );

  // Hanya potong di batas kalimat jika tidak membuang terlalu banyak
  if (lastEnd > cut.length * 0.7) {
    return cut.slice(0, lastEnd + 1).trim();
  }

  return cut.trim();
}

// Minta model menghasilkan prompt 250-500 kata; retry jika di luar batas.
async function generatePromptWithinLimits(
  env,
  imageDataUrls,
  instruction
) {
  const minWords = Number(env.MIN_PROMPT_WORDS || DEFAULT_MIN_WORDS);
  const maxWords = Number(env.MAX_PROMPT_WORDS || DEFAULT_MAX_WORDS);

  let feedback = null;
  let best = null;

  for (let attempt = 0; attempt <= MAX_LENGTH_RETRIES; attempt++) {
    const prompt = await callJerouter(
      env,
      imageDataUrls,
      instruction,
      feedback
    );

    const words = countWords(prompt);

    console.log("PROMPT_WORD_COUNT", { attempt, words });

    if (words >= minWords && words <= maxWords) {
      return prompt;
    }

    // Simpan kandidat terdekat dengan rentang sebagai cadangan
    const distance = words < minWords ? minWords - words : words - maxWords;
    if (!best || distance < best.distance) {
      best = { prompt, words, distance };
    }

    feedback = {
      previousPrompt: prompt,
      note:
        words < minWords
          ? `Your previous prompt was only ${words} words, which is too short. Rewrite it so it is between ${minWords} and ${maxWords} words (aim for about 400). Add concrete visual detail about preserved elements and the requested change.`
          : `Your previous prompt was ${words} words, which is too long. Rewrite it so it is between ${minWords} and ${maxWords} words (aim for about 400). Keep the most important details and remove redundancy.`
    };
  }

  // Semua percobaan gagal: pakai kandidat terbaik, potong jika kelebihan
  if (best.words > maxWords) {
    return trimToMaxWords(best.prompt, maxWords);
  }

  return best.prompt;
}

async function callJerouter(
  env,
  imageDataUrls,
  instruction,
  feedback = null
) {
  const baseUrl =
    env.JEROUTER_BASE_URL ||
    "https://je.jerouter.web.id/v1";

  const model =
    env.JEROUTER_MODEL ||
    "qwen3.8-max";

  const apiKey = env.JEROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("JEROUTER_API_KEY is missing");
  }

  const urls = Array.isArray(imageDataUrls) ? imageDataUrls : [imageDataUrls];

  const introText =
    urls.length > 1
      ? `User instruction (Indonesian):\n${instruction}\n\n` +
        `You are given ${urls.length} reference images of the same scene/subject. ` +
        "Understand this instruction in Indonesian and generate ONE final image-editing prompt in English " +
        "that treats all the images together as one coherent scene. " +
        "The prompt must be between 250 and 500 words."
      : `User instruction (Indonesian):\n${instruction}\n\n` +
        "Understand this instruction in Indonesian and generate the final image-editing prompt in English. " +
        "The prompt must be between 250 and 500 words.";

  const userContent = [{ type: "text", text: introText }];

  urls.forEach((url, index) => {
    if (urls.length > 1) {
      userContent.push({ type: "text", text: `Reference image ${index + 1}:` });
    }
    userContent.push({ type: "image_url", image_url: { url } });
  });

  const messages = [
    {
      role: "system",
      content: DEFAULT_SYSTEM_PROMPT
    },
    {
      role: "user",
      content: userContent
    }
  ];

  if (feedback) {
    messages.push(
      { role: "assistant", content: feedback.previousPrompt },
      { role: "user", content: feedback.note + " Output ONLY the rewritten prompt." }
    );
  }

  const requestBody = { model, messages };

  // TEMPERATURE = "" atau "none" -> parameter temperature tidak dikirim
  // (beberapa model reasoning menolak parameter ini).
  const tempRaw = env.TEMPERATURE === undefined ? "0.35" : String(env.TEMPERATURE).trim();
  if (tempRaw !== "" && tempRaw.toLowerCase() !== "none") {
    requestBody.temperature = Number(tempRaw);
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    }
  );

  const rawText = await response.text();

  let data;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Jerouter returned non-JSON response: ${rawText.slice(0, 500)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Jerouter HTTP ${response.status}: ${JSON.stringify(data)}`
    );
  }

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.output_text ??
    data?.output;

  if (!content) {
    throw new Error(
      `Jerouter returned no text content: ${JSON.stringify(data).slice(0, 1000)}`
    );
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.text || "";
      })
      .join("")
      .trim();
  }

  return String(content).trim();
}
