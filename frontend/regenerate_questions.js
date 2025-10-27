const fs = require('fs');
const path = require('path');

// Read flashcards and MCQs
const flashcards = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'flashcards.json'), 'utf8'));
const mcqs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'mcq.json'), 'utf8'));

// Map subarea names to IDs
const subareaMap = {
  'Meaning & Communication': 'SA-1',
  'Literature & Understanding': 'SA-2',
  'Genre & Craft': 'SA-3',
  'Skills & Processes': 'SA-4'
};

// Convert flashcards to unified format
const flashcardQuestions = flashcards.map(card => ({
  id: card.id,
  subarea: card.subarea,
  subareaId: subareaMap[card.subarea] || 'SA-1',
  objective: card.objective,
  question: card.question,
  answer: card.answer,
  explanation: card.explanation,
  difficulty: card.difficulty,
  tags: card.tags,
  mode: 'Learn',
  type: 'flashcard',
  options: [] // Empty for flashcards
}));

// Convert MCQs to unified format
const mcqQuestions = mcqs.map(mcq => ({
  id: mcq.id,
  subarea: mcq.subarea,
  subareaId: subareaMap[mcq.subarea] || 'SA-1',
  objective: mcq.objective,
  question: mcq.stem, // Map stem to question
  stem: mcq.stem,
  options: mcq.options,
  answer: mcq.options[mcq.correctIndex], // Add answer field from correct option
  correctIndex: mcq.correctIndex,
  rationales: mcq.rationales,
  difficulty: mcq.difficulty,
  mode: 'Drill',
  type: 'mcq'
}));

// Combine both arrays
const allQuestions = [...flashcardQuestions, ...mcqQuestions];

// Write to questions.json
fs.writeFileSync(
  path.join(__dirname, 'data', 'questions.json'),
  JSON.stringify(allQuestions, null, 2),
  'utf8'
);

console.log(`Successfully generated questions.json with ${allQuestions.length} questions:`);
console.log(`- ${flashcardQuestions.length} flashcards`);
console.log(`- ${mcqQuestions.length} MCQs`);
