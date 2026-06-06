const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const OPENAI_API_KEY = process.env.ARK_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "doubao-seed-2-0-pro-260215";
const OPENAI_API_MODE = process.env.OPENAI_API_MODE || (OPENAI_BASE_URL.includes("volces.com") ? "responses" : "chat");
const OUTFIT_IMAGE_MODEL = process.env.OUTFIT_IMAGE_MODEL || "doubao-seedream-5-0-260128";
const OUTFIT_PRICE = Number(process.env.OUTFIT_PRICE || 1200);

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

function outfitPrompt({ description, petType, petName }) {
  return [
    "Create a cute chibi spirit pet fashion design image.",
    `Pet type: ${petType || "soft fantasy spirit pet"}. Pet name: ${petName || "Lingrui"}.`,
    `Outfit request: ${description}.`,
    "Visual style: pastel campus diary, soft hand-drawn outlines, warm healing mood, sticker-like Q-version game asset, consistent with cute furry spirit mascot art.",
    "Subject: a full-body chibi spirit pet wearing the custom outfit, centered, clean composition.",
    "Avoid readable text, logos, watermark, photorealism, harsh shadows, dark palette, busy background.",
  ].join("\n");
}

function fallbackOutfitImage({ description, petType }) {
  const safeDescription = String(description || "梦幻校园披风").slice(0, 60);
  const safeType = String(petType || "灵瑞").slice(0, 20);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7ea"/>
      <stop offset="0.55" stop-color="#d8f1e5"/>
      <stop offset="1" stop-color="#ffdbe3"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#8f6b4f" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="96" fill="url(#bg)"/>
  <circle cx="512" cy="520" r="315" fill="#fffdf7" opacity="0.82"/>
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

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function generateOutfitImage(prompt) {
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
        size: "1024x1024",
        response_format: "url",
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

async function handleChat(req, res) {
  const body = await readJson(req);
  const petKey = body.petKey || "guardian";
  const customPetName = String(body.petName || "").trim().slice(0, 16);
  const userMessage = String(body.message || "").slice(0, 1200);
  const recentMemories = Array.isArray(body.memories) ? body.memories.slice(0, 2) : [];

  const content = await openAIChat(
    [
      {
        role: "system",
        content: [
          "你是 AI 灵宠，中文回复。",
          petProfiles[petKey] || petProfiles.guardian,
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
    memorySummary: `用户提到：${userMessage.slice(0, 40)}。本轮由大模型按${petProfiles[petKey] || petProfiles.guardian}生成陪伴反馈。`,
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
  if (!description) return json(res, 400, { ok: false, error: "description is required" });

  const prompt = outfitPrompt({ description, petType, petName });
  try {
    const imageUrl = await generateOutfitImage(prompt);
    return json(res, 200, {
      ok: true,
      provider: "seedream",
      imageUrl,
      price: OUTFIT_PRICE,
      model: OUTFIT_IMAGE_MODEL,
      prompt,
    });
  } catch (error) {
    return json(res, 200, {
      ok: true,
      provider: "local-fallback",
      imageUrl: fallbackOutfitImage({ description, petType }),
      price: OUTFIT_PRICE,
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
        outfitPrice: OUTFIT_PRICE,
      });
    }
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });
    if (pathname === "/api/chat/reply") return await handleChat(req, res);
    if (pathname === "/api/images/analyze") return await handleImageAnalyze(req, res);
    if (pathname === "/api/persona/generate") return await handlePersona(req, res);
    if (pathname === "/api/outfits/generate") return await handleOutfitGenerate(req, res);
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
  console.log(`Outfit image config: model=${OUTFIT_IMAGE_MODEL} price=${OUTFIT_PRICE}`);
});
