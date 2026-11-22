import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ASK_COUNT, ASK_SETS, ASK_TIPS } from "./askQuestions";
import sitemap from "../../sitemap";
import robots from "../../robots";
import { FAMILY_LINKS } from "../siteNav";

const all = ASK_SETS.flatMap((s) => s.questions);

describe("Ask a relative: the questions", () => {
  it("has a handful of short sets, every line a real question, none twice", () => {
    expect(ASK_SETS.length).toBeGreaterThanOrEqual(6);
    for (const s of ASK_SETS) {
      expect(s.questions.length, s.id).toBeGreaterThanOrEqual(4);
      expect(s.questions.length, s.id).toBeLessThanOrEqual(6);
    }
    for (const q of all) {
      expect(q.endsWith("?"), q).toBe(true);
      expect(q.length, q).toBeLessThanOrEqual(110);
    }
    expect(new Set(all).size).toBe(all.length);
    expect(new Set(ASK_SETS.map((s) => s.id)).size).toBe(ASK_SETS.length);
    expect(ASK_COUNT).toBe(all.length);
  });

  it("works for every family: no assumed marriage or children, one open question about faith", () => {
    for (const q of all.filter((x) => /married|wedding|children|partner/i.test(x))) expect(q.startsWith("If "), q).toBe(true);
    const faith = all.filter((q) => /faith|church|worship|pray|God\b/i.test(q));
    expect(faith).toEqual(["Was faith or a place of worship part of your life growing up? What do you remember about it?"]);
  });

  it("asks permission first and names what a told memory is in My Family", () => {
    expect(ASK_TIPS[0]).toMatch(/^Ask first/);
    const page = readFileSync("app/(family)/ask/page.tsx", "utf8");
    expect(page).toContain("Family memory");
  });
});

describe("Ask a relative: the page", () => {
  const page = readFileSync("app/(family)/ask/page.tsx", "utf8");

  it("is public and findable: sitemap, not blocked by robots, in the family menu", () => {
    expect(sitemap().map((e) => e.url)).toContain("https://whatamiai.com/ask");
    expect(JSON.stringify(robots().rules)).not.toContain('"/ask"');
    expect(FAMILY_LINKS.map((l) => l.href)).toContain("/ask");
  });

  it("collects nothing: no form, storage, fetch or analytics", () => {
    expect(page).not.toMatch(/<form|localStorage|fetch\(|gtag|<Script|useFamily/);
  });

  it("prints with room to write each answer", () => {
    const css = readFileSync("app/wai.css", "utf8");
    expect(css).toMatch(/\.w-ask-q::after \{[^}]*border-bottom/);
    expect(page).toContain('className="w-ask-q"');
  });
});

describe("home: family history on the first screen", () => {
  const home = readFileSync("app/(tools)/page.tsx", "utf8");

  it("shows the family history band right after the hero, before the tool groups", () => {
    const band = home.indexOf("<FamilyBand pal={pal} />");
    expect(band).toBeGreaterThan(home.indexOf("About a minute. No sign-up."));
    expect(band).toBeLessThan(home.indexOf("{GROUPS.map("));
    for (const href of ['href="/discover"', 'href="/family"', 'href="/ask"']) expect(home).toContain(href);
  });

  it("keeps every reflection tool on home", () => {
    for (const href of ["/situation", "/react", "/patterns", "/mirror", "/money", "/habits", "/phone"]) expect(home).toContain(`href: "${href}"`);
  });
});
