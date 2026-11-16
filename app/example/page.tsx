"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFamily } from "../components/FamilyProvider";

export default function ExamplePage() {
  const fam = useFamily();
  const router = useRouter();
  useEffect(() => {
    if (fam.status === "loading") return;
    fam.openExample().then(() => router.replace("/family"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fam.status]);
  return (
    <main className="w-page" aria-busy="true">
      <p className="w-muted">Opening the example family. Everyone in it is made up.</p>
    </main>
  );
}
