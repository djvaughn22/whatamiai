// One list of WhatAmIAI's pages for both menus. The site has two experiences
// with their own root layouts: the reflection tools (app/(tools)) and family
// history (app/(family)). Each menu lists the other, so either is one tap away.

import type { OmNavGroup, OmNavLink } from "../OpenMirrorNav";

export const TOOL_LINKS: OmNavLink[] = [
  { emoji: "🧭", name: "My Situation", href: "/situation" },
  { emoji: "⚡", name: "How Do I React?", href: "/react" },
  { emoji: "🔁", name: "My Overall Patterns", href: "/patterns" },
  { emoji: "🪞", name: "My AI Mirror", href: "/mirror" },
  { emoji: "💵", name: "Money Check", href: "/money" },
  { emoji: "🏃", name: "7-Day Habit Starter", href: "/habits" },
  { emoji: "📵", name: "Intentional Phone Use", href: "/phone" },
  { emoji: "💾", name: "Saved Reflections", href: "/saved" },
  { emoji: "ℹ️", name: "About WhatAmIAI", href: "/about" },
];

/** The two family history products. */
export const FAMILY_PRODUCTS: OmNavLink[] = [
  { emoji: "🔎", name: "Discover", href: "/discover", note: "Find where someone's records are kept" },
  { emoji: "🌳", name: "My Family", href: "/family", note: "Your family tree, with the evidence showing" },
];

export const FAMILY_LINKS: OmNavLink[] = [
  ...FAMILY_PRODUCTS,
  { emoji: "🗣️", name: "Ask a relative", href: "/ask", note: "Questions that bring out the stories" },
  { emoji: "🗓️", name: "Timeline", href: "/timeline", note: "Your family's lives in order, with history beside them" },
  { emoji: "📖", name: "Stories", href: "/stories", note: "Stories and a printable book, with sources" },
  { emoji: "💾", name: "Your data", href: "/family/data", note: "Import, export, back up, erase" },
];

export const TOOLS_MENU: OmNavGroup[] = [
  { label: "Reflection tools", links: TOOL_LINKS },
  { label: "Family history", links: FAMILY_PRODUCTS },
];

export const FAMILY_MENU: OmNavGroup[] = [
  { label: "Family history", links: FAMILY_LINKS },
  {
    label: "WhatAmIAI",
    links: [
      { emoji: "🪞", name: "Reflection tools", href: "/", note: "Short tools for a decision, money, a habit or your phone" },
      { emoji: "ℹ️", name: "About WhatAmIAI", href: "/about" },
    ],
  },
];
