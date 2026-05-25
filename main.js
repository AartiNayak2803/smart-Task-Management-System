/* ═══════════════════════════════════════════════
   SmartTask – app.js
   Full dashboard logic: Tasks, Habits, Mood,
   Profile, Settings, Auth
   ═══════════════════════════════════════════════ */

'use strict';

/* ════ STATE ════ */
let tasks   = JSON.parse(localStorage.getItem('st_tasks')   || '[]');
let moods   = JSON.parse(localStorage.getItem('st_moods')   || '[]');
let streaks = JSON.parse(localStorage.getItem('st_streaks') || '{"exercise":0,"reading":0,"water":0}');
let profile = JSON.parse(localStorage.getItem('st_profile') || '{"name":"Arti Nayak","role":"B.VOC Student","location":"Ahmedabad","about":"Passionate student who loves productivity and building good habits every day."}');
let settings_data = JSON.parse(localStorage.getItem('st_settings') || '{"darkmode":true,"compact":false,"reminders":true,"streak":true,"summary":false}');

/* ════ SAVE HELPERS ════ */
const save = {
  tasks:    () => localStorage.setItem('st_tasks',    JSON.stringify(tasks)),
  moods:    () => localStorage.setItem('st_moods',    JSON.stringify(moods)),
  streaks:  () => localStorage.setItem('st_streaks',  JSON.stringify(streaks)),
  profile:  () => localStorage.setItem('st_profile',  JSON.stringify(profile)),
  settings: () => localStorage.setItem('st_settings', JSON.stringify(settings_data)),
};

/* ════ AUTH CHECK ════ */
(function checkAuth() {
  const loggedIn = localStorage.getItem('smarttask_logged_in');
  const user     = JSON.parse(localStorage.getItem('smarttask_current_user') || 'null');
  if (!loggedIn || !user) {
    window.location.href = 'login.html';
    return;
  }
  // Load user name into profile if first time
  if (!localStorage.getItem('st_profile') && user.name) {
    profile.name = user.name;
    profile.role = user.role || 'SmartTask User';
    save.profile();
  }
})();

/* ════ PAGE NAVIGATION ════ */
const pageTitles = {
  dashboard: '⊞ Dashboard',
  tasks:     '✓ Task Manager',
  routine:   '✳ Daily Routine',
  mood:      '◎ Mood Tracker',
  habits:    '◉ Habits & Streaks',
  reminders: '🔔 Reminders',
  weekly:    '◫ Weekly Summary',
  analytics: '⊹ Analytics',
  profile:   '◐ My Profile',
  settings:  '◌ Settings',
  admin:     '◧ Admin Panel',
};

function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('page-title').textContent = pageTitles[id] || id;
  // Refresh data for each page
  if (id === 'dashboard') renderDashboard();
  if (id === 'tasks')     renderTasks();
  if (id === 'mood')      renderMoodFull();
  if (id === 'habits')    renderHabits();
  if (id === 'weekly')    renderWeekly();
  if (id === 'analytics') renderAnalytics();
  if (id === 'profile')   renderProfile();
  if (id === 'admin')     renderAdmin();
}

/* ════ TASK MANAGER ════ */
let taskFilter = 'all';

function filterTasks(f, el) {
  taskFilter = f;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  renderTasks();
}

function openModal() {
  document.getElementById('modal').classList.add('open');
  document.getElementById('task-date').value = new Date().toISOString().split('T')[0];
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  ['task-name','task-desc'].forEach(id => document.getElementById(id).value = '');
}

function saveTask() {
  const name = document.getElementById('task-name').value.trim();
  if (!name) { alert('Task name is required!'); return; }
  const task = {
    id:       Date.now(),
    name,
    desc:     document.getElementById('task-desc').value.trim(),
    priority: document.getElementById('task-priority').value,
    category: document.getElementById('task-category').value,
    date:     document.getElementById('task-date').value,
    done:     false,
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(task);
  save.tasks();
  closeModal();
  renderTasks();
  updateBadge();
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; save.tasks(); renderTasks(); updateBadge(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save.tasks();
  renderTasks();
  updateBadge();
}

function renderTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;
  let filtered = tasks;
  if (taskFilter === 'pending')   filtered = tasks.filter(t => !t.done);
  if (taskFilter === 'completed') filtered = tasks.filter(t =>  t.done);

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">✅</div>
      <div class="empty-title">${taskFilter === 'completed' ? 'No completed tasks' : 'No tasks yet'}</div>
      <div class="empty-sub">${taskFilter === 'all' ? 'Click "+ Add Task" to create your first task' : ''}</div>
    </div>`;
    return;
  }
  list.innerHTML = filtered.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <div class="task-check ${t.done ? 'checked' : ''}" onclick="toggleTask(${t.id})"></div>
      <div class="task-body">
        <div class="task-name">${t.name}</div>
        ${t.desc ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">${t.desc}</div>` : ''}
        <div class="task-meta">
          <span class="task-tag ${t.priority}">${t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'} ${t.priority}</span>
          <span class="task-tag cat">${t.category}</span>
          ${t.date ? `<span class="task-date">📅 ${t.date}</span>` : ''}
        </div>
      </div>
      <button class="task-del" onclick="deleteTask(${t.id})">🗑</button>
    </div>
  `).join('');
}

function updateBadge() {
  const pending = tasks.filter(t => !t.done).length;
  const badge = document.getElementById('task-badge');
  if (badge) badge.textContent = pending;
}

function exportTasks() {
  if (!tasks.length) { alert('No tasks to export!'); return; }
  const csv = ['Name,Description,Priority,Category,Due Date,Status']
    .concat(tasks.map(t => `"${t.name}","${t.desc}","${t.priority}","${t.category}","${t.date}","${t.done ? 'Done' : 'Pending'}"`))
    .join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv,' + encodeURIComponent(csv);
  a.download = 'smarttask_tasks.csv';
  a.click();
}

function clearAllTasks() {
  if (!confirm('Clear all tasks? This cannot be undone.')) return;
  tasks = []; save.tasks(); renderTasks(); updateBadge();
}

/* ════ DASHBOARD ════ */
function renderDashboard() {
  // Stats
  const done    = tasks.filter(t => t.done).length;
  const total   = tasks.length;
  const pct     = total ? Math.round((done / total) * 100) : 0;

  const el = id => document.getElementById(id);
  if (el('dash-completed'))   el('dash-completed').textContent   = done;
  if (el('dash-productivity'))el('dash-productivity').textContent = pct + '%';
  if (el('dash-total'))       el('dash-total').textContent        = done;
  if (el('analytics-completed'))   el('analytics-completed').textContent = done;
  if (el('analytics-productivity'))el('analytics-productivity').textContent = pct + '%';
  if (el('admin-tasks'))      el('admin-tasks').textContent       = total;

  // Best streak
  const best = Math.max(streaks.exercise || 0, streaks.reading || 0, streaks.water || 0);
  if (el('dash-best-streak')) el('dash-best-streak').textContent = best + ' 🔥';

  // Month label
  const mn = new Date().toLocaleString('en', {month:'long', year:'numeric'});
  if (el('current-month'))  el('current-month').textContent  = mn;
  if (el('analytics-month'))el('analytics-month').textContent = mn;

  // Bar chart (mock weekly data based on task completion)
  renderBarChart('dash-bar-chart');
  renderBarChart('analytics-bar');

  // Mood week
  renderMoodWeek();

  // Weekly tasks (last 7 tasks)
  renderWeeklyTasksWidget();
}

function renderBarChart(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const days = ['M','T','W','T','F','S','S'];
  const vals = days.map(() => Math.floor(Math.random() * 80) + 10);
  const mx   = Math.max(...vals);
  el.innerHTML = vals.map((v, i) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">
      <div class="bar" style="width:100%;height:${Math.round((v/mx)*100)}%;background:var(--accent-blue)" title="${v}%"></div>
      <div style="font-size:9px;color:var(--text-muted)">${days[i]}</div>
    </div>
  `).join('');
}

function renderMoodWeek() {
  const el = document.getElementById('dash-mood-week');
  if (!el) return;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const emojis = ['😄','🙂','😐','😊','🥳','😄','🙂'];
  el.innerHTML = days.map((d, i) => `
    <div class="mood-day">
      <div class="mood-emoji">${emojis[i]}</div>
      <div>${d}</div>
    </div>
  `).join('');
}

function renderWeeklyTasksWidget() {
  const el = document.getElementById('dash-weekly-tasks');
  if (!el) return;
  const recent = tasks.slice(0, 5);
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-icon">📋</div><div class="empty-sub">No tasks yet</div></div>`;
    return;
  }
  el.innerHTML = recent.map(t => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="width:8px;height:8px;border-radius:50%;background:${t.done ? 'var(--accent-green)' : 'var(--accent-orange)'};flex-shrink:0"></div>
      <div style="font-size:12px;color:var(--text);flex:1;${t.done ? 'text-decoration:line-through;opacity:0.6' : ''}">${t.name}</div>
      <div style="font-size:10px;color:var(--text-muted)">${t.priority}</div>
    </div>
  `).join('');
}

/* ════ MOOD ════ */
function logMood(emoji, score) {
  const today = new Date().toISOString().split('T')[0];
  moods = moods.filter(m => m.date !== today);
  moods.unshift({ date: today, emoji, score });
  save.moods();
  renderMoodFull();
  // Flash confirmation
  const tip = document.createElement('div');
  tip.style.cssText = 'position:fixed;top:80px;right:24px;background:var(--card-bg);border:1px solid var(--border2);border-radius:12px;padding:12px 18px;font-size:13px;color:var(--text);box-shadow:var(--shadow);z-index:9999;animation:modalIn 0.3s ease';
  tip.textContent = `Mood logged: ${emoji} (${score}/10)`;
  document.body.appendChild(tip);
  setTimeout(() => tip.remove(), 2000);
}

function renderMoodFull() {
  const el = document.getElementById('mood-grid-full');
  if (!el) return;
  if (!moods.length) {
    el.innerHTML = `<div style="grid-column:1/-1" class="empty-state"><div class="empty-icon">😊</div><div class="empty-title">No mood logs yet</div><div class="empty-sub">Log your mood below</div></div>`;
    return;
  }
  el.innerHTML = moods.slice(0, 28).map(m => `
    <div class="mood-card">
      <div style="font-size:24px">${m.emoji}</div>
      <div class="mood-card-date">${m.date}</div>
      <div class="mood-card-score">${m.score}/10</div>
    </div>
  `).join('');
}

/* ════ HABITS ════ */
function renderHabits() {
  ['exercise','reading','water'].forEach(h => {
    const sv = document.getElementById('streak-val-' + h);
    const sb = document.getElementById('streak-best-' + h);
    if (sv) sv.textContent = streaks[h] || 0;
    if (sb) sb.textContent = streaks[h] || 0;
    renderHabitDots(h);
  });
}

function renderHabitDots(habit) {
  const el = document.getElementById('habit-dots-' + habit);
  if (!el) return;
  const streak = streaks[habit] || 0;
  let dots = '';
  for (let i = 0; i < 31; i++) {
    const cls = i < streak ? 'habit-dot done' : 'habit-dot';
    dots += `<div class="${cls}"></div>`;
  }
  el.innerHTML = dots;
}

function editStreak(habit) {
  const cur = streaks[habit] || 0;
  const val = prompt(`Enter your current ${habit} streak (days):`, cur);
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n) || n < 0) { alert('Please enter a valid number.'); return; }
  streaks[habit] = n;
  save.streaks();
  renderHabits();
  renderDashboard();
}

/* ════ WEEKLY SUMMARY ════ */
function renderWeekly() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];

  const weekTasks = tasks.filter(t => t.date >= weekStr || !t.date);
  const doneTasks = weekTasks.filter(t => t.done);
  const rate = weekTasks.length ? Math.round((doneTasks.length / weekTasks.length) * 100) : 0;

  const rateEl = document.getElementById('weekly-rate');
  if (rateEl) rateEl.textContent = rate + '%';

  const listEl = document.getElementById('weekly-task-list');
  if (!listEl) return;
  if (!weekTasks.length) {
    listEl.innerHTML = `<div class="empty-state" style="padding:16px"><div class="empty-icon">📋</div><div class="empty-sub">No tasks this week</div></div>`;
    return;
  }
  listEl.innerHTML = weekTasks.slice(0, 8).map(t => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      <div style="width:8px;height:8px;border-radius:50%;background:${t.done ? 'var(--accent-green)' : 'var(--accent-orange)'};flex-shrink:0"></div>
      <div style="font-size:12px;color:var(--text);flex:1">${t.name}</div>
      <div style="font-size:10px;background:${t.done ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'};color:${t.done ? 'var(--accent-green)' : 'var(--accent-orange)'};padding:2px 8px;border-radius:10px">${t.done ? 'Done' : 'Pending'}</div>
    </div>
  `).join('');
}

/* ════ ANALYTICS ════ */
function renderAnalytics() {
  renderDashboard(); // reuses same stats
}

/* ════ PROFILE ════ */
function renderProfile() {
  const p = profile;
  const nameDisp = document.getElementById('profile-name-display');
  const roleDisp = document.getElementById('profile-role-display');
  const letter   = document.getElementById('profile-avatar-letter');
  const topAvatar= document.getElementById('topbar-avatar');
  const sidebar  = document.querySelector('.user-name');
  const sRole    = document.querySelector('.user-role');
  const aboutEl  = document.getElementById('about-text');
  const tasksEl  = document.getElementById('profile-tasks');
  const streakEl = document.getElementById('profile-streak');

  if (nameDisp) nameDisp.textContent = p.name;
  if (roleDisp) roleDisp.textContent = `${p.role} · ${p.location}`;
  if (letter)   letter.textContent = p.name[0].toUpperCase();
  if (topAvatar)topAvatar.textContent = p.name[0].toUpperCase();
  if (sidebar)  sidebar.textContent = p.name;
  if (sRole)    sRole.textContent = p.role;
  if (aboutEl)  aboutEl.textContent = p.about || 'No bio added yet.';
  if (tasksEl)  tasksEl.textContent = tasks.filter(t => t.done).length;
  const best = Math.max(streaks.exercise || 0, streaks.reading || 0, streaks.water || 0);
  if (streakEl) streakEl.textContent = best;
}

function toggleProfileEdit() {
  const view = document.getElementById('profile-view-mode');
  const edit = document.getElementById('profile-edit-mode');
  if (edit.style.display === 'none') {
    document.getElementById('profile-name-input').value     = profile.name;
    document.getElementById('profile-role-input').value     = profile.role;
    document.getElementById('profile-location-input').value = profile.location;
    view.style.display = 'none';
    edit.style.display = 'block';
  }
}
function cancelProfileEdit() {
  document.getElementById('profile-view-mode').style.display = 'block';
  document.getElementById('profile-edit-mode').style.display = 'none';
}
function saveProfile() {
  const n = document.getElementById('profile-name-input').value.trim();
  const r = document.getElementById('profile-role-input').value.trim();
  const l = document.getElementById('profile-location-input').value.trim();
  if (!n) { alert('Name cannot be empty'); return; }
  profile.name     = n;
  profile.role     = r || profile.role;
  profile.location = l || profile.location;
  save.profile();
  cancelProfileEdit();
  renderProfile();
}

function toggleAboutEdit() {
  const txt   = document.getElementById('about-text');
  const ta    = document.getElementById('about-textarea');
  const row   = document.getElementById('about-save-row');
  const btn   = document.getElementById('about-edit-btn');
  if (ta.style.display === 'none') {
    ta.value = profile.about || '';
    txt.style.display = 'none';
    ta.style.display  = 'block';
    row.style.display = 'flex';
    btn.textContent   = '✕';
  } else {
    cancelAboutEdit();
  }
}
function cancelAboutEdit() {
  document.getElementById('about-text').style.display      = 'block';
  document.getElementById('about-textarea').style.display  = 'none';
  document.getElementById('about-save-row').style.display  = 'none';
  document.getElementById('about-edit-btn').textContent    = '✏️ Edit';
}
function saveAbout() {
  profile.about = document.getElementById('about-textarea').value.trim();
  save.profile();
  cancelAboutEdit();
  renderProfile();
}

/* ════ SETTINGS ════ */
function toggleSetting(key) {
  settings_data[key] = !settings_data[key];
  save.settings();
  applySettings();
}

function applySettings() {
  const s = settings_data;
  // Dark/Light
  document.body.classList.toggle('light-mode', !s.darkmode);
  // Compact
  document.body.classList.toggle('compact-mode', !!s.compact);
  // Sync toggles UI
  Object.keys(s).forEach(key => {
    const el = document.getElementById('toggle-' + key);
    if (el) el.classList.toggle('off', !s[key]);
  });
}

function resetAllData() {
  if (!confirm('Reset ALL data (tasks, moods, streaks, profile)? This cannot be undone.')) return;
  ['st_tasks','st_moods','st_streaks','st_profile','st_settings'].forEach(k => localStorage.removeItem(k));
  location.reload();
}

function logOut() {
  if (!confirm('Log out?')) return;
  ['smarttask_logged_in','smarttask_current_user'].forEach(k => localStorage.removeItem(k));
  window.location.href = 'login.html';
}

/* ════ ADMIN ════ */
function renderAdmin() {
  const el = document.getElementById('admin-tasks');
  if (el) el.textContent = tasks.length;
}

/* ════ INIT ════ */
document.addEventListener('DOMContentLoaded', () => {
  applySettings();
  renderProfile();
  renderDashboard();
  renderTasks();
  renderHabits();
  updateBadge();

  // Close modal on overlay click
  document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Keyboard: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
});

/* ════════════════════════════════════════
   ADMIN PANEL – Full Feature Logic
   ════════════════════════════════════════ */

/* ── Admin State ── */
let adminUsers    = JSON.parse(localStorage.getItem('adm_users')    || '[]');
let adminProjects = JSON.parse(localStorage.getItem('adm_projects') || '[]');
let adminMessages = JSON.parse(localStorage.getItem('adm_messages') || '[]');
let adminRoles    = JSON.parse(localStorage.getItem('adm_roles')    || JSON.stringify([
  { id: 1, name: 'Admin',  color: 'blue' },
  { id: 2, name: 'User',   color: 'green' },
  { id: 3, name: 'Viewer', color: 'orange' }
]));
let adminSettings2 = JSON.parse(localStorage.getItem('adm_settings2') || '{"dark":true,"login":true,"appName":"SmartTask","logoIcon":"⚡"}');
let editingUserId    = null;

const saveAdm = {
  users:    () => localStorage.setItem('adm_users',    JSON.stringify(adminUsers)),
  projects: () => localStorage.setItem('adm_projects', JSON.stringify(adminProjects)),
  messages: () => localStorage.setItem('adm_messages', JSON.stringify(adminMessages)),
  roles:    () => localStorage.setItem('adm_roles',    JSON.stringify(adminRoles)),
  settings2:() => localStorage.setItem('adm_settings2',JSON.stringify(adminSettings2)),
};

/* ── Seed current user into admin users list ── */
function seedCurrentUser() {
  const u = JSON.parse(localStorage.getItem('smarttask_current_user') || 'null');
  if (!u) return;
  const already = adminUsers.find(x => x.email === (u.email || 'admin@smarttask.com'));
  if (!already) {
    adminUsers.unshift({ id: Date.now(), name: profile.name || u.name || 'Admin', email: u.email || 'admin@smarttask.com', role: 'Admin', status: 'active', joined: new Date().toLocaleDateString('en-IN') });
    saveAdm.users();
  }
}

/* ── Admin Sub-Section Nav ── */
function showAdminSection(id, el) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');
  if (el) el.classList.add('active');
  // Refresh section
  if (id === 'adm-dashboard') renderAdmDashboard();
  if (id === 'adm-users')     renderAdminUsers();
  if (id === 'adm-tasks')     renderAdminTaskTable();
  if (id === 'adm-projects')  renderAdminProjects();
  if (id === 'adm-roles')     renderAdminRoles();
  if (id === 'adm-notify')    renderAdminMessages();
  if (id === 'adm-settings')  renderAdmSettings();
  if (id === 'adm-reports')   renderAdminReports();
}

/* ════ 1. ADMIN DASHBOARD ════ */
function renderAdmin() {
  seedCurrentUser();
  renderAdmDashboard();
}

function renderAdmDashboard() {
  const done    = tasks.filter(t => t.completed).length;
  const total   = tasks.length;
  const pending = total - done;
  const high    = tasks.filter(t => t.priority === 'high').length;
  const pct     = total ? Math.round(done / total * 100) : 0;

  setTxt('adm-total-users',   adminUsers.length || 1);
  setTxt('adm-total-tasks',   total);
  setTxt('adm-done-count',    done);
  setTxt('adm-active-users',  adminUsers.filter(u => u.status !== 'blocked').length || 1);
  setTxt('adm-productivity',  pct + '%');
  setTxt('adm-pending-cnt',   pending);
  setTxt('adm-done-cnt2',     done);
  setTxt('adm-high-cnt',      high);
  setTxt('adm-sys-user',      profile.name);
  setTxt('adm-sys-theme',     settings_data.darkmode ? 'Dark' : 'Light');

  // Mini bar chart
  const bc = document.getElementById('adm-bar-chart');
  if (bc) {
    const bars = [
      { label: 'Done',    val: done,    color: 'var(--accent-green)' },
      { label: 'Pending', val: pending, color: 'var(--accent-orange)' },
      { label: 'High',    val: high,    color: 'var(--accent-red)' },
    ];
    const max = Math.max(...bars.map(b => b.val), 1);
    bc.innerHTML = bars.map(b => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
        <div style="width:100%;background:${b.color};border-radius:4px 4px 0 0;height:${Math.round(b.val/max*70)+4}px;min-height:4px;transition:height 0.5s"></div>
        <div style="font-size:10px;color:var(--text-muted)">${b.label}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">${b.val}</div>
      </div>`).join('');
  }
}

function setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ════ 2. USER MANAGEMENT ════ */
function renderAdminUsers() {
  const search = (document.getElementById('user-search')?.value || '').toLowerCase();
  const roleF  = document.getElementById('user-filter-role')?.value || 'all';
  let list = adminUsers.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    const matchRole   = roleF === 'all' || u.role === roleF;
    return matchSearch && matchRole;
  });
  const el = document.getElementById('admin-user-table');
  if (!el) return;
  if (!list.length) { el.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-icon">👤</div><div class="empty-sub">No users found</div></div>`; return; }
  el.innerHTML = `<table class="adm-table">
    <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
    <tbody>${list.map(u => `
      <tr>
        <td><div style="display:flex;align-items:center;gap:10px"><div class="user-dot">${u.name[0].toUpperCase()}</div><span style="font-weight:600;color:var(--text)">${u.name}</span></div></td>
        <td>${u.email}</td>
        <td><span class="adm-badge ${u.role==='Admin'?'blue':u.role==='User'?'green':'orange'}">${u.role}</span></td>
        <td><span class="${u.status==='active'?'status-active':'status-blocked'}">${u.status==='active'?'● Active':'⛔ Blocked'}</span></td>
        <td style="color:var(--text-muted);font-size:12px">${u.joined||'—'}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="adm-btn-sm" onclick="editAdminUser(${u.id})">✏️ Edit</button>
          <button class="adm-btn-sm" onclick="toggleUserBlock(${u.id})">${u.status==='active'?'🚫 Block':'✅ Unblock'}</button>
          <button class="adm-btn-sm red" onclick="deleteAdminUser(${u.id})">🗑️</button>
        </td>
      </tr>`).join('')}
    </tbody></table>`;
}

function openAddUserModal() {
  editingUserId = null;
  ['adm-u-name','adm-u-email'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('adm-u-role').value   = 'User';
  document.getElementById('adm-u-status').value = 'active';
  document.getElementById('adm-user-modal-title').textContent = '➕ Add New User';
  openAdmModal('adm-user-modal');
}

function editAdminUser(id) {
  const u = adminUsers.find(x => x.id === id);
  if (!u) return;
  editingUserId = id;
  document.getElementById('adm-u-name').value   = u.name;
  document.getElementById('adm-u-email').value  = u.email;
  document.getElementById('adm-u-role').value   = u.role;
  document.getElementById('adm-u-status').value = u.status;
  document.getElementById('adm-user-modal-title').textContent = '✏️ Edit User';
  openAdmModal('adm-user-modal');
}

function saveAdminUser() {
  const name   = document.getElementById('adm-u-name').value.trim();
  const email  = document.getElementById('adm-u-email').value.trim();
  const role   = document.getElementById('adm-u-role').value;
  const status = document.getElementById('adm-u-status').value;
  if (!name || !email) { alert('Name and Email are required!'); return; }
  if (editingUserId) {
    const idx = adminUsers.findIndex(u => u.id === editingUserId);
    if (idx > -1) adminUsers[idx] = { ...adminUsers[idx], name, email, role, status };
  } else {
    adminUsers.push({ id: Date.now(), name, email, role, status, joined: new Date().toLocaleDateString('en-IN') });
  }
  saveAdm.users();
  closeAdmModal('adm-user-modal');
  renderAdminUsers();
}

function toggleUserBlock(id) {
  const u = adminUsers.find(x => x.id === id);
  if (!u) return;
  u.status = u.status === 'active' ? 'blocked' : 'active';
  saveAdm.users();
  renderAdminUsers();
}

function deleteAdminUser(id) {
  if (!confirm('Delete this user?')) return;
  adminUsers = adminUsers.filter(u => u.id !== id);
  saveAdm.users();
  renderAdminUsers();
}

/* ════ 3. TASK MANAGEMENT ════ */
function renderAdminTaskTable() {
  const filter = document.getElementById('adm-task-filter')?.value || 'all';
  let list = [...tasks];
  if (filter === 'pending')   list = list.filter(t => !t.completed);
  if (filter === 'completed') list = list.filter(t => t.completed);
  if (filter === 'high')      list = list.filter(t => t.priority === 'high');
  const el = document.getElementById('admin-task-table');
  if (!el) return;
  if (!list.length) { el.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-icon">📋</div><div class="empty-sub">No tasks found</div></div>`; return; }
  const priColor = { high:'red', medium:'orange', low:'green' };
  el.innerHTML = `<table class="adm-table">
    <thead><tr><th>Task</th><th>Priority</th><th>Category</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${list.map(t => `
      <tr>
        <td style="font-weight:600;color:var(--text);max-width:200px">${t.name}</td>
        <td><span class="adm-badge ${priColor[t.priority]||'blue'}">${t.priority}</span></td>
        <td style="color:var(--text-muted);font-size:12px">${t.category||'—'}</td>
        <td style="color:var(--text-muted);font-size:12px">${t.date||'—'}</td>
        <td><span class="${t.completed?'status-active':'status-blocked'}">${t.completed?'✅ Done':'⏳ Pending'}</span></td>
        <td style="display:flex;gap:6px">
          <button class="adm-btn-sm" onclick="admToggleTask(${t.id})">${t.completed?'↩ Undo':'✅ Done'}</button>
          <button class="adm-btn-sm" onclick="admChangePriority(${t.id})">🔄 Priority</button>
          <button class="adm-btn-sm red" onclick="admDeleteTask(${t.id})">🗑️</button>
        </td>
      </tr>`).join('')}
    </tbody></table>`;
}

function admToggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (t) { t.completed = !t.completed; save.tasks(); renderAdminTaskTable(); }
}

function admChangePriority(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const opts = ['high','medium','low'];
  const cur = opts.indexOf(t.priority);
  t.priority = opts[(cur+1) % 3];
  save.tasks();
  renderAdminTaskTable();
}

function admDeleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(x => x.id !== id);
  save.tasks();
  renderAdminTaskTable();
}

/* ════ 4. PROJECT MANAGEMENT ════ */
function renderAdminProjects() {
  const el = document.getElementById('admin-project-list');
  if (!el) return;
  if (!adminProjects.length) {
    el.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-icon">📁</div><div class="empty-sub">No projects yet. Click "+ New Project" to create one.</div></div>`;
    return;
  }
  const statusColor = { 'Planning':'blue','Active':'green','On Hold':'orange','Completed':'purple' };
  el.innerHTML = adminProjects.map(p => `
    <div class="adm-project-card">
      <div class="adm-project-icon">📁</div>
      <div style="flex:1">
        <div class="adm-project-name">${p.name}</div>
        <div class="adm-project-desc">${p.desc||'No description'}</div>
        <div class="adm-project-team" style="margin-top:4px">👥 ${p.team||'Unassigned'}</div>
      </div>
      <div class="adm-project-meta">
        <span class="adm-badge ${statusColor[p.status]||'blue'}">${p.status}</span>
        <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end">
          <button class="adm-btn-sm" onclick="editAdminProject(${p.id})">✏️</button>
          <button class="adm-btn-sm red" onclick="deleteAdminProject(${p.id})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function openAddProjectModal() {
  ['adm-p-name','adm-p-desc','adm-p-team'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('adm-p-status').value = 'Planning';
  document.getElementById('adm-project-modal')._editId = null;
  openAdmModal('adm-project-modal');
}

function editAdminProject(id) {
  const p = adminProjects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('adm-p-name').value   = p.name;
  document.getElementById('adm-p-desc').value   = p.desc||'';
  document.getElementById('adm-p-status').value = p.status;
  document.getElementById('adm-p-team').value   = p.team||'';
  document.getElementById('adm-project-modal')._editId = id;
  openAdmModal('adm-project-modal');
}

function saveAdminProject() {
  const name   = document.getElementById('adm-p-name').value.trim();
  const desc   = document.getElementById('adm-p-desc').value.trim();
  const status = document.getElementById('adm-p-status').value;
  const team   = document.getElementById('adm-p-team').value.trim();
  if (!name) { alert('Project name is required!'); return; }
  const editId = document.getElementById('adm-project-modal')._editId;
  if (editId) {
    const idx = adminProjects.findIndex(p => p.id === editId);
    if (idx > -1) adminProjects[idx] = { ...adminProjects[idx], name, desc, status, team };
  } else {
    adminProjects.push({ id: Date.now(), name, desc, status, team });
  }
  saveAdm.projects();
  closeAdmModal('adm-project-modal');
  renderAdminProjects();
}

function deleteAdminProject(id) {
  if (!confirm('Delete this project?')) return;
  adminProjects = adminProjects.filter(p => p.id !== id);
  saveAdm.projects();
  renderAdminProjects();
}

/* ════ 5. ROLES ════ */
function renderAdminRoles() {
  const el = document.getElementById('admin-roles-list');
  if (!el) return;
  el.innerHTML = adminRoles.map(r => `
    <div class="adm-role-row">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="adm-badge ${r.color}">${r.name}</span>
        <span style="font-size:12px;color:var(--text-muted)">Role ID: ${r.id}</span>
      </div>
      <button class="adm-btn-sm red" onclick="deleteAdminRole(${r.id})">🗑️ Remove</button>
    </div>`).join('');
}

function openRoleModal() { openAdmModal('adm-role-modal'); }

function saveAdminRole() {
  const name  = document.getElementById('adm-r-name').value.trim();
  const color = document.getElementById('adm-r-color').value;
  if (!name) { alert('Role name required!'); return; }
  adminRoles.push({ id: Date.now(), name, color });
  saveAdm.roles();
  closeAdmModal('adm-role-modal');
  renderAdminRoles();
}

function deleteAdminRole(id) {
  if (!confirm('Delete this role?')) return;
  adminRoles = adminRoles.filter(r => r.id !== id);
  saveAdm.roles();
  renderAdminRoles();
}

/* ════ 6. MESSAGES ════ */
function renderAdminMessages() {
  const el = document.getElementById('admin-messages-list');
  if (!el) return;
  if (!adminMessages.length) { el.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">No messages sent yet.</div>`; return; }
  const typeColor = { info:'blue', warning:'orange', success:'green', urgent:'red' };
  el.innerHTML = adminMessages.slice().reverse().map(m => `
    <div class="adm-msg-card">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span class="adm-badge ${typeColor[m.type]||'blue'}">${m.type}</span>
        <span class="adm-msg-title">${m.title}</span>
      </div>
      <div class="adm-msg-body">${m.body}</div>
      <div class="adm-msg-meta">To: ${m.to} · ${m.time}</div>
    </div>`).join('');
}

function sendAdminMessage() {
  const to    = document.getElementById('msg-to').value;
  const type  = document.getElementById('msg-type').value;
  const title = document.getElementById('msg-title').value.trim();
  const body  = document.getElementById('msg-body').value.trim();
  if (!title || !body) { alert('Title and message are required!'); return; }
  adminMessages.push({ id: Date.now(), to, type, title, body, time: new Date().toLocaleString('en-IN') });
  saveAdm.messages();
  document.getElementById('msg-title').value = '';
  document.getElementById('msg-body').value  = '';
  renderAdminMessages();
  // Show toast
  showAdmToast('📤 Message sent successfully!');
}

function clearMessages() {
  if (!confirm('Clear all messages?')) return;
  adminMessages = [];
  saveAdm.messages();
  renderAdminMessages();
}

/* ════ 7. SETTINGS ════ */
function renderAdmSettings() {
  const darkEl = document.getElementById('adm-toggle-dark');
  const loginEl = document.getElementById('adm-toggle-login');
  if (darkEl)  { darkEl.className  = 'toggle' + (adminSettings2.dark  ? '' : ' off'); }
  if (loginEl) { loginEl.className = 'toggle' + (adminSettings2.login ? '' : ' off'); }
  const nameEl = document.getElementById('adm-app-name');
  const logoEl = document.getElementById('adm-logo-icon');
  if (nameEl) nameEl.value = adminSettings2.appName || 'SmartTask';
  if (logoEl) logoEl.value = adminSettings2.logoIcon || '⚡';
}

function admToggle(key) {
  adminSettings2[key] = !adminSettings2[key];
  saveAdm.settings2();
  renderAdmSettings();
  if (key === 'dark') {
    settings_data.darkmode = adminSettings2.dark;
    save.settings();
    applySettings();
  }
}

function saveAppName() {
  const val = document.getElementById('adm-app-name').value.trim();
  if (!val) return;
  adminSettings2.appName = val;
  saveAdm.settings2();
  showAdmToast('✅ App name updated!');
}

function saveLogoIcon() {
  const val = document.getElementById('adm-logo-icon').value.trim();
  if (!val) return;
  adminSettings2.logoIcon = val;
  saveAdm.settings2();
  const logoEl = document.querySelector('.logo-icon');
  if (logoEl) logoEl.textContent = val;
  showAdmToast('✅ Logo icon updated!');
}

function saveAdminPass() {
  const val = document.getElementById('adm-password').value;
  if (!val) { alert('Enter a new password'); return; }
  localStorage.setItem('adm_password', btoa(val));
  document.getElementById('adm-password').value = '';
  showAdmToast('🔒 Password updated!');
}

function exportAllData() {
  const data = { tasks, moods, streaks, profile, settings_data, adminUsers, adminProjects, adminMessages, adminRoles };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'smarttask_backup.json';
  a.click();
}

function admClearTasks() {
  if (!confirm('Delete ALL tasks? This cannot be undone.')) return;
  tasks = [];
  save.tasks();
  renderAdminTaskTable();
  showAdmToast('🗑️ All tasks cleared.');
}

function admFactoryReset() {
  if (!confirm('Factory reset? ALL data will be lost!')) return;
  ['st_tasks','st_moods','st_streaks','st_profile','st_settings',
   'adm_users','adm_projects','adm_messages','adm_roles','adm_settings2'].forEach(k => localStorage.removeItem(k));
  location.reload();
}

/* ════ 8. REPORTS ════ */
function renderAdminReports() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;
  const rate    = total ? Math.round(done / total * 100) : 0;

  setTxt('rep-total',   total);
  setTxt('rep-done',    done);
  setTxt('rep-pending', pending);
  setTxt('rep-rate',    rate + '%');

  // Priority chart
  const high   = tasks.filter(t => t.priority==='high').length;
  const medium = tasks.filter(t => t.priority==='medium').length;
  const low    = tasks.filter(t => t.priority==='low').length;
  const maxP   = Math.max(high, medium, low, 1);
  const priBars = [
    { label:'🔴 High',   val:high,   color:'var(--accent-red)',    pct: Math.round(high/maxP*100) },
    { label:'🟡 Medium', val:medium, color:'var(--accent-orange)', pct: Math.round(medium/maxP*100) },
    { label:'🟢 Low',    val:low,    color:'var(--accent-green)',  pct: Math.round(low/maxP*100) },
  ];
  const priEl = document.getElementById('rep-priority-chart');
  if (priEl) priEl.innerHTML = priBars.map(b => `
    <div class="adm-rep-bar-row">
      <div class="adm-rep-bar-label">${b.label}</div>
      <div class="adm-rep-bar-track"><div class="adm-rep-bar-fill" style="width:${b.pct}%;background:${b.color}"></div></div>
      <div class="adm-rep-bar-val">${b.val}</div>
    </div>`).join('');

  // Category chart
  const cats = {};
  tasks.forEach(t => { cats[t.category||'other'] = (cats[t.category||'other']||0)+1; });
  const catColors = { work:'var(--accent-blue)', personal:'var(--accent-purple)', study:'var(--accent-cyan)', health:'var(--accent-green)', other:'var(--text-muted)' };
  const maxC = Math.max(...Object.values(cats), 1);
  const catEl = document.getElementById('rep-category-chart');
  if (catEl) {
    if (!Object.keys(cats).length) { catEl.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">No task data yet.</div>`; }
    else catEl.innerHTML = Object.entries(cats).map(([k,v]) => `
      <div class="adm-rep-bar-row">
        <div class="adm-rep-bar-label" style="text-transform:capitalize">${k}</div>
        <div class="adm-rep-bar-track"><div class="adm-rep-bar-fill" style="width:${Math.round(v/maxC*100)}%;background:${catColors[k]||'var(--accent-blue)'}"></div></div>
        <div class="adm-rep-bar-val">${v}</div>
      </div>`).join('');
  }

  // User activity
  const actEl = document.getElementById('rep-user-activity');
  if (actEl) {
    const users = adminUsers.length ? adminUsers : [{ name: profile.name, email: '—', role: 'Admin', status: 'active' }];
    actEl.innerHTML = users.map(u => `
      <div class="adm-activity-row">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="user-dot">${u.name[0].toUpperCase()}</div>
          <div><div style="font-weight:600;color:var(--text)">${u.name}</div><div style="font-size:11px;color:var(--text-muted)">${u.email}</div></div>
        </div>
        <div style="text-align:right">
          <span class="adm-badge ${u.role==='Admin'?'blue':'green'}">${u.role}</span>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${u.status==='active'?'● Active':'⛔ Blocked'}</div>
        </div>
      </div>`).join('');
  }
}

function exportReport() {
  if (!tasks.length) { alert('No tasks to export!'); return; }
  const headers = ['Task', 'Priority', 'Category', 'Due Date', 'Status'];
  const rows = tasks.map(t => [t.name, t.priority, t.category||'', t.date||'', t.completed?'Done':'Pending']);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'smarttask_report.csv';
  a.click();
}

/* ── Modal helpers ── */
function openAdmModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'flex'; el.addEventListener('click', function ovClick(e) { if (e.target === el) { el.style.display='none'; el.removeEventListener('click', ovClick); } }); }
}
function closeAdmModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ── Toast ── */
function showAdmToast(msg) {
  let t = document.getElementById('adm-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'adm-toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--accent-blue);color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:opacity 0.3s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}
