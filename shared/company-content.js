const text = (value) => typeof value === 'string' ? value.trim() : ''

// Keep the saved title and body; only trim surrounding whitespace for display.
export const normalizeCompanyContent = (data) => ({
  ...data,
  name: text(data.name),
  description: text(data.description),
})

export const matchesCompanySearch = (data, query) => {
  const search = text(query).toLocaleLowerCase('ko-KR')
  if (!search) return true
  const item = normalizeCompanyContent(data)
  return [item.name, text(item.service), item.description]
    .some((value) => value.toLocaleLowerCase('ko-KR').includes(search))
}
