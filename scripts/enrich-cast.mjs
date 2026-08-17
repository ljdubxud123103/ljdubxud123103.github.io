// 为现有 movies.json 批量补充主演信息
// 用法：node scripts/enrich-cast.mjs
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'movies.json');

const CAST_PATCH = {
  'state-of-siege-1972': ['Yves Montand', 'Renato Salvatori', 'O.E. Hasse', 'Jacques Weber'],
  'the-lost-boys-1987': ['Jason Patric', 'Corey Haim', 'Kiefer Sutherland', 'Jami Gertz'],
  'the-tale-of-princess-kaguya-2013': ['Aki Asakura', 'Kengo Kora', 'Takeo Chii', 'Nobuko Miyamoto'],
  'the-lady-vanishes-1938': ['Margaret Lockwood', 'Michael Redgrave', 'Paul Lukas', 'Dame May Whitty'],
  'kingdom-of-heaven-2005': ['Orlando Bloom', 'Eva Green', 'Jeremy Irons', 'Liam Neeson'],
  'body-of-lies-2008': ['Leonardo DiCaprio', 'Russell Crowe', 'Mark Strong', 'Golshifteh Farahani'],
  'round-midnight-1986': ['Dexter Gordon', 'François Cluzet', 'Gabrielle Haker', 'Sandra Reaves-Phillips'],
  'io-capitano-2023': ['Seydou Sarr', 'Moustapha Fall', 'Issaka Sawadogo', 'Hichem Yacoubi'],
  'compaeros-1970': ['Franco Nero', 'Tomas Milian', 'Fernando Rey', 'Iris Berben'],
  'the-reckless-moment-1949': ['James Mason', 'Joan Bennett', 'Geraldine Brooks', "Henry O'Neill"],
  'vortex-2021': ['Dario Argento', 'Françoise Lebrun', 'Alex Lutz', 'Kylian Dheret'],
  'el-cid-1961': ['Charlton Heston', 'Sophia Loren', 'Raf Vallone', 'Geneviève Page'],
  'pulse-2001': ['Kumiko Asō', 'Haruhiko Katô', 'Koyuki', 'Kurume Arisaka'],
  'the-decameron-1971': ['Franco Citti', 'Ninetto Davoli', 'Vincenzo Amato', 'Angela Luce'],
  'the-big-4-2022': ['Abimana Aryasatya', 'Putri Marino', 'Lutesha', 'Arie Kriting'],
  'the-last-of-sheila-1973': ['Richard Benjamin', 'Dyan Cannon', 'James Coburn', 'Joan Hackett'],
};

const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
let updated = 0;

for (const movie of data.movies) {
  const cast = CAST_PATCH[movie.id];
  if (cast) {
    movie.cast = cast;
    updated++;
  }
}

writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
console.log(`已更新 ${updated} 部电影的主演信息`);
