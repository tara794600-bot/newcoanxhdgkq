import { SITE_BASE_URL } from '../shared/site.js'
import { SEO_META_BY_ROUTE } from '../shared/page-meta.js'

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export const buildPublicPageHtml = (template, markup, route) => {
  if (route !== 'home' && route !== 'lawyers') throw new Error('Unsupported public page')
  if (!template.includes('<div id="root"></div>')) throw new Error('Expected an empty app shell')

  const meta = SEO_META_BY_ROUTE[route]
  const canonical = `${SITE_BASE_URL}${meta.path}`
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(meta.title)}</title>`)

  const setMeta = (attribute, key, value) => {
    const tag = `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`
    const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`, 'i')
    html = pattern.test(html)
      ? html.replace(pattern, () => tag)
      : html.replace('</head>', () => `${tag}\n</head>`)
  }

  setMeta('name', 'description', meta.description)
  setMeta('name', 'keywords', meta.keywords)
  setMeta('property', 'og:title', meta.title)
  setMeta('property', 'og:description', meta.description)
  setMeta('property', 'og:url', canonical)
  setMeta('name', 'twitter:title', meta.title)
  setMeta('name', 'twitter:description', meta.description)
  setMeta('name', 'twitter:image', `${SITE_BASE_URL}/logo.png`)
  html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i,
    () => `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': route === 'lawyers' ? 'AboutPage' : 'WebPage',
    name: meta.title,
    description: meta.description,
    url: canonical,
    inLanguage: 'ko-KR',
    isPartOf: { '@id': `${SITE_BASE_URL}/#website` },
    about: { '@id': `${SITE_BASE_URL}/#legalservice` },
  }
  html = html.replace('</head>', () =>
    `<script id="public-page-structured-data" type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>\n</head>`)
  return html.replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`)
}
