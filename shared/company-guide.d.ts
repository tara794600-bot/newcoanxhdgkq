export type CompanyGuideSource = { id?: unknown; name?: unknown; service?: unknown; description?: unknown }
export type CompanyGuideStep = { title: string; body: string }
export type CompanyGuideFaq = { q: string; a: string }
export type RelatedCompanyCase = { id: string; name: string; service: string }
export type CompanyGuide = {
  baseName: string
  categoryKey: string
  categoryLabel: string
  intro: string
  flowTitle: string
  flow: string[]
  signalsTitle: string
  signals: string[]
  prepareTitle: string
  prepare: string[]
  stepsTitle: string
  steps: CompanyGuideStep[]
  faqTitle: string
  faq: CompanyGuideFaq[]
  disclaimer: string
}
export function getCompanyBaseName(name: unknown): string
export function getCompanyGuide(item: CompanyGuideSource): CompanyGuide
export function getCompanyCaseSeoTitle(item: CompanyGuideSource): string
export function getCompanyCaseSeoDescription(item: CompanyGuideSource): string
export function getCompanyCaseSeoKeywords(item: CompanyGuideSource): string
export function formatKstDate(value: unknown): string
export function getCompanyFaqStructuredData(item: CompanyGuideSource, pageUrl: string): Record<string, unknown>
export function pickRelatedCompanyCases(
  newer: Array<CompanyGuideSource & { id: string; isPublic?: boolean; isSearchBlocked?: boolean }>,
  older: Array<CompanyGuideSource & { id: string; isPublic?: boolean; isSearchBlocked?: boolean }>,
  selfId: string,
  max?: number,
): RelatedCompanyCase[]
