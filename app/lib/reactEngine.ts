// How Do I React? — a deck of real-life scenario cards.
// Tap your honest first move, get a no-shame read on what it costs and
// gains, a steadier script, and Scripture-based counsel. After three or
// more cards, the picks reveal a reaction lean — the blind-spot finder.
// All deterministic, all local. No scenario involves abuse or danger;
// those get real resources, not practice cards.

export type ReactionStyle = "fire" | "retreat" | "pleaser" | "steady";

export type ReactionOption = {
  text: string;
  style: ReactionStyle;
  /** honest read on what this move usually costs and gains */
  read: string;
};

export type Scenario = {
  id: string;
  emoji: string;
  domain: string;
  title: string;
  setup: string;
  options: ReactionOption[]; // exactly 4, one per style, order varies by card
  better: string; // the steadier way, concrete
  script: string; // words you could actually say
  verse: { ref: string; text: string; principle: string };
};

export const SCENARIOS: Scenario[] = [
  {
    id: "traffic",
    emoji: "🚗",
    domain: "On the road",
    title: "Cut off in traffic",
    setup: "You're running late. A car swerves into your lane with no signal, forcing you to brake hard. The driver doesn't wave, doesn't notice, doesn't care.",
    options: [
      { text: "Lay on the horn, ride their bumper, maybe a gesture", style: "fire", read: "Costs: your calm for the next hour, and a stranger now controls your heart rate. Gains: about two seconds of feeling powerful. The other driver forgets you in a minute — you're the only one still in the fight." },
      { text: "Say nothing, but replay it and stew for miles", style: "retreat", read: "Costs: you didn't honk, but you still gave them the next twenty minutes of your head. Gains: it looks like peace from outside. It isn't — it's the same anger, just parked indoors." },
      { text: "Assume it's your fault somehow — you were probably in their blind spot", style: "pleaser", read: "Costs: you swallow a jolt of adrenaline by blaming yourself for someone else's carelessness. Gains: no conflict — but instant self-blame as a reflex is a habit worth noticing." },
      { text: "Brake, breathe, let them go, and let it end there", style: "steady", read: "Costs: the satisfaction of the horn. Gains: the whole rest of your drive. You can't control their lane changes — only how long they ride in your head." },
    ],
    better: "Build a release valve you decide on ahead of time — a long exhale and one line like “not my cargo.” Rage on the road is the clearest case there is: the offense lasts two seconds, the reaction is the only part you keep.",
    script: "To yourself, out loud if it helps: “They drive their car. I drive mine. Done.”",
    verse: { ref: "Proverbs 19:11", text: "Good sense makes one slow to anger, and it is his glory to overlook an offense.", principle: "Overlooking a stranger's offense isn't weakness — Scripture calls it your glory." },
  },
  {
    id: "credit",
    emoji: "💼",
    domain: "At work",
    title: "Coworker takes credit for your idea",
    setup: "In a meeting, a coworker presents the idea you shared with them last week — as their own. The boss loves it. Everyone's nodding. You're sitting right there.",
    options: [
      { text: "Call it out on the spot: “That was actually my idea”", style: "fire", read: "Costs: even when you're right, the room remembers the awkwardness more than the facts, and you look petty while they look composed. Gains: the record gets corrected — at the highest possible price." },
      { text: "Let it go and quietly decide never to share ideas with them again", style: "retreat", read: "Costs: the credit stays stolen, the resentment compounds, and you start shrinking at work to avoid a repeat. Gains: no scene — but silence teaches them it works." },
      { text: "Congratulate them afterward like nothing happened", style: "pleaser", read: "Costs: you actively reinforce the theft to keep things smooth. They may not even register a line was crossed. Gains: comfort today, invoice later." },
      { text: "Add to it in the moment, then talk to them privately", style: "steady", read: "Costs: a hard private conversation. Gains: you re-enter the story without a scene (“Glad that landed — when I first sketched this, the part I was most excited about was…”), and the direct talk sets the boundary where it belongs." },
    ],
    better: "Two moves: in the meeting, attach yourself to the idea with detail only its author would have. Afterward, go direct and private — most credit-stealing dies when it's named calmly by someone unafraid to name it.",
    script: "Privately: “When you presented the idea I shared with you last week, I didn't hear my name. I want to assume that wasn't intentional — but I need it not to happen again.”",
    verse: { ref: "Matthew 18:15", text: "If your brother sins against you, go, show him his fault between you and him alone.", principle: "Direct and private first — the biblical order for handling an offense is also the one that works." },
  },
  {
    id: "kid-meltdown",
    emoji: "🛒",
    domain: "Parenting",
    title: "Your kid melts down in the store",
    setup: "Aisle five, cart half full. Your child wants the thing, the answer is no, and now it's a full-volume meltdown. Strangers are looking. Your face is hot.",
    options: [
      { text: "Snap — raise your voice right back, threaten the drive home", style: "fire", read: "Costs: now there are two people out of control in aisle five, and the louder one is teaching the smaller one how this is done. Gains: sometimes short-term silence — bought with fear, refunded as distance." },
      { text: "Abandon the cart and get out of there", style: "retreat", read: "Costs: the meltdown learns it can end shopping trips, and you carry the defeat home. Gains: the audience is gone — but escape as a default hands the steering wheel to the loudest person present." },
      { text: "Give in — hand over the thing to stop the noise", style: "pleaser", read: "Costs: you just paid the meltdown, and behavior that gets paid gets repeated. Next trip costs more. Gains: instant quiet, highest interest rate in the store." },
      { text: "Get low, get quiet, hold the no, wait it out", style: "steady", read: "Costs: three of the longest minutes of your week, in public. Gains: the child learns the two things worth learning — big feelings are survivable, and no means no even when it's loud." },
    ],
    better: "The audience is the trap — you start parenting for the strangers instead of the child. Decide now that onlookers get zero votes. Kneel, lower your voice as theirs rises, name the feeling, keep the no.",
    script: "Low and calm: “You're really upset. It's okay to be upset. The answer is still no. I'm right here when you're done.”",
    verse: { ref: "Proverbs 15:1", text: "A gentle answer turns away wrath, but a harsh word stirs up anger.", principle: "Gentleness isn't losing the standoff — it's the only move in the room that de-escalates it." },
  },
  {
    id: "criticized-front",
    emoji: "💔",
    domain: "Marriage & home",
    title: "Your spouse criticizes you in front of others",
    setup: "Dinner with friends. Mid-conversation, your spouse makes a joke at your expense — a real jab dressed as humor. People laugh a little. It stings a lot.",
    options: [
      { text: "Fire back with a sharper jab of your own", style: "fire", read: "Costs: the table just watched your marriage spar, and tonight's ride home is now a fight. Gains: you didn't look weak — you looked wounded and armed, which is worse." },
      { text: "Go quiet for the rest of the night and let the ice do the talking", style: "retreat", read: "Costs: everyone feels the temperature drop, your spouse knows something's wrong but has to guess what, and the actual issue goes unnamed again. Gains: you avoided a scene by becoming one." },
      { text: "Laugh along — even add a self-deprecating line to smooth it over", style: "pleaser", read: "Costs: you just co-signed the jab. Your spouse learns it's fine; it wasn't. Gains: the dinner stays pleasant while something in you quietly keeps score." },
      { text: "Let it pass in the moment, then name it clearly in private", style: "steady", read: "Costs: you carry the sting for an hour without retaliating. Gains: the friends never become an audience to your conflict, and the real conversation happens where it can actually work — at home, just the two of you." },
    ],
    better: "The private conversation is the whole game — most public-jab patterns continue because they never get named. Say what happened, how it landed, and what you're asking for, without a counter-attack attached.",
    script: "Later, calm: “That joke at dinner landed hard on me. I don't think you meant it as a hit, but it was one. Can we keep the jabs out of the room when other people are in it?”",
    verse: { ref: "Ephesians 4:26", text: "Be angry, and don't sin. Don't let the sun go down on your wrath.", principle: "Anger itself isn't the sin — nursing it silently overnight is where it turns." },
  },
  {
    id: "flaky-friend",
    emoji: "📅",
    domain: "Friendship",
    title: "Your friend cancels again — last minute",
    setup: "Third time in a row. You'd blocked the evening, maybe turned down something else. The text comes an hour before: “so sorry, can we rain-check? 🙏”",
    options: [
      { text: "Send the paragraph — every cancellation, itemized, with receipts", style: "fire", read: "Costs: a text fight where you supply years of evidence and they remember one thing: that you blew up. Gains: the frustration gets out — into a format almost guaranteed to go badly." },
      { text: "Reply “no worries!” and quietly stop initiating forever", style: "retreat", read: "Costs: the friendship dies by ghost protocol and they genuinely may never know why. Gains: no confrontation — traded for a slow-motion ending nobody chose out loud." },
      { text: "Reply “no worries!” and keep scheduling like it doesn't bother you", style: "pleaser", read: "Costs: your time keeps getting treated as refundable because you keep marking it refundable. Gains: the friendship stays conflict-free and slightly dishonest." },
      { text: "Tell the truth at friendship temperature — warm and direct", style: "steady", read: "Costs: one uncomfortable text. Gains: the friend gets what real friends deserve — a chance to fix it before you're gone instead of an unexplained fade." },
    ],
    better: "Flakiness continues at exactly the rate it's tolerated. You don't need anger; you need honesty plus a boundary: say it matters, say what's changed, and let your yes-to-plans get scarcer until theirs get solid.",
    script: "“No stress tonight — but real talk: that's three in a row, and I plan around these. I'd rather hear ‘I can't commit right now’ than keep getting cancelled on. What's actually going on?”",
    verse: { ref: "Proverbs 27:6", text: "Faithful are the wounds of a friend.", principle: "The honest, slightly painful word is the loyal one — flattery and silence are what you give people you've given up on." },
  },
  {
    id: "online-insult",
    emoji: "📱",
    domain: "Online",
    title: "A stranger insults you in the comments",
    setup: "You posted something you were a little proud of. Most responses are fine. One is a drive-by: dismissive, personal, designed to sting. It's getting a couple of likes.",
    options: [
      { text: "Draft the devastating reply — you have the perfect comeback", style: "fire", read: "Costs: an evening of refresh-checking a fight with someone who has no stake in your life, on a stage where the algorithm profits from the blood. Gains: maybe you win. Nobody remembers by Thursday, except you." },
      { text: "Delete your post — or think hard about never posting again", style: "retreat", read: "Costs: one stranger's worst sentence just got veto power over your voice. Gains: safety from comments, purchased by shrinking." },
      { text: "Reply apologetically, over-explaining what you really meant", style: "pleaser", read: "Costs: you treat a drive-by as a good-faith critique and audition for the approval of someone who wasn't offering any. Gains: you feel responsive. They weren't asking a question." },
      { text: "Don't feed it — mute or block, and let the post stand", style: "steady", read: "Costs: the comeback goes unused, which genuinely hurts for about an hour. Gains: your evening, your post still standing, and the quiet upgrade of being someone strangers can't rent space from." },
    ],
    better: "Apply the two-filter test before replying to anyone online: Is it true? (then take the note, discard the tone) — Is this person invested in my good? (if not, they get no seat at the table). A stranger's contempt is weather, not verdict.",
    script: "The winning reply, typed nowhere: nothing. If it's someone you'll see again: “Happy to hear a real critique — this wasn't one.” Then done.",
    verse: { ref: "Proverbs 12:16", text: "A fool shows his annoyance the same day, but one who overlooks an insult is prudent.", principle: "Speed of retaliation is the fool's tell; the strong can afford to leave an insult on the ground." },
  },
  {
    id: "borrow-money",
    emoji: "💸",
    domain: "Family & money",
    title: "A family member asks to borrow money — again",
    setup: "They still owe you from last time. Now there's a new emergency, a new promise to pay you back, and that look. You love them. You're also tired of this.",
    options: [
      { text: "Unload — the ledger of every unpaid loan, years of it", style: "fire", read: "Costs: the money issue becomes a character trial, they leave as the victim of your outburst, and the family retells that version. Gains: years of pressure vents — onto the relationship instead of the problem." },
      { text: "Dodge — “let me think about it,” then screen their calls", style: "retreat", read: "Costs: they'll ask again because no didn't happen, and now there's avoidance stacked on resentment. Gains: you skip today's discomfort by renting it for next week." },
      { text: "Give it again, tell yourself it's fine, feel the resentment interest accrue", style: "pleaser", read: "Costs: money you may not have, a pattern you're funding, and love that's slowly converting into scorekeeping. Gains: you feel generous for a day. Resentment is generosity's invoice when the yes wasn't honest." },
      { text: "Decide your real answer first, then give it with love and no loophole", style: "steady", read: "Costs: saying an actual no (or a bounded yes) to a face you love. Gains: the relationship gets protected from the slow poison — which was never the money, it was the unsaid things about the money." },
    ],
    better: "Decide alone, before you answer — pressure makes terrible loans. If you give, consider giving it as a gift you never mention again (protects the relationship from the debt). If you can't gift it freely, the honest answer is no. A loan you'll resent is a no wearing a yes.",
    script: "“I love you, and I have to be straight: I can't lend again while the last one's open. If you're in real trouble, let's sit down and look at the whole picture together — that I'll gladly do.”",
    verse: { ref: "Matthew 5:37", text: "Let your ‘yes’ be ‘yes’ and your ‘no’ be ‘no.’", principle: "A clear, loving no honors people more than a resentful yes — clarity is a form of kindness." },
  },
  {
    id: "blamed",
    emoji: "🎯",
    domain: "At work",
    title: "You get blamed for something you didn't do",
    setup: "Something broke, a deadline died, a client's upset — and in the retelling, it's landing on you. Except it wasn't you, and you can partly prove it.",
    options: [
      { text: "Get loud now — interrupt, name the real culprit, demand a retraction", style: "fire", read: "Costs: hot defensiveness reads as guilt to a room that doesn't know the facts yet, and naming the culprit angrily makes it a war. Gains: speed. Accuracy and allies both suffer." },
      { text: "Say nothing and hope the truth surfaces on its own", style: "retreat", read: "Costs: unanswered blame hardens into record — in three months no one recalls the details, only the association. Gains: you avoid one awkward moment and inherit a reputation dent that compounds." },
      { text: "Absorb it — “yeah, I probably could've caught that” — to end the tension", style: "pleaser", read: "Costs: you just confessed to something you didn't do because the room felt uncomfortable. The real cause goes unfixed, and you become the designated absorber. Gains: tension drops. Onto you." },
      { text: "Correct the record calmly, with facts and without heat", style: "steady", read: "Costs: you have to speak clearly while unfairly accused — genuinely hard. Gains: facts delivered without drama are the most believable objects in any room, and rooms remember who stayed calm while wrongly blamed." },
    ],
    better: "Separate the two jobs: correct the record (facts, timeline, receipts — no adjectives) and solve the problem (“here's what I'd suggest so it can't recur”). Doing both calmly makes you look like the opposite of the accusation.",
    script: "“I want to correct the timeline, because it matters for fixing this: the handoff happened on the 12th, before I had it — here's the thread. More important: here's how we keep it from happening again.”",
    verse: { ref: "1 Peter 2:23", text: "When he was reviled, he did not revile in return… but continued entrusting himself to him who judges justly.", principle: "You can defend the truth without avenging yourself — state facts, skip vengeance, trust the long game." },
  },
  {
    id: "inlaw-advice",
    emoji: "👵",
    domain: "Family",
    title: "The in-law critiques your parenting — again",
    setup: "Family gathering. Your kid does a normal kid thing, and here it comes: “Well, in MY day, we never let children…” — with that tone, in front of everyone.",
    options: [
      { text: "Finally let them have it — years of comments, answered at once", style: "fire", read: "Costs: you become the story of the gathering, your spouse is now between two fires, and the actual point drowns in the delivery. Gains: it's out. So is the shrapnel." },
      { text: "Go quiet, leave early, dread the next five gatherings", style: "retreat", read: "Costs: the comments continue at full volume forever, and family events become something you brace for. Gains: no confrontation — the tax is paid in dread, every holiday, indefinitely." },
      { text: "“You're so right, we'll try that!” — appease and redirect", style: "pleaser", read: "Costs: agreement is fertilizer for unwanted advice; it grows back bigger. And your kids are watching you outsource your authority. Gains: a smooth afternoon on a subscription plan." },
      { text: "One line, light but solid, that closes the topic without a fight", style: "steady", read: "Costs: it takes nerve to be direct with an elder in front of the family. Gains: delivered warmly, it ends the pattern more often than any blow-up — boundary people feel but can't take offense at." },
    ],
    better: "Have the line rehearsed before the gathering — in the moment is too late to draft. Warm tone, zero defensiveness, topic closed. If it persists, your spouse talking to their own parent privately beats you fighting your in-law publicly.",
    script: "With a smile, unhurried: “I know it looks different from how you did it — we've thought hard about this one and we're good. So — how's the garden doing?”",
    verse: { ref: "Romans 12:18", text: "If it is possible, as much as it depends on you, be at peace with all men.", principle: "“As much as it depends on you” — you own your tone and boundary, not their approval of it." },
  },
  {
    id: "slow-service",
    emoji: "🍔",
    domain: "Out in public",
    title: "Wrong order, long wait, teenager at the counter",
    setup: "Forty minutes, the order's wrong, you're hungry, and the person at the register is nineteen and clearly having the worst shift of their week. Behind you, a line.",
    options: [
      { text: "Make it their problem — voice raised, manager demanded", style: "fire", read: "Costs: you extract your frustration from someone with no power over the kitchen, publicly, over a sandwich. Everyone in line takes a photo of your character. Gains: possibly faster fries." },
      { text: "Say nothing, eat the wrong order, resent it", style: "retreat", read: "Costs: you paid for something you didn't get and then punished yourself for their mistake. Gains: no interaction — plus a small lesson to yourself that your reasonable claims don't merit a sentence." },
      { text: "“Oh no, it's fine, totally fine!” — while visibly disappointed", style: "pleaser", read: "Costs: it isn't fine, they can tell it isn't fine, and now they carry vague guilt while you carry a wrong order. Nobody was actually served. Gains: you feel polite. Honest-and-kind was on the menu." },
      { text: "Fix the problem, spare the person", style: "steady", read: "Costs: nothing, honestly. Gains: correct food and a moment where the most stressed person in the room gets treated like a human — the cheapest character rep there is." },
    ],
    better: "Separate the claim from the blame. You're fully entitled to the right order; the kid is not the kitchen. How you treat waitstaff on a bad day is one of the truest public readings of character anyone gets.",
    script: "“Hey, no stress — rough night in here, I can tell. This one came out wrong; can we get it fixed whenever you get a second? Thanks for hanging in there.”",
    verse: { ref: "Colossians 3:12", text: "Put on therefore, as God's chosen ones, holy and beloved, a heart of compassion, kindness, lowliness, humility, and perseverance.", principle: "Kindness under inconvenience is the everyday uniform of character — worn where nobody's forcing you to." },
  },
  {
    id: "group-chat",
    emoji: "💬",
    domain: "Online",
    title: "The group text turns political and hot",
    setup: "The family or friend group chat. Somebody drops a take, somebody bites, and now it's escalating in a thread you can't unsee — with people you'll be at a table with next month.",
    options: [
      { text: "Enter the arena — you have facts and you're not wasting them", style: "fire", read: "Costs: nobody in group-chat history has ever conceded there, so you buy a multi-day thread war and an awkward next dinner at retail price. Gains: your side got represented. To an audience of the already-decided." },
      { text: "Mute the thread and quietly think less of everyone in it", style: "retreat", read: "Costs: the mute works; the silent resentment doesn't — you're grading people on a debate they don't know you're scoring. Gains: peace on the screen, erosion underneath." },
      { text: "Post a frantic peacemaking meme to change the subject", style: "pleaser", read: "Costs: usually steamrolled by the next hot reply, and you've made the chat's temperature your personal responsibility. Gains: occasionally it works. The pattern of you as designated defuser also sets." },
      { text: "Stay out of the thread; take the one relationship that matters offline", style: "steady", read: "Costs: the discipline of watching wrongness go unanswered — real discipline. Gains: threads convince no one, but a walk or a call with the one person you actually care about sometimes does. Different court, real game." },
    ],
    better: "Decide your policy before the next flare-up: hot threads get nothing from you; hot people you love get coffee. Persuasion has never once traveled through a group text — affection sometimes has.",
    script: "If pulled in directly: “Too much love for you guys to do this over text 😄 — happy to argue in person where you can't mute me. Who's up for coffee?”",
    verse: { ref: "Proverbs 17:14", text: "The beginning of strife is like breaching a dam; therefore stop contention before quarreling breaks out.", principle: "The dam-breach is the moment to walk away — quarrels are easiest to win before they start." },
  },
  {
    id: "gossip",
    emoji: "🗣️",
    domain: "Friendship",
    title: "You find out a friend has been talking about you",
    setup: "It gets back to you — a friend has been saying things behind your back. Not devastating things, but unkind, and to people you both know. The sting is real.",
    options: [
      { text: "Confront hot, today, receipts out — possibly in the group", style: "fire", read: "Costs: confronting gossip with a public blow-up hands the audience a better story than the gossip was. Secondhand words also arrive pre-distorted; you may be avenging a sentence that wasn't said that way. Gains: velocity, mostly in the wrong direction." },
      { text: "Say nothing to them — but downgrade the friendship silently and permanently", style: "retreat", read: "Costs: they get convicted without a trial in a court they don't know exists, and you lose a maybe-repairable friendship to a maybe-mangled quote. Gains: no confrontation, no facts either." },
      { text: "Be extra nice to them so they'll have only good things to say next time", style: "pleaser", read: "Costs: performing for your own gossip coverage is exhausting, and it quietly confirms you'll absorb disrespect. Gains: surface warmth over a growing cold spot." },
      { text: "Go to them directly, alone, with the question instead of the verdict", style: "steady", read: "Costs: the most awkward conversation on this list. Gains: the truth — either an account that makes them own it and often ends the pattern, or a real apology, or clarity that the telephone-game garbled it. All three beat guessing." },
    ],
    better: "Take it to the source before the verdict — with a question, not an accusation. What you heard is a secondhand copy. Real friendships survive this conversation; the ones that can't survive honesty were already thinner than they looked.",
    script: "Alone, even-toned: “Something got back to me — that you've been saying X. I'd rather hear it from you than believe a rumor about a friend. What happened?”",
    verse: { ref: "Matthew 18:15", text: "If your brother sins against you, go, show him his fault between you and him alone. If he listens to you, you have gained back your brother.", principle: "Alone and direct — the goal of confrontation is to gain the person back, not to win the case." },
  },
  {
    id: "friday-dump",
    emoji: "🕔",
    domain: "At work",
    title: "Boss drops urgent work on you at 4:55 Friday",
    setup: "Weekend plans set. At 4:55 the message lands: “Need this by Monday morning — shouldn't take long.” It will take long. This is the third Friday it's happened.",
    options: [
      { text: "Vent — a heated reply about respect and boundaries, sent at 4:57", style: "fire", read: "Costs: a heated message written in the first five minutes of anger is the least persuasive document you'll produce all year, and it's now in writing, at work. Gains: release now, cleanup later." },
      { text: "Say nothing, do the work, spend the weekend resentful — again", style: "retreat", read: "Costs: silence votes yes. From the boss's chair the Friday drop looks fine — you've absorbed all the evidence it isn't. The pattern is now co-authored. Gains: you look flexible while the resentment compounds off-books." },
      { text: "“Absolutely, no problem!” — with the enthusiasm of the promotable", style: "pleaser", read: "Costs: you've branded weekend availability as your personality; unwinding that later reads as decline. The eager yes teaches most expensively. Gains: points today, at the price of every future Friday." },
      { text: "Do this one if truly needed — but flag the pattern, in daylight, next week", style: "steady", read: "Costs: a slightly brave conversation with someone who controls your paycheck. Gains: bosses reliably respond better to a calm pattern-flag with a proposed fix than anyone expects — and mostly they'd simply never counted the Fridays. Now they have." },
    ],
    better: "Don't fight the fire on Friday at 4:55 — fight the pattern on Tuesday at 10. Bring the count, not the feelings, plus a fix: “If Monday-morning items could reach me by Thursday, they'll get better work.” Pattern-plus-proposal is the adult flex.",
    script: "Next week, calm: “Quick process thing — the last three Fridays had end-of-day drops for Monday. I'll always handle a true emergency, but if these could land by Thursday, the work will be better and I'm not choosing between the job and my family on Friday nights.”",
    verse: { ref: "James 1:19", text: "Let every man be swift to hear, slow to speak, and slow to anger.", principle: "Slow to speak isn't never speaking — it's choosing Tuesday's clear words over Friday's hot ones." },
  },
];

// ---- reaction lean (the blind-spot finder) ----

export type StyleTallies = Record<ReactionStyle, number>;

export const STYLE_INFO: Record<ReactionStyle, { emoji: string; name: string; short: string; read: string; growth: string; verse: { ref: string; text: string } }> = {
  fire: {
    emoji: "🔥",
    name: "Fire",
    short: "You meet it head-on, fast and hot.",
    read: "Your first move under provocation is forward — fast, direct, sometimes loud. The strength inside it is real: you don't hide, you don't stew, and people always know where you stand. The cost is that speed and heat make your point easier to dismiss, and the fight often outlives the issue.",
    growth: "You rarely need less courage — just more clock. Almost everything you'd say hot works better said calm, and you're one deep breath away from being genuinely formidable instead of just loud. Try one beat of silence before the first sentence.",
    verse: { ref: "Proverbs 16:32", text: "One who is slow to anger is better than the mighty; one who rules his spirit, than he who takes a city." },
  },
  retreat: {
    emoji: "🧊",
    name: "Retreat",
    short: "You pull back, go quiet, and carry it internally.",
    read: "Your first move is away — silence, distance, the long private replay. The strength inside it is real: you don't escalate, and you give yourself time to think. The cost is that the issue never gets a voice, so nothing changes, and the people involved often never learn there was a problem — while you keep paying for it alone.",
    growth: "Your instinct to not make it worse is valuable — the missing piece is the return trip. Retreat to cool off, then come back and say the thing. One honest sentence delivered late still beats a hundred rehearsed in silence.",
    verse: { ref: "Ephesians 4:15", text: "Speaking truth in love, we may grow up in all things into him." },
  },
  pleaser: {
    emoji: "🤝",
    name: "Pleaser",
    short: "You smooth it over and absorb the cost yourself.",
    read: "Your first move is toward harmony — agree, apologize, absorb, keep the peace. The strength inside it is real: rooms are genuinely better with a peacemaker in them. The cost is that the peace is often purchased with your own unspoken account, and people learn your yes is automatic — which quietly devalues it.",
    growth: "You don't need to become harder — you need your kindness to include yourself. Practice the warm no: same friendly tone you already have, different answer. The people worth keeping will adjust within a week.",
    verse: { ref: "Matthew 5:37", text: "Let your ‘yes’ be ‘yes’ and your ‘no’ be ‘no.’" },
  },
  steady: {
    emoji: "⚓",
    name: "Steady",
    short: "You hold position — calm, direct, measured.",
    read: "Your picks lean toward the steady move — pause first, go direct, keep the person and the problem separate. Either that's genuinely how you operate, or it's how you'd like to operate; both are worth knowing. The honest check: is this what you actually do at full temperature, or what you do on a quiz?",
    growth: "If it's real, guard it — steady is a discipline, not a trait, and it erodes without practice. And watch steady's one blind spot: calm can drift into detached. Some moments need your heart visible, not just your composure.",
    verse: { ref: "Proverbs 25:28", text: "Like a city that is broken down and without walls is a man whose spirit is without restraint." },
  },
};

export function leanFromTallies(t: StyleTallies): { style: ReactionStyle; count: number; total: number } | null {
  const total = t.fire + t.retreat + t.pleaser + t.steady;
  if (total < 3) return null;
  const entries = (Object.keys(t) as ReactionStyle[]).map((k) => ({ style: k, count: t[k] }));
  entries.sort((a, b) => b.count - a.count);
  if (entries[0].count === entries[1].count) return null; // no clear lean yet
  return { style: entries[0].style, count: entries[0].count, total };
}

// ---- open-ended AI continuation ----

export function reactAIPrompt(s: Scenario, picked: ReactionOption): string {
  return [
    "I just worked through a reaction scenario on WhatAmIAI.com and I want to go deeper with you.",
    "",
    `The situation: ${s.setup}`,
    `My honest first instinct was: "${picked.text}"`,
    "",
    "Ground rules for this conversation:",
    "- Be positive and practical — no shame, no lecturing.",
    "- Counsel me from a biblical perspective where it fits, gently.",
    "- Ask me one question at a time about the real version of this in my life.",
    "- Don't diagnose me or label me. Help me think, then help me pick one small next step.",
    "- If anything I describe involves safety, abuse, or crisis, point me to real human help first.",
    "",
    "Start by asking me what real situation in my life this scenario reminded me of.",
  ].join("\n");
}
