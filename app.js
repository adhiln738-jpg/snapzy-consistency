window.COS = window.COS || {};

COS.App = (function () {
  const D = COS.Data;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let activeTab = 'dashboard';

  // ── Toast ──────────────────────────────────────────
  function toast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type || 'info'}`;
    t.innerHTML = `<span class="toast-icon">${type==='fire'?'🔥':type==='success'?'✅':'ℹ️'}</span>${message}`;
    container.appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      t.addEventListener('animationend', () => t.remove());
    }, 3200);
  }

  // ── Tab Routing ────────────────────────────────────
  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-btn, .mobile-nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    const view = document.getElementById(`view-${tab}`);
    if (view) view.classList.add('active');
    if (tab === 'dashboard') COS.Dashboard.render();
    if (tab === 'habits')    COS.Habits.render();
    if (tab === 'stats')     COS.Stats.render();
    if (tab === 'settings')  COS.Settings.render();
  }

  // ── Month Navigation ───────────────────────────────
  function updateMonthLabel() {
    const el = document.getElementById('monthYearLabel');
    if (el) el.textContent = `${MONTHS[D.currentMonth]} ${D.currentYear}`;
  }

  function prevMonth() {
    let m = D.currentMonth - 1, y = D.currentYear;
    if (m < 0) { m = 11; y--; }
    D.setCurrentMonth(m); D.setCurrentYear(y);
    updateMonthLabel(); refresh();
  }

  function nextMonth() {
    let m = D.currentMonth + 1, y = D.currentYear;
    if (m > 11) { m = 0; y++; }
    D.setCurrentMonth(m); D.setCurrentYear(y);
    updateMonthLabel(); refresh();
  }

  // ── Refresh ────────────────────────────────────────
  function refresh() {
    if (activeTab === 'dashboard') COS.Dashboard.render();
    if (activeTab === 'habits')    COS.Habits.render();
    if (activeTab === 'stats')     COS.Stats.render();
    if (activeTab === 'settings')  COS.Settings.render();
  }

  // ── Theme ──────────────────────────────────────────
  function applyTheme() {
    const s = D.loadSettings();
    document.documentElement.setAttribute('data-theme', s.theme || 'light');
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    applyTheme();
    updateMonthLabel();

    // Tab buttons
    document.querySelectorAll('.tab-btn, .mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Month nav
    document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);

    // Theme toggle (header button)
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      const next = cur === 'light' ? 'dark' : cur === 'dark' ? 'pastel' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      const s = D.loadSettings(); s.theme = next; D.saveSettings(s);
      const icons = { light:'☀️', dark:'🌙', pastel:'🌸' };
      document.getElementById('themeToggleBtn').textContent = icons[next];
    });

    // Add habit button
    document.getElementById('addHabitBtn').addEventListener('click', () => {
      switchTab('habits');
      setTimeout(() => COS.Habits.openModal(), 80);
    });

    // Habits view toggle (monthly / weekly)
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        COS.Habits.setViewMode(btn.dataset.view);
      });
    });

    // Init habit modal
    COS.Habits.initModal();

    // First-run: if no habits, show prompt
    const habits = D.loadHabits();
    if (!habits.length) {
      const s = D.loadSettings();
      // auto-apply Founder presets on very first load
      COS.RolePresets.applyPreset(s.role || 'Founder');
    }

    // Render initial tab
    switchTab('dashboard');
  }

  return { init, refresh, toast, switchTab };
})();

// ── Bootstrap ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => COS.App.init());
