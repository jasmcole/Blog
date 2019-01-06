const fs = require('fs');

const WORDS_FILE = 'words_common.txt';
const TUBES_FILE = 'tube_names.txt';

const charToIndex = (word, ind) => word.charCodeAt(ind) - 97;

const words = fs.readFileSync(WORDS_FILE, 'utf8').split('\n');
console.log(`Read ${words.length} words`);

const wordCodes = words.map(w => {
  const codes = new Array(w.length);
  for (let wind = 0; wind < w.length; wind++) {
    codes[wind] = charToIndex(w, wind)
  }
  return codes;
});

const tubes = fs.readFileSync(TUBES_FILE, 'utf8')
  .split('\n')
  .map(t => t.replace(/[^a-zA-Z]/g, ""))
  .map(t => t.replace(" ", ""))
  .map(t => t.toLowerCase());

const tubesUnique = tubes
  .filter((t, i) => tubes.indexOf(t) === i) // Remove duplicates
  .sort()
  ;

console.log(`Read ${tubes.length} stations`);

const letters = new Array(tubesUnique.length).fill(0).map(l => new Array(26).fill(false));

tubesUnique.forEach((t, i) => {
  for (let tind = 0; tind < t.length; tind++) {
    letters[i][charToIndex(t, tind)] = true;
  }
});

const tubesWithNoLettersInCommon = words.map(w => []);
words.forEach((w, i) => {
  for (let tind = 0; tind < tubesUnique.length; tind++) {
    let found = false;
    for (let wind = 0; wind < w.length; wind++) {
      const lind = wordCodes[i][wind];
      if (letters[tind][lind]) {
        found = true;
        break;
      }
    }
    if (!found) {
      tubesWithNoLettersInCommon[i].push(tind);
    }
  }
});

// Do something with tubesWithNoLettersInCommon