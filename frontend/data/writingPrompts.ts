// MTTC-Style Writing Prompts for Constructed Response Practice

export interface WritingPrompt {
  id: string;
  label: string;
  subarea: string;
  promptText: string;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "CR_001",
    label: "Analyze student writing: organization",
    subarea: "II – Meaning & Communication",
    promptText: `Read the student paragraph below:

"In this story, the main character learns a lot. At the beginning, he is mean and selfish. Then things happen to him. In the end, he is nicer and people like him more. This shows that people can change if they really want to."

Write a response in which you:
• Evaluate the organization and coherence of the paragraph.
• Explain ONE revision that would most improve the paragraph's clarity and flow.
• Use specific references to the paragraph in your explanation.`
  },
  {
    id: "CR_002",
    label: "Audience & purpose in an essay",
    subarea: "I – Meaning & Communication",
    promptText: `A student is writing an argumentative essay about whether schools should require community service for graduation.

Write a response in which you:
• Explain how the student should adjust tone, word choice, and supporting details when writing for:
  (a) school administrators and
  (b) classmates.
• Identify ONE specific strategy for each audience that would make the essay more effective.`
  },
  {
    id: "CR_003",
    label: "Analyze rhetorical choices in a speech",
    subarea: "III – Oral & Written Communication",
    promptText: `A speech about climate change begins with a personal anecdote, then presents statistics, and finally ends with a call to action.

Write a response in which you:
• Explain how the structure of the speech supports its purpose.
• Evaluate the effectiveness of using anecdote, statistics, and call to action.
• Suggest ONE improvement that could strengthen the speech for a high school audience.`
  }
];
