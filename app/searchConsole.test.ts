import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Search Console verifies https://whatamiai.com/ by this meta tag on the home page
// (app/(tools)/layout.tsx). Removing it un-verifies the property.
describe("Search Console verification", () => {
  it("the tools layout carries the verification tag", () => {
    expect(readFileSync("app/(tools)/layout.tsx", "utf8")).toContain('verification: { google: "1pnVxOdITarX-R5uy7dZe_74terIhc6I2xLehz2t_GA" }');
  });
  it("the family layout still loads no analytics or other scripts", () => {
    const family = readFileSync("app/(family)/layout.tsx", "utf8");
    expect(family).not.toMatch(/googletagmanager|gtag|<Script|next\/script/);
  });
});
