import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const cli = fileURLToPath(new URL('../scripts/export-summerside-media.mjs', import.meta.url));
const baseUrl = 'https://example.com/assets/summerside';
const photo = { id: 'portrait', width: 12, height: 8, alt: 'Two bands of color', caption: 'A test image', fallbackUrl: 'https://old.example/preview.jpg', fullUrl: 'https://old.example/full.jpg', sources: [], delivery: 'legacy-preview' };
const small = { ...photo, id: 'small', alt: 'A small square', caption: undefined };

async function setup(t, photos = [photo]) {
  const root = await mkdtemp(join(tmpdir(), 'summerside-media-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const input = join(root, 'input');
  const output = join(root, 'output');
  const mapping = join(root, 'mapping.json');
  const manifest = join(root, 'manifest.json');
  await mkdir(input);
  await writeFile(manifest, JSON.stringify(photos));
  return {
    root, input, output, manifest,
    async run(entries, options = {}) {
      await writeFile(mapping, typeof entries === 'string' ? entries : JSON.stringify(entries));
      return spawnSync(process.execPath, [cli, '--input', input, '--mapping', mapping, '--output', options.output ?? output, '--base-url', options.baseUrl ?? baseUrl, ...(options.defaultManifest ? [] : ['--manifest', manifest])], { encoding: 'utf8' });
    }
  };
}

test('exports optimized, correctly oriented images without original metadata', async t => {
  const fixture = await setup(t, [photo, small]);
  const source = join(fixture.input, 'original.jpg');
  await sharp({ create: { width: 1200, height: 2000, channels: 3, background: 'red' } })
    .composite([{ input: { create: { width: 1200, height: 1000, channels: 3, background: 'blue' } }, left: 0, top: 1000 }])
    .withMetadata({ orientation: 6 })
    .withExifMerge({ IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '40/1 30/1 0/1', GPSLongitudeRef: 'E', GPSLongitude: '20/1 15/1 0/1' } })
    .jpeg().toFile(source);
  const original = await readFile(source);
  assert.equal((await sharp(original).metadata()).orientation, 6);
  await sharp({ create: { width: 320, height: 320, channels: 3, background: 'green' } }).png().toFile(join(fixture.input, 'small.png'));

  const result = await fixture.run({ portrait: 'original.jpg', small: 'small.png' });
  assert.equal(result.status, 0, result.stderr);
  const candidate = await readFile(join(fixture.output, 'media.json'), 'utf8');
  const exported = JSON.parse(candidate);
  assert.deepEqual(exported.map(({ id, alt, caption, width, height, delivery }) => [id, alt, caption, width, height, delivery]), [
    ['portrait', photo.alt, photo.caption, 1600, 960, 'published'],
    ['small', small.alt, undefined, 320, 320, 'published']
  ]);

  const artifactNames = [];
  for (const item of exported) {
    const expectedWidths = item.id === 'portrait' ? [480, 960, 1600] : [320];
    assert.deepEqual(item.sources.map(({ type }) => type), ['image/avif', 'image/webp', 'image/jpeg']);
    for (const { type, srcset } of item.sources) {
      const extension = type === 'image/jpeg' ? 'jpg' : type.split('/')[1];
      const entries = srcset.split(', ').map(entry => entry.split(' '));
      assert.deepEqual(entries.map(([, width]) => width), expectedWidths.map(width => `${width}w`));
      for (const [[url], width] of entries.map((entry, i) => [entry, expectedWidths[i]])) {
        const filename = new URL(url).pathname.split('/').at(-1);
        assert.equal(url, `${baseUrl}/${filename}`);
        const bytes = await readFile(join(fixture.output, filename));
        const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
        assert.equal(filename, `${item.id}-${width}-${hash}.${extension}`);
        artifactNames.push(filename);
        const image = await sharp(bytes).metadata();
        assert.equal(image.format, { avif: 'heif', webp: 'webp', jpg: 'jpeg' }[extension]);
        if (extension === 'avif') assert.equal(image.compression, 'av1');
        assert.deepEqual([image.width, image.height], [width, item.id === 'portrait' ? width * 0.6 : width]);
        for (const field of ['exif', 'orientation', 'icc', 'iptc', 'xmp']) assert.equal(image[field], undefined, `${filename} retained ${field}`);
      }
    }
    const jpegUrls = item.sources.at(-1).srcset.split(', ').map(entry => entry.split(' ')[0]);
    assert.equal(item.fallbackUrl, jpegUrls[0]);
    assert.equal(item.fullUrl, jpegUrls.at(-1));
  }
  assert.deepEqual((await readdir(fixture.output)).sort(), ['media.json', ...artifactNames].sort());
  const pixels = await sharp(join(fixture.output, exported[0].fullUrl.split('/').at(-1))).resize(2, 1).raw().toBuffer();
  assert.ok(pixels[2] > pixels[0] && pixels[3] > pixels[5], 'the original bottom becomes the left side');
  assert.deepEqual(await readFile(source), original);

  const repeated = join(fixture.root, 'repeated');
  const second = await fixture.run({ portrait: 'original.jpg', small: 'small.png' }, { output: repeated, baseUrl: `${baseUrl}/` });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(await readFile(join(repeated, 'media.json'), 'utf8'), candidate);
});

test('rejects incomplete, duplicate, or unsafe mappings before writing files', async t => {
  const fixture = await setup(t, [photo, small]);
  const bytes = await sharp({ create: { width: 4, height: 4, channels: 3, background: 'red' } }).png().toBuffer();
  await writeFile(join(fixture.input, 'a.png'), bytes);
  await writeFile(join(fixture.input, 'b.png'), bytes);
  await writeFile(join(fixture.root, 'outside.png'), bytes);
  await symlink(join(fixture.root, 'outside.png'), join(fixture.input, 'outside.png'));
  for (const [entries, error] of [
    [{ portrait: 'a.png' }, /missing.*small/i],
    [{ portrait: 'a.png', small: 'b.png', extra: 'outside.png' }, /unknown.*extra/i],
    [{ portrait: 'a.png', small: './a.png' }, /duplicate.*original/i],
    ['{"portrait":"a.png","portrait":"b.png","small":"a.png"}', /duplicate.*portrait/i],
    [{ portrait: 'a.png', small: '../outside.png' }, /relative.*small|small.*relative/i],
    [{ portrait: 'a.png', small: 'outside.png' }, /outside.*input/i],
    [{ portrait: 'a.png', small: 'absent.png' }, /original.*small|small.*original/i]
  ]) {
    const result = await fixture.run(entries);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, error);
    await assert.rejects(readdir(fixture.output), { code: 'ENOENT' });
  }

  const defaultManifest = await fixture.run({}, { defaultManifest: true });
  assert.notEqual(defaultManifest.status, 0);
  assert.match(defaultManifest.stderr, /missing.*42823041980/i);
});

test('requires a public HTTP base URL and a new output directory', async t => {
  const fixture = await setup(t);
  await sharp({ create: { width: 4, height: 4, channels: 3, background: 'red' } }).png().toFile(join(fixture.input, 'a.png'));
  const entries = { portrait: 'a.png' };
  for (const baseUrl of ['assets', 'file:///assets', 'https://user:secret@example.com/assets', 'https://example.com/assets?token=secret', 'https://example.com/assets#fragment']) {
    const result = await fixture.run(entries, { baseUrl });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /base-url/i);
    await assert.rejects(readdir(fixture.output), { code: 'ENOENT' });
  }
  await mkdir(fixture.output);
  await writeFile(join(fixture.output, 'media.json'), 'existing published manifest');
  const result = await fixture.run(entries);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /output.*exists/i);
  assert.deepEqual(await readdir(fixture.output), ['media.json']);
  assert.equal(await readFile(join(fixture.output, 'media.json'), 'utf8'), 'existing published manifest');
});
