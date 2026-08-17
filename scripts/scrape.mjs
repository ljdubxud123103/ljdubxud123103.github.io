// CinePalette 数据管线：抓取 film-grab.com 电影截图 + 色彩分析
// 用法：node scripts/scrape.mjs [MAX_MOVIES] [START_PAGE]
// 依赖：undici（代理访问）、cheerio（HTML解析）、sharp（色彩分析）
import { fetch, ProxyAgent } from 'undici';
import { load } from 'cheerio';
import sharp from 'sharp';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES_DIR = join(ROOT, 'public', 'images', 'film-grab');
const DATA_DIR = join(ROOT, 'data');

const PROXY = 'http://127.0.0.1:7897';
const dispatcher = new ProxyAgent({ uri: PROXY });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MAX_MOVIES = parseInt(process.argv[2] || '20', 10);
const START_PAGE = parseInt(process.argv[3] || '1', 10);
const REPLACE = process.argv.includes('--replace');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getText(url) {
  const r = await fetch(url, { dispatcher, headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return await r.text();
}

async function getBuffer(url) {
  const r = await fetch(url, { dispatcher, headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

function slugify(title) {
  return title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function initials(slug) {
  return slug.split('-').map((w) => w[0]).join('') || 'x';
}

// 解析列表页 → 电影列表
function parseListPage(html) {
  const $ = load(html);
  const movies = [];
  const seen = new Set();

  $('article').each((_, article) => {
    const $titleA = $(article).find('h2 a').first();
    const href = $titleA.attr('href');
    const title = $titleA.text().trim();
    if (!href || !title || !/\/\d{4}\/\d{2}\/\d{2}\//.test(href)) return;
    const metaText = $(article).text();
    const m = metaText.match(/\[([^\]]+?)\s*[•·]\s*(\d{4})\]/);
    if (!m || seen.has(href)) return;
    seen.add(href);
    movies.push({ title, director: m[1].trim(), year: parseInt(m[2], 10), url: href });
  });

  return movies;
}

// 解析详情页 → 截图全尺寸 URL + 摄影指导
function parseDetailPage(html) {
  const $ = load(html);
  const urls = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.includes('/photo-gallery/thumb/')) {
      const full = src.replace('/thumb/', '/').replace(/\?.*$/, '');
      urls.push(full);
    }
  });
  // 去重保序
  const uniq = [...new Set(urls)];

  // 摄影指导：找 Director of Photography 后面的 category 链接
  let cinematographer = '';
  const bodyText = $.text();
  const dpMatch = bodyText.match(/Director\s+of\s+Photography:?\s*([^\n]+)/);
  if (dpMatch) {
    const dpRaw = dpMatch[1].trim();
    const dpLink = $(`a:contains(${dpRaw})`).first().text().trim();
    cinematographer = dpLink || dpRaw.split(',')[0].trim();
  }

  // 导演：找 Director: 后面的链接（第一个非 "Director of Photography"）
  let director = '';
  const $links = $('a[href*="/category/"]');
  const catTexts = [];
  $links.each((_, el) => {
    const t = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (t && !/^\d{4}$/.test(t)) catTexts.push(t);
  });
  // 第一个通常是导演
  if (catTexts.length > 0) director = catTexts[0];

  return { urls: uniq, cinematographer, director };
}

// sharp 色彩分析
async function analyzeBuffer(buf) {
  const image = sharp(buf);
  const metadata = await image.metadata();
  const { data, info } = await image.clone().resize({ width: 64 }).raw().toBuffer({ resolveWithObject: true });
  const { channels } = info;
  const freq = new Map();
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const qr = (r >> 4) << 4, qg = (g >> 4) << 4, qb = (b >> 4) << 4;
    const key = `${qr},${qg},${qb}`;
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);

  // 主色调：top 10 簇加权平均
  let tr = 0, tg = 0, tb = 0, tw = 0;
  for (const [k, c] of sorted.slice(0, 10)) {
    const [r, g, b] = k.split(',').map(Number);
    tr += r * c; tg += g * c; tb += b * c; tw += c;
  }
  const dr = Math.round(tr / tw), dg = Math.round(tg / tw), db = Math.round(tb / tw);

  // 调色板：top 5 互异颜色
  const palette = [];
  for (const [k] of sorted) {
    if (palette.length >= 5) break;
    const [r, g, b] = k.split(',').map(Number);
    let distinct = true;
    for (const p of palette) {
      const drr = r - p[0], dgg = g - p[1], dbb = b - p[2];
      if (drr * drr + dgg * dgg + dbb * dbb < 50 * 50) { distinct = false; break; }
    }
    if (distinct) palette.push([r, g, b]);
  }
  while (palette.length < 5) palette.push([128, 128, 128]);

  const hex = (r, g, b) => '#' + [r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('');

  // HSV
  const rn = dr / 255, gn = dg / 255, bn = db / 255;
  const mx = Math.max(rn, gn, bn), mn = Math.min(rn, gn, bn), df = mx - mn;
  let h = 0;
  if (df !== 0) {
    if (mx === rn) h = 60 * (((gn - bn) / df) % 6);
    else if (mx === gn) h = 60 * ((bn - rn) / df + 2);
    else h = 60 * ((rn - gn) / df + 4);
  }
  if (h < 0) h += 360;
  const s = mx === 0 ? 0 : df / mx;
  const v = mx;

  return {
    width: metadata.width,
    height: metadata.height,
    dominant_hue: Math.round(h),
    dominant_color: hex(dr, dg, db),
    palette: palette.map(([r, g, b]) => hex(r, g, b)),
    saturation: Math.round(s * 100) / 100,
    brightness: Math.round(v * 100) / 100,
  };
}

function getHueBucket(hue) {
  const h = hue < 0 || hue >= 360 ? 0 : hue;
  const start = Math.floor(h / 15) * 15;
  const end = Math.min(start + 14, 359);
  return `${start}-${end}`;
}

// 主流程
async function main() {
  console.log(`=== CinePalette 数据管线 ===`);
  console.log(`目标新增电影数: ${MAX_MOVIES}, 起始页: ${START_PAGE}, 模式: ${REPLACE ? '覆盖' : '追加'}`);
  mkdirSync(IMAGES_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  const moviesPath = join(DATA_DIR, 'movies.json');
  const existingMovies = !REPLACE && existsSync(moviesPath)
    ? JSON.parse(readFileSync(moviesPath, 'utf8')).movies || []
    : [];
  const existingSlugs = new Set(existingMovies.map((movie) => movie.slug));
  console.log(`现有电影数: ${existingMovies.length}`);

  // 1. 收集电影列表（翻页）
  const allMovies = [];
  let pageNum = START_PAGE - 1;
  while (allMovies.length < MAX_MOVIES) {
    pageNum++;
    const pageUrl = pageNum === 1 ? 'https://film-grab.com/' : `https://film-grab.com/page/${pageNum}/`;
    console.log(`\n[列表页 ${pageNum}] ${pageUrl}`);
    let html;
    try {
      html = await getText(pageUrl);
    } catch (e) {
      console.log(`  翻页失败: ${e.message}`);
      break;
    }
    const movies = parseListPage(html);
    if (movies.length === 0) { console.log('  无更多电影，停止翻页'); break; }
    for (const m of movies) {
      const slug = slugify(m.title);
      const queued = allMovies.some((movie) => slugify(movie.title) === slug);
      if (!existingSlugs.has(slug) && !queued && allMovies.length < MAX_MOVIES) {
        allMovies.push(m);
      }
    }
    console.log(`  累计收集 ${allMovies.length} 部电影`);
    await sleep(1000);
    if (pageNum > 100) break; // 安全上限
  }

  console.log(`\n共收集 ${allMovies.length} 部电影，开始抓取详情...`);

  // 2. 逐部抓取详情 + 下载 + 分析
  const movies = [...existingMovies];
  const hueIndex = {};
  for (let i = 0; i < 360; i += 15) hueIndex[`${i}-${Math.min(i + 14, 359)}`] = [];
  for (const movie of existingMovies) {
    for (const screenshot of movie.screenshots || []) {
      const bucket = getHueBucket(screenshot.dominant_hue);
      hueIndex[bucket].push(screenshot.id);
    }
  }

  for (let mi = 0; mi < allMovies.length; mi++) {
    const m = allMovies[mi];
    const slug = slugify(m.title);
    console.log(`\n[新增 ${mi + 1}/${allMovies.length}] ${m.title} (${m.year}) [${slug}]`);

    let detail;
    try {
      detail = parseDetailPage(await getText(m.url));
    } catch (e) {
      console.log(`  详情页失败: ${e.message}`);
      continue;
    }

    console.log(`  截图数: ${detail.urls.length}`);
    const movieDir = join(IMAGES_DIR, slug);
    mkdirSync(movieDir, { recursive: true });

    const screenshots = [];
    for (let si = 0; si < detail.urls.length; si++) {
      const id = `${initials(slug)}-${String(si + 1).padStart(3, '0')}`;
      const filename = `${slug}-${String(si + 1).padStart(3, '0')}.jpg`;
      const filepath = join(movieDir, filename);
      const urlPath = `/images/film-grab/${slug}/${filename}`;

      let buf;
      if (existsSync(filepath)) {
        try { buf = readFileSync(filepath); } catch { buf = null; }
      } else {
        try {
          buf = await getBuffer(detail.urls[si]);
          writeFileSync(filepath, buf);
        } catch (e) {
          console.log(`  [跳过] ${id}: ${e.message}`);
          continue;
        }
      }

      if (!buf) continue;

      try {
        const color = await analyzeBuffer(buf);
        screenshots.push({ id, url: urlPath, ...color });
        const bucket = getHueBucket(color.dominant_hue);
        hueIndex[bucket].push(id);
      } catch (e) {
        console.log(`  [分析失败] ${id}: ${e.message}`);
        continue;
      }

      if ((si + 1) % 10 === 0) console.log(`  进度: ${si + 1}/${detail.urls.length}`);
    }

    if (screenshots.length > 0) {
      movies.push({
        id: `${slug}-${m.year}`,
        title: m.title,
        director: detail.director || m.director,
        year: m.year,
        slug,
        cast: [],
        cinematographer: detail.cinematographer,
        screenshots,
      });
    }

    // 增量保存
    writeFileSync(join(DATA_DIR, 'movies.json'), JSON.stringify({ movies }, null, 2));
    writeFileSync(join(DATA_DIR, 'hue_index.json'), JSON.stringify(hueIndex, null, 2));

    await sleep(1000);
  }

  // 3. 汇总
  const totalShots = movies.reduce((s, m) => s + m.screenshots.length, 0);
  console.log(`\n=== 完成 ===`);
  console.log(`电影数: ${movies.length}, 截图数: ${totalShots}`);
  console.log(`输出: data/movies.json, data/hue_index.json`);
  console.log(`图片目录: public/images/film-grab/`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
