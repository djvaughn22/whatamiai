// Turns messy pasted text into a clean list of likely prompts.
// Accepts: one prompt per line, numbered lists, bulleted lists,
// blank-line-separated blocks, and "You:"-style exports.
// The user can remove or exclude anything afterward, so this only has to be
// reasonable, not perfect.

const BULLET = /^\s*(?:[-*•‣▪]|\d{1,3}[.)]|\(\d{1,3}\)|>)\s+/;
const SPEAKER = /^\s*(?:you|me|user|prompt|q(?:uestion)?)\s*[:.\-–—]\s*/i;

function cleanLine(line: string): string {
  return line.replace(BULLET, "").replace(SPEAKER, "").trim();
}

export function parsePrompts(raw: string): string[] {
  const text = raw.replace(/\r\n?/g, "\n");
  const blocks = text.split(/\n\s*\n+/);
  const out: string[] = [];

  for (const block of blocks) {
    const rawLines = block.split("\n").filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) continue;

    const bulleted = rawLines.filter((l) => BULLET.test(l) || SPEAKER.test(l)).length;
    const lines = rawLines.map(cleanLine).filter((l) => l.length > 0);

    // A block splits into per-line prompts when it was clearly a list, or
    // when each line stands on its own (3+ words). Otherwise the block is
    // one multi-line prompt.
    const independent =
      bulleted >= Math.max(1, Math.floor(rawLines.length / 2)) ||
      lines.every((l) => l.split(/\s+/).length >= 3);

    if (lines.length > 1 && independent) out.push(...lines);
    else out.push(lines.join(" "));
  }

  // Trim, drop tiny fragments, dedupe case-insensitively.
  const seen = new Set<string>();
  const prompts: string[] = [];
  for (const p of out) {
    const t = p.trim();
    if (t.length < 4) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    prompts.push(t);
  }
  return prompts;
}
