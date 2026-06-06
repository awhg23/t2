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
  zhangXuefeng: {
    type: "高考导师型",
    name: "张雪峰老师",
    img: "./assets/pets/transparent/zhang-xuefeng.png",
    line: "高考加油",
    tags: ["高考加油", "升学规划", "直给提气"],
    tone: "帅气、直给、提气、帮你看清选择",
    styleGuide: "像一位帅气、清醒、很会鼓劲的升学导师。先提气，再把问题讲明白，给出可执行选择。",
    reply(input) {
      if (isTired(input)) return "高考加油。累是正常的，但别让情绪替你做决定，先睡够、吃稳，再把最能涨分的一件事拿出来做。";
      if (isDelay(input)) return "高考加油。别空想逆袭，先把任务切到能落笔：一套错题、一个知识点、二十分钟，做完你就比刚才强。";
      return "高考加油。你现在要做的不是慌，是把选择摊开看清楚，然后抓住最有性价比的下一步。";
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

const basePetOrder = ["guardian", "vitality", "wisdom", "healing", "wonder"];
const presetPetOrder = [...basePetOrder, "zhangXuefeng"];
const petActionOrder = ["idle", "wave", "jump", "study", "comfort"];
const petActionLabels = {
  idle: "待机",
  wave: "挥手",
  jump: "开心",
  study: "学习",
  comfort: "安慰",
};
const state = loadState();
const achievementToastQueue = [];
let achievementToastTimer = null;

const achievementCatalog = {
  gaokaoCheer: {
    title: "高考加油",
    description: "愿你落笔生花，前程似锦",
    icon: "GK",
    asset: "first-meet",
    category: "隐藏",
    hidden: true,
    target: 1,
    getValue: () => (state.stats.gaokaoCheerTriggered ? 1 : 0),
  },
  firstMeet: {
    title: "初次相遇",
    description: "第一次完成问卷并领取灵宠",
    icon: "Q",
    asset: "first-meet",
    category: "新手",
    target: 1,
    getValue: () => (state.stats.quizCompletedAt && isAfterAchievementReset(state.stats.quizCompletedAt) ? 1 : 0),
  },
  firstUpload: {
    title: "新的开始",
    description: "第一次上传照片，把日常交给灵瑞",
    icon: "P",
    asset: "first-upload",
    category: "记录",
    target: 1,
    getValue: () => uploadsSinceAchievementReset().length,
  },
  firstOutfit: {
    title: "今日穿搭师",
    description: "第一次生成定制服饰",
    icon: "D",
    asset: "first-outfit",
    category: "工坊",
    target: 1,
    getValue: () => outfitsSinceAchievementReset().length,
  },
  shareStart: {
    title: "分享起点",
    description: "第一次生成或复制人格链接",
    icon: "S",
    asset: "share-start",
    category: "分享",
    target: 1,
    getValue: () => state.stats.shareActions,
  },
  uploadFive: {
    title: "生活观察员",
    description: "累计上传 5 张照片",
    icon: "5",
    asset: "upload-five",
    category: "记录",
    target: 5,
    getValue: () => uploadsSinceAchievementReset().length,
  },
  uploadTen: {
    title: "日常收藏家",
    description: "累计上传 10 张照片",
    icon: "10",
    asset: "upload-ten",
    category: "记录",
    target: 10,
    getValue: () => uploadsSinceAchievementReset().length,
  },
  uploadThirty: {
    title: "回忆成册",
    description: "累计上传 30 张照片",
    icon: "30",
    asset: "upload-thirty",
    category: "记录",
    target: 30,
    getValue: () => uploadsSinceAchievementReset().length,
  },
  chatTen: {
    title: "破冰成功",
    description: "累计聊天 10 句",
    icon: "10",
    asset: "chat-ten",
    category: "聊天",
    target: 10,
    getValue: () => userMessagesSinceAchievementReset().length,
  },
  chatFifty: {
    title: "有来有往",
    description: "累计聊天 50 句",
    icon: "50",
    asset: "chat-fifty",
    category: "聊天",
    target: 50,
    getValue: () => userMessagesSinceAchievementReset().length,
  },
  lateNightTalk: {
    title: "深夜谈心",
    description: "单次对话超过 20 轮",
    icon: "N",
    asset: "late-night-talk",
    category: "聊天",
    target: 20,
    getValue: () => state.stats.maxConversationTurns,
  },
  listener: {
    title: "倾诉者",
    description: "连续 3 天每天都聊天",
    icon: "3D",
    asset: "listener",
    category: "聊天",
    target: 3,
    getValue: () => longestChatStreak(),
  },
  personaThree: {
    title: "越来越像你",
    description: "累计生成 3 次成长画像",
    icon: "3",
    asset: "persona-three",
    category: "画像",
    target: 3,
    getValue: () => state.stats.personaGenerations,
  },
  outfitFive: {
    title: "灵感成衣",
    description: "累计生成 5 套服饰",
    icon: "5",
    asset: "outfit-five",
    category: "工坊",
    target: 5,
    getValue: () => outfitsSinceAchievementReset().length,
  },
  styleExplorer: {
    title: "风格探索者",
    description: "尝试 3 种不同风格关键词",
    icon: "3",
    asset: "style-explorer",
    category: "工坊",
    target: 3,
    getValue: () => state.stats.outfitStyleTags.length,
  },
  campusIdol: {
    title: "校园偶像",
    description: "生成一套高人气校园风穿搭",
    icon: "C",
    asset: "campus-idol",
    category: "工坊",
    target: 1,
    getValue: () => (state.stats.hasCampusOutfit ? 1 : 0),
  },
  seasonStylist: {
    title: "季节造型师",
    description: "完成春夏秋冬 4 套主题装扮",
    icon: "4",
    asset: "season-stylist",
    category: "工坊",
    target: 4,
    getValue: () => state.stats.outfitSeasonTags.length,
  },
  colorMaster: {
    title: "配色高手",
    description: "解锁 3 套不同主色系服装",
    icon: "3",
    asset: "color-master",
    category: "工坊",
    target: 3,
    getValue: () => state.stats.outfitColorTags.length,
  },
  customDesigner: {
    title: "专属设计师",
    description: "首次使用自定义描述完成服饰生成",
    icon: "M",
    asset: "first-outfit",
    category: "工坊",
    target: 1,
    getValue: () => state.stats.customOutfitCount,
  },
  wardrobeExpand: {
    title: "衣橱扩容",
    description: "累计保存 10 套服饰",
    icon: "10",
    asset: "outfit-five",
    category: "工坊",
    target: 10,
    getValue: () => outfitsSinceAchievementReset().length,
  },
};

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
    petNames: Object.fromEntries(presetPetOrder.map((key) => [key, pets[key].name])),
    petActionByPet: Object.fromEntries(presetPetOrder.map((key) => [key, "idle"])),
    customPets: {},
    outfits: [],
    equippedOutfits: {},
    attributes: attr,
    achievements: {},
    personaLink: null,
    importedPersona: null,
    streakDays: 1,
    stats: defaultStats(),
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

function defaultStats() {
  return {
    achievementResetAt: null,
    gaokaoCheerTriggered: false,
    quizCompleted: false,
    quizCompletedAt: null,
    personaGenerations: 0,
    shareActions: 0,
    userChatCount: 0,
    currentConversationTurns: 0,
    maxConversationTurns: 0,
    lastUserChatAt: null,
    chatDays: [],
    outfitStyleTags: [],
    outfitSeasonTags: [],
    outfitColorTags: [],
    hasCampusOutfit: false,
    customOutfitCount: 0,
  };
}

function allPetOrder() {
  return [...presetPetOrder, ...Object.keys(state.customPets || {})];
}

function presetPetActions(key) {
  if (!presetPetOrder.includes(key)) return null;
  return Object.fromEntries(petActionOrder.map((action) => [action, `./assets/pets/actions/${key}/${action}.png`]));
}

function customReply(pet, input) {
  const opening = pet.opening ? `${pet.opening} ` : "";
  if (isTired(input)) return `${opening}我会按你的节奏来。先把状态放稳，再用你喜欢的方式处理一小步：${pet.tone || "温和、具体、陪伴式"}`;
  if (isDelay(input)) return `${opening}先别把任务想成一整座山。我们只做一个最小入口，我会用${pet.styleGuide || pet.tone || "清晰陪伴"}的方式陪你开始。`;
  return `${opening}我听见了。接下来我会用${pet.styleGuide || pet.tone || "你设定的对话风格"}陪你一起看这件事。`;
}

function withPetDefaults(pet, key) {
  const safePet = pet || pets.guardian;
  return {
    ...safePet,
    name: safePet.name || "自定义灵瑞",
    type: safePet.type || "自定义型",
    img: safePet.img || "./assets/pets/transparent/guardian.png",
    line: safePet.line || safePet.opening || "我会按你的方式陪你。",
    tags: Array.isArray(safePet.tags) ? safePet.tags : ["自定义", "陪伴"],
    tone: safePet.tone || "按用户设定回复",
    styleGuide: safePet.styleGuide || safePet.tone || "按用户设定回复",
    actions: safePet.actions || presetPetActions(key),
    isCustom: Boolean(state.customPets?.[key]),
    reply(input) {
      return typeof safePet.reply === "function" ? safePet.reply(input) : customReply(safePet, input);
    },
  };
}

function getPet(key = state.activePet) {
  return withPetDefaults((state.customPets || {})[key] || pets[key] || pets.guardian, key);
}

function petName(key = state.activePet) {
  return state.petNames?.[key] || getPet(key)?.name || "灵瑞";
}

function setPetName(key, name) {
  const clean = name.trim().slice(0, 8);
  if (!clean) return;
  if (!state.petNames) state.petNames = {};
  state.petNames[key] = clean;
  saveState();
}

function activeOutfit(key = state.activePet) {
  const outfitId = state.equippedOutfits?.[key];
  return state.outfits?.find((outfit) => outfit.id === outfitId) || null;
}

function sortOutfits(items) {
  return [...items].sort((a, b) => {
    const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
    if (pinDiff !== 0) return pinDiff;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

function activePetImage(key = state.activePet) {
  const outfit = activeOutfit(key);
  if (outfit) return outfit.imageUrl;
  const pet = getPet(key);
  const action = state.petActionByPet?.[key] || "idle";
  return pet.actions?.[action] || pet.img;
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

function uniq(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function dateKey(input = new Date()) {
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function consecutiveDayCount(days) {
  const sorted = uniq(days).sort();
  if (!sorted.length) return 0;
  let best = 1;
  let current = 1;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = new Date(`${sorted[index - 1]}T00:00:00`);
    const currentDay = new Date(`${sorted[index]}T00:00:00`);
    const diff = Math.round((currentDay - previous) / 86400000);
    if (diff === 1) current += 1;
    else current = 1;
    best = Math.max(best, current);
  }
  return best;
}

function monthDay(input = new Date()) {
  const date = new Date(input);
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function isGaokaoDate(input = new Date()) {
  const { month, day } = monthDay(input);
  return month === 6 && [7, 8, 9].includes(day);
}

function achievementResetTime() {
  return state.stats.achievementResetAt ? new Date(state.stats.achievementResetAt).getTime() : 0;
}

function isAfterAchievementReset(createdAt) {
  const resetTime = achievementResetTime();
  if (!resetTime) return true;
  if (!createdAt) return false;
  return new Date(createdAt).getTime() > resetTime;
}

function uploadsSinceAchievementReset() {
  return (state.uploads || []).filter((item) => isAfterAchievementReset(item.createdAt));
}

function outfitsSinceAchievementReset() {
  return (state.outfits || []).filter((item) => isAfterAchievementReset(item.createdAt));
}

function userMessagesSinceAchievementReset() {
  return (state.messages || []).filter((message) => message.role === "user" && isAfterAchievementReset(message.createdAt));
}

function longestChatStreak() {
  return consecutiveDayCount(state.stats.chatDays);
}

function analyzeOutfitDescription(description) {
  const text = String(description || "").trim();
  const styles = [];
  const seasons = [];
  const colors = [];
  const styleRules = [
    ["校园", /校园|学院|学园|校服|制服|图书馆|书包|课桌|社团/],
    ["甜美", /甜美|可爱|蝴蝶结|奶油|软萌|公主|蕾丝/],
    ["运动", /运动|活力|跑步|球鞋|棒球|卫衣|机能/],
    ["复古", /复古|格纹|灯芯绒|怀旧|呢子|老钱/],
    ["奇幻", /星空|月亮|魔法|斗篷|精灵|梦境|铃铛/],
    ["森系", /森系|树叶|花朵|草木|自然|森林/],
    ["未来", /未来|科技|银色|金属|赛博|电子/],
    ["派对", /舞会|礼服|闪耀|亮片|庆典|派对/],
  ];
  const seasonRules = [
    ["春", /春|春日|樱花|薄外套|轻盈/],
    ["夏", /夏|夏日|清凉|短袖|海边|凉感/],
    ["秋", /秋|秋日|针织|围巾|枫叶|风衣/],
    ["冬", /冬|冬日|雪|棉服|毛绒|羽绒/],
  ];
  const colorRules = [
    ["红色", /红|酒红|玫红|绯红/],
    ["蓝色", /蓝|海军蓝|雾蓝|天蓝/],
    ["绿色", /绿|薄荷|牛油果|草木绿/],
    ["黄色", /黄|金|奶油黄|鹅黄/],
    ["粉色", /粉|樱花粉|蜜桃粉|玫瑰粉/],
    ["紫色", /紫|薰衣草|丁香紫/],
    ["棕色", /棕|咖啡|驼色|卡其/],
    ["黑白", /黑|白|灰|银白|奶白/],
  ];

  styleRules.forEach(([key, pattern]) => {
    if (pattern.test(text)) styles.push(key);
  });
  seasonRules.forEach(([key, pattern]) => {
    if (pattern.test(text)) seasons.push(key);
  });
  colorRules.forEach(([key, pattern]) => {
    if (pattern.test(text)) colors.push(key);
  });

  if (!styles.length && text) styles.push("自定义");

  return {
    styles: uniq(styles),
    seasons: uniq(seasons),
    colors: uniq(colors),
    hasCampusStyle: /校园|学院|学园|校服|制服|图书馆|书包|社团|课桌/.test(text),
    isCustom: text.length > 0,
  };
}

function ensureStateShape() {
  if (!state.uploads) state.uploads = [];
  if (!state.memories) state.memories = [];
  if (!state.messages) state.messages = [];
  if (!state.petNames) state.petNames = {};
  if (!state.petActionByPet || typeof state.petActionByPet !== "object") state.petActionByPet = {};
  presetPetOrder.forEach((key) => {
    if (!state.petActionByPet[key]) state.petActionByPet[key] = "idle";
  });
  if (!state.customPets || typeof state.customPets !== "object") state.customPets = {};
  if (!state.outfits) state.outfits = [];
  if (!state.equippedOutfits) state.equippedOutfits = {};
  if (!state.achievements || typeof state.achievements !== "object") state.achievements = {};
  state.stats = { ...defaultStats(), ...(state.stats || {}) };
  state.stats.chatDays = uniq(state.stats.chatDays);
  state.stats.outfitStyleTags = uniq(state.stats.outfitStyleTags);
  state.stats.outfitSeasonTags = uniq(state.stats.outfitSeasonTags);
  state.stats.outfitColorTags = uniq(state.stats.outfitColorTags);
}

function rebuildStatsFromState() {
  ensureStateShape();
  const userMessages = userMessagesSinceAchievementReset();
  const chatDays = userMessages.map((message) => dateKey(message.createdAt));
  let maxConversationTurns = 0;
  let currentTurns = 0;
  let lastUserAt = null;

  userMessages.forEach((message) => {
    const createdAt = new Date(message.createdAt || Date.now());
    const isSameConversation = lastUserAt && createdAt - lastUserAt <= 6 * 60 * 60 * 1000;
    currentTurns = isSameConversation ? currentTurns + 1 : 1;
    maxConversationTurns = Math.max(maxConversationTurns, currentTurns);
    lastUserAt = createdAt;
  });

  const styleTags = [];
  const seasonTags = [];
  const colorTags = [];
  let hasCampusOutfit = false;
  let customOutfitCount = 0;
  outfitsSinceAchievementReset().forEach((outfit) => {
    const meta = analyzeOutfitDescription(outfit.description);
    styleTags.push(...meta.styles);
    seasonTags.push(...meta.seasons);
    colorTags.push(...meta.colors);
    if (meta.hasCampusStyle) hasCampusOutfit = true;
    if (meta.isCustom) customOutfitCount += 1;
  });

  state.stats = {
    ...defaultStats(),
    ...(state.stats || {}),
    quizCompleted: Boolean(state.stats.quizCompleted || (state.quizStep >= quiz.length && !state.stats.achievementResetAt)),
    quizCompletedAt: state.stats.quizCompletedAt || null,
    personaGenerations: Math.max(state.stats.personaGenerations || 0, state.personaLink && !state.stats.achievementResetAt ? 1 : 0),
    shareActions: Math.max(state.stats.shareActions || 0, state.personaLink && !state.stats.achievementResetAt ? 1 : 0),
    userChatCount: Math.max(state.stats.userChatCount || 0, userMessages.length),
    currentConversationTurns: Math.max(state.stats.currentConversationTurns || 0, currentTurns),
    maxConversationTurns: Math.max(state.stats.maxConversationTurns || 0, maxConversationTurns),
    lastUserChatAt: state.stats.lastUserChatAt || (lastUserAt ? lastUserAt.toISOString() : null),
    chatDays: uniq([...state.stats.chatDays, ...chatDays]),
    outfitStyleTags: uniq([...state.stats.outfitStyleTags, ...styleTags]),
    outfitSeasonTags: uniq([...state.stats.outfitSeasonTags, ...seasonTags]),
    outfitColorTags: uniq([...state.stats.outfitColorTags, ...colorTags]),
    hasCampusOutfit: Boolean(state.stats.hasCampusOutfit || hasCampusOutfit),
    customOutfitCount: Math.max(state.stats.customOutfitCount || 0, customOutfitCount),
  };
}

function achievementProgress(id) {
  const achievement = achievementCatalog[id];
  const current = achievement.getValue();
  const target = achievement.target || 1;
  return {
    current: Math.min(current, target),
    actual: current,
    target,
    percent: Math.min(100, Math.round((Math.min(current, target) / target) * 100)),
    unlocked: Boolean(state.achievements[id]),
  };
}

function achievementIconSrc(achievement) {
  const asset = achievement.asset || "first-upload";
  return `./assets/generated/achievements/icons/${asset}.png`;
}

function achievementIconMarkup(achievement, className = "achievement-badge") {
  return `<div class="${className}"><img src="${achievementIconSrc(achievement)}" alt="${escapeHtml(achievement.title)}" /></div>`;
}

function achievementDisplayMeta(achievement, unlocked) {
  if (!achievement.hidden || unlocked) return achievement;
  return {
    ...achievement,
    title: "隐藏成就",
    description: "在特殊时间完成互动后解锁",
    category: "隐藏",
  };
}

function queueAchievementToast(achievement) {
  achievementToastQueue.push(achievement);
  if (achievementToastTimer) return;
  showNextAchievementToast();
}

function showNextAchievementToast() {
  const achievement = achievementToastQueue.shift();
  if (!achievement) {
    achievementToastTimer = null;
    return;
  }
  const toast = $("#achievementToast");
  $("#achievementToastIcon").innerHTML = `<img src="${achievementIconSrc(achievement)}" alt="${escapeHtml(achievement.title)}" />`;
  $("#achievementToastTitle").textContent = achievement.title;
  $("#achievementToastText").textContent = achievement.description;
  toast.classList.remove("hidden", "is-hiding");
  toast.classList.add("is-showing");
  achievementToastTimer = window.setTimeout(() => {
    toast.classList.remove("is-showing");
    toast.classList.add("is-hiding");
    window.setTimeout(() => {
      toast.classList.add("hidden");
      toast.classList.remove("is-hiding");
      achievementToastTimer = null;
      showNextAchievementToast();
    }, 420);
  }, 3000);
}

function unlockAchievement(id, { silent = false } = {}) {
  if (state.achievements[id]) return false;
  state.achievements[id] = new Date().toISOString();
  if (!silent) queueAchievementToast(achievementCatalog[id]);
  return true;
}

function syncAchievements({ silent = false } = {}) {
  let changed = false;
  Object.keys(achievementCatalog).forEach((id) => {
    const { actual, target } = achievementProgress(id);
    if (actual >= target) changed = unlockAchievement(id, { silent }) || changed;
  });
  return changed;
}

function triggerGaokaoCheerIfNeeded() {
  if (!isGaokaoDate() || state.stats.gaokaoCheerTriggered) return;
  state.stats.gaokaoCheerTriggered = true;
  syncAchievements();
}

function setView(viewName) {
  $all(".view").forEach((view) => view.classList.toggle("is-active", view.id === `view-${viewName}`));
  $all(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewName));
}

function renderPet() {
  const pet = getPet(state.activePet);
  const name = petName(state.activePet);
  $("#activePetImage").src = activePetImage();
  $("#activePetType").textContent = pet.type;
  $("#activePetName").textContent = name;
  $("#petNameInput").value = name;
  $("#activePetLine").textContent = pet.line;
  $("#streakDays").textContent = state.streakDays;
  $("#homeGreeting").textContent = `${name}正在等你的今日手账`;
  $("#homeAdvice").textContent = `${pet.tone}。上传图片或聊天会同时推进灵宠成长和用户画像。`;
  $("#currentPetMeta").textContent = pet.type;
  $("#homePetImage").src = activePetImage();
  $("#homePetName").textContent = name;
  $("#homePetTone").textContent = activeOutfit() ? `${pet.tone} · 已穿戴「${activeOutfit().title}」` : pet.tone;

  const picker = $("#petPicker");
  if (picker) {
    picker.innerHTML = allPetOrder()
      .map((key) => {
        const item = getPet(key);
        const isCustom = Boolean(state.customPets?.[key]);
        return `<article class="pet-card ${key === state.activePet ? "is-active" : ""}" data-pet-card="${key}">
        <img src="${item.img}" alt="${item.name}" />
        <strong>${petName(key)}</strong>
        <small>${item.type}${isCustom ? " · 自定义" : ""}</small>
        ${isCustom ? `<button class="pet-delete-button" type="button" data-delete-custom-pet="${key}">删除</button>` : ""}
      </article>`;
      })
      .join("");
  }

  const actionPanel = $("#petActionPanel");
  if (actionPanel) {
    const actions = pet.actions;
    actionPanel.innerHTML = actions
      ? `<div class="panel-title compact-title"><h3>动作</h3><span>${activeOutfit() ? "当前穿搭优先显示，卸下后恢复动作" : "选择当前灵瑞动作"}</span></div>
        <div class="pet-action-grid">
          ${petActionOrder
            .map((action) => {
              const active = (state.petActionByPet?.[state.activePet] || "idle") === action;
              return `<button class="pet-action-button ${active ? "is-active" : ""}" type="button" data-pet-action="${action}">
                <img src="${actions[action]}" alt="${petActionLabels[action]}" />
                <span>${petActionLabels[action]}</span>
              </button>`;
            })
            .join("")}
        </div>`
      : `<div class="analysis-empty">自定义灵瑞暂不支持动作切换，默认展示上传或生成的形象。</div>`;
  }
}

function renderOutfits() {
  const equipped = activeOutfit();
  $("#equippedOutfitStatus").textContent = equipped ? `穿戴中 · ${equipped.provider}` : "未穿戴";
  $("#equippedOutfitBox").innerHTML = equipped
    ? `<img src="${equipped.imageUrl}" alt="${escapeHtml(equipped.title)}" /><strong>${escapeHtml(equipped.title)}</strong><p>${escapeHtml(equipped.description)}</p><button class="secondary-button full" data-unequip-outfit="${state.activePet}">卸下服饰</button>`
    : `<div class="analysis-empty">还没有给 ${petName()} 穿戴服饰。输入描述生成一件吧。</div>`;

  const items = sortOutfits((state.outfits || []).filter((outfit) => outfit.petKey === state.activePet));
  $("#closetCount").textContent = `${items.length} 件`;
  $("#outfitCloset").innerHTML = items.length
    ? items
        .map(
          (outfit) => `<article class="outfit-item ${equipped?.id === outfit.id ? "is-equipped" : ""} ${outfit.isPinned ? "is-pinned" : ""}">
            <img src="${outfit.imageUrl}" alt="${escapeHtml(outfit.title)}" />
            <div>
              <strong>${escapeHtml(outfit.title)}</strong>
              <p>${escapeHtml(outfit.description)}</p>
              <span>${escapeHtml(outfit.provider)} · ${outfit.isPinned ? "已置顶收藏" : "普通收藏"}</span>
            </div>
            <div class="outfit-actions">
              <button class="secondary-button" data-toggle-pin-outfit="${outfit.id}">${outfit.isPinned ? "取消置顶" : "收藏置顶"}</button>
              <button class="ghost-button danger-button" data-delete-outfit="${outfit.id}">删除</button>
              <button class="secondary-button" data-equip-outfit="${outfit.id}">${equipped?.id === outfit.id ? "穿戴中" : "穿戴"}</button>
            </div>
          </article>`,
        )
        .join("")
    : `<div class="analysis-empty">衣柜还是空的。输入描述后可以直接生成、置顶收藏并穿戴。</div>`;
}

function renderAttributes() {
  Object.entries(state.attributes).forEach(([, value]) => {
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
    const pet = getPet(best);
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
  basePetOrder.forEach((key) => {
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
  triggerGaokaoCheerIfNeeded();
  syncAchievements();
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
  const now = new Date();
  const lastUserAt = state.stats.lastUserChatAt ? new Date(state.stats.lastUserChatAt) : null;
  const isSameConversation = lastUserAt && now - lastUserAt <= 6 * 60 * 60 * 1000;
  state.stats.userChatCount += 1;
  state.stats.currentConversationTurns = isSameConversation ? state.stats.currentConversationTurns + 1 : 1;
  state.stats.maxConversationTurns = Math.max(state.stats.maxConversationTurns, state.stats.currentConversationTurns);
  state.stats.lastUserChatAt = now.toISOString();
  state.stats.chatDays = uniq([...state.stats.chatDays, dateKey(now)]);
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
      petProfile: {
        type: getPet(petKey).type,
        tone: getPet(petKey).tone,
        styleGuide: getPet(petKey).styleGuide,
        opening: getPet(petKey).opening,
      },
      message: text,
      messages: state.messages.filter((msg) => !msg.pending).slice(-10),
      memories: state.memories.slice(0, 6),
    });
    reply = data.reply;
    memorySummary = data.memorySummary;
    provider = "大模型";
  } catch (error) {
    console.warn("chat API fallback:", error.message);
    reply = getPet(petKey).reply(text);
  }
  const pendingIndex = state.messages.findIndex((msg) => msg.pending);
  if (pendingIndex >= 0) state.messages.splice(pendingIndex, 1);
  state.messages.push({ role: "pet", pet: petKey, text: reply, createdAt: new Date().toISOString() });
  state.memories.unshift({
    id: crypto.randomUUID(),
    summary: memorySummary || `你最近提到：${text.slice(0, 34)}。偏好的支持方式：${getPet(petKey).tone}。`,
    tag: `${getPet(petKey).type} · ${provider}`,
  });
  state.attributes.intimacy.exp += 8;
  triggerGaokaoCheerIfNeeded();
  syncAchievements();
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
  const pet = getPet(state.activePet);
  $("#personaCompleteness").textContent = `画像完整度 ${completeness}%`;
  $("#personaIntro").textContent =
    state.personaIntro || `这是一个带着${pet.type}气质、正在积累「${attributes[top]}」的人格链接。它适合被熟人导入为一只温和的人格投影宠物。`;
  const visibleTags = state.personaTags?.length ? state.personaTags : [...pet.tags, attributes[top], ...generateTitles().slice(0, 2)];
  $("#personaTags").innerHTML = visibleTags.map((tag) => `<span>${escapeHtml(String(tag))}</span>`).join("");
  $("#linkStatus").textContent = state.personaLink ? "已生成" : "尚未生成";
  $("#linkBox").textContent = state.personaLink || "生成后会出现可复制链接。";
  $("#copyLinkBtn").textContent = state.personaLink ? "复制人格链接" : "先生成后复制";
  $("#dualPetBox").innerHTML = state.importedPersona
    ? `<strong>双宠对话</strong><p>${petName()}：我们适合一起做一件低压力的小事。</p><p>投影灵宠：我建议今天互相分享一张天空或书桌照。</p><strong>关系报告</strong><p>共同点：都需要被温和理解。适合一起做：自习、散步、轻量创作。</p>`
    : "导入后会生成投影宠物、双宠对话和关系报告。";
}

async function generatePersonaLink() {
  const fallbackIntro = $("#personaIntro").textContent;
  let persona = null;
  try {
    const data = await postJson("/api/persona/generate", {
      pet: { ...getPet(state.activePet), name: petName() },
      attributes: state.attributes,
      memories: state.memories.slice(0, 10),
      uploads: state.uploads.slice(0, 10),
    });
    persona = data.persona;
  } catch (error) {
    console.warn("persona API fallback:", error.message);
  }
  state.personaLink = `${location.origin}${location.pathname}#persona-${crypto.randomUUID().slice(0, 8)}`;
  state.stats.personaGenerations += 1;
  state.stats.shareActions += 1;
  if (persona?.intro) state.personaIntro = persona.intro;
  if (Array.isArray(persona?.tags)) state.personaTags = persona.tags.slice(0, 8);
  if (!persona?.intro) state.personaIntro = fallbackIntro;
  syncAchievements();
  saveState();
  renderAll();
}

async function copyPersonaLink() {
  if (!state.personaLink) {
    await generatePersonaLink();
  }
  try {
    await navigator.clipboard.writeText(state.personaLink);
    state.stats.shareActions += 1;
    syncAchievements();
    saveState();
    renderAll();
    const button = $("#copyLinkBtn");
    button.textContent = "已复制人格链接";
    setTimeout(() => {
      button.textContent = "复制人格链接";
    }, 1800);
  } catch (error) {
    console.warn("copy persona link failed:", error.message);
  }
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
    const referenceImage = await urlToDataUrl(getPet(state.activePet).img).catch((error) => {
      console.warn("outfit reference image fallback:", error.message);
      return null;
    });
    const data = await postJson("/api/outfits/generate", {
      description,
      petKey: state.activePet,
      petName: petName(),
      petType: getPet(state.activePet).type,
      referenceImage,
    });
    const outfit = {
      id: crypto.randomUUID(),
      petKey: state.activePet,
      title: `${petName()}的定制服饰`,
      description,
      imageUrl: data.imageUrl,
      provider: data.provider || "image-model",
      prompt: data.prompt,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    if (!state.outfits) state.outfits = [];
    if (!state.equippedOutfits) state.equippedOutfits = {};
    state.outfits.unshift(outfit);
    state.equippedOutfits[state.activePet] = outfit.id;
    const meta = analyzeOutfitDescription(description);
    state.stats.outfitStyleTags = uniq([...state.stats.outfitStyleTags, ...meta.styles]);
    state.stats.outfitSeasonTags = uniq([...state.stats.outfitSeasonTags, ...meta.seasons]);
    state.stats.outfitColorTags = uniq([...state.stats.outfitColorTags, ...meta.colors]);
    state.stats.hasCampusOutfit = Boolean(state.stats.hasCampusOutfit || meta.hasCampusStyle);
    if (meta.isCustom) state.stats.customOutfitCount += 1;
    triggerGaokaoCheerIfNeeded();
    syncAchievements();
    saveState();
    renderAll();
  } catch (error) {
    console.warn("outfit API failed:", error.message);
  } finally {
    button.disabled = false;
    button.textContent = "生成并加入衣柜";
  }
}

function normalizePetInput({ name, type, opening, personality, tone, imageUrl, source }) {
  const cleanName = String(name || "").trim().slice(0, 12) || "自定义灵瑞";
  const cleanType = String(type || "").trim().slice(0, 16) || "自定义型";
  const cleanOpening = String(opening || "").trim().slice(0, 40) || "我来了，我们开始吧";
  const cleanPersonality = String(personality || "").trim().slice(0, 140) || "会理解用户，给出具体陪伴。";
  const cleanTone = String(tone || "").trim().slice(0, 140) || "温和、具体、像朋友一样回应。";
  return {
    name: cleanName,
    type: cleanType,
    img: imageUrl || "./assets/pets/transparent/guardian.png",
    line: cleanOpening,
    opening: cleanOpening,
    tags: uniq([cleanType.replace("型", ""), ...cleanPersonality.split(/[、，,。\s]+/).slice(0, 3)]).slice(0, 4),
    tone: cleanTone,
    styleGuide: `${cleanPersonality} 对话风格：${cleanTone}`,
    source: source || "user-custom",
    createdAt: new Date().toISOString(),
  };
}

function addCustomPet(pet) {
  if (!state.customPets) state.customPets = {};
  const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
  state.customPets[id] = pet;
  state.petNames[id] = pet.name;
  state.activePet = id;
  saveState();
  renderAll();
  setView("pets");
  return id;
}

function deleteCustomPet(key) {
  if (!state.customPets?.[key]) return;
  delete state.customPets[key];
  if (state.petNames) delete state.petNames[key];
  if (state.equippedOutfits) delete state.equippedOutfits[key];
  if (state.activePet === key) state.activePet = "guardian";
  saveState();
  renderAll();
}

async function createCustomPet(event) {
  event.preventDefault();
  const file = $("#customPetImageInput").files[0];
  const imageUrl = file ? await fileToDataUrl(file) : "";
  const pet = normalizePetInput({
    name: $("#customPetName").value,
    type: $("#customPetType").value,
    opening: $("#customPetOpening").value,
    personality: $("#customPetPersonality").value,
    tone: $("#customPetTone").value,
    imageUrl,
    source: "user-upload",
  });
  addCustomPet(pet);
  $("#customPetForm").reset();
  $("#customPetPreview").removeAttribute("src");
  $(".mini-drop-zone").classList.remove("has-image");
  $("#customPetImageHint").textContent = "上传灵瑞形象";
}

function localCelebrityPet(keyword, need) {
  const isZhang = /张雪峰|雪峰/.test(keyword);
  return normalizePetInput({
    name: isZhang ? "张雪峰老师" : `${keyword || "名人"}灵瑞`,
    type: isZhang ? "高考导师型" : "名人投影型",
    opening: isZhang ? "高考加油" : "我会把这份风格变成陪伴力",
    personality: isZhang ? "帅气、直给、清醒、提气，擅长把升学和学习选择讲明白。" : `参考${keyword || "目标人物"}的公开风格，抽象成积极、可陪伴的人格灵瑞。`,
    tone: isZhang ? "先鼓劲，再分析选择，最后给一个能马上执行的小步骤。" : need || "抓住核心，表达鲜明，给出具体建议。",
    imageUrl: isZhang ? "./assets/pets/transparent/zhang-xuefeng.png" : "./assets/pets/transparent/wisdom.png",
    source: "local-celebrity-template",
  });
}

async function generateCelebrityPet(event) {
  event.preventDefault();
  const keyword = $("#celebrityPetName").value.trim();
  const need = $("#celebrityPetNeed").value.trim();
  if (!keyword) {
    $("#celebrityPetName").focus();
    return;
  }
  const button = $("#celebrityPetForm button[type='submit']");
  button.disabled = true;
  button.textContent = "生成中...";
  $("#celebrityPetResult").textContent = "正在生成灵瑞形象、性格和对话风格...";
  let pet;
  let provider = "local-celebrity-template";
  const startedAt = performance.now();
  try {
    const data = await postJson("/api/pets/celebrity", { keyword, need });
    provider = data.provider || "model-celebrity";
    pet = normalizePetInput({
      name: data.pet?.name,
      type: data.pet?.type,
      opening: data.pet?.opening,
      personality: data.pet?.personality,
      tone: data.pet?.tone,
      imageUrl: data.pet?.imageUrl,
      referenceImageUrl: data.pet?.referenceImageUrl || data.referenceImageUrl,
      source: provider,
    });
  } catch (error) {
    console.warn("celebrity pet API fallback:", error.message);
    pet = localCelebrityPet(keyword, need);
  } finally {
    button.disabled = false;
    button.textContent = "让大模型生成灵瑞";
  }
  addCustomPet(pet);
  const elapsedSeconds = Math.max(0.1, (performance.now() - startedAt) / 1000).toFixed(1);
  const providerLabel =
    {
      "model-text-ref-image": "参考图 + 大模型文本 + AI 生图",
      "model-text-ref-local-image": "参考图 + 大模型文本 + 本地形象兜底",
      "model-text-image": "大模型文本 + AI 生图",
      "model-text-local-image": "大模型文本 + 本地形象兜底",
      "local-celebrity-template": "本地模板兜底",
    }[provider] || provider;
  const referenceText = pet.referenceImageUrl ? `<p class="reference-note">已搜索参考图并传给生图模型</p>` : "";
  $("#celebrityPetResult").innerHTML = `<strong>${escapeHtml(pet.name)}</strong><p>${escapeHtml(pet.opening)} · ${escapeHtml(pet.tone)}</p>${referenceText}<span class="tag">${escapeHtml(providerLabel)} · ${elapsedSeconds}s</span>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
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
  renderAchievements();
}

function formatAchievementDate(value) {
  if (!value) return "尚未解锁";
  const date = new Date(value);
  return `${date.getMonth() + 1}月${date.getDate()}日解锁`;
}

function renderAchievements() {
  const entries = Object.entries(achievementCatalog);
  const unlockedCount = entries.filter(([id]) => Boolean(state.achievements[id])).length;
  const total = entries.length;
  const uploadCount = uploadsSinceAchievementReset().length;
  const chatCount = userMessagesSinceAchievementReset().length;
  const outfitCount = outfitsSinceAchievementReset().length;
  const sortedUnlocked = entries
    .filter(([id]) => state.achievements[id])
    .sort((a, b) => new Date(state.achievements[b[0]]) - new Date(state.achievements[a[0]]))
    .slice(0, 4);

  $("#achievementUnlockedCount").textContent = `${unlockedCount} / ${total}`;
  $("#achievementGridStatus").textContent = `${Math.round((unlockedCount / total) * 100)}%`;
  $("#achievementStats").innerHTML = `
    <div class="achievement-stat"><span>照片上传</span><strong>${uploadCount}</strong></div>
    <div class="achievement-stat"><span>聊天句数</span><strong>${chatCount}</strong></div>
    <div class="achievement-stat"><span>画像次数</span><strong>${state.stats.personaGenerations}</strong></div>
    <div class="achievement-stat"><span>衣柜收藏</span><strong>${outfitCount}</strong></div>
  `;
  $("#achievementLatest").innerHTML = sortedUnlocked.length
    ? sortedUnlocked
        .map(
          ([id, achievement]) => `<div class="achievement-latest-item">${achievementIconMarkup(achievement, "achievement-mini-badge")}<div><strong>${achievement.title}</strong><span>${formatAchievementDate(state.achievements[id])}</span></div></div>`,
        )
        .join("")
    : `<div class="analysis-empty">还没有解锁成就。先去上传、聊天或生成穿搭吧。</div>`;
  $("#achievementGrid").innerHTML = entries
    .map(([id, achievement]) => {
      const progress = achievementProgress(id);
      const unlockedAt = state.achievements[id];
      const displayAchievement = achievementDisplayMeta(achievement, progress.unlocked);
      const progressText = progress.unlocked ? formatAchievementDate(unlockedAt) : `${progress.actual} / ${progress.target}`;
      return `<article class="achievement-card ${progress.unlocked ? "is-unlocked" : ""}">
        <div class="achievement-card-head">
          ${achievementIconMarkup(displayAchievement)}
          <div>
            <span class="achievement-category">${displayAchievement.category}</span>
            <strong>${displayAchievement.title}</strong>
          </div>
        </div>
        <p>${displayAchievement.description}</p>
        <div class="achievement-progress">
          <div class="meter"><i style="width:${progress.percent}%"></i></div>
          <span>${achievement.hidden && !progress.unlocked ? "等待触发" : progressText}</span>
        </div>
      </article>`;
    })
    .join("");
}

function resetAchievementsDebug() {
  state.achievements = {};
  state.stats = {
    ...defaultStats(),
    achievementResetAt: new Date().toISOString(),
  };
  achievementToastQueue.length = 0;
  if (achievementToastTimer) {
    window.clearTimeout(achievementToastTimer);
    achievementToastTimer = null;
  }
  $("#achievementToast").classList.add("hidden");
  saveState();
  renderAll();
}

function togglePinOutfit(outfitId) {
  const outfit = (state.outfits || []).find((item) => item.id === outfitId);
  if (!outfit) return;
  outfit.isPinned = !outfit.isPinned;
  saveState();
  renderOutfits();
}

function deleteOutfit(outfitId) {
  const outfit = (state.outfits || []).find((item) => item.id === outfitId);
  if (!outfit) return;
  state.outfits = (state.outfits || []).filter((item) => item.id !== outfitId);
  if (state.equippedOutfits?.[outfit.petKey] === outfitId) {
    delete state.equippedOutfits[outfit.petKey];
  }
  saveState();
  renderAll();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  const petCard = event.target.closest("[data-pet-card]");
  if (petCard && !event.target.closest("button")) {
    state.activePet = petCard.dataset.petCard;
    saveState();
    renderAll();
    return;
  }
  if (!target) return;
  if (target.dataset.view) setView(target.dataset.view);
  if (target.dataset.jump) setView(target.dataset.jump);
  if (target.dataset.deleteCustomPet) {
    deleteCustomPet(target.dataset.deleteCustomPet);
    return;
  }
  if (target.dataset.petAction) {
    if (!state.petActionByPet) state.petActionByPet = {};
    state.petActionByPet[state.activePet] = target.dataset.petAction;
    saveState();
    renderAll();
    return;
  }
  if (target.dataset.pet) {
    state.activePet = target.dataset.pet;
    saveState();
    renderAll();
  }
  if (target.dataset.quizChoice) {
    const petKey = basePetOrder[Number(target.dataset.quizChoice)];
    state.quizScores[petKey] += 1;
    state.quizStep += 1;
    saveState();
    renderQuiz();
  }
  if (target.dataset.confirmPet) {
    state.activePet = target.dataset.confirmPet;
    state.stats.quizCompleted = true;
    state.stats.quizCompletedAt = new Date().toISOString();
    syncAchievements();
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
  if (target.dataset.togglePinOutfit) {
    togglePinOutfit(target.dataset.togglePinOutfit);
  }
  if (target.dataset.deleteOutfit) {
    deleteOutfit(target.dataset.deleteOutfit);
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

$("#customPetImageInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  $("#customPetPreview").src = url;
  $(".mini-drop-zone").classList.add("has-image");
  $("#customPetImageHint").textContent = "已选择形象";
});

$("#customPetForm").addEventListener("submit", createCustomPet);

$("#celebrityPetForm").addEventListener("submit", generateCelebrityPet);

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

$("#copyLinkBtn").addEventListener("click", () => {
  copyPersonaLink();
});

$("#resetAchievementsBtn").addEventListener("click", () => {
  resetAchievementsDebug();
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

rebuildStatsFromState();
syncAchievements({ silent: true });
saveState();
renderAll();
