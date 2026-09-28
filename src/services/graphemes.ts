export function splitGraphemes(value: string) {
  const Segmenter = Intl.Segmenter
  return Segmenter ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(value), part => part.segment) : Array.from(value)
}
export const countGraphemes = (value: string) => splitGraphemes(value).length
export const truncateGraphemes = (value: string, maximum: number) => splitGraphemes(value).slice(0, maximum).join('')
