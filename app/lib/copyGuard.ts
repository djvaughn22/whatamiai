// Lightweight guard against product-authored overreach: claims of hidden
// motives, permanence, identity, or diagnosis. Runs in tests over the
// COMPOSED output of every engine. User-supplied wording inside curly
// quotes is exempt — quoting a person accurately is allowed; asserting the
// same thing in the product's own voice is not.

export const BANNED_PRODUCT_CLAIMS: { name: string; re: RegExp }[] = [
  { name: "you always/never", re: /\byou (always|never)\b/i },
  { name: "deep down", re: /\bdeep down\b/i },
  { name: "the real reason", re: /\bthe real reason\b/i },
  { name: "you secretly", re: /\byou('re| are)? secretly\b/i },
  { name: "you clearly/obviously", re: /\byou (clearly|obviously)\b/i },
  { name: "type of person", re: /\btype of person\b/i },
  { name: "wired to", re: /\bwired to\b/i },
  { name: "born to be", re: /\bborn to be\b/i },
  { name: "subconscious", re: /\bsubconscious\w*\b/i },
  { name: "this proves", re: /\bthis proves\b/i },
  { name: "what you're really doing", re: /\bwhat you('re| are) (really|actually) doing\b/i },
  { name: "who you really are", re: /\bwho you really are\b/i },
  { name: "hidden/true self", re: /\b(hidden self|true self)\b/i },
  { name: "assigned clinical state", re: /\byou (are|sound|seem|look) (anxious|depressed|addicted|traumatized|narcissistic|bipolar)\b/i },
  { name: "assigned diagnosis", re: /\byou (have|suffer from) (anxiety|depression|adhd|ocd|ptsd|trauma|an addiction|a disorder|an eating disorder)\b/i },
  { name: "attachment style", re: /\b(anxious|avoidant|secure|disorganized) attachment\b/i },
  { name: "empath/narcissist label", re: /\byou('re| are) (an empath|a narcissist)\b/i },
];

/** Replace user-quoted spans so quoted words are never flagged. */
export function stripUserQuotes(text: string): string {
  return text.replace(/“[^”]*”/g, "“…”");
}

/** Names of banned claim patterns found in product-authored text. */
export function findBannedClaims(text: string): string[] {
  const t = stripUserQuotes(text);
  return BANNED_PRODUCT_CLAIMS.filter((b) => b.re.test(t)).map((b) => b.name);
}
