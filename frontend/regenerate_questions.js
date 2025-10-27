const fs = require('fs');
const path = require('path');

// Read flashcards and MCQs
const flashcards = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'flashcards.json'), 'utf8'));
const mcqs = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'mcq.json'), 'utf8'));

// Convert flashcards to unified format
const flashcardQuestions = flashcards.map(card => ({
  id: card.id,
  subarea: card.subarea,
  objective: card.objective,
  question: card.question,
  answer: card.answer,
  explanation: card.explanation,
  difficulty: card.difficulty,
  tags: card.tags,
  mode: 'Learn',
  type: 'flashcard'
}));

// Convert MCQs to unified format
const mcqQuestions = mcqs.map(mcq => ({
  id: mcq.id,
  subarea: mcq.subarea,
  objective: mcq.objective,
  stem: mcq.stem,
  options: mcq.options,
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
