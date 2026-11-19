// Places as genealogy writes them: "Sedalia, Pettis Co., Mo.", "Calabria, Italy",
// "Kalmar län, Sweden". Two jobs:
//   1. compare two place strings (is "Sedalia, MO" the same as
//      "Sedalia, Pettis County, Missouri, USA"?) for conflict checks;
//   2. put a place on the map at the most precise level we honestly know.
//
// US towns and counties come from the US Census Bureau 2024 Gazetteer files
// (public domain), one small file per state in /public/geo/us/. Other
// countries use a short built-in list of regions and cities with approximate
// coordinates, then the country's center. The map always shows the precision.

import { normalize } from "./names";

export const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"],
  ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
  ["PR", "Puerto Rico"],
];

/** Old-style abbreviations found in records ("Mo.", "Ill.", "Penn."). */
const OLD_ABBR: Record<string, string> = {
  ala: "AL", ariz: "AZ", ark: "AR", cal: "CA", calif: "CA", colo: "CO", conn: "CT", del: "DE", fla: "FL",
  ida: "ID", ill: "IL", ind: "IN", ia: "IA", kan: "KS", kans: "KS", ky: "KY", mass: "MA", mich: "MI",
  minn: "MN", miss: "MS", mo: "MO", mont: "MT", neb: "NE", nebr: "NE", nev: "NV", okla: "OK", ore: "OR",
  penn: "PA", penna: "PA", tenn: "TN", tex: "TX", va: "VA", wva: "WV", "w va": "WV", wash: "WA", wis: "WI",
  wisc: "WI", wyo: "WY", vt: "VT",
};

const STATE_BY_KEY = new Map<string, string>();
for (const [abbr, name] of US_STATES) {
  STATE_BY_KEY.set(abbr.toLowerCase(), abbr);
  STATE_BY_KEY.set(normalize(name), abbr);
}
for (const [k, abbr] of Object.entries(OLD_ABBR)) STATE_BY_KEY.set(k, abbr);

export function stateName(abbr: string): string {
  return US_STATES.find(([a]) => a === abbr)?.[1] ?? abbr;
}

const US_WORDS = new Set(["usa", "us", "u s a", "u s", "united states", "united states of america", "america", "etats unis"]);

/** Country names as the map data spells them, with the spellings records use. */
const COUNTRY_ALIASES: Record<string, string> = {
  italia: "Italy", "kingdom of italy": "Italy", deutschland: "Germany", "german empire": "Germany", prussia: "Germany",
  england: "United Kingdom", scotland: "United Kingdom", wales: "United Kingdom", "great britain": "United Kingdom",
  uk: "United Kingdom", britain: "United Kingdom", "northern ireland": "United Kingdom", eire: "Ireland",
  "irish free state": "Ireland", sverige: "Sweden", norge: "Norway", danmark: "Denmark", polska: "Poland",
  "czech republic": "Czechia", bohemia: "Czechia", "austria hungary": "Austria", osterreich: "Austria",
  holland: "Netherlands", "the netherlands": "Netherlands", nederland: "Netherlands", mexico: "Mexico",
  espana: "Spain", "russian empire": "Russia", "ussr": "Russia", schweiz: "Switzerland", suisse: "Switzerland",
  "new zealand": "New Zealand", "south africa": "South Africa", philippines: "Philippines", canada: "Canada",
  "dominican republic": "Dominican Rep.", "bosnia and herzegovina": "Bosnia and Herz.", "north macedonia": "Macedonia",
};

export type Precision = "town" | "county" | "region" | "country";

type Region = { name: string; aliases: string[]; country: string; lat: number; lon: number };
type City = { name: string; aliases: string[]; country: string; lat: number; lon: number };

// Approximate centers (degrees). Large Canadian provinces use the settled
// south, where nearly all historical records come from.
const REGIONS: Region[] = [
  // Italy
  { name: "Abruzzo", aliases: ["abruzzi"], country: "Italy", lat: 42.23, lon: 13.85 },
  { name: "Basilicata", aliases: ["lucania"], country: "Italy", lat: 40.5, lon: 16.08 },
  { name: "Calabria", aliases: [], country: "Italy", lat: 39.06, lon: 16.52 },
  { name: "Campania", aliases: [], country: "Italy", lat: 40.91, lon: 14.92 },
  { name: "Emilia-Romagna", aliases: ["emilia romagna"], country: "Italy", lat: 44.53, lon: 11.03 },
  { name: "Friuli-Venezia Giulia", aliases: ["friuli", "friuli venezia giulia"], country: "Italy", lat: 46.07, lon: 13.13 },
  { name: "Lazio", aliases: ["latium"], country: "Italy", lat: 41.98, lon: 12.77 },
  { name: "Liguria", aliases: [], country: "Italy", lat: 44.31, lon: 8.7 },
  { name: "Lombardy", aliases: ["lombardia"], country: "Italy", lat: 45.58, lon: 9.77 },
  { name: "Marche", aliases: ["the marches"], country: "Italy", lat: 43.3, lon: 13.12 },
  { name: "Molise", aliases: [], country: "Italy", lat: 41.67, lon: 14.6 },
  { name: "Piedmont", aliases: ["piemonte"], country: "Italy", lat: 45.05, lon: 7.92 },
  { name: "Apulia", aliases: ["puglia"], country: "Italy", lat: 41.0, lon: 16.62 },
  { name: "Sardinia", aliases: ["sardegna"], country: "Italy", lat: 40.09, lon: 9.03 },
  { name: "Sicily", aliases: ["sicilia"], country: "Italy", lat: 37.6, lon: 14.02 },
  { name: "Tuscany", aliases: ["toscana"], country: "Italy", lat: 43.45, lon: 11.11 },
  { name: "Trentino-Alto Adige", aliases: ["trentino", "south tyrol", "alto adige"], country: "Italy", lat: 46.43, lon: 11.17 },
  { name: "Umbria", aliases: [], country: "Italy", lat: 42.94, lon: 12.62 },
  { name: "Aosta Valley", aliases: ["valle d'aosta", "valle d aosta"], country: "Italy", lat: 45.74, lon: 7.43 },
  { name: "Veneto", aliases: ["venetia"], country: "Italy", lat: 45.65, lon: 11.85 },
  // Germany, modern states and historical names records use
  { name: "Baden-Württemberg", aliases: ["baden wurttemberg", "baden-wurttemberg"], country: "Germany", lat: 48.54, lon: 9.04 },
  { name: "Bavaria", aliases: ["bayern"], country: "Germany", lat: 48.95, lon: 11.4 },
  { name: "Brandenburg", aliases: [], country: "Germany", lat: 52.13, lon: 13.22 },
  { name: "Hesse", aliases: ["hessen", "hesse-darmstadt", "hesse darmstadt", "hesse-kassel", "hesse kassel"], country: "Germany", lat: 50.65, lon: 9.16 },
  { name: "Mecklenburg", aliases: ["mecklenburg-vorpommern", "mecklenburg vorpommern", "mecklenburg-schwerin"], country: "Germany", lat: 53.61, lon: 12.43 },
  { name: "Lower Saxony", aliases: ["niedersachsen"], country: "Germany", lat: 52.64, lon: 9.85 },
  { name: "Hanover", aliases: ["hannover", "kingdom of hanover"], country: "Germany", lat: 52.6, lon: 9.5 },
  { name: "North Rhine-Westphalia", aliases: ["nordrhein-westfalen", "nordrhein westfalen", "north rhine westphalia"], country: "Germany", lat: 51.43, lon: 7.66 },
  { name: "Westphalia", aliases: ["westfalen"], country: "Germany", lat: 51.9, lon: 8.0 },
  { name: "Rhineland", aliases: ["rheinland", "rhine province", "rheinprovinz"], country: "Germany", lat: 50.7, lon: 7.0 },
  { name: "Rhineland-Palatinate", aliases: ["rheinland-pfalz", "rheinland pfalz", "palatinate", "pfalz"], country: "Germany", lat: 49.91, lon: 7.45 },
  { name: "Saarland", aliases: [], country: "Germany", lat: 49.4, lon: 6.95 },
  { name: "Saxony", aliases: ["sachsen", "kingdom of saxony"], country: "Germany", lat: 51.05, lon: 13.36 },
  { name: "Saxony-Anhalt", aliases: ["sachsen-anhalt", "sachsen anhalt"], country: "Germany", lat: 51.95, lon: 11.69 },
  { name: "Schleswig-Holstein", aliases: ["schleswig holstein", "holstein", "schleswig"], country: "Germany", lat: 54.22, lon: 9.7 },
  { name: "Thuringia", aliases: ["thüringen", "thuringen"], country: "Germany", lat: 50.9, lon: 11.03 },
  { name: "Württemberg", aliases: ["wurttemberg", "wuerttemberg"], country: "Germany", lat: 48.7, lon: 9.2 },
  { name: "Baden", aliases: ["grand duchy of baden"], country: "Germany", lat: 48.4, lon: 8.2 },
  { name: "Pomerania", aliases: ["pommern"], country: "Poland", lat: 53.9, lon: 15.5 },
  { name: "Silesia", aliases: ["schlesien", "slask"], country: "Poland", lat: 51.0, lon: 17.0 },
  { name: "East Prussia", aliases: ["ostpreussen"], country: "Russia", lat: 54.4, lon: 21.0 },
  { name: "West Prussia", aliases: ["westpreussen"], country: "Poland", lat: 53.8, lon: 18.5 },
  { name: "Posen", aliases: ["province of posen", "poznan province"], country: "Poland", lat: 52.4, lon: 17.0 },
  { name: "Alsace", aliases: ["elsass"], country: "France", lat: 48.3, lon: 7.4 },
  { name: "Lorraine", aliases: ["lothringen"], country: "France", lat: 49.0, lon: 6.5 },
  // Canada
  { name: "Ontario", aliases: ["canada west", "upper canada"], country: "Canada", lat: 44.5, lon: -79.5 },
  { name: "Quebec", aliases: ["québec", "canada east", "lower canada"], country: "Canada", lat: 46.5, lon: -72.5 },
  { name: "Nova Scotia", aliases: [], country: "Canada", lat: 45.0, lon: -63.0 },
  { name: "New Brunswick", aliases: [], country: "Canada", lat: 46.5, lon: -66.2 },
  { name: "Prince Edward Island", aliases: ["pei"], country: "Canada", lat: 46.4, lon: -63.2 },
  { name: "Newfoundland", aliases: ["newfoundland and labrador"], country: "Canada", lat: 48.9, lon: -56.0 },
  { name: "Manitoba", aliases: [], country: "Canada", lat: 50.0, lon: -97.5 },
  { name: "Saskatchewan", aliases: [], country: "Canada", lat: 51.5, lon: -106.0 },
  { name: "Alberta", aliases: [], country: "Canada", lat: 52.5, lon: -114.0 },
  { name: "British Columbia", aliases: [], country: "Canada", lat: 49.5, lon: -123.0 },
  // Britain and Ireland
  { name: "England", aliases: [], country: "United Kingdom", lat: 52.6, lon: -1.5 },
  { name: "Scotland", aliases: [], country: "United Kingdom", lat: 56.5, lon: -4.2 },
  { name: "Wales", aliases: [], country: "United Kingdom", lat: 52.3, lon: -3.7 },
  { name: "Northern Ireland", aliases: [], country: "United Kingdom", lat: 54.6, lon: -6.7 },
  { name: "County Cork", aliases: ["cork", "co cork"], country: "Ireland", lat: 51.95, lon: -8.6 },
  { name: "County Kerry", aliases: ["kerry", "co kerry"], country: "Ireland", lat: 52.15, lon: -9.6 },
  { name: "County Galway", aliases: ["galway", "co galway"], country: "Ireland", lat: 53.3, lon: -8.9 },
  { name: "County Mayo", aliases: ["mayo", "co mayo"], country: "Ireland", lat: 53.9, lon: -9.3 },
  { name: "County Limerick", aliases: ["limerick", "co limerick"], country: "Ireland", lat: 52.5, lon: -8.75 },
  { name: "County Tipperary", aliases: ["tipperary", "co tipperary"], country: "Ireland", lat: 52.6, lon: -7.9 },
  { name: "County Donegal", aliases: ["donegal", "co donegal"], country: "Ireland", lat: 54.9, lon: -8.0 },
  // Sweden (provinces and counties records name)
  { name: "Småland", aliases: ["smaland"], country: "Sweden", lat: 57.0, lon: 14.8 },
  { name: "Kalmar län", aliases: ["kalmar lan", "kalmar county"], country: "Sweden", lat: 57.2, lon: 16.2 },
  { name: "Kronoberg", aliases: ["kronobergs lan", "kronobergs län"], country: "Sweden", lat: 56.8, lon: 14.6 },
  { name: "Östergötland", aliases: ["ostergotland"], country: "Sweden", lat: 58.4, lon: 15.6 },
  { name: "Värmland", aliases: ["varmland"], country: "Sweden", lat: 59.8, lon: 13.2 },
  { name: "Dalarna", aliases: ["dalecarlia", "kopparberg"], country: "Sweden", lat: 61.0, lon: 14.5 },
  { name: "Skåne", aliases: ["skane", "scania"], country: "Sweden", lat: 55.9, lon: 13.6 },
  { name: "Halland", aliases: [], country: "Sweden", lat: 56.9, lon: 12.7 },
  { name: "Västergötland", aliases: ["vastergotland"], country: "Sweden", lat: 58.1, lon: 13.0 },
  { name: "Gotland", aliases: [], country: "Sweden", lat: 57.5, lon: 18.5 },
];

const CITIES: City[] = [
  { name: "Montreal", aliases: ["montréal"], country: "Canada", lat: 45.5, lon: -73.57 },
  { name: "Quebec City", aliases: ["québec city", "ville de québec"], country: "Canada", lat: 46.81, lon: -71.21 },
  { name: "Trois-Rivières", aliases: ["trois rivieres", "trois-rivieres", "three rivers"], country: "Canada", lat: 46.35, lon: -72.55 },
  { name: "Toronto", aliases: [], country: "Canada", lat: 43.65, lon: -79.38 },
  { name: "Halifax", aliases: [], country: "Canada", lat: 44.65, lon: -63.57 },
  { name: "Winnipeg", aliases: [], country: "Canada", lat: 49.9, lon: -97.14 },
  { name: "Vancouver", aliases: [], country: "Canada", lat: 49.28, lon: -123.12 },
  { name: "Windsor", aliases: [], country: "Canada", lat: 42.31, lon: -83.04 },
  { name: "Liverpool", aliases: [], country: "United Kingdom", lat: 53.41, lon: -2.98 },
  { name: "London", aliases: [], country: "United Kingdom", lat: 51.51, lon: -0.13 },
  { name: "Southampton", aliases: [], country: "United Kingdom", lat: 50.9, lon: -1.4 },
  { name: "Glasgow", aliases: [], country: "United Kingdom", lat: 55.86, lon: -4.25 },
  { name: "Belfast", aliases: [], country: "United Kingdom", lat: 54.6, lon: -5.93 },
  { name: "Dublin", aliases: [], country: "Ireland", lat: 53.35, lon: -6.26 },
  { name: "Cobh", aliases: ["queenstown"], country: "Ireland", lat: 51.85, lon: -8.29 },
  { name: "Hamburg", aliases: [], country: "Germany", lat: 53.55, lon: 9.99 },
  { name: "Bremen", aliases: [], country: "Germany", lat: 53.08, lon: 8.8 },
  { name: "Bremerhaven", aliases: [], country: "Germany", lat: 53.54, lon: 8.58 },
  { name: "Berlin", aliases: [], country: "Germany", lat: 52.52, lon: 13.4 },
  { name: "Cologne", aliases: ["köln", "koln", "coeln", "cöln"], country: "Germany", lat: 50.94, lon: 6.96 },
  { name: "Bonn", aliases: [], country: "Germany", lat: 50.73, lon: 7.1 },
  { name: "Munich", aliases: ["münchen", "munchen"], country: "Germany", lat: 48.14, lon: 11.58 },
  { name: "Frankfurt", aliases: ["frankfurt am main"], country: "Germany", lat: 50.11, lon: 8.68 },
  { name: "Stuttgart", aliases: [], country: "Germany", lat: 48.78, lon: 9.18 },
  { name: "Le Havre", aliases: ["havre"], country: "France", lat: 49.49, lon: 0.11 },
  { name: "Paris", aliases: [], country: "France", lat: 48.86, lon: 2.35 },
  { name: "Rotterdam", aliases: [], country: "Netherlands", lat: 51.92, lon: 4.48 },
  { name: "Amsterdam", aliases: [], country: "Netherlands", lat: 52.37, lon: 4.9 },
  { name: "Antwerp", aliases: ["antwerpen", "anvers"], country: "Belgium", lat: 51.22, lon: 4.4 },
  { name: "Naples", aliases: ["napoli"], country: "Italy", lat: 40.85, lon: 14.27 },
  { name: "Palermo", aliases: [], country: "Italy", lat: 38.12, lon: 13.36 },
  { name: "Genoa", aliases: ["genova"], country: "Italy", lat: 44.41, lon: 8.93 },
  { name: "Messina", aliases: [], country: "Italy", lat: 38.19, lon: 15.55 },
  { name: "Reggio Calabria", aliases: ["reggio di calabria"], country: "Italy", lat: 38.11, lon: 15.65 },
  { name: "Cosenza", aliases: [], country: "Italy", lat: 39.3, lon: 16.25 },
  { name: "Catanzaro", aliases: [], country: "Italy", lat: 38.91, lon: 16.59 },
  { name: "Bari", aliases: [], country: "Italy", lat: 41.12, lon: 16.87 },
  { name: "Potenza", aliases: [], country: "Italy", lat: 40.64, lon: 15.8 },
  { name: "Avellino", aliases: [], country: "Italy", lat: 40.91, lon: 14.79 },
  { name: "Salerno", aliases: [], country: "Italy", lat: 40.68, lon: 14.77 },
  { name: "Rome", aliases: ["roma"], country: "Italy", lat: 41.9, lon: 12.5 },
  { name: "Trieste", aliases: [], country: "Italy", lat: 45.65, lon: 13.78 },
  { name: "Gothenburg", aliases: ["göteborg", "goteborg"], country: "Sweden", lat: 57.71, lon: 11.97 },
  { name: "Stockholm", aliases: [], country: "Sweden", lat: 59.33, lon: 18.07 },
  { name: "Kalmar", aliases: [], country: "Sweden", lat: 56.66, lon: 16.36 },
  { name: "Växjö", aliases: ["vaxjo"], country: "Sweden", lat: 56.88, lon: 14.81 },
  { name: "Oslo", aliases: ["christiania", "kristiania"], country: "Norway", lat: 59.91, lon: 10.75 },
  { name: "Bergen", aliases: [], country: "Norway", lat: 60.39, lon: 5.32 },
  { name: "Copenhagen", aliases: ["københavn", "kobenhavn"], country: "Denmark", lat: 55.68, lon: 12.57 },
  { name: "Kraków", aliases: ["krakow", "cracow"], country: "Poland", lat: 50.06, lon: 19.94 },
  { name: "Warsaw", aliases: ["warszawa"], country: "Poland", lat: 52.23, lon: 21.01 },
  { name: "Gdańsk", aliases: ["gdansk", "danzig"], country: "Poland", lat: 54.35, lon: 18.65 },
  { name: "Vienna", aliases: ["wien"], country: "Austria", lat: 48.21, lon: 16.37 },
  { name: "Prague", aliases: ["praha"], country: "Czechia", lat: 50.08, lon: 14.44 },
  { name: "Budapest", aliases: [], country: "Hungary", lat: 47.5, lon: 19.04 },
  { name: "Mexico City", aliases: ["ciudad de mexico", "ciudad de méxico"], country: "Mexico", lat: 19.43, lon: -99.13 },
  { name: "Manila", aliases: [], country: "Philippines", lat: 14.6, lon: 120.98 },
];

/** Country centers where the map's own center would mislead. */
const COUNTRY_CENTER_OVERRIDE: Record<string, [number, number]> = {
  "United States of America": [-98.58, 39.83], // contiguous states
  France: [2.6, 46.6], // mainland
  Canada: [-79.0, 46.0], // settled south
  Russia: [37.6, 55.75], // European Russia, where most emigrant records start
  Norway: [9.0, 61.0],
};

function canon(s: string): string {
  return normalize(s)
    .replace(/\bste\b\.?/g, "sainte")
    .replace(/\bst\b\.?/g, "saint")
    .replace(/\bmt\b\.?/g, "mount")
    .replace(/\bft\b\.?/g, "fort")
    .replace(/\s+/g, " ")
    .trim();
}

function stripCountyWord(s: string): string {
  return s.replace(/\b(county|co|parish|township|twp|borough|census area)$/, "").trim();
}

/** A component of a place string, made comparable. */
function tokenKey(raw: string): string {
  const t = canon(raw.replace(/\./g, ""));
  if (!t) return "";
  if (US_WORDS.has(t)) return "united states of america";
  const st = STATE_BY_KEY.get(t);
  if (st) return `state:${st}`;
  const alias = COUNTRY_ALIASES[t];
  if (alias && !["england", "scotland", "wales", "northern ireland", "prussia"].includes(t)) return alias.toLowerCase();
  return stripCountyWord(t);
}

/** Comparable pieces of a place string. */
export function placeTokens(place: string | undefined): string[] {
  return (place ?? "")
    .split(/[,;]/)
    .map(tokenKey)
    .filter(Boolean);
}

/** Could these two place strings describe the same place? One may be more
 *  specific than the other ("Missouri" vs "Sedalia, Pettis Co., Mo."). */
export function placesCompatible(a: string | undefined, b: string | undefined): boolean {
  const ta = placeTokens(a);
  const tb = placeTokens(b);
  if (!ta.length || !tb.length) return true;
  const sa = new Set(ta.filter((t) => t !== "united states of america"));
  const sb = new Set(tb.filter((t) => t !== "united states of america"));
  const aInB = [...sa].every((t) => sb.has(t));
  const bInA = [...sb].every((t) => sa.has(t));
  return aInB || bInA;
}

/** The US state a place string names, if any. */
export function usStateOf(place: string | undefined): string | null {
  for (const t of placeTokens(place)) if (t.startsWith("state:")) return t.slice(6);
  return null;
}

function findRegion(tokens: string[]): Region | undefined {
  for (const t of tokens) {
    const r = REGIONS.find((x) => canon(x.name) === t || x.aliases.some((a) => canon(a) === t));
    if (r) return r;
  }
  return undefined;
}

function findCity(token: string, country?: string): City | undefined {
  return CITIES.find((c) => (canon(c.name) === token || c.aliases.some((a) => canon(a) === token)) && (!country || c.country === country));
}

/** The country a place string is in, spelled as the map data spells it. */
export function countryOf(place: string | undefined): string | null {
  const raw = (place ?? "").split(/[,;]/).map((s) => canon(s.replace(/\./g, ""))).filter(Boolean);
  if (!raw.length) return null;
  for (let i = raw.length - 1; i >= 0; i--) {
    const t = raw[i];
    if (US_WORDS.has(t) || STATE_BY_KEY.has(t)) return "United States of America";
    if (COUNTRY_ALIASES[t]) return COUNTRY_ALIASES[t];
    const direct = KNOWN_COUNTRIES.find((c) => canon(c) === t);
    if (direct) return direct;
    const r = findRegion([t]);
    if (r) return r.country;
  }
  const city = raw.map((t) => findCity(t)).find(Boolean);
  return city ? city.country : null;
}

const KNOWN_COUNTRIES = [
  "Italy", "Germany", "Ireland", "Sweden", "Norway", "Denmark", "Finland", "Poland", "France", "Netherlands",
  "Belgium", "Switzerland", "Austria", "Hungary", "Czechia", "Slovakia", "Greece", "Portugal", "Spain", "Russia",
  "Ukraine", "Lithuania", "Latvia", "Estonia", "Croatia", "Slovenia", "Serbia", "Romania", "Bulgaria", "Lebanon",
  "Syria", "Turkey", "Mexico", "Canada", "Cuba", "Philippines", "China", "Japan", "India", "Iceland", "Luxembourg",
  "Australia", "New Zealand", "South Africa", "Brazil", "Argentina", "Jamaica", "Haiti", "Puerto Rico", "United Kingdom",
];

export type StateGaz = { p: [string, number, number][]; c: [string, number, number][] };

export interface PlaceLoaders {
  state(abbr: string): Promise<StateGaz | null>;
  countryCenter?(name: string): [number, number] | undefined;
}

export interface ResolvedPlace {
  lat: number;
  lon: number;
  precision: Precision;
  /** what the pin stands for, in plain words */
  label: string;
  country?: string;
  state?: string;
}

/** Put a place on the map at the most precise level the built-in data supports. */
export async function resolvePlace(place: string | undefined, loaders: PlaceLoaders): Promise<ResolvedPlace | null> {
  const parts = (place ?? "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  const tokens = parts.map((p) => canon(p.replace(/\./g, "")));
  const st = usStateOf(place);
  const country = countryOf(place);

  if (st) {
    const gaz = await loaders.state(st).catch(() => null);
    const sName = stateName(st);
    if (gaz) {
      const placeIdx = tokens.findIndex((t) => STATE_BY_KEY.get(t) === st);
      const before = placeIdx > 0 ? tokens.slice(0, placeIdx) : tokens.slice(0, -1);
      if (before.length) {
        const town = gaz.p.find((p) => canon(p[0]) === before[0]);
        if (town && !/\b(county|co|parish)$/.test(before[0])) {
          return { lat: town[1], lon: town[2], precision: "town", label: `${town[0]}, ${sName}`, country: "United States of America", state: st };
        }
        for (const t of before) {
          const key = stripCountyWord(t);
          const county = gaz.c.find((c) => canon(c[0]) === key);
          if (county) return { lat: county[1], lon: county[2], precision: "county", label: `${county[0]} County, ${sName}`, country: "United States of America", state: st };
        }
      }
      if (gaz.c.length) {
        const lat = gaz.c.reduce((s, c) => s + c[1], 0) / gaz.c.length;
        const lon = gaz.c.reduce((s, c) => s + c[2], 0) / gaz.c.length;
        return { lat, lon, precision: "region", label: sName, country: "United States of America", state: st };
      }
    }
    return null;
  }

  // Outside the US: a known city, then a region, then the country.
  const city = findCity(tokens[0], country ?? undefined);
  if (city) return { lat: city.lat, lon: city.lon, precision: "town", label: `${city.name}, ${city.country === "United States of America" ? "USA" : city.country}`, country: city.country };
  const region = findRegion(tokens);
  if (region) return { lat: region.lat, lon: region.lon, precision: "region", label: `${region.name}, ${region.country}`, country: region.country };
  if (country) {
    const c = COUNTRY_CENTER_OVERRIDE[country] ?? loaders.countryCenter?.(country);
    if (c) return { lat: c[1], lon: c[0], precision: "country", label: country === "United States of America" ? "United States" : country, country };
  }
  return null;
}

export const PRECISION_LABEL: Record<Precision, string> = {
  town: "town",
  county: "county only",
  region: "state or region only",
  country: "country only",
};
