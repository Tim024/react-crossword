import React, { useState, useEffect } from "react";
import "./App.css";
import seedrandom from "seedrandom";

import words from "./words.json";
// import words from "./words_test.json";
import sesLogo from './asset/ses-logo.png'; // Adjust the path as necessary

import { CrosswordGenerator, selectRandomEntries } from "./CrosswordGenerator";

// const crosswordSolution = {
//   gridSolutions: [
//     {
//       x: 0,
//       y: 0,
//       direction: "right",
//       clue: "A popular JavaScript library for building user interfaces",
//       answer: "REACT",
//     },
//     {
//       x: 0,
//       y: 0,
//       direction: "down",
//       clue: "The process of making something smaller in size",
//       answer: "REDUCE",
//     },
//     {
//       x: 2,
//       y: 0,
//       direction: "down",
//       clue: "A type of monkey",
//       answer: "APE",
//     },
//   ],
//   gridXLength: 5,
//   gridYLength: 6,
// };

function App() {
  // State for the crossword puzzle generation
  const [crosswordSolution, setCrosswordSolution] = useState(null);
  const [grid, setGrid] = useState([]);

  // Generate crossword puzzle only once using useEffect hook on component mount
  useEffect(() => {
    const today = new Date();
    const dailySeed =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      today.getDate().toString().padStart(2, "0");
    const rng = seedrandom(Number(dailySeed));

    const crosswordGen = new CrosswordGenerator();
    const selectedEntries = selectRandomEntries(rng, words, 11);

    console.log(words.length);
    selectedEntries.forEach((word) => {
      //lowercase the answer
      word.answer = word.answer.toLowerCase();
      // Select a random clue from the list of clues based on the seed
      const nClues = word.clues.length;
      if (nClues >= 1) {
        word.clue = word.clues[Math.floor(rng() * nClues)];
      } else {
        word.clue = "No clue.";
      }
    });
    // TODO: Remove the words with less than 4 characters, it breaks the placement method..
    const solution = crosswordGen.generate(selectedEntries);

    setCrosswordSolution(solution);

    // Initialize grid based on the generated solution
    const initializedGrid = Array.from({ length: solution.gridYLength }, () =>
      Array.from({ length: solution.gridXLength }, () => ({
        value: "",
        clueIndices: [],
        isVisible: false,
      }))
    );

    // Assuming you have a way to fill the initializedGrid based on crosswordSolution.gridSolutions
    solution.gridSolutions.forEach((placedWord, idx) => {
      const length = placedWord.answer.length;
      for (let i = 0; i < length; i++) {
        const x = placedWord.x + (placedWord.direction === "right" ? i : 0);
        const y = placedWord.y + (placedWord.direction === "down" ? i : 0);
        // console.log(y,x,placedWord.answer[i])
        initializedGrid[y][x].isVisible = true;
      }
      initializedGrid[placedWord.y][placedWord.x].clueIndices.push(idx + 1);
    });

    setGrid(initializedGrid);
  }, []);

  // Early return if crosswordSolution is not yet set
  if (!crosswordSolution) {
    return <div>Loading crossword puzzle...</div>;
  }

  const handleInputChange = (value, x, y) => {
    const newGrid = [...grid];
    newGrid[y][x].value = value.toUpperCase();
    setGrid(newGrid);
  };

  const checkAnswers = () => {
    const nCorrectWords = crosswordSolution.gridSolutions.filter((solution) => {
      const { x, y, direction, answer } = solution;
      return [...answer.toLowerCase()].every((char, index) => {
        // Convert answer to lower case
        const currentX = direction === "right" ? x + index : x;
        const currentY = direction === "down" ? y + index : y;
        return grid[currentY][currentX].value.toLowerCase() === char; // Compare ignoring case
      });
    }).length;
    const nAnswers = crosswordSolution.gridSolutions.length;

    const isCorrect = nCorrectWords === nAnswers;

    alert(
      isCorrect
        ? "Congratulations, all answers are correct! See you tomorrow for a new crossword puzzle."
        : "You have " +
            nCorrectWords +
            " out of " +
            nAnswers +
            " correct answers."
    );
  };



  return (
    <div className="App">
      
      <img src={sesLogo} alt="SES Logo" className="ses-logo" />
      <div className="crossword-header">
        <h1>Daily Crossword</h1>
      </div>

      <div className="crossword-grid">
        {grid.map((row, y) => (
          <div key={y} className="crossword-row">
            {row.map((cell, x) => (
              <div key={`${y}-${x}`} className="crossword-cell-wrapper">
                <input
                  type="text"
                  maxLength="1"
                  value={cell.value}
                  onChange={(e) => handleInputChange(e.target.value, x, y)}
                  className={`crossword-cell ${
                    cell.isVisible ? "" : "invisible"
                  }`}
                />
                {cell.clueIndices.length > 0 && (
                  <span className="clue-index">
                    {cell.clueIndices.join(",")}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="crossword-clues">
        {crosswordSolution.gridSolutions.map((solution, index) => (
          <div key={index} className="crossword-clue">
            <div className="clue-indicator"> {index + 1} {solution.direction === "right" ? "→" : "↓"}: </div>{solution.clue}
          </div>
        ))}
      </div>
      <button onClick={checkAnswers}>Check Answers</button>
      <div className="crossword-footer">
        Source code: <a href="https://dev.azure.com/SES-CCoE/SES-codelab/_git/crossword">Codelab</a>
      </div>
    </div>
  );
}

export default App;
