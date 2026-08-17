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
  'a-generation-1955': ['Tadeusz Łomnicki', 'Urszula Modrzyńska', 'Tadeusz Janczar', 'Janusz Paluszkiewicz'],
  'how-to-blow-up-a-pipeline-2022': ['Ariela Barer', 'Kristine Froseth', 'Lukas Gage', 'Forrest Goodluck'],
  'as-in-heaven-2021': ['Flora Ofelia Hofmann Lindahl'],
  'i-do-not-care-if-we-go-down-in-history-as-barbarians-2018': ['Ioana Iacob', 'Alex Bogdan', 'Alexandru Dabija'],
  'benediction-2021': ['Jack Lowden', 'Peter Capaldi', 'Simon Russell Beale', 'Jeremy Irvine'],
  'the-witches-1990': ['Anjelica Huston', 'Mai Zetterling', 'Jasen Fisher', 'Rowan Atkinson'],
  'illang-the-wolf-brigade-2018': ['Gang Dong-won', 'Han Hyo-joo', 'Jung Woo-sung', 'Kim Mu-yeol'],
  'battle-beyond-the-stars-1980': ['Richard Thomas', 'Robert Vaughn', 'George Peppard', 'John Saxon'],
  'them-1954': ['James Whitmore', 'Edmund Gwenn', 'Joan Weldon', 'James Arness'],
  'the-novelists-film-2022': ['Lee Hye-young', 'Kim Min-hee', 'Jo Yoon-hee', 'Seo Young-hwa'],
  'the-call-2020': ['Park Shin-hye', 'Jeon Jong-seo', 'Kim Sung-ryung', 'Lee El'],
  'a-day-at-the-races-1937': ['Groucho Marx', 'Harpo Marx', 'Chico Marx', 'Allan Jones'],
  '3-godfathers-1948': ['John Wayne', 'Pedro Armendáriz', 'Harry Carey Jr.', 'Ward Bond'],
  'highlander-ii-the-quickening-1991': ['Christopher Lambert', 'Sean Connery', 'Virginia Madsen', 'Michael Ironside'],
  'my-sole-desire-2022': ['Zita Hanrot', 'Louise Chevillotte', 'Laure Giappiconi', 'Pedro Casablanc'],
  'oldboy-2013-2013': ['Josh Brolin', 'Elizabeth Olsen', 'Sharlto Copley'],
  'last-action-hero-1993': ['Arnold Schwarzenegger', "Austin O'Brien", 'Charles Dance', 'Robert Prosky'],
  'rosalie-2023': ['Nadia Tereszkiewicz', 'Benoît Magimel', 'Benjamin Biolay', 'Guillaume Gouix'],
  'king-of-new-york-1990': ['Christopher Walken', 'Laurence Fishburne', 'David Caruso', 'Wesley Snipes'],
  'your-name-2016': ['Ryunosuke Kamiki', 'Mone Kamishiraishi'],
  'our-father-the-devil-2021': ['Babetida Sadjo', 'Souléymane Sy Savané', 'Jennifer Tchiakpe', 'Franck Saurel'],
  'the-mountain-1956-1956': ['Spencer Tracy', 'Robert Wagner', 'Claire Trevor', 'William Demarest'],
  'the-host-2006': ['Song Kang-ho', 'Byun Hee-bong', 'Park Hae-il', 'Bae Doona'],
  'mouchette-1967': ['Nadine Nortier', 'Jean-Claude Guilbert', 'Marie Cardinal', 'Paul Hébert'],
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
