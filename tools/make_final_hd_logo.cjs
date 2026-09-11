const sharp = require("sharp");

const input = "goodie-logo-b-preview-white.png";
const transparentOutput = "deliverables/Goodie-Logo-Final-HD-Transparent-v2.png";
const previewOutput = "deliverables/Goodie-Logo-Final-HD-Preview-v2.png";

(async () => {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let pixel = 0, source = 0, target = 0; pixel < info.width * info.height; pixel++, source += 3, target += 4) {
    const r = data[source];
    const g = data[source + 1];
    const b = data[source + 2];
    rgba[target] = r;
    rgba[target + 1] = g;
    rgba[target + 2] = b;
    rgba[target + 3] = 255 - Math.min(r, g, b);
  }

  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .resize({ width: 4096, kernel: sharp.kernel.lanczos3 })
    .extend({ top: 160, bottom: 160, left: 200, right: 200, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(transparentOutput);

  await sharp(transparentOutput)
    .flatten({ background: "#ffffff" })
    .png({ compressionLevel: 9 })
    .toFile(previewOutput);
})();
