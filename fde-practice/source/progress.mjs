export const STORAGE_KEY = 'ai-fde-practice-15-progress-v1';
export function normalizeState(input) {
  const result = { version: 1, theme: 'light', days: {} };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  if (input.theme === 'dark') result.theme = 'dark';
  for (let day = 1; day <= 15; day++) {
    const item = input.days?.[day];
    if (!item || typeof item !== 'object') continue;
    const checks = [0, 1, 2].map(i => item.checks?.[i] === true);
    const note = typeof item.note === 'string' ? item.note.slice(0, 20000) : '';
    result.days[day] = { checks, note, done: item.done === true && checks.every(Boolean) && note.trim().length > 0 };
  }
  return result;
}
export function parseBackup(payload) {
  if (payload?.schema !== 'ai-fde-practice-15' || payload.version !== 1 || !payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state) || !payload.state.days || typeof payload.state.days !== 'object' || Array.isArray(payload.state.days)) throw new Error('请选择本课程导出的进度文件。');
  return normalizeState(payload.state);
}
export function canComplete(item) {
  return Boolean(item && [0, 1, 2].every(i => item.checks?.[i] === true) && typeof item.note === 'string' && item.note.trim());
}
