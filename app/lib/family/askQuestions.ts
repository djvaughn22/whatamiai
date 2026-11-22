// "Ask a relative": questions that bring out a living relative's stories.
// What they tell you is a Family memory in My Family (evidence level
// "recollection"): worth keeping, not yet backed by a record. Written for
// families of every background and belief; questions that assume a marriage
// or children start with "If" (locked in askQuestions.test.ts).

export type AskSet = { id: string; title: string; questions: string[] };

export const ASK_TIPS: string[] = [
  "Ask first. Check that it's okay to write down or record what they tell you, and who may see it.",
  "Keep it short. One sitting, one topic. Stop while it's still fun.",
  "Bring something to look at: an old photo, a letter, a recipe card. Things bring memories back.",
  "Write names, places and dates the way they say them, spelling included. You can check them against records later.",
  "Some memories are painful. It's fine to skip a question or come back to it another day.",
];

export const ASK_SETS: AskSet[] = [
  {
    id: "growing-up",
    title: "Growing up",
    questions: [
      "Where and when were you born?",
      "Who lived in your home when you were small?",
      "What do you remember about the house and the street you grew up on?",
      "What did your parents do for work?",
      "What is your earliest memory?",
      "What did you do for fun as a kid?",
    ],
  },
  {
    id: "roots",
    title: "Names and roots",
    questions: [
      "What were your grandparents' names, and where did they live?",
      "Do you know where the family lived before that, in this country or another?",
      "Did anyone in the family change their name or go by a nickname?",
      "Who in the family kept the photos, letters, papers or a family Bible?",
      "Is there a family story that everyone tells?",
    ],
  },
  {
    id: "school-work",
    title: "School and first jobs",
    questions: [
      "Where did you go to school, and how did you get there each day?",
      "Which teacher or friend do you still think about?",
      "What did you want to be when you grew up?",
      "What was your first job, and what did it pay?",
      "What did everyday things cost back then?",
    ],
  },
  {
    id: "love-family",
    title: "Love and family",
    questions: [
      "If you married or had a partner, how did you meet?",
      "If you married, what do you remember about the day?",
      "If you had children, what do you remember about the days they were born?",
      "What holidays and traditions did your family keep?",
      "What did your family cook for special days, and who made it best?",
    ],
  },
  {
    id: "work-moves",
    title: "Work and moves",
    questions: [
      "What jobs did you have, and which one did you like most?",
      "Did you ever move far from home? What made you go?",
      "Did you or someone close to you serve in the military?",
      "What was the biggest change you lived through?",
    ],
  },
  {
    id: "hard-good",
    title: "Hard times and good times",
    questions: [
      "What was a hard time in your life, and what helped you through it?",
      "Who could you always count on?",
      "What news or world event do you remember most, and where were you when you heard it?",
      "What are you proudest of?",
    ],
  },
  {
    id: "what-matters",
    title: "What matters",
    questions: [
      "Was faith or a place of worship part of your life growing up? What do you remember about it?",
      "What did your parents teach you that you still believe?",
      "What do you hope the family remembers about you?",
      "What would you want the generations after you to know?",
    ],
  },
];

export const ASK_COUNT = ASK_SETS.reduce((n, s) => n + s.questions.length, 0);
