const Direction = {
  RIGHT: "right",
  DOWN: "down",
};

const GRID_X_SIZE = 14;
const GRID_Y_SIZE = 14;
const EMPTY = "-";

class CrosswordGenerator {
  constructor() {
    this.topSolutionsWithScores = []; // Array of { solution: Array of PlacedWord, score: 0 }
  }

  placeWord(x, y, word, direction, grid) {
    // Place a word on a new grid, returns the new grid
    let new_grid = grid.map((row) => row.map((cell) => cell));
    if (direction === Direction.RIGHT) {
      for (let i = 0; i < word.length; i++) new_grid[y][x + i] = word[i];
    } else {
      for (let i = 0; i < word.length; i++) new_grid[y + i][x] = word[i];
    }
    return new_grid;
  }

  canPlaceWord(x, y, word, direction, solution, grid) {
    // Check if the word fits in the grid and doesn't collide with other words
    if (direction === Direction.RIGHT) {
      if (x + word.length > GRID_X_SIZE || x < 0) return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[y][x + i] !== EMPTY && grid[y][x + i] !== word[i])
          return false;
      }
    } else {
      if (y + word.length > GRID_Y_SIZE || y < 0) return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[y + i][x] !== EMPTY && grid[y + i][x] !== word[i])
          return false;
      }
    }

    // Additional checks for interference with other words already placed
    for (let placedWord of solution) {
      let px = placedWord.x;
      let py = placedWord.y;
      let pword = placedWord.answer;
      let pdirection = placedWord.direction;

      if (pdirection === Direction.RIGHT && direction === Direction.RIGHT) {
        // If the placed word and the word to place are written in the right direction,
        // Cancel if the words' x ranges overlap and y are within 1
        if (
          Math.abs(y - py) <= 1 &&
          ((x - 1 <= px && px < x + word.length + 1) ||
            (px - 1 <= x && x < px + pword.length + 1))
        ) {
          return false;
        }
      } else if (
        pdirection === Direction.DOWN &&
        direction === Direction.DOWN
      ) {
        // If the placed word and the word to place are written in the down direction,
        // cancel if the words' y ranges overlap and x are within 1
        if (
          Math.abs(x - px) <= 1 &&
          ((y - 1 <= py && py < y + word.length + 1) ||
            (py - 1 <= y && y < py + pword.length + 1))
        ) {
          return false;
        }
      }
      else if (
        pdirection === Direction.RIGHT &&
        direction === Direction.DOWN
      ) {
        // If word overlaps py
        if (y <= py && y + word.length > py) {
          // If right next to placed word, cancel placement
          if (x === px - 1 || x === px + pword.length + 1) {
            return false;
          } 
        // If word overlaps px range and y is py+1 (word starts just below), cancel placement
        if (
            (x >= px && x < px + pword.length) &&
            (y === py + 1)
          ) {
            return false;
          }
        }
      } else if (
        pdirection === Direction.DOWN &&
        direction === Direction.RIGHT
      ) {
        // If word overlaps px
        if (x <= px && x + word.length > px) {
          // If right next to placed word, cancel placement
          if (y === py - 1 || y === py + pword.length + 1) {
            return false;
          } 
        // If word overlaps py range and x is px+1 (word starts just to the right), cancel placement
        if (
            (y >= py && y < py + pword.length) &&
            (x === px + 1)
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }

  calculateScore(solution, grid) {
    // Maximumize number of words
    let nWords = solution.length;
    // Minimize number of letters in grid (Maximize intersections between words)
    let nLetters = grid.flat().filter((cell) => cell !== EMPTY).length;
    // Maximize distance between starts of words?
    return nWords * 100 - nLetters;
  }


  addWord(wordWithClue) {
    let word = wordWithClue.answer;
    let clue = wordWithClue.clue;
    let newSolutionsWithScores = [];
    for (let i = 0; i < this.topSolutionsWithScores.length; i++) {
      let solutionWithScore = this.topSolutionsWithScores[i];
      let solution = solutionWithScore.solution;
      // let score = solutionWithScore.score;

      // Initialize a grid with the current solution, and try to add the new word to it
      let grid = Array.from(Array(GRID_Y_SIZE), () =>
        Array(GRID_X_SIZE).fill(EMPTY)
      );
      // X is row (horizontal), Y is column (vertical). grid[y][x] is the cell at (x, y)
      for (let j = 0; j < solution.length; j++) {
        let placedWord = solution[j];
        grid = this.placeWord(
          placedWord.x,
          placedWord.y,
          placedWord.answer,
          placedWord.direction,
          grid
        );
      }

      // Try to add the new word in various positions and directions
      for (let x = 0; x < GRID_X_SIZE; x++) {
        for (let y = 0; y < GRID_Y_SIZE; y++) {
          for (let direction of [Direction.RIGHT, Direction.DOWN]) {

            // Stop if we have too many solutions
            if (newSolutionsWithScores.length > 15000) {
              break;
            }

            if (this.canPlaceWord(x, y, word, direction, solution, grid)) {
              // The word can be added here. Place it in the grid
              let new_grid = this.placeWord(x, y, word, direction, grid);
              // Create a new solution with the added word
              let newSolution = solution.concat({
                x: x,
                y: y,
                direction: direction,
                answer: word,
                clue: clue,
              });
              // Calculate the score of the new solution
              let newScore = this.calculateScore(newSolution, new_grid);
              // Add the new solution to the list
              newSolutionsWithScores.push({
                solution: newSolution,
                score: newScore,
              });
            }
          }
        }
      }
    }

    // if no solution is found, cancel word add
    if (newSolutionsWithScores.length === 0) {
      console.log("No solution found for word: ", word);
      return;
    }



    // Sort the new solutions by score and keep only the top N (Higher score is better)
    newSolutionsWithScores.sort((a, b) => b.score - a.score);
    this.topSolutionsWithScores = newSolutionsWithScores.slice(0, 15000);
  }

  generate(wordsWithClue) {

    // Start with an empty solution
    this.topSolutionsWithScores = [{ solution: [], score: 0 }];

    // Add each word to the crossword
    for (let wordWithClue of wordsWithClue) {
      this.addWord(wordWithClue);
    }

    if (this.topSolutionsWithScores.length === 0) {
      console.log("No solutions found");
      return {
        gridSolutions: null,
        gridXLength: 1,
        gridYLength: 1
      };
    }

    let topSolutionsWithScore = this.topSolutionsWithScores[0];
    
    // Calculate true boundaries of the grid
    let minX = GRID_X_SIZE;
    let minY = GRID_Y_SIZE;
    let maxX = 0;
    let maxY = 0;

    for (let placedWord of topSolutionsWithScore.solution) {
      let { x, y, direction, answer } = placedWord;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (direction === Direction.RIGHT) {
        if (x + answer.length > maxX) maxX = x + answer.length;
        if (y >= maxY) maxY = y + 1;
      } else {
        if (x >= maxX) maxX = x + 1;
        if (y + answer.length > maxY) maxY = y + answer.length;
      }
    }
    // Rescale all solutions to fit the true boundaries
    for (let placedWord of topSolutionsWithScore.solution) {
      placedWord.x -= minX;
      placedWord.y -= minY;
    }

    // Return the best solution (Array of PlacedWord objects) as well as XLen and YLen
    return {
      gridSolutions: topSolutionsWithScore.solution,
      gridXLength: maxX - minX,
      gridYLength: maxY - minY,
      // gridXLength: GRID_X_SIZE,
      // gridYLength: GRID_Y_SIZE,
    };
  }
}

function selectRandomEntries(rng, wordsArray, numberOfWords) {

  // Shuffle array using the seeded RNG
  function shuffle(array) {
    let currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(rng() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  // Create a copy of the array to shuffle
  const shuffledWords = shuffle([...wordsArray]);

  // Select the specified number of words
  return shuffledWords.slice(0, numberOfWords);
}

export { CrosswordGenerator, selectRandomEntries };
