"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useFamily } from "../../../components/FamilyProvider";
import { StoryBody, storyText } from "../../../components/family/StoryView";
import { Loading, TextArea, download, safeFileName } from "../../../components/family/bits";
import { buildStory, TEMPLATES } from "../../../lib/family/stories";
import { removeStory, updateStory } from "../../../lib/family/ops";

export default function StoryPage() {
  const fam = useFamily();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
  const [intro, setIntro] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  if (fam.status === "loading") return <Loading />;
  const data = fam.data;
  const story = data?.stories[id];
  if (!data || !story) {
    return (
      <main className="w-read">
        <h1 className="w-h2">Story not found</h1>
        <Link href="/stories" className="w-btn">
          All stories
        </Link>
      </main>
    );
  }
  const doc = buildStory(data, story);
  return (
    <main className="w-read">
      <p className="w-tiny w-muted w-no-print" style={{ margin: "0 0 6px" }}>
        <Link href="/stories" className="w-link">
          Stories
        </Link>{" "}
        · {TEMPLATES[story.template].label}
      </p>
      <h1 className="w-h1" style={{ fontSize: "clamp(1.9rem, 5vw, 2.7rem)", marginBottom: 18 }}>
        {story.title}
      </h1>
      <StoryBody doc={doc} />
      <div className="w-panel w-no-print w-stack" style={{ marginTop: 28 }}>
        <label className="w-row w-small">
          <input type="checkbox" checked={!!story.includeUnconfirmed} onChange={(e) => fam.commit(updateStory(data, story.id, { includeUnconfirmed: e.target.checked }))} />
          Include possible matches and unsourced details, marked in the text
        </label>
        <div className="w-row">
          <button
            type="button"
            className="w-btn w-btn-small"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(storyText(doc));
                fam.toast("Copied, with sources");
              } catch {
                fam.toast("Copy didn't work in this browser");
              }
            }}
          >
            Copy text
          </button>
          <button type="button" className="w-btn w-btn-small" onClick={() => download(`${safeFileName(story.title)}.txt`, storyText(doc))}>
            Download
          </button>
          <button type="button" className="w-btn w-btn-small" onClick={() => window.print()}>
            Print or save as PDF
          </button>
          <button type="button" className="w-btn w-btn-small" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Add your own words"}
          </button>
          <button
            type="button"
            className="w-btn w-btn-small w-btn-quiet"
            onClick={async () => {
              if (!window.confirm("Delete this story? The facts it uses stay.")) return;
              await fam.commit(removeStory(data, story.id));
              router.push("/stories");
            }}
          >
            Delete
          </button>
        </div>
        {editing ? (
          <div className="w-fields">
            <label className="w-field">
              <span className="w-label">Title</span>
              <input className="w-input" value={title ?? story.title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <TextArea label="An introduction in your own words" value={intro ?? story.intro ?? ""} onChange={setIntro} rows={4} help="Shown first, in italics, as yours. Everything after it comes from the records." />
            <div>
              <button
                type="button"
                className="w-btn w-btn-primary w-btn-small"
                onClick={async () => {
                  await fam.commit(updateStory(data, story.id, { intro: (intro ?? story.intro ?? "").trim() || undefined, title: (title ?? story.title).trim() || story.title }));
                  setEditing(false);
                  fam.toast("Saved");
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : null}
        <p className="w-tiny w-muted" style={{ margin: 0 }}>
          This story rewrites itself as your evidence changes. Living people are always left out.
        </p>
      </div>
    </main>
  );
}
