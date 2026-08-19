import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";

// polska nazwa pliku -> identyfikator awatara z src/lib/avatars.ts
const MAP = {
  cat: "kot", dog: "pies", bird: "ptaszek", rabbit: "krolik", panda: "panda",
  squirrel: "wiewiorka", fish: "rybka", turtle: "zolw", bug: "biedronka-1", rat: "myszka",
  snail: "slimak", worm: "robaczek", shell: "muszla", feather: "pioro", egg: "jajko",
  paw: "lapka", pizza: "pizza", beer: "piwo", guitar: "gitara", rocket: "rakieta",
  bot: "robot", ghost: "duszek", skull: "czaszka", flame: "ogien", gamepad: "pad",
  crown: "korona", diamond: "diament", anchor: "kotwica-2", bike: "rower", zap: "blyskawica",
};

// identyfikator gry (z registry) -> plik w emotki-gry/
const GAMES = {
  stoper: "budzik",
  "panstwa-miasta": "panstwa-miasta",
  wisielec: "wisielec",
  impostor: "szpieg-1",   // szpieg = ten, który udaje; NIE impostor-*.png (postacie Among Us)
  mafia: "karty-2",       // karty ról: odznaka szeryfa, czaszka, znak zapytania
};

const OUT = "public/avatars";
const BOX = 192;   // wystarcza na 48 px wyświetlania przy 3x DPI
const INNER = 176; // margines oddechu w kafelku

await mkdir(OUT, { recursive: true });
const have = new Set(await readdir("emoji-pack"));
let total = 0;
const missing = [];

for (const [id, file] of Object.entries(MAP)) {
  const src = `${file}.png`;
  if (!have.has(src)) { missing.push(`${id} -> ${src}`); continue; }
  const buf = await sharp(`emoji-pack/${src}`)
    .trim()                                   // usuń przezroczysty margines, wyrównaj skalę
    .resize(INNER, INNER, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: (BOX - INNER) / 2, bottom: (BOX - INNER) / 2,
      left: (BOX - INNER) / 2, right: (BOX - INNER) / 2,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 88, effort: 6 })
    .toBuffer();
  await sharp(buf).toFile(`${OUT}/${id}.webp`);
  total += buf.length;
}

console.log(`awatary: ${Object.keys(MAP).length - missing.length}/30 — ${(total / 1024).toFixed(0)} kB`);
if (missing.length) console.log("BRAKUJE:", missing.join(", "));

// --- ikony gier ---
const GOUT = "public/games";
await mkdir(GOUT, { recursive: true });
const ghave = new Set(await readdir("emotki-gry"));
let gtotal = 0;
for (const [id, file] of Object.entries(GAMES)) {
  const src = `${file}.png`;
  if (!ghave.has(src)) { console.log(`BRAK ikony gry: ${id} -> ${src}`); continue; }
  const buf = await sharp(`emotki-gry/${src}`)
    .trim()
    .resize(INNER, INNER, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: (BOX - INNER) / 2, bottom: (BOX - INNER) / 2,
      left: (BOX - INNER) / 2, right: (BOX - INNER) / 2,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 88, effort: 6 })
    .toBuffer();
  await sharp(buf).toFile(`${GOUT}/${id}.webp`);
  gtotal += buf.length;
}
console.log(`gry: ${Object.keys(GAMES).length}/5 — ${(gtotal / 1024).toFixed(0)} kB`);
