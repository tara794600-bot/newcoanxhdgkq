import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  buildCompaniesPageHtml,
  buildCompanyCasePageHtml,
  buildNotFoundPageHtml,
} from '../api/company-page.js'
import { renderSitemap } from '../api/sitemap.js'

const indexHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
const sampleItems = [
  {
    id: 'sample-one',
    name: '샘플 업체 1',
    service: '투자 사기 의심 사례',
    description: '첫 번째 줄\n두 번째 줄',
    image: '/logo.png',
    datePublished: '2026-08-01T01:02:03.000Z',
    dateModified: '2026-08-02T04:05:06.000Z',
  },
  {
    id: 'sample-two',
    name: '샘플 업체 2',
    service: '로맨스스캠 의심 사례',
    description: '서로 다른 상세 설명',
    image: '/logo.png',
  },
]

const listHtml = buildCompaniesPageHtml(indexHtml, {
  items: sampleItems,
  page: 2,
  searchQuery: '',
  totalCount: 5920,
  totalPages: 148,
})

assert.match(listHtml, /<title>사기업체 게시판 2페이지 \| 법무법인 나란<\/title>/)
assert.match(listHtml, /<link rel="canonical" href="https:\/\/www\.naranfintech\.com\/companies\?page=2"/)
assert.match(listHtml, /href="\/companies\/sample-one"/)
assert.match(listHtml, /href="\/companies\?page=3"/)
assert.match(listHtml, /href="\/companies\?page=20"/)
assert.match(listHtml, /window\.__COMPANY_PAGE_DATA__=/)
assert.doesNotMatch(listHtml, /<div id="root"><\/div>/)
assert.doesNotMatch(listHtml, /homepage-faq-structured-data/)

const detailHtml = buildCompanyCasePageHtml(indexHtml, sampleItems[0])

assert.match(detailHtml, /<h1>샘플 업체 1<\/h1>/)
assert.match(detailHtml, /<p class="company-detail-description">첫 번째 줄<\/p>/)
assert.match(detailHtml, /<p class="company-detail-description">두 번째 줄<\/p>/)
assert.match(detailHtml, /<link rel="canonical" href="https:\/\/www\.naranfintech\.com\/companies\/sample-one"/)
assert.match(detailHtml, /"datePublished":"2026-08-01T01:02:03.000Z"/)
assert.match(detailHtml, /"dateModified":"2026-08-02T04:05:06.000Z"/)
assert.match(detailHtml, /"kind":"detail"/)
assert.doesNotMatch(detailHtml, /homepage-faq-structured-data/)

const searchHtml = buildCompaniesPageHtml(indexHtml, {
  items: sampleItems,
  page: 1,
  searchQuery: '샘플',
  totalCount: 2,
  totalPages: 1,
})

assert.match(searchHtml, /content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/)
assert.match(searchHtml, /<link rel="canonical" href="https:\/\/www\.naranfintech\.com\/companies"/)

const notFoundHtml = buildNotFoundPageHtml(indexHtml, '/companies/missing')
assert.match(notFoundHtml, /content="noindex,follow"/)
assert.match(notFoundHtml, /페이지를 찾을 수 없습니다/)
assert.doesNotMatch(notFoundHtml, /<script\s+[^>]*type="module"/)

const sitemap = renderSitemap([
  { loc: 'https://www.naranfintech.com/companies/sample-one', lastmod: '2026-08-01' },
  { loc: 'https://www.naranfintech.com/companies/sample-two', lastmod: '2026-08-03' },
])

assert.match(sitemap, /<lastmod>2026-08-03<\/lastmod>/)
assert.doesNotMatch(sitemap, /<changefreq>|<priority>|\/rss\.xml/)

console.log('SEO rendering verification passed')
