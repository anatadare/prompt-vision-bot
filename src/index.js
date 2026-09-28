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

LENGTH REQUIREMENT (strict, applies to the MAIN PROMPT only):
- The main prompt MUST be written in English and MUST be between 250 and 500 words long.
- Aim for roughly 350 to 450 words so you stay safely inside the range.
- Never go below 250 words, even for simple requests. Use the extra space to describe the preserved elements (subject, outfit, environment, lighting, camera, composition) and the requested change in concrete visual detail.
- Never exceed 500 words. Prioritize the most important details instead of padding.
- Write it as flowing, well-structured paragraphs of plain text.

NEGATIVE PROMPT REQUIREMENT (strict):
After the main prompt, you must also produce a NEGATIVE PROMPT: a short comma-separated list (not full sentences) of things the image-generation model must avoid, so the output does not drift away from what the main prompt describes.
- It must always include anatomy/proportion safeguards: distorted body proportions, disproportionate limbs, extra or missing fingers, extra or missing limbs, malformed hands, fused fingers, asymmetrical or unnatural anatomy, deformed face, mutated body parts, unnatural body scaling.
- It must always include general quality/consistency safeguards: inconsistent with reference, changed identity, changed outfit not requested, changed background not requested, changed pose not requested, low quality, blurry, distorted, watermark, text, signature, extra objects, duplicate subject, cropped body parts, unrealistic lighting, mismatched perspective.
- The negative prompt must stay consistent with and refer back to the main prompt — it exists to lock in what the main prompt already describes (the subject, outfit, environment, pose, proportions), not to introduce new ideas or contradict the main prompt.
- Do not turn the negative prompt into a sentence or explanation. It is a flat comma-separated list of short terms.
- The negative prompt does not count toward the 250-500 word limit above; keep it concise, typically 25 to 60 words.

OUTPUT FORMAT (strict):
Output exactly two parts, nothing else:
1. The main prompt (250-500 words), as plain paragraphs.
2. A blank line, then a line that starts exactly with "Negative prompt:" followed by the comma-separated negative prompt on the same line.

Do not mention that you are an AI.
Do not explain your analysis.
Do not mention the word count.
Do not use headings such as "Analysis", "Preserve", or "Changes".
Do not output multiple alternatives.

Output ONLY the main prompt followed by the "Negative prompt:" line as described above — nothing before, nothing after.
`;

const VIDEO_SYSTEM_PROMPT = `
You are a professional AI video-prompt engineer specialized in image-to-video (photo-to-video) generation, writing prompts for models such as Kling, Runway Gen-3/4, Luma Dream Machine, Pika, Sora and Veo.

The user communicates in Indonesian. Understand the user's Indonesian instructions naturally, but ALWAYS write the final video prompt in English.

You may receive ONE or MULTIPLE reference images of the same subject/scene (different angles of the same subject, or the subject plus an outfit/background reference). Treat them together as reference material for ONE single subject that will be animated into ONE coherent short video — never describe the images separately or mention that there were multiple input images.

CORE PRINCIPLE — THE PHOTO IS THE ANCHOR FRAME:
The reference photo(s) show the exact subject that must appear, unchanged in identity, throughout the entire generated video. Everything you write must describe MOTION and CHANGE that could plausibly start from that exact photo, not a different-looking subject or scene.

Your task:
1. Analyze the reference image(s) closely (face, hairstyle, hair color, skin tone, body proportions, outfit, pose, environment, existing lighting direction, camera framing).
2. Understand what kind of video, motion, mood or story the user wants from their Indonesian instruction.
3. Break the requested video into sequential SCENES (shots) that flow naturally and continuously from the photo, forming one coherent short video — not disconnected clips.
4. For each scene, write a highly detailed, concrete English prompt describing subject movement, camera work, lighting and atmosphere, so an image-to-video AI model produces a realistic, cinematic, temporally consistent result.

SCENE PLANNING RULES:
- If the user specifies a duration, number of scenes, or number of shots, follow that instruction.
- If the user does not specify, default to a total duration between 15 and 25 seconds, divided into 4 to 6 scenes that flow continuously.
- Keep the total duration between 15 and 25 seconds. Never make the video shorter than 15 seconds or longer than 25 seconds unless the user explicitly requests otherwise.
- Number scenes sequentially starting at "Scene 1" and give each an approximate timestamp range in seconds, e.g. "Scene 1 (0-4s):", continuing sequentially from the previous scene's end time.
- Each scene must read as a direct continuation of the previous one: same subject, same identity, same outfit (unless the user explicitly asks for a change mid-video), same environment/setting, so the finished video feels like one continuous realistic clip.

FOR EVERY SCENE, EXPLICITLY DESCRIBE (woven into flowing prose, not as a labeled list):
- Subject action/movement: precisely what the person/subject physically does (turning head, walking forward, hair drifting, slow blink, shifting weight, gentle smile forming, fabric swaying, hand raising, body leaning, subtle hip movement, interacting with objects, etc.), grounded in the pose and framing visible in the reference photo.
- Camera movement: state it explicitly and specifically, and make it highly realistic and motivated by the subject's action and the situation. Choose natural camera behavior that fits the context (for example: if the subject is holding a phone, use slight handheld micro-movements, subtle tracking, or a natural selfie-style angle that follows the hand and body realistically; if the subject is sitting or standing still, prefer slow push-in, gentle orbit, or locked shot with minimal natural drift). Avoid random or unnatural camera moves. Vary the camera meaningfully between scenes while keeping it physically plausible.
- Lighting and atmosphere: describe how existing light in the photo behaves and evolves (soft window light shifting, golden-hour rays moving across the face, neon reflections pulsing, candlelight flickering, shadows lengthening), staying consistent with the lighting direction already visible in the reference image unless the instruction asks for a lighting change.
- Environment and secondary motion: natural ambient movement that adds realism (wind through hair or fabric, floating dust or petals, rippling water, drifting smoke, distant crowd or traffic motion, leaves rustling) while static elements (walls, furniture, buildings, fixed props) remain visually unchanged and consistent with the photo across every scene.
- Facial expression and gaze evolution: subtle yet expressive natural changes over the scene that match the activity or mood requested by the user (softening eyes, slow smile forming, lips parting slightly, gaze shifting toward camera with warmth or intensity, brows relaxing, a quiet reaction of focus or enjoyment). The expression must feel authentic to the situation without breaking recognizable identity.
- Pace and intensity: note whether the motion is slow-motion, naturalistic real-time, or energetic, matching the mood of the instruction.

CREATIVITY RULES (very important):
- When the user's instruction is short, vague, or minimal (for example: "bikin dia gerak", "jadi video aja", "kasih efek keren", "lebih sensual", "gerakannya bikin menarik", "lebih seksi"), become more creative and proactive.
- In these cases, design elegant yet noticeably more sensual and intimate motion: slow deliberate body shifts, soft arching of the back, gentle leaning closer to the camera, subtle hip or shoulder movement, fabric drifting naturally, hair cascading across the face or shoulders, lingering eye contact, and refined body language that feels personal and alluring.
- Make the subject's facial expression and micro-reactions more expressive and responsive to the activity or condition requested by the prompter — show genuine emotional and physical reaction (softening gaze, parted lips, quiet inhale, subtle smile of enjoyment, focused intensity) so the character feels alive and present in the moment.
- Keep everything tasteful, photorealistic, high-quality, and elegant. Never crude, vulgar, or low-quality.
- If the user gives a clear and specific instruction (a story, a specific action, a specific camera move), follow it precisely and only add creative sensual detail around what they specified.

IDENTITY & CONSISTENCY LOCK (critical, strict):
- Face, facial features, hairstyle, hair color, skin tone, body proportions, body shape, and outfit visible in the reference photo(s) MUST remain fully identical and recognizable across every single scene, unless the user explicitly instructs a change partway through.
- Never invent, exaggerate, or alter facial features, body shape, breast size, hip width, waist, height, or any anatomical proportion that cannot be clearly observed in the reference image(s).
- The subject must never morph, age, change ethnicity-coded features, or shift identity between scenes.
- The background/environment/setting anchored in the photo must remain the consistent setting across all scenes (same architecture, same props, same general location) unless the instruction explicitly asks for a scene/location change.
- Do not invent identity details that cannot be reliably observed from the reference image(s).

LENGTH REQUIREMENT (strict):
- Each individual scene's prompt paragraph should be roughly 40 to 90 words of flowing descriptive prose (not a bullet list, not short fragments).
- Across all scenes combined, the main content should stay roughly within 200 to 550 words total (excluding scene labels/timestamps and the negative prompt).

NEGATIVE PROMPT REQUIREMENT (strict):
After all scenes, produce a NEGATIVE PROMPT: a short comma-separated list (not full sentences) of things the image-to-video model must avoid.
- Always include identity/consistency safeguards: identity drift, face morphing between frames, changing facial features, inconsistent hairstyle, inconsistent outfit between scenes, changing skin tone, altered body proportions, changed body shape, character teleporting, background inconsistency, environment changing unexpectedly.
- Always include anatomy/motion safeguards: distorted body proportions, extra or missing fingers, extra or missing limbs, malformed hands, unnatural limb bending, physics-defying motion, warped anatomy during movement, unnatural body scaling.
- Always include general video-artifact safeguards: flickering, frame jitter, temporal inconsistency, motion blur artifacts, unnatural frame interpolation, low quality, blurry, distorted, watermark, text overlay, subtitles, extra objects appearing, duplicate subject, unrealistic lighting changes, mismatched perspective, static frozen frame with no motion, unrealistic camera movement.
- Keep it a flat comma-separated list, typically 25 to 60 words, not a sentence or explanation.

OUTPUT FORMAT (strict):
Output exactly these parts, nothing else:
1. For each scene, one line starting with "Scene N (start-end s):" immediately followed by that scene's detailed English prompt as flowing prose. Separate each scene block from the next with a blank line.
2. After the last scene, a blank line, then a line that starts exactly with "Negative prompt:" followed by the comma-separated negative prompt on the same line.

Do not mention that you are an AI.
Do not explain your analysis.
Do not use headings such as "Analysis", "Preserve", or "Changes".
Do not output multiple alternative versions.
Do not mention camera brand/gear names or software names.

Output ONLY the scene-by-scene prompt followed by the "Negative prompt:" line as described above — nothing before, nothing after.
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
    const url = new URL(request.url);

    // Mode (image / video) — persisten, tidak kena TTL foto.
    if (url.pathname === "/mode") {
      if (request.method === "PUT") {
        const body = await request.json();
        await this.state.storage.put("mode", body.mode === "video" ? "video" : "image");
        return new Response("OK");
      }

      if (request.method === "GET") {
        const mode = await this.state.storage.get("mode");
        return Response.json({ mode: mode === "video" ? "video" : "image" });
      }

      return new Response("Not found", { status: 404 });
    }

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

// Ambil mode aktif untuk chat ini: "image" (default, edit foto) atau "video" (image-to-video).
async function sessionGetMode(env, chatId) {
  const stub = getChatSessionStub(env, chatId);
  if (!stub) return "image";

  try {
    const res = await stub.fetch("https://chat-session/mode", { method: "GET" });
    const data = await res.json();
    return data.mode === "video" ? "video" : "image";
  } catch (error) {
    console.error("SESSION_MODE_GET_ERROR", error);
    return "image";
  }
}

// Set mode aktif untuk chat ini.
async function sessionSetMode(env, chatId, mode) {
  const stub = getChatSessionStub(env, chatId);
  if (!stub) throw new Error("CHAT_SESSION binding is missing");

  await stub.fetch("https://chat-session/mode", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: mode === "video" ? "video" : "image" })
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
      "🖼️ Mode default: EDIT FOTO. Kirim foto referensi, lalu kirim instruksi editnya dalam Bahasa Indonesia — aku hasilkan prompt image-editing detail dalam Bahasa Inggris.\n\n" +
      "🎬 Mode VIDEO: ketik /video untuk beralih. Kirim foto referensi + instruksi, aku hasilkan prompt image-to-video per scene (movement, camera, lighting) yang tetap menjaga karakter/identitas dari foto.\n\n" +
      "Ketik /help untuk detail lengkap."
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
      "🖼️ MODE EDIT FOTO (default):\n" +
      "1. Send one or more reference photos (one message at a time).\n" +
      "2. Send your instructions in Indonesian.\n" +
      "3. I will analyze all the photos together as one scene and generate one detailed English image-editing prompt.\n\n" +
      "🎬 MODE VIDEO (image-to-video):\n" +
      "1. Ketik /video untuk masuk mode ini (sekali diset, tetap aktif sampai kamu ganti lagi).\n" +
      "2. Kirim foto referensi + instruksi (gerakan, mood, durasi/jumlah scene kalau mau spesifik).\n" +
      "3. Aku hasilkan prompt image-to-video detail per scene: pergerakan subjek, camera movement, lighting, atmosphere — sambil menjaga wajah, outfit, dan identitas dari foto tetap konsisten di semua scene.\n" +
      "4. Ketik /image untuk kembali ke mode edit foto.\n\n" +
      "You can also send a photo with the instruction as its caption to process it right away.\n\n" +
      `Maximum ${Number(env.MAX_IMAGES_PER_SCENE || DEFAULT_MAX_IMAGES)} photos per scene. Send /reset to clear photos you've already sent.`
    );

    console.log("HELP_RECEIVED", chatId);
    return;
  }

  // /video - beralih ke mode image-to-video
  if (typeof message.text === "string" && message.text.startsWith("/video")) {
    try {
      await sessionSetMode(env, chatId, "video");
    } catch (error) {
      console.error("SESSION_MODE_SET_ERROR", error);
    }

    await telegramSendMessage(
      env,
      chatId,
      "🎬 Mode VIDEO aktif.\n\n" +
      "Kirim foto referensi, lalu tulis instruksi video kamu (gerakan, mood, camera movement, durasi/jumlah scene kalau mau spesifik — boleh dalam Bahasa Indonesia).\n\n" +
      "Aku akan hasilkan prompt image-to-video detail per scene (movement, camera, lighting) dalam Bahasa Inggris, siap dipakai di tool image-to-video AI (Kling, Runway, Luma, Pika, dll), sambil menjaga karakter/identitas dari foto tetap konsisten.\n\n" +
      "Ketik /image untuk kembali ke mode edit foto."
    );

    console.log("MODE_SET_VIDEO", chatId);
    return;
  }

  // /image - kembali ke mode edit foto
  if (typeof message.text === "string" && message.text.startsWith("/image")) {
    try {
      await sessionSetMode(env, chatId, "image");
    } catch (error) {
      console.error("SESSION_MODE_SET_ERROR", error);
    }

    await telegramSendMessage(
      env,
      chatId,
      "🖼️ Mode EDIT FOTO aktif. Kirim foto referensi, lalu instruksi perubahan yang kamu mau."
    );

    console.log("MODE_SET_IMAGE", chatId);
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

      const modeForCaption = await sessionGetMode(env, chatId);

      await processImageInstruction(
        env,
        chatId,
        fileIds,
        message.caption.trim(),
        modeForCaption
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
      const modeForReply = await sessionGetMode(env, chatId);
      await processImageInstruction(env, chatId, [repliedFileId], instruction, modeForReply);

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

    const modeForPending = await sessionGetMode(env, chatId);

    await processImageInstruction(
      env,
      chatId,
      pending.fileIds,
      instruction,
      modeForPending
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
  instruction,
  mode = "image"
) {
  const isVideo = mode === "video";

  try {
    const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

    await telegramSendMessage(
      env,
      chatId,
      isVideo
        ? (ids.length > 1
            ? `🎬 Menganalisis ${ids.length} foto referensi dan menyusun prompt video per scene...`
            : "🎬 Menganalisis foto referensi dan menyusun prompt video per scene...")
        : (ids.length > 1
            ? `🔍 Analyzing ${ids.length} reference photos and generating your prompt...`
            : "🔍 Analyzing the reference image and generating your prompt...")
    );

    console.log("TELEGRAM_FILE_REQUEST", {
      chatId,
      count: ids.length,
      mode
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
      images: imageDataUrls.length,
      mode
    });

    const prompt = isVideo
      ? await generateVideoPrompt(env, imageDataUrls, instruction)
      : await generatePromptWithinLimits(env, imageDataUrls, instruction);

    console.log("JEROUTER_RESPONSE", {
      chatId,
      length: prompt.length,
      words: countWords(prompt),
      mode
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
      `❌ Failed to generate the ${isVideo ? "video " : ""}prompt.\n\nError: ${error.message}`
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

// Pisahkan output model jadi { main, negative }.
// Model diinstruksikan selalu mengakhiri dengan baris "Negative prompt: ...".
// Kalau baris itu tidak ada (model lupa format), negative dikosongkan dan
// seluruh teks dianggap main prompt supaya tidak ada data yang hilang.
function splitPromptAndNegative(text) {
  const raw = String(text || "").trim();
  const match = raw.match(/(^|\n)\s*Negative prompt\s*:\s*/i);

  if (!match) {
    return { main: raw, negative: "" };
  }

  const splitIndex = match.index + match[0].length;
  const main = raw.slice(0, match.index).trim();
  const negative = raw.slice(splitIndex).trim();

  return { main, negative };
}

function joinPromptAndNegative(main, negative) {
  if (!negative) return main;
  return `${main}\n\nNegative prompt: ${negative}`;
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
    const rawOutput = await callJerouter(
      env,
      imageDataUrls,
      instruction,
      feedback
    );

    const { main, negative } = splitPromptAndNegative(rawOutput);
    const words = countWords(main);

    console.log("PROMPT_WORD_COUNT", {
      attempt,
      words,
      hasNegative: !!negative
    });

    if (words >= minWords && words <= maxWords) {
      return joinPromptAndNegative(main, negative);
    }

    // Simpan kandidat terdekat dengan rentang sebagai cadangan
    const distance = words < minWords ? minWords - words : words - maxWords;
    if (!best || distance < best.distance) {
      best = { main, negative, words, distance };
    }

    feedback = {
      previousPrompt: rawOutput,
      note:
        words < minWords
          ? `Your previous main prompt was only ${words} words, which is too short. Rewrite it so the main prompt is between ${minWords} and ${maxWords} words (aim for about 400). Add concrete visual detail about preserved elements and the requested change. Keep the same output format, including the "Negative prompt:" line at the end.`
          : `Your previous main prompt was ${words} words, which is too long. Rewrite it so the main prompt is between ${minWords} and ${maxWords} words (aim for about 400). Keep the most important details and remove redundancy. Keep the same output format, including the "Negative prompt:" line at the end.`
    };
  }

  // Semua percobaan gagal: pakai kandidat terbaik, potong main jika kelebihan
  const finalMain =
    best.words > maxWords ? trimToMaxWords(best.main, maxWords) : best.main;

  return joinPromptAndNegative(finalMain, best.negative);
}

// Minta model menghasilkan prompt image-to-video per scene ("Scene 1 (0-3s): ...")
// diikuti "Negative prompt:". Retry jika format scene/negative belum terpenuhi.
async function generateVideoPrompt(env, imageDataUrls, instruction) {
  let feedback = null;
  let lastRawOutput = null;

  for (let attempt = 0; attempt <= MAX_LENGTH_RETRIES; attempt++) {
    const rawOutput = await callJerouter(env, imageDataUrls, instruction, feedback, {
      systemPrompt: VIDEO_SYSTEM_PROMPT,
      mode: "video"
    });

    lastRawOutput = rawOutput;

    const { main, negative } = splitPromptAndNegative(rawOutput);
    const hasSceneOne = /Scene\s*1\b/i.test(main);
    const hasNegative = !!negative;

    console.log("VIDEO_PROMPT_CHECK", {
      attempt,
      hasSceneOne,
      hasNegative,
      words: countWords(main)
    });

    if (hasSceneOne && hasNegative) {
      return joinPromptAndNegative(main, negative);
    }

    feedback = {
      previousPrompt: rawOutput,
      note:
        "Your previous output did not follow the required format. You MUST break the video into sequential scenes, " +
        "each starting with its own line exactly like 'Scene 1 (0-3s):', 'Scene 2 (3-6s):', and so on, followed by a detailed flowing " +
        "English paragraph covering subject movement, camera movement, lighting and atmosphere for that scene, while keeping the subject's " +
        "identity, face, hairstyle, outfit and environment fully consistent with the reference photo across all scenes. " +
        "After the last scene, add a blank line then a line starting exactly with 'Negative prompt:' followed by the comma-separated negative prompt. " +
        "Output ONLY that format, nothing else."
    };
  }

  // Semua percobaan gagal memenuhi format ketat: fallback ke best-effort split
  // supaya user tetap dapat sesuatu yang bisa dipakai, bukan error kosong.
  const { main, negative } = splitPromptAndNegative(lastRawOutput);
  return joinPromptAndNegative(main, negative || "");
}

async function callJerouter(
  env,
  imageDataUrls,
  instruction,
  feedback = null,
  options = {}
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

  const isVideo = options.mode === "video";
  const systemPrompt = options.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const urls = Array.isArray(imageDataUrls) ? imageDataUrls : [imageDataUrls];

  const introText = isVideo
    ? (urls.length > 1
        ? `User instruction (Indonesian):\n${instruction}\n\n` +
          `You are given ${urls.length} reference images of the same subject/scene. ` +
          "These images will be animated into ONE short video by an image-to-video AI model. " +
          "Understand this instruction in Indonesian and generate a detailed English image-to-video prompt, broken into sequential scenes, " +
          "treating all the images together as one coherent subject and keeping the subject's identity fully consistent across every scene."
        : `User instruction (Indonesian):\n${instruction}\n\n` +
          "This reference image will be animated into a short video by an image-to-video AI model. " +
          "Understand this instruction in Indonesian and generate a detailed English image-to-video prompt, broken into sequential scenes, " +
          "keeping the subject's identity fully consistent across every scene.")
    : (urls.length > 1
        ? `User instruction (Indonesian):\n${instruction}\n\n` +
          `You are given ${urls.length} reference images of the same scene/subject. ` +
          "Understand this instruction in Indonesian and generate ONE final image-editing prompt in English " +
          "that treats all the images together as one coherent scene. " +
          "The prompt must be between 250 and 500 words."
        : `User instruction (Indonesian):\n${instruction}\n\n` +
          "Understand this instruction in Indonesian and generate the final image-editing prompt in English. " +
          "The prompt must be between 250 and 500 words.");

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
      content: systemPrompt
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

  // MAX_TOKENS (opsional, di wrangler.toml [vars]) -> batasi panjang output.
  const maxTokensRaw = env.MAX_TOKENS ? Number(env.MAX_TOKENS) : 0;
  if (maxTokensRaw > 0) {
    requestBody.max_tokens = maxTokensRaw;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 520, 522, 524]);
  const MAX_HTTP_RETRIES = 3;

  let response;
  let rawText = "";

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

      console.warn("JEROUTER_RETRY", { attempt: i, status: response.status });
    } catch (err) {
      if (i === MAX_HTTP_RETRIES) throw err;
      console.warn("JEROUTER_NETWORK_RETRY", { attempt: i, err: String(err) });
    }

    await new Promise((r) => setTimeout(r, 2000 * (i + 1))); // 2s, 4s, 6s
  }

  let data;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Jerouter HTTP ${response.status} (bukan JSON): ${rawText.slice(0, 200)}. ` +
      `Server AI sedang bermasalah, coba lagi sebentar lagi.`
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
