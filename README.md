# 灵瑞成长记 H5 MVP

一个静态 H5 原型，实现「AI 灵宠陪伴 + 图片上传成长 + 用户画像 + 人格链接轻社交」核心闭环。

## 运行方式

如果只想看本地交互原型，可以直接打开 `index.html`。这种方式不会调用大模型，只会使用本地回退逻辑。

如果要接入大模型，必须通过 `server.js` 启动。后端会读取以下全局环境变量：

- `ARK_API_KEY`（火山 Ark 推荐）
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `OPENAI_API_MODE`：`responses` 或 `chat`

当前已按火山 Ark Responses API 测通，推荐配置：

```bash
export ARK_API_KEY="<your-ark-key>"
export OPENAI_API_KEY="$ARK_API_KEY"
export OPENAI_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
export OPENAI_MODEL="doubao-seed-2-0-pro-260215"
export OPENAI_API_MODE="responses"
```

```bash
node server.js
```

如果变量写在 `~/.zshrc` 中，建议用交互 zsh 启动，确保能读取 `.zshrc`：

```bash
zsh -ic 'node server.js'
```

默认访问：

```text
http://127.0.0.1:4173
```

也可以指定端口：

```bash
PORT=5173 node server.js
```

## API 连通性测试

```bash
node test-openai.js
```

如果变量写在 `~/.zshrc` 中：

```bash
zsh -ic 'node test-openai.js'
```

成功时会输出当前 `baseUrl`、`model` 和模型回复。

## 已实现范围

- 初始问卷：15 题，按五类灵瑞计分并推荐。
- 五个灵瑞：守护型鹿眠、活力型栗冲、智慧型星阅、治愈型橡芽、奇想型梦铃。
- 图片上传成长：支持 8 类生活图片，优先调用 `/api/images/analyze` 做多模态识别，失败时回退本地规则。
- 聊天陪伴：优先调用 `/api/chat/reply` 生成五类灵瑞回复，失败时回退本地规则，并生成可删除记忆摘要。
- 成长画像：10 个属性、Lv.1-Lv.10、称号生成、记忆管理。
- 人格链接：优先调用 `/api/persona/generate` 生成抽象画像，支持生成/删除链接、模拟好友导入、投影宠物、双宠对话和关系报告。
- 服饰工坊：用户可输入文字描述生成特色服饰，加入衣柜并穿戴。当前默认调试模式，灵光币锁定为 `99999`；聊天和成就奖励逻辑已保留，但锁定模式下不会扣减或变动。
- Demo 调试：重置演示状态，可重复触发“新的开始”成就。

## 服饰生图配置

服饰工坊调用 Ark 图片生成接口：

```text
POST https://ark.cn-beijing.volces.com/api/v3/images/generations
```

默认图片模型：

```bash
export OUTFIT_IMAGE_MODEL="doubao-seedream-5-0-260128"
export OUTFIT_PRICE="1200"
```

如果当前 Ark 账号没有开通该图片模型，后端会返回本地贴纸风格兜底图，保证演示流程仍然可用。开通或更换可用图片模型后，服饰工坊会自动展示真实生图结果。

## 美术素材

- 原始五个灵瑞素材复制到 `assets/pets/`，用于稳定英文路径引用。
- 使用 image2 生成的项目美术素材已保存到：
  - `assets/generated/campus-diary-bg.png`
  - `assets/generated/growth-sticker-sheet.png`

两张生成图用于 H5 背景和成长贴纸视觉，风格按现有五个灵瑞的 Q 版、柔和、校园手账方向生成。

## 文档

- 产品 PRD：`docs/prd/PRD-001.md`
- PRD 总集：`docs/PRD_REGISTRY.md`
- 项目记忆：`docs/MEMORY.md`
