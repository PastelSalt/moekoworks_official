// A small, safe Markdown subset → React elements (no HTML injection: React escapes every text node).
// Blocks: ## / ### headings, paragraphs, - / * lists, 1. lists, > quotes. Inline: **bold**, *italic*, `code`, [text](url).
import type { ReactNode } from "react";

const SAFE_URL = /^(https:\/\/|http:\/\/|mailto:|\/(?!\/)|#)/i;

function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*\s][^*]*)\*)|(_([^_\s][^_]*)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[2]) out.push(<strong key={k}>{inline(m[2], k)}</strong>);
    else if (m[4]) out.push(<code key={k}>{m[4]}</code>);
    else if (m[6]) {
      const href = m[7];
      if (SAFE_URL.test(href)) {
        const external = /^https?:/i.test(href);
        out.push(
          <a key={k} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {inline(m[6], k)}
          </a>,
        );
      } else out.push(m[6]);
    } else if (m[9]) out.push(<em key={k}>{inline(m[9], k)}</em>);
    else if (m[11]) out.push(<em key={k}>{inline(m[11], k)}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(lines: string[], key: string) {
  return lines.flatMap((line, i) => [...(i ? [<br key={`${key}-br${i}`} />] : []), ...inline(line.trim(), `${key}-${i}`)]);
}

export function Markdown({ source, className }: { source: string | null | undefined; className?: string }) {
  if (!source?.trim()) return null;
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  let b = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const key = `b${b++}`;
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(level <= 2 ? <h3 key={key}>{inline(heading[2], key)}</h3> : <h4 key={key}>{inline(heading[2], key)}</h4>);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        items.push(lines[i].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/, ""));
        i++;
      }
      const lis = items.map((t, j) => <li key={j}>{inline(t, `${key}-${j}`)}</li>);
      blocks.push(ordered ? <ol key={key}>{lis}</ol> : <ul key={key}>{lis}</ul>);
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={key}>{withBreaks(quote, key)}</blockquote>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*]\s+|\s*\d+[.)]\s+|\s*>)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={key}>{withBreaks(para, key)}</p>);
  }
  return <div className={className}>{blocks}</div>;
}

/** Plain text (for meta descriptions and word counts). */
export function markdownToText(source: string | null | undefined) {
  return (source ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
