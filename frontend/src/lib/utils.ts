export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function matchesQuery(values: (string | string[] | undefined)[], query: string) {
  const normalized = query.trim().toLowerCase()
  return !normalized || values.flatMap((value) => Array.isArray(value) ? value : [value ?? '']).join(' ').toLowerCase().includes(normalized)
}
