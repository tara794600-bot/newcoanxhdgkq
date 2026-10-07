import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { createRssHandler, getRssItems, mapRssItem, renderRss, RSS_ITEM_LIMIT } from '../api/rss.js'
import { CONTENT_SITES, resolveCompanyContent } from '../shared/company-content.js'

const article = {
  name: '업체 & <샘플>', service: '투자사기',
  description: '첫 줄 & <script>내용</script>\n둘째 줄 😀 ]]>\n본문 끝',
  createdAt: '2026-10-06T01:27:04.890Z', updatedAt: '2026-10-07T02:00:00Z',
  isPublic: true, isSearchBlocked: true,
}
const doc = (id, data) => ({ id, data: () => data })
const response = () => ({
  headers: {}, statusCode: 0, body: '',
  setHeader(name, value) { this.headers[name] = value },
  status(code) { this.statusCode = code; return this },
  send(body) { this.body = body; return this },
  end(body = '') { this.body = body; return this },
})

for (const site of CONTENT_SITES) {
  const item = mapRssItem(doc('new article', article), site)
  assert.equal(item.description, resolveCompanyContent(article, site.id).description)
  assert.equal(item.url, `${site.url}/companies/new%20article`)
  const xml = renderRss([item], site)
  assert.match(xml, /<rss version="2.0"/)
  assert.match(xml, /<pubDate>Tue, 06 Oct 2026 01:27:04 GMT<\/pubDate>/)
  assert.match(xml, /<lastBuildDate>Wed, 07 Oct 2026 02:00:00 GMT<\/lastBuildDate>/)
  assert.match(xml, /업체 &amp; &lt;샘플&gt;/)
  assert.match(xml, /&lt;p&gt;첫 줄 &amp;amp; &amp;lt;script&amp;gt;/)
  assert.match(xml, /본문 끝&lt;\/p&gt;/)
  assert.ok(xml.includes('😀'))
  assert.ok(!xml.includes('<script>'))
  assert.ok(xml.includes(`<guid isPermaLink="true">${item.url}</guid>`))
  assert.ok(xml.includes(`href="${site.url}/rss.xml"`))
  if (site.id !== 'site1') assert.ok(!xml.includes(CONTENT_SITES[0].url))

  const handler = createRssHandler(async (requestedSite) => {
    assert.equal(requestedSite.id, site.id)
    return [item]
  })
  for (const method of ['GET', 'HEAD']) {
    const res = response()
    await handler({ method, headers: { host: new URL(site.url).host } }, res)
    assert.equal(res.statusCode, 200)
    assert.equal(res.headers['Content-Type'], 'application/rss+xml; charset=utf-8')
    assert.match(res.headers['Cache-Control'], /s-maxage=300/)
    assert.equal(res.body, method === 'HEAD' ? '' : xml)
  }
}

assert.equal(mapRssItem(doc('phone', { ...article, isPublic: false })), null)
assert.equal(mapRssItem(doc('missing-body', { ...article, description: '' })), null)
assert.equal(mapRssItem(doc('missing-name', { ...article, name: '' }), CONTENT_SITES[2]), null)
assert.equal(mapRssItem(doc('bad-date', { ...article, createdAt: 'not a date' })), null)
assert.equal(mapRssItem(doc('no-date', { ...article, createdAt: undefined })), null)
const timestamp = { toDate: () => new Date(article.createdAt) }
assert.equal(mapRssItem(doc('timestamp', { ...article, createdAt: timestamp })).published.toISOString(), article.createdAt)
const legacy = mapRssItem(doc('legacy', { ...article, isPublic: undefined, updatedAt: 'invalid' }))
assert.equal(legacy.modified.getTime(), legacy.published.getTime())
assert.doesNotMatch(renderRss([]), /Invalid Date|<item>|lastBuildDate/)
const controls = mapRssItem(doc('controls', { ...article, description: 'A\u0000\u000b\ud800B 😀' }))
assert.match(renderRss([controls]), /&lt;p&gt;AB 😀&lt;\/p&gt;/)

// The first batch has no publishable bodies. Continue past it to fill the feed,
// keeping the latest 500 articles in Firestore order and omitting older ones.
const documents = Array.from({ length: RSS_ITEM_LIMIT + 253 }, (_, index) => doc(`post-${index}`, {
  ...article,
  createdAt: new Date(Date.UTC(2026, 9, 7) - index * 60000),
  isPublic: index >= 250,
}))
let reads = 0
const makeQuery = (start, size) => ({
  limit(count) { return makeQuery(start, count) },
  startAfter(cursor) { return makeQuery(documents.indexOf(cursor) + 1, size) },
  async get() { reads += 1; return { docs: documents.slice(start, start + size) } },
})
const collection = {
  orderBy(field, direction) {
    assert.equal(field, 'createdAt')
    assert.equal(direction, 'desc')
    return makeQuery(0, documents.length)
  },
}
const items = await getRssItems(CONTENT_SITES[0], collection)
assert.equal(items.length, RSS_ITEM_LIMIT)
assert.equal(reads, 3)
assert.ok(items[0].url.endsWith('/post-250'))
assert.ok(items.at(-1).url.endsWith('/post-749'))
assert.ok(items.every((item, index) => !index || item.published <= items[index - 1].published))

const rejected = response()
await createRssHandler(() => assert.fail('POST must not query Firestore'))({ method: 'POST' }, rejected)
assert.equal(rejected.statusCode, 405)
assert.equal(rejected.headers.Allow, 'GET, HEAD')

const originalError = console.error
try {
  console.error = () => {}
  for (const method of ['GET', 'HEAD']) {
    const failed = response()
    await createRssHandler(async () => { throw new Error('Firestore unavailable') })({ method }, failed)
    assert.equal(failed.statusCode, 503)
    assert.equal(failed.headers['Cache-Control'], 'no-store')
    assert.equal(failed.headers['Retry-After'], '60')
    assert.equal(failed.body, method === 'HEAD' ? '' : 'Service Unavailable')
  }
} finally {
  console.error = originalError
}

const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const feedRoute = config.rewrites.findIndex((rule) => rule.source === '/rss.xml' && rule.destination === '/api/rss')
assert.ok(feedRoute >= 0 && feedRoute < config.rewrites.findIndex((rule) => rule.source === '/(.*)'))
for (const filename of ['public/rss.xml', 'dist/rss.xml']) {
  await assert.rejects(access(filename), { code: 'ENOENT' })
}
console.log('RSS verified: latest 500, full text, visibility, dates, XML escaping, 3 domains, routing, GET/HEAD/405/503.')
