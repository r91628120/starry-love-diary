import type { RememberedYouCard } from '../../data/types'

export interface RememberedYouMonthGroup { key: string; cards: RememberedYouCard[] }
export interface RememberedYouYearGroup { year: string; months: RememberedYouMonthGroup[] }

export function groupRememberedYouCards(cards: RememberedYouCard[]): RememberedYouYearGroup[] {
  const years = new Map<string, Map<string, RememberedYouCard[]>>()
  for (const card of cards) {
    const year = card.localDate.slice(0, 4)
    const month = card.localDate.slice(0, 7)
    const months = years.get(year) ?? new Map<string, RememberedYouCard[]>()
    months.set(month, [...(months.get(month) ?? []), card])
    years.set(year, months)
  }
  return [...years.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([year, months]) => ({
    year,
    months: [...months.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([key, groupedCards]) => ({ key, cards: groupedCards })),
  }))
}
