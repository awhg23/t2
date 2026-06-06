const pets = {
  guardian: {
    type: "守护型",
    name: "鹿眠",
    img: "./assets/pets/transparent/guardian.png",
    line: "我在这里，陪你把今天慢慢放稳。",
    tags: ["稳定", "信任", "夜间陪伴"],
    tone: "稳定、安抚、不强迫",
    reply(input) {
      if (isTired(input)) return "你已经撑到现在了，先不用逼自己立刻变好。我会在这里陪你坐一会儿，等呼吸慢下来，我们只把事情翻开一小角就好。";
      if (isDelay(input)) return "不用一下子完成。我们先把任务放到桌面上，只做最小的一步，我会陪着你。";
      return "我听见了。先把今天放慢一点，我们不用急着给所有事情答案。";
    },
  },
  vitality: {
    type: "活力型",
    name: "栗冲",
    img: "./assets/pets/transparent/vitality.png",
    line: "出发，先完成一个很小的挑战。",
    tags: ["元气", "探索", "行动力"],
    tone: "主动、明亮、小任务驱动",
    reply(input) {
      if (isTired(input)) return "收到，电量低也可以行动一点点。我们不冲一整晚，只做 3 分钟：站起来、喝口水、打开第一件事。";
      if (isDelay(input)) return "任务太大就切小。现在开启 5 分钟挑战，完成后就算赢下一小局。";
      return "可以，先动起来一点点。今天给自己留一个能完成的小目标。";
    },
  },
  wisdom: {
    type: "智慧型",
    name: "星阅",
    img: "./assets/pets/transparent/wisdom.png",
    line: "我们把问题拆清楚，再决定下一步。",
    tags: ["观察", "推理", "策略"],
    tone: "理性、结构化、会复盘",
    reply(input) {
      if (isTired(input)) return "先判断疲惫来源：睡眠不足、任务过大，还是不知道从哪开始？如果是任务过大，把目标降到整理 3 个要点。";
      if (isDelay(input)) return "拖延通常不是意志问题，而是入口不清。建议写下任务、耗时、第一步，只执行第一步。";
      return "我建议先提取事实，再列选择。你现在最需要的是清晰，而不是马上用力。";
    },
  },
  healing: {
    type: "治愈型",
    name: "橡芽",
    img: "./assets/pets/transparent/healing.png",
    line: "先照顾你，再处理事情。",
    tags: ["共情", "修复", "生活力"],
    tone: "温柔、允许休息、照料感",
    reply(input) {
      if (isTired(input)) return "辛苦了。今天不想继续并不代表你失败了，可能只是身体在提醒你需要恢复。先喝点水，剩下的慢慢来。";
      if (isDelay(input)) return "先别责备自己。我们可以把任务放轻一点，等能量回来后，只做一个不会压垮你的开始。";
      return "我会先接住你的感受。你可以慢一点，也可以先照顾好自己。";
    },
  },
  wonder: {
    type: "奇想型",
    name: "梦铃",
    img: "./assets/pets/transparent/wonder.png",
    line: "把今天的碎片折成一颗灵感星星。",
    tags: ["梦境", "灵感", "创造力"],
    tone: "幻想化、有画面感、转化情绪",
    reply(input) {
      if (isTired(input)) return "那我们先不把自己丢进厚厚的书山里。把疲惫折成小纸船，让它漂远一点，再捡起一颗最小的知识星星。";
      if (isDelay(input)) return "任务门太大，就从旁边的小窗钻进去。给它取个剧情名，然后完成第一幕。";
      return "这句话像一枚小铃铛。我们把它挂到今天的梦境地图上，看看会通向哪里。";
    },
  },
};

const categories = {
  study: { name: "学习", tags: ["书本", "笔记", "自习"], delta: { knowledge: 20, discipline: 8, order: 5 }, event: "书页发光" },
  sport: { name: "运动", tags: ["操场", "能量", "身体"], delta: { sport: 20, exploration: 8, emotion: 5 }, event: "活力徽章" },
  food: { name: "饮食", tags: ["三餐", "照料", "生活"], delta: { life: 15, emotion: 8, intimacy: 5 }, event: "晨光餐盘" },
  scenery: { name: "风景", tags: ["天空", "校园", "漫游"], delta: { exploration: 18, creativity: 10, emotion: 5 }, event: "地图碎片" },
  social: { name: "社交", tags: ["合照", "活动", "连接"], delta: { social: 20, exploration: 8, intimacy: 5 }, event: "人群灯火" },
  creation: { name: "创作", tags: ["绘画", "代码", "灵感"], delta: { creativity: 20, knowledge: 8, order: 5 }, event: "灵感火花" },
  emotion: { name: "情绪", tags: ["夜晚", "雨天", "独处"], delta: { emotion: 12, intimacy: 10, life: 5 }, event: "关怀提醒" },
  organize: { name: "整理", tags: ["书桌", "房间", "计划"], delta: { order: 20, discipline: 10, life: 8 }, event: "清爽角落" },
};

const attributes = {
  discipline: "自律值",
  exploration: "探索值",
  emotion: "情绪稳定",
  social: "社交能量",
  creativity: "创造力",
  knowledge: "知识值",
  life: "生活力",
  sport: "运动力",
  intimacy: "关系亲密度",
  order: "内在秩序感",
};

const titlesByAttr = {
  discipline: ["晨光自律者", "稳定行动派", "正在找回节奏的人"],
  exploration: ["校园探索者", "路线收集家", "等待风来的漫游者"],
  emotion: ["温柔修复者", "静湖守护者", "需要一点阳光的夜行者"],
  social: ["社团星火", "关系织光者", "还在学习表达的人"],
  creativity: ["灵感收集师", "梦境造物者", "等待被点亮的灵感种子"],
  knowledge: ["深夜思考家", "星图阅读者", "书页点灯人"],
  life: ["温柔记录者", "生活修补师", "慢慢整理生活的人"],
  sport: ["操场风声", "稳定奔跑者", "正在热身的行动者"],
  intimacy: ["灵犀朋友", "共鸣同行者", "初识灵友"],
  order: ["内在花园主", "清爽角落制造者", "还在长出秩序的人"],
};

const quiz = [
  ["最近你最希望被怎样陪伴？", ["安静待在我旁边", "拉我动起来", "帮我分析清楚", "温柔接住我", "带我换个脑洞"]],
  ["你现在的生活状态更像？", ["稳定但有点累", "想出去做点事", "事情很多有点乱", "身心都需要恢复", "灵感很多但飘"]],
  ["你希望 AI 宠物更像谁？", ["房间守护者", "行动搭子", "学习军师", "情绪树洞", "创意伙伴"]],
  ["你偏好的互动节奏是？", ["安静陪伴", "主动提醒", "理性拆解", "温柔安慰", "脑洞互动"]],
  ["你最想提升什么？", ["自律与作息", "运动与社交", "学习与计划", "情绪与生活", "创造力"]],
  ["如果今晚状态不好，你希望它说？", ["我在，你可以慢一点", "先做 3 分钟就好", "我们找出累的原因", "今天可以先休息", "把疲惫装进云里"]],
  ["你上传照片最可能是？", ["书桌/床边/夜灯", "操场/活动/路上", "笔记/电脑/资料", "早餐/房间/雨天", "涂鸦/天空/奇怪角落"]],
  ["你对提醒的接受度？", ["轻轻提醒即可", "可以多催我一点", "给我明确计划", "不要有压力", "用有趣方式提醒"]],
  ["朋友眼中的你更像？", ["可靠慢热", "元气外向", "清醒理性", "细腻温柔", "有梗有想法"]],
  ["你想和灵宠建立的关系是？", ["长期信任", "一起打卡", "一起复盘", "互相照料", "一起造梦"]],
  ["当你拖延时，最有效的是？", ["陪我先坐下", "给我小挑战", "拆成步骤", "允许我缓一缓", "换个玩法开始"]],
  ["你希望成长报告更突出？", ["稳定感", "行动力", "逻辑与知识", "修复与照料", "灵感与表达"]],
  ["你最容易被哪种画面吸引？", ["夜灯、护符、柔软房间", "背包、徽章、校园路标", "星图、眼镜、笔记", "绿植、汤品、晴窗", "梦境、铃铛、异空间"]],
  ["分享给朋友时，你希望别人看到？", ["我可靠的一面", "我有行动力的一面", "我会思考的一面", "我温柔的一面", "我有趣的一面"]],
  ["你期待 7 天后发生什么？", ["更安心", "更有节奏", "更清楚目标", "更有能量", "更有灵感"]],
];

const petOrder = ["guardian", "vitality", "wisdom", "healing", "wonder"];
const state = loadState();

function defaultState() {
  const attr = {};
  Object.keys(attributes).forEach((key) => {
    attr[key] = { exp: key === "intimacy" ? 35 : 20, level: 1 };
  });
  return {
    activePet: "guardian",
    quizStep: 0,
    quizScores: { guardian: 0, vitality: 0, wisdom: 0, healing: 0, wonder: 0 },
    selectedCategory: "study",
    uploads: [],
    memories: [],
    messages: [],
    petNames: Object.fromEntries(petOrder.map((key) => [key, pets[key].name])),
    currency: 99999,
    debugCurrencyLocked: true,
    outfits: [],
    equippedOutfits: {},
    attributes: attr,
    achievements: {},
    personaLink: null,
    importedPersona: null,
    streakDays: 1,
  };
}

function loadState() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem("lingrui-state") || "{}") };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem("lingrui-state", JSON.stringify(state));
}

function petName(key = state.activePet) {
  return state.petNames?.[key] || pets[key]?.name || "灵瑞";
}

function setPetName(key, name) {
  const clean = name.trim().slice(0, 8);
  if (!clean) return;
  if (!state.petNames) state.petNames = {};
  state.petNames[key] = clean;
  saveState();
}

function currencyAmount() {
  return state.debugCurrencyLocked ? 99999 : state.currency || 0;
}

function grantCurrency(amount) {
  if (state.debugCurrencyLocked) {
    state.currency = 99999;
    return;
  }
  state.currency = (state.currency || 0) + amount;
}

function activeOutfit(key = state.activePet) {
  const outfitId = state.equippedOutfits?.[key];
  return state.outfits?.find((outfit) => outfit.id === outfitId) || null;
}

function activePetImage(key = state.activePet) {
  const outfit = activeOutfit(key);
  return outfit && outfit.provider !== "local-fallback" ? outfit.imageUrl : pets[key]?.img;
}

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function isTired(text) {
  return /累|疲惫|难受|不想|崩|睡不着|焦虑|难过/.test(text);
}

function isDelay(text) {
  return /拖延|学不进去|不想学|作业|复习|任务|ddl|deadline/.test(text);
}

function levelFromExp(exp) {
  const thresholds = [0, 60, 140, 260, 420, 620, 860, 1140, 1460, 1820];
  return thresholds.reduce((level, threshold, index) => (exp >= threshold ? index + 1 : level), 1);
}

function setView(viewName) {
  $all(".view").forEach((view) => view.classList.toggle("is-active", view.id === `view-${viewName}`));
  $all(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewName));
}

function renderPet() {
  const pet = pets[state.activePet];
  const name = petName(state.activePet);
  $("#activePetImage").src = activePetImage();
  $("#activePetType").textContent = pet.type;
  $("#activePetName").textContent = name;
  $("#petNameInput").value = name;
  $("#activePetLine").textContent = pet.line;
  $("#streakDays").textContent = state.streakDays;
  $("#currencyAmount").textContent = currencyAmount().toLocaleString("zh-CN");
  $("#homeGreeting").textContent = `${name}正在等你的今日手账`;
  $("#homeAdvice").textContent = `${pet.tone}。上传图片或聊天会同时推进灵宠成长和用户画像。`;
  $("#currentPetMeta").textContent = pet.type;
  $("#homePetImage").src = activePetImage();
  $("#homePetName").textContent = name;
  $("#homePetTone").textContent = activeOutfit() ? `${pet.tone} · 已穿戴「${activeOutfit().title}」` : pet.tone;

  const picker = $("#petPicker");
  if (picker) {
    picker.innerHTML = petOrder
      .map((key) => {
        const item = pets[key];
        return `<button class="pet-card ${key === state.activePet ? "is-active" : ""}" data-pet="${key}">
        <img src="${item.img}" alt="${item.name}" />
        <strong>${petName(key)}</strong>
        <small>${item.type}</small>
      </button>`;
      })
      .join("");
  }
}

function renderOutfits() {
  const price = 1200;
  $("#workshopCurrency").textContent = currencyAmount().toLocaleString("zh-CN");
  $("#outfitPrice").textContent = price.toLocaleString("zh-CN");
  const equipped = activeOutfit();
  $("#equippedOutfitStatus").textContent = equipped ? `穿戴中 · ${equipped.provider}` : "未穿戴";
  $("#equippedOutfitBox").innerHTML = equipped
    ? `<img src="${equipped.imageUrl}" alt="${escapeHtml(equipped.title)}" /><strong>${escapeHtml(equipped.title)}</strong><p>${escapeHtml(equipped.description)}</p><button class="secondary-button full" data-unequip-outfit="${state.activePet}">卸下服饰</button>`
    : `<div class="analysis-empty">还没有给 ${petName()} 穿戴服饰。输入描述生成一件吧。</div>`;

  const items = (state.outfits || []).filter((outfit) => outfit.petKey === state.activePet);
  $("#closetCount").textContent = `${items.length} 件`;
  $("#outfitCloset").innerHTML = items.length
    ? items
        .map(
          (outfit) => `<article class="outfit-item ${equipped?.id === outfit.id ? "is-equipped" : ""}">
            <img src="${outfit.imageUrl}" alt="${escapeHtml(outfit.title)}" />
            <div>
              <strong>${escapeHtml(outfit.title)}</strong>
              <p>${escapeHtml(outfit.description)}</p>
              <span>${escapeHtml(outfit.provider)} · ${Number(outfit.price || 0).toLocaleString("zh-CN")} 灵光币</span>
            </div>
            <button class="secondary-button" data-equip-outfit="${outfit.id}">${equipped?.id === outfit.id ? "穿戴中" : "穿戴"}</button>
          </article>`,
        )
        .join("")
    : `<div class="analysis-empty">衣柜还是空的。当前调试模式货币锁定 99999，可以直接生成。</div>`;
}

function renderAttributes() {
  Object.entries(state.attributes).forEach(([key, value]) => {
    value.level = levelFromExp(value.exp);
  });
  const sorted = Object.entries(state.attributes).sort((a, b) => b[1].exp - a[1].exp);
  $("#topAttributes").innerHTML = sorted
    .slice(0, 5)
    .map(([key, value]) => attributeRow(key, value))
    .join("");
  $("#radarChart").innerHTML = Object.entries(state.attributes)
    .map(([key, value]) => `<div class="radar-row">${attributeRow(key, value)}</div>`)
    .join("");
}

function attributeRow(key, value) {
  const percent = Math.min(100, Math.round((value.exp / 1820) * 100));
  return `<span>${attributes[key]}</span><div class="meter"><i style="width:${percent}%"></i></div><strong>Lv.${value.level}</strong>`;
}

function renderQuiz() {
  const done = state.quizStep >= quiz.length;
  $(".quiz-card").classList.toggle("hidden", done);
  $("#quizResult").classList.toggle("hidden", !done);
  if (done) {
    const best = bestPetFromScores();
    const pet = pets[best];
    $("#quizResult").innerHTML = `<span class="tag">推荐灵瑞</span>
      <h3>${pet.name} · ${pet.type}</h3>
      <p>${recommendReason(best)}</p>
      <button class="primary-button" data-confirm-pet="${best}">确认 ${pet.name}</button>`;
    return;
  }
  const [question, options] = quiz[state.quizStep];
  $("#quizStep").textContent = `${state.quizStep + 1} / ${quiz.length}`;
  $("#quizProgressBar").style.width = `${(state.quizStep / quiz.length) * 100}%`;
  $("#quizQuestion").textContent = question;
  $("#quizOptions").innerHTML = options
    .map((option, index) => `<button class="quiz-option" data-quiz-choice="${index}">${option}</button>`)
    .join("");
}

function bestPetFromScores() {
  let best = "guardian";
  petOrder.forEach((key) => {
    if (state.quizScores[key] > state.quizScores[best]) best = key;
  });
  return best;
}

function recommendReason(key) {
  const reasons = {
    guardian: "你更需要稳定、信任和低压力陪伴。鹿眠会先帮你把节奏放慢，再陪你一点点恢复秩序。",
    vitality: "你更需要行动力和外部推动。栗冲会把目标变成小挑战，陪你从很小的一步开始。",
    wisdom: "你更需要分析、规划和清晰感。星阅会帮你拆解问题、记录线索、找到下一步。",
    healing: "你更需要共情、照料和恢复。橡芽会先照顾你的感受，再陪你慢慢长回能量。",
    wonder: "你更需要灵感和表达。梦铃会把日常变成故事，把情绪转成可被创作的材料。",
  };
  return reasons[key];
}

function renderCategories() {
  $("#categoryGrid").innerHTML = Object.entries(categories)
    .map(([key, item]) => `<button class="category-chip ${key === state.selectedCategory ? "is-active" : ""}" data-category="${key}">${item.name}</button>`)
    .join("");
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `API request failed: ${response.status}`);
  }
  return data;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function urlToDataUrl(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load reference image: ${response.status}`);
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        }),
    );
}

async function analyzeUpload() {
  const input = $("#photoInput");
  $("#analyzeBtn").disabled = true;
  $("#analyzeBtn").textContent = "AI 正在识别...";
  let apiResult = null;
  try {
    apiResult = await postJson("/api/images/analyze", {
      selectedCategory: state.selectedCategory,
      imageData: await fileToDataUrl(input.files[0]),
      petKey: state.activePet,
    });
  } catch (error) {
    console.warn("image API fallback:", error.message);
  } finally {
    $("#analyzeBtn").disabled = false;
    $("#analyzeBtn").textContent = "AI 识别并结算成长";
  }

  const categoryKey = apiResult?.category || state.selectedCategory;
  const category = categories[categoryKey];
  const confidence = apiResult?.confidence || (input.files.length ? 0.86 : 0.62);
  const deltas = { ...category.delta, intimacy: (category.delta.intimacy || 0) + 5 };
  Object.entries(deltas).forEach(([key, amount]) => {
    if (!state.attributes[key]) state.attributes[key] = { exp: 0, level: 1 };
    state.attributes[key].exp += amount;
  });
  const record = {
    id: crypto.randomUUID(),
    category: categoryKey,
    tags: apiResult?.tags?.length ? apiResult.tags : category.tags,
    confidence,
    event: apiResult?.event || category.event,
    createdAt: new Date().toISOString(),
  };
  state.uploads.unshift(record);
  $("#todayDelta").textContent = `${category.name}照片 · ${Object.keys(deltas).length} 项成长`;
  $("#confidenceText").textContent = `置信度 ${Math.round(confidence * 100)}%`;
  $("#analysisResult").className = "analysis-card";
  $("#analysisResult").innerHTML = `<span class="tag">${category.name} · ${apiResult ? "大模型识别" : "本地回退"}</span>
    <h3>${record.event}</h3>
    <p>${apiResult?.feedback || photoFeedback(categoryKey)}</p>
    <div class="delta-list">${Object.entries(deltas)
      .map(([key, value]) => `<div class="attribute-row"><span>${attributes[key]}</span><div class="meter"><i style="width:${Math.min(value * 4, 100)}%"></i></div><strong>+${value}</strong></div>`)
      .join("")}</div>
    <p>画像标签：${record.tags.join("、")}${apiResult?.emotionSignals?.length ? `；情绪线索：${apiResult.emotionSignals.join("、")}` : ""}</p>`;
  if (!state.achievements.firstUpload) {
    state.achievements.firstUpload = true;
    grantCurrency(300);
    showAchievement();
  }
  saveState();
  renderAll();
}

function photoFeedback(categoryKey) {
  const base = {
    study: "我看到你把注意力放回来了，这一页也算一小片星光。",
    sport: "身体开始醒过来了，今天的你比刚才多了一点风。",
    food: "这顿饭被好好记录了，照顾自己也算一种成长。",
    scenery: "你把今天的风景带回来了，我会把它收进小图鉴。",
    social: "你今天和世界多连上了一点点，我替你记下这份热闹。",
    creation: "这个想法不是飘走了，它已经落到现实里了。",
    emotion: "我看见你今天有点难。先不用解释，我在这里。",
    organize: "你的空间往前挪了一小步，心里也会空出一点地方。",
  };
  return `${petName()}：${base[categoryKey]}`;
}

function showAchievement() {
  const toast = $("#achievementToast");
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3600);
}

function renderChat() {
  const initial = state.messages.length
    ? ""
    : `<div class="message pet">${petName()}：可以直接对我说“我今天很累，不想学习”，看看不同灵瑞的回复风格。</div>`;
  $("#chatLog").innerHTML =
    initial +
    state.messages
      .map((msg) => `<div class="message ${msg.role}">${msg.role === "pet" ? `${petName(msg.pet || state.activePet)}：` : ""}${escapeHtml(msg.text)}</div>`)
      .join("");
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
}

async function sendChat(text) {
  if (!text.trim()) return;
  const petKey = state.activePet;
  state.messages.push({ role: "user", text, createdAt: new Date().toISOString() });
  state.messages.push({ role: "pet", pet: petKey, text: "我正在认真听你说，等我组织一下回应...", pending: true, createdAt: new Date().toISOString() });
  renderChat();
  let reply;
  let memorySummary;
  let provider = "本地回退";
  try {
    const data = await postJson("/api/chat/reply", {
      petKey,
      petName: petName(petKey),
      message: text,
      messages: state.messages.filter((msg) => !msg.pending).slice(-10),
      memories: state.memories.slice(0, 6),
    });
    reply = data.reply;
    memorySummary = data.memorySummary;
    provider = "大模型";
  } catch (error) {
    console.warn("chat API fallback:", error.message);
    reply = pets[petKey].reply(text);
  }
  const pendingIndex = state.messages.findIndex((msg) => msg.pending);
  if (pendingIndex >= 0) state.messages.splice(pendingIndex, 1);
  state.messages.push({ role: "pet", pet: petKey, text: reply, createdAt: new Date().toISOString() });
  state.memories.unshift({
    id: crypto.randomUUID(),
    summary: memorySummary || `你最近提到：${text.slice(0, 34)}。偏好的支持方式：${pets[petKey].tone}。`,
    tag: `${pets[petKey].type} · ${provider}`,
  });
  grantCurrency(20);
  state.attributes.intimacy.exp += 8;
  saveState();
  renderAll();
}

function renderProfile() {
  const titles = generateTitles();
  $("#titleCount").textContent = `${titles.length} 个`;
  $("#titleList").innerHTML = titles.map((title) => `<span>${title}</span>`).join("");
  $("#memoryList").innerHTML = state.memories.length
    ? state.memories
        .map((memory) => `<div class="memory-item"><div><span>${memory.tag}</span><p>${escapeHtml(memory.summary)}</p></div><button data-delete-memory="${memory.id}">删除</button></div>`)
        .join("")
    : `<div class="analysis-empty">还没有聊天记忆。发送几句话后，这里会生成可控摘要。</div>`;
}

function generateTitles() {
  const sorted = Object.entries(state.attributes).sort((a, b) => b[1].exp - a[1].exp);
  const high = sorted[0]?.[0] || "discipline";
  const low = sorted[sorted.length - 1]?.[0] || "emotion";
  const uploadTitle = state.uploads[0] ? `${categories[state.uploads[0].category].name}记录者` : "初识灵友";
  const companion = state.streakDays >= 7 ? "七日同伴" : "初识灵友";
  return [titlesByAttr[high][0], titlesByAttr[high][1], titlesByAttr[low][2], uploadTitle, companion];
}

function renderShare() {
  const completeness = Math.min(100, Math.round(state.uploads.length * 8 + state.memories.length * 6 + 20));
  const top = Object.entries(state.attributes).sort((a, b) => b[1].exp - a[1].exp)[0][0];
  const pet = pets[state.activePet];
  $("#personaCompleteness").textContent = `画像完整度 ${completeness}%`;
  $("#personaIntro").textContent =
    state.personaIntro || `这是一个带着${pet.type}气质、正在积累「${attributes[top]}」的人格链接。它适合被熟人导入为一只温和的人格投影宠物。`;
  const visibleTags = state.personaTags?.length ? state.personaTags : [...pet.tags, attributes[top], ...generateTitles().slice(0, 2)];
  $("#personaTags").innerHTML = visibleTags.map((tag) => `<span>${escapeHtml(String(tag))}</span>`).join("");
  $("#linkStatus").textContent = state.personaLink ? "已生成" : "尚未生成";
  $("#linkBox").textContent = state.personaLink || "生成后会出现可复制链接。";
  $("#dualPetBox").innerHTML = state.importedPersona
    ? `<strong>双宠对话</strong><p>${petName()}：我们适合一起做一件低压力的小事。</p><p>投影灵宠：我建议今天互相分享一张天空或书桌照。</p><strong>关系报告</strong><p>共同点：都需要被温和理解。适合一起做：自习、散步、轻量创作。</p>`
    : "导入后会生成投影宠物、双宠对话和关系报告。";
}

async function generatePersonaLink() {
  const fallbackIntro = $("#personaIntro").textContent;
  let persona = null;
  try {
    const data = await postJson("/api/persona/generate", {
      pet: { ...pets[state.activePet], name: petName() },
      attributes: state.attributes,
      memories: state.memories.slice(0, 10),
      uploads: state.uploads.slice(0, 10),
    });
    persona = data.persona;
  } catch (error) {
    console.warn("persona API fallback:", error.message);
  }
  state.personaLink = `${location.origin}${location.pathname}#persona-${crypto.randomUUID().slice(0, 8)}`;
  if (persona?.intro) state.personaIntro = persona.intro;
  if (Array.isArray(persona?.tags)) state.personaTags = persona.tags.slice(0, 8);
  if (!persona?.intro) state.personaIntro = fallbackIntro;
  saveState();
  renderShare();
}

async function generateOutfit() {
  const description = $("#outfitPrompt").value.trim();
  if (!description) {
    $("#outfitPrompt").focus();
    return;
  }
  const button = $("#generateOutfitBtn");
  button.disabled = true;
  button.textContent = "生图中...";
  try {
    const referenceImage = await urlToDataUrl(pets[state.activePet].img).catch((error) => {
      console.warn("outfit reference image fallback:", error.message);
      return null;
    });
    const data = await postJson("/api/outfits/generate", {
      description,
      petKey: state.activePet,
      petName: petName(),
      petType: pets[state.activePet].type,
      referenceImage,
    });
    const outfit = {
      id: crypto.randomUUID(),
      petKey: state.activePet,
      title: `${petName()}的定制服饰`,
      description,
      imageUrl: data.imageUrl,
      provider: data.provider || "image-model",
      price: data.price || 1200,
      prompt: data.prompt,
      createdAt: new Date().toISOString(),
    };
    if (!state.outfits) state.outfits = [];
    if (!state.equippedOutfits) state.equippedOutfits = {};
    state.outfits.unshift(outfit);
    state.equippedOutfits[state.activePet] = outfit.id;
    if (!state.debugCurrencyLocked) state.currency = Math.max(0, (state.currency || 0) - outfit.price);
    saveState();
    renderAll();
  } catch (error) {
    console.warn("outfit API failed:", error.message);
  } finally {
    button.disabled = false;
    button.textContent = "生成并加入衣柜";
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function renderAll() {
  renderPet();
  renderAttributes();
  renderQuiz();
  renderCategories();
  renderChat();
  renderOutfits();
  renderProfile();
  renderShare();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.view) setView(target.dataset.view);
  if (target.dataset.jump) setView(target.dataset.jump);
  if (target.dataset.pet) {
    state.activePet = target.dataset.pet;
    saveState();
    renderAll();
  }
  if (target.dataset.quizChoice) {
    const petKey = petOrder[Number(target.dataset.quizChoice)];
    state.quizScores[petKey] += 1;
    state.quizStep += 1;
    saveState();
    renderQuiz();
  }
  if (target.dataset.confirmPet) {
    state.activePet = target.dataset.confirmPet;
    saveState();
    setView("home");
    renderAll();
  }
  if (target.dataset.category) {
    state.selectedCategory = target.dataset.category;
    saveState();
    renderCategories();
  }
  if (target.dataset.deleteMemory) {
    state.memories = state.memories.filter((memory) => memory.id !== target.dataset.deleteMemory);
    saveState();
    renderProfile();
  }
  if (target.dataset.equipOutfit) {
    const outfit = (state.outfits || []).find((item) => item.id === target.dataset.equipOutfit);
    if (outfit) {
      if (!state.equippedOutfits) state.equippedOutfits = {};
      state.equippedOutfits[state.activePet] = outfit.id;
      saveState();
      renderAll();
    }
  }
  if (target.dataset.unequipOutfit) {
    if (!state.equippedOutfits) state.equippedOutfits = {};
    delete state.equippedOutfits[target.dataset.unequipOutfit];
    saveState();
    renderAll();
  }
});

$("#restartQuizBtn").addEventListener("click", () => {
  state.quizStep = 0;
  state.quizScores = { guardian: 0, vitality: 0, wisdom: 0, healing: 0, wonder: 0 };
  saveState();
  renderQuiz();
});

$("#photoInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  $("#photoPreview").src = url;
  $(".drop-zone").classList.add("has-image");
  $("#dropHint").textContent = "已选择图片，可修正类型";
});

$("#analyzeBtn").addEventListener("click", analyzeUpload);

$("#generateOutfitBtn").addEventListener("click", generateOutfit);

$("#editPetNameBtn").addEventListener("click", () => {
  $("#renamePetForm").classList.toggle("hidden");
  $("#petNameInput").focus();
  $("#petNameInput").select();
});

$("#renamePetForm").addEventListener("submit", (event) => {
  event.preventDefault();
  setPetName(state.activePet, $("#petNameInput").value);
  $("#renamePetForm").classList.add("hidden");
  renderAll();
});

$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  sendChat(input.value);
  input.value = "";
});

$("#clearMemoriesBtn").addEventListener("click", () => {
  state.memories = [];
  saveState();
  renderProfile();
});

$("#generateLinkBtn").addEventListener("click", () => {
  generatePersonaLink();
});

$("#deleteLinkBtn").addEventListener("click", () => {
  state.personaLink = null;
  state.importedPersona = null;
  saveState();
  renderShare();
});

$("#importPersonaBtn").addEventListener("click", () => {
  if (!state.personaLink) {
    state.personaLink = `${location.origin}${location.pathname}#persona-demo`;
  }
  state.importedPersona = true;
  saveState();
  renderShare();
});

$("#resetDemoBtn").addEventListener("click", () => {
  const fresh = defaultState();
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  localStorage.removeItem("lingrui-state");
  $(".drop-zone").classList.remove("has-image");
  $("#photoPreview").removeAttribute("src");
  $("#dropHint").textContent = "选择一张生活图片";
  $("#analysisResult").className = "analysis-empty";
  $("#analysisResult").textContent = "识别后会显示类型、标签、经验变化、特殊事件和宠物反馈。";
  $("#confidenceText").textContent = "等待上传";
  setView("home");
  renderAll();
});

renderAll();
