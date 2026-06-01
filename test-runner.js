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
  path.join(__dirname, 'shared/skill-registry.js')
]);

// Stats
let passed = 0, failed = 0;
const saveOverrides = ctx.saveOverrides;
const loadOverrides = ctx.loadOverrides;
const SkillRegistry = ctx.SkillRegistry;

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

  // 汇总
  const total = passed + failed;
  console.log('\n═══════════════════════════════════════');
  console.log('  测试结果: ' + passed + ' / ' + total + ' 通过');
  console.log(failed > 0 ? '  ❌ ' + failed + ' 失败' : '  ✅ 全部通过');
  console.log('═══════════════════════════════════════');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });
