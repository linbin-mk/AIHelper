/**
 * SkillRegistry + skill-storage 自测用例
 * 在扩展面板 console 中执行：window.__runSkillTests()
 */

window.__runSkillTests = async function () {
  var results = [];
  var passed = 0;
  var failed = 0;

  function assert(cond, name) {
    if (cond) {
      results.push('  PASS: ' + name);
      passed++;
    } else {
      results.push('  FAIL: ' + name);
      failed++;
    }
  }

  function assertEqual(actual, expected, name) {
    if (actual === expected) {
      results.push('  PASS: ' + name + ' (=' + JSON.stringify(expected) + ')');
      passed++;
    } else {
      results.push('  FAIL: ' + name + ' (got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected) + ')');
      failed++;
    }
  }

  console.log('═══════════════════════════════════════');
  console.log('  SkillRegistry + skill-storage 自测');
  console.log('═══════════════════════════════════════');

  // ─── 1. 基础注册与查询 ───
  console.log('\n── 1. 基础注册与查询 ──');
  var reg = new SkillRegistry();

  var skillA = { id: 'test-a', name: '测试A', description: '描述A', category: 'Development', _prompt: '# Prompt A', getPrompt: function () { return this._prompt; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } };
  var skillB = { id: 'test-b', name: '测试B', description: '描述B', category: 'Testing', _prompt: '# Prompt B', getPrompt: function () { return this._prompt; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } };
  var skillC = { id: 'test-c', name: '测试C', description: '描述C', category: 'Product', _prompt: '# Prompt C', getPrompt: function () { return this._prompt; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } };

  reg.register(skillA);
  reg.register(skillB);
  reg.register(skillC);
  assertEqual(reg.getAll().length, 3, '1.1 register 3 skills');
  assert(reg.getAll().findIndex(function (s) { return s.id === 'test-a'; }) >= 0, '1.2 skill test-a exists');

  // ─── 2. unregister (删除) ───
  console.log('\n── 2. unregister ──');
  reg.unregister('test-b');
  assertEqual(reg.getAll().length, 2, '2.1 getAll() excludes deleted skill');
  assert(reg.getAll().findIndex(function (s) { return s.id === 'test-b'; }) === -1, '2.2 deleted skill not in getAll()');
  assert(reg._deletedIds.has('test-b'), '2.3 _deletedIds contains test-b');

  // ─── 3. update (编辑) ───
  console.log('\n── 3. update ──');
  reg.update('test-a', { name: '测试A编辑', description: '描述A编辑', _prompt: '# Edited Prompt' }, 'cn');
  var editedA = reg.getAll().find(function (s) { return s.id === 'test-a'; });
  assert(editedA !== undefined, '3.1 edited skill still in getAll()');
  assertEqual(editedA.name, '测试A编辑', '3.2 name updated');
  assertEqual(editedA.description, '描述A编辑', '3.3 description updated');
  assertEqual(editedA._prompt, '# Edited Prompt', '3.4 _prompt updated');
  assert(editedA._edits && editedA._edits.cn, '3.5 _edits.cn exists');
  assertEqual(editedA._edits.cn.name, '测试A编辑', '3.6 _edits.cn.name correct');

  // update non-existent skill returns false
  var result = reg.update('nonexistent', { name: 'x' }, 'cn');
  assert(result === false, '3.7 update non-existent returns false');

  // ─── 4. getOverrides ───
  console.log('\n── 4. getOverrides ──');
  var overrides = reg.getOverrides();
  assert(overrides.deletedIds.indexOf('test-b') >= 0, '4.1 deletedIds contains test-b');
  assert(overrides.deletedIds.indexOf('test-a') === -1, '4.2 deletedIds does NOT contain test-a');
  assert(overrides.editedSkills['test-a'] !== undefined, '4.3 editedSkills has test-a');
  assert(overrides.editedSkills['test-a']['cn'] !== undefined, '4.4 editedSkills.test-a.cn exists');
  assertEqual(overrides.editedSkills['test-a']['cn'].name, '测试A编辑', '4.5 edited name stored');

  // 编辑英文版本
  reg.update('test-c', { name: 'Test C Edited' }, 'en');
  var overrides2 = reg.getOverrides();
  assert(overrides2.editedSkills['test-c'] !== undefined, '4.6 editedSkills has test-c');
  assert(overrides2.editedSkills['test-c']['en'] !== undefined, '4.7 editedSkills.test-c.en exists');

  // ─── 5. resetSkill ───
  console.log('\n── 5. resetSkill ──');
  // 先注册一个技能使 reset 能找到它
  reg.register({ id: 'test-reset', name: 'ResetTest', description: '', category: 'Development', _prompt: '# Original', getPrompt: function () { return this._prompt; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } });
  reg.update('test-reset', { name: 'ResetTest Edited' }, 'cn');

  // mock _fetchSkillMd 使 reset 能正常执行
  var origFetch = reg._fetchSkillMd;
  var fetchCalls = [];
  reg._fetchSkillMd = async function (skillId, lang) {
    fetchCalls.push({ skillId: skillId, lang: lang });
    if (skillId === 'test-reset') {
      return '---\nid: test-reset\nname: ResetTest\ncategory: Development\n---\n# Original Prompt';
    }
    return null;
  };

  await reg.resetSkill('test-reset', 'cn');
  var resetS = reg.getAll().find(function (s) { return s.id === 'test-reset'; });
  assertEqual(resetS.name, 'ResetTest', '5.1 reset restores built-in name');
  assertEqual(resetS._prompt, '# Original Prompt', '5.2 reset restores built-in _prompt');
  assert(!resetS._edits || !resetS._edits.cn, '5.3 _edits.cn cleared');
  assert(!resetS._edits || Object.keys(resetS._edits).length === 0, '5.4 _edits empty');
  assert(fetchCalls.length >= 1, '5.5 _fetchSkillMd was called');

  reg._fetchSkillMd = origFetch;

  // reset non-edited skill
  reg.register({ id: 'test-reset2', name: 'R2', description: '', category: 'Testing', _prompt: '# R2', getPrompt: function () { return this._prompt; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } });
  await reg.resetSkill('test-reset2', 'cn');
  var r2 = reg.getAll().find(function (s) { return s.id === 'test-reset2'; });
  assert(r2 !== undefined, '5.6 reset non-edited skill still exists');

  // ─── 6. activate / deactivate ───
  console.log('\n── 6. activate / deactivate ──');
  reg.activate('test-a');
  assert(reg.isActive('test-a'), '6.1 activate sets active');
  reg.activate('test-c');
  assertEqual(reg.getActive().length, 2, '6.2 getActive returns 2');
  reg.deactivate('test-a');
  assert(!reg.isActive('test-a'), '6.3 deactivate clears active');
  assertEqual(reg.getActive().length, 1, '6.4 getActive returns 1');

  // ─── 7. 事件通知 ───
  console.log('\n── 7. 事件通知 ──');
  var events = [];
  reg.onSkillEvent(function (e) { events.push(e); });
  reg.register({ id: 'test-d', name: 'D', description: '', category: 'Other', _prompt: '', getPrompt: function () { return ''; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } });
  reg.update('test-d', { name: 'D updated' }, 'cn');
  reg.unregister('test-d');
  assertEqual(events.length, 3, '7.1 3 events fired');
  assertEqual(events[0].type, 'register', '7.2 register event');
  assertEqual(events[1].type, 'update', '7.3 update event');
  assertEqual(events[2].type, 'unregister', '7.4 unregister event');

  // ─── 8. applyOverrides ───
  console.log('\n── 8. applyOverrides ──');
  var reg2 = new SkillRegistry();
  reg2.register({ id: 'x1', name: 'X1', description: '', category: 'Development', _prompt: '# X1', getPrompt: function () { return this._prompt; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } });
  reg2.register({ id: 'x2', name: 'X2', description: '', category: 'Testing', _prompt: '# X2', getPrompt: function () { return this._prompt; }, getTools: function () { return []; }, getUIDelegate: function () { return null; } });

  var testOverrides = {
    deletedIds: ['x2'],
    editedSkills: {
      x1: { cn: { name: 'X1编辑', description: 'desc', _prompt: '# X1 Edited', category: 'Product' } }
    }
  };
  reg2.applyOverrides(testOverrides);

  assertEqual(reg2.getAll().length, 1, '8.1 deleted x2 filtered');
  var edited = reg2.getAll().find(function (s) { return s.id === 'x1'; });
  assertEqual(edited.name, 'X1编辑', '8.2 applyOverrides updates name');
  assertEqual(edited.category, 'Product', '8.3 applyOverrides updates category');

  // ─── 9. getCurrentLangSuffix ───
  console.log('\n── 9. getCurrentLangSuffix ──');
  if (typeof getCurrentLangSuffix === 'function') {
    assertEqual(getCurrentLangSuffix(), 'cn', '9.1 default lang is cn');

    // 模拟英文环境
    var origLang = window.__i18nMessages ? window.__i18nMessages._lang : null;
    if (window.__i18nMessages) {
      window.__i18nMessages._lang = 'en';
      assertEqual(getCurrentLangSuffix(), 'en', '9.2 en lang returns en');
      window.__i18nMessages._lang = 'zh-CN';
      assertEqual(getCurrentLangSuffix(), 'cn', '9.3 zh-CN returns cn');
      if (origLang) window.__i18nMessages._lang = origLang;
    }
  }

  // ─── 10. saveOverrides / loadOverrides ───
  console.log('\n── 10. saveOverrides / loadOverrides ──');
  if (typeof saveOverrides === 'function' && typeof loadOverrides === 'function') {
    var testData = {
      deletedIds: ['skill-x'],
      editedSkills: {
        'skill-y': { cn: { name: 'Y编辑', description: '', _prompt: '', category: 'Development' } }
      }
    };
    await saveOverrides(testData);
    var loaded = await loadOverrides();
    assert(loaded.deletedIds !== undefined, '10.1 loaded has deletedIds');
    assert(loaded.editedSkills !== undefined, '10.2 loaded has editedSkills');
    assertEqual(loaded.deletedIds[0], 'skill-x', '10.3 deletedIds persisted');
    assert(loaded.editedSkills['skill-y'] !== undefined, '10.4 editedSkills persisted');
    assertEqual(loaded.editedSkills['skill-y'].cn.name, 'Y编辑', '10.5 edited name persisted');

    // 清理测试数据
    await saveOverrides({ deletedIds: [], editedSkills: {} });
    var cleared = await loadOverrides();
    assertEqual(cleared.deletedIds.length, 0, '10.6 cleanup - deletedIds empty');
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  最终结果: ' + passed + ' 通过 / ' + (passed + failed) + ' 总计');
  if (failed > 0) {
    console.log('  ❌ ' + failed + ' 个测试失败');
  } else {
    console.log('  ✅ 全部通过');
  }
  console.log('═══════════════════════════════════════');

  results.forEach(function (r) { console.log(r); });

  return { passed: passed, failed: failed, total: passed + failed };
};
