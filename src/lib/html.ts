// Helper untuk HTML dari API/situs pihak ketiga. Kita tidak pernah me-render
// HTML mentahnya — selalu dijadikan teks biasa dulu, jadi aman dari markup
// rusak maupun XSS.

export function decodeEntities(s: string): string {
  let prev = ''
  let out = s
  // decode repeatedly to undo double/triple encoding (&amp;amp;)
  for (let i = 0; i < 5 && out !== prev; i++) {
    prev = out
    out = out
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
  }
  return out
}

// Strip ALL tags and keep readable text, preserving line/paragraph breaks.
export function htmlToText(html: string): string {
  return decodeEntities(html)
    .replace(/<\s*(br|\/p|\/h[1-6]|\/div|\/li)\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<[^>]*>/g, '')
    .replace(/ /g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
