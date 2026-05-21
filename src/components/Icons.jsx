// SVG-иконка скважинного насоса (pumpjack)
export const WELLPAD_SVG = `<svg viewBox="0 0 100 100" width="26" height="26" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.25))">
  <g fill="currentColor">
    <rect x="4" y="89" width="92" height="5" rx="1.5"/>
    <path d="M34 89 L49 26 L64 89" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="49" y1="26" x2="79" y2="43" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <circle cx="49" cy="26" r="6"/>
    <path d="M10 13 Q10 4 24 4 L40 4 Q55 4 55 13 L55 27 Q55 36 40 36 L24 36 Q10 36 10 27 Z"/>
    <rect x="72" y="66" width="16" height="23" rx="2"/>
  </g>
</svg>`

// Мини-версия для списков
export const WELLPAD_SVG_SMALL = `<svg viewBox="0 0 100 100" width="14" height="14" style="display:block;vertical-align:middle">
  <g fill="currentColor">
    <rect x="4" y="89" width="92" height="5" rx="1.5"/>
    <path d="M34 89 L49 26 L64 89" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="49" y1="26" x2="79" y2="43" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    <circle cx="49" cy="26" r="6"/>
    <path d="M10 13 Q10 4 24 4 L40 4 Q55 4 55 13 L55 27 Q55 36 40 36 L24 36 Q10 36 10 27 Z"/>
    <rect x="72" y="66" width="16" height="23" rx="2"/>
  </g>
</svg>`

export const TYPE_EMOJI = {
  upsv: '⚙️',
  kns: '💧',
  cps: '🏭',
  node: '🔵'
}

export function getTypeIconHtml(type, small = false) {
  if (type === 'wellpad') return small ? WELLPAD_SVG_SMALL : WELLPAD_SVG
  return `<span style="font-size:${small ? '0.85em' : '1.4em'};line-height:1">${TYPE_EMOJI[type] || '📍'}</span>`
}
