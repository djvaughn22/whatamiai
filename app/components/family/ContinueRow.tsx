"use client";

import Link from "next/link";
import { useFamily } from "../FamilyProvider";
import { livePeople } from "../../lib/family/graph";

/** For a returning visitor: one plain line back to their family. */
export default function ContinueRow() {
  const { data, status } = useFamily();
  if (status === "loading" || !data) return null;
  const count = livePeople(data).length;
  if (!count) return null;
  return (
    <div className="w-well w-between w-no-print" style={{ marginBottom: 6 }}>
      <span>
        <strong>{data.workspace.name}</strong>
        <span className="w-muted"> · {count} {count === 1 ? "person" : "people"}</span>
      </span>
      <Link href="/family" className="w-btn w-btn-small">
        Continue
      </Link>
    </div>
  );
}
