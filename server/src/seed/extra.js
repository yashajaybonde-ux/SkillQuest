// 18 extra quests. Added by scripts/add-quests.js (safe to run many times: matched by slug).
// Spreads correct answers across positions so quizzes cannot be passed by always picking the same option.
const quiz = (slug, title, category, difficulty, xp, description, questions) => {
  const built = questions.map((x, qi) => {
    const opts = x.slice(1, -1), right = opts[x[x.length - 1]];
    const rest = opts.filter((o) => o !== right), at = (qi + title.length) % opts.length;
    rest.splice(at, 0, right);
    return { q: x[0], options: rest, answer: at };
  });
  return {
    quest: { slug, title, category, difficulty, xp_reward: xp, type: 'quiz', description, instructions: 'Answer every question. You need at least 70% to pass.',
      challenge: { pass_percent: 70, questions: built.map(({ q, options }) => ({ q, options })) } },
    key: { answers: built.map((b) => b.answer) },
  };
};
const code = (slug, title, difficulty, xp, description, instructions, fn, starter, examples, tests) => ({
  quest: { slug, title, category: 'javascript', difficulty, xp_reward: xp, type: 'code', description, instructions, challenge: { fn, starter, examples } },
  key: { tests },
});
const html = (slug, title, category, difficulty, xp, description, instructions, starter, rules) => ({
  quest: { slug, title, category, difficulty, xp_reward: xp, type: 'html', description, instructions, challenge: { starter } },
  key: { rules },
});
const T = (args, expected, visible = false) => ({ args, expected, visible });

export const extraQuests = [
  // ---------- JavaScript code challenges ----------
  code('js-find-max', 'Find the largest number', 'beginner', 50, 'Pick the biggest value in a list.', 'Write findMax(numbers) that returns the largest number. For an empty array return null.', 'findMax',
    'function findMax(numbers) {\n  // your code here\n}\n', [{ input: '[3, 9, 2]', output: '9' }, { input: '[]', output: 'null' }],
    [T([[3, 9, 2]], 9, true), T([[-5, -1, -8]], -1, true), T([[7]], 7), T([[]], null)]),
  code('js-count-vowels', 'Count the vowels', 'beginner', 60, 'Loop over text and count a, e, i, o, u.', 'Write countVowels(text) that returns how many vowels (a, e, i, o, u, upper or lower case) the text contains.', 'countVowels',
    'function countVowels(text) {\n  // your code here\n}\n', [{ input: '"hello"', output: '2' }],
    [T(['hello'], 2, true), T(['rhythm'], 0, true), T(['AEIOU'], 5), T(['SKILLQUEST'], 3), T([''], 0)]),
  code('js-capitalize-words', 'Capitalise every word', 'beginner', 60, 'Title-case a sentence.', 'Write capitalizeWords(text) that makes the first letter of every word uppercase. Words are separated by single spaces.', 'capitalizeWords',
    'function capitalizeWords(text) {\n  // your code here\n}\n', [{ input: '"hello world"', output: '"Hello World"' }],
    [T(['hello world'], 'Hello World', true), T(['a'], 'A', true), T(['one two three'], 'One Two Three'), T([''], ''), T(['skillquest rocks'], 'Skillquest Rocks')]),
  code('js-unique', 'Remove duplicates', 'intermediate', 110, 'Keep the first copy of every value.', 'Write unique(items) that returns a new array without duplicates, keeping the original order of first appearance.', 'unique',
    'function unique(items) {\n  // your code here\n}\n', [{ input: '[1, 2, 2, 3, 1]', output: '[1, 2, 3]' }],
    [T([[1, 2, 2, 3, 1]], [1, 2, 3], true), T([['a', 'b', 'a']], ['a', 'b'], true), T([[]], []), T([[5, 5, 5]], [5])]),
  code('js-fibonacci', 'Fibonacci number', 'intermediate', 130, 'The classic sequence.', 'Write fibonacci(n) that returns the n-th Fibonacci number, where fibonacci(0) is 0 and fibonacci(1) is 1.', 'fibonacci',
    'function fibonacci(n) {\n  // your code here\n}\n', [{ input: '10', output: '55' }],
    [T([10], 55, true), T([0], 0, true), T([1], 1), T([2], 1), T([20], 6765)]),
  code('js-two-sum', 'Two sum', 'intermediate', 150, 'A favourite interview question.', 'Write twoSum(numbers, target) that returns the indexes [i, j] (with i < j) of the first pair that adds up to target. Check i from the start, and for each i check j after it. Return [] if there is no pair.', 'twoSum',
    'function twoSum(numbers, target) {\n  // your code here\n}\n', [{ input: '[2, 7, 11, 15], 9', output: '[0, 1]' }],
    [T([[2, 7, 11, 15], 9], [0, 1], true), T([[1, 2, 3], 10], [], true), T([[3, 2, 4], 6], [1, 2]), T([[3, 3], 6], [0, 1])]),
  code('js-flatten', 'Flatten nested arrays', 'advanced', 200, 'Handle any depth of nesting.', 'Write flatten(items) that turns an array containing nested arrays of any depth into one flat array, keeping the order.', 'flatten',
    'function flatten(items) {\n  // your code here\n}\n', [{ input: '[1, [2, [3, [4]]]]', output: '[1, 2, 3, 4]' }],
    [T([[1, [2, [3, [4]]]]], [1, 2, 3, 4], true), T([[]], [], true), T([[[1, 2], [3]]], [1, 2, 3]), T([[1, [], [2, [[]]]]], [1, 2])]),

  // ---------- HTML and CSS missions ----------
  html('html-nav-bar', 'Navigation bar', 'html_css', 'beginner', 80, 'Semantic navigation.', 'Build a navigation bar: a <nav> containing a <ul> list with <li> items, and at least three links (<a href>).',
    '<nav>\n  \n</nav>\n',
    [{ type: 'regex', value: '<nav[\\s>]', message: 'Wrap the links in a <nav> element.' }, { type: 'regex', value: '<ul[\\s>]', message: 'Use a <ul> list inside the nav.' }, { type: 'regex', value: '<li[\\s>]', message: 'Use <li> items.' }, { type: 'regex', value: '(<a[^>]+href=["\'][^"\']+["\'][^>]*>[\\s\\S]*?){3}', message: 'Add at least three links with an href.' }]),
  html('css-hover-button', 'Animated hover button', 'html_css', 'intermediate', 120, 'Smooth interactions with CSS.', 'Add a <button> and a <style> block that gives it rounded corners (border-radius), a :hover style, and a transition so the change is smooth.',
    '<style>\n  \n</style>\n<button>Click me</button>\n',
    [{ type: 'regex', value: '<button[\\s>]', message: 'Add a <button>.' }, { type: 'regex', value: 'border-radius\\s*:', message: 'Round the corners with border-radius.' }, { type: 'regex', value: ':hover', message: 'Add a :hover style.' }, { type: 'regex', value: 'transition\\s*:', message: 'Add a transition so the hover change is smooth.' }]),
  html('css-grid-gallery', 'CSS Grid gallery', 'html_css', 'intermediate', 140, 'Lay out cards in a grid.', 'Create a container using CSS Grid with columns (grid-template-columns), a gap, and at least four items inside it.',
    '<style>\n  .gallery { }\n</style>\n<div class="gallery">\n  \n</div>\n',
    [{ type: 'regex', value: 'display\\s*:\\s*grid', message: 'Use display: grid on the container.' }, { type: 'regex', value: 'grid-template-columns\\s*:', message: 'Define columns with grid-template-columns.' }, { type: 'regex', value: '\\bgap\\s*:', message: 'Add a gap between items.' }, { type: 'regex', value: '(<(div|img)[\\s>][\\s\\S]*?){5}', message: 'Add a container with at least four items inside it.' }]),
  html('web-responsive-page', 'Make it responsive', 'web_dev', 'beginner', 90, 'Pages that work on phones.', 'Add the viewport <meta> tag with width=device-width, and a @media query that uses min-width or max-width.',
    '<head>\n  \n</head>\n<style>\n  \n</style>\n',
    [{ type: 'regex', value: '<meta[^>]+name=["\']viewport["\']', message: 'Add a <meta name="viewport"> tag.' }, { type: 'regex', value: 'width\\s*=\\s*device-width', message: 'Set content to width=device-width.' }, { type: 'regex', value: '@media', message: 'Add a @media query.' }, { type: 'regex', value: '(max|min)-width\\s*:', message: 'Use min-width or max-width in the media query.' }]),
  html('html-semantic-page', 'Semantic page layout', 'web_dev', 'intermediate', 130, 'Structure that screen readers understand.', 'Build a page using semantic elements: <header>, <main>, <footer>, and at least one <article> or <section>.',
    '<body>\n  \n</body>\n',
    [{ type: 'regex', value: '<header[\\s>]', message: 'Add a <header>.' }, { type: 'regex', value: '<main[\\s>]', message: 'Add a <main>.' }, { type: 'regex', value: '<(article|section)[\\s>]', message: 'Add an <article> or <section>.' }, { type: 'regex', value: '<footer[\\s>]', message: 'Add a <footer>.' }]),

  // ---------- Quizzes ----------
  quiz('js-async-quiz', 'Async JavaScript', 'javascript', 'advanced', 180, 'Promises, async/await and the event loop.', [
    ['What does an async function always return?', 'The raw return value', 'A Promise', 'undefined', 'A callback', 1],
    ['What does await do inside an async function?', 'Blocks the whole browser', 'Pauses that function until the promise settles', 'Cancels the promise', 'Runs code in a new thread', 1],
    ['Which method waits for ALL promises to fulfil?', 'Promise.all', 'Promise.race', 'Promise.any', 'Promise.resolve', 0],
    ["What is the output order of: console.log('a'); setTimeout(() => console.log('b'), 0); Promise.resolve().then(() => console.log('c')); console.log('d');", 'a d c b', 'a b c d', 'a c d b', 'a d b c', 0],
  ]),
  quiz('web-security-quiz', 'Web security essentials', 'web_dev', 'advanced', 180, 'XSS, passwords, HTTPS and validation.', [
    ['What is cross-site scripting (XSS)?', "An attacker's script running in other users' browsers", 'A server running out of memory', 'Guessing a password', 'Deleting a database by mistake', 0],
    ['How should passwords be stored?', 'In plain text', 'Reversibly encrypted in the database', 'As a salted slow hash such as bcrypt or argon2', 'Base64 encoded', 2],
    ['What does HTTPS protect?', 'Data in transit from being read or changed', 'Everything from all attacks', 'The database files', 'The source code', 0],
    ['Why must the server validate input even if the browser already did?', 'Browser checks can be bypassed by calling the API directly', 'Browsers cannot run validation', 'It makes pages faster', 'It is required by HTML', 0],
  ]),
  quiz('blockchain-consensus-quiz', 'Consensus mechanisms', 'blockchain', 'intermediate', 130, 'How a blockchain agrees on the truth.', [
    ['What is a consensus mechanism?', 'How nodes agree on which blocks and transactions are valid', 'A way to encrypt wallets', 'A kind of smart contract', 'A coin exchange', 0],
    ['In proof of work, miners compete to...', 'Find a hash below a target value', 'Send the most transactions', 'Hold the most coins', 'Vote on proposals', 0],
    ['In proof of stake, validators are chosen based on...', 'Coins they lock up as a stake', 'Their computing power', 'Their website traffic', 'Their location', 0],
    ['What is a 51% attack?', 'One party controlling most of the network power can rewrite recent history', 'A website losing 51% of users', 'A fee increase', 'A wallet bug', 0],
  ]),
  quiz('blockchain-ethereum-quiz', 'Ethereum basics', 'blockchain', 'beginner', 90, 'Ether, wallets and test networks.', [
    ['What is Ether (ETH)?', 'The native currency used to pay for activity on Ethereum', 'A type of wallet', 'A programming language', 'A browser', 0],
    ['What is a wallet address?', 'A public identifier you can share to receive assets', 'Your secret password', 'Your seed phrase', 'A website link', 0],
    ['What is a block explorer used for?', 'Looking up transactions and addresses on a blockchain', 'Mining coins', 'Writing contracts', 'Buying tokens', 0],
    ['What is Sepolia?', 'A public Ethereum test network', 'A real-money exchange', 'A wallet brand', 'A programming framework', 0],
  ]),
  quiz('prog-git-quiz', 'Git basics', 'programming', 'beginner', 70, 'Version control every developer uses.', [
    ['Which command saves your staged changes as a snapshot?', 'git push', 'git commit', 'git clone', 'git status', 1],
    ['What does git clone do?', 'Copies a remote repository to your computer', 'Deletes a branch', 'Merges two files', 'Shows the log', 0],
    ['What is a branch?', 'An independent line of development', 'A backup file', 'A type of commit message', 'A remote server', 0],
    ['Which command uploads your commits to a remote repository?', 'git push', 'git pull', 'git add', 'git init', 0],
  ]),
  quiz('prog-sql-quiz', 'SQL fundamentals', 'programming', 'intermediate', 110, 'Talking to databases.', [
    ['Which statement reads rows from a table?', 'INSERT', 'SELECT', 'DROP', 'GRANT', 1],
    ['What does the WHERE clause do?', 'Filters which rows are returned', 'Sorts the results', 'Creates a table', 'Joins two databases', 0],
    ['What is a primary key?', 'A column that uniquely identifies each row', 'The first column alphabetically', 'A password for the table', 'A backup of the table', 0],
    ['What does a JOIN do?', 'Combines rows from two tables using a related column', 'Deletes duplicate rows', 'Encrypts a column', 'Renames a table', 0],
  ]),
];
