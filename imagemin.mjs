import fs from 'node:fs/promises';
import path from 'node:path';
import { globSync } from 'glob';
import sharp from 'sharp';
import { optimize } from 'svgo';

const SRC_DIR = 'src/img';
const DIST_DIR = 'dist/assets/img';
const WEBP_OUTPUT = true;
const WEBP_TARGET_EXTS = ['.jpg', '.jpeg', '.png'];

const svgoConfig = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeMetadata: false,
          removeUnknownsAndDefaults: false,
          convertShapeToPath: false,
          collapseGroups: false,
          cleanupIds: false,
        },
      },
    },
  ],
};

const files = globSync('**/*.{jpg,jpeg,png,gif,svg,ico}', {
  cwd: SRC_DIR,
  nodir: true,
  nocase: true,
});

const processFile = async (rel) => {
  const src = path.join(SRC_DIR, rel);
  const dest = path.join(DIST_DIR, rel);
  const ext = path.extname(rel).toLowerCase();
  await fs.mkdir(path.dirname(dest), { recursive: true });

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      await sharp(src).jpeg({ quality: 85, progressive: true, mozjpeg: true }).toFile(dest);
      break;
    case '.png':
      await sharp(src).png({ palette: true, quality: 85 }).toFile(dest);
      break;
    case '.gif':
      await sharp(src, { animated: true }).gif().toFile(dest);
      break;
    case '.svg': {
      const svg = await fs.readFile(src, 'utf8');
      const { data } = optimize(svg, { path: src, ...svgoConfig });
      await fs.writeFile(dest, data);
      break;
    }
    default:
      // .ico などはそのままコピー
      await fs.copyFile(src, dest);
  }

  // webp は圧縮済みファイルではなく元画像から生成（再圧縮による劣化を避ける）
  if (WEBP_OUTPUT && WEBP_TARGET_EXTS.includes(ext)) {
    const webpDest = path.join(
      path.dirname(dest),
      'webp',
      `${path.basename(rel, path.extname(rel))}.webp`,
    );
    await fs.mkdir(path.dirname(webpDest), { recursive: true });
    await sharp(src).webp({ quality: 50 }).toFile(webpDest);
  }
};

const results = await Promise.allSettled(files.map(processFile));
const failed = results
  .map((r, i) => ({ r, file: files[i] }))
  .filter(({ r }) => r.status === 'rejected');

failed.forEach(({ r, file }) => console.error(`Failed: ${file}\n  ${r.reason}`));
console.log(`Images optimized: ${files.length - failed.length}/${files.length}`);
if (failed.length) process.exitCode = 1;
