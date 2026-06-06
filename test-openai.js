const OPENAI_API_KEY = process.env.ARK_API_KEY || process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "doubao-seed-2-0-pro-260215";
const OPENAI_API_MODE = process.env.OPENAI_API_MODE || (OPENAI_BASE_URL.includes("volces.com") ? "responses" : "chat");

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

async function main() {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY or ARK_API_KEY is not set");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    const isResponses = OPENAI_API_MODE === "responses";
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
              instructions: "你是连通性测试助手。只回复一句中文。",
              input: [{ role: "user", content: "回复：灵瑞 API 已连通" }],
              temperature: 0,
              max_output_tokens: 512,
            }
          : {
              model: OPENAI_MODEL,
              messages: [
                { role: "system", content: "你是连通性测试助手。只回复一句中文。" },
                { role: "user", content: "回复：灵瑞 API 已连通" },
              ],
              temperature: 0,
              max_tokens: 40,
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
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: OPENAI_BASE_URL,
        model: OPENAI_MODEL,
        mode: OPENAI_API_MODE,
        reply: OPENAI_API_MODE === "responses" ? extractResponsesText(payload) : payload.choices?.[0]?.message?.content || "",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.name === "AbortError" ? "OpenAI API request timed out after 20s" : error.message);
  process.exit(1);
});
