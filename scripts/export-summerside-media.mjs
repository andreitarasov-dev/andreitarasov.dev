import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep, win32 } from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const defaultManifest = new URL('../src/content/summerside/media.json', import.meta.url);
const usage = 'Usage: node scripts/export-summerside-media.mjs --input <originals-directory> --mapping <id-to-file.json> --output <new-directory> --base-url <public-base-url> [--manifest <source-media.json>]';
const formats = [
  { type: 'image/avif', extension: 'avif', encode: image => image.avif({ quality: 52 }) },
  { type: 'image/webp', extension: 'webp', encode: image => image.webp({ quality: 80 }) },
  { type: 'image/jpeg', extension: 'jpg', encode: image => image.flatten({ background: '#ffffff' }).jpeg({ quality: 82, mozjpeg: true }) }
];

function publicBaseUrl(value) {
  const url = URL.parse(value);
  if (!/^https?:\/\//i.test(value) || !url || url.username || url.password || /[?#]/.test(value)) {
    throw new Error('--base-url must be an absolute HTTP or HTTPS URL without credentials, query, or fragment.');
  }
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
}

async function readMapping(filename) {
  const json = await readFile(filename, 'utf8');
  const mapping = JSON.parse(json);
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new Error('The mapping must be a JSON object of photo IDs to relative filenames.');
  }
  // JSON.parse keeps only the last value for a repeated key. Check the source tokens too.
  const keys = new Set();
  let previous;
  for (const [token] of json.matchAll(/"(?:\\[\s\S]|[^"\\])*"|:/g)) {
    if (token === ':') {
      const key = JSON.parse(previous);
      if (keys.has(key)) throw new Error(`Duplicate mapping for photo ${key}.`);
      keys.add(key);
    }
    previous = token;
  }
  return mapping;
}

async function resolveOriginals(photos, mapping, input) {
  if (!Array.isArray(photos) || !photos.length) throw new Error('The source manifest must contain a nonempty array of photos.');
  const ids = new Set();
  for (const photo of photos) {
    if (typeof photo?.id !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/i.test(photo.id) || typeof photo.alt !== 'string' || (photo.caption !== undefined && typeof photo.caption !== 'string')) {
      throw new Error('Each manifest photo must have a filename-safe ID, alt text, and an optional caption.');
    }
    const key = photo.id.toLowerCase();
    if (ids.has(key)) throw new Error(`Duplicate manifest photo ID ${photo.id}.`);
    ids.add(key);
    if (!Object.hasOwn(mapping, photo.id)) throw new Error(`Missing mapping for photo ${photo.id}.`);
  }
  const knownIds = new Set(photos.map(({ id }) => id));
  for (const id of Object.keys(mapping)) {
    if (!knownIds.has(id)) throw new Error(`Unknown photo ID ${id} in mapping.`);
  }

  const originals = [];
  const usedFiles = new Map();
  for (const photo of photos) {
    const name = mapping[photo.id];
    if (typeof name !== 'string' || !name.trim() || isAbsolute(name) || win32.isAbsolute(name) || /[\\\0]/.test(name) || name.split('/').includes('..')) {
      throw new Error(`Provide a relative original filename inside --input for photo ${photo.id}.`);
    }
    const file = await realpath(resolve(input, name)).catch(error => {
      throw new Error(`Cannot resolve original for photo ${photo.id}: ${error.message}`);
    });
    const fromInput = relative(input, file);
    if (fromInput === '..' || fromInput.startsWith(`..${sep}`) || isAbsolute(fromInput)) {
      throw new Error(`Original for photo ${photo.id} points outside --input.`);
    }
    const details = await stat(file);
    if (!details.isFile()) throw new Error(`Original for photo ${photo.id} is not a file.`);
    const identity = `${details.dev}:${details.ino}`;
    if (usedFiles.has(identity)) throw new Error(`Duplicate original for photos ${usedFiles.get(identity)} and ${photo.id}.`);
    usedFiles.set(identity, photo.id);

    const { autoOrient } = await sharp(file).metadata().catch(error => {
      throw new Error(`Cannot read original for photo ${photo.id}: ${error.message}`);
    });
    if (!autoOrient?.width || !autoOrient.height) throw new Error(`Cannot determine dimensions for photo ${photo.id}.`);
    originals.push({ photo, file, width: autoOrient.width });
  }
  return originals;
}

async function exportPhoto({ photo, file, width }, output, baseUrl) {
  const widths = [...new Set([480, 960, 1600].map(size => Math.min(size, width)))];
  const sources = [];
  let jpeg;
  for (const format of formats) {
    const variants = [];
    for (const target of widths) {
      // Sharp applies EXIF orientation to pixels and omits metadata by default.
      const image = sharp(file).autoOrient().resize({ width: target, withoutEnlargement: true });
      const { data, info } = await format.encode(image).toBuffer({ resolveWithObject: true });
      const hash = createHash('sha256').update(data).digest('hex').slice(0, 12);
      const name = `${photo.id}-${info.width}-${hash}.${format.extension}`;
      await writeFile(join(output, name), data, { flag: 'wx' });
      variants.push({ url: new URL(name, baseUrl).href, width: info.width, height: info.height });
    }
    sources.push({ type: format.type, srcset: variants.map(variant => `${variant.url} ${variant.width}w`).join(', ') });
    if (format.type === 'image/jpeg') jpeg = variants;
  }
  const { url: fullUrl, width: exportedWidth, height } = jpeg.at(-1);
  const { id, alt, caption } = photo;
  return { id, width: exportedWidth, height, alt, caption, fallbackUrl: jpeg[0].url, sources, fullUrl, delivery: 'published' };
}

async function main() {
  const { values } = parseArgs({ options: {
    input: { type: 'string' }, mapping: { type: 'string' }, output: { type: 'string' },
    'base-url': { type: 'string' }, manifest: { type: 'string' }, help: { type: 'boolean' }
  } });
  if (values.help) return console.log(usage);
  if (['input', 'mapping', 'output', 'base-url'].some(key => !values[key])) throw new Error(usage);

  const baseUrl = publicBaseUrl(values['base-url']);
  const input = await realpath(values.input);
  if (!(await stat(input)).isDirectory()) throw new Error('--input must be a directory.');
  const photos = JSON.parse(await readFile(values.manifest ?? defaultManifest, 'utf8'));
  const mapping = await readMapping(values.mapping);
  const originals = await resolveOriginals(photos, mapping, input);
  const output = resolve(values.output);
  await mkdir(output).catch(error => {
    if (error.code === 'EEXIST') throw new Error(`Output already exists; choose a new directory: ${output}`);
    throw error;
  });

  const candidate = [];
  for (const original of originals) {
    candidate.push(await exportPhoto(original, output, baseUrl).catch(error => {
      throw new Error(`Cannot export photo ${original.photo.id}: ${error.message}`);
    }));
  }
  await writeFile(join(output, 'media.json'), `${JSON.stringify(candidate, null, 2)}\n`, { flag: 'wx' });
  console.log(`Exported ${candidate.length} photos and a candidate media.json to ${output}`);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
