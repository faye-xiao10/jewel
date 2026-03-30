const PALETTE = ['#e879f9', '#34d399', '#fb923c', '#38bdf8', '#f472b6', '#a78bfa'];

export function getSessionColor(): string {
  const today = new Date().toLocaleDateString('en-CA'); // "2026-03-30"
  const stored = localStorage.getItem('jewel_session_color');

  if (stored) {
    const { date, color } = JSON.parse(stored);
    if (date === today) return color;
  }

  // New day — advance to next color
  const lastIndex = parseInt(localStorage.getItem('jewel_session_color_last_index') ?? '-1');
  const nextIndex = (lastIndex + 1) % PALETTE.length;
  const color = PALETTE[nextIndex];

  localStorage.setItem('jewel_session_color', JSON.stringify({ date: today, color }));
  localStorage.setItem('jewel_session_color_last_index', String(nextIndex));

  return color;
}