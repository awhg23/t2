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
const GENERATED_ANNOTATION_DIR = path.join(ROOT, "assets", "generated", "annotated");
const GENERATED_CHARACTER_DIR = path.join(ROOT, "assets", "generated", "characters");

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
  guardian: "守护型天禄：稳定、安抚、陪伴，不强迫用户，像可靠的宿舍守护者。",
  vitality: "活力型辟邪：元气、主动、行动力强，把目标变成很小的挑战。",
  wisdom: "智慧型白泽：理性、观察、拆解问题，提供清晰步骤和复盘。",
  healing: "治愈型玄龟：共情、温柔、允许休息，先照顾感受再处理事情。",
  wonder: "奇想型九尾：幻想化、梦境感、创造力强，把情绪转成画面和灵感。",
  zhangXuefeng: "高考导师型张雪峰老师：帅气、直给、清醒、提气，先说高考加油，再帮用户看清选择并给出可执行步骤。",
};

const basePetDirections = {
  guardian: {
    type: "守护型",
    name: "天禄",
    imageUrl: "/assets/pets/transparent/guardian.png",
    colorMood: "warm beige, soft gold, calm moss green",
    direction: "stable, reliable, warm, quiet guardian energy, campus-night healing mood",
  },
  vitality: {
    type: "活力型",
    name: "辟邪",
    imageUrl: "/assets/pets/transparent/vitality.png",
    colorMood: "sunny apricot, fresh grass green, bright warm orange",
    direction: "energetic, sporty, bright, lively companion vibe, action-first campus mood",
  },
  wisdom: {
    type: "智慧型",
    name: "白泽",
    imageUrl: "/assets/pets/transparent/wisdom.png",
    colorMood: "soft teal, mist blue, gentle silver",
    direction: "clear-minded, observant, rational but gentle, study-partner atmosphere",
  },
  healing: {
    type: "治愈型",
    name: "玄龟",
    imageUrl: "/assets/pets/transparent/healing.png",
    colorMood: "sage green, cream, muted peach",
    direction: "soft, caring, cozy, restorative, window-light and homey atmosphere",
  },
  wonder: {
    type: "奇想型",
    name: "九尾",
    imageUrl: "/assets/pets/transparent/wonder.png",
    colorMood: "dreamy lavender, moonlight cream, pastel pink",
    direction: "dreamy, imaginative, whimsical, magical campus scrapbook vibe",
  },
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

const petAnnotationAssets = {
  guardian: "assets/pets/transparent/guardian.png",
  vitality: "assets/pets/transparent/vitality.png",
  wisdom: "assets/pets/transparent/wisdom.png",
  healing: "assets/pets/transparent/healing.png",
  wonder: "assets/pets/transparent/wonder.png",
  zhangXuefeng: "assets/pets/transparent/zhang-xuefeng.png",
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
    .replace(/^\s*The user wants[\s\S]*?(?=灵瑞|我|你|天禄|辟邪|白泽|玄龟|九尾|$)/i, "")
    .replace(/^\s*The system prompt[\s\S]*?(?=灵瑞|我|你|天禄|辟邪|白泽|玄龟|九尾|$)/i, "")
    .replace(/^\s*We need[\s\S]*?(?=灵瑞|我|你|天禄|辟邪|白泽|玄龟|九尾|$)/i, "")
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

async function sourceToBuffer(source, options = {}) {
  if (!source) throw new Error("image source is required");
  if (source.startsWith("data:")) {
    const base64 = source.split(",", 2)[1] || "";
    return Buffer.from(base64, "base64");
  }
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 90000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(source, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
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

async function persistAnnotatedImage(buffer) {
  fs.mkdirSync(GENERATED_ANNOTATION_DIR, { recursive: true });
  const fileName = `annotated-${Date.now()}-${randomUUID().slice(0, 8)}.png`;
  const filePath = path.join(GENERATED_ANNOTATION_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/assets/generated/annotated/${fileName}`;
}

async function persistCharacterImage(buffer) {
  fs.mkdirSync(GENERATED_CHARACTER_DIR, { recursive: true });
  const fileName = `character-${Date.now()}-${randomUUID().slice(0, 8)}.png`;
  const filePath = path.join(GENERATED_CHARACTER_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/assets/generated/characters/${fileName}`;
}

async function finalizeOutfitImage(source) {
  const rawBuffer = await sourceToBuffer(source);
  const transparentBuffer = await removeBackgroundToTransparent(rawBuffer);
  return persistOutfitImage(transparentBuffer);
}

async function finalizeCharacterImage(source) {
  const rawBuffer = await sourceToBuffer(source, { timeoutMs: 120000 });
  const transparentBuffer = await removeBackgroundToTransparent(rawBuffer);
  return persistCharacterImage(transparentBuffer);
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

async function requestSeedreamImage({ prompt, referenceImage, timeoutMs = 180000 }) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY or ARK_API_KEY is not set");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
  if (item.url) return item.url;
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
  if (payload.url) return payload.url;
  throw new Error("Image generation response did not include a URL or base64 image");
}

function customCharacterTextFallback({ name, personaHint, styleBasePet }) {
  const base = basePetDirections[styleBasePet] || basePetDirections.guardian;
  const safeName = String(name || "").trim().slice(0, 12) || "自定义人物";
  const hint = String(personaHint || "").trim().slice(0, 80);
  return {
    name: safeName,
    type: base.type,
    opening: base.type === "活力型" ? "我们现在就开始吧" : base.type === "智慧型" ? "先把这件事看清楚" : base.type === "治愈型" ? "先照顾好你自己" : base.type === "奇想型" ? "今天也收集一点灵感吧" : "我在这里陪你",
    personality: hint || `${base.direction}，会陪伴用户慢慢成长。`,
    tone:
      base.type === "活力型"
        ? "主动、明亮、会鼓励你先动起来。"
        : base.type === "智慧型"
          ? "清晰、理性、会把问题拆成小步骤。"
          : base.type === "治愈型"
            ? "温柔、放松、先接住情绪再说。"
            : base.type === "奇想型"
              ? "梦幻、有画面感、会把日常变成小故事。"
              : "稳定、安抚、像熟悉的陪伴者一样回应。",
    tags: [base.type.replace("型", ""), "人物灵瑞", "同画风"],
    styleBasePet,
  };
}

async function createCustomCharacterProfile({ name, personaHint, styleBasePet }) {
  const fallback = customCharacterTextFallback({ name, personaHint, styleBasePet });
  if (!OPENAI_API_KEY) return fallback;
  const base = basePetDirections[styleBasePet] || basePetDirections.guardian;
  try {
    const content = await openAIChat(
      [
        {
          role: "system",
          content: "你是灵瑞人物设计师。根据用户给定的人物名字、气质描述和风格基底，输出适合成长陪伴产品的人物灵瑞设定。只输出 JSON。",
        },
        {
          role: "user",
          content: [
            `人物名字：${fallback.name}`,
            `人物气质：${personaHint || "未提供"}`,
            `风格基底：${styleBasePet}（${base.type}，${base.direction}）`,
            "要求：这是一个已经被灵瑞化的人物，不是写实人物，也不是服饰描述。",
            "JSON 字段：name,type,opening,personality,tone,tags。",
            "约束：name 不超过 12 字；opening 不超过 20 字；type 直接使用对应风格基底类型；personality 不超过 60 字；tone 不超过 60 字；tags 为 3 到 4 个中文短词。",
          ].join("\n"),
        },
      ],
      { temperature: 0.7, max_tokens: 900, timeoutMs: 45000 },
    );
    const parsed = parseJsonFromText(content);
    return {
      ...fallback,
      ...parsed,
      name: String(parsed.name || fallback.name).trim().slice(0, 12) || fallback.name,
      type: base.type,
      opening: String(parsed.opening || fallback.opening).trim().slice(0, 20) || fallback.opening,
      personality: String(parsed.personality || fallback.personality).trim().slice(0, 60) || fallback.personality,
      tone: String(parsed.tone || fallback.tone).trim().slice(0, 60) || fallback.tone,
      tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags.slice(0, 4) : fallback.tags,
      styleBasePet,
    };
  } catch (error) {
    console.warn("custom character text fallback:", error.message);
    return fallback;
  }
}

function customCharacterImagePrompt({ name, personaHint, styleBasePet }) {
  const base = basePetDirections[styleBasePet] || basePetDirections.guardian;
  return [
    "Create an original custom spirit-pet character for a Chinese campus growth companion H5 app.",
    `Base art direction must strictly match the same visual system as the five starter pets, especially ${base.name}.`,
    `Starter-pet style anchor: ${base.direction}. Palette mood: ${base.colorMood}.`,
    `Character display name: ${name || "自定义人物"}.`,
    `Persona hint: ${personaHint || "gentle campus companion"}.`,
    "If a reference image is supplied, preserve only broad public visible traits such as hairstyle, face silhouette, glasses, overall vibe, and clothing outline, then transform them into an original spirit-pet character.",
    "Do not create a realistic human portrait. This must look like the same chibi mascot family as the five initial pets: soft pastel colors, rounded cute anatomy, hand-drawn sticker silhouette, gentle linework, campus scrapbook feeling, polished 2D game asset.",
    "Character should be full-body, single subject, centered, transparent background with alpha channel.",
    "Keep the body proportions and rendering language compatible with the starter pets so the new character can stand beside them naturally.",
    "Avoid photorealism, realistic skin texture, anime glamour style, 3D toy style, sharp fashion illustration, complex background, readable text, logos, watermark.",
  ].join("\n");
}

function customCharacterFallbackPrompt({ name, personaHint, styleBasePet }) {
  const base = basePetDirections[styleBasePet] || basePetDirections.guardian;
  return [
    "Create an original custom spirit-pet character for a Chinese campus growth companion H5 app.",
    `This is a fallback generation without a reference image, but it must still strictly match the same mascot art system as the five starter pets, especially ${base.name}.`,
    `Character display name: ${name || "自定义人物"}.`,
    `Persona hint: ${personaHint || "gentle campus companion"}.`,
    `Visual direction: ${base.direction}. Palette mood: ${base.colorMood}.`,
    "Output one original full-body chibi companion character, transparent background, soft pastel sticker silhouette, rounded anatomy, clean 2D mascot style, hand-drawn scrapbook feeling.",
    "Do not generate realistic humans, cosplay photos, 3D toys, fashion posters, complex scenes, background objects, or visible text.",
  ].join("\n");
}

async function generateCustomCharacterImage({ prompt, fallbackPrompt, referenceImage }) {
  const attempts = [
    { provider: "model-character-image", prompt, referenceImage, label: "reference" },
    { provider: "model-character-fallback", prompt: fallbackPrompt, referenceImage: "", label: "fallback" },
  ];
  let lastError = null;
  for (const attempt of attempts) {
    try {
      const generatedSource = await requestSeedreamImage({
        prompt: attempt.prompt,
        referenceImage: attempt.referenceImage,
        timeoutMs: attempt.label === "reference" ? 180000 : 120000,
      });
      const imageUrl = await finalizeCharacterImage(generatedSource);
      return { imageUrl, provider: attempt.provider };
    } catch (error) {
      lastError = error;
      console.warn(`custom character ${attempt.label} generation failed:`, error.message);
    }
  }
  throw lastError || new Error("Character generation failed");
}

async function handleCustomCharacter(req, res) {
  const body = await readJson(req);
  const referenceImage = typeof body.referenceImage === "string" ? body.referenceImage.slice(0, 12 * 1024 * 1024) : "";
  const name = String(body.name || "").trim().slice(0, 12);
  const personaHint = String(body.personaHint || "").trim().slice(0, 160);
  const styleBasePet = basePetDirections[body.styleBasePet] ? body.styleBasePet : "guardian";
  if (!referenceImage) return json(res, 400, { ok: false, error: "referenceImage is required" });
  if (!name) return json(res, 400, { ok: false, error: "name is required" });

  const profile = await createCustomCharacterProfile({ name, personaHint, styleBasePet });
  const fallbackImageUrl = (basePetDirections[styleBasePet] || basePetDirections.guardian).imageUrl;
  let imageUrl = fallbackImageUrl;
  let provider = "local-character-template";
  try {
    const generated = await generateCustomCharacterImage({
      prompt: customCharacterImagePrompt({ name: profile.name, personaHint: profile.personality || personaHint, styleBasePet }),
      fallbackPrompt: customCharacterFallbackPrompt({ name: profile.name, personaHint: profile.personality || personaHint, styleBasePet }),
      referenceImage,
    });
    imageUrl = generated.imageUrl;
    provider = generated.provider;
  } catch (error) {
    console.warn("custom character image fallback:", error.message);
  }

  json(res, 200, {
    ok: true,
    provider,
    pet: {
      ...profile,
      imageUrl,
      referenceImageUrl: provider === "model-character-image" ? "uploaded-reference" : "",
    },
  });
}

function wrapCuteText(text, maxChars = 9, maxLines = 3) {
  const clean = String(text || "")
    .replace(/\s+/g, "")
    .replace(/[。！？；,.!?:：]+$/g, "")
    .slice(0, maxChars * maxLines);
  if (!clean) return [];
  const lines = [];
  for (let index = 0; index < clean.length && lines.length < maxLines; index += maxChars) {
    lines.push(clean.slice(index, index + maxChars));
  }
  return lines;
}

function cuteShortText(text, fallback, maxLength = 20) {
  const clean = String(text || "")
    .replace(/\s+/g, "")
    .replace(/[。！？；,.!?:：]+$/g, "")
    .slice(0, maxLength);
  return clean || fallback;
}

const genericCuteTerms = [
  "治愈时刻",
  "值得记住",
  "值得记录",
  "今日记录",
  "好适合记下来",
  "学习感",
  "生活感",
  "日常感",
  "这一幕真治愈",
  "看着就开心",
  "今天主角",
];

function isGenericCuteText(text) {
  const clean = cuteShortText(text, "", 30);
  if (!clean) return true;
  if (genericCuteTerms.includes(clean)) return true;
  return /^(日常|学习|运动|饮食|风景|社交|创作|情绪|整理|记录|瞬间)$/.test(clean);
}

function cuteNaturalText(text, fallback, maxLength = 20) {
  const clean = cuteShortText(text, "", maxLength);
  if (!clean || isGenericCuteText(clean)) return cuteShortText(fallback, fallback, maxLength);
  return clean;
}

function uniqueCuteItems(items, limit = 6, maxLength = 12) {
  const result = [];
  const seen = new Set();
  for (const item of items || []) {
    const clean = cuteShortText(item, "", maxLength);
    if (!clean) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
    if (result.length >= limit) break;
  }
  return result;
}

function buildAnnotationFallbackCallouts({ analyzeResult, category, petName }) {
  const categoryLabel = categoryNames[category] || "日常";
  const event = cuteShortText(analyzeResult?.event, "", 8);
  const tags = uniqueCuteItems(analyzeResult?.tags, 4, 8).filter((item) => !isGenericCuteText(item));
  const emotions = uniqueCuteItems(analyzeResult?.emotionSignals, 3, 8).filter((item) => !isGenericCuteText(item));
  const feedback = cuteShortText(analyzeResult?.feedback, "", 26);
  const mainObject = event
    ? cuteShortText(`这一幕像${event}`, "今天这一幕", 12)
    : tags[0]
      ? cuteShortText(`${tags[0]}被拍到了`, "今天这一幕", 12)
      : "今天这一幕";
  const ambience = tags[1]
    ? cuteShortText(`${tags[1]}也很加分`, `${categoryLabel}气氛正好`, 12)
    : cuteShortText(`${categoryLabel}气氛正好`, "光线刚刚好", 12);
  const feeling = emotions[0]
    ? cuteShortText(`${emotions[0]}慢慢冒出来`, "想把它记下来", 12)
    : feedback
      ? cuteNaturalText(feedback, "想把它记下来", 12)
      : "想把它记下来";
  const title = cuteShortText(event || tags[0] || "今日小瞬间", "今日小瞬间", 8);
  const headline = feedback
    ? cuteNaturalText(feedback, `${petName}想把这幕收好`, 16)
    : emotions[0]
      ? cuteShortText(`${emotions[0]}有落点了`, "这张图很会安慰人", 16)
      : cuteShortText(`${categoryLabel}里有小亮点`, "这张图很会发光", 16);
  const summary = cuteShortText(feedback || `${petName}觉得这一幕很值得收好`, `${petName}觉得这一幕很值得收好`, 26);
  const chips = uniqueCuteItems([categoryLabel, ...emotions, ...tags], 3, 8).filter((item) => !isGenericCuteText(item) || item === categoryLabel);
  return {
    title,
    headline,
    callouts: [mainObject, ambience, feeling],
    summary,
    chips: chips.length ? chips : [categoryLabel, "小发现", "想收藏"],
  };
}

function cutePalette(category) {
  const palettes = {
    study: { accent: "#8dcbd0", accentSoft: "#e9f7f8", accentStrong: "#5aa4af", glow: "#d7f0f2" },
    sport: { accent: "#f6cf72", accentSoft: "#fff6d8", accentStrong: "#d8a742", glow: "#fff0bf" },
    food: { accent: "#f4aab8", accentSoft: "#fff1f5", accentStrong: "#d87392", glow: "#ffe4ec" },
    scenery: { accent: "#a8d9bf", accentSoft: "#edf8f1", accentStrong: "#6ead8b", glow: "#dff1e7" },
    social: { accent: "#f1b9a0", accentSoft: "#fff3ec", accentStrong: "#d48a69", glow: "#ffe8db" },
    creation: { accent: "#c9b3f7", accentSoft: "#f4efff", accentStrong: "#8d70da", glow: "#ebe1ff" },
    emotion: { accent: "#b7c9ff", accentSoft: "#eef3ff", accentStrong: "#758ad8", glow: "#dfe7ff" },
    organize: { accent: "#f7d194", accentSoft: "#fff7e5", accentStrong: "#c88f41", glow: "#fff0cd" },
  };
  return palettes[category] || palettes.study;
}

function fallbackAnnotationPlan({ analyzeResult, category, petName }) {
  const semanticPlan = buildAnnotationFallbackCallouts({ analyzeResult, category, petName });
  return {
    title: semanticPlan.title,
    headline: semanticPlan.headline,
    callouts: semanticPlan.callouts,
    summary: semanticPlan.summary,
    chips: semanticPlan.chips,
  };
}

async function createAnnotationPlan({ imageData, analyzeResult, category, petName }) {
  if (!OPENAI_API_KEY || !imageData) {
    return fallbackAnnotationPlan({ analyzeResult, category, petName });
  }
  const content = await openAIChat(
    [
      {
        role: "system",
        content: "你是可爱手账图片批注文案助手。根据图片和识图结果，生成适合覆盖在照片上的治愈系手写批注文案。只输出 JSON，不输出 Markdown。",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              `当前灵宠名字：${petName}`,
              `识别类别：${categoryNames[category] || category}`,
              `识别事件：${analyzeResult?.event || "未提供"}`,
              `识别标签：${Array.isArray(analyzeResult?.tags) ? analyzeResult.tags.join("、") : "未提供"}`,
              `情绪线索：${Array.isArray(analyzeResult?.emotionSignals) ? analyzeResult.emotionSignals.join("、") : "未提供"}`,
              `宠物反馈：${analyzeResult?.feedback || "未提供"}`,
              "请输出严格 JSON，字段为：title, headline, callouts, summary, chips。",
              "要求：title 不超过 8 个字；headline 不超过 16 个字；callouts 为 3 条、每条不超过 12 个字；summary 不超过 26 个字；chips 为 3 个、每个不超过 8 个字。",
              "callouts[0] 写画面里的主体、动作或最先被看到的小细节；callouts[1] 写环境、光线、氛围或陪衬；callouts[2] 写情绪感受或为什么这一幕值得记住。",
              "整体语气要像可爱手账批注，温柔、轻松、像宠物在旁边小声碎碎念；不要写命令式口吻，不要写技术词，不要像打卡总结。",
              "不要把 tags 原样抄成单个标签词；尽量写成自然短句。避免输出“学习感”“治愈时刻”“值得记录”“今日记录”这类泛化占位词。",
            ].join("\n"),
          },
          { type: "image_url", image_url: { url: imageData } },
        ],
      },
    ],
    { temperature: 0.6, max_tokens: 1000, timeoutMs: 60000 },
  );
  const parsed = parseJsonFromText(content);
  const fallback = fallbackAnnotationPlan({ analyzeResult, category, petName });
  return {
    title: cuteNaturalText(parsed.title, fallback.title, 8),
    headline: cuteNaturalText(parsed.headline, fallback.headline, 16),
    callouts: (Array.isArray(parsed.callouts) ? parsed.callouts : fallback.callouts)
      .map((item, index) => cuteNaturalText(item, fallback.callouts[index] || "想把它记下来", 12))
      .slice(0, 3),
    summary: cuteNaturalText(parsed.summary, fallback.summary, 26),
    chips: (Array.isArray(parsed.chips) ? parsed.chips : fallback.chips)
      .map((item, index) => cuteNaturalText(item, fallback.chips[index] || "小发现", 8))
      .slice(0, 3),
  };
}

async function resolvePetStickerBuffer({ petKey, petImage }) {
  if (petImage) return sourceToBuffer(petImage);
  const assetPath = petAnnotationAssets[petKey];
  if (!assetPath) return null;
  const filePath = path.join(ROOT, assetPath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
}

function cuteOverlaySvg({ width, height, palette, plan, petName, petKey }) {
  const titleLines = wrapCuteText(plan.title, 6, 2);
  const headlineLines = wrapCuteText(plan.headline, 8, 2);
  const callouts = (plan.callouts || []).slice(0, 3);
  const ratio = width / Math.max(height, 1);
  const isLandscape = ratio > 1.12;
  const isPortrait = ratio < 0.86;
  const compact = width < 900;
  const leftPad = Math.round(width * 0.05);
  const topPad = Math.round(height * 0.06);
  const doodleStroke = compact ? 4 : 5;
  const titleFont = Math.round(width * (compact ? 0.031 : 0.034));
  const headlineFont = Math.round(width * (compact ? 0.022 : 0.024));
  const calloutFont = Math.round(width * (compact ? 0.019 : 0.021));
  const titleBoxWidth = Math.round(width * (isPortrait ? 0.5 : isLandscape ? 0.34 : 0.4));
  const titleBoxHeight = Math.round(height * (isPortrait ? 0.13 : 0.14));

  const calloutLayouts = isLandscape
    ? [
        { x: leftPad, y: Math.round(height * 0.67), rotate: -4, targetX: Math.round(width * 0.28), targetY: Math.round(height * 0.68) },
        { x: Math.round(width * 0.68), y: Math.round(height * 0.33), rotate: 3, targetX: Math.round(width * 0.62), targetY: Math.round(height * 0.39) },
        { x: Math.round(width * 0.69), y: Math.round(height * 0.58), rotate: 1, targetX: Math.round(width * 0.63), targetY: Math.round(height * 0.63) },
      ]
    : isPortrait
      ? [
          { x: leftPad, y: Math.round(height * 0.56), rotate: -3, targetX: Math.round(width * 0.31), targetY: Math.round(height * 0.65) },
          { x: Math.round(width * 0.6), y: Math.round(height * 0.34), rotate: 2, targetX: Math.round(width * 0.54), targetY: Math.round(height * 0.4) },
          { x: Math.round(width * 0.58), y: Math.round(height * 0.74), rotate: 0, targetX: Math.round(width * 0.52), targetY: Math.round(height * 0.78) },
        ]
      : [
          { x: leftPad, y: Math.round(height * 0.62), rotate: -4, targetX: Math.round(width * 0.29), targetY: Math.round(height * 0.67) },
          { x: Math.round(width * 0.68), y: Math.round(height * 0.3), rotate: 2, targetX: Math.round(width * 0.6), targetY: Math.round(height * 0.38) },
          { x: Math.round(width * 0.68), y: Math.round(height * 0.67), rotate: 0, targetX: Math.round(width * 0.6), targetY: Math.round(height * 0.71) },
        ];

  function textGroup(lines, x, y, fontSize, rotate = 0, align = "start") {
    const lineHeight = Math.round(fontSize * 1.35);
    const anchor = align === "middle" ? "middle" : "start";
    return `
      <g transform="rotate(${rotate} ${x} ${y})">
        ${lines
          .map(
            (line, index) => `
          <text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}"
            font-size="${fontSize}" font-family="'Trebuchet MS','Segoe UI Rounded','PingFang SC','Microsoft YaHei',sans-serif"
            font-weight="700" fill="#ffffff" stroke="rgba(111,84,96,0.16)" stroke-width="1.6" paint-order="stroke">
            ${escapeSvg(line)}
          </text>`,
          )
          .join("")}
      </g>
    `;
  }

  function noteBubble(lines, layout, fontSize) {
    const safeLines = lines.length ? lines : ["想把它记下来"];
    const lineHeight = Math.round(fontSize * 1.35);
    const contentWidth = Math.max(...safeLines.map((line) => Math.max(2, line.length))) * fontSize + fontSize * 0.8;
    const bubbleWidth = Math.round(contentWidth + fontSize * 1.5);
    const bubbleHeight = Math.round(safeLines.length * lineHeight + fontSize * 1.3);
    return `
      <g transform="rotate(${layout.rotate} ${layout.x + bubbleWidth / 2} ${layout.y + bubbleHeight / 2})" filter="url(#softShadow)">
        <rect x="${layout.x}" y="${layout.y}" width="${bubbleWidth}" height="${bubbleHeight}" rx="${Math.round(fontSize * 0.95)}"
          fill="rgba(255,252,248,0.18)" stroke="rgba(255,255,255,0.96)" stroke-width="${compact ? 3 : 4}" stroke-dasharray="${compact ? "8 8" : "10 9"}"/>
        ${safeLines
          .map(
            (line, index) => `
          <text x="${layout.x + fontSize * 0.78}" y="${layout.y + fontSize * 1.05 + index * lineHeight}"
            font-size="${fontSize}" font-family="'Trebuchet MS','Segoe UI Rounded','PingFang SC','Microsoft YaHei',sans-serif"
            font-weight="700" fill="#ffffff" stroke="rgba(111,84,96,0.16)" stroke-width="1.4" paint-order="stroke">
            ${escapeSvg(line)}
          </text>`,
          )
          .join("")}
      </g>
      <path d="M ${layout.x + bubbleWidth * 0.16} ${layout.y + bubbleHeight * 0.92}
        C ${layout.x + bubbleWidth * 0.12} ${layout.y + bubbleHeight + fontSize * 0.4},
          ${layout.targetX - fontSize * 0.4} ${layout.targetY - fontSize * 0.3},
          ${layout.targetX} ${layout.targetY}"
        fill="none" stroke="#ffffff" stroke-width="${doodleStroke}" stroke-linecap="round" stroke-dasharray="${compact ? "7 8" : "8 9"}" opacity="0.95"/>
    `;
  }

  const petLabel = cuteShortText(petKey === "zhangXuefeng" ? "高考加油" : petName, petName, 10);

  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#85616f" flood-opacity="0.16"/>
      </filter>
    </defs>

    <rect x="${leftPad - 6}" y="${topPad - 4}" width="${titleBoxWidth}" height="${titleBoxHeight}" rx="26" fill="rgba(255,255,255,0.06)"/>

    ${textGroup(titleLines, leftPad, topPad + Math.round(titleFont * 0.7), titleFont, -5)}
    ${textGroup(headlineLines, leftPad + 16, topPad + Math.round(titleFont * 2.3), headlineFont, -2)}

    <path d="M ${leftPad + 20} ${topPad + Math.round(titleBoxHeight * 0.9)} C ${leftPad + 56} ${topPad + Math.round(titleBoxHeight * 0.74)}, ${leftPad + 92} ${topPad + Math.round(titleBoxHeight * 0.98)}, ${leftPad + 134} ${topPad + Math.round(titleBoxHeight * 0.9)}" fill="none" stroke="#ffffff" stroke-width="${doodleStroke}" stroke-linecap="round" stroke-dasharray="${compact ? "7 8" : "8 9"}" opacity="0.92"/>

    ${noteBubble(wrapCuteText(callouts[0] || "今天这一幕", 6, 2), calloutLayouts[0], calloutFont)}
    ${noteBubble(wrapCuteText(callouts[1] || "光线刚刚好", 6, 2), calloutLayouts[1], calloutFont)}
    ${noteBubble(wrapCuteText(callouts[2] || "想把它记下来", 6, 2), calloutLayouts[2], calloutFont)}

    <g filter="url(#softShadow)">
      <circle cx="${width - leftPad - 84}" cy="${topPad + 74}" r="66" fill="rgba(255,251,246,0.9)" stroke="rgba(255,255,255,0.96)" stroke-width="4"/>
      <path d="M ${width - leftPad - 144} ${topPad + 20} q 18 -12 40 0" fill="none" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round"/>
      <path d="M ${width - leftPad - 28} ${topPad + 28} q 10 -12 24 -4" fill="none" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round"/>
      <text x="${width - leftPad - 84}" y="${topPad + 160}" text-anchor="middle"
        font-size="${Math.round(width * 0.016)}" font-family="'Trebuchet MS','Segoe UI Rounded','PingFang SC','Microsoft YaHei',sans-serif"
        font-weight="700" fill="#ffffff" stroke="rgba(111,84,96,0.16)" stroke-width="1.4" paint-order="stroke">${escapeSvg(petLabel)}</text>
    </g>
  </svg>`);
}

async function composeAnnotatedPhoto({ imageData, plan, category, petKey, petName, petImage }) {
  const baseBuffer = await sourceToBuffer(imageData);
  const base = sharp(baseBuffer).rotate();
  const metadata = await base.metadata();
  const targetWidth = metadata.width && metadata.width > 1280 ? 1280 : metadata.width || 1080;
  const resized = base.resize({ width: targetWidth, withoutEnlargement: true }).png();
  const resizedBuffer = await resized.toBuffer();
  const resizedMeta = await sharp(resizedBuffer).metadata();
  const width = resizedMeta.width || targetWidth;
  const height = resizedMeta.height || 1440;
  const palette = cutePalette(category);
  const overlay = cuteOverlaySvg({ width, height, palette, plan, petName, petKey });
  const composites = [{ input: overlay, left: 0, top: 0 }];
  const stickerBuffer = await resolvePetStickerBuffer({ petKey, petImage }).catch(() => null);
  if (stickerBuffer) {
    const stickerSize = Math.max(118, Math.round(width * 0.14));
    const petLayer = await sharp(stickerBuffer)
      .ensureAlpha()
      .resize({ width: stickerSize, height: stickerSize, fit: "contain" })
      .png()
      .toBuffer();
    composites.push({
      input: petLayer,
      left: width - Math.round(width * 0.05) - stickerSize - 25,
      top: Math.round(height * 0.055) + 8,
    });
  }
  const finalBuffer = await sharp(resizedBuffer).composite(composites).png().toBuffer();
  const imageUrl = await persistAnnotatedImage(finalBuffer);
  return { imageUrl, palette };
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

async function handleImageAnnotate(req, res) {
  const body = await readJson(req);
  const imageData = typeof body.imageData === "string" ? body.imageData.slice(0, 12 * 1024 * 1024) : "";
  if (!imageData) return json(res, 400, { ok: false, error: "imageData is required" });

  const analyzeResult = body.analyzeResult && typeof body.analyzeResult === "object" ? body.analyzeResult : {};
  const category = categoryNames[analyzeResult.category] ? analyzeResult.category : body.selectedCategory || "study";
  const petKey = String(body.petKey || "guardian").slice(0, 40);
  const petName = String(body.petName || "灵瑞").trim().slice(0, 16) || "灵瑞";
  const petImage = typeof body.petImage === "string" ? body.petImage.slice(0, 12 * 1024 * 1024) : "";

  const plan = await createAnnotationPlan({ imageData, analyzeResult, category, petName });
  const composed = await composeAnnotatedPhoto({ imageData, plan, category, petKey, petName, petImage });

  json(res, 200, {
    ok: true,
    provider: OPENAI_API_KEY ? "openai-overlay" : "local-overlay",
    imageUrl: composed.imageUrl,
    plan,
    palette: composed.palette,
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
    if (pathname === "/api/pets/custom-character") return await handleCustomCharacter(req, res);
    if (pathname === "/api/images/analyze") return await handleImageAnalyze(req, res);
    if (pathname === "/api/images/annotate") return await handleImageAnnotate(req, res);
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
