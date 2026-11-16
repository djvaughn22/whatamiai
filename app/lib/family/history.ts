// Historical context shown beside a family's own events. Each entry is a
// well-documented public event in our own words, with a source to read more.
// Context is never written as if it happened to the family: a story may say
// "the United States entered the war in December 1941", never "they were
// frightened when the war began".

export interface HistoryEvent {
  id: string;
  /** decimal years */
  start: number;
  end?: number;
  title: string;
  text: string;
  /** "world", "US", a US state code ("MO"), or a country name as the map spells it */
  scope: string[];
  kind: "history" | "records";
  /** 3 = defining events of a lifetime, 2 = major, 1 = background */
  weight?: number;
  source: string;
  sourceName: string;
}

const W = "https://en.wikipedia.org/wiki/";

export const HISTORY: HistoryEvent[] = [
  { id: "louisiana-purchase", start: 1803.3, title: "Louisiana Purchase", text: "The United States bought the Louisiana Territory from France, including the land that became Missouri.", scope: ["US", "MO"], kind: "history", source: `${W}Louisiana_Purchase`, sourceName: "Wikipedia" },
  { id: "new-madrid", start: 1811.95, end: 1812.2, title: "New Madrid earthquakes", text: "A series of strong earthquakes shook southeast Missouri and the Mississippi valley.", scope: ["MO"], kind: "history", source: `${W}New_Madrid_seismic_zone`, sourceName: "Wikipedia" },
  { id: "missouri-statehood", start: 1821.6, title: "Missouri becomes a state", text: "Missouri entered the Union as a state under the Missouri Compromise.", scope: ["MO"], kind: "history", source: `${W}Missouri_Compromise`, sourceName: "Wikipedia" },
  { id: "irish-famine", weight: 3, start: 1845.7, end: 1852, title: "The Great Famine in Ireland", text: "Potato blight and famine killed about a million people in Ireland and drove mass emigration.", scope: ["Ireland", "United Kingdom"], kind: "history", source: `${W}Great_Famine_(Ireland)`, sourceName: "Wikipedia" },
  { id: "german-1848", weight: 2, start: 1848.2, end: 1849.5, title: "Revolutions in the German states", text: "Uprisings across the German states failed, and many who took part left for America.", scope: ["Germany"], kind: "history", source: `${W}Revolutions_of_1848_in_the_German_states`, sourceName: "Wikipedia" },
  { id: "gold-rush", start: 1848.1, end: 1855, title: "California Gold Rush", text: "Gold found in California drew hundreds of thousands of people west.", scope: ["US", "CA"], kind: "history", source: `${W}California_gold_rush`, sourceName: "Wikipedia" },
  { id: "census-1850", start: 1850.42, title: "First census to name everyone", text: "The 1850 U.S. census was the first to list every member of a free household by name.", scope: ["US"], kind: "records", source: "https://www.archives.gov/research/census", sourceName: "U.S. National Archives" },
  { id: "civil-war", weight: 3, start: 1861.28, end: 1865.33, title: "American Civil War", text: "War between the Union and the Confederacy, from 1861 to 1865.", scope: ["US"], kind: "history", source: `${W}American_Civil_War`, sourceName: "Wikipedia" },
  { id: "civil-war-mo", weight: 3, start: 1861.3, end: 1865.33, title: "The Civil War in Missouri", text: "Missouri stayed in the Union but saw heavy guerrilla fighting between neighbors.", scope: ["MO"], kind: "history", source: `${W}Missouri_in_the_American_Civil_War`, sourceName: "Wikipedia" },
  { id: "homestead", start: 1862.38, title: "Homestead Act", text: "Settlers could claim up to 160 acres of public land by living on it and farming it for five years.", scope: ["US"], kind: "history", source: `${W}Homestead_Acts`, sourceName: "Wikipedia" },
  { id: "13th-amendment", start: 1865.92, title: "Slavery abolished", text: "The Thirteenth Amendment ended slavery in the United States.", scope: ["US"], kind: "history", source: `${W}Thirteenth_Amendment_to_the_United_States_Constitution`, sourceName: "Wikipedia" },
  { id: "confederation", weight: 2, start: 1867.5, title: "Canadian Confederation", text: "Ontario, Quebec, Nova Scotia and New Brunswick united as the Dominion of Canada.", scope: ["Canada"], kind: "history", source: `${W}Canadian_Confederation`, sourceName: "Wikipedia" },
  { id: "swedish-famine", weight: 2, start: 1867, end: 1869, title: "Famine years in Sweden", text: "Crop failures in Sweden pushed a large wave of emigration to the United States.", scope: ["Sweden"], kind: "history", source: `${W}Swedish_emigration_to_the_United_States`, sourceName: "Wikipedia" },
  { id: "transcontinental", start: 1869.36, title: "Transcontinental railroad completed", text: "Rail lines from east and west met in Utah, linking the country by train.", scope: ["US"], kind: "history", source: `${W}First_transcontinental_railroad`, sourceName: "Wikipedia" },
  { id: "rome-capital", weight: 2, start: 1870.72, title: "Italy unified with Rome as capital", text: "Italian troops took Rome, completing the unification of Italy.", scope: ["Italy"], kind: "history", source: `${W}Capture_of_Rome`, sourceName: "Wikipedia" },
  { id: "german-empire", weight: 2, start: 1871.05, title: "German Empire founded", text: "The German states united as one empire under Prussia's king.", scope: ["Germany"], kind: "history", source: `${W}Unification_of_Germany`, sourceName: "Wikipedia" },
  { id: "census-1880", start: 1880.42, title: "Census adds relationships", text: "The 1880 census was the first to record each person's relationship to the head of the household.", scope: ["US"], kind: "records", source: "https://www.archives.gov/research/census", sourceName: "U.S. National Archives" },
  { id: "italian-emigration", weight: 2, start: 1880, end: 1914.5, title: "Great wave of Italian emigration", text: "Millions left Italy, most from the south, for the Americas.", scope: ["Italy"], kind: "history", source: `${W}Italian_diaspora`, sourceName: "Wikipedia" },
  { id: "census-1890-lost", start: 1890.42, title: "The 1890 census (later lost)", text: "Most of the 1890 census was destroyed after a fire in 1921, leaving a 20-year gap in census records.", scope: ["US"], kind: "records", source: "https://www.archives.gov/research/census/1890", sourceName: "U.S. National Archives" },
  { id: "ellis-island", weight: 2, start: 1892.0, title: "Ellis Island opens", text: "The federal immigration station in New York Harbor opened. About 12 million people passed through it.", scope: ["US", "NY", "Italy", "Germany", "Ireland", "Sweden", "Poland"], kind: "history", source: `${W}Ellis_Island`, sourceName: "Wikipedia" },
  { id: "world-fair-1904", start: 1904.33, end: 1904.92, title: "World's Fair in St. Louis", text: "The Louisiana Purchase Exposition drew nearly 20 million visitors to St. Louis.", scope: ["MO"], kind: "history", source: `${W}1904_World%27s_Fair`, sourceName: "Wikipedia" },
  { id: "naturalization-1906", start: 1906.74, title: "Naturalization papers standardized", text: "From late 1906, naturalization records used federal forms that usually name the hometown abroad and the ship.", scope: ["US"], kind: "records", source: `${W}Naturalization_Act_of_1906`, sourceName: "Wikipedia" },
  { id: "messina-quake", weight: 2, start: 1908.99, title: "Messina earthquake", text: "An earthquake and tsunami destroyed Messina and Reggio Calabria in southern Italy.", scope: ["Italy"], kind: "history", source: `${W}1908_Messina_earthquake`, sourceName: "Wikipedia" },
  { id: "ww1", weight: 3, start: 1914.58, end: 1918.86, title: "World War I", text: "War in Europe from 1914 to 1918.", scope: ["world"], kind: "history", source: `${W}World_War_I`, sourceName: "Wikipedia" },
  { id: "us-enters-ww1", weight: 2, start: 1917.26, title: "United States enters World War I", text: "The U.S. declared war on Germany in April 1917.", scope: ["US"], kind: "history", source: `${W}American_entry_into_World_War_I`, sourceName: "Wikipedia" },
  { id: "ww1-draft", start: 1917.43, end: 1918.7, title: "World War I draft registration", text: "About 24 million men in the United States filled out draft cards in 1917 and 1918.", scope: ["US"], kind: "records", source: `${W}Selective_Service_Act_of_1917`, sourceName: "Wikipedia" },
  { id: "flu-1918", weight: 2, start: 1918.2, end: 1920.2, title: "Influenza pandemic", text: "A worldwide influenza pandemic killed tens of millions of people.", scope: ["world"], kind: "history", source: `${W}Spanish_flu`, sourceName: "Wikipedia" },
  { id: "19th-amendment", start: 1920.63, title: "Women win the vote nationally", text: "The Nineteenth Amendment gave women the right to vote across the United States.", scope: ["US"], kind: "history", source: `${W}Nineteenth_Amendment_to_the_United_States_Constitution`, sourceName: "Wikipedia" },
  { id: "immigration-1924", weight: 2, start: 1924.4, title: "Immigration Act of 1924", text: "Strict national quotas sharply cut immigration from southern and eastern Europe.", scope: ["US", "Italy", "Poland"], kind: "history", source: `${W}Immigration_Act_of_1924`, sourceName: "Wikipedia" },
  { id: "crash-1929", weight: 1, start: 1929.82, title: "Stock market crash", text: "The October 1929 crash began the Great Depression.", scope: ["US"], kind: "history", source: `${W}Wall_Street_crash_of_1929`, sourceName: "Wikipedia" },
  { id: "depression", weight: 3, start: 1929.82, end: 1939.5, title: "The Great Depression", text: "Years of high unemployment and hardship across the country.", scope: ["US", "world"], kind: "history", source: `${W}Great_Depression`, sourceName: "Wikipedia" },
  { id: "dust-bowl", weight: 2, start: 1930.5, end: 1936.9, title: "The Dust Bowl", text: "Drought and dust storms ruined farms on the southern Plains and sent families west.", scope: ["KS", "OK", "TX", "CO", "NM"], kind: "history", source: `${W}Dust_Bowl`, sourceName: "Wikipedia" },
  { id: "social-security", start: 1935.62, title: "Social Security begins", text: "The Social Security Act created the numbers and applications genealogists use today.", scope: ["US"], kind: "records", source: `${W}Social_Security_Act`, sourceName: "Wikipedia" },
  { id: "ww2", weight: 3, start: 1939.67, end: 1945.67, title: "World War II", text: "War across Europe, Asia and the Pacific from 1939 to 1945.", scope: ["world"], kind: "history", source: `${W}World_War_II`, sourceName: "Wikipedia" },
  { id: "draft-1940", start: 1940.71, title: "Peacetime draft begins", text: "The Selective Training and Service Act required men 21 to 35 to register for the draft.", scope: ["US"], kind: "records", source: `${W}Selective_Training_and_Service_Act_of_1940`, sourceName: "Wikipedia" },
  { id: "pearl-harbor", weight: 3, start: 1941.93, title: "Attack on Pearl Harbor", text: "Japan attacked the U.S. fleet at Pearl Harbor on December 7, 1941, and the United States entered World War II.", scope: ["US"], kind: "history", source: `${W}Attack_on_Pearl_Harbor`, sourceName: "Wikipedia" },
  { id: "mcwr", weight: 2, start: 1943.12, title: "Women join the Marine Corps", text: "The Marine Corps Women's Reserve was formed on February 13, 1943.", scope: ["US"], kind: "history", source: `${W}United_States_Marine_Corps_Women%27s_Reserve`, sourceName: "Wikipedia" },
  { id: "gi-bill", weight: 2, start: 1944.48, title: "GI Bill", text: "Veterans received help paying for college, training and homes.", scope: ["US"], kind: "history", source: `${W}G.I._Bill`, sourceName: "Wikipedia" },
  { id: "ve-day", weight: 2, start: 1945.35, title: "War ends in Europe", text: "Germany surrendered in May 1945.", scope: ["world"], kind: "history", source: `${W}Victory_in_Europe_Day`, sourceName: "Wikipedia" },
  { id: "vj-day", weight: 2, start: 1945.62, title: "War ends in the Pacific", text: "Japan surrendered in August 1945, ending World War II.", scope: ["world", "US"], kind: "history", source: `${W}Victory_over_Japan_Day`, sourceName: "Wikipedia" },
  { id: "census-1950", start: 1950.25, title: "1950 census", text: "Taken in April 1950 and opened to the public in April 2022, 72 years later.", scope: ["US"], kind: "records", source: "https://www.archives.gov/research/census", sourceName: "U.S. National Archives" },
  { id: "korea", weight: 2, start: 1950.48, end: 1953.57, title: "Korean War", text: "U.S. forces fought in Korea from 1950 to 1953.", scope: ["US"], kind: "history", source: `${W}Korean_War`, sourceName: "Wikipedia" },
  { id: "immigration-1965", start: 1965.76, title: "Immigration and Nationality Act", text: "The national-origin quotas of 1924 were ended.", scope: ["US"], kind: "history", source: `${W}Immigration_and_Nationality_Act_of_1965`, sourceName: "Wikipedia" },
];

/** Events that overlap a span of years and touch any of the given scopes. */
export function eventsFor(scopes: string[], from: number, to: number, kinds: HistoryEvent["kind"][] = ["history", "records"]): HistoryEvent[] {
  const want = new Set(["world", ...scopes]);
  return HISTORY.filter((e) => kinds.includes(e.kind) && e.scope.some((s) => want.has(s)) && e.start <= to && (e.end ?? e.start) >= from).sort((a, b) => a.start - b.start);
}
