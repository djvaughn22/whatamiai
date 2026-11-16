// The research plan: where to look next for one person, and why.
//
// Every suggestion is a PLACE TO LOOK, never a record. Each says why it fits
// (the person's dates and places), what the record usually tells you, who
// holds it, and what access costs (free, free account, subscription, a
// request by mail). Links are plain searches on the holder's own site: the
// person goes there and looks for themselves. Nothing is scraped and nothing
// behind a paywall is presented as free.
//
// Collection numbers and addresses were checked on 2026-11-15
// (docs/RESEARCH.md lists them).

import { dateRange } from "./dates";
import { activeFacts, primaryName } from "./names";
import { countryOf, stateName, usStateOf } from "./places";
import { isLiving } from "./living";
import { estimateBirth } from "./estimate";
import type { Access, FamilyData, Id } from "./types";

export type LeadGroup = "Census" | "Military" | "Vital records" | "Immigration" | "Newspapers" | "Burials" | "Old country" | "Other trees" | "Guides";

export interface Lead {
  key: string;
  group: LeadGroup;
  title: string;
  /** why this fits this person, from their own dates and places */
  why: string;
  /** what this kind of record usually tells you */
  tells?: string;
  /** what to type if the link can't pre-fill the search */
  searchFor?: string;
  url: string;
  holder: string;
  access: Access;
  /** lower comes first */
  order: number;
}

export const ACCESS_LABEL: Record<Access, string> = {
  free: "Free",
  "free-account": "Free account",
  subscription: "Subscription",
  request: "Request by mail or online (fees may apply)",
  "in-person": "In person",
};

const FS = "https://www.familysearch.org";

/** FamilySearch collection numbers (checked 2026-11-15). */
const FS_CENSUS: Record<number, string> = {
  1850: "1401638",
  1860: "1473181",
  1870: "1438024",
  1880: "1417683",
  1900: "1325221",
  1910: "1727033",
  1920: "1488411",
  1930: "1810731",
  1940: "2000219",
  1950: "4464515",
};

const CENSUS_TELLS: Record<number, string> = {
  1850: "The first federal census to name every member of a free household, with ages and birthplaces.",
  1860: "Names, ages, birthplaces and the value of property for each free household.",
  1870: "The first census after the Civil War; names every household member, including formerly enslaved people.",
  1880: "The first census to give each person's relationship to the head of the household, and parents' birthplaces.",
  1900: "Month and year of birth, years married, and the year an immigrant arrived.",
  1910: "Year of arrival and citizenship status for immigrants, and Civil War service.",
  1920: "Year of arrival and the year an immigrant became a citizen.",
  1930: "Age at first marriage, veteran status, and year of arrival for immigrants.",
  1940: "Where each person lived in 1935, and the highest school grade finished.",
  1950: "The most recent census open to the public (released in 2022). Some people were asked where they lived a year earlier.",
};

const CENSUS_DAY: Record<number, number> = {
  1850: 1850.42,
  1860: 1860.42,
  1870: 1870.42,
  1880: 1880.42,
  1890: 1890.42,
  1900: 1900.42,
  1910: 1910.29,
  1920: 1920.0,
  1930: 1930.25,
  1940: 1940.25,
  1950: 1950.25,
};

function q(v: string) {
  return encodeURIComponent(v);
}

interface Profile {
  given: string;
  surname: string;
  name: string;
  sex: string;
  birth?: [number, number];
  death?: [number, number];
  birthYear?: number;
  places: string[];
  states: string[];
  countries: string[];
  usConnected: boolean;
  bornAbroad: string | null;
  military: { branch: string; year?: number }[];
  living: boolean;
  explicitLiving: boolean;
  /** set when the birth range is an estimate from relatives */
  estimated?: string;
}

export function profileOf(data: FamilyData, personId: Id): Profile {
  const facts = activeFacts(data, personId);
  const n = primaryName(data, personId);
  const birthFact = facts.find((f) => f.type === "birth" && f.preferred) ?? facts.find((f) => f.type === "birth") ?? facts.find((f) => f.type === "baptism");
  const deathFact = facts.find((f) => f.type === "death" && f.preferred) ?? facts.find((f) => f.type === "death") ?? facts.find((f) => f.type === "burial");
  let birth = dateRange(birthFact?.date);
  const death = dateRange(deathFact?.date);
  let estimated: string | undefined;
  if (!birth) {
    const est = estimateBirth(data, personId);
    if (est) {
      birth = est.range;
      estimated = `born about ${est.range[0]}–${est.range[1]}, ${est.basis}`;
    }
  }
  const places = [...new Set(facts.map((f) => f.place).filter((p): p is string => !!p))];
  for (const r of Object.values(data.relationships)) {
    if (r.type !== "partner" || (r.a !== personId && r.b !== personId)) continue;
    for (const f of Object.values(data.facts)) if (f.relationshipId === r.id && f.place && !f.rejected) places.push(f.place);
  }
  const states = [...new Set(places.map((p) => usStateOf(p)).filter((s): s is string => !!s))];
  const countries = [...new Set(places.map((p) => countryOf(p)).filter((c): c is string => !!c))];
  const birthCountry = birthFact?.place ? countryOf(birthFact.place) : null;
  const usConnected = countries.includes("United States of America") || facts.some((f) => f.type === "immigration" || f.type === "naturalization");
  const military = facts.filter((f) => f.type === "military").map((f) => ({ branch: f.value ?? "", year: f.date?.y }));
  return {
    given: n.given,
    surname: n.surname,
    name: [n.given, n.surname].filter(Boolean).join(" "),
    sex: data.people[personId]?.sex ?? "unknown",
    birth,
    death,
    birthYear: birth ? Math.round((birth[0] + birth[1]) / 2) : undefined,
    places,
    states,
    countries,
    usConnected,
    bornAbroad: birthCountry && birthCountry !== "United States of America" ? birthCountry : null,
    military,
    living: isLiving(data, personId),
    explicitLiving: data.people[personId]?.living === "yes",
    estimated,
  };
}

/** Could the person have been alive at this decimal year? */
function maybeAlive(p: Profile, year: number): boolean {
  if (p.birth && p.birth[0] > year) return false;
  if (p.death && p.death[1] < year) return false;
  if (!p.birth && !p.death) return false;
  if (p.birth && !p.death && year - p.birth[0] > 105) return false;
  if (!p.birth && p.death && p.death[1] - year > 100) return false;
  return true;
}

function ageText(p: Profile, year: number): string {
  if (!p.birth) return "";
  const lo = Math.max(0, Math.floor(year - p.birth[1]));
  const hi = Math.max(0, Math.floor(year - p.birth[0]));
  if (lo === hi) return `${lo}`;
  if (hi - lo <= 4) return `about ${Math.round((lo + hi) / 2)}`;
  return `${lo}–${hi}`;
}

function pronoun(p: Profile): string {
  return p.sex === "female" ? "She" : p.sex === "male" ? "He" : "They";
}

function fsSearch(p: Profile, extra: Record<string, string> = {}): string {
  const params: string[] = [];
  if (p.given) params.push(`q.givenName=${q(p.given)}`);
  if (p.surname) params.push(`q.surname=${q(p.surname)}`);
  if (p.birth) {
    params.push(`q.birthLikeDate.from=${Math.floor(p.birth[0]) - 1}`);
    params.push(`q.birthLikeDate.to=${Math.ceil(p.birth[1]) + 1}`);
  }
  for (const [k, v] of Object.entries(extra)) params.push(`${k}=${q(v)}`);
  return `${FS}/search/record/results?${params.join("&")}`;
}

function wikiState(state: string) {
  return `${FS}/en/wiki/${stateName(state).replace(/ /g, "_")},_United_States_Genealogy`;
}

function wikiCountry(country: string) {
  const name = country === "United Kingdom" ? "England" : country === "Czechia" ? "Czech_Republic" : country.replace(/ /g, "_");
  return `${FS}/en/wiki/${name}_Genealogy`;
}

/** The research plan for one person. Empty when there's too little to go on. */
export function researchPlan(data: FamilyData, personId: Id): Lead[] {
  const p = profileOf(data, personId);
  const leads: Lead[] = [];
  if (!p.surname && !p.given) return leads;
  const he = pronoun(p);
  const nameFor = p.name || "this person";
  const home = p.states[0];
  const searchFor = [p.name, p.birthYear ? `born about ${p.birthYear}` : "", home ? stateName(home) : ""].filter(Boolean).join(", ");

  if (p.explicitLiving || (p.living && !p.birth)) {
    leads.push({
      key: "living-note",
      group: "Guides",
      title: "Records about living people are mostly closed",
      why: `${nameFor} is treated as living. Censuses after 1950, recent vital records and service files are private by law.`,
      tells: "Start with the people a generation or two back, and ask living relatives what they know.",
      url: `${FS}/en/wiki/United_States_Privacy_Laws`,
      holder: "FamilySearch Research Wiki",
      access: "free",
      order: 0,
    });
  }

  // ── Census ──
  if (p.usConnected || !p.countries.length) {
    for (const year of [1850, 1860, 1870, 1880, 1900, 1910, 1920, 1930, 1940, 1950]) {
      if (!maybeAlive(p, CENSUS_DAY[year])) continue;
      const age = ageText(p, CENSUS_DAY[year]);
      leads.push({
        key: `us-census-${year}`,
        group: "Census",
        title: `${year} U.S. census`,
        why: `${he} would have been ${age || "alive"}${age ? " years old" : ""} on census day, if living in the United States${p.estimated ? ` (${p.estimated})` : ""}.`,
        tells: CENSUS_TELLS[year],
        searchFor,
        url: fsSearch(p, { "f.collectionId": FS_CENSUS[year] }),
        holder: "FamilySearch (images from the National Archives)",
        access: "free-account",
        order: 10 + (1950 - year) / 100,
      });
      if (year === 1950) {
        leads.push({
          key: "us-census-1950-nara",
          group: "Census",
          title: "1950 U.S. census at the National Archives",
          why: `The same census on the government's own site. Its name index was made by computer, so try spelling variations.`,
          searchFor,
          url: `https://1950census.archives.gov/search/?name=${q(p.name)}${home ? `&state=${home}` : ""}`,
          holder: "U.S. National Archives",
          access: "free",
          order: 10.05,
        });
      }
    }
    if (maybeAlive(p, CENSUS_DAY[1890])) {
      leads.push({
        key: "us-census-1890",
        group: "Census",
        title: "1890 census: mostly lost",
        why: `Almost all of the 1890 census was destroyed after a fire in 1921. Use the 1890 veterans' schedules, city directories and state censuses instead.`,
        url: "https://www.archives.gov/research/census/1890",
        holder: "U.S. National Archives",
        access: "free",
        order: 19,
      });
    }
  }

  // ── Military ──
  const male = p.sex !== "female";
  if (male && p.birth && p.birth[1] > 1872 && p.birth[0] < 1901 && p.usConnected) {
    leads.push({
      key: "ww1-draft",
      group: "Military",
      title: "World War I draft registration card (1917–1918)",
      why: `Nearly every man in the U.S. born from about 1872 to 1900 registered, citizen or not. ${he} fits that range.`,
      tells: "Exact birth date and often birthplace, address, employer, and a physical description.",
      searchFor,
      url: fsSearch(p, { "f.collectionId": "1968530" }),
      holder: "FamilySearch (images from the National Archives)",
      access: "free-account",
      order: 20,
    });
  }
  if (male && p.birth && p.birth[1] > 1877 && p.birth[0] < 1898 && p.usConnected) {
    leads.push({
      key: "ww2-draft-1942",
      group: "Military",
      title: "World War II \"old man's draft\" card (1942)",
      why: `Men born 1877 to 1897 registered in April 1942. ${he} fits that range.`,
      tells: "Birth date and place, address, employer and the name of someone who would always know the man's address.",
      searchFor,
      url: fsSearch(p, { "f.collectionId": "1861144" }),
      holder: "FamilySearch (images from the National Archives)",
      access: "free-account",
      order: 21,
    });
  }
  if (male && p.birth && p.birth[1] > 1897 && p.birth[0] < 1930 && p.usConnected) {
    leads.push({
      key: "ww2-draft",
      group: "Military",
      title: "World War II draft registration card (1940–1947)",
      why: `Men born from about 1898 to 1929 registered. ${he} fits that range. These cards turn up among FamilySearch's search results.`,
      tells: "Birth date and place, address, employer and a contact person.",
      searchFor,
      url: fsSearch(p),
      holder: "FamilySearch",
      access: "free-account",
      order: 22,
    });
  }
  if (p.military.length) {
    const branches = p.military.map((m) => m.branch.toLowerCase()).join(" ");
    const marineOrNavy = /marine|navy|naval/.test(branches);
    const army = /army|air/.test(branches);
    leads.push({
      key: "nprc-ompf",
      group: "Military",
      title: "Order the official military personnel file",
      why: `${nameFor} has military service on record. Files of service members who left more than 62 years ago are open to anyone.${marineOrNavy ? " Navy and Marine Corps files were not part of the 1973 records fire." : ""}${army ? " Many Army files for discharges from 1912 to 1960 were lost in the 1973 fire; the Records Center can rebuild some service details from other records." : ""}`,
      tells: "Enlistment and discharge dates, units, assignments, sometimes a photo and next of kin.",
      url: "https://www.archives.gov/personnel-records-center/military-personnel/ompf-archival-requests",
      holder: "National Personnel Records Center (St. Louis)",
      access: "request",
      order: 23,
    });
    if (/marine/.test(branches)) {
      leads.push({
        key: "usmc-muster-rolls",
        group: "Military",
        title: "Marine Corps muster rolls (1798–1958)",
        why: `Muster rolls list every Marine in a unit, month by month. They show where ${nameFor} served and when.`,
        tells: "Unit, rank, location and changes such as transfers, by month.",
        searchFor: `${p.name}, Marine Corps`,
        url: `https://www.ancestry.com/search/?name=${q(p.given)}_${q(p.surname)}${p.birthYear ? `&birth=${p.birthYear}` : ""}&keyword=marine`,
        holder: "Ancestry (originals at the National Archives). Many public libraries offer free in-library access.",
        access: "subscription",
        order: 24,
      });
    }
  }
  if (male && p.birth && p.birth[1] > 1815 && p.birth[0] < 1851 && p.usConnected) {
    leads.push({
      key: "civil-war-soldiers",
      group: "Military",
      title: "Civil War soldiers and sailors",
      why: `${he} was of fighting age during the Civil War (1861–1865).`,
      tells: "Regiment and company, Union or Confederate.",
      searchFor: p.name,
      url: "https://www.nps.gov/civilwar/search-soldiers.htm",
      holder: "National Park Service",
      access: "free",
      order: 25,
    });
  }

  // ── Vital records ──
  if (p.states.includes("MO")) {
    const diedMaybeInRange = !p.living && (!p.death || (p.death[1] > 1910 && p.death[0] < 1975));
    if (diedMaybeInRange) {
      leads.push({
        key: "mo-death-certificates",
        group: "Vital records",
        title: "Missouri death certificates (1910–1974)",
        why: `${nameFor} has a Missouri connection${p.death ? " and a death date in this range" : ""}. These certificates are free to view.`,
        tells: "Usually the parents' names and birthplaces, so they open the next generation back.",
        searchFor: `${p.surname}${p.given ? `, ${p.given}` : ""}`,
        url: "https://s1.sos.mo.gov/records/archives/archivesdb/deathcertificates/",
        holder: "Missouri State Archives",
        access: "free",
        order: 30,
      });
    }
    if (p.birth && p.birth[0] < 1910) {
      leads.push({
        key: "mo-pre1910",
        group: "Vital records",
        title: "Missouri birth and death records before 1910",
        why: `Some Missouri counties recorded births and deaths from the 1860s to 1909, before the state took over.`,
        searchFor: p.surname,
        url: "https://s1.sos.mo.gov/records/archives/archivesdb/birthdeath/",
        holder: "Missouri State Archives",
        access: "free",
        order: 31,
      });
    }
    if (male && p.birth && p.birth[0] < 1901) {
      leads.push({
        key: "mo-soldiers",
        group: "Military",
        title: "Missouri soldiers' records (War of 1812 to World War I)",
        why: `Service cards for Missourians from 1812 to 1919. ${he} was born early enough to appear.`,
        searchFor: p.surname,
        url: "https://s1.sos.mo.gov/records/archives/archivesdb/soldiers/",
        holder: "Missouri State Archives",
        access: "free",
        order: 26,
      });
    }
  }
  for (const st of p.states) {
    leads.push({
      key: `wiki-${st}`,
      group: "Guides",
      title: `Where ${stateName(st)} records are kept`,
      why: `A guide to vital records, county courthouses, state archives and newspapers for ${stateName(st)}.`,
      url: wikiState(st),
      holder: "FamilySearch Research Wiki",
      access: "free",
      order: 90,
    });
  }
  if (!p.living && p.usConnected && (!p.death || p.death[1] > 1962) && (!p.birth || p.birth[1] > 1870)) {
    leads.push({
      key: "ssdi",
      group: "Vital records",
      title: "Social Security Death Index",
      why: `Covers most U.S. deaths reported to Social Security from 1962 on.${p.death ? "" : " No death date is recorded yet, so this may supply one."}`,
      tells: "Birth and death dates, and the place of the last benefit.",
      searchFor,
      url: fsSearch(p, { "f.collectionId": "1202535" }),
      holder: "FamilySearch",
      access: "free-account",
      order: 32,
    });
  }

  // ── Burials ──
  if (!p.living) {
    const fg = [`firstname=${q(p.given)}`, `lastname=${q(p.surname)}`];
    if (p.birthYear) fg.push(`birthyear=${p.birthYear}`, "birthyearfilter=2");
    if (p.death) fg.push(`deathyear=${Math.round((p.death[0] + p.death[1]) / 2)}`, "deathyearfilter=2");
    leads.push({
      key: "findagrave",
      group: "Burials",
      title: "Find a Grave",
      why: "Volunteer-made memorials with headstone photos. Dates on a memorial are someone's reading of the stone, so treat them as a lead.",
      tells: "Burial place, headstone dates, sometimes links to family members.",
      url: `https://www.findagrave.com/memorial/search?${fg.join("&")}`,
      holder: "Find a Grave",
      access: "free",
      order: 40,
    });
  }

  // ── Newspapers (searched inside WhatAmIAI) ──
  if (p.usConnected && (!p.birth || p.birth[0] < 1963)) {
    leads.push({
      key: "loc-newspapers",
      group: "Newspapers",
      title: "Historic U.S. newspapers (1770–1963)",
      why: "Search the Library of Congress newspaper pages right here, from the Records page or below.",
      tells: "Births, marriages, obituaries, local news, court notices, and ads.",
      url: "https://www.loc.gov/collections/chronicling-america/",
      holder: "Library of Congress, Chronicling America",
      access: "free",
      order: 35,
    });
  }

  // ── Immigration ──
  const immigrant = !!p.bornAbroad || activeFacts(data, personId).some((f) => f.type === "immigration" || f.type === "emigration" || f.type === "naturalization");
  if (immigrant && p.usConnected) {
    leads.push({
      key: "ellis-island",
      group: "Immigration",
      title: "Ellis Island and New York arrivals",
      why: `${nameFor} came from abroad. Most immigrants from 1892 to 1924 arrived through the Port of New York.`,
      tells: "Ship, date, age, hometown, and who they were joining in America.",
      searchFor: p.name,
      url: "https://heritage.statueofliberty.org/",
      holder: "Statue of Liberty–Ellis Island Foundation",
      access: "free-account",
      order: 50,
    });
    leads.push({
      key: "border-canada",
      group: "Immigration",
      title: "Crossings from Canada into the U.S. (1895–1954)",
      why: "Many immigrants landed in Canada and then crossed into the United States. These \"St. Albans\" lists recorded them.",
      tells: "Date and port of crossing, the ship they arrived in Canada on, and their destination.",
      searchFor: p.name,
      url: fsSearch(p, { "f.collectionId": "2185163" }),
      holder: "FamilySearch (originals at the National Archives)",
      access: "free-account",
      order: 51,
    });
    leads.push({
      key: "naturalization",
      group: "Immigration",
      title: "Naturalization records",
      why: "If they became a U.S. citizen, the papers often give the hometown abroad and arrival date.",
      tells: "Birthplace abroad, arrival date and ship, and after 1906 often a photo.",
      url: "https://www.archives.gov/research/naturalization",
      holder: "U.S. National Archives and county courts",
      access: "request",
      order: 52,
    });
  }
  const origins = new Set<string>([...(p.bornAbroad ? [p.bornAbroad] : []), ...p.countries.filter((c) => c !== "United States of America")]);
  for (const country of origins) {
    if (country === "Italy") {
      leads.push({
        key: "antenati",
        group: "Old country",
        title: "Italian civil records (Antenati)",
        why: `${nameFor} has an Italian connection. Italy's state archives put town birth, marriage and death registers online, mostly from 1809 on.`,
        tells: "Town registers: births, marriages, deaths, with parents' names.",
        searchFor: p.surname,
        url: `https://antenati.cultura.gov.it/search-nominative/?cognome=${q(p.surname)}${p.given ? `&nome=${q(p.given)}` : ""}`,
        holder: "Italian Ministry of Culture, Portale Antenati",
        access: "free",
        order: 60,
      });
    }
    if (country === "Germany" || country === "Poland" || country === "Austria") {
      leads.push({
        key: "matricula",
        group: "Old country",
        title: "Catholic parish registers (Matricula)",
        why: `${nameFor} has a ${country === "Germany" ? "German" : country === "Poland" ? "Polish" : "Austrian"} connection. Many Catholic dioceses put their church books here.`,
        tells: "Baptisms, marriages and burials by parish.",
        url: "https://data.matricula-online.eu/en/",
        holder: "Matricula",
        access: "free",
        order: 61,
      });
      if (country === "Germany") {
        leads.push({
          key: "archion",
          group: "Old country",
          title: "Protestant church books (Archion)",
          why: "Lutheran and Reformed church books from many German regions.",
          url: "https://www.archion.de/en/",
          holder: "Archion",
          access: "subscription",
          order: 62,
        });
        leads.push({
          key: "compgen",
          group: "Old country",
          title: "German genealogy wiki and town lists (GenWiki)",
          why: "Finds the right town, parish and archive for a German place name, including old ones.",
          url: "https://wiki.genealogy.net/",
          holder: "Verein für Computergenealogie",
          access: "free",
          order: 63,
        });
      }
      if (country === "Poland") {
        leads.push({
          key: "geneteka",
          group: "Old country",
          title: "Polish parish index (Geneteka)",
          why: "A volunteer index of millions of Polish baptisms, marriages and deaths.",
          searchFor: p.surname,
          url: "https://geneteka.genealodzy.pl/",
          holder: "Polskie Towarzystwo Genealogiczne",
          access: "free",
          order: 63,
        });
      }
    }
    if (country === "Sweden") {
      leads.push({
        key: "riksarkivet",
        group: "Old country",
        title: "Swedish National Archives",
        why: `${nameFor} has a Swedish connection. Swedish parish books record nearly everyone, often for centuries.`,
        tells: "Household examination rolls follow a family year by year, with moves in and out.",
        url: "https://sok.riksarkivet.se/",
        holder: "Riksarkivet",
        access: "free",
        order: 60,
      });
    }
    if (country === "United Kingdom") {
      leads.push({
        key: "freebmd",
        group: "Old country",
        title: "England and Wales birth, marriage and death index (FreeBMD)",
        why: "A free index to civil registration from 1837.",
        searchFor: p.name,
        url: "https://www.freebmd.org.uk/",
        holder: "FreeBMD",
        access: "free",
        order: 60,
      });
    }
    if (country === "Ireland") {
      leads.push({
        key: "irish-civil",
        group: "Old country",
        title: "Irish civil records",
        why: "Irish births, marriages and deaths from the state registers.",
        searchFor: p.name,
        url: "https://civilrecords.irishgenealogy.ie/",
        holder: "Irish Department of Tourism, Culture, Arts, Gaeltacht, Sport and Media",
        access: "free",
        order: 60,
      });
    }
    leads.push({
      key: `wiki-${country}`,
      group: "Guides",
      title: `Where ${country === "United Kingdom" ? "English" : country} records are kept`,
      why: `A country guide: which records exist, which years, and where they're held.`,
      url: wikiCountry(country),
      holder: "FamilySearch Research Wiki",
      access: "free",
      order: 91,
    });
  }

  // ── Everything else ──
  leads.push({
    key: "fs-records",
    group: "Census",
    title: "All FamilySearch historical records",
    why: "A broad search across billions of indexed records. Try it after the specific searches above.",
    searchFor,
    url: fsSearch(p, home ? { "q.anyPlace": stateName(home) } : {}),
    holder: "FamilySearch",
    access: "free-account",
    order: 70,
  });
  if (!p.birth || p.birth[0] < 1930) {
    leads.push({
      key: "fs-fulltext",
      group: "Vital records",
      title: "Deeds, wills and court records (full-text search)",
      why: "Handwritten land and probate records, read by computer so you can search the words. Strong for the 1700s and 1800s.",
      tells: "Land sales, wills naming children, guardianships.",
      url: `${FS}/search/full-text/results?q.text=${q(`"${p.name}"`)}`,
      holder: "FamilySearch Labs",
      access: "free-account",
      order: 71,
    });
  }
  leads.push({
    key: "other-trees",
    group: "Other trees",
    title: "Other people's family trees",
    why: "Someone may already be researching this family. Treat what you find as a clue to check, never as proof.",
    url: `${FS}/tree/find/name?self=${q(`${p.given}|${p.surname}|0|0`)}`,
    holder: "FamilySearch Family Tree",
    access: "free-account",
    order: 80,
  });

  return leads.sort((a, b) => a.order - b.order);
}

/** Plain next questions to answer for a person, from what's missing. */
export function openQuestions(data: FamilyData, personId: Id): string[] {
  const facts = activeFacts(data, personId);
  const p = profileOf(data, personId);
  const name = p.given || p.name || "this person";
  const out: string[] = [];
  const has = (t: string) => facts.some((f) => f.type === t);
  if (!has("birth") && !has("baptism")) out.push(`When and where was ${name} born?`);
  if (!p.living && !has("death") && !has("burial")) out.push(`When and where did ${name} die?`);
  const parents = Object.values(data.relationships).filter((r) => r.type === "parent" && r.b === personId).length;
  if (parents < 2) out.push(parents ? `Who was ${name}'s other parent?` : `Who were ${name}'s parents?`);
  if (p.bornAbroad && !has("immigration")) out.push(`When did ${name} come to America, and through which port?`);
  return out;
}
