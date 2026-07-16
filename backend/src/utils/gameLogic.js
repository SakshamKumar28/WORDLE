import fs from "node:fs";
import wordListPath from "word-list";

const wordArray = fs.readFileSync(wordListPath, "utf-8").split("\n");
const fiveLetterWords = wordArray.filter((word)=> word.length === 5);

console.log(`Loaded ${fiveLetterWords.length} words from the word list.`);

export const getRandomWord = ()=>{
    return fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)];
}

export const checkGuess = (guess, secretWord) => {
  const result = Array(5).fill('absent'); // 'absent' = gray
  const secretLetters = secretWord.toUpperCase().split('');
  const guessLetters = guess.toUpperCase().split('');

  // First pass: Find exact matches (Green)
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === secretLetters[i]) {
      result[i] = 'correct';
      secretLetters[i] = null; // Mark as used so we don't count it again for yellows
    }
  }

  // Second pass: Find wrong position matches (Yellow)
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'correct' && secretLetters.includes(guessLetters[i])) {
      result[i] = 'present';
      secretLetters[secretLetters.indexOf(guessLetters[i])] = null; // Mark as used
    }
  }

  return result;
};