const quiz = (slug, title, category, difficulty, xp, description, questions) => ({
  quest: { slug, title, category, difficulty, xp_reward: xp, type: 'quiz', description, instructions: 'Answer every question. You need at least 70% to pass.',
    challenge: { pass_percent: 70, questions: questions.map(([q, ...opts]) => ({ q, options: opts.slice(0, -1) })) } },
  key: { answers: questions.map((x) => x[x.length - 1]) },
});
const code = (slug, title, difficulty, xp, description, instructions, fn, starter, examples, tests) => ({
  quest: { slug, title, category: 'javascript', difficulty, xp_reward: xp, type: 'code', description, instructions, challenge: { fn, starter, examples } },
  key: { tests },
});
const html = (slug, title, category, difficulty, xp, description, instructions, starter, rules) => ({
  quest: { slug, title, category, difficulty, xp_reward: xp, type: 'html', description, instructions, challenge: { starter } },
  key: { rules },
});
const T = (args, expected, visible = false) => ({ args, expected, visible });

export const quests = [
  code('js-sum-array', 'Sum an array', 'beginner', 50, 'Add up every number in a list.', 'Write a function sumArray(numbers) that returns the sum of all numbers. An empty array returns 0.', 'sumArray',
    'function sumArray(numbers) {\n  // your code here\n}\n', [{ input: '[1, 2, 3]', output: '6' }],
    [T([[1, 2, 3]], 6, true), T([[]], 0, true), T([[-5, 5, 10]], 10), T([[0.5, 0.25]], 0.75)]),
  code('js-reverse-string', 'Reverse a string', 'beginner', 50, 'Flip text back to front.', 'Write reverseString(text) that returns the text reversed.', 'reverseString',
    'function reverseString(text) {\n  // your code here\n}\n', [{ input: '"hello"', output: '"olleh"' }],
    [T(['hello'], 'olleh', true), T([''], '', true), T(['a'], 'a'), T(['SkillQuest'], 'tseuQllikS')]),
  code('js-fizzbuzz', 'FizzBuzz', 'beginner', 75, 'The classic interview warm-up.', 'Write fizzBuzz(n): return "FizzBuzz" if n is divisible by 3 and 5, "Fizz" if by 3, "Buzz" if by 5, otherwise the number as a string.', 'fizzBuzz',
    'function fizzBuzz(n) {\n  // your code here\n}\n', [{ input: '15', output: '"FizzBuzz"' }, { input: '7', output: '"7"' }],
    [T([15], 'FizzBuzz', true), T([9], 'Fizz', true), T([10], 'Buzz'), T([7], '7'), T([30], 'FizzBuzz')]),
  code('js-palindrome', 'Palindrome check', 'intermediate', 120, 'Ignore case, spaces and punctuation.', 'Write isPalindrome(text) that returns true if the text reads the same backwards, ignoring case and any character that is not a letter or digit.', 'isPalindrome',
    'function isPalindrome(text) {\n  // your code here\n}\n', [{ input: '"A man, a plan, a canal: Panama"', output: 'true' }],
    [T(['A man, a plan, a canal: Panama'], true, true), T(['hello'], false, true), T([''], true), T(['No lemon, no melon'], true), T(['ab'], false)]),
  code('js-group-by', 'Group by key', 'advanced', 200, 'Turn a flat list into buckets.', 'Write groupBy(items, key) that returns an object whose keys are the values of item[key] and whose values are arrays of the matching items, in original order.', 'groupBy',
    'function groupBy(items, key) {\n  // your code here\n}\n', [{ input: '[{t:"a"},{t:"b"},{t:"a"}], "t"', output: '{ a: [{t:"a"},{t:"a"}], b: [{t:"b"}] }' }],
    [T([[{ t: 'a', n: 1 }, { t: 'b', n: 2 }, { t: 'a', n: 3 }], 't'], { a: [{ t: 'a', n: 1 }, { t: 'a', n: 3 }], b: [{ t: 'b', n: 2 }] }, true), T([[], 't'], {}), T([[{ k: 1 }, { k: 1 }], 'k'], { 1: [{ k: 1 }, { k: 1 }] })]),
  quiz('js-fundamentals-quiz', 'JavaScript fundamentals', 'javascript', 'beginner', 80, 'Variables, types and equality.', [
    ['Which keyword declares a block-scoped variable that can be reassigned?', 'var', 'let', 'const', 'static', 1],
    ['What does typeof null return?', '"null"', '"undefined"', '"object"', '"number"', 2],
    ['What is the result of "5" + 3?', '8', '"53"', 'NaN', 'Error', 1],
    ['Which comparison checks value AND type?', '==', '=', '===', '!=', 2],
  ]),
  html('html-profile-card', 'Build a profile card', 'html_css', 'beginner', 75, 'Semantic HTML basics.', 'Write HTML for a profile card with: an <h1> name, an <img> with alt text, a <p> bio, and a link (<a href>) to a website.',
    '<!-- Build your profile card -->\n<div class="card">\n  \n</div>\n',
    [{ type: 'regex', value: '<h1[^>]*>[^<]+</h1>', message: 'Add an <h1> with a name.' }, { type: 'regex', value: '<img[^>]+alt=["\'][^"\']+["\']', message: 'Add an <img> with non-empty alt text.' }, { type: 'regex', value: '<p[^>]*>[^<]+</p>', message: 'Add a <p> bio.' }, { type: 'regex', value: '<a[^>]+href=["\'][^"\']+["\']', message: 'Add a link with an href.' }]),
  html('css-flex-layout', 'Center with Flexbox', 'html_css', 'intermediate', 120, 'Layout with modern CSS.', 'Add a <style> block that makes .row a flex container, centers items on both axes, and adds a gap between them.',
    '<style>\n  \n</style>\n<div class="row"><div>One</div><div>Two</div></div>\n',
    [{ type: 'regex', value: 'display\\s*:\\s*flex', message: 'Use display: flex.' }, { type: 'regex', value: 'justify-content\\s*:\\s*center', message: 'Center horizontally with justify-content.' }, { type: 'regex', value: 'align-items\\s*:\\s*center', message: 'Center vertically with align-items.' }, { type: 'regex', value: '\\bgap\\s*:', message: 'Add a gap.' }]),
  html('html-signup-form', 'Accessible sign-up form', 'web_dev', 'intermediate', 140, 'Forms with labels and validation.', 'Build a <form> with a labelled email input (type="email", required) and a submit button.',
    '<form>\n  \n</form>\n',
    [{ type: 'regex', value: '<form[\\s>]', message: 'Use a <form> element.' }, { type: 'regex', value: '<label[^>]*>', message: 'Add a <label>.' }, { type: 'regex', value: '<input[^>]+type=["\']email["\']', message: 'Use an input with type="email".' }, { type: 'regex', value: '<input[^>]*\\brequired\\b', message: 'Mark the input required.' }, { type: 'regex', value: '<button[^>]*(type=["\']submit["\'])?[^>]*>|<input[^>]+type=["\']submit["\']', message: 'Add a submit button.' }]),
  quiz('web-http-quiz', 'How the web talks', 'web_dev', 'intermediate', 100, 'HTTP, status codes and REST.', [
    ['Which HTTP method is meant for reading data without changing it?', 'POST', 'GET', 'DELETE', 'PUT', 1],
    ['What does status code 404 mean?', 'Server error', 'Unauthorized', 'Not found', 'Redirect', 2],
    ['Which header carries an access token?', 'Authorization', 'Accept', 'Host', 'Cookie-Type', 0],
    ['What does CORS control?', 'Database access', 'Which websites may call an API from a browser', 'Password hashing', 'Image sizes', 1],
  ]),
  quiz('prog-basics-quiz', 'Programming basics', 'programming', 'beginner', 60, 'Core ideas every programmer uses.', [
    ['What is a loop used for?', 'Repeating code', 'Naming files', 'Encrypting data', 'Drawing pages', 0],
    ['Which structure stores items in order and accessible by index?', 'Array', 'Boolean', 'Comment', 'Operator', 0],
    ['What does a function return when it has no return statement in JavaScript?', 'null', '0', 'undefined', 'false', 2],
  ]),
  quiz('prog-algorithms-quiz', 'Algorithms and complexity', 'programming', 'intermediate', 110, 'Big-O and common algorithms.', [
    ['Binary search requires the data to be...', 'Random', 'Sorted', 'Unique', 'Numeric only', 1],
    ['Time complexity of binary search?', 'O(n)', 'O(log n)', 'O(n^2)', 'O(1)', 1],
    ['Which data structure is last-in, first-out?', 'Queue', 'Stack', 'Graph', 'Heap', 1],
    ['Worst-case of bubble sort?', 'O(n log n)', 'O(n)', 'O(n^2)', 'O(log n)', 2],
  ]),
  quiz('blockchain-basics-quiz', 'Blockchain basics', 'blockchain', 'beginner', 80, 'What a blockchain is and why it matters.', [
    ['What links one block to the next?', "The previous block's hash", 'A password', 'An email address', 'A timestamp only', 0],
    ['Why is a blockchain hard to alter?', 'Changing a block changes its hash and breaks every later block', 'It is stored on one secure server', 'It is encrypted with one key', 'Nobody can read it', 0],
    ['What is a testnet?', 'A network for practising with valueless coins', 'A faster Bitcoin', 'A type of wallet', 'A mining pool', 0],
  ]),
  quiz('blockchain-crypto-quiz', 'Hashes, keys and signatures', 'blockchain', 'intermediate', 120, 'The cryptography underneath.', [
    ['If one character of the input changes, a good hash function output...', 'Changes completely', 'Changes by one character', 'Stays the same', 'Gets shorter', 0],
    ['Which key signs a transaction?', 'Public key', 'Private key', 'Hash', 'Nonce', 1],
    ['Which is safe to share?', 'Private key', 'Seed phrase', 'Public address', 'Wallet password', 2],
    ['What does a digital signature prove?', 'The sender controls the private key and the message was not altered', 'The message is secret', 'The message is true', 'The sender is online', 0],
  ]),
  quiz('smart-contracts-intro', 'Smart contract rookie', 'blockchain', 'intermediate', 150, 'Your first look at Solidity and Ethereum.', [
    ['What is a smart contract?', 'Code deployed on a blockchain that runs as written', 'A legal PDF', 'A browser extension', 'A bank account', 0],
    ['What is gas on Ethereum?', 'The fee for computation and storage', 'A token you mine', 'A wallet type', 'A programming language', 0],
    ['Which language is most used for Ethereum contracts?', 'Solidity', 'Swift', 'Ruby', 'Perl', 0],
    ['Why store only a hash of a document on-chain?', 'It is cheap and keeps private data off a public ledger', 'Hashes are encrypted', 'Documents cannot be stored anywhere else', 'It makes the document bigger', 0],
  ]),
  quiz('solidity-access-control', 'Access control in Solidity', 'blockchain', 'advanced', 220, 'Protecting contract functions.', [
    ['What does a modifier like onlyOwner do?', 'Runs a check before the function body', 'Makes the function free', 'Encrypts arguments', 'Deploys the contract', 0],
    ['Which is safest for production permission management?', 'A battle-tested library like OpenZeppelin AccessControl', 'Hard-coding a password string', 'Checking tx.origin', 'No checks', 0],
    ['Why is tx.origin dangerous for authorisation?', 'A malicious contract can relay a call from a user', 'It costs more gas', 'It is deprecated syntax only', 'It returns zero', 0],
    ['What happens when a custom error is reverted?', 'State changes in the transaction are undone', 'The contract self-destructs', 'Gas is refunded in full', 'Only the event is skipped', 0],
  ]),
];

export const badges = [
  { slug: 'first-quest', name: 'First Quest Completed', description: 'Finish any quest.', icon: 'flag', color: 'cyan', condition_type: 'quests_completed', condition_value: 1, skills: ['Getting started'] },
  { slug: 'javascript-beginner', name: 'JavaScript Beginner', description: 'Complete 3 JavaScript quests.', icon: 'code', color: 'amber', condition_type: 'category_count', condition_category: 'javascript', condition_value: 3, issues_certificate: true, skills: ['JavaScript', 'Problem solving'] },
  { slug: 'web-dev-explorer', name: 'Web Development Explorer', description: 'Complete 3 HTML, CSS or web quests.', icon: 'compass', color: 'blue', condition_type: 'category_count', condition_category: 'html_css,web_dev', condition_value: 3, issues_certificate: true, skills: ['HTML', 'CSS', 'Web fundamentals'] },
  { slug: 'blockchain-learner', name: 'Blockchain Learner', description: 'Complete 3 blockchain quests.', icon: 'link', color: 'violet', condition_type: 'category_count', condition_category: 'blockchain', condition_value: 3, issues_certificate: true, skills: ['Blockchain fundamentals', 'Cryptography'] },
  { slug: 'smart-contract-rookie', name: 'Smart Contract Rookie', description: 'Pass the Smart contract rookie quiz.', icon: 'box', color: 'violet', condition_type: 'quest_slug', condition_slug: 'smart-contracts-intro', condition_value: 1, issues_certificate: true, skills: ['Solidity basics', 'Smart contracts'] },
  { slug: 'ten-quests', name: '10 Quests Completed', description: 'Complete 10 quests.', icon: 'trophy', color: 'cyan', condition_type: 'quests_completed', condition_value: 10, skills: ['Consistency'] },
  { slug: 'skillquest-master', name: 'SkillQuest Master', description: 'Complete every active quest.', icon: 'crown', color: 'amber', condition_type: 'all_quests', condition_value: 1, issues_certificate: true, skills: ['JavaScript', 'Web development', 'Blockchain', 'Programming'] },
];
