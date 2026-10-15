import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { matchesCompanySearch, normalizeCompanyContent } from '../shared/company-content.js'
import { SITE_BASE_URL } from '../shared/site.js'
import { buildCompaniesPageHtml, buildCompanyCasePageHtml, buildNotFoundPageHtml } from '../api/company-page.js'
import { renderSitemap } from '../api/sitemap.js'

const html = await readFile(new URL('../dist/app-shell.html', import.meta.url), 'utf8')
const original = Object.freeze({
  id: 'shared-post', name: '샘플 업체', service: '투자사기',
  description: '원문 첫 줄입니다.\n두 번째 줄의 사실관계를 그대로 보존합니다.',
  image: '/logo.png', isPublic: true, isSearchBlocked: false,
})
const readBootstrap = (page) => JSON.parse(page.match(/window\.__COMPANY_PAGE_DATA__=([\s\S]*?)<\/script>/)[1])
const readArticle = (page) => JSON.parse(page.match(/id="route-structured-data"[^>]*>([\s\S]*?)<\/script>/)[1])['@graph'][0]

assert.deepEqual(normalizeCompanyContent(original), original)
assert.ok(matchesCompanySearch(original, original.name))
assert.ok(matchesCompanySearch(original, '두 번째 줄'))
assert.ok(matchesCompanySearch(original, '투자사기'))
assert.equal(matchesCompanySearch(original, '없는 검색어'), false)

const detail = buildCompanyCasePageHtml(html, original)
assert.ok(detail.includes(`<title>${original.name} | 사기업체 게시판 | 법무법인 나란</title>`))
assert.ok(detail.includes(`<h1>${original.name}</h1>`))
assert.ok(detail.includes(`rel="canonical" href="${SITE_BASE_URL}/companies/shared-post"`))
assert.ok(detail.includes(`property="og:title" content="${original.name} | 사기업체 게시판 | 법무법인 나란"`))
assert.ok(detail.includes(`name="twitter:title" content="${original.name} | 사기업체 게시판 | 법무법인 나란"`))
assert.equal(readBootstrap(detail).item.description, original.description)
assert.equal(readBootstrap(detail).item.name, original.name)
assert.equal(readArticle(detail).headline, original.name)
assert.equal(readArticle(detail).description, original.description.replace(/\s+/g, ' '))

const list = buildCompaniesPageHtml(html, { items: [original], page: 1, searchQuery: '', totalCount: 1, totalPages: 1 })
assert.equal(readBootstrap(list).items[0].name, original.name)
assert.equal(readBootstrap(list).items[0].description, original.description)
assert.ok(list.includes(`<p class="company-card-name">${original.name}</p>`))
assert.ok(buildNotFoundPageHtml(html, '/companies/missing').includes(`${SITE_BASE_URL}/companies/missing`))
assert.ok(renderSitemap([]).includes(`<loc>${SITE_BASE_URL}/companies</loc>`))

const phone = buildCompanyCasePageHtml(html, { ...original, isPublic: false })
assert.ok(phone.includes('href="tel:15517203"'))
assert.equal(readBootstrap(phone).item.name, original.name)
const blocked = buildCompaniesPageHtml(html, { items: [{ ...original, isSearchBlocked: true }], page: 1, searchQuery: '', totalCount: 0, totalPages: 1 })
assert.equal(readBootstrap(blocked).items.length, 0)

const edited = { ...original, name: '수정된 업체', description: '수정된 원문' }
const editedData = readBootstrap(buildCompanyCasePageHtml(html, edited)).item
assert.equal(editedData.name, edited.name)
assert.equal(editedData.description, edited.description)

const unsafe = buildCompanyCasePageHtml(html, { ...original, name: '<img src=x onerror=alert(1)>', description: '</script><script>alert(1)</script>' })
assert.ok(!unsafe.includes('<img src=x'))
assert.ok(!unsafe.includes('</script><script>alert(1)</script>'))
assert.ok(unsafe.includes('&lt;img'))

const symbols = { ...original, name: '$& 업체', description: "원문 $& $' $` 문자를 그대로 보존" }
const symbolPage = buildCompanyCasePageHtml(html, symbols)
assert.equal(readBootstrap(symbolPage).item.description, symbols.description)
assert.ok(symbolPage.includes('<h1>$&amp; 업체'))
assert.equal((symbolPage.match(/<title>/g) ?? []).length, 1)
assert.equal(original.name, '샘플 업체')
console.log('Single-site content verified: original titles/body, metadata, search, visibility and escaping.')
