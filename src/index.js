const TELEGRAM_API = (token) => `https://api.telegram.org/bot${token}`;

const SYSTEM_PROMPT = `You are a professional image-editing prompt engineer and visual reference analyst.

Analyze the supplied reference image and the user's requested transformation, then produce ONE detailed prompt for an image-generation or image-editing model.

Core rule: separate what must be PRESERVED from what must CHANGE. Preserve only details actually visible or explicitly requested. Never invent identity details that cannot reasonably be observed. If the user says something should remain unchanged, explicitly reinforce that constraint. If the user asks for a pose/camera/composition change, describe the new pose and camera precisely without accidentally changing unrelated elements.

Analyze when visible/relevant: subject identity/visual appearance, face and hairstyle, skin tone, clothing/colors, body proportions/silhouette, environment/background, furniture/objects, lighting, current composition, requested pose, camera angle/height/distance/framing, expression/gaze, realism/anatomical coherence.

Output ONLY the final image prompt. Do not explain your analysis or mention that you are an AI. Write detailed natural English suitable for a high-quality image model.`;

function jsonResponse(data, status = 200) { return new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json;charset=UTF-8"}}); }
async function telegram(token, method, body) { const r=await fetch(`${TELEGRAM_API(token)}/${method}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}); return r.json(); }
async function sendMessage(env, chatId, text) {
  for (let i=0;i<text.length;i+=3900) await telegram(env.TELEGRAM_BOT_TOKEN,"sendMessage",{chat_id:chatId,text:text.slice(i,i+3900)});
}
async function getTelegramFileUrl(env,fileId){ const x=await telegram(env.TELEGRAM_BOT_TOKEN,"getFile",{file_id:fileId}); if(!x.ok||!x.result?.file_path) throw new Error("Telegram getFile failed."); return `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${x.result.file_path}`; }
function base64(buffer){ const bytes=new Uint8Array(buffer); let out=""; for(let i=0;i<bytes.length;i+=0x8000) out+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length))); return btoa(out); }
async function imageToDataUrl(env,fileId){ const r=await fetch(await getTelegramFileUrl(env,fileId)); if(!r.ok) throw new Error("Could not download Telegram image."); const max=Number(env.MAX_IMAGE_BYTES||7000000); const b=await r.arrayBuffer(); if(b.byteLength>max) throw new Error("Image is too large."); return `data:image/jpeg;base64,${base64(b)}`; }
async function callJerouter(env,image,userInstruction){
  const endpoint=`${env.JEROUTER_BASE_URL.replace(/\/$/,"")}/chat/completions`;
  const payload={model:env.JEROUTER_MODEL||"qwen3.8-max",temperature:Number(env.TEMPERATURE||0.35),messages:[
    {role:"system",content:SYSTEM_PROMPT},
    {role:"user",content:[{type:"text",text:`Reference image is attached. User's requested change:\n${userInstruction}`},{type:"image_url",image_url:{url:image}}]}
  ]};
  const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${env.JEROUTER_API_KEY}`},body:JSON.stringify(payload)});
  const raw=await r.text(); if(!r.ok) throw new Error(`Jerouter HTTP ${r.status}: ${raw.slice(0,500)}`);
  const d=JSON.parse(raw); const out=d?.choices?.[0]?.message?.content??d?.choices?.[0]?.text??d?.output_text??d?.output;
  if(!out||typeof out!=="string") throw new Error("Could not find model output in Jerouter response."); return out.trim();
}
async function savePending(env,chatId,fileId){ if(env.SESSION_KV) await env.SESSION_KV.put(`pending:${chatId}`,JSON.stringify({fileId,createdAt:Date.now()}),{expirationTtl:1800}); }
async function getPending(env,chatId){ if(!env.SESSION_KV)return null; const r=await env.SESSION_KV.get(`pending:${chatId}`); if(!r)return null; try{return JSON.parse(r)}catch{return null;} }
async function clearPending(env,chatId){if(env.SESSION_KV)await env.SESSION_KV.delete(`pending:${chatId}`);}
async function handleUpdate(u,env){
  const m=u?.message;if(!m?.chat?.id)return; const chatId=m.chat.id; const text=(m.text||"").trim();
  if(text==="/start"){await sendMessage(env,chatId,"🧠 Prompt Vision Bot\n\nKirim foto referensi + instruksi perubahan.\n\nBisa kirim foto dengan caption, atau foto dulu lalu instruksi di pesan berikutnya.\n\nContoh: Ubah pose, tetapi orang, outfit, background, dan lighting tetap sama.");return;}
  if(text==="/help"){await sendMessage(env,chatId,"📖 Cara pakai\n\n1. Kirim foto + caption instruksi, atau\n2. Kirim foto dulu, lalu instruksi teks.\n\nBot membaca reference image lalu membuat prompt edit detail.");return;}
  if(m.photo?.length){ const p=m.photo[m.photo.length-1], ins=(m.caption||"").trim(); await savePending(env,chatId,p.file_id); if(!ins){await sendMessage(env,chatId,"📸 Reference diterima.\n\nSekarang kirim instruksi perubahan.");return;} await sendMessage(env,chatId,"🔎 Menganalisis reference dan menyusun prompt..."); try{const result=await callJerouter(env,await imageToDataUrl(env,p.file_id),ins);await clearPending(env,chatId);await sendMessage(env,chatId,`✨ GENERATED PROMPT\n\n${result}`);}catch(e){await sendMessage(env,chatId,`❌ Gagal memproses gambar.\n\n${e.message}`);}return; }
  if(text&&!text.startsWith("/")){const p=await getPending(env,chatId);if(!p?.fileId){await sendMessage(env,chatId,"Kirim foto referensi terlebih dahulu, lalu tulis instruksi perubahan.");return;}await sendMessage(env,chatId,"🔎 Menganalisis reference dan menyusun prompt...");try{const result=await callJerouter(env,await imageToDataUrl(env,p.fileId),text);await clearPending(env,chatId);await sendMessage(env,chatId,`✨ GENERATED PROMPT\n\n${result}`);}catch(e){await sendMessage(env,chatId,`❌ Gagal memproses.\n\n${e.message}`);}}
}
export default {async fetch(request,env,ctx){const url=new URL(request.url);if(request.method==="GET"&&url.pathname==="/")return new Response("Prompt Vision Bot is running.");if(request.method==="GET"&&url.pathname==="/health")return jsonResponse({ok:true,model:env.JEROUTER_MODEL||"qwen3.8-max"});if(request.method==="POST"&&url.pathname==="/telegram/webhook"){const u=await request.json();ctx.waitUntil(handleUpdate(u,env));return new Response("OK");}return new Response("Not found",{status:404});}};
