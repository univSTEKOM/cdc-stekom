import type { ReactNode } from 'react'

// Pengumuman rekrutmen ditulis untuk WhatsApp: *tebal*, "* " sebagai bullet,
// URL polos. Diubah jadi elemen React (bukan dangerouslySetInnerHTML), jadi
// teks dari situs lain tidak pernah dirender sebagai markup.

const TOKEN = /(https?:\/\/[^\s]+|\*[^*\s][^*\n]*?\*)/g

function renderLine(line: string, key: number): ReactNode {
  // "* Sales Area" adalah bullet, bukan pembuka teks tebal.
  const text = line.replace(/^\s*\*\s+/, '• ')
  const parts = text.split(TOKEN).filter(Boolean)
  return (
    <span key={key}>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          const url = part.replace(/[).,]+$/, '')
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="break-all font-medium text-cta underline-offset-2 hover:underline"
            >
              {url}
            </a>
          )
        }
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
          return (
            <strong key={i} className="font-semibold text-brand-text">
              {part.slice(1, -1)}
            </strong>
          )
        }
        // Sisa "*" yang tidak berpasangan cuma derau.
        return part.replace(/\*/g, '')
      })}
    </span>
  )
}

export function Announcement({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.split('\n'))
  return (
    <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-brand-muted">
      {paragraphs.map((lines, i) => (
        <p key={i}>
          {lines.map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {renderLine(line, j)}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}
