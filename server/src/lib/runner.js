// Child process that runs a student's JavaScript against test cases.
// Receives JSON on stdin, prints JSON on stdout. Started with an EMPTY environment
// by grader.js so no secrets are reachable via process.env.
import vm from 'node:vm';

const canon = (v) => {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v) ?? 'undefined';
};

let input = '';
process.stdin.on('data', (d) => (input += d)).on('end', () => {
  const { code, fn, tests } = JSON.parse(input);
  const out = { compileError: null, results: [] };
  // Empty context, no host objects, and string-eval disabled: nothing to escape through.
  const ctx = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  try {
    vm.runInContext(code, ctx, { timeout: 1000 });
  } catch (e) {
    out.compileError = String(e && e.message).slice(0, 200);
    return console.log(JSON.stringify(out));
  }
  for (const t of tests) {
    try {
      ctx.__args = JSON.stringify(t.args);
      const got = vm.runInContext(`(function(){ var r = ${fn}.apply(null, JSON.parse(__args)); return r === undefined ? 'undefined' : JSON.stringify(r); })()`, ctx, { timeout: 1000 });
      const ok = got !== 'undefined' && canon(JSON.parse(got)) === canon(t.expected);
      out.results.push({ ok, got: t.visible ? String(got).slice(0, 200) : undefined });
    } catch (e) {
      out.results.push({ ok: false, error: t.visible ? String(e && e.message).slice(0, 120) : undefined });
    }
  }
  console.log(JSON.stringify(out));
});
