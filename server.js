const http = require("http");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const OPENAI_API_KEY = process.env.ARK_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "doubao-seed-2-0-pro-260215";
const OPENAI_API_MODE = process.env.OPENAI_API_MODE || (OPENAI_BASE_URL.includes("volces.com") ? "responses" : "chat");
const OUTFIT_IMAGE_MODEL = process.env.OUTFIT_IMAGE_MODEL || "doubao-seedream-5-0-260128";
const GENERATED_OUTFIT_DIR = path.join(ROOT, "assets", "generated", "outfits");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".md": "text/markdown; charset=utf-8",
};

const petProfiles = {
  guardian: "守护型鹿眠：稳定、安抚、陪伴，不强迫用户，像可靠的宿舍守护者。",
  vitality: "活力型栗冲：元气、主动、行动力强，把目标变成很小的挑战。",
  wisdom: "智慧型星阅：理性、观察、拆解问题，提供清晰步骤和复盘。",
  healing: "治愈型橡芽：共情、温柔、允许休息，先照顾感受再处理事情。",
  wonder: "奇想型梦铃：幻想化、梦境感、创造力强，把情绪转成画面和灵感。",
  zhangXuefeng: "高考导师型张雪峰老师：帅气、直给、清醒、提气，先说高考加油，再帮用户看清选择并给出可执行步骤。",
};

const categoryNames = {
  study: "学习",
  sport: "运动",
  food: "饮食",
  scenery: "风景",
  social: "社交",
  creation: "创作",
  emotion: "情绪",
  organize: "生活整理",
};

function localPetReply(petKey, message) {
  const tired = /累|疲惫|难受|不想|崩|睡不着|焦虑|难过/.test(message);
  const delay = /拖延|学不进去|不想学|作业|复习|任务|ddl|deadline/.test(message);
  const replies = {
    guardian: tired
      ? "你已经撑到现在了，先不用逼自己立刻变好。我会在这里陪你坐一会儿，等呼吸慢下来，我们只把事情翻开一小角就好。"
      : delay
        ? "不用一下子完成。我们先把任务放到桌面上，只做最小的一步，我会陪着你。"
        : "我听见了。先把今天放慢一点，我们不用急着给所有事情答案。",
    vitality: tired ? "电量低也可以行动一点点。先喝口水、站起来，再做 3 分钟小挑战。" : "可以，先动起来一点点。今天给自己留一个能完成的小目标。",
    wisdom: tired ? "先判断疲惫来源：睡眠不足、任务过大，还是不知道从哪开始？我们把目标降到一个很小的步骤。" : "我建议先提取事实，再列选择。你现在最需要的是清晰。",
    healing: tired ? "辛苦了。今天不想继续并不代表失败，可能只是身体在提醒你需要恢复。先照顾好自己。" : "我会先接住你的感受。你可以慢一点，也可以先照顾好自己。",
    wonder: tired ? "把疲惫折成一只小纸船，让它漂远一点。等它漂远，我们只捡起一颗最小的知识星星。" : "这句话像一枚小铃铛。我们把它挂到今天的梦境地图上。",
    zhangXuefeng: delay
      ? "高考加油。别空想逆袭，先把任务切到能落笔：一套错题、一个知识点、二十分钟，做完你就比刚才强。"
      : tired
        ? "高考加油。累是正常的，但别让情绪替你做决定，先睡够、吃稳，再把最能涨分的一件事拿出来做。"
        : "高考加油。你现在要做的不是慌，是把选择摊开看清楚，然后抓住最有性价比的下一步。",
  };
  return replies[petKey] || replies.guardian;
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const target = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(ROOT, `.${target}`);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

function toResponsesInput(messages) {
  const instructions = messages
    .filter((message) => message.role === "system")
    .map((message) => (typeof message.content === "string" ? message.content : JSON.stringify(message.content)))
    .join("\n");
  const input = messages
    .filter((message) => message.role !== "system")
    .map((message) => {
      if (!Array.isArray(message.content)) return { role: message.role, content: message.content };
      return {
        role: message.role,
        content: message.content.map((part) => {
          if (part.type === "image_url") return { type: "input_image", image_url: part.image_url?.url || part.image_url };
          if (part.type === "text") return { type: "input_text", text: part.text || "" };
          return part;
        }),
      };
    });
  return { instructions, input };
}

function extractResponsesText(payload) {
  if (payload.output_text) return payload.output_text;
  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

async function openAIChat(messages, options = {}) {
  if (!OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY or ARK_API_KEY is not set");
    error.code = "NO_API_KEY";
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  let response;
  try {
    const isResponses = OPENAI_API_MODE === "responses";
    const responsesPayload = isResponses ? toResponsesInput(messages) : null;
    response = await fetch(`${OPENAI_BASE_URL}/${isResponses ? "responses" : "chat/completions"}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(
        isResponses
          ? {
              model: OPENAI_MODEL,
              instructions: responsesPayload.instructions || undefined,
              input: responsesPayload.input,
              temperature: options.temperature ?? 0.7,
              max_output_tokens: options.max_tokens ?? 1200,
            }
          : {
              model: OPENAI_MODEL,
              messages,
              temperature: options.temperature ?? 0.7,
              max_tokens: options.max_tokens ?? 700,
              response_format: options.response_format,
            },
      ),
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `OpenAI API failed with ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return OPENAI_API_MODE === "responses" ? extractResponsesText(payload) : payload.choices?.[0]?.message?.content || "";
}

function cleanModelText(text) {
  const raw = String(text || "").trim();
  const quotedChinese = [...raw.matchAll(/["“]([^"“”]*[\u4e00-\u9fff][^"“”]*)["”]/g)].map((match) => match[1].trim());
  if (quotedChinese.length) return quotedChinese[quotedChinese.length - 1];

  const chineseLines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /[\u4e00-\u9fff]/.test(line))
    .filter((line) => !/^(We need|The user|The system|Let's|I should|Need to)/i.test(line));
  if (chineseLines.length) return chineseLines[chineseLines.length - 1];

  return raw
    .replace(/^\s*The user wants[\s\S]*?(?=灵瑞|我|你|鹿眠|栗冲|星阅|橡芽|梦铃|$)/i, "")
    .replace(/^\s*The system prompt[\s\S]*?(?=灵瑞|我|你|鹿眠|栗冲|星阅|橡芽|梦铃|$)/i, "")
    .replace(/^\s*We need[\s\S]*?(?=灵瑞|我|你|鹿眠|栗冲|星阅|橡芽|梦铃|$)/i, "")
    .trim();
}

function parseJsonFromText(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(raw.slice(first, last + 1));
    } catch {}
  }
  return {};
}

function imageSafePetName(petName, petType) {
  const raw = String(petName || "");
  if (/张雪峰|雪峰|老师/.test(raw)) return `${petType || "高考导师型"}灵瑞`;
  return raw.replace(/老师|先生|女士|同学/g, "").trim().slice(0, 18) || "Lingrui";
}

function imageSafeOutfitDescription(description) {
  return String(description || "")
    .replace(/张雪峰老师|张雪峰|雪峰老师|雪峰/g, "高考导师")
    .replace(/真人|本人|明星|网红/g, "灵瑞")
    .slice(0, 220);
}

function outfitPrompt({ description, petType, petName, hasReferenceImage }) {
  const safePetName = imageSafePetName(petName, petType);
  const safeDescription = imageSafeOutfitDescription(description);
  return [
    "Create a cute chibi spirit pet fashion design image.",
    `Pet type: ${petType || "soft fantasy spirit pet"}. Pet display name for image generation: ${safePetName}.`,
    `Outfit request: ${safeDescription}.`,
    hasReferenceImage
      ? "Use the reference image as the primary character design source. Keep the original pet's species traits, face shape, fur colors, silhouette proportions, line style, rendering style, palette softness, and overall campus-diary illustration feeling consistent with the reference."
      : "Visual style: pastel campus diary, soft hand-drawn outlines, warm healing mood, sticker-like Q-version game asset, consistent with cute furry spirit mascot art.",
    hasReferenceImage
      ? "Only redesign the clothing and accessories described by the user. Do not replace the character with a different creature, do not change the core body shape, and do not drift into a different art style."
      : "Subject: a full-body chibi spirit pet wearing the custom outfit, centered, clean composition.",
    "Subject: a full-body chibi spirit pet wearing the custom outfit, centered, clean composition.",
    "Background requirement: transparent background with alpha channel, isolated character only, no backdrop, no scenery, no gradient card, no floor, no frame.",
    "Keep the outer silhouette clean for sticker-like compositing, and avoid cropped ears, tail, feet, or accessories.",
    "Avoid readable text, logos, watermark, photorealism, harsh shadows, dark palette, busy background.",
  ].join("\n");
}

function fallbackOutfitSvg({ description, petType }) {
  const safeDescription = String(description || "梦幻校园披风").slice(0, 60);
  const safeType = String(petType || "灵瑞").slice(0, 20);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#8f6b4f" flood-opacity="0.22"/>
    </filter>
  </defs>
  <path d="M318 338c84-74 283-75 385 0 31 23 39 72 15 107l-58 83 38 170c8 35-18 69-54 69H380c-36 0-62-34-54-69l38-170-58-83c-24-35-16-84 12-107z" fill="#f6cf72" filter="url(#shadow)"/>
  <path d="M382 382c62-45 201-45 260 0l-63 118H445z" fill="#f4aab8"/>
  <path d="M379 534h266l33 148H346z" fill="#8dcbd0"/>
  <path d="M327 455l-83 71 68 66 75-94zM697 455l83 71-68 66-75-94z" fill="#a8d9bf"/>
  <path d="M447 501h130M392 689h240" stroke="#8f6b4f" stroke-width="22" stroke-linecap="round"/>
  <circle cx="438" cy="616" r="24" fill="#fff7ea"/><circle cx="586" cy="616" r="24" fill="#fff7ea"/>
  <path d="M246 249l25 51 56 8-41 39 10 55-50-26-50 26 10-55-41-39 56-8zM789 242l18 38 42 6-30 30 7 42-37-20-38 20 8-42-31-30 42-6z" fill="#fff0bd" stroke="#d9a944" stroke-width="8"/>
  <text x="512" y="840" text-anchor="middle" font-size="42" font-family="PingFang SC, Microsoft YaHei, sans-serif" fill="#4d3d35" font-weight="700">${escapeSvg(safeType)} 定制服饰</text>
  <text x="512" y="900" text-anchor="middle" font-size="30" font-family="PingFang SC, Microsoft YaHei, sans-serif" fill="#8d7b6f">${escapeSvg(safeDescription)}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function outfitOverlaySvg({ description }) {
  const text = String(description || "");
  const isSuper = /超人|斗篷|披风|英雄/.test(text);
  const isStar = /星|月|梦|魔法|闪/.test(text);
  const main = isSuper ? "#2f75d6" : isStar ? "#6e83c8" : "#8dcbd0";
  const accent = isSuper ? "#e34f4f" : isStar ? "#f6cf72" : "#f4aab8";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#6b4a2f" flood-opacity="0.18"/>
    </filter>
  </defs>
  <path d="M286 486c-58 38-90 118-80 214 6 55 24 112 42 151 15 33 57 26 62-10l34-244z" fill="${accent}" opacity="0.86" filter="url(#soft)"/>
  <path d="M738 486c58 38 90 118 80 214-6 55-24 112-42 151-15 33-57 26-62-10l-34-244z" fill="${accent}" opacity="0.86" filter="url(#soft)"/>
  <path d="M364 520c48-34 208-34 256 0l-42 210H406z" fill="${main}" opacity="0.86" filter="url(#soft)"/>
  <path d="M430 520l82 66 82-66-32-44H462z" fill="#fff8ec" opacity="0.92"/>
  <path d="M486 590l-42 74h86zM530 590l42 74h-86z" fill="${accent}" opacity="0.92"/>
  <path d="M410 728h204" stroke="#8f6b4f" stroke-width="16" stroke-linecap="round" opacity="0.36"/>
  <path d="M512 566l14 30 33 5-24 23 6 33-29-16-29 16 6-33-24-23 33-5z" fill="#fff0bd" stroke="#d9a944" stroke-width="6"/>
  <path d="M254 394l12 26 29 4-21 20 5 29-25-14-26 14 5-29-21-20 29-4zM774 392l14 29 32 5-23 22 6 32-29-15-28 15 5-32-23-22 32-5z" fill="#fff0bd" stroke="#d9a944" stroke-width="6" opacity="${isStar ? "1" : "0.82"}"/>
  </svg>`);
}

async function fallbackOutfitImage({ description, petType, referenceImage }) {
  if (!referenceImage) return fallbackOutfitSvg({ description, petType });
  try {
    const petBuffer = await sourceToBuffer(referenceImage);
    const petLayer = await sharp(petBuffer).ensureAlpha().resize({ width: 820, height: 860, fit: "inside" }).png().toBuffer();
    const petMeta = await sharp(petLayer).metadata();
    const left = Math.round((1024 - petMeta.width) / 2);
    const top = Math.round((1024 - petMeta.height) / 2) + 20;
    const composed = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: petLayer, left, top },
        { input: outfitOverlaySvg({ description }), left: 0, top: 0 },
      ])
      .png()
      .toBuffer();
    return persistOutfitImage(composed);
  } catch (error) {
    console.warn("reference fallback outfit failed:", error.message);
    return fallbackOutfitSvg({ description, petType });
  }
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sourceToBuffer(source) {
  if (!source) throw new Error("image source is required");
  if (source.startsWith("data:")) {
    const base64 = source.split(",", 2)[1] || "";
    return Buffer.from(base64, "base64");
  }
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Failed to fetch generated image: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function estimateBackgroundColor(data, width, height) {
  const sampleRadius = 3;
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const [startX, startY] of corners) {
    for (let dy = 0; dy < sampleRadius; dy += 1) {
      for (let dx = 0; dx < sampleRadius; dx += 1) {
        const x = Math.min(width - 1, Math.max(0, startX + (startX === 0 ? dx : -dx)));
        const y = Math.min(height - 1, Math.max(0, startY + (startY === 0 ? dy : -dy)));
        const index = (y * width + x) * 4;
        r += data[index];
        g += data[index + 1];
        b += data[index + 2];
        count += 1;
      }
    }
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

function isBackgroundLike(data, pixelIndex, bg) {
  const r = data[pixelIndex];
  const g = data[pixelIndex + 1];
  const b = data[pixelIndex + 2];
  const a = data[pixelIndex + 3];
  if (a === 0) return true;
  const brightness = (r + g + b) / 3;
  const distance = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
  return brightness >= 235 && distance <= 72;
}

async function removeBackgroundToTransparent(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.from(data);
  const { width, height } = info;
  const bg = estimateBackgroundColor(output, width, height);
  const visited = new Uint8Array(width * height);
  const queue = [];
  let head = 0;

  function enqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const flatIndex = y * width + x;
    if (visited[flatIndex]) return;
    const pixelIndex = flatIndex * 4;
    if (!isBackgroundLike(output, pixelIndex, bg)) return;
    visited[flatIndex] = 1;
    queue.push(flatIndex);
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < queue.length) {
    const flatIndex = queue[head++];
    const x = flatIndex % width;
    const y = Math.floor(flatIndex / width);
    const pixelIndex = flatIndex * 4;
    output[pixelIndex + 3] = 0;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const flatIndex = y * width + x;
      const pixelIndex = flatIndex * 4;
      if (output[pixelIndex + 3] === 0) continue;
      const neighbors = [
        ((y - 1) * width + x) * 4,
        ((y + 1) * width + x) * 4,
        (y * width + x - 1) * 4,
        (y * width + x + 1) * 4,
      ];
      if (!neighbors.some((neighborIndex) => output[neighborIndex + 3] === 0)) continue;
      const r = output[pixelIndex];
      const g = output[pixelIndex + 1];
      const b = output[pixelIndex + 2];
      const brightness = (r + g + b) / 3;
      const distance = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
      if (brightness < 205 || distance > 120) continue;
      const alpha = Math.max(0, Math.min(255, Math.round(((distance + 20) / 140) * 255)));
      output[pixelIndex + 3] = Math.min(output[pixelIndex + 3], alpha);
    }
  }

  return sharp(output, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function persistOutfitImage(buffer) {
  fs.mkdirSync(GENERATED_OUTFIT_DIR, { recursive: true });
  const fileName = `outfit-${Date.now()}-${randomUUID().slice(0, 8)}.png`;
  const filePath = path.join(GENERATED_OUTFIT_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/assets/generated/outfits/${fileName}`;
}

async function finalizeOutfitImage(source) {
  const rawBuffer = await sourceToBuffer(source);
  const transparentBuffer = await removeBackgroundToTransparent(rawBuffer);
  return persistOutfitImage(transparentBuffer);
}

async function generateOutfitImage({ prompt, referenceImage }) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY or ARK_API_KEY is not set");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  let response;
  try {
    response = await fetch(`${OPENAI_BASE_URL}/images/generations`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OUTFIT_IMAGE_MODEL,
        prompt,
        ...(referenceImage ? { image: [referenceImage] } : {}),
        size: "2048x2048",
        response_format: "url",
        output_format: "png",
        watermark: false,
      }),
    });
  } finally {
    clearTimeout(timeout);
  }
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `Image generation failed with ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  const item = payload.data?.[0] || payload.result?.[0] || payload.images?.[0] || {};
  if (item.url) return finalizeOutfitImage(item.url);
  if (item.b64_json) return finalizeOutfitImage(`data:image/png;base64,${item.b64_json}`);
  if (payload.url) return finalizeOutfitImage(payload.url);
  throw new Error("Image generation response did not include a URL or base64 image");
}

async function handleChat(req, res) {
  const body = await readJson(req);
  const petKey = body.petKey || "guardian";
  const customPetName = String(body.petName || "").trim().slice(0, 16);
  const petProfile = body.petProfile && typeof body.petProfile === "object" ? body.petProfile : {};
  const userMessage = String(body.message || "").slice(0, 1200);
  const recentMemories = Array.isArray(body.memories) ? body.memories.slice(0, 2) : [];
  const profileText = [
    petProfiles[petKey] || "",
    petProfile.type ? `灵瑞类型：${String(petProfile.type).slice(0, 40)}。` : "",
    petProfile.tone ? `对话风格：${String(petProfile.tone).slice(0, 180)}。` : "",
    petProfile.styleGuide ? `人格设定：${String(petProfile.styleGuide).slice(0, 260)}。` : "",
    petProfile.opening ? `必要时可自然使用开场白：${String(petProfile.opening).slice(0, 60)}。` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const content = await openAIChat(
    [
      {
        role: "system",
        content: [
          "你是 AI 灵宠，中文回复。",
          profileText || petProfiles.guardian,
          customPetName ? `你的名字是：${customPetName}。` : "",
          "回复 1-2 句，温柔具体，不说教。严重风险时建议联系可信任的人或专业支持。",
        ].join("\n"),
      },
      {
        role: "user",
        content: `记忆：${recentMemories.map((item) => item.summary || item).join("；") || "暂无"}\n用户：${userMessage}`,
      },
    ],
    { temperature: 0.7, max_tokens: 900, timeoutMs: 60000 },
  );

  const cleaned = cleanModelText(content);
  json(res, 200, {
    ok: true,
    provider: cleaned ? "openai" : "openai-fallback",
    reply: cleaned || localPetReply(petKey, userMessage),
    memorySummary: `用户提到：${userMessage.slice(0, 40)}。本轮由大模型按${profileText || petProfiles[petKey] || petProfiles.guardian}生成陪伴反馈。`,
  });
}

function celebrityPetImagePrompt({ keyword, need, isZhang }) {
  const visualKeyword = isZhang ? "charismatic Chinese gaokao mentor archetype" : "abstract public-persona inspired mentor mascot";
  return [
    "Create a cute, handsome spirit pet character asset for a Chinese campus growth companion H5 app.",
    `Reference style keyword: ${visualKeyword}.`,
    `User need: ${need || "growth companionship and study encouragement"}.`,
    "If a reference image is supplied, use it to capture broad recognizable public visual cues such as hairstyle, face shape, expression, outfit vibe, and posture, then transform those cues into an original stylized spirit pet mascot.",
    isZhang
      ? "Character direction: a charismatic Chinese gaokao mentor spirit pet, handsome, confident, clean short black hair, navy blazer, white shirt, red accent tie, holding an exam notebook and golden star pointer. Energetic education coach feeling, not photorealistic and not an exact portrait."
      : "Character direction: transform the public style into an abstract original spirit pet mascot. Capture broad public persona traits only; do not create an exact portrait or copy private identity details.",
    "Visual style: polished mobile game sticker, soft pastel campus scrapbook, warm outlines, full-body centered, transparent background with alpha channel.",
    "Avoid readable text, logos, watermark, photorealism, exact celebrity face, harsh caricature, busy background.",
  ].join("\n");
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanReferenceKeyword(keyword) {
  return String(keyword || "")
    .replace(/老师|先生|女士/g, "")
    .trim();
}

async function searchReferenceImageUrl(keyword) {
  const cleanKeyword = cleanReferenceKeyword(keyword);
  const query = `${cleanKeyword || keyword} 近照 正面 高清`;
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`reference image search failed: ${response.status}`);
  const html = await response.text();
  const candidates = [];
  for (const match of html.matchAll(/m=\"({.+?})\"/g)) {
    try {
      const payload = JSON.parse(decodeHtmlEntities(match[1]));
      if (payload.murl) candidates.push(payload.murl);
      if (payload.turl) candidates.push(payload.turl);
    } catch {}
  }
  for (const match of html.matchAll(/"murl":"(https?:\/\/[^"]+)"/g)) {
    candidates.push(decodeHtmlEntities(match[1]).replace(/\\\//g, "/"));
  }
  return candidates.find((item) => /^https?:\/\//.test(item) && !/\.svg($|\?)/i.test(item)) || "";
}

function fallbackCelebrityPet({ keyword, need }) {
  const isZhang = /张雪峰|雪峰/i.test(keyword);
  return {
    name: isZhang ? "张雪峰老师" : `${String(keyword || "名人").slice(0, 10)}灵瑞`,
    type: isZhang ? "高考导师型" : "名人投影型",
    opening: isZhang ? "高考加油" : "我会把这份风格变成陪伴力",
    personality: isZhang ? "帅气、直给、清醒、提气，擅长把升学和学习选择讲明白。" : `参考${keyword || "目标人物"}的公开风格，抽象成积极、可陪伴的人格灵瑞。`,
    tone: isZhang ? "先鼓劲，再分析选择，最后给一个能马上执行的小步骤。" : need || "抓住核心，表达鲜明，给出具体建议。",
    imageUrl: isZhang ? "/assets/pets/transparent/zhang-xuefeng.png" : "/assets/pets/transparent/wisdom.png",
  };
}

async function handleCelebrityPet(req, res) {
  const body = await readJson(req);
  const keyword = String(body.keyword || "").trim().slice(0, 80);
  const need = String(body.need || "").trim().slice(0, 180);
  if (!keyword) return json(res, 400, { ok: false, error: "keyword is required" });
  const isZhang = /张雪峰|雪峰/i.test(keyword);
  const fallback = fallbackCelebrityPet({ keyword, need });
  let pet = fallback;
  let referenceImageUrl = "";

  try {
    referenceImageUrl = await searchReferenceImageUrl(keyword);
  } catch (error) {
    console.warn("celebrity reference image search fallback:", error.message);
  }

  try {
    const content = await openAIChat(
      [
        {
          role: "system",
          content:
            "你是 AI 产品里的灵瑞人格设计师。根据用户输入的网络名人或风格关键词，生成一个抽象化、非隐私、非原始照片复刻的灵瑞设定。只输出 JSON。",
        },
        {
          role: "user",
          content: [
            `关键词：${keyword}`,
            `用户期待：${need || "陪伴学习成长"}`,
            isZhang ? "特殊要求：预设为张雪峰老师，开场白必须是“高考加油”，形象气质必须帅气、提气、清醒。" : "",
            "JSON 字段：name,type,opening,personality,tone,tags。name 不超过 12 字，opening 不超过 20 字，tone 不超过 80 字。",
          ].join("\n"),
        },
      ],
      { temperature: 0.72, max_tokens: 900, timeoutMs: 45000 },
    );
    const parsed = parseJsonFromText(content);
    pet = {
      ...fallback,
      ...parsed,
      opening: isZhang ? "高考加油" : parsed.opening || fallback.opening,
      name: isZhang ? "张雪峰老师" : parsed.name || fallback.name,
    };
  } catch (error) {
    console.warn("celebrity pet text fallback:", error.message);
  }

  try {
    pet.imageUrl = await generateOutfitImage({
      prompt: celebrityPetImagePrompt({ keyword, need, isZhang }),
      referenceImage: referenceImageUrl,
    });
  } catch (error) {
    console.warn("celebrity pet image fallback:", error.message);
    pet.imageUrl = fallback.imageUrl;
  }

  pet.referenceImageUrl = referenceImageUrl;
  json(res, 200, {
    ok: true,
    provider: pet.imageUrl === fallback.imageUrl ? (referenceImageUrl ? "model-text-ref-local-image" : "model-text-local-image") : referenceImageUrl ? "model-text-ref-image" : "model-text-image",
    referenceImageUrl,
    pet,
  });
}

async function handleImageAnalyze(req, res) {
  const body = await readJson(req);
  const selectedCategory = body.selectedCategory || "study";
  const imageData = body.imageData;
  const categoryList = Object.entries(categoryNames)
    .map(([key, name]) => `${key}=${name}`)
    .join("，");

  const userContent = [
    {
      type: "text",
      text: [
        "请识别这张大学生日常图片，输出严格 JSON。",
        `category 必须从这些 key 中选择：${categoryList}`,
        `如果无法看图或不确定，优先参考用户当前选择：${selectedCategory}`,
        "JSON 字段：category, confidence(0-1), tags(3-6个中文短标签), emotionSignals(0-3个中文短标签), feedback(一句灵宠式中文反馈), event(一个四字左右成长事件名)。",
      ].join("\n"),
    },
  ];
  if (imageData) {
    userContent.push({ type: "image_url", image_url: { url: imageData } });
  }

  const content = await openAIChat(
    [
      { role: "system", content: "你是多模态图片识别与个人成长画像助手。只输出 JSON，不输出 Markdown。" },
      { role: "user", content: userContent },
    ],
    { temperature: 0.2, max_tokens: 1200, timeoutMs: 60000 },
  );

  const parsed = parseJsonFromText(content);
  const category = categoryNames[parsed.category] ? parsed.category : selectedCategory;
  json(res, 200, {
    ok: true,
    provider: "openai",
    category,
    confidence: Math.max(0.1, Math.min(0.99, Number(parsed.confidence) || 0.72)),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    emotionSignals: Array.isArray(parsed.emotionSignals) ? parsed.emotionSignals.slice(0, 3) : [],
    feedback: parsed.feedback || "",
    event: parsed.event || "",
  });
}

async function handlePersona(req, res) {
  const body = await readJson(req);
  const content = await openAIChat(
    [
      {
        role: "system",
        content: "你是个人成长陪伴产品的人格链接生成器。只生成抽象画像，不暴露原始聊天、原始图片、位置或联系方式。输出中文 JSON。",
      },
      {
        role: "user",
        content: JSON.stringify({
          pet: body.pet,
          attributes: body.attributes,
          memories: body.memories,
          uploads: body.uploads,
          requiredShape: {
            intro: "一句可分享介绍语",
            tags: ["5-8 个抽象人格标签"],
            supportStyle: "情绪支持方式",
            socialStyle: "社交风格",
            suggestedTogether: ["适合一起做的事"],
          },
        }),
      },
    ],
    { temperature: 0.55, max_tokens: 1200, timeoutMs: 60000 },
  );
  const parsed = parseJsonFromText(content);
  const fallbackPersona = {
    intro: "这是一个正在恢复节奏、需要低压力陪伴，也愿意认真记录生活的人格链接。",
    tags: ["稳定陪伴", "低压力成长", "情绪修复", "学习记录", "熟人分享"],
    supportStyle: "先共情，再给一个很小的行动建议",
    socialStyle: "偏熟人、慢热、重视安全感",
    suggestedTogether: ["一起自习", "互相分享书桌照", "晚饭后散步"],
  };
  json(res, 200, {
    ok: true,
    provider: Object.keys(parsed).length ? "openai" : "openai-fallback",
    persona: Object.keys(parsed).length ? parsed : fallbackPersona,
  });
}

async function handleOutfitGenerate(req, res) {
  const body = await readJson(req);
  const description = String(body.description || "").trim().slice(0, 260);
  const petType = String(body.petType || "").trim().slice(0, 40);
  const petName = String(body.petName || "").trim().slice(0, 30);
  const referenceImage = typeof body.referenceImage === "string" ? body.referenceImage.slice(0, 10 * 1024 * 1024) : "";
  if (!description) return json(res, 400, { ok: false, error: "description is required" });

  const prompt = outfitPrompt({ description, petType, petName, hasReferenceImage: Boolean(referenceImage) });
  try {
    const imageUrl = await generateOutfitImage({ prompt, referenceImage });
    return json(res, 200, {
      ok: true,
      provider: "seedream",
      imageUrl,
      model: OUTFIT_IMAGE_MODEL,
      prompt,
    });
  } catch (error) {
    const fallbackImageUrl = await fallbackOutfitImage({ description, petType, referenceImage });
    return json(res, 200, {
      ok: true,
      provider: "local-fallback",
      imageUrl: fallbackImageUrl,
      model: OUTFIT_IMAGE_MODEL,
      prompt,
      warning: error.message,
    });
  }
}

async function handleApi(req, res, pathname) {
  try {
    if (pathname === "/api/health") {
      return json(res, 200, {
        ok: true,
        configured: Boolean(OPENAI_API_KEY),
        baseUrl: OPENAI_BASE_URL,
        model: OPENAI_MODEL,
        mode: OPENAI_API_MODE,
        outfitImageModel: OUTFIT_IMAGE_MODEL,
      });
    }
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
    if (pathname === "/api/chat/reply") return await handleChat(req, res);
    if (pathname === "/api/images/analyze") return await handleImageAnalyze(req, res);
    if (pathname === "/api/persona/generate") return await handlePersona(req, res);
    if (pathname === "/api/outfits/generate") return await handleOutfitGenerate(req, res);
    if (pathname === "/api/pets/celebrity") return await handleCelebrityPet(req, res);
    return json(res, 404, { ok: false, error: "API not found" });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message,
      name: error.name,
      cause: error.cause?.message,
      code: error.code,
      provider: "openai",
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url.pathname);

  const filePath = safePath(url.pathname);
  if (!filePath) return json(res, 403, { ok: false, error: "Forbidden" });
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Lingrui H5 server: http://127.0.0.1:${PORT}`);
  console.log(`OpenAI config: base=${OPENAI_BASE_URL} model=${OPENAI_MODEL} mode=${OPENAI_API_MODE} key=${OPENAI_API_KEY ? "set" : "missing"}`);
  console.log(`Outfit image config: model=${OUTFIT_IMAGE_MODEL}`);
});
