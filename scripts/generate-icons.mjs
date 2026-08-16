#!/usr/bin/env node
// Generuje ikony PWA z icon.svg:
// - icon-192.png, icon-512.png (any)
// - icon-maskable-192.png, icon-maskable-512.png (maskable, 10% safe margin)
// - apple-touch-icon.png (180×180, bez przezroczystości)
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const svgSrc = readFileSync(resolve(publicDir, "icon.svg"), "utf8");

// Oryginalny SVG ma rx=112 na rect, co daje zaokrąglone rogi.
// Dla maskable potrzebujemy kwadrat z paddingiem (safe zone = 80% środka).

// "any" — renderuj SVG 1:1
async function generateAny(size, filename) {
  await sharp(Buffer.from(svgSrc)).resize(size, size).png().toFile(resolve(publicDir, filename));
  console.log(`✓ ${filename} (${size}×${size})`);
}

// "maskable" — SVG wewnątrz jest 512×512, dodajemy 10% padding na każdy bok.
// Safe zone = 80%, więc skalujemy SVG do 80% i osadzamy na tle #0B0A12.
async function generateMaskable(size, filename) {
  const innerSize = Math.round(size * 0.8);
  const innerSvg = await sharp(Buffer.from(svgSrc)).resize(innerSize, innerSize).png().toBuffer();
  const offset = Math.round((size - innerSize) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 11, g: 10, b: 18, alpha: 1 } },
  })
    .composite([{ input: innerSvg, left: offset, top: offset }])
    .png()
    .toFile(resolve(publicDir, filename));
  console.log(`✓ ${filename} (${size}×${size}, maskable)`);
}

// apple-touch-icon — 180×180, opaque background (iOS fills transparency with black)
async function generateAppleTouch() {
  const size = 180;
  const innerSize = Math.round(size * 0.85);
  const innerSvg = await sharp(Buffer.from(svgSrc)).resize(innerSize, innerSize).png().toBuffer();
  const offset = Math.round((size - innerSize) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 11, g: 10, b: 18, alpha: 1 } },
  })
    .composite([{ input: innerSvg, left: offset, top: offset }])
    .png()
    .toFile(resolve(publicDir, "apple-touch-icon.png"));
  console.log(`✓ apple-touch-icon.png (${size}×${size})`);
}

await generateAny(192, "icon-192.png");
await generateAny(512, "icon-512.png");
await generateMaskable(192, "icon-maskable-192.png");
await generateMaskable(512, "icon-maskable-512.png");
await generateAppleTouch();

console.log("\nWszystkie ikony wygenerowane w public/");
