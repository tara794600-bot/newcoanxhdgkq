import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const dist = path.resolve('dist')
const manifest = JSON.parse(await readFile(path.join(dist, '.vite/manifest.json'), 'utf8'))
const eagerChunks = new Set()
const visit = (key) => {
  if (eagerChunks.has(key)) return
  assert.ok(manifest[key], `Missing manifest entry: ${key}`)
  eagerChunks.add(key)
  for (const dependency of manifest[key].imports ?? []) visit(dependency)
}
visit('index.html')

const scripts = new Set([...eagerChunks].map((key) => manifest[key].file))
const styles = new Set([...eagerChunks].flatMap((key) => manifest[key].css ?? []))
for (const key of ['src/firebase.ts', 'src/firebase-storage.ts', 'src/admin-styles.ts']) {
  assert.ok(manifest[key]?.isDynamicEntry, `${key} must load on demand`)
  assert.ok(!eagerChunks.has(key), `${key} is blocking the initial page`)
  for (const css of manifest[key].css ?? []) assert.ok(!styles.has(css), `${css} loads eagerly`)
}

const size = async (files) => {
  const buffers = await Promise.all([...files].map((file) => readFile(path.join(dist, file))))
  return {
    bytes: buffers.reduce((total, buffer) => total + buffer.length, 0),
    gzip: buffers.reduce((total, buffer) => total + gzipSync(buffer).length, 0),
  }
}
const js = await size(scripts)
const css = await size(styles)
// Includes all static dependencies, so moving code into another eager chunk
// cannot make these budgets pass without actually reducing initial downloads.
assert.ok(js.bytes < 350_000, `Initial JavaScript exceeds 350 kB: ${js.bytes}`)
assert.ok(css.bytes < 48_000, `Initial CSS exceeds 48 kB: ${css.bytes}`)
for (const file of styles) {
  assert.doesNotMatch(await readFile(path.join(dist, file), 'utf8'), /@import\s/i)
}
for (const file of ['index.html', 'lawyers.html', 'app-shell.html']) {
  const html = await readFile(path.join(dist, file), 'utf8')
  assert.match(html, /pretendardvariable-dynamic-subset/)
  assert.match(html, /media="print" onload="this.media='all'"/)
  assert.match(html, /<noscript><link rel="stylesheet"/)
  for (const key of ['src/firebase.ts', 'src/firebase-storage.ts', 'src/admin-styles.ts']) {
    for (const asset of [manifest[key].file, ...(manifest[key].css ?? [])]) {
      assert.ok(!html.includes(`/${asset}`), `${file} preloads an optional asset: ${asset}`)
    }
  }
}
console.log(`Initial JS: ${(js.bytes / 1000).toFixed(2)} kB (${(js.gzip / 1000).toFixed(2)} kB gzip).`)
console.log(`Initial CSS: ${(css.bytes / 1000).toFixed(2)} kB (${(css.gzip / 1000).toFixed(2)} kB gzip).`)
console.log('Verified: optional Firebase/admin assets, size budgets and nonblocking subset fonts.')
