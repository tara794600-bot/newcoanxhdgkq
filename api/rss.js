import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { resolveCompanyContent } from '../shared/company-content.js'
import { SEO_META_BY_ROUTE } from '../shared/page-meta.js'
import { getRequestContentSite } from '../server/content-site.js'

export const RSS_ITEM_LIMIT = 500
const QUERY_BATCH_SIZE = 250
const DEFAULT_SITE = getRequestContentSite()

const getCompanyCollection = () => {
  let app = getApps()[0]
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    if (!raw?.trim()) throw new Error('Firebase service account is not configured')
    const serviceAccount = JSON.parse(raw)
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    }
    app = initializeApp({ credential: cert(serviceAccount) })
  }
  return getFirestore(app).collection('companyCases')
}

const toDate = (value) => {
  const date = value && typeof value.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : typeof value === 'string' && value.trim()
        ? new Date(value)
        : null
  return date && Number.isFinite(date.getTime()) ? date : null
}

const escapeXml = (value) => String(value)
  // XML 1.0 does not allow control characters or unpaired surrogates.
  .replace(/[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

export const mapRssItem = (snapshot, site = DEFAULT_SITE) => {
  const data = snapshot.data() ?? {}
  const hasText = (value) => typeof value === 'string' && Boolean(value.trim())
  const published = toDate(data.createdAt)
  // "검색차단" only hides internal listings; its external detail page is public.
  // "전화연결" replaces the body, so do not syndicate that article's old text.
  if (data.isPublic === false || !published || ![data.name, data.service, data.description].every(hasText)) {
    return null
  }
  const content = resolveCompanyContent(data, site.id)
  const modified = toDate(data.updatedAt)
  return {
    title: content.name,
    description: content.description,
    category: content.service,
    url: `${site.url}/companies/${encodeURIComponent(snapshot.id)}`,
    published,
    modified: modified && modified > published ? modified : published,
  }
}

export const getRssItems = async (site, collection = getCompanyCollection()) => {
  const items = []
  const query = collection.orderBy('createdAt', 'desc').limit(QUERY_BATCH_SIZE)
  let cursor = null

  while (items.length < RSS_ITEM_LIMIT) {
    const snapshot = await (cursor ? query.startAfter(cursor) : query).get()
    for (const doc of snapshot.docs) {
      const item = mapRssItem(doc, site)
      if (item) items.push(item)
      if (items.length === RSS_ITEM_LIMIT) break
    }
    if (snapshot.docs.length < QUERY_BATCH_SIZE) break
    cursor = snapshot.docs.at(-1)
  }
  return items
}

const renderItem = (item) => {
  // RSS descriptions may contain HTML. Escape the original text first, then
  // encode the HTML as XML text so paragraphs and literal <, >, & remain safe.
  const body = item.description.split(/\r?\n+/).filter((line) => line.trim())
    .map((line) => `<p>${escapeXml(line)}</p>`).join('\n')
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <description>${escapeXml(body)}</description>
      <category>${escapeXml(item.category)}</category>
      <pubDate>${item.published.toUTCString()}</pubDate>
    </item>`
}

export const renderRss = (items, site = DEFAULT_SITE) => {
  const latestUpdate = items.reduce(
    (latest, item) => !latest || item.modified > latest ? item.modified : latest,
    null,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SEO_META_BY_ROUTE.companies.title)}</title>
    <link>${escapeXml(site.url)}/companies</link>
    <atom:link href="${escapeXml(site.url)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SEO_META_BY_ROUTE.companies.description)}</description>
    <language>ko-KR</language>${latestUpdate ? `\n    <lastBuildDate>${latestUpdate.toUTCString()}</lastBuildDate>` : ''}
    <ttl>5</ttl>
${items.map(renderItem).join('\n')}
  </channel>
</rss>
`
}

export const createRssHandler = (loadItems = getRssItems) => async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end('Method Not Allowed')
  }
  try {
    const site = getRequestContentSite(req)
    const items = await loadItems(site)
    const rss = renderRss(items, site)
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate')
    if (req.method === 'HEAD') return res.status(200).end()
    return res.status(200).send(rss)
  } catch (error) {
    console.error('[api/rss] Feed generation failed', error)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Retry-After', '60')
    return res.status(503).end(req.method === 'HEAD' ? undefined : 'Service Unavailable')
  }
}

export default createRssHandler()
