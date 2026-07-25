// The shared mode registry — one canonical description of every mode.
// Homepage names, tab titles, saved labels, and storage keys all trace
// back here so naming can't drift between surfaces.

import type { Mode } from "./types";
import { MODE_LABEL } from "./types";

export type ModeDef = {
  id: Mode;
  route: string;
  /** canonical public label — same everywhere: homepage, tabs, saves, exports */
  label: string;
  /** browser-tab title (label unless a shorter form is needed) */
  tabTitle: string;
  description: string;
  createsReflection: boolean;
  draftSupport: boolean;
  saveExport: boolean;
  storageKeys: string[];
};

export const MODE_DEFS: ModeDef[] = [
  {
    id: "mirror",
    route: "/mirror",
    label: MODE_LABEL.mirror,
    tabTitle: MODE_LABEL.mirror,
    description: "Paste your own AI prompts and examine the repeated topics, goals, and habits in them.",
    createsReflection: true,
    draftSupport: true,
    saveExport: true,
    storageKeys: ["wai3-mirror-session (sessionStorage)"],
  },
  {
    id: "situation",
    route: "/situation",
    label: MODE_LABEL.situation,
    tabTitle: MODE_LABEL.situation,
    description: "One decision, conflict, or stuck place, thought through in about eight taps.",
    createsReflection: true,
    draftSupport: true,
    saveExport: true,
    storageKeys: ["wai3-situation-draft"],
  },
  {
    id: "patterns",
    route: "/patterns",
    label: MODE_LABEL.patterns,
    tabTitle: MODE_LABEL.patterns,
    description: "A broader look at how you responded across ten areas in this session.",
    createsReflection: true,
    draftSupport: true,
    saveExport: true,
    storageKeys: ["wai3-patterns-draft"],
  },
  {
    id: "money",
    route: "/money",
    label: MODE_LABEL.money,
    tabTitle: MODE_LABEL.money,
    description: "Three numbers and three taps — your real margin, separated from any interpretation of it.",
    createsReflection: true,
    draftSupport: true,
    saveExport: true,
    storageKeys: ["wai-money-draft-v1"],
  },
  {
    id: "habits",
    route: "/habits",
    label: MODE_LABEL.habits,
    tabTitle: MODE_LABEL.habits,
    description: "The quick, streak-oriented habit starter: three taps build a week sized to where you are.",
    createsReflection: true,
    draftSupport: false,
    saveExport: true,
    storageKeys: ["wai-habit-streak-v1"],
  },
  {
    id: "react",
    route: "/react",
    label: MODE_LABEL.react,
    tabTitle: MODE_LABEL.react,
    description: "Scenario cards — tap your honest first move, notice your reaction lean over time.",
    createsReflection: true,
    draftSupport: false,
    saveExport: true,
    storageKeys: ["wai-react-v1"],
  },
  {
    id: "phone",
    route: "/phone",
    label: MODE_LABEL.phone,
    tabTitle: MODE_LABEL.phone,
    description: "The deeper intentional phone-use experiment: pick one use to reduce, run seven small days.",
    createsReflection: true,
    draftSupport: false,
    saveExport: true,
    storageKeys: ["wai-phone-plan-v1"],
  },
  {
    id: "combined",
    route: "/saved",
    label: MODE_LABEL.combined,
    tabTitle: "Saved Reflections",
    description: "Careful comparisons across saved reflections from different modes.",
    createsReflection: true,
    draftSupport: false,
    saveExport: true,
    storageKeys: ["wai3-saved-v1"],
  },
];

export function modeDef(id: Mode): ModeDef {
  return MODE_DEFS.find((m) => m.id === id) ?? MODE_DEFS[MODE_DEFS.length - 1];
}
