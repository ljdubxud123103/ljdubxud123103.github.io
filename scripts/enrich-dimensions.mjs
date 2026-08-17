// 为现有本地截图补写真实宽高，避免图片解码前瀑布流塌缩。
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptsDir, '..');
const dataPath = join(projectRoot, 'data', 'movies.json');
const database = JSON.parse(await readFile(dataPath, 'utf8'));

let updated = 0;
let missing = 0;

for (const movie of database.movies) {
  for (const screenshot of movie.screenshots) {
    const imagePath = join(projectRoot, 'public', screenshot.url.replace(/^\//, ''));
    try {
      const { width, height } = await sharp(imagePath).metadata();
      if (!width || !height) throw new Error('missing dimensions');
      if (screenshot.width !== width || screenshot.height !== height) {
        screenshot.width = width;
        screenshot.height = height;
        updated++;
      }
    } catch (error) {
      missing++;
      console.warn(`[跳过] ${screenshot.url}: ${error.message}`);
    }
  }
}

await writeFile(dataPath, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
console.log(`尺寸补全完成：更新 ${updated} 张，缺失 ${missing} 张`);
