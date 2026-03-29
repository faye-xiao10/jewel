const PALETTE = ['#e879f9', '#34d399', '#fb923c', '#38bdf8', '#f472b6', '#a78bfa']
const INDEX_KEY = 'jewel_session_color_index'

export function getSessionColor(): string {
  if (typeof window === 'undefined') return PALETTE[0]
  const raw = parseInt(localStorage.getItem(INDEX_KEY) ?? '0', 10)
  const index = isNaN(raw) ? 0 : raw
  localStorage.setItem(INDEX_KEY, String((index + 1) % PALETTE.length))
  return PALETTE[index % PALETTE.length]
}