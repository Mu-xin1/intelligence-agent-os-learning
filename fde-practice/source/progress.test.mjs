import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeState, parseBackup, canComplete, STORAGE_KEY } from './progress.mjs';
test('new course storage does not use legacy course keys',()=>{assert.equal(STORAGE_KEY,'ai-fde-practice-15-progress-v1');});
test('completion requires all checks and actual evidence',()=>{
  assert.equal(canComplete({checks:[true,true,true],note:'  '}),false);
  assert.equal(canComplete({checks:[true,false,true],note:'observed'}),false);
  assert.equal(canComplete({checks:[true,true,true],note:'request and stored state verified'}),true);
  const input={days:{1:{checks:[true,true,false],note:'done',done:true}}};
  assert.equal(normalizeState(input).days[1].done,false);
  assert.equal(input.days[1].done,true);
});
test('backup roundtrip retains evidence as text and valid progress',()=>{
  const state=normalizeState({theme:'dark',days:{1:{checks:[true,true,true],note:'<script>alert(1)</script>\n实际结果：成功',done:true}}});
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify({schema:'ai-fde-practice-15',version:1,state}))),state);
});
test('wrong course or corrupt backup fails before replacing records',()=>{
  for(const payload of [null,[],{schema:'ai-fde-standalone-progress'}, {schema:'ai-fde-practice-15',version:2,state:{days:{}}},{schema:'ai-fde-practice-15',version:1,state:[]},{schema:'ai-fde-practice-15',version:1,state:{}}])assert.throws(()=>parseBackup(payload));
});
test('untrusted import is bounded and cannot create extra days',()=>{
  const state=normalizeState({days:{1:{checks:[true,true,true],note:'x'.repeat(25000),done:true},16:{note:'outside course',done:true}}});
  assert.equal(state.days[1].note.length,20000);assert.equal(state.days[16],undefined);
});
