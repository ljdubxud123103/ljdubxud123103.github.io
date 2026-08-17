"""
CinePalette 截图色彩分析脚本
=============================
读取 movies_raw.json，对每张电影截图提取主色调和调色板，
生成 movies.json（含色彩数据）和 hue_index.json（色相倒排索引）。

使用方法:
    cd f:\cinepalette
    python scripts/color_analyzer.py

依赖:
    pip install Pillow
    pip install colorthief  (可选，不可用时自动回退到手动聚类)
"""

import json
import os
import sys
import random
import logging
from pathlib import Path

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("color_analyzer")

# ---------------------------------------------------------------------------
# 依赖检查
# ---------------------------------------------------------------------------
try:
    from PIL import Image, ImageStat
except ImportError:
    logger.error("缺少 Pillow 依赖。请运行: pip install Pillow")
    sys.exit(1)

try:
    from colorthief import ColorThief
    HAS_COLORTHIEF = True
    logger.info("✓ 已加载 colorthief（优先使用）")
except ImportError:
    HAS_COLORTHIEF = False
    logger.info("⚠ colorthief 不可用，将使用手动色彩聚类算法")


# ===================================================================
# 工具函数
# ===================================================================

def get_project_root():
    """获取项目根目录（scripts/ 的父目录）。"""
    return Path(__file__).resolve().parent.parent


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """RGB(0-255) → #RRGGBB 十六进制字符串。"""
    return f"#{r:02X}{g:02X}{b:02X}"


def rgb_to_hsv(r: int, g: int, b: int):
    """
    RGB(0-255) → HSV.
    返回:
        h (int):   色相 0-360
        s (float): 饱和度 0.0-1.0（保留4位小数）
        v (float): 明度 0.0-1.0（保留4位小数）
    """
    r_norm, g_norm, b_norm = r / 255.0, g / 255.0, b / 255.0
    cmax = max(r_norm, g_norm, b_norm)
    cmin = min(r_norm, g_norm, b_norm)
    delta = cmax - cmin

    # 色相
    if delta == 0:
        h = 0
    elif cmax == r_norm:
        h = 60 * (((g_norm - b_norm) / delta) % 6)
    elif cmax == g_norm:
        h = 60 * (((b_norm - r_norm) / delta) + 2)
    else:  # cmax == b_norm
        h = 60 * (((r_norm - g_norm) / delta) + 4)

    h = round(h)
    if h < 0:
        h += 360

    # 饱和度
    s = 0.0 if cmax == 0 else delta / cmax

    # 明度
    v = cmax

    return h, round(s, 4), round(v, 4)


def generate_screenshot_id(slug: str, index: int) -> str:
    """
    根据电影 slug 和序号生成截图 ID。
    取 slug 中每个单词的首字母拼接。
    例如: "the-reckless-moment" + 1 → "trm-001"
          "vertigo" + 3 → "v-003"
    """
    words = slug.split("-")
    initials = "".join(w[0] for w in words if w)
    return f"{initials}-{index:03d}"


def get_hue_bucket(hue: int) -> str:
    """
    获取色相所属的桶键名（按每 15° 分桶）。
    例如: 32 → "30-44", 0 → "0-14", 359 → "345-359"
    """
    if hue < 0 or hue >= 360:
        hue = 0
    bucket_start = (hue // 15) * 15
    bucket_end = min(bucket_start + 14, 359)
    return f"{bucket_start}-{bucket_end}"


# ===================================================================
# 色彩提取
# ===================================================================

def extract_colors_colorthief(image_path: str):
    """
    使用 colorthief 提取主色调和 5 色调色板。
    返回: (dominant: (R,G,B), palette: [(R,G,B), ...])
    """
    ct = ColorThief(image_path)
    dominant = ct.get_color(quality=1)
    palette = ct.get_palette(color_count=5, quality=1)
    return dominant, palette


def _quantize_pixel(pixel: tuple, levels: int = 16) -> tuple:
    """
    将 RGB 像素量化到较少级别，减少独特颜色数量用于聚类。
    levels=16 表示每通道分为 16 级（256/16=16 色阶）。
    """
    step = 256 // levels
    return tuple((c // step) * step for c in pixel)


def extract_colors_manual(image_path: str):
    """
    手动色彩聚类（当 colorthief 不可用时的回退方案）。

    算法:
    1. 将图片缩放到较小尺寸（最长边 ≤200px）以提高性能
    2. 量化像素颜色空间（减少独特颜色数）
    3. 统计量化后颜色的频率
    4. 取频率最高的聚类计算加权平均主色调
    5. 取频率最高且互不相似的 5 种颜色作为调色板

    返回: (dominant: (R,G,B), palette: [(R,G,B), ...])
    """
    img = Image.open(image_path).convert("RGB")
    w, h = img.size

    # 缩放以提升性能
    max_dim = 200
    if max(w, h) > max_dim:
        ratio = max_dim / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    pixels = list(img.getdata())
    if not pixels:
        logger.warning("  图片无像素数据，返回默认灰色")
        return (128, 128, 128), [(128, 128, 128)] * 5

    # 量化并统计频率
    freq_map = {}
    for p in pixels:
        q = _quantize_pixel(p, levels=16)
        freq_map[q] = freq_map.get(q, 0) + 1

    # 按频率降序排列
    sorted_colors = sorted(freq_map.items(), key=lambda x: x[1], reverse=True)

    # ---- 主色调：Top N 聚类中心的加权平均 ----
    top_n = min(15, len(sorted_colors))
    top_clusters = sorted_colors[:top_n]
    total_weight = sum(weight for _, weight in top_clusters)

    if total_weight == 0:
        dom = (128, 128, 128)
    else:
        dom_r = sum(c[0] * w for c, w in top_clusters) / total_weight
        dom_g = sum(c[1] * w for c, w in top_clusters) / total_weight
        dom_b = sum(c[2] * w for c, w in top_clusters) / total_weight
        dom = (int(round(dom_r)), int(round(dom_g)), int(round(dom_b)))

    # ---- 调色板：频率最高且互不相似的 5 色 ----
    palette = []
    for color, _ in sorted_colors:
        if len(palette) >= 5:
            break
        # 与已选颜色保持足够的欧氏距离
        is_distinct = True
        for existing in palette:
            dr = color[0] - existing[0]
            dg = color[1] - existing[1]
            db = color[2] - existing[2]
            if (dr * dr + dg * dg + db * db) < (50 * 50):  # 距离阈值
                is_distinct = False
                break
        if is_distinct:
            palette.append(color)

    # 不足 5 色则用中灰色填充
    while len(palette) < 5:
        palette.append((128, 128, 128))

    return dom, palette[:5]


def analyze_image(image_path: str):
    """
    分析单张图片，返回主色调和调色板。
    自动选择 colorthief 或手动方法。
    """
    if HAS_COLORTHIEF:
        return extract_colors_colorthief(image_path)
    else:
        return extract_colors_manual(image_path)


# ===================================================================
# 主流程
# ===================================================================

def main():
    project_root = get_project_root()
    logger.info(f"项目根目录: {project_root}")

    # ---- 1. 加载 movies_raw.json ----
    raw_path = project_root / "scripts" / "movies_raw.json"
    if not raw_path.exists():
        logger.error(f"找不到输入文件: {raw_path}")
        logger.error("请确保 scripts/movies_raw.json 存在")
        sys.exit(1)

    with open(raw_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    movies_list = raw_data.get("movies", [])
    if not movies_list:
        logger.error("movies_raw.json 中没有电影数据（movies 字段为空）")
        sys.exit(1)

    logger.info(f"共加载 {len(movies_list)} 部电影")

    # ---- 2. 初始化色相倒排索引（24 个桶: 0-14, 15-29, ..., 345-359）----
    hue_index = {}
    for i in range(0, 360, 15):
        end = min(i + 14, 359)
        hue_index[f"{i}-{end}"] = []

    # ---- 3. 遍历处理 ----
    output_movies = []
    total_screenshots = 0
    processed = 0
    skipped = 0
    errors = 0

    for movie in movies_list:
        slug = movie.get("slug", "")
        screenshots = movie.get("screenshots", [])

        if not slug:
            logger.warning(f"电影缺少 slug 字段，跳过: {movie.get('title', '未知')}")
            continue

        movie_entry = {
            "id": movie.get("id", ""),
            "title": movie.get("title", ""),
            "director": movie.get("director", ""),
            "year": movie.get("year", 0),
            "slug": slug,
            "screenshots": [],
        }

        logger.info(f"\n{'=' * 60}")
        logger.info(f"处理: {movie_entry['title']} ({movie_entry['year']}) [{slug}]")
        logger.info(f"  截图数量: {len(screenshots)}")

        for idx, shot in enumerate(screenshots):
            total_screenshots += 1
            filename = shot.get("filename", "")
            if not filename:
                logger.warning(f"  [跳过] 第 {idx + 1} 张截图缺少 filename 字段")
                skipped += 1
                continue

            image_path = project_root / "public" / "images" / "film-grab" / slug / filename
            shot_id = generate_screenshot_id(slug, idx + 1)

            if not image_path.exists():
                logger.warning(f"  [跳过] 图片不存在: {image_path}")
                skipped += 1
                continue

            try:
                # 提取颜色
                dominant_rgb, palette_rgb = analyze_image(str(image_path))

                # RGB → HSV
                h, s, v = rgb_to_hsv(*dominant_rgb)

                # RGB → Hex
                dominant_hex = rgb_to_hex(*dominant_rgb)
                palette_hex = [rgb_to_hex(*c) for c in palette_rgb]

                # 构建截图记录
                shot_entry = {
                    "id": shot_id,
                    "url": f"/images/film-grab/{slug}/{filename}",
                    "dominant_hue": h,
                    "dominant_color": dominant_hex,
                    "palette": palette_hex,
                    "saturation": s,
                    "brightness": v,
                }
                movie_entry["screenshots"].append(shot_entry)

                # 更新色相索引
                bucket = get_hue_bucket(h)
                hue_index[bucket].append(shot_id)

                processed += 1
                logger.info(
                    f"  [{processed}] {shot_id} → 色相={h}° 主色={dominant_hex} "
                    f"饱和度={s:.2f} 明度={v:.2f}"
                )

            except Exception as e:
                logger.error(f"  [错误] 处理 {image_path} 时出错: {e}")
                errors += 1
                continue

        output_movies.append(movie_entry)

    # ---- 4. 写入 movies.json ----
    movies_output_path = project_root / "data" / "movies.json"
    movies_output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(movies_output_path, "w", encoding="utf-8") as f:
        json.dump({"movies": output_movies}, f, ensure_ascii=False, indent=2)
    logger.info(f"\n✓ 已写入: {movies_output_path}")

    # ---- 5. 写入 hue_index.json ----
    hue_output_path = project_root / "data" / "hue_index.json"
    hue_output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(hue_output_path, "w", encoding="utf-8") as f:
        json.dump(hue_index, f, ensure_ascii=False, indent=2)
    logger.info(f"✓ 已写入: {hue_output_path}")

    # ---- 6. 汇总报告 ----
    logger.info(f"\n{'=' * 60}")
    logger.info("处理完成！汇总:")
    logger.info(f"  电影数:           {len(output_movies)}")
    logger.info(f"  总截图数:         {total_screenshots}")
    logger.info(f"  成功处理:         {processed}")
    logger.info(f"  跳过（缺文件等）:  {skipped}")
    logger.info(f"  错误:             {errors}")
    logger.info(f"  输出目录:         {movies_output_path.parent}")

    hue_bucket_counts = {k: len(v) for k, v in hue_index.items()}
    total_indexed = sum(hue_bucket_counts.values())
    logger.info(f"  色相索引条目数:   {total_indexed}")


if __name__ == "__main__":
    main()
