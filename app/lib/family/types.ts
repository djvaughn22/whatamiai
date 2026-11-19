// The family-history data model. Everything a person adds is one of these
// records, kept per workspace in IndexedDB (see store.ts), never one big blob.
//
// The rule the whole model serves: a fact is only as strong as the evidence
// attached to it. Facts hold what was claimed; Citations say which Source
// supports it and what kind of evidence that source gives. The evidence level
// shown on screen is DERIVED from citations (evidence.ts). Nothing stores a
// made-up confidence number.

export type Id = string;

/** The six labels a person sees next to every fact and relationship. */
export type EvidenceLevel = "verified" | "supported" | "recollection" | "possible" | "conflicting" | "unknown";

/** What kind of evidence one citation gives. */
export type InfoKind =
  | "primary" // a record made at the time by someone who was there
  | "secondary" // a later or second-hand record: census age, obituary, index, published family history
  | "recollection"; // what a family member remembers or was told

/** Is this record really about this person? */
export type MatchStatus = "confirmed" | "possible";

export type DateKind = "exact" | "about" | "before" | "after" | "between" | "unknown";

/** A date as genealogy needs it: often partial, often approximate. */
export interface FuzzyDate {
  kind: DateKind;
  y?: number;
  m?: number; // 1-12
  d?: number;
  /** end of a "between" range */
  y2?: number;
  m2?: number;
  d2?: number;
  /** exactly what was typed or imported */
  text: string;
}

export type FactType =
  | "name"
  | "birth"
  | "baptism"
  | "death"
  | "burial"
  | "marriage"
  | "divorce"
  | "residence"
  | "immigration"
  | "emigration"
  | "naturalization"
  | "military"
  | "occupation"
  | "education"
  | "religion"
  | "memory"
  | "other";

export interface Fact {
  id: Id;
  /** set for facts about one person */
  personId?: Id;
  /** set for facts about a couple (marriage, divorce, how they met) */
  relationshipId?: Id;
  type: FactType;
  /** names: the parts */
  given?: string;
  surname?: string;
  nickname?: string;
  /** occupation, branch of service, description, the words of a family memory */
  value?: string;
  date?: FuzzyDate;
  /** the place as written in the record, historical names kept */
  place?: string;
  note?: string;
  /** chosen when records disagree (see conflicts in evidence.ts) */
  preferred?: boolean;
  /** kept for the record, hidden from stories and timelines */
  rejected?: { reason: string; at: string };
  createdAt: string;
  updatedAt: string;
}

export type SourceKind =
  | "record" // certificate, census page, register entry, draft card
  | "newspaper"
  | "book"
  | "website"
  | "interview" // a conversation with a relative
  | "document" // a letter, bible page, discharge paper at home
  | "photo"
  | "tree" // someone else's online tree: a clue, never proof
  | "ai"; // an AI chat suggestion: a clue, never proof

export interface Source {
  id: Id;
  title: string;
  kind: SourceKind;
  /** who holds it: "National Archives", "Library of Congress", "Grandma's shoebox" */
  repository?: string;
  url?: string;
  /** the holder's own identifier: ARK, LCCN + date + page, certificate number */
  recordId?: string;
  /** a full citation, if the person wrote one */
  citation?: string;
  /** the date of the source itself, as written */
  date?: string;
  /** ISO date the person looked at it */
  accessed?: string;
  /** where it came from inside the app, e.g. "loc" for a Library of Congress search */
  provider?: string;
  note?: string;
  /** part of the made-up example family */
  example?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  id: Id;
  sourceId: Id;
  /** evidence for one fact */
  factId?: Id;
  /** evidence for a relationship itself (a birth record naming both parents) */
  relationshipId?: Id;
  /** a record that mentions a person but isn't tied to a fact yet */
  personId?: Id;
  info: InfoKind;
  match: MatchStatus;
  /** page, line, entry number */
  detail?: string;
  /** the person's own transcription or a short permitted excerpt */
  excerpt?: string;
  note?: string;
  createdAt: string;
}

export type Sex = "female" | "male" | "unknown";

export interface Person {
  id: Id;
  sex?: Sex;
  /** explicit answer; when missing, living.ts presumes */
  living?: "yes" | "no";
  /** the person using the app */
  isSelf?: boolean;
  /** free notes about this person */
  notes?: string;
  /** set after a merge: this record now lives on as another person */
  mergedInto?: Id;
  createdAt: string;
  updatedAt: string;
}

export type RelType = "parent" | "partner";
export type ParentKind = "biological" | "adopted" | "step" | "foster" | "guardian" | "unknown";
export type PartnerStatus = "married" | "partners" | "divorced" | "unknown";

export interface Relationship {
  id: Id;
  type: RelType;
  /** parent (type "parent") or first partner */
  a: Id;
  /** child (type "parent") or second partner */
  b: Id;
  kind?: ParentKind;
  status?: PartnerStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** Access labels for a place to look. Honest about cost and sign-in. */
export type Access = "free" | "free-account" | "subscription" | "request" | "in-person";

export type LeadStatus = "todo" | "nothing" | "found" | "skip";

/** The person's progress on one suggested place to look. The suggestion
 *  itself is recomputed from the facts each time (research.ts). */
export interface LeadState {
  id: Id;
  personId: Id;
  key: string;
  status: LeadStatus;
  note?: string;
  updatedAt: string;
}

/** An idea to check. Never shown as a fact. */
export interface Hypothesis {
  id: Id;
  personId?: Id;
  text: string;
  origin: "you" | "ai" | "research";
  basis?: string;
  status: "open" | "confirmed" | "disproved";
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: Id;
  name: string;
  type: string;
  size: number;
  personIds: Id[];
  sourceId?: Id;
  caption?: string;
  createdAt: string;
}

export type StoryTemplate = "life" | "how-met" | "journey" | "generations" | "military" | "surname" | "two-lines";

export interface Story {
  id: Id;
  template: StoryTemplate;
  title: string;
  personIds: Id[];
  /** "generations": the place to follow, e.g. "Missouri" */
  place?: string;
  /** "surname": the name to follow */
  surname?: string;
  /** the person's own words, shown as theirs */
  intro?: string;
  /** include possible matches and unsourced details, clearly marked */
  includeUnconfirmed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EntityName =
  | "people"
  | "facts"
  | "relationships"
  | "sources"
  | "citations"
  | "leads"
  | "hypotheses"
  | "media"
  | "stories";

export interface Change {
  id: Id;
  at: string;
  action: "add" | "edit" | "remove" | "merge" | "resolve" | "import";
  entity: EntityName | "workspace";
  entityId: Id;
  summary: string;
}

export interface Workspace {
  id: Id;
  name: string;
  kind: "mine" | "example";
  focusPersonId?: Id;
  schema: 1;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyData {
  workspace: Workspace;
  people: Record<Id, Person>;
  facts: Record<Id, Fact>;
  relationships: Record<Id, Relationship>;
  sources: Record<Id, Source>;
  citations: Record<Id, Citation>;
  leads: Record<Id, LeadState>;
  hypotheses: Record<Id, Hypothesis>;
  media: Record<Id, Media>;
  stories: Record<Id, Story>;
  changes: Change[];
}

export const ENTITY_NAMES: EntityName[] = [
  "people",
  "facts",
  "relationships",
  "sources",
  "citations",
  "leads",
  "hypotheses",
  "media",
  "stories",
];

/** A set of writes produced by one action, applied to memory and IndexedDB together. */
export interface Patch {
  put: Partial<Record<EntityName, Record<Id, unknown>>>;
  del: Partial<Record<EntityName, Id[]>>;
  changes: Change[];
  workspace?: Workspace;
}

export function emptyData(workspace: Workspace): FamilyData {
  return {
    workspace,
    people: {},
    facts: {},
    relationships: {},
    sources: {},
    citations: {},
    leads: {},
    hypotheses: {},
    media: {},
    stories: {},
    changes: [],
  };
}
