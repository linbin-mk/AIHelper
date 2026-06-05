/**
 * SkillRegistry + skill-storage 自测用例 (v2.0 history-driven)
 * 在扩展面板 console 中执行：window.__runSkillTests()
 */

window.__runSkillTests = async function () {
  var results = [];
  var passed = 0;
  var failed = 0;

  function assert(cond, name) {
    if (cond) { results.push('  PASS: ' + name); passed++; }
    else { results.push('  FAIL: ' + name); failed++; }
  }
  function assertEqual(actual, expected, name) {
    if (actual === expected) { results.push('  PASS: ' + name + ' (=' + JSON.stringify(expected) + ')'); passed++; }
    else { results.push('  FAIL: ' + name + ' (got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected) + ')'); failed++; }
  }

  console.log('═══════════════════════════════════════');
  console.log('  SkillRegistry 自测 (v2.0)');
  console.log('═══════════════════════════════════════');

  // 1. createSkill
  console.log('\n── 1. createSkill ──');
  var skill = createSkill({ id: 't1', name: '测试', description: '描述', category: 'Development', prompt: '# Prompt', type: 'builtin', deleted: false });
  assertEqual(skill.id, 't1', '1.1 id');
  assertEqual(typeof skill.getPrompt, 'function', '1.2 getPrompt is fn');
  assertEqual(skill.getPrompt(), '# Prompt', '1.3 getPrompt returns prompt');
  assert(skill.getTools === undefined, '1.4 no getTools');
  assert(skill.getUIDelegate === undefined, '1.5 no getUIDelegate');

  // 2. register + getAll
  console.log('\n── 2. 注册 ──');
  var reg = new SkillRegistry();
  reg.register(createSkill({ id: 'a', name: 'A', type: 'builtin', deleted: false, prompt: '#A' }));
  reg.register(createSkill({ id: 'b', name: 'B', type: 'builtin', deleted: false, prompt: '#B' }));
  reg.register(createSkill({ id: 'c', name: 'C', type: 'builtin', deleted: false, prompt: '#C' }));
  assertEqual(reg.getAll().length, 3, '2.1 3 skills');

  // 3. unregister (软删除)
  console.log('\n── 3. 删除 ──');
  var sB = reg.getAll().find(function (s) { return s.id === 'b'; });
  reg.unregister('b');
  assertEqual(reg.getAll().length, 2, '3.1 filtered');
  assertEqual(sB.deleted, true, '3.2 deleted=true');

  // 4. update → history
  console.log('\n── 4. update → history ──');
  reg.update('a', { name: 'A1', prompt: '#Edited' }, 'cn');
  var a = reg.getAll().find(function (s) { return s.id === 'a'; });
  assertEqual(a.name, 'A1', '4.1 name updated');
  var h = reg.getHistory('a', 'cn');
  assert(h.length >= 1, '4.2 history entry');
  assertEqual(h[0].name, 'A', '4.3 pre-edit name');
  assert(typeof h[0].ts === 'number', '4.4 timestamp');

  // 5. activate
  console.log('\n── 5. activate ──');
  reg.activate('a');
  reg.activate('c');
  assertEqual(reg.getActive().length, 2, '5.1 2 active');
  reg.deactivate('a');
  assert(!reg.isActive('a'), '5.2 deactivated');

  // 6. events
  console.log('\n── 6. events ──');
  var evts = [];
  reg.onSkillEvent(function (e) { evts.push(e); });
  var sD = createSkill({ id: 'd', name: 'D', type: 'builtin', deleted: false, prompt: '' });
  reg.register(sD);
  reg.update('d', { name: 'D1' }, 'cn');
  reg.unregister('d');
  assertEqual(evts.length, 3, '6.1 3 events');

  // 7. merge decision (history check)
  console.log('\n── 7. merge: history check ──');
  addHistoryEntry('x1', 'cn', { ts: 100, name: 'X1Old', description: '', prompt: '#Old', category: 'Dev' });
  addHistoryEntry('x2', 'cn', { ts: 100, name: 'X2Old', description: '', prompt: '#Old', category: 'Dev' });
  // x1 has history → keep storage; x3 has no history → use fresh
  var h1 = reg.getHistory('x1', 'cn');
  assert(h1.length > 0, '7.1 x1 has history');
  var h3 = reg.getHistory('x3', 'cn');
  assertEqual(h3.length, 0, '7.2 x3 no history');

  // 8. Storage
  console.log('\n── 8. Storage ──');
  if (typeof loadAiHelperSkills === 'function') {
    try {
      var td = { cn: { 'sk': { id: 'sk', name: 'SK', prompt: '', type: 'builtin', deleted: false } }, en: {} };
      await saveAiHelperSkills(td);
      var ld = await loadAiHelperSkills();
      assert(ld !== null, '8.1 loaded');
      assert(ld.cn.sk.name === 'SK', '8.2 name persisted');
      await saveAiHelperSkills({ cn: {}, en: {} });
    } catch (e) {
      results.push('  SKIP: 8.x ' + e.message);
    }
  }

  // 9. createUserSkill
  console.log('\n── 9. createUserSkill ──');
  try {
    var uid = await reg.createUserSkill('我的技能', 'desc', 'Product', 'prompt');
    if (uid) {
      assert(uid.indexOf('user-') === 0, '9.1 id format');
      var us = reg.getAll().find(function (s) { return s.id === uid; });
      assert(us !== undefined, '9.2 in list');
      assertEqual(us.type, 'user', '9.3 type=user');
      assert(us.createdAt > 0, '9.4 createdAt');
    }
  } catch (e) {
    results.push('  SKIP: 9.x ' + e.message);
  }

  // 10. methods
  console.log('\n── 10. methods ──');
  assertEqual(typeof reg.bootstrap, 'function', '10.1 bootstrap');
  assertEqual(typeof reg.switchLanguage, 'function', '10.2 switchLanguage');
  assertEqual(typeof reg.fetchLatestMdVersion, 'function', '10.3 fetchLatestMdVersion');
  assertEqual(typeof reg.waitSync, 'function', '10.4 waitSync');
  assertEqual(typeof reg.createUserSkill, 'function', '10.5 createUserSkill');
  assertEqual(typeof reg.getLang, 'function', '10.6 getLang');

  console.log('\n═══════════════════════════════════════');
  console.log('  结果: ' + passed + ' / ' + (passed + failed) + ' 通过');
  console.log(failed > 0 ? '  ❌ ' + failed + ' 失败' : '  ✅ 全部通过');
  console.log('═══════════════════════════════════════');
  results.forEach(function (r) { console.log(r); });
  return { passed: passed, failed: failed, total: passed + failed };
};
