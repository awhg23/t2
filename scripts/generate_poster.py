from pathlib import Path
import math
import shutil

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "posters"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 2048, 5120
DPI = W / (80 / 2.54)
QR_SOURCE = OUT / "wechat-group-qr-source.png"
WARDROBE_IMAGES = [
    OUT / "ai-wardrobe-superhero.png",
    OUT / "ai-wardrobe-playful.png",
]

GENERATED_BG = Path(
    "/Users/awhg23/.codex/generated_images/"
    "019e9d21-4b05-70f1-a130-a7967ee9a489/"
    "ig_0e023a6ce0e0b9fb016a2422def4848191b96b2f5afc49c7ed.png"
)
BG_COPY = OUT / "ling-yu-ling-xun-bg-imagegen.png"
if GENERATED_BG.exists():
    shutil.copy2(GENERATED_BG, BG_COPY)
else:
    BG_COPY = ROOT / "assets" / "generated" / "campus-diary-bg.png"

FONT_CANDIDATES = [
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if Path(p).exists()), None)
if not FONT_PATH:
    raise SystemExit("No Chinese font found")


def font(size):
    return ImageFont.truetype(FONT_PATH, size=size)


F = {
    "title": font(124),
    "subtitle": font(58),
    "section": font(54),
    "body": font(39),
    "body_bold": font(42),
    "small": font(30),
    "tiny": font(25),
    "pet": font(32),
}

INK = (78, 55, 47, 255)
MUTED = (116, 91, 77, 255)
GREEN = (69, 166, 133, 255)
YELLOW = (255, 217, 112, 255)
PINK = (238, 143, 151, 255)
BLUE = (121, 177, 211, 255)
CARD = (255, 253, 246, 228)
LINE = (217, 190, 151, 210)
SHADOW = (91, 65, 45, 42)


def text_width(draw, text, fnt):
    return draw.textbbox((0, 0), text, font=fnt)[2]


def wrap_text(draw, text, fnt, max_width):
    lines, cur = [], ""
    for ch in text:
        test = cur + ch
        if text_width(draw, test, fnt) <= max_width or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def draw_wrapped(draw, x, y, text, fnt, fill, max_width, line_gap=12):
    for line in wrap_text(draw, text, fnt, max_width):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap
    return y


def text_center(draw, x, y, text, fnt, fill, stroke=0):
    box = draw.textbbox((0, 0), text, font=fnt, stroke_width=stroke)
    draw.text(
        (x - (box[2] - box[0]) // 2, y),
        text,
        font=fnt,
        fill=fill,
        stroke_width=stroke,
        stroke_fill=(255, 250, 236, 230),
    )


def rounded(canvas, draw, box, radius, fill, outline=None, width=1, shadow=True):
    x1, y1, x2, y2 = box
    if shadow:
        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle((x1 + 18, y1 + 22, x2 + 18, y2 + 22), radius=radius, fill=SHADOW)
        sh = sh.filter(ImageFilter.GaussianBlur(22))
        canvas.alpha_composite(sh)
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def load_group_qr(size=560):
    if not QR_SOURCE.exists():
        raise SystemExit(f"Missing QR source image: {QR_SOURCE}")
    source = Image.open(QR_SOURCE).convert("RGBA")
    # Crop the QR body from the WeChat screenshot, preserving its white quiet zone.
    crop = source.crop((170, 558, 1050, 1438))
    return crop.resize((size, size), Image.Resampling.NEAREST)


def paste_wardrobe_demo(canvas, draw, source_path, box, label):
    if not source_path.exists():
        raise SystemExit(f"Missing wardrobe demo image: {source_path}")
    source = Image.open(source_path).convert("RGBA")
    # The screenshots include a large preview panel. Crop inside that panel to keep the mascot large.
    source = source.crop((50, 16, 920, 506))
    x1, y1, x2, y2 = box
    bw, bh = x2 - x1, y2 - y1
    scale = max(bw / source.width, bh / source.height)
    source = source.resize((math.ceil(source.width * scale), math.ceil(source.height * scale)), Image.LANCZOS)
    left = (source.width - bw) // 2
    top = (source.height - bh) // 2
    source = source.crop((left, top, left + bw, top + bh))
    rounded(canvas, draw, box, 36, (255, 249, 232, 235), LINE, 2, shadow=False)
    mask = Image.new("L", (bw, bh), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, bw, bh), radius=36, fill=255)
    canvas.paste(source, (x1, y1), mask)
    draw.rounded_rectangle(box, radius=36, outline=(229, 202, 162, 205), width=3)
    draw.rounded_rectangle((x1 + 24, y1 + 24, x1 + 190, y1 + 78), radius=27, fill=(255, 255, 255, 220), outline=(229, 202, 162, 170), width=2)
    text_center(draw, x1 + 95, y1 + 37, label, F["small"], INK)


def build():
    bg = Image.open(BG_COPY).convert("RGB")
    scale = max(W / bg.width, H / bg.height)
    bg = bg.resize((math.ceil(bg.width * scale), math.ceil(bg.height * scale)), Image.LANCZOS)
    left = (bg.width - W) // 2
    top = (bg.height - H) // 2
    img = bg.crop((left, top, left + W, top + H)).convert("RGBA")
    img = Image.alpha_composite(img, Image.new("RGBA", (W, H), (255, 250, 237, 58)))
    draw = ImageDraw.Draw(img)

    for y in range(940, 4360, 130):
        for x in range(160, 1900, 130):
            draw.ellipse((x, y, x + 3, y + 3), fill=(207, 176, 124, 50))

    rounded(img, draw, (122, 115, 498, 202), 44, (255, 248, 224, 226), LINE, 2, False)
    draw.text((168, 137), "AI 成长陪伴 H5", font=F["small"], fill=MUTED)
    rounded(img, draw, (1505, 115, 1910, 202), 44, (255, 255, 255, 210), LINE, 2, False)
    draw.text((1563, 137), "校园手账风 Demo", font=F["small"], fill=MUTED)

    text_center(draw, W // 2, 310, "灵与灵寻", F["title"], INK, stroke=2)
    text_center(draw, W // 2, 500, "把日常照片，变成被理解的成长轨迹", F["subtitle"], (86, 72, 60, 255), stroke=1)

    rounded(img, draw, (150, 720, 1898, 1518), 70, (255, 252, 242, 185), LINE, 3)
    draw.text((250, 815), "一个和你一起长大的 AI 灵瑞伙伴", font=F["section"], fill=INK)
    draw.text((250, 910), "问卷匹配灵瑞 · 上传生活图片成长 · 聊天沉淀可控记忆 · 生成可分享人格链接", font=F["body"], fill=MUTED)

    features = [
        ("01", "问卷匹配", "从陪伴、鼓励、分析、治愈、灵感五种需求里找到初始灵瑞"),
        ("02", "图片成长", "学习、运动、社交、创作等照片会转化为属性经验与成长事件"),
        ("03", "可控记忆", "聊天长期沉淀用户画像，记忆摘要可查看、单条删除或全部清空"),
        ("04", "轻社交", "人格链接只分享抽象画像，好友导入后生成投影灵瑞与关系报告"),
    ]
    colors = [GREEN, BLUE, PINK, (185, 156, 80, 255)]
    for i, (num, title, body) in enumerate(features):
        x = 250 + (i % 2) * 835
        y = 1040 + (i // 2) * 205
        draw.rounded_rectangle((x, y, x + 710, y + 150), radius=38, fill=(255, 255, 255, 205), outline=(225, 197, 156, 170), width=2)
        draw.ellipse((x + 34, y + 36, x + 102, y + 104), fill=colors[i])
        text_center(draw, x + 68, y + 50, num, F["tiny"], (255, 255, 255, 255))
        draw.text((x + 130, y + 30), title, font=F["body_bold"], fill=INK)
        draw_wrapped(draw, x + 130, y + 86, body, F["tiny"], MUTED, 540, 4)

    rounded(img, draw, (150, 1650, 1898, 2558), 64, CARD, LINE, 3)
    draw.text((230, 1735), "五种灵瑞，五种陪伴方式", font=F["section"], fill=INK)
    draw.text((230, 1818), "不是工具感的打卡，而是长期关系里的成长反馈。", font=F["body"], fill=MUTED)
    pets = [
        ("守护", "assets/pets/transparent/guardian.png"),
        ("活力", "assets/pets/transparent/vitality.png"),
        ("智慧", "assets/pets/transparent/wisdom.png"),
        ("治愈", "assets/pets/transparent/healing.png"),
        ("奇想", "assets/pets/transparent/wonder.png"),
    ]
    for idx, (typ, path) in enumerate(pets):
        x = 230 + idx * 336
        y = 1950
        draw.rounded_rectangle((x, y, x + 270, y + 420), radius=44, fill=(255, 249, 232, 205), outline=(229, 202, 162, 180), width=2)
        pet = Image.open(ROOT / path).convert("RGBA")
        pet.thumbnail((218, 218), Image.LANCZOS)
        img.alpha_composite(pet, (x + (270 - pet.width) // 2, y + 58))
        text_center(draw, x + 135, y + 294, typ + "型", F["pet"], INK)

    rounded(img, draw, (150, 2690, 1898, 3430), 64, (255, 253, 247, 226), LINE, 3)
    draw.text((230, 2770), "AI 衣柜功能展示", font=F["section"], fill=INK)
    draw.text((230, 2850), "用文字描述特色服饰，AI 生成穿搭效果；灵光币解锁、衣柜收藏、一键穿戴。", font=F["body"], fill=MUTED)
    paste_wardrobe_demo(img, draw, WARDROBE_IMAGES[0], (230, 2965, 715, 3315), "超人装")
    paste_wardrobe_demo(img, draw, WARDROBE_IMAGES[1], (850, 2965, 1335, 3315), "脑洞装")
    steps = [
        ("写下想法", "例如：超人斗篷、学院风、梦境礼服"),
        ("AI 试衣", "保留灵瑞特征，生成可收藏服饰图"),
        ("灵光币解锁", "聊天和成就获得货币，调试锁定 99999"),
    ]
    for i, (title, body) in enumerate(steps):
        y = 2970 + i * 112
        color = [GREEN, BLUE, PINK][i]
        draw.ellipse((1452, y + 8, 1518, y + 74), fill=color)
        text_center(draw, 1485, y + 24, str(i + 1), F["tiny"], (255, 255, 255, 255))
        draw.text((1544, y), title, font=F["small"], fill=INK)
        draw_wrapped(draw, 1544, y + 44, body, F["tiny"], MUTED, 310, 4)

    rounded(img, draw, (150, 3570, 1250, 4188), 64, (255, 249, 236, 225), LINE, 3)
    draw.text((230, 3650), "为大学生日常设计", font=F["section"], fill=INK)
    for j, line in enumerate(["宿舍夜晚的情绪安定", "图书馆里的自律反馈", "社团与好友之间的轻互动", "把不确定的自己慢慢看清楚"]):
        y = 3765 + j * 96
        draw.rounded_rectangle((230, y + 6, 270, y + 46), radius=18, fill=[GREEN, BLUE, PINK, YELLOW][j])
        draw.text((295, y), line, font=F["body"], fill=MUTED)

    rounded(img, draw, (1320, 3570, 1898, 4590), 64, (255, 255, 255, 235), LINE, 3)
    draw.text((1415, 3650), "加入内测群", font=F["section"], fill=INK)
    draw.text((1408, 3728), "灵与灵寻内测群", font=F["small"], fill=MUTED)
    qr_img = load_group_qr(560)
    img.alpha_composite(qr_img, (1329, 3860))
    draw.text((1396, 4458), "微信群二维码 · 6月13日前有效", font=F["tiny"], fill=MUTED)

    rounded(img, draw, (150, 4485, 1220, 4890), 54, (77, 166, 133, 232), None, 0)
    draw_wrapped(draw, 230, 4558, "AI 灵宠陪伴 + 图片上传成长 + 用户画像 + 轻社交传播", F["body"], (255, 255, 246, 255), 920, 16)
    draw.text((230, 4688), "用一只懂你的灵瑞，把每一天变成可以被看见的成长。", font=F["body"], fill=(255, 250, 232, 255))
    draw.text((230, 4795), "MVP 验证目标：连续使用、长期陪伴感、熟人分享意愿", font=F["small"], fill=(255, 247, 219, 245))

    for x, y, c in [(1745, 520, YELLOW), (1850, 2840, PINK), (1260, 4300, BLUE), (165, 620, GREEN), (620, 2480, PINK)]:
        draw.polygon([(x, y - 24), (x + 12, y - 5), (x + 34, y), (x + 12, y + 7), (x, y + 28), (x - 10, y + 7), (x - 34, y), (x - 10, y - 5)], fill=c)

    for off, alpha in [(38, 110), (62, 70)]:
        draw.rounded_rectangle((off, off, W - off, H - off), radius=80, outline=(190, 153, 104, alpha), width=3)

    png = OUT / "ling-yu-ling-xun-rollup-2048x5120.png"
    pdf = OUT / "ling-yu-ling-xun-rollup-80x200cm.pdf"
    rgb = img.convert("RGB")
    rgb.save(png, "PNG", dpi=(DPI, DPI))
    rgb.save(pdf, "PDF", resolution=DPI)
    return png, pdf


if __name__ == "__main__":
    png_path, pdf_path = build()
    print(png_path)
    print(pdf_path)
    print(f"dpi={DPI:.3f}, size_px={W}x{H}")
