window.COS = window.COS || {};

COS.Data = (function () {
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  const SETTINGS_KEY = 'cos_settings';
  const HABITS_KEY = 'cos_habits';
  const monthKey = (y, m) => `cos_data_${y}-${String(m + 1).padStart(2, '0')}`;

  const defaultSettings = {
    userName: 'Friend',
    role: 'Founder',
    theme: 'light',
    weekColors: ['#7EB8F7', '#F9A8D4', '#6EE7B7', '#FDE68A', '#C4B5FD'],
    affirmation: 'I am disciplined, focused, and building momentum every single day.',
    quote: 'Trust the process. Every small step builds unstoppable momentum.'
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
    } catch (e) { return { ...defaultSettings }; }
  }

  function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

  function loadHabits() {
    try {
      const raw = localStorage.getItem(HABITS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveHabits(h) { localStorage.setItem(HABITS_KEY, JSON.stringify(h)); }

  function loadMonthData(y, m) {
    try {
      const raw = localStorage.getItem(monthKey(y, m));
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveMonthData(y, m, data) {
    localStorage.setItem(monthKey(y, m), JSON.stringify(data));
  }

  function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function getFirstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

  function getWeekIndex(day) { return Math.min(Math.floor((day - 1) / 7), 4); }

  function toggleHabitDay(habitId, day) {
    const data = loadMonthData(currentYear, currentMonth);
    const key = `${habitId}_${day}`;
    data[key] = !data[key];
    saveMonthData(currentYear, currentMonth, data);
    return data[key];
  }

  function isChecked(habitId, day, data) {
    return !!(data && data[`${habitId}_${day}`]);
  }

  function getStreak(habitId) {
    const today = new Date();
    if (today.getFullYear() !== currentYear || today.getMonth() !== currentMonth) return 0;
    const data = loadMonthData(currentYear, currentMonth);
    let day = today.getDate();
    if (!data[`${habitId}_${day}`]) day--;
    let streak = 0;
    while (day >= 1 && data[`${habitId}_${day}`]) { streak++; day--; }
    return streak;
  }

  function getLongestStreak(habitId) {
    const days = getDaysInMonth(currentYear, currentMonth);
    const data = loadMonthData(currentYear, currentMonth);
    let longest = 0, cur = 0;
    for (let d = 1; d <= days; d++) {
      if (data[`${habitId}_${d}`]) { cur++; longest = Math.max(longest, cur); }
      else cur = 0;
    }
    return longest;
  }

  function getActiveHabitsForDay(habits, day) {
    return habits.filter(h => {
      if (!h.frequency || h.frequency === 'daily') return true;
      const dow = new Date(currentYear, currentMonth, day).getDay();
      if (h.frequency === 'weekdays') return dow !== 0 && dow !== 6;
      if (Array.isArray(h.frequency)) return h.frequency.includes(dow);
      return true;
    });
  }

  function getDailyCompletion(day) {
    const habits = loadHabits();
    if (!habits.length) return 0;
    const data = loadMonthData(currentYear, currentMonth);
    const active = getActiveHabitsForDay(habits, day);
    if (!active.length) return 0;
    return Math.round(active.filter(h => data[`${h.id}_${day}`]).length / active.length * 100);
  }

  function getWeeklyCompletion(weekIndex) {
    const start = weekIndex * 7 + 1;
    const end = Math.min(start + 6, getDaysInMonth(currentYear, currentMonth));
    const habits = loadHabits();
    if (!habits.length) return 0;
    const data = loadMonthData(currentYear, currentMonth);
    let total = 0, done = 0;
    for (let d = start; d <= end; d++) {
      const active = getActiveHabitsForDay(habits, d);
      total += active.length;
      done += active.filter(h => data[`${h.id}_${d}`]).length;
    }
    return total ? Math.round(done / total * 100) : 0;
  }

  function getMonthlyCompletion() {
    const days = getDaysInMonth(currentYear, currentMonth);
    const habits = loadHabits();
    if (!habits.length) return { pct: 0, done: 0, total: 0 };
    const data = loadMonthData(currentYear, currentMonth);
    const today = new Date();
    const isCurrent = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    const maxDay = isCurrent ? today.getDate() : days;
    let total = 0, done = 0;
    for (let d = 1; d <= maxDay; d++) {
      const active = getActiveHabitsForDay(habits, d);
      total += active.length;
      done += active.filter(h => data[`${h.id}_${d}`]).length;
    }
    return { pct: total ? Math.round(done / total * 100) : 0, done, total };
  }

  function getHabitCompletion(habitId) {
    const days = getDaysInMonth(currentYear, currentMonth);
    const data = loadMonthData(currentYear, currentMonth);
    const today = new Date();
    const isCurrent = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    const maxDay = isCurrent ? today.getDate() : days;
    let done = 0;
    for (let d = 1; d <= maxDay; d++) { if (data[`${habitId}_${d}`]) done++; }
    return { done, total: maxDay, pct: maxDay ? Math.round(done / maxDay * 100) : 0 };
  }

  function getTopHabits(limit = 10) {
    return loadHabits()
      .map(h => ({ ...h, ...getHabitCompletion(h.id) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, limit);
  }

  function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function exportJSON() {
    const out = { settings: loadSettings(), habits: loadHabits(), monthData: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('cos_data_')) out.monthData[k] = JSON.parse(localStorage.getItem(k));
    }
    return JSON.stringify(out, null, 2);
  }

  function importJSON(str) {
    const d = JSON.parse(str);
    if (d.settings) saveSettings(d.settings);
    if (d.habits) saveHabits(d.habits);
    if (d.monthData) Object.keys(d.monthData).forEach(k => localStorage.setItem(k, JSON.stringify(d.monthData[k])));
  }

  function resetMonth() { saveMonthData(currentYear, currentMonth, {}); }

  return {
    get currentYear() { return currentYear; },
    get currentMonth() { return currentMonth; },
    setCurrentYear(y) { currentYear = y; },
    setCurrentMonth(m) { currentMonth = m; },
    loadSettings, saveSettings,
    loadHabits, saveHabits,
    loadMonthData, saveMonthData,
    getDaysInMonth, getFirstDayOfMonth, getWeekIndex,
    toggleHabitDay, isChecked,
    getStreak, getLongestStreak,
    getDailyCompletion, getWeeklyCompletion, getMonthlyCompletion,
    getHabitCompletion, getTopHabits,
    generateId, exportJSON, importJSON, resetMonth
  };
})();
