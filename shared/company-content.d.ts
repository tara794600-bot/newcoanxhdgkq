export type CompanyContentSource = { name?: unknown; service?: unknown; description?: unknown }
export function matchesCompanySearch(data: CompanyContentSource, query: string): boolean
export function normalizeCompanyContent<T extends CompanyContentSource>(
  data: T,
): Omit<T, 'name' | 'description'> & { name: string; description: string }
