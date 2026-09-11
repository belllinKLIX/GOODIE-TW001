const fs = require("fs");
const path = require("path");

const workspace = path.resolve(__dirname, "..");
const project = path.join(workspace, "work", "goodie-company-cloudflare-v1");
const outDir = path.join(workspace, "outputs", "Goodie-Logo-Font-Comparison");
const targetPath = "C:/Users/henry/AppData/Local/Temp/codex-clipboard-9351e499-b2a8-4b9d-8b32-06a803a462bd.png";
const opentype = require(path.join(
  project,
  "node_modules/.pnpm/@shuding+opentype.js@1.4.0-beta.0/node_modules/@shuding/opentype.js/dist/opentype.js",
));
const sharp = require(path.join(
  project,
  "node_modules/.pnpm/sharp@0.34.5/node_modules/sharp",
));

const candidates = [
  ["A", "Arial Bold", "C:/Windows/Fonts/arialbd.ttf"],
  ["B", "Arial Black", "C:/Windows/Fonts/ariblk.ttf"],
  ["C", "Segoe UI Bold", "C:/Windows/Fonts/segoeuib.ttf"],
  ["D", "Tahoma Bold", "C:/Windows/Fonts/tahomabd.ttf"],
  ["E", "Verdana Bold", "C:/Windows/Fonts/verdanab.ttf"],
  ["F", "Century Gothic Bold", "C:/Windows/Fonts/GOTHICB.TTF"],
  ["G", "Ebrima Bold", "C:/Windows/Fonts/ebrimabd.ttf"],
  ["H", "Franklin Gothic Demi", "C:/Windows/Fonts/FRADM.TTF"],
];

function points(command) {
  const result = [];
  for (const suffix of ["", "1", "2"]) {
    const x = command[`x${suffix}`];
    const y = command[`y${suffix}`];
    if (Number.isFinite(x) && Number.isFinite(y)) result.push([x, y]);
  }
  return result;
}

function bounds(commands) {
  const all = commands.flatMap(points);
  return {
    minX: Math.min(...all.map((p) => p[0])),
    maxX: Math.max(...all.map((p) => p[0])),
    minY: Math.min(...all.map((p) => p[1])),
    maxY: Math.max(...all.map((p) => p[1])),
  };
}

function split(commands) {
  const result = [];
  let current = [];
  for (const command of commands) {
    if (command.type === "M" && current.length) {
      result.push(current);
      current = [];
    }
    current.push(command);
  }
  if (current.length) result.push(current);
  return result;
}

function transform(commands, sx, sy, tx, ty) {
  return commands.map((command) => {
    const next = { ...command };
    for (const suffix of ["", "1", "2"]) {
      const xKey = `x${suffix}`;
      const yKey = `y${suffix}`;
      if (Number.isFinite(next[xKey])) {
        next[xKey] = next[xKey] * sx + tx;
        next[yKey] = next[yKey] * sy + ty;
      }
    }
    return next;
  });
}

function n(value) {
  return Number(value.toFixed(2));
}

function pathData(commands) {
  return commands.map((command) => {
    if (command.type === "M" || command.type === "L") return `${command.type}${n(command.x)} ${n(command.y)}`;
    if (command.type === "Q") return `Q${n(command.x1)} ${n(command.y1)} ${n(command.x)} ${n(command.y)}`;
    if (command.type === "C") return `C${n(command.x1)} ${n(command.y1)} ${n(command.x2)} ${n(command.y2)} ${n(command.x)} ${n(command.y)}`;
    return command.type === "Z" ? "Z" : "";
  }).join(" ");
}

function makeLogo(fontPath, x, y, width, height) {
  const buffer = fs.readFileSync(fontPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const font = opentype.parse(arrayBuffer);
  const commands = font.getPath("Goodie", 0, 1000, 1000, { kerning: true }).commands;
  const box = bounds(commands);
  const sx = width / (box.maxX - box.minX);
  const sy = height / (box.maxY - box.minY);
  const tx = x - box.minX * sx;
  const ty = y - box.minY * sy;
  const full = transform(commands, sx, sy, tx, ty);
  const dot = split(commands)
    .map((part) => ({ part, box: bounds(part) }))
    .filter(({ box: partBox }) => {
      const h = (partBox.maxY - partBox.minY) / (box.maxY - box.minY);
      return partBox.minY < box.minY + (box.maxY - box.minY) * 0.33 && h < 0.35;
    })
    .sort((left, right) => right.box.minX - left.box.minX)[0];
  return {
    full: pathData(full),
    dot: dot ? pathData(transform(dot.part, sx, sy, tx, ty)) : "",
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const targetData = fs.readFileSync(targetPath).toString("base64");
  const rows = candidates.map(([letter, name, fontPath], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const cardX = 70 + column * 740;
    const cardY = 300 + row * 230;
    const logo = makeLogo(fontPath, cardX + 245, cardY + 54, 410, 104);
    return `<rect x="${cardX}" y="${cardY}" width="680" height="190" rx="20" fill="#FFFFFF" stroke="#DDDDDD"/>
      <circle cx="${cardX + 65}" cy="${cardY + 65}" r="30" fill="#FFB20F"/>
      <text x="${cardX + 65}" y="${cardY + 75}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700">${letter}</text>
      <text x="${cardX + 34}" y="${cardY + 145}" font-family="Arial" font-size="21" font-weight="700">${name}</text>
      <path d="${logo.full}" fill="#0C0C0D"/><path d="${logo.dot}" fill="#FFB20F"/>`;
  }).join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1550" height="1280" viewBox="0 0 1550 1280">
    <rect width="1550" height="1280" fill="#F4F2EE"/>
    <text x="70" y="75" font-family="Arial" font-size="38" font-weight="700">Goodie 字型輪廓比較</text>
    <text x="70" y="117" font-family="Arial" font-size="20" fill="#666666">上方是你提供的原圖；下方全部統一成相同寬高，專門比較字母造型。</text>
    <rect x="70" y="155" width="1420" height="110" rx="20" fill="#FFFFFF" stroke="#DDDDDD"/>
    <text x="105" y="218" font-family="Arial" font-size="23" font-weight="700">原圖</text>
    <image x="300" y="172" width="370" height="76" preserveAspectRatio="xMinYMid meet" href="data:image/png;base64,${targetData}"/>
    ${rows}
  </svg>`;
  fs.writeFileSync(path.join(outDir, "Goodie-Font-Comparison.svg"), svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, "Goodie-Font-Comparison.png"));
  console.log(path.join(outDir, "Goodie-Font-Comparison.png"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
