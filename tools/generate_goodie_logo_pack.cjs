const fs = require("fs");
const path = require("path");

const workspace = path.resolve(__dirname, "..");
const project = path.join(workspace, "work", "goodie-company-cloudflare-v1");
const outputRoot = path.join(workspace, "outputs", "Goodie-Logo-Brand-Pack-v5");
const opentype = require(path.join(
  project,
  "node_modules",
  ".pnpm",
  "@shuding+opentype.js@1.4.0-beta.0",
  "node_modules",
  "@shuding",
  "opentype.js",
  "dist",
  "opentype.js",
));
const sharp = require(path.join(
  project,
  "node_modules",
  ".pnpm",
  "sharp@0.34.5",
  "node_modules",
  "sharp",
));

const COLORS = {
  black: "#0C0C0D",
  white: "#FFFFFF",
  orange: "#FFB20F",
};

const variants = [
  { slug: "primary", label: "標準彩色版", base: COLORS.black, dot: COLORS.orange },
  { slug: "black", label: "單色黑版", base: COLORS.black, dot: null },
  { slug: "white", label: "單色白版", base: COLORS.white, dot: null },
  { slug: "orange", label: "單色橘版", base: COLORS.orange, dot: null },
  { slug: "reverse", label: "深色底反白版", base: COLORS.white, dot: COLORS.orange },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function commandPoints(command) {
  const result = [];
  if (Number.isFinite(command.x)) result.push([command.x, command.y]);
  if (Number.isFinite(command.x1)) result.push([command.x1, command.y1]);
  if (Number.isFinite(command.x2)) result.push([command.x2, command.y2]);
  return result;
}

function bounds(commands) {
  const points = commands.flatMap(commandPoints);
  return {
    minX: Math.min(...points.map((point) => point[0])),
    maxX: Math.max(...points.map((point) => point[0])),
    minY: Math.min(...points.map((point) => point[1])),
    maxY: Math.max(...points.map((point) => point[1])),
  };
}

function splitSubpaths(commands) {
  const subpaths = [];
  let current = [];
  for (const command of commands) {
    if (command.type === "M" && current.length) {
      subpaths.push(current);
      current = [];
    }
    current.push(command);
  }
  if (current.length) subpaths.push(current);
  return subpaths;
}

function transformCommands(commands, transform) {
  return commands.map((command) => {
    const next = { ...command };
    if (Number.isFinite(next.x)) {
      next.x = next.x * transform.scaleX + transform.translateX;
      next.y = next.y + transform.translateY;
    }
    if (Number.isFinite(next.x1)) {
      next.x1 = next.x1 * transform.scaleX + transform.translateX;
      next.y1 = next.y1 + transform.translateY;
    }
    if (Number.isFinite(next.x2)) {
      next.x2 = next.x2 * transform.scaleX + transform.translateX;
      next.y2 = next.y2 + transform.translateY;
    }
    return next;
  });
}

function fmt(value) {
  return Number(value.toFixed(2));
}

function toSvgPath(commands) {
  return commands
    .map((command) => {
      if (command.type === "M" || command.type === "L") {
        return `${command.type}${fmt(command.x)} ${fmt(command.y)}`;
      }
      if (command.type === "Q") {
        return `Q${fmt(command.x1)} ${fmt(command.y1)} ${fmt(command.x)} ${fmt(command.y)}`;
      }
      if (command.type === "C") {
        return `C${fmt(command.x1)} ${fmt(command.y1)} ${fmt(command.x2)} ${fmt(command.y2)} ${fmt(command.x)} ${fmt(command.y)}`;
      }
      if (command.type === "Z") return "Z";
      return "";
    })
    .join(" ");
}

function logoSvg(model, variant, options = {}) {
  const title = `Goodie Logo — ${variant.label}`;
  const background = options.background
    ? `<rect width="100%" height="100%" fill="${options.background}"/>`
    : "";
  const dot = `<path d="${model.dotPath}" fill="${variant.dot || variant.base}"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-labelledby="title">
  <title id="title">${title}</title>
  ${background}
  <path d="${model.fullPath}" fill="${variant.base}"/>
  ${dot}
</svg>
`;
}

function hexToRgb01(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
}

function pathToPostScript(commands, height) {
  const lines = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  for (const command of commands) {
    if (command.type === "M") {
      currentX = command.x;
      currentY = command.y;
      startX = currentX;
      startY = currentY;
      lines.push(`${fmt(currentX)} ${fmt(height - currentY)} moveto`);
    } else if (command.type === "L") {
      currentX = command.x;
      currentY = command.y;
      lines.push(`${fmt(currentX)} ${fmt(height - currentY)} lineto`);
    } else if (command.type === "Q") {
      const c1x = currentX + (2 / 3) * (command.x1 - currentX);
      const c1y = currentY + (2 / 3) * (command.y1 - currentY);
      const c2x = command.x + (2 / 3) * (command.x1 - command.x);
      const c2y = command.y + (2 / 3) * (command.y1 - command.y);
      lines.push(
        `${fmt(c1x)} ${fmt(height - c1y)} ${fmt(c2x)} ${fmt(height - c2y)} ${fmt(command.x)} ${fmt(height - command.y)} curveto`,
      );
      currentX = command.x;
      currentY = command.y;
    } else if (command.type === "C") {
      lines.push(
        `${fmt(command.x1)} ${fmt(height - command.y1)} ${fmt(command.x2)} ${fmt(height - command.y2)} ${fmt(command.x)} ${fmt(height - command.y)} curveto`,
      );
      currentX = command.x;
      currentY = command.y;
    } else if (command.type === "Z") {
      lines.push("closepath");
      currentX = startX;
      currentY = startY;
    }
  }
  return lines.join("\n");
}

function vectorPostScript(model, variant, illustratorCompatible = false) {
  const [br, bg, bb] = hexToRgb01(variant.base);
  const dotBlock = (() => {
    const [dr, dg, db] = hexToRgb01(variant.dot || variant.base);
    return `\nnewpath\n${pathToPostScript(model.dotCommands, model.height)}\n${fmt(dr)} ${fmt(dg)} ${fmt(db)} setrgbcolor\nfill`;
  })();
  return `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: Goodie Logo Brand Pack v1${illustratorCompatible ? " (Adobe Illustrator compatible)" : ""}
%%Title: Goodie Logo - ${variant.label}
%%BoundingBox: 0 0 ${model.width} ${model.height}
%%HiResBoundingBox: 0 0 ${model.width} ${model.height}
%%LanguageLevel: 2
%%Pages: 1
%%EndComments
gsave
newpath
${pathToPostScript(model.fullCommands, model.height)}
${fmt(br)} ${fmt(bg)} ${fmt(bb)} setrgbcolor
fill${dotBlock}
grestore
showpage
%%EOF
`;
}

function pathToPdf(commands, height) {
  const lines = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  for (const command of commands) {
    if (command.type === "M") {
      currentX = command.x;
      currentY = command.y;
      startX = currentX;
      startY = currentY;
      lines.push(`${fmt(currentX)} ${fmt(height - currentY)} m`);
    } else if (command.type === "L") {
      currentX = command.x;
      currentY = command.y;
      lines.push(`${fmt(currentX)} ${fmt(height - currentY)} l`);
    } else if (command.type === "Q") {
      const c1x = currentX + (2 / 3) * (command.x1 - currentX);
      const c1y = currentY + (2 / 3) * (command.y1 - currentY);
      const c2x = command.x + (2 / 3) * (command.x1 - command.x);
      const c2y = command.y + (2 / 3) * (command.y1 - command.y);
      lines.push(
        `${fmt(c1x)} ${fmt(height - c1y)} ${fmt(c2x)} ${fmt(height - c2y)} ${fmt(command.x)} ${fmt(height - command.y)} c`,
      );
      currentX = command.x;
      currentY = command.y;
    } else if (command.type === "C") {
      lines.push(
        `${fmt(command.x1)} ${fmt(height - command.y1)} ${fmt(command.x2)} ${fmt(height - command.y2)} ${fmt(command.x)} ${fmt(height - command.y)} c`,
      );
      currentX = command.x;
      currentY = command.y;
    } else if (command.type === "Z") {
      lines.push("h");
      currentX = startX;
      currentY = startY;
    }
  }
  return lines.join("\n");
}

function makePdf(model, variant) {
  const [br, bg, bb] = hexToRgb01(variant.base);
  const dotContent = (() => {
    const [dr, dg, db] = hexToRgb01(variant.dot || variant.base);
    return `\n${fmt(dr)} ${fmt(dg)} ${fmt(db)} rg\n${pathToPdf(model.dotCommands, model.height)}\nf`;
  })();
  const stream = `q\n${fmt(br)} ${fmt(bg)} ${fmt(bb)} rg\n${pathToPdf(model.fullCommands, model.height)}\nf${dotContent}\nQ\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${model.width} ${model.height}] /Resources << >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n%Goodie\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

function makeModel() {
  // The approved reference has flat terminals (G, d and i), not rounded terminals.
  const fontPath = "C:/Windows/Fonts/arialbd.ttf";
  const fontBuffer = fs.readFileSync(fontPath);
  const fontArrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength,
  );
  const font = opentype.parse(fontArrayBuffer);
  const fontSize = 1000;
  // Calibrated against the larger approved reference: preserve visible gaps
  // between all six letters while keeping the wordmark compact.
  const tracking = -40;
  const glyphs = font.stringToGlyphs("Goodie");
  const rawCommands = [];
  let cursorX = 0;
  let previousGlyph = null;
  for (const glyph of glyphs) {
    if (previousGlyph) {
      cursorX += font.getKerningValue(previousGlyph, glyph) * fontSize / font.unitsPerEm;
    }
    rawCommands.push(...glyph.getPath(cursorX, fontSize, fontSize).commands);
    cursorX += glyph.advanceWidth * fontSize / font.unitsPerEm + tracking;
    previousGlyph = glyph;
  }
  const rawBounds = bounds(rawCommands);
  // Keep every glyph at its natural width. The compact reference is achieved
  // through tighter tracking instead of horizontally distorting the letters.
  const scaleX = 1;
  const margin = 55;
  const transform = {
    scaleX,
    translateX: margin - rawBounds.minX * scaleX,
    translateY: margin - rawBounds.minY,
  };
  const rawSubpaths = splitSubpaths(rawCommands);
  const candidates = rawSubpaths
    .map((commands) => ({ commands, box: bounds(commands) }))
    .filter(({ box }) => {
      const widthRatio = (box.maxX - box.minX) / (rawBounds.maxX - rawBounds.minX);
      const heightRatio = (box.maxY - box.minY) / (rawBounds.maxY - rawBounds.minY);
      return box.minY < rawBounds.minY + 0.25 * (rawBounds.maxY - rawBounds.minY)
        && widthRatio < 0.08
        && heightRatio < 0.28;
    })
    .sort((left, right) => right.box.minX - left.box.minX);
  if (!candidates.length) throw new Error("Could not locate the dot above the letter i.");
  const rawDotCommands = candidates[0].commands;
  const bodyRawCommands = rawSubpaths.filter((part) => part !== rawDotCommands).flat();
  const fullCommands = transformCommands(bodyRawCommands, transform);
  const transformedFontDot = transformCommands(rawDotCommands, transform);
  const dotBox = bounds(transformedFontDot);
  const dotCenterX = (dotBox.minX + dotBox.maxX) / 2;
  const dotCenterY = (dotBox.minY + dotBox.maxY) / 2;
  const dotRadius = Math.min(dotBox.maxX - dotBox.minX, dotBox.maxY - dotBox.minY) / 2;
  const k = 0.5522847498;
  const dotCommands = [
    { type: "M", x: dotCenterX + dotRadius, y: dotCenterY },
    { type: "C", x1: dotCenterX + dotRadius, y1: dotCenterY + k * dotRadius, x2: dotCenterX + k * dotRadius, y2: dotCenterY + dotRadius, x: dotCenterX, y: dotCenterY + dotRadius },
    { type: "C", x1: dotCenterX - k * dotRadius, y1: dotCenterY + dotRadius, x2: dotCenterX - dotRadius, y2: dotCenterY + k * dotRadius, x: dotCenterX - dotRadius, y: dotCenterY },
    { type: "C", x1: dotCenterX - dotRadius, y1: dotCenterY - k * dotRadius, x2: dotCenterX - k * dotRadius, y2: dotCenterY - dotRadius, x: dotCenterX, y: dotCenterY - dotRadius },
    { type: "C", x1: dotCenterX + k * dotRadius, y1: dotCenterY - dotRadius, x2: dotCenterX + dotRadius, y2: dotCenterY - k * dotRadius, x: dotCenterX + dotRadius, y: dotCenterY },
    { type: "Z" },
  ];
  const fullBounds = bounds([...fullCommands, ...dotCommands]);
  const width = Math.ceil(fullBounds.maxX + margin);
  const height = Math.ceil(fullBounds.maxY + margin);
  return {
    width,
    height,
    fullCommands,
    dotCommands,
    fullPath: toSvgPath(fullCommands),
    dotPath: toSvgPath(dotCommands),
  };
}

function previewSvg(model) {
  const rows = [
    { variant: variants[0], label: "PRIMARY / 標準彩色版", bg: "#FFFFFF", border: "#E9E9E9" },
    { variant: variants[1], label: "MONO BLACK / 單色黑版", bg: "#F7F7F7", border: "#E9E9E9" },
    { variant: variants[3], label: "MONO ORANGE / 單色橘版", bg: "#FFFFFF", border: "#E9E9E9" },
    { variant: variants[4], label: "REVERSE / 深色底反白版", bg: COLORS.black, border: COLORS.black },
  ];
  const cardWidth = 1360;
  const cardHeight = 210;
  const left = 120;
  const logoWidth = 610;
  const logoHeight = logoWidth * model.height / model.width;
  const logoX = left + 650;
  const cards = rows.map((row, index) => {
    const y = 175 + index * 242;
    const dot = `<path d="${model.dotPath}" fill="${row.variant.dot || row.variant.base}"/>`;
    const labelColor = row.bg === COLORS.black ? "#FFFFFF" : "#222222";
    const subColor = row.bg === COLORS.black ? "#BBBBBB" : "#777777";
    return `
      <rect x="${left}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="24" fill="${row.bg}" stroke="${row.border}"/>
      <text x="${left + 54}" y="${y + 86}" fill="${labelColor}" font-family="Arial, 'Microsoft JhengHei', sans-serif" font-size="27" font-weight="700">${row.label}</text>
      <text x="${left + 54}" y="${y + 128}" fill="${subColor}" font-family="Arial, 'Microsoft JhengHei', sans-serif" font-size="20">透明背景・向量外框</text>
      <g transform="translate(${logoX} ${y + (cardHeight - logoHeight) / 2}) scale(${logoWidth / model.width})">
        <path d="${model.fullPath}" fill="${row.variant.base}"/>
        ${dot}
      </g>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1300" viewBox="0 0 1600 1300">
    <rect width="1600" height="1300" fill="#F4F2EE"/>
    <text x="120" y="92" fill="#111111" font-family="Arial, 'Microsoft JhengHei', sans-serif" font-size="46" font-weight="800">Goodie Logo Brand Pack</text>
    <text x="120" y="132" fill="#777777" font-family="Arial, 'Microsoft JhengHei', sans-serif" font-size="21">v5 · 依較大原圖校正字距；字母不變形，G 保持正常寬高比例</text>
    ${cards}
    <text x="120" y="1185" fill="#222222" font-family="Arial, 'Microsoft JhengHei', sans-serif" font-size="25" font-weight="700">品牌色</text>
    <rect x="120" y="1210" width="72" height="36" rx="8" fill="${COLORS.orange}"/><text x="210" y="1237" fill="#444" font-family="Arial, sans-serif" font-size="20">Goodie Orange  #FFB20F</text>
    <rect x="590" y="1210" width="72" height="36" rx="8" fill="${COLORS.black}"/><text x="680" y="1237" fill="#444" font-family="Arial, sans-serif" font-size="20">Goodie Black  #0C0C0D</text>
    <rect x="1040" y="1210" width="72" height="36" rx="8" fill="#FFFFFF" stroke="#D8D8D8"/><text x="1130" y="1237" fill="#444" font-family="Arial, sans-serif" font-size="20">White  #FFFFFF</text>
  </svg>`;
}

async function main() {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  const folders = [
    "00_Preview",
    "01_SVG_Vector",
    "02_PNG_Transparent/512px",
    "02_PNG_Transparent/1024px",
    "02_PNG_Transparent/2048px",
    "03_PDF_Vector",
    "04_EPS_Vector",
    "05_Illustrator_Compatible",
    "06_Original_Reference",
  ];
  folders.forEach((folder) => ensureDir(path.join(outputRoot, folder)));

  const model = makeModel();
  for (const variant of variants) {
    const baseName = `Goodie-Logo-${variant.slug}`;
    const svg = logoSvg(model, variant);
    fs.writeFileSync(path.join(outputRoot, "01_SVG_Vector", `${baseName}.svg`), svg);
    for (const size of [512, 1024, 2048]) {
      await sharp(Buffer.from(svg))
        .resize({ width: size })
        .png({ compressionLevel: 9 })
        .toFile(path.join(outputRoot, "02_PNG_Transparent", `${size}px`, `${baseName}-${size}px.png`));
    }
    fs.writeFileSync(path.join(outputRoot, "03_PDF_Vector", `${baseName}.pdf`), makePdf(model, variant));
    fs.writeFileSync(path.join(outputRoot, "04_EPS_Vector", `${baseName}.eps`), vectorPostScript(model, variant));
    fs.writeFileSync(path.join(outputRoot, "05_Illustrator_Compatible", `${baseName}.ai`), vectorPostScript(model, variant, true));
  }

  const preview = previewSvg(model);
  fs.writeFileSync(path.join(outputRoot, "00_Preview", "Goodie-Logo-Pack-Preview.svg"), preview);
  await sharp(Buffer.from(preview))
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputRoot, "00_Preview", "Goodie-Logo-Pack-Preview.png"));

  const sourceLogo = path.join(project, "public", "goodie-logo.png");
  fs.copyFileSync(sourceLogo, path.join(outputRoot, "06_Original_Reference", "goodie-logo-current-website-reference.png"));

  const readme = `GOODIE LOGO BRAND PACK v5
==========================

本套檔案依照 Goodie 目前網站正在使用的字標重新描繪為向量外框。
字樣已轉成外框，交給印刷廠或設計師時不需要另外安裝字型。

正式品牌色
----------
Goodie Orange
HEX  #FFB20F
RGB  255 / 178 / 15
CMYK 0 / 30 / 94 / 0（數位換算參考值，正式印刷請以打樣為準）

Goodie Black
HEX  #0C0C0D
RGB  12 / 12 / 13
CMYK 8 / 8 / 0 / 95（數位換算參考值，正式印刷請以打樣為準）

White
HEX  #FFFFFF
RGB  255 / 255 / 255
CMYK 0 / 0 / 0 / 0

檔案用途
--------
01_SVG_Vector：網站、Figma、Canva、數位設計的首選向量格式。
02_PNG_Transparent：PowerPoint、Word、社群圖與一般辦公用途；全部為透明背景。
03_PDF_Vector：印刷廠、報價單、簡報與跨平台交換。
04_EPS_Vector：傳統印刷與大圖輸出用向量檔。
05_Illustrator_Compatible：Adobe Illustrator 可開啟的舊式向量 AI/PostScript 檔。

AI 檔重要說明
-------------
目前最新版 Adobe Illustrator 的原生 .ai 是 Adobe 專屬格式。
此資料夾提供的是 Illustrator 可直接開啟、保持向量的相容版 .ai。
設計師開啟 SVG、EPS 或相容版 AI 後，使用「另存新檔」即可存成最新版原生 AI。

版本選擇
--------
primary：白色或淺色背景，標準黑字＋橘色 i 圓點。
black：單色印刷、雷雕、壓印。
white：深色照片或深色底。
orange：品牌橘單色應用。
reverse：深色底使用，白字＋橘色 i 圓點。

使用原則
--------
1. 不拉伸、不壓扁、不旋轉 Logo。
2. 不任意改字距、改顏色或加陰影。
3. Logo 四周至少保留一個「o」字高度的淨空。
4. 大量印刷、招牌或特殊材質製作前，請先請廠商打樣確認顏色與細節。
5. v5 依較大的確認原圖重新校正字距，保留每個字母原生寬高比例與清楚間隔；若公司另有原始商標 AI，仍應以公司原始檔為最高準則。
`;
  fs.writeFileSync(path.join(outputRoot, "README_使用說明.txt"), readme, "utf8");
  fs.writeFileSync(
    path.join(outputRoot, "BRAND_COLORS.txt"),
    `Goodie Orange\nHEX #FFB20F\nRGB 255, 178, 15\n\nGoodie Black\nHEX #0C0C0D\nRGB 12, 12, 13\n\nWhite\nHEX #FFFFFF\nRGB 255, 255, 255\n`,
    "utf8",
  );
  console.log(outputRoot);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
