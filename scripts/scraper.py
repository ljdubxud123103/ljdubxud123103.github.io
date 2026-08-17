#!/usr/bin/env python3
"""
Film-grab.com 电影截图爬虫
============================
从 film-grab.com 爬取电影截图及元数据，按电影分类存储。

用法：
    python scraper.py                    # 爬取所有页面
    python scraper.py --pages 5          # 只爬取前5页
    python scraper.py --no-download      # 只收集元数据，不下载图片
    python scraper.py --force            # 强制重新下载已有图片
"""

import argparse
import hashlib
import json
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------

BASE_URL = "https://film-grab.com"
LIST_URL = BASE_URL + "/"  # 首页
OUTPUT_JSON = os.path.join(os.path.dirname(__file__), "movies_raw.json")
IMAGES_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "public", "images", "film-grab")
)

REQUEST_DELAY = 1.5  # 请求间隔（秒），避免被封
REQUEST_TIMEOUT = 30  # 请求超时（秒）
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# ---------------------------------------------------------------------------
# 日志
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------

def make_slug(title: str) -> str:
    """将片名转为 URL 友好的 slug。"""
    slug = title.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)  # 去标点
    slug = re.sub(r"\s+", "-", slug)      # 空格转连字符
    slug = re.sub(r"-+", "-", slug)       # 合并连字符
    slug = slug.strip("-")
    return slug


def safe_request(session: requests.Session, url: str) -> Optional[requests.Response]:
    """带重试和错误处理的 GET 请求。"""
    for attempt in range(3):
        try:
            resp = session.get(url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            return resp
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 404:
                logger.warning("404 Not Found: %s", url)
                return None
            logger.warning("HTTP error (attempt %d/3) for %s: %s", attempt + 1, url, e)
        except requests.exceptions.RequestException as e:
            logger.warning("Request error (attempt %d/3) for %s: %s", attempt + 1, url, e)
        if attempt < 2:
            time.sleep(REQUEST_DELAY * (attempt + 1))
    logger.error("Failed to fetch after 3 attempts: %s", url)
    return None


def is_likely_screenshot(img_tag, src: str) -> bool:
    """
    判断图片是否为电影截图（排除头像、图标、logo 等小图）。
    策略：
    - 检查 URL 或父级 class 是否包含截图相关关键词
    - 检查图片尺寸属性（如果有）
    - 排除明显的小尺寸占位图
    """
    src_lower = src.lower()

    # 排除显而易见的非截图
    exclude_patterns = [
        "avatar", "gravatar", "icon", "logo", "logo-", "-logo",
        "wp-content/themes",  # 主题资源
        "wp-admin",
        "banner", "header",
        "button",
        "pixel", "tracking",
        ".svg",
        ".gif",
        ".png",
        "placeholder",
        "loading",
    ]
    for pat in exclude_patterns:
        if pat in src_lower:
            return False

    # 检查父元素：截图通常在 article / entry-content / gallery 中
    parent = img_tag.parent
    depth = 0
    while parent and depth < 5:
        if hasattr(parent, "get"):
            classes = " ".join(parent.get("class", []))
            parent_id = parent.get("id", "")
            combined = f"{classes} {parent_id}".lower()
            if any(kw in combined for kw in ["gallery", "screenshot", "entry-content", "post-content", "film-still"]):
                return True
        parent = parent.parent
        depth += 1

    # 检查 img 自身的 class / id
    img_classes = " ".join(img_tag.get("class", [])).lower()
    img_id = img_tag.get("id", "").lower()
    img_combined = f"{img_classes} {img_id}"
    if any(kw in img_combined for kw in ["screenshot", "film-still", "still", "gallery"]):
        return True

    # 检查 width/height 属性（如果存在且 >= 300px 则认为是截图）
    width = img_tag.get("width")
    height = img_tag.get("height")
    if width and height:
        try:
            if int(width) >= 300 and int(height) >= 200:
                return True
        except ValueError:
            pass

    # 启发式：URL 中包含尺寸信息的较大图很可能是截图
    # film-grab 常见模式：-1024x... 或 -scaled
    if re.search(r"-\d{3,4}x\d{3,4}", src_lower):
        return True

    # 如果图片在 <figure> 或包含 gallery-item 的容器内
    figure_parent = img_tag.find_parent("figure")
    if figure_parent:
        fig_classes = " ".join(figure_parent.get("class", [])).lower()
        if "gallery" in fig_classes or "wp-block-image" in fig_classes:
            return True

    # 默认：如果上面都没匹配到且 URL 不含明确排除关键词，暂时纳入
    # 最终可以通过 size-class suffix（如 -1024x576）来过滤
    return False


def url_hash(url: str) -> str:
    """返回 URL 的 MD5 哈希值。"""
    return hashlib.md5(url.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# 解析列表页
# ---------------------------------------------------------------------------

def parse_list_page(html: str) -> list[str]:
    """从列表页 HTML 中提取所有电影详情页 URL。"""
    soup = BeautifulSoup(html, "lxml")
    film_urls = []
    seen = set()

    # 策略1：查找所有文章标题链接
    for article in soup.find_all("article"):
        for a in article.find_all("a", href=True):
            href = a["href"]
            full_url = urljoin(BASE_URL, href)
            if full_url.startswith(BASE_URL) and full_url not in seen:
                # 避免列表页、分类页、标签页
                parsed = urlparse(full_url)
                path = parsed.path.strip("/")
                if path and "/" not in path:
                    # 单级路径通常是文章页，如 /film-name/
                    film_urls.append(full_url)
                    seen.add(full_url)

    # 策略2：如果策略1没找到，尝试查找所有指向文章详情页的链接
    if not film_urls:
        for a in soup.find_all("a", href=True):
            href = a["href"]
            full_url = urljoin(BASE_URL, href)
            if full_url.startswith(BASE_URL) and full_url not in seen:
                parsed = urlparse(full_url)
                path = parsed.path.strip("/")
                # film-grab 通常路径格式：/YYYY/MM/DD/film-slug/
                if path and path != "page" and not path.startswith("page/"):
                    if (
                        "/category/" not in path
                        and "/tag/" not in path
                        and "/author/" not in path
                        and "/page/" not in path
                        and "/search/" not in path
                        and not path.startswith("wp-")
                    ):
                        film_urls.append(full_url)
                        seen.add(full_url)

    logger.info("  → 从列表页解析到 %d 个电影链接", len(film_urls))
    return film_urls


def get_next_page_url(html: str, current_page_url: str) -> Optional[str]:
    """从当前页面解析下一页链接。"""
    soup = BeautifulSoup(html, "lxml")

    # 常见的翻页链接模式
    for rel_val in ["next", "next page"]:
        link = soup.find("link", rel=rel_val)
        if link and link.get("href"):
            return urljoin(current_page_url, link["href"])

    # 备选：查找 class 含 "next" 的链接
    for a in soup.find_all("a", class_=re.compile(r"next", re.I), href=True):
        return urljoin(current_page_url, a["href"])

    # 备选：查找 rel="next" 的链接
    for a in soup.find_all("a", rel=re.compile(r"next", re.I), href=True):
        return urljoin(current_page_url, a["href"])

    # 备选：查找包含 "Older" / "Next" 等文字的链接
    for a in soup.find_all("a", href=True):
        text = a.get_text().strip().lower()
        if text in {"next", "older posts", "older entries", "next page", "→", "»"}:
            return urljoin(current_page_url, a["href"])

    # 备选：nav 元素中的翻页链接
    for nav in soup.find_all(["nav", "div"], class_=re.compile(r"pagination|nav-links|paging", re.I)):
        for a in nav.find_all("a", href=True):
            text = a.get_text().strip().lower()
            if text in {"next", "»", "→"}:
                return urljoin(current_page_url, a["href"])

    return None


# ---------------------------------------------------------------------------
# 解析详情页
# ---------------------------------------------------------------------------

def parse_film_page(html: str, page_url: str) -> Optional[dict]:
    """从电影详情页提取片名、导演、年份、截图 URL。"""
    soup = BeautifulSoup(html, "lxml")

    # --- 片名 ---
    title = None
    # 尝试 og:title
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()
    # 尝试 twitter:title
    if not title:
        tw_title = soup.find("meta", attrs={"name": "twitter:title"})
        if tw_title and tw_title.get("content"):
            title = tw_title["content"].strip()
    # 尝试 html title
    if not title:
        title_tag = soup.find("title")
        if title_tag:
            raw = title_tag.get_text(strip=True)
            # 常见格式："Film Title (Year) – Film-Grab" 或 "Film Title - Film-Grab"
            raw = re.sub(r"\s*[-–|]\s*Film[\s-]*Grab.*$", "", raw, flags=re.I).strip()
            title = raw

    # 尝试 h1
    if not title:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    if not title:
        logger.warning("无法提取片名: %s", page_url)
        return None

    logger.info("  片名: %s", title)

    # --- 导演 & 年份 ---
    director = None
    year = None

    # 从正文中寻找 meta 信息行
    body_text = soup.get_text(separator="\n")

    # "Directed by XXX" 模式
    director_match = re.search(r"Directed\s+by\s+(.+?)(?:[\n.,]|$)", body_text, re.I)
    if director_match:
        director = director_match.group(1).strip()
        logger.info("  导演: %s", director)

    # 年份：匹配 (年份) 或 (c) 年份 等模式
    year_patterns = [
        rf"{re.escape(title.strip())}.*?[\[\(](\d{{4}})[\]\)]",
        r"[\[\(](\d{4})[\]\)]",
        r"\b(?:released?|year)[:\s]*(\d{4})",
    ]
    for pat in year_patterns:
        m = re.search(pat, body_text, re.I)
        if m:
            y = int(m.group(1))
            if 1880 <= y <= 2030:  # 合理的年份范围
                year = y
                break

    # 如果 body_text 没找到，尝试在标题里找
    if year is None:
        m = re.search(r"[\[\(](\d{4})[\]\)]", title)
        if m:
            y = int(m.group(1))
            if 1880 <= y <= 2030:
                year = y

    if year:
        logger.info("  年份: %d", year)
    else:
        logger.info("  年份: 未识别")

    # --- 生成 slug ---
    slug = make_slug(title)

    # --- 截图 ---
    screenshots = []
    seen_hashes = set()

    for img in soup.find_all("img", src=True):
        src = img["src"]
        # 补全相对 URL
        full_src = urljoin(page_url, src)

        # 排除非截图图片
        if not is_likely_screenshot(img, src):
            continue

        # 去重
        h = url_hash(full_src)
        if h in seen_hashes:
            continue
        seen_hashes.add(h)

        # 生成文件名
        idx = len(screenshots) + 1
        filename = f"{slug}-{idx:03d}.jpg"
        screenshots.append({
            "filename": filename,
            "original_url": full_src,
        })

    logger.info("  截图数: %d", len(screenshots))

    if not screenshots:
        logger.warning("  该电影未提取到截图，跳过。")
        return None

    return {
        "slug": slug,
        "title": title,
        "director": director,
        "year": year,
        "url": page_url,
        "screenshots": screenshots,
    }


# ---------------------------------------------------------------------------
# 下载截图
# ---------------------------------------------------------------------------

def download_screenshots(
    film: dict,
    session: requests.Session,
    force: bool = False,
) -> int:
    """下载单个电影的所有截图。返回成功下载数量。"""
    slug = film["slug"]
    movie_dir = os.path.join(IMAGES_DIR, slug)
    os.makedirs(movie_dir, exist_ok=True)

    downloaded = 0

    for shot in film["screenshots"]:
        filename = shot["filename"]
        filepath = os.path.join(movie_dir, filename)

        # 如果文件已存在且非强制模式，跳过
        if os.path.exists(filepath) and not force:
            logger.debug("    [跳过] %s 已存在", filename)
            downloaded += 1
            continue

        url = shot["original_url"]
        logger.info("    下载: %s → %s", os.path.basename(url), filename)

        try:
            resp = session.get(url, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()

            with open(filepath, "wb") as f:
                f.write(resp.content)

            downloaded += 1
            logger.debug("    [完成] %s (%d bytes)", filename, len(resp.content))
        except requests.exceptions.RequestException as e:
            logger.error("    [失败] %s: %s", filename, e)
            # 删除可能的不完整文件
            if os.path.exists(filepath):
                os.remove(filepath)

        time.sleep(0.5)  # 下载间隔

    return downloaded


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Film-grab.com 电影截图爬虫",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--pages", "-p",
        type=int,
        default=0,
        help="最大爬取页数（0 = 不限，爬完所有页）",
    )
    parser.add_argument(
        "--no-download", "-n",
        action="store_true",
        help="只收集元数据，不下载图片",
    )
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="强制重新下载已有图片",
    )
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Film-grab.com 电影截图爬虫")
    logger.info("图片目录: %s", IMAGES_DIR)
    logger.info("输出JSON: %s", OUTPUT_JSON)
    logger.info("=" * 60)

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"})

    # 加载已有数据以便增量更新
    existing_films: dict[str, dict] = {}
    if os.path.exists(OUTPUT_JSON):
        try:
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                prev = json.load(f)
            for film in prev:
                existing_films[film["slug"]] = film
            logger.info("已加载 %d 条已有记录", len(existing_films))
        except Exception as e:
            logger.warning("加载已有数据失败: %s", e)

    # --- 第一步：收集所有列表页的电影链接 ---
    all_film_urls: list[str] = []
    page_url = LIST_URL
    page_num = 0
    seen_film_urls = set()

    while page_url:
        page_num += 1
        logger.info("[列表页 %d] %s", page_num, page_url)

        resp = safe_request(session, page_url)
        if resp is None:
            break

        film_urls = parse_list_page(resp.text)
        new_count = 0
        for url in film_urls:
            if url not in seen_film_urls:
                seen_film_urls.add(url)
                all_film_urls.append(url)
                new_count += 1
        logger.info("  → 新增 %d 个电影链接（累计 %d）", new_count, len(all_film_urls))

        # 检查是否达到页数上限
        if args.pages > 0 and page_num >= args.pages:
            logger.info("已达到页数上限 %d，停止翻页。", args.pages)
            break

        # 获取下一页
        next_url = get_next_page_url(resp.text, page_url)
        if next_url and next_url != page_url:
            page_url = next_url
            time.sleep(REQUEST_DELAY)
        else:
            logger.info("未找到下一页，翻页结束。")
            break

    logger.info("共获取 %d 个电影链接", len(all_film_urls))

    # --- 第二步：解析每个电影详情页 ---
    new_films: list[dict] = []
    total_shots = 0

    for i, film_url in enumerate(all_film_urls, 1):
        logger.info("[电影 %d/%d] %s", i, len(all_film_urls), film_url)

        # 检查是否已解析过（通过 URL）
        already_parsed = any(
            f.get("url") == film_url for f in existing_films.values()
        )
        if already_parsed:
            logger.info("  → 已解析过，跳过。")
            continue

        resp = safe_request(session, film_url)
        if resp is None:
            continue

        film_data = parse_film_page(resp.text, film_url)
        if film_data is None:
            time.sleep(REQUEST_DELAY)
            continue

        # --- 第三步：下载截图 ---
        if not args.no_download:
            downloaded = download_screenshots(film_data, session, force=args.force)
            logger.info("  成功下载 %d/%d 张截图", downloaded, len(film_data["screenshots"]))
        else:
            logger.info("  （跳过下载模式）%d 张截图已记录", len(film_data["screenshots"]))

        new_films.append(film_data)
        total_shots += len(film_data["screenshots"])

        # 增量保存：每完成一个电影就写一次 JSON
        all_films = list(existing_films.values()) + new_films
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(all_films, f, ensure_ascii=False, indent=2)
        logger.info("  → 已保存到 %s", OUTPUT_JSON)

        time.sleep(REQUEST_DELAY)

    # --- 完成 ---
    logger.info("=" * 60)
    logger.info("爬取完成！")
    logger.info("  新增电影: %d", len(new_films))
    logger.info("  新增截图: %d", total_shots)
    logger.info("  输出文件: %s", OUTPUT_JSON)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
