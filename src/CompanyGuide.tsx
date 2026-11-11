import { formatKstDate, getCompanyGuide } from '../shared/company-guide.js'
import type { CompanyGuideSource, RelatedCompanyCase } from '../shared/company-guide.js'

type DatedCompany = { datePublished?: string; dateModified?: string }

const getCompanyCasePath = (id: string) => `/companies/${encodeURIComponent(id)}`

// Mirrors renderCompanyDates in api/company-page.js.
export function CompanyDates({ item }: { item: DatedCompany }) {
  const published = formatKstDate(item.datePublished)
  const modified = formatKstDate(item.dateModified)

  if (!published && !modified) {
    return null
  }

  return (
    <p className="company-detail-dates">
      {published ? (
        <>
          게시 <time dateTime={item.datePublished}>{published}</time>
        </>
      ) : null}
      {published && modified && modified !== published ? ' · ' : null}
      {modified && modified !== published ? (
        <>
          수정 <time dateTime={item.dateModified}>{modified}</time>
        </>
      ) : null}
    </p>
  )
}

// Mirrors renderCompanyGuideServerContent in api/company-page.js.
export function CompanyGuide({ item, related }: { item: CompanyGuideSource; related: RelatedCompanyCase[] }) {
  const guide = getCompanyGuide(item)

  return (
    <div className="company-guide">
      <p className="company-guide-intro">{guide.intro}</p>
      <section className="company-guide-block">
        <h2>{guide.flowTitle}</h2>
        {guide.flow.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>
      <section className="company-guide-block">
        <h2>{guide.signalsTitle}</h2>
        <ul className="company-guide-checklist">
          {guide.signals.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section className="company-guide-block">
        <h2>{guide.prepareTitle}</h2>
        <ul className="company-guide-checklist">
          {guide.prepare.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section className="company-guide-block">
        <h2>{guide.stepsTitle}</h2>
        <ol className="company-guide-steps">
          {guide.steps.map((step, index) => (
            <li key={step.title}>
              <strong>
                {index + 1}. {step.title}
              </strong>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="company-guide-block">
        <h2>{guide.faqTitle}</h2>
        {guide.faq.map((faq) => (
          <div className="company-guide-faq-item" key={faq.q}>
            <h3>{faq.q}</h3>
            <p>{faq.a}</p>
          </div>
        ))}
      </section>
      <p className="company-guide-disclaimer">{guide.disclaimer}</p>
      {related.length ? (
        <section className="company-guide-block company-related" aria-labelledby="company-related-title">
          <h2 id="company-related-title">다른 피해 사례 업체</h2>
          <ul className="company-related-list">
            {related.map((relatedItem) => (
              <li key={relatedItem.id}>
                <a href={getCompanyCasePath(relatedItem.id)}>
                  <span className="company-related-name">{relatedItem.name}</span>
                  <span className="company-related-service">{relatedItem.service}</span>
                </a>
              </li>
            ))}
          </ul>
          <a className="company-related-all" href="/companies">
            사기업체 게시판 전체 보기
          </a>
        </section>
      ) : null}
    </div>
  )
}
