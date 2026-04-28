window.COS = window.COS || {};

COS.Settings = (function () {
  const D = COS.Data;
  const WEEK_NAMES = ['Week 1','Week 2','Week 3','Week 4','Week 5'];
  const THEMES = [
    { val:'light', label:'☀️ Light' },
    { val:'dark',  label:'🌙 Dark'  },
    { val:'pastel',label:'🌸 Pastel'},
  ];

  function render() {
    const el = document.getElementById('settingsView');
    if (!el) return;
    const s = D.loadSettings();
    const wColors = s.weekColors || ['#7EB8F7','#F9A8D4','#6EE7B7','#FDE68A','#C4B5FD'];

    el.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 style="font-family:var(--font-heading);font-size:1.6rem;margin-bottom:4px;">⚙️ Settings</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;">Customize your ConsistencyOS experience</p>
      </div>
      <div class="settings-grid">

        <!-- Profile -->
        <div class="settings-section">
          <h3>👤 Profile</h3>
          <div class="settings-row">
            <span class="settings-label">Your Name</span>
            <input id="settingName" type="text" value="${s.userName}" style="max-width:180px;"/>
          </div>
          <div class="settings-row">
            <span class="settings-label">Role</span>
            <span style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">${s.role}</span>
          </div>
          <div style="margin-top:14px;">
            <button id="saveProfileBtn" class="btn-primary" style="width:100%">💾 Save Profile</button>
          </div>
        </div>

        <!-- Appearance -->
        <div class="settings-section">
          <h3>🎨 Appearance</h3>
          <div style="margin-bottom:16px;">
            <div class="card-title" style="margin-bottom:10px;">Theme</div>
            <div class="theme-pills">
              ${THEMES.map(t=>`<button class="theme-pill${s.theme===t.val?' active':''}" data-theme="${t.val}">${t.label}</button>`).join('')}
            </div>
          </div>
          <div>
            <div class="card-title" style="margin-bottom:10px;">Week Accent Colors</div>
            ${wColors.map((c,i)=>`
              <div class="week-color-row">
                <span style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);width:60px;">${WEEK_NAMES[i]}</span>
                <input type="color" id="wcolor${i}" value="${c}" style="width:38px;height:28px;border:none;border-radius:8px;padding:2px;cursor:pointer;background:none;"/>
                <div class="week-color-swatch" style="background:${c}" id="wswatch${i}"></div>
              </div>`).join('')}
            <button id="saveColorsBtn" class="btn-secondary" style="margin-top:12px;width:100%;">Apply Colors</button>
          </div>
        </div>

        <!-- Data -->
        <div class="settings-section">
          <h3>💾 Data Management</h3>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
            <button id="exportBtn" class="btn-secondary" style="width:100%;justify-content:center;">📤 Export Data (JSON)</button>
            <label class="btn-secondary" style="width:100%;justify-content:center;cursor:pointer;">
              📥 Import Data (JSON)
              <input type="file" id="importFile" accept=".json" style="display:none;"/>
            </label>
            <button id="resetMonthBtn" class="btn-danger" style="width:100%;justify-content:center;">🗑️ Reset This Month</button>
          </div>
        </div>

        <!-- About -->
        <div class="settings-section">
          <h3>ℹ️ About</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;margin-bottom:14px;">
            <strong>ConsistencyOS</strong> is a premium habit tracker designed to help you build lasting daily habits. All your data stays private — stored only on your device.
          </p>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            <p>Version 1.0.0 &nbsp;•&nbsp; No backend &nbsp;•&nbsp; No login</p>
            <p style="margin-top:4px;">Built with ❤️ for focused people.</p>
          </div>
        </div>

      </div>`;

    // Theme pills
    el.querySelectorAll('.theme-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        const settings = D.loadSettings();
        settings.theme = theme;
        D.saveSettings(settings);
        el.querySelectorAll('.theme-pill').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        COS.App.toast(`${btn.textContent} theme applied!`, 'success');
      });
    });

    // Live color swatch preview
    for (let i = 0; i < 5; i++) {
      const input = document.getElementById(`wcolor${i}`);
      const swatch = document.getElementById(`wswatch${i}`);
      if (input && swatch) {
        input.addEventListener('input', () => { swatch.style.background = input.value; });
      }
    }

    // Save colors
    document.getElementById('saveColorsBtn').addEventListener('click', () => {
      const settings = D.loadSettings();
      settings.weekColors = Array.from({length:5},(_,i)=>document.getElementById(`wcolor${i}`).value);
      D.saveSettings(settings);
      COS.App.refresh();
      COS.App.toast('🎨 Colors updated!', 'success');
    });

    // Save profile
    document.getElementById('saveProfileBtn').addEventListener('click', () => {
      const settings = D.loadSettings();
      settings.userName = document.getElementById('settingName').value.trim() || 'Friend';
      D.saveSettings(settings);
      COS.App.toast('✅ Profile saved!', 'success');
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
      const json = D.exportJSON();
      const blob = new Blob([json], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `consistencyos-backup-${Date.now()}.json`;
      a.click(); URL.revokeObjectURL(url);
      COS.App.toast('📤 Data exported!', 'success');
    });

    // Import
    document.getElementById('importFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          D.importJSON(ev.target.result);
          COS.App.refresh();
          COS.App.toast('📥 Data imported!', 'success');
        } catch(err) {
          COS.App.toast('❌ Invalid file format.', 'info');
        }
      };
      reader.readAsText(file);
    });

    // Reset month
    document.getElementById('resetMonthBtn').addEventListener('click', () => {
      const monthName = new Date(D.currentYear,D.currentMonth,1).toLocaleString('default',{month:'long',year:'numeric'});
      if (confirm(`Reset all habit data for ${monthName}? This cannot be undone.`)) {
        D.resetMonth();
        COS.App.refresh();
        COS.App.toast('🗑️ Month reset.', 'info');
      }
    });
  }

  return { render };
})();
