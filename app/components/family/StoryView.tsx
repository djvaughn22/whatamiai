"use client";

import { buildStory, storyText, type StoryDoc } from "../../lib/family/stories";
import type { FamilyData, Story } from "../../lib/family/types";

export function StoryBody({ doc, headingLevel = 2 }: { doc: StoryDoc; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="w-story">
      {doc.paras.length ? (
        doc.paras.map((p, i) => (
          <p key={i} className={p.kind ? `w-story-${p.kind}` : undefined}>
            {p.kind === "context" ? <span className="w-tag" style={{ marginRight: 6 }}>Context</span> : null}
            {p.segs.map((s, j) =>
              "t" in s ? (
                <span key={j}>{s.t}</span>
              ) : (
                <sup key={j}>
                  {s.n.map((n, k) => (
                    <a key={n} href={`#note-${n}`} className="w-link" style={{ textDecoration: "none" }} aria-label={`Source ${n}`}>
                      {k ? "," : ""}
                      {n}
                    </a>
                  ))}
                </sup>
              ),
            )}
          </p>
        ))
      ) : (
        <p className="w-muted">Nothing to tell yet. Add facts with sources, or include unconfirmed details.</p>
      )}
      {doc.hiddenLiving ? (
        <p className="w-small w-muted" style={{ fontFamily: "var(--w-sans)" }}>
          {doc.hiddenLiving} living {doc.hiddenLiving === 1 ? "person is" : "people are"} left out to protect their privacy.
        </p>
      ) : null}
      {doc.gaps.length ? (
        <section style={{ fontFamily: "var(--w-sans)" }}>
          <H className="w-h3">Still unknown</H>
          <ul className="w-small w-muted" style={{ paddingLeft: 18 }}>
            {doc.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {doc.notes.length ? (
        <section style={{ fontFamily: "var(--w-sans)" }}>
          <H className="w-h3">Sources</H>
          <ol className="w-notes">
            {doc.notes.map((n) => (
              <li key={n.n} id={`note-${n.n}`}>
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="w-link">
                    {n.title}
                  </a>
                ) : (
                  n.title
                )}
                {n.detail ? `. ${n.detail}` : ""}. <em>{n.label}.</em>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}

export function useStoryDoc(data: FamilyData | null, story: Story | undefined): StoryDoc | null {
  if (!data || !story) return null;
  return buildStory(data, story);
}

export { storyText };
