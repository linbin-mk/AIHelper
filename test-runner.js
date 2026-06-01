/**
 * Node.js test runner — validates SkillRegistry + skill-storage API surface
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock chrome APIs
const chrome = {
  runtime: { getURL: (p) => 'chrome-extension://mock/' + p },
  storage: {
    local: {
      _store: {},
      get: async function (keys) {
        if (Array.isArray(keys)) {
          const r = {};
          keys.forEach(k => { r[k] = this._store[k]; });
          return r;
        }
        if (typeof keys === 'object') {
          const r = {};
          Object.keys(keys).forEach(k => { r[k] = this._store[k] !== undefined ? this._store[k] : keys[k]; });
          return r;
        }
        return { [keys]: this._store[keys] };
      },
      set: async function (items) { Object.assign(this._store, items); }
    }
  }
};

const window = {};

function loadScripts(filePaths) {
  const ctx = { chrome, window, console, setTimeout, setInterval, clearTimeout, clearInterval, Promise };
  vm.createContext(ctx);
  filePaths.forEach(fp => {
    const src = fs.readFileSync(fp, 'utf8')
      .replace(/^class\s+(\w+)/gm, '$1 = class');
    vm.runInContext(src, ctx, { filename: fp });
  });
  return ctx;
}

const ctx = loadScripts([
  path.join(__dirname, 'shared/skill-storage.js'),
  path.join(__dirname, 'shared/skill-registry.js'),
  path.join(__dirname, 'shared/skill-history.js')
]);

// Stats
let passed = 0, failed = 0;
const saveOverrides = ctx.saveOverrides;
const loadOverrides = ctx.loadOverrides;
const SkillRegistry = ctx.SkillRegistry;
const loadHistory = ctx.loadHistory;
const saveHistory = ctx.saveHistory;
const addHistoryEntry = ctx.addHistoryEntry;
const getHistory = ctx.getHistory;
const clearHistory = ctx.clearHistory;

function ok(cond, name) {
  if (cond) { console.log('  PASS: ' + name); passed++; }
  else { console.log('  FAIL: ' + name); failed++; }
}
function eq(a, b, name) {
  if (a === b) { console.log('  PASS: ' + name + ' (=' + JSON.stringify(b) + ')'); passed++; }
  else { console.log('  FAIL: ' + name + ' (got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b) + ')'); failed++; }
}

function s(id, name, desc, cat, prompt) {
  return { id, name, description: desc || '', category: cat || 'Other', _prompt: prompt || '',
    getPrompt() { return this._prompt; }, getTools() { return []; }, getUIDelegate() { return null; } };
}

async function run() {
  console.log('═══════════════════════════════════════');
  console.log('  SkillRegistry + skill-storage 测试报告');
  console.log('═══════════════════════════════════════');

  const reg = new SkillRegistry();

  // 1. register + getAll
  console.log('\n── 1. 注册与查询 ──');
  reg.register(s('a', '技能A', 'descA', 'Development', '#A'));
  reg.register(s('b', '技能B', 'descB', 'Testing', '#B'));
  reg.register(s('c', '技能C', 'descC', 'Product', '#C'));
  eq(reg.getAll().length, 3, '1.1 注册 3 个 → getAll()=3');
  ok(reg.getAll().find(s => s.id === 'a'), '1.2 技能 a 存在');

  // 2. unregister
  console.log('\n── 2. 删除技能 ──');
  reg.unregister('b');
  eq(reg.getAll().length, 2, '2.1 删除 b 后 getAll()=2');
  ok(reg.getAll().findIndex(s => s.id === 'b') === -1, '2.2 b 已从列表移除');
  ok(reg._deletedIds.has('b'), '2.3 _deletedIds 包含 b');

  // 3. update
  console.log('\n── 3. 编辑技能 ──');
  reg.update('a', { name: 'A已编辑', description: 'descA改', _prompt: '#Edited' }, 'cn');
  const a = reg.getAll().find(s => s.id === 'a');
  eq(a.name, 'A已编辑', '3.1 name 更新');
  eq(a.description, 'descA改', '3.2 description 更新');
  eq(a._prompt, '#Edited', '3.3 _prompt 更新');
  ok(a._edits && a._edits.cn && a._edits.cn.name === 'A已编辑', '3.4 _edits.cn 已记录');
  ok(a._edits && a._edits.cn, '3.5 cn 编辑已存储');
  ok(reg.update('nonexist', { name: 'x' }, 'cn') === false, '3.6 不存在的技能返回 false');

  // 编辑英文版
  reg.update('c', { name: 'C English' }, 'en');
  const c = reg.getAll().find(s => s.id === 'c');
  eq(c.name, 'C English', '3.6 英文版编辑 name');
  ok(c._edits && c._edits.en && c._edits.en.name === 'C English', '3.7 _edits.en 已记录');

  // 4. getOverrides
  console.log('\n── 4. 导出覆盖数据 ──');
  const ov = reg.getOverrides();
  ok(ov.deletedIds.includes('b'), '4.1 deletedIds 含 b');
  ok(ov.editedSkills.a && ov.editedSkills.a.cn && ov.editedSkills.a.cn.name === 'A已编辑', '4.2 cn 编辑数据已导出');
  ok(ov.editedSkills.c && ov.editedSkills.c.en && ov.editedSkills.c.en.name === 'C English', '4.3 en 编辑数据已导出');

  // 5. resetSkill
  console.log('\n── 5. 重置技能 ──');
  reg.register(s('r1', 'R1Original', '', 'Development', '#R1orig'));
  reg.update('r1', { name: 'R1Edited', _prompt: '#R1edit' }, 'cn');

  // Mock fetch to return MD content
  const origFetch = SkillRegistry.prototype._fetchSkillMd;
  SkillRegistry.prototype._fetchSkillMd = async (id, lang) => {
    if (id === 'r1' && lang === 'cn')
      return '---\nid: r1\nname: R1Original\ncategory: Development\n---\n#R1orig';
    return null;
  };

  await reg.resetSkill('r1', 'cn');
  const r1 = reg.getAll().find(s => s.id === 'r1');
  eq(r1.name, 'R1Original', '5.1 名称恢复为内置值');
  eq(r1._prompt, '#R1orig', '5.2 _prompt 恢复');
  ok(!r1._edits || !r1._edits.cn, '5.3 _edits.cn 已清除');
  ok(!r1._edits || Object.keys(r1._edits).length === 0, '5.4 _edits 为空');
  SkillRegistry.prototype._fetchSkillMd = origFetch;

  // 6. activate/deactivate
  console.log('\n── 6. 激活/停用 ──');
  reg.activate('a');
  reg.activate('c');
  eq(reg.getActive().length, 2, '6.1 激活2个 → getActive()=2');
  reg.deactivate('a');
  eq(reg.getActive().length, 1, '6.2 停用a → getActive()=1');
  ok(!reg.isActive('a'), '6.3 a 非活跃');
  ok(reg.isActive('c'), '6.4 c 仍活跃');

  // 7. events
  console.log('\n── 7. 事件通知 ──');
  const evts = [];
  reg.onSkillEvent(e => evts.push(e));
  reg.register(s('ev1', 'Ev1'));
  reg.update('ev1', { name: 'Ev1u' }, 'cn');
  reg.unregister('ev1');
  ok(evts.length >= 3, '7.1 至少触发3个事件');
  eq(evts[0].type, 'register', '7.2 register');
  eq(evts[1].type, 'update', '7.3 update');
  eq(evts[2].type, 'unregister', '7.4 unregister');

  // 8. applyOverrides
  console.log('\n── 8. 应用覆盖 ──');
  const reg2 = new SkillRegistry();
  reg2.register(s('x1', 'X1', '', 'Development', '#X1'));
  reg2.register(s('x2', 'X2', '', 'Testing', '#X2'));
  reg2.applyOverrides({
    deletedIds: ['x2'],
    editedSkills: { x1: { cn: { name: 'X1改', description: 'd', _prompt: '#X1e', category: 'Product' } } }
  });
  eq(reg2.getAll().length, 1, '8.1 x2 被过滤 → 1个');
  const x1 = reg2.getAll().find(s => s.id === 'x1');
  eq(x1.name, 'X1改', '8.2 name 覆盖');
  eq(x1.category, 'Product', '8.3 category 覆盖');

  // 9. 存储持久化
  console.log('\n── 9. 存储持久化 ──');
  const td = { deletedIds: ['dx'], editedSkills: { dy: { cn: { name: 'DY', description: '', _prompt: '', category: 'Development' } } } };
  await saveOverrides(td);
  const ld = await loadOverrides();
  eq(ld.deletedIds[0], 'dx', '9.1 deletedIds 持久化');
  ok(ld.editedSkills.dy && ld.editedSkills.dy.cn && ld.editedSkills.dy.cn.name === 'DY', '9.2 editedSkills 持久化');

  await saveOverrides({ deletedIds: [], editedSkills: {} });
  eq((await loadOverrides()).deletedIds.length, 0, '9.3 清理后 deletedIds 为空');

  // 10. 语言版本隔离
  console.log('\n── 10. 语言版本隔离 ──');
  const reg3 = new SkillRegistry();
  reg3.register(s('lang', 'Lang原', '', 'Development', '#lang'));
  reg3.update('lang', { name: 'Lang中文' }, 'cn');
  const cnOv = reg3.getOverrides();
  ok(cnOv.editedSkills.lang && cnOv.editedSkills.lang.cn && cnOv.editedSkills.lang.cn.name === 'Lang中文', '10.1 cn 编辑存在');
  ok(!(cnOv.editedSkills.lang && cnOv.editedSkills.lang.en), '10.2 en 编辑不存在（语言隔离）');

  reg3.update('lang', { name: 'LangEnglish' }, 'en');
  const enOv = reg3.getOverrides();
  ok(enOv.editedSkills.lang.cn, '10.3 cn 编辑仍存在（未被en覆盖）');
  eq(enOv.editedSkills.lang.en.name, 'LangEnglish', '10.4 en 编辑已添加');
  ok(enOv.editedSkills.lang.cn.name !== enOv.editedSkills.lang.en.name, '10.5 中英文编辑内容独立');

  // 11. 技能编辑历史记录
  console.log('\n── 11. 技能编辑历史记录 ──');
  clearHistory('h1', 'cn');
  clearHistory('h1', 'en');

  eq(getHistory('h1', 'cn').length, 0, '11.1 无历史记录');

  addHistoryEntry('h1', 'cn', { ts: 100, name: 'V0原始', description: 'd0', _prompt: 'p0', category: 'Development' });
  eq(getHistory('h1', 'cn').length, 1, '11.2 添加后1条');
  eq(getHistory('h1', 'cn')[0].name, 'V0原始', '11.3 条目名称正确');

  addHistoryEntry('h1', 'cn', { ts: 200, name: 'V1编辑', description: 'd1', _prompt: 'p1', category: 'Development' });
  eq(getHistory('h1', 'cn').length, 2, '11.4 追加后2条');
  eq(getHistory('h1', 'cn')[1].ts, 200, '11.5 时间戳正确');

  // 跨语言隔离
  addHistoryEntry('h1', 'en', { ts: 300, name: 'EN V0', description: 'ed', _prompt: 'ep', category: 'Testing' });
  eq(getHistory('h1', 'en').length, 1, '11.6 en历史独立');
  eq(getHistory('h1', 'cn').length, 2, '11.7 cn历史未被en影响');

  // 持久化
  await saveHistory();
  ctx._historyCache = {};
  await loadHistory();
  eq(getHistory('h1', 'cn').length, 2, '11.8 持久化后 cn 历史恢复');
  eq(getHistory('h1', 'en').length, 1, '11.9 持久化后 en 历史恢复');

  // 上限清理 (MAX_HISTORY_ENTRIES = 20)
  addHistoryEntry('h1', 'cn', { ts: 10, name: 'Seed', description: '', _prompt: '', category: '' });
  eq(getHistory('h1', 'cn').length, 3, '11.10 清理前3条');
  for (var i = 0; i < 20; i++) {
    addHistoryEntry('h1', 'cn', { ts: 1000 + i, name: 'V' + i, description: '', _prompt: '', category: '' });
  }
  eq(getHistory('h1', 'cn').length, 20, '11.11 上限保持20条');
  eq(getHistory('h1', 'cn')[0].ts, 1000, '11.12 最初3条被后续20条全部挤出, 第一条为 ts=1000');

  // 12. SkillRegistry.update() 与 getHistory() 集成测试
  console.log('\n── 12. update() → 历史自动捕获 + getHistory() ──');
  clearHistory('int1', 'cn');

  var reg4 = new SkillRegistry();
  reg4.register(s('int1', '内置名称', '内置描述', 'Development', '#内置Prompt'));

  eq(reg4.getHistory('int1', 'cn').length, 0, '12.1 初始无历史');

  reg4.update('int1', { name: '第1次编辑', description: 'd1', _prompt: '#p1' }, 'cn');
  var h1 = reg4.getHistory('int1', 'cn');
  eq(h1.length, 1, '12.2 update() 产生1条历史');
  eq(h1[0].name, '内置名称', '12.3 历史记录了保存前的名称');
  eq(h1[0]._prompt, '#内置Prompt', '12.4 历史记录了保存前的_prompt');
  ok(typeof h1[0].ts === 'number' && h1[0].ts > 0, '12.5 时间戳存在');

  reg4.update('int1', { name: '第2次编辑' }, 'cn');
  var h2 = reg4.getHistory('int1', 'cn');
  eq(h2.length, 2, '12.6 第二次update产生第2条历史');
  eq(h2[1].name, '第1次编辑', '12.7 第2条历史记录了第一次编辑后的名称');

  // getHistory 跨语言隔离
  eq(reg4.getHistory('int1', 'en').length, 0, '12.8 en语言无历史');

  // getHistory 不存在的技能返回空数组
  eq(reg4.getHistory('notexist', 'cn').length, 0, '12.9 不存在技能返回空数组');

  // 汇总
  const total = passed + failed;
  console.log('\n═══════════════════════════════════════');
  console.log('  测试结果: ' + passed + ' / ' + total + ' 通过');
  console.log(failed > 0 ? '  ❌ ' + failed + ' 失败' : '  ✅ 全部通过');
  console.log('═══════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });
