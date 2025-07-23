const adjectives = [
  "silent",
  "brave",
  "gentle",
  "curious",
  "lonely",
  "fearless",
  "wild",
  "ancient",
  "bold",
  "shy",
  "clever",
  "quiet",
  "mighty",
  "wandering",
  "calm",
];

const subjects = [
  "wolf",
  "fox",
  "owl",
  "tiger",
  "bear",
  "eagle",
  "lynx",
  "panther",
  "hawk",
  "stag",
  "cougar",
  "raven",
  "python",
  "buffalo",
  "seal",
];

const verbs = [
  "hunts",
  "watches",
  "crosses",
  "chases",
  "explores",
  "guards",
  "climbs",
  "dives",
  "stalks",
  "howls",
  "soars",
  "wanders",
  "prowls",
  "navigates",
  "surveys",
];

const objects = [
  "moon",
  "river",
  "forest",
  "night",
  "hill",
  "sky",
  "cave",
  "mountain",
  "sunset",
  "tundra",
  "glade",
  "ocean",
  "path",
  "grove",
  "storm",
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

exports.generateMeaningfulPhrase = function (activeChats) {
  let phrase;
  let attempts = 0;

  do {
    const adj = getRandom(adjectives);
    const subj = getRandom(subjects);
    const verb = getRandom(verbs);
    const obj = getRandom(objects);

    phrase = `${adj} ${subj} ${verb} ${obj}`; // Proper grammar flow
    attempts++;
    // if (attempts > 100) return null; // Prevent infinite loop
  } while (activeChats.has(phrase));

  return phrase;
};
