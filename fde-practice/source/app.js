(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const cards = [...document.querySelectorAll('.day')];
  let state = normalizeState(null), timer, saveTimer;
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) state = normalizeState(JSON.parse(raw)); } catch { $('storage-warning').hidden = false; }
  function notify(message) { $('status').textContent = message; $('status').hidden = false; clearTimeout(timer); timer = setTimeout(() => { $('status').hidden = true; }, 3500); }
  function save() { clearTimeout(saveTimer); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { $('storage-warning').hidden = false; } }
  function item(day) { return state.days[day] ||= { checks: [false,false,false], note: '', done: false }; }
  function refresh() {
    document.body.dataset.theme = state.theme;
    $('theme').textContent = state.theme === 'dark' ? '浅色' : '深色';
    let complete = 0;
    cards.forEach(card => {
      const day = Number(card.dataset.day), entry = item(day), ready = canComplete(entry);
      if (!ready) entry.done = false;
      if (entry.done) complete++;
      const button = card.querySelector('.completion');
      button.disabled = !ready; button.setAttribute('aria-pressed', String(entry.done));
      button.textContent = entry.done ? '✓ 今日已验收' : '标记今日已验收';
      card.querySelector('.gate-hint').textContent = entry.done ? '已保留本次练习证据。' : ready ? '核对实际结果后，标记完成。' : '完成 3 项验收，并记录证据后可标记。';
      document.querySelector(`[data-nav="${day}"]`)?.classList.toggle('done', entry.done);
    });
    $('progress-value').textContent = `${complete} / 15`;
    $('progress-bar').value = complete;
    const next = cards.find(card => !item(Number(card.dataset.day)).done);
    $('continue').href = next ? `#day-${next.dataset.day}` : '#review';
    $('continue').textContent = next ? `继续 Day ${String(next.dataset.day).padStart(2,'0')} →` : '查看最终复盘 →';
  }
  function hydrate() {
    cards.forEach(card => {
      const entry = item(Number(card.dataset.day));
      card.querySelectorAll('[data-check]').forEach(input => { input.checked = entry.checks[Number(input.dataset.check)]; });
      card.querySelector('textarea').value = entry.note;
    });
    refresh();
  }
  cards.forEach(card => {
    const day = Number(card.dataset.day);
    card.addEventListener('change', event => {
      if (event.target.matches('[data-check]')) { item(day).checks[Number(event.target.dataset.check)] = event.target.checked; refresh(); save(); }
    });
    card.querySelector('textarea').addEventListener('input', event => {
      item(day).note = event.target.value.slice(0,20000); refresh(); clearTimeout(saveTimer); saveTimer = setTimeout(save, 250);
    });
    card.querySelector('.completion').addEventListener('click', () => { if (!canComplete(item(day))) return; item(day).done = !item(day).done; refresh(); save(); notify(`Day ${day} 进度已保存`); });
  });
  function applySearch() {
    const terms = $('search').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => { card.hidden = !terms.every(term => card.textContent.toLocaleLowerCase().includes(term)); if (!card.hidden) count++; });
    document.querySelectorAll('.week').forEach(week => { week.hidden = ![...week.querySelectorAll('.day')].some(card => !card.hidden); });
    $('empty').hidden = count > 0;
    $('search-count').textContent = terms.length ? `${count} 个练习日符合搜索` : '';
  }
  $('search').addEventListener('input', applySearch);
  function closeMenu() { $('sidebar').classList.remove('open'); $('scrim').classList.remove('show'); $('menu-open').setAttribute('aria-expanded','false'); if (innerWidth <= 760) $('sidebar').inert = true; }
  $('menu-open').addEventListener('click', () => { $('sidebar').inert = false; $('sidebar').classList.add('open'); $('scrim').classList.add('show'); $('menu-open').setAttribute('aria-expanded','true'); $('menu-close').focus(); });
  $('menu-close').addEventListener('click', () => { closeMenu(); $('menu-open').focus(); });
  $('scrim').addEventListener('click', closeMenu);
  function syncLayout() { if (innerWidth > 760) { $('sidebar').inert = false; closeMenu(); } else if (!$('sidebar').classList.contains('open')) $('sidebar').inert = true; document.documentElement.style.setProperty('--toolbar', `${$('toolbar').offsetHeight}px`); }
  addEventListener('resize', syncLayout);
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => { $('search').value = ''; applySearch(); closeMenu(); }));
  $('theme').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; refresh(); save(); });
  $('expand-all').addEventListener('click', () => {
    const details = cards.filter(card => !card.hidden).flatMap(card => [...card.querySelectorAll('details')]);
    const open = details.some(detail => !detail.open); details.forEach(detail => { detail.open = open; });
    $('expand-all').textContent = open ? '全部收起' : '全部展开';
  });
  function download(filename, text, type) { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
  $('export-json').addEventListener('click', () => { save(); download('AI-FDE-三周实战-学习进度.json', JSON.stringify({ schema:'ai-fde-practice-15', version:1, exportedAt:new Date().toISOString(), state },null,2),'application/json'); notify('已导出课程进度'); });
  $('export-md').addEventListener('click', () => {
    const lines = ['# AI FDE 三周实战 · 学习记录', '', `导出时间：${new Date().toLocaleString('zh-CN')}`, ''];
    cards.forEach(card => { const entry = item(Number(card.dataset.day)); lines.push(`## ${card.querySelector('h3').textContent.trim()}`, '', `状态：${entry.done ? '已验收' : '进行中'}`, '', ...[...card.querySelectorAll('.check-row')].map((row,i) => `- [${entry.checks[i] ? 'x' : ' '}] ${row.textContent.trim()}`), '', entry.note || '尚未记录证据。', ''); });
    download('AI-FDE-三周实战-学习记录.md',lines.join('\n'),'text/markdown;charset=utf-8');
  });
  $('import-trigger').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try { if (file.size > 1024*1024) throw new Error('文件超过 1 MB，请选择本课程导出的进度文件。'); const imported = parseBackup(JSON.parse(await file.text())); if (!confirm('导入会替换当前三周实战的本地记录。建议先导出备份。继续导入？')) return; state = imported; hydrate(); save(); notify('进度已导入'); } catch (error) { notify(`导入失败：${error.message}`); } finally { event.target.value = ''; }
  });
  let printState;
  addEventListener('beforeprint', () => { if (printState) return; printState = { search:$('search').value, open:[...document.querySelectorAll('details')].map(d => d.open) }; $('search').value = ''; applySearch(); document.querySelectorAll('details').forEach(d => { d.open = true; }); document.querySelectorAll('textarea').forEach(t => { t.style.height = `${t.scrollHeight}px`; }); });
  addEventListener('afterprint', () => { if (!printState) return; document.querySelectorAll('details').forEach((d,i) => { d.open = printState.open[i]; }); $('search').value = printState.search; printState = null; applySearch(); document.querySelectorAll('textarea').forEach(t => { t.style.height = ''; }); });
  $('print').addEventListener('click', () => window.print());
  addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('search').focus(); }
    if (event.key === 'Escape') { closeMenu(); $('search').value = ''; applySearch(); }
    if (event.key === 'Tab' && $('sidebar').classList.contains('open')) {
      const focusable = [...$('sidebar').querySelectorAll('a,button')], first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function updateReading() { const max = document.documentElement.scrollHeight - innerHeight; document.documentElement.style.setProperty('--read',String(max > 0 ? Math.max(0,Math.min(1,scrollY/max)) : 0)); let active; for (const card of cards) if (!card.hidden && card.getBoundingClientRect().top <= $('toolbar').offsetHeight+45) active = card.dataset.day; document.querySelectorAll('[data-nav]').forEach(link => { if (link.dataset.nav === active) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current'); }); }
  let frame; addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(() => { frame = null; updateReading(); }); },{passive:true});
  addEventListener('pagehide', save);
  hydrate(); syncLayout(); updateReading();
  const context = document.modelContext;
  if (context?.registerTool) {
    const lifecycle = new AbortController();
    const register = tool => { try { Promise.resolve(context.registerTool(tool, { signal:lifecycle.signal })).catch(() => {}); } catch {} };
    register({ name:'read_fde_practice_progress', title:'读取三周实战进度', description:'读取各日的验收进度与下一项练习，不读取笔记。', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:{readOnlyHint:true,untrustedContentHint:false}, execute(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Expected an empty object.');
      return { total:cards.length, days:cards.map(card => { const day = Number(card.dataset.day), entry=item(day); return {day,completed:entry.done,checksCompleted:entry.checks.filter(Boolean).length}; }) };
    }});
    register({ name:'open_fde_practice_lesson', title:'打开一天的练习', description:'清除搜索并打开指定课程，不修改验收进度或笔记。', inputSchema:{type:'object',properties:{day:{type:'integer',minimum:1,maximum:15}},required:['day'],additionalProperties:false}, annotations:{readOnlyHint:false,untrustedContentHint:false}, execute(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key=>key!=='day') || !Number.isInteger(input.day) || input.day<1 || input.day>15) throw new Error('day must be an integer from 1 to 15.');
      const card=$(`day-${input.day}`); if (!card) throw new Error('Lesson unavailable.'); $('search').value=''; applySearch(); closeMenu(); location.hash=`day-${input.day}`; card.scrollIntoView(); return {day:input.day,title:card.querySelector('h3').textContent.trim()};
    }});
    addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
