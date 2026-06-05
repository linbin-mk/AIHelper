/**
 * Node.js test runner — SkillRegistry v2.0 (history-driven merge)
 */
const fs = require('fs'), path = require('path'), vm = require('vm');

const chrome = {
  runtime: { getURL: (p) => 'chrome-extension://mock/' + p },
  storage: {
    local: {
      _store: {},
      get: async function (keys) {
        if (Array.isArray(keys)) { const r = {}; keys.forEach(k => { r[k] = this._store[k]; }); return r; }
        if (typeof keys === 'object' && keys !== null) { const r = {}; Object.keys(keys).forEach(k => { r[k] = this._store[k] !== undefined ? this._store[k] : keys[k]; }); return r; }
        return { [keys]: this._store[keys] };
      },
      set: async function (items) { Object.assign(this._store, items); },
      remove: async function (keys) { (Array.isArray(keys) ? keys : [keys]).forEach(k => { delete this._store[k]; }); }
    }
  }
};
const window = {};

function loadScripts(fps) {
  const ctx = { chrome, window, console, setTimeout, setInterval, clearTimeout, clearInterval, Promise, fetch: global.fetch };
  vm.createContext(ctx);
  fps.forEach(fp => {
    const src = fs.readFileSync(fp, 'utf8')
      .replace(/^class\s+(\w+)/gm, '$1 = class')
      .replace(/^async function\s+(\w+)/gm, '$1 = async function')
      .replace(/^function\s+(\w+)/gm, '$1 = function');
    vm.runInContext(src, ctx, { filename: fp });
  });
  return ctx;
}

const ctx = loadScripts([
  path.join(__dirname, 'shared/skill-storage.js'),
  path.join(__dirname, 'shared/skill-registry.js'),
  path.join(__dirname, 'shared/skill-history.js')
]);
let passed = 0, failed = 0;
const loadAiHelperSkills = ctx.loadAiHelperSkills;
const saveAiHelperSkills = ctx.saveAiHelperSkills;
const SkillRegistry = ctx.SkillRegistry;
const createSkill = ctx.createSkill;
const addHistoryEntry = ctx.addHistoryEntry;
const saveHistory = ctx.saveHistory;
const getHistory = ctx.getHistory;
const clearHistory = ctx.clearHistory;
const loadHistory = ctx.loadHistory;

function ok(c, n) { if (c) { console.log('  PASS: ' + n); passed++; } else { console.log('  FAIL: ' + n); failed++; } }
function eq(a, b, n) { if (a === b) { console.log('  PASS: ' + n + ' (=' + JSON.stringify(b) + ')'); passed++; } else { console.log('  FAIL: ' + n + ' (got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b) + ')'); failed++; } }
function mk(id, name, desc, cat, prompt, opts) {
  opts = opts || {};
  var dto = { id, name, description: desc || '', category: cat || 'Other', prompt: prompt || '', type: opts.type || 'builtin', deleted: opts.deleted || false };
  if (opts.createdAt) dto.createdAt = opts.createdAt;
  return createSkill(dto);
}

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('  SkillRegistry 测试 (v2.0 history-driven)');
  console.log('═══════════════════════════════════════');

  // 1. createSkill
  console.log('\n── 1. createSkill ──');
  const s1 = createSkill({ id: 'a', name: 'A', prompt: '#A', type: 'builtin', deleted: false });
  eq(s1.getPrompt(), '#A', '1.1 getPrompt');
  ok(s1.getTools === undefined, '1.2 no getTools');
  ok(s1.getUIDelegate === undefined, '1.3 no getUIDelegate');

  // 2. register + getAll
  console.log('\n── 2. 注册 ──');
  const reg = new SkillRegistry();
  reg.register(mk('a', 'A'));
  reg.register(mk('b', 'B'));
  reg.register(mk('c', 'C'));
  eq(reg.getAll().length, 3, '2.1 3 skills');

  // 3. unregister
  console.log('\n── 3. 删除 ──');
  const sB = reg.getAll().find(s => s.id === 'b');
  reg.unregister('b');
  eq(reg.getAll().length, 2, '3.1 filtered');
  eq(sB.deleted, true, '3.2 deleted=true');

  // 4. update + history
  console.log('\n── 4. update → history ──');
  reg.update('a', { name: 'A1', prompt: '#A1' }, 'cn');
  const a = reg.getAll().find(s => s.id === 'a');
  eq(a.name, 'A1', '4.1 name updated');
  const h = reg.getHistory('a', 'cn');
  eq(h.length, 1, '4.2 1 history entry');
  eq(h[0].name, 'A', '4.3 pre-edit name in history');
  eq(h[0].prompt, '', '4.4 pre-edit prompt');

  // 5. activate
  console.log('\n── 5. activate ──');
  reg.activate('a');
  ok(reg.isActive('a'), '5.1 active');
  reg.deactivate('a');
  ok(!reg.isActive('a'), '5.2 deactivated');

  // 6. events
  console.log('\n── 6. events ──');
  const evts = [];
  reg.onSkillEvent(e => evts.push(e));
  const sD = mk('d', 'D');
  reg.register(sD);
  reg.update('d', { name: 'D1' }, 'cn');
  reg.unregister('d');
  eq(evts.length, 3, '6.1 3 events');

  // 7. merge decision: history > 0 → keep storage
  console.log('\n── 7. merge: history check ──');
  const storageMap = {
    'x1': { id: 'x1', name: 'UserX1', description: 'Ud', prompt: '#U', type: 'builtin', deleted: false },
    'x2': { id: 'x2', name: 'X2', description: '', prompt: '#X2', type: 'builtin', deleted: false }
  };
  // x1: user edited → history exists
  addHistoryEntry('x1', 'cn', { ts: 100, name: 'X1Orig', description: '', prompt: '#Orig', category: 'Development' });
  // x2: no history
  const freshMap = {
    'x1': { id: 'x1', name: 'NewX1', description: 'Nd', prompt: '#New', type: 'builtin', deleted: false },
    'x2': { id: 'x2', name: 'NewX2', description: 'Nd2', prompt: '#New2', type: 'builtin', deleted: false }
  };
  var result = {};
  for (var sid in freshMap) {
    var stored = storageMap[sid];
    var hLen = getHistory(sid, 'cn').length;
    if (hLen > 0 && stored) result[sid] = stored;
    else if (stored && stored.deleted) continue;
    else result[sid] = freshMap[sid];
  }
  eq(result['x1'].name, 'UserX1', '7.1 edited → storage kept');
  eq(result['x2'].name, 'NewX2', '7.2 untouched → fresh .md');

  // 8. Storage
  console.log('\n── 8. Storage ──');
  const td = { cn: { 'dy': { id: 'dy', name: 'DY', prompt: '', type: 'builtin', deleted: false } }, en: {} };
  await saveAiHelperSkills(td);
  const ld = await loadAiHelperSkills();
  eq(ld.cn.dy.name, 'DY', '8.1 persisted');

  // 9. createUserSkill
  console.log('\n── 9. createUserSkill ──');
  try {
    const uid = await reg.createUserSkill('我的', 'desc', 'Product', 'prompt');
    ok(uid.indexOf('user-') === 0, '9.1 id format');
    const us = reg.getAll().find(s => s.id === uid);
    eq(us.type, 'user', '9.2 type=user');
    eq(us.name, '我的', '9.3 name');
  } catch (e) { ok(false, '9.x error: ' + e.message); }

  // 10. history persistence
  console.log('\n── 10. History ──');
  clearHistory('h99', 'cn');
  addHistoryEntry('h99', 'cn', { ts: 1, name: 'V1', description: '', prompt: 'p1', category: 'Dev' });
  await saveHistory();
  ctx._historyCache = {};
  await loadHistory();
  eq(getHistory('h99', 'cn').length, 1, '10.1 persisted');

  // 11. methods
  console.log('\n── 11. Methods ──');
  ok(typeof reg.bootstrap === 'function', '11.1 bootstrap');
  ok(typeof reg.switchLanguage === 'function', '11.2 switchLanguage');
  ok(typeof reg.fetchLatestMdVersion === 'function', '11.3 fetchLatestMdVersion');
  ok(typeof reg.waitSync === 'function', '11.4 waitSync');
  ok(typeof reg.createUserSkill === 'function', '11.5 createUserSkill');

  const total = passed + failed;
  console.log('\n═══════════════════════════════════════');
  console.log('  结果: ' + passed + ' / ' + total + ' 通过');
  console.log(failed > 0 ? '  ❌ ' + failed + ' 失败' : '  ✅ 全部通过');
  console.log('═══════════════════════════════════════');
  if (failed > 0) process.exit(1);
}
run().catch(e => { console.error(e); process.exit(1); });
