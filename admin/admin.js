/* ============================================================
   Hopeful Hearts N/A Admin Dashboard JS
   ============================================================ */

'use strict';

/* ===== SUPABASE CLIENT ===== */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const _supabaseUrl  = 'https://irzqdsxdiifosqzqdypj.supabase.co';
const _supabaseKey  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyenFkc3hkaWlmb3NxenFkeXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MTgwMjYsImV4cCI6MjA5ODk5NDAyNn0.2mzC2WjiVIN2imGfKh0aKhdP97PCT6eLsTxOS4lfbh0';
const DB = createClient(_supabaseUrl, _supabaseKey);

/* ===== STORAGE HELPERS ===== */
const Store = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  nextId(items) {
    return items.length ? Math.max(...items.map(i => i.id || 0)) + 1 : 1;
  }
};

/* ===== TOAST ===== */
const Toast = {
  show(msg, type = 'info') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark',
                    warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, 3200);
  }
};

/* ===== MODAL ===== */
const Modal = {
  overlay: null, title: null, body: null, footer: null,
  init() {
    this.overlay = document.getElementById('modal-overlay');
    this.title   = document.getElementById('modal-title');
    this.body    = document.getElementById('modal-body');
    this.footer  = document.getElementById('modal-footer');
    document.getElementById('modal-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  },
  open(titleText, bodyHTML, footerHTML = '') {
    this.title.textContent = titleText;
    this.body.innerHTML    = bodyHTML;
    this.footer.innerHTML  = footerHTML;
    this.overlay.removeAttribute('hidden');
    this.overlay.querySelector('.modal').focus?.();
  },
  close() { this.overlay.setAttribute('hidden', ''); }
};

/* ===== LOADING ===== */
const Loading = {
  show() { document.getElementById('loading-overlay').removeAttribute('hidden'); },
  hide() { document.getElementById('loading-overlay').setAttribute('hidden', ''); }
};

/* ===== ACTIVITY LOG ===== */
const Activity = {
  KEY: 'hh_activity',
  add(icon, text) {
    const log = Store.get(this.KEY, []);
    log.unshift({ icon, text, time: new Date().toLocaleString() });
    if (log.length > 20) log.pop();
    Store.set(this.KEY, log);
    this.render();
  },
  render() {
    const list = document.getElementById('activity-list');
    if (!list) return;
    const log = Store.get(this.KEY, []);
    if (!log.length) {
      list.innerHTML = '<li class="activity-empty">No recent activity yet.</li>';
      return;
    }
    list.innerHTML = log.slice(0, 8).map(a =>
      `<li><i class="fa-solid ${a.icon}"></i><div><div>${a.text}</div><small style="font-size:0.72rem;color:var(--text-muted)">${a.time}</small></div></li>`
    ).join('');
  }
};

/* ===== NOTIFICATIONS ===== */
const Notifs = {
  KEY: 'hh_notifs',
  add(icon, text) {
    const list = Store.get(this.KEY, []);
    list.unshift({ icon, text, time: new Date().toLocaleString() });
    Store.set(this.KEY, list);
    this.updateDot();
    this.render();
  },
  render() {
    const ul = document.getElementById('notif-list');
    const items = Store.get(this.KEY, []);
    if (!items.length) {
      ul.innerHTML = '<li class="notif-empty">No notifications.</li>'; return;
    }
    ul.innerHTML = items.map(n =>
      `<li><i class="fa-solid ${n.icon}"></i><div><div>${n.text}</div><small>${n.time}</small></div></li>`
    ).join('');
  },
  updateDot() {
    const dot = document.getElementById('notif-dot');
    dot.classList.toggle('visible', Store.get(this.KEY, []).length > 0);
  },
  clear() {
    Store.set(this.KEY, []);
    this.updateDot();
    this.render();
  }
};

/* ===== NAVIGATION ===== */
const Nav = {
  init() {
    document.querySelectorAll('.nav-item[data-section]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.go(link.dataset.section);
        if (window.innerWidth <= 768) Sidebar.close();
      });
    });
    document.querySelectorAll('.qa-btn[data-section]').forEach(btn => {
      btn.addEventListener('click', () => this.go(btn.dataset.section));
    });
  },
  go(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    const sec = document.getElementById(`section-${section}`);
    if (sec) sec.classList.add('active');
    const link = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (link) link.classList.add('active');
    document.getElementById('page-title').textContent =
      link?.querySelector('span')?.textContent || section;
    window.scrollTo(0, 0);
  }
};

/* ===== SIDEBAR ===== */
const Sidebar = {
  init() {
    const toggle = document.getElementById('sidebar-toggle');
    toggle.addEventListener('click', () => this.toggle());
    // mobile overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebar-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => this.close());
  },
  toggle() {
    const sb = document.getElementById('sidebar');
    const mw = document.getElementById('main-wrapper');
    if (window.innerWidth <= 768) {
      sb.classList.toggle('open');
      document.getElementById('sidebar-overlay').classList.toggle('visible', sb.classList.contains('open'));
    } else {
      sb.classList.toggle('collapsed');
      mw.classList.toggle('expanded', sb.classList.contains('collapsed'));
    }
  },
  close() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }
};

/* ===== THEME ===== */
const Theme = {
  init() {
    const saved = localStorage.getItem('hh_theme') || 'light';
    document.documentElement.dataset.theme = saved;
    this.updateIcon(saved);
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggle());
  },
  toggle() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('hh_theme', next);
    this.updateIcon(next);
  },
  updateIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
};

/* ===== GLOBAL SEARCH ===== */
const Search = {
  init() {
    document.getElementById('global-search').addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return;
      const sections = ['volunteers','donations','messages','events','inventory','sponsorships'];
      for (const s of sections) {
        const rows = document.querySelectorAll(`#${s.slice(0,3)}-tbody tr, #evt-tbody tr, #inv-tbody tr, #spon-tbody tr, #msg-tbody tr`);
        rows.forEach(r => {
          r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      }
    });
  }
};

/* ===== STATS ===== */
const Stats = {
  update() {
    // Use the live merged list from Donations (DB + local)
    const donations   = Donations.all ? Donations.all() : Store.get('hh_donations', []);
    const volunteers  = Store.get('hh_volunteers', []);
    const sponsors    = Sponsorships.count ? Sponsorships.count() : 0;
    const events      = Store.get('hh_events', []);
    const inventory   = Store.get('hh_inventory', []);

    const totalDon = donations.filter(d => d.status === 'Completed')
                              .reduce((s, d) => s + parseFloat(d.amount || 0), 0);
    const alerts   = inventory.filter(i => parseInt(i.quantity) <= parseInt(i.minStock)).length;
    const upcoming = events.filter(e => new Date(e.date) >= new Date()).length;

    document.getElementById('stat-donations').textContent  = 'R ' + totalDon.toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2});
    document.getElementById('stat-volunteers').textContent = volunteers.length;
    document.getElementById('stat-sponsors').textContent   = sponsors;
    document.getElementById('stat-events').textContent     = upcoming;
    document.getElementById('stat-alerts').textContent     = alerts;

    // badges
    const msgs = Store.get('hh_messages', []);
    const unread = msgs.filter(m => m.status === 'unread').length;
    document.getElementById('msg-badge').textContent = unread;
    document.getElementById('msg-badge').style.display = unread ? '' : 'none';
    document.getElementById('inv-badge').textContent = alerts;
    document.getElementById('inv-badge').style.display = alerts ? '' : 'none';
  }
};

/* ===== CHARTS ===== */
const Charts = {
  donationChart: null,
  volunteerChart: null,
  init() {
    this.renderDonation();
    this.renderVolunteer();
  },
  renderDonation() {
    const donations = Donations.all ? Donations.all() : Store.get('hh_donations', []);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const totals = Array(12).fill(0);
    donations.filter(d => d.status === 'Completed').forEach(d => {
      const m = new Date(d.date).getMonth();
      if (!isNaN(m)) totals[m] += parseFloat(d.amount || 0);
    });
    if (this.donationChart) this.donationChart.destroy();
    const ctx = document.getElementById('donationChart');
    if (!ctx) return;
    this.donationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Donations (R)',
          data: totals,
          backgroundColor: '#f97316',
          borderRadius: 5,
          maxBarThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { maxTicksLimit: 5 } },
          x: { grid: { display: false } }
        }
      }
    });
  },
  renderVolunteer() {
    const volunteers = Store.get('hh_volunteers', []);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const counts = Array(12).fill(0);
    volunteers.forEach(v => {
      const m = new Date(v.date).getMonth();
      if (!isNaN(m)) counts[m]++;
    });
    if (this.volunteerChart) this.volunteerChart.destroy();
    const ctx = document.getElementById('volunteerChart');
    if (!ctx) return;
    this.volunteerChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'New Volunteers',
          data: counts,
          backgroundColor: '#3b82f6',
          borderRadius: 5,
          maxBarThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { maxTicksLimit: 5 } },
          x: { grid: { display: false } }
        }
      }
    });
  }
};

/* ===== VOLUNTEERS ===== */
const Volunteers = {
  KEY: 'hh_volunteers',
  _dbRows: [],
  _localRows: [],
  _ready: false,

  init() {
    const existing = Store.get(this.KEY, []);
    this._localRows = existing.filter(v => v._source === 'local');
    document.getElementById('add-volunteer-btn').addEventListener('click', () => this.openForm());
    document.getElementById('vol-search').addEventListener('input', () => this.render());
    document.getElementById('vol-filter').addEventListener('change', () => this.render());
    this.render();
    this.loadFromDB();
  },

  async loadFromDB() {
    try {
      Loading.show();
      const { data, error } = await DB
        .from('users')
        .select('id, display_name, email, volunteer, volunteer_role, created_at')
        .eq('volunteer', 'Y')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this._dbRows = (data || []).map(v => ({
        id:           v.id,
        user_id:      v.id,
        name:         v.display_name || v.email,
        email:        v.email || '',
        phone:        'N/A',
        activity:     v.volunteer_role || 'N/A',
        skills:       v.volunteer_role || 'N/A',
        availability: 'N/A',
        status:       'Pending',
        date:         v.created_at,
        _source:      'db'
      }));
    } catch (err) {
      console.error('Volunteers DB error:', err);
      Toast.show('Could not load volunteers from database: ' + err.message, 'error');
    } finally {
      Loading.hide();
    }
    this._ready = true;
    this._merged = [...this._dbRows, ...this._localRows];
    this.render();
    Stats.update();
    Charts.renderVolunteer();
  },

  all() {
    if (!this._ready) return this._localRows;
    return this._merged || [];
  },

  save(list) {
    const local = list.filter(v => v._source !== 'db');
    Store.set(this.KEY, local);
    this._localRows = local;
    this._merged = [...this._dbRows, ...local];
    Stats.update();
    Charts.renderVolunteer();
  },

  render() {
    const q      = document.getElementById('vol-search').value.toLowerCase();
    const filter = document.getElementById('vol-filter').value;
    const list = this.all().filter(v =>
      (!q || `${v.name} ${v.email} ${v.activity || v.skills}`.toLowerCase().includes(q)) &&
      (!filter || v.status === filter)
    );
    const tbody = document.getElementById('vol-tbody');
    if (!this._ready) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="text-align:center;padding:32px;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px"></i>Loading volunteersâ€¦</td></tr>`;
      return;
    }
    if (!list.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No volunteers found.</td></tr>`; return;
    }
    tbody.innerHTML = list.map(v => `
      <tr>
        <td>${esc(v.name)}</td>
        <td>${esc(v.email)}</td>
        <td>${esc(v.phone || 'N/A')}</td>
        <td>${esc(v.activity || v.skills || 'N/A')}</td>
        <td>${esc(v.availability || 'N/A')}</td>
        <td><span class="status-badge status-${v.status.toLowerCase()}">${v.status}</span></td>
        <td class="action-btns">
          <button class="act-btn act-view"    onclick="Volunteers.view('${v.id}')"><i class="fa-solid fa-eye"></i> View</button>
          <button class="act-btn act-approve" onclick="Volunteers.setStatus('${v.id}','Approved')"><i class="fa-solid fa-check"></i></button>
          <button class="act-btn act-reject"  onclick="Volunteers.setStatus('${v.id}','Rejected')"><i class="fa-solid fa-xmark"></i></button>
          <button class="act-btn act-delete"  onclick="Volunteers.delete('${v.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  async setStatus(id, status) {
    const v = this.all().find(v => String(v.id) === String(id));
    if (!v) return;
    if (v._source === 'db') {
      Toast.show('Status tracking is local only for user-based volunteers.', 'info');
    }
    const list = this._localRows;
    const item = list.find(x => String(x.id) === String(id));
    if (item) { item.status = status; this.save(list); this.render(); }
    Activity.add(status === 'Approved' ? 'fa-check' : 'fa-xmark', `Volunteer ${v.name} ${status.toLowerCase()}.`);
    Toast.show(`Volunteer ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'warning');
    if (status === 'Approved' && v.email) {
      try {
        await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templates.volunteerApproved, {
          to_email:    v.email,
          to_name:     v.name,
          activity:    v.activity || v.skills || 'General Volunteering',
          org_name:    'Hopeful Hearts Orphanage',
          contact_email: 'hello@hopefulhearts.org'
        });
        Toast.show(`Approval email sent to ${v.email}.`, 'success');
      } catch (err) {
        console.error('EmailJS error:', err);
        Toast.show('Could not send approval email.', 'warning');
      }
    }
  },

  async delete(id) {
    if (!confirm('Delete this volunteer?')) return;
    const v = this.all().find(v => String(v.id) === String(id));
    if (v && v._source === 'db') {
      const { error } = await DB.from('users').update({ volunteer: 'N', volunteer_role: null }).eq('id', id);
      if (error) { Toast.show('Failed to remove volunteer: ' + error.message, 'error'); return; }
      await this.loadFromDB();
    } else {
      const list = this._localRows.filter(v => String(v.id) !== String(id));
      this.save(list); this.render();
    }
    Toast.show('Volunteer removed.', 'success');
  },

  openForm(vol = null) {
    const isEdit = !!vol;
    Modal.open(isEdit ? 'Edit Volunteer' : 'Add Volunteer',
      `<div class="form-group"><label>Full Name</label><input id="vf-name" value="${esc(vol?.name||'')}" placeholder="Jane Doe" /></div>
       <div class="form-row">
         <div class="form-group"><label>Email</label><input id="vf-email" type="email" value="${esc(vol?.email||'')}" placeholder="jane@email.com" /></div>
         <div class="form-group"><label>Phone</label><input id="vf-phone" value="${esc(vol?.phone||'')}" placeholder="+27 60 000 0000" /></div>
       </div>
       <div class="form-group"><label>Activity</label>
         <select id="vf-skills">
           ${['Tutoring','Cleaning','Cooking','Other'].map(s => `<option ${(vol?.activity||vol?.skills||'')===s?'selected':''}>${s}</option>`).join('')}
         </select>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Availability</label><input id="vf-avail" value="${esc(vol?.availability||'')}" placeholder="Weekends" /></div>
         <div class="form-group"><label>Status</label>
           <select id="vf-status">
             ${['Pending','Approved','Rejected'].map(s=>`<option ${(vol?.status||'Pending')===s?'selected':''}>${s}</option>`).join('')}
           </select>
         </div>
       </div>`,
      `<button class="btn-cancel" onclick="Modal.close()">Cancel</button>
       <button class="btn-primary" onclick="Volunteers.save_form('${vol?.id||'null'}')">
         <i class="fa-solid fa-floppy-disk"></i> ${isEdit?'Update':'Add'}
       </button>`
    );
  },

  save_form(id) {
    const name  = document.getElementById('vf-name').value.trim();
    const email = document.getElementById('vf-email').value.trim();
    if (!name || !email) { Toast.show('Name and email are required.','error'); return; }
    const list = [...this._localRows];
    const data = {
      name, email,
      phone:        document.getElementById('vf-phone').value.trim(),
      activity:     document.getElementById('vf-skills').value,
      skills:       document.getElementById('vf-skills').value,
      availability: document.getElementById('vf-avail').value.trim(),
      status:       document.getElementById('vf-status').value,
      date:         new Date().toISOString(),
      _source:      'local'
    };
    if (id && id !== 'null') {
      const i = list.findIndex(v => String(v.id) === String(id));
      if (i > -1) list[i] = { ...list[i], ...data };
      Toast.show('Volunteer updated.','success');
    } else {
      data.id = 'local_' + Store.nextId(list);
      list.push(data);
      Activity.add('fa-user-plus', `New volunteer added: ${name}`);
      Notifs.add('fa-user-plus', `New volunteer: ${name}`);
      Toast.show('Volunteer added.','success');
    }
    this.save(list); Modal.close(); this.render();
  },

  view(id) {
    const v = this.all().find(v => String(v.id) === String(id));
    if (!v) return;
    Modal.open('Volunteer Details',
      `<div class="detail-grid">
        <div class="detail-item"><span class="label">Name</span><span class="value">${esc(v.name)}</span></div>
        <div class="detail-item"><span class="label">Email</span><span class="value">${esc(v.email)}</span></div>
        <div class="detail-item"><span class="label">Phone</span><span class="value">${esc(v.phone||'N/A')}</span></div>
        <div class="detail-item"><span class="label">Activity</span><span class="value">${esc(v.activity||v.skills||'N/A')}</span></div>
        <div class="detail-item"><span class="label">Availability</span><span class="value">${esc(v.availability||'N/A')}</span></div>
        <div class="detail-item"><span class="label">Status</span><span class="value"><span class="status-badge status-${v.status.toLowerCase()}">${v.status}</span></span></div>
        <div class="detail-item"><span class="label">Source</span><span class="value">${v._source === 'db' ? 'ðŸŒ Online (Supabase)' : 'ðŸ“ Manually added'}</span></div>
       </div>`,
      `<button class="btn-primary" onclick="Volunteers.openForm(Volunteers.all().find(x=>String(x.id)==='${id}'))"><i class="fa-solid fa-pen"></i> Edit</button>`
    );
  }
};

/* ===== DONATIONS (Supabase-backed) ===== */
const Donations = {
  KEY: 'hh_donations',       // kept for manually-recorded local donations only
  _dbRows: [],               // cache of rows fetched from Supabase
  _localRows: [],            // manually-added records (not from DB)
  _ready: false,             // true once DB fetch completes

  init() {
    // Purge any old demo/seed data from localStorage.
    // Only keep records that were explicitly manually added (_source === 'local').
    const existing = Store.get(this.KEY, []);
    const local = existing.filter(d => d._source === 'local');
    Store.set(this.KEY, local);
    this._localRows = local;

    document.getElementById('add-donation-btn').addEventListener('click', () => this.openForm());
    document.getElementById('don-search').addEventListener('input', () => this.render());
    document.getElementById('don-filter').addEventListener('change', () => this.render());
    this.render();       // show loading spinner immediately
    this.loadFromDB();   // then fetch live data from Supabase
  },

  /* ---- Fetch all donations from Supabase ---- */
  async loadFromDB() {
    try {
      Loading.show();

      // Try fetching with donor_name column (new rows have this)
      // Also try join for older rows that may not have donor_name
      let data, error;
      ({ data, error } = await DB
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false }));

      // If that fails, something fundamental is wrong
      if (error) throw error;

      console.log('Donations fetched from DB:', data?.length, data);

      if (!data || data.length === 0) {
        Toast.show('No donations found in database yet.', 'info');
      }

      // Normalise rows N/A handle both old rows (no donor_name) and new rows (with donor_name)
      this._dbRows = (data || []).map(d => ({
        id:      d.id,
        user_id: d.user_id,
        name:    d.donor_name || d.user_email || 'Anonymous',
        email:   d.user_email || '',
        amount:  Math.abs(parseFloat(d.amount || 0)), // stored as negative
        date:    d.created_at,
        status:  d.status === 'donation' ? 'Completed' : (d.status || 'Completed'),
        notes:   d.message || '',
        _source: 'db'
      }));

    } catch (err) {
      console.error('Donations DB error:', err);
      Toast.show('Could not load donations N/A check RLS policies in Supabase: ' + err.message, 'error');
    } finally {
      Loading.hide();
    }

    this._ready = true;
    this._merged = [...this._dbRows, ...this._localRows];
    this.render();
    Stats.update();
    Charts.renderDonation();
  },

  /* ---- Return the merged list (DB + local manually-added) ---- */
  all() {
    if (!this._ready) return [];   // still loading N/A return empty, not stale localStorage
    return this._merged || [];
  },

  save(list) {
    // Only persist locally-created records back to localStorage
    const local = list.filter(d => d._source !== 'db');
    Store.set(this.KEY, local);
    this._localRows = local;
    this._merged = [...this._dbRows, ...local];
    Stats.update();
    Charts.renderDonation();
  },

  render() {
    const q      = document.getElementById('don-search').value.toLowerCase();
    const filter = document.getElementById('don-filter').value;
    const tbody  = document.getElementById('don-tbody');

    if (!this._ready) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px"></i>Loading donations from databaseâ€¦</td></tr>`;
      return;
    }

    const list = this.all().filter(d =>
      (!q || `${d.name} ${d.email} ${d.notes}`.toLowerCase().includes(q)) &&
      (!filter || d.status === filter)
    );
    if (!list.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No donations found.</td></tr>`; return;
    }
    tbody.innerHTML = list.map(d => `
      <tr>
        <td>${esc(d.name)}</td>
        <td>${esc(d.email)}</td>
        <td><strong>R${parseFloat(d.amount||0).toFixed(2)}</strong></td>
        <td>${d.date ? new Date(d.date).toLocaleDateString() : 'N/A'}</td>
        <td><span class="status-badge status-${(d.status||'completed').toLowerCase()}">${d.status}</span></td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-muted);font-size:0.82rem;">${esc(d.notes||'N/A')}</td>
        <td class="action-btns">
          <button class="act-btn act-view" onclick="Donations.view('${d.id}')"><i class="fa-solid fa-eye"></i> View</button>
          ${d._source !== 'db' ? `
          <button class="act-btn act-edit"   onclick="Donations.openForm(Donations.all().find(x=>x.id=='${d.id}'))"><i class="fa-solid fa-pen"></i></button>
          <button class="act-btn act-delete" onclick="Donations.delete('${d.id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
        </td>
      </tr>`).join('');
  },

  openForm(don = null) {
    const isEdit = !!don;
    Modal.open(isEdit ? 'Edit Donation' : 'Record Donation',
      `<div class="form-row">
         <div class="form-group"><label>Donor Name</label><input id="df-name" value="${esc(don?.name||'')}" placeholder="John Smith" /></div>
         <div class="form-group"><label>Email</label><input id="df-email" type="email" value="${esc(don?.email||'')}" placeholder="john@email.com" /></div>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Amount (R)</label><input id="df-amount" type="number" min="0" step="0.01" value="${don?.amount||''}" placeholder="100.00" /></div>
         <div class="form-group"><label>Date</label><input id="df-date" type="date" value="${don?.date ? don.date.slice(0,10) : new Date().toISOString().slice(0,10)}" /></div>
       </div>
       <div class="form-group"><label>Status</label>
         <select id="df-status">
           ${['Completed','Pending','Failed'].map(s=>`<option ${(don?.status||'Completed')===s?'selected':''}>${s}</option>`).join('')}
         </select>
       </div>
       <div class="form-group"><label>Notes</label><textarea id="df-notes" placeholder="Optional noteâ€¦">${esc(don?.notes||'')}</textarea></div>`,
      `<button class="btn-cancel" onclick="Modal.close()">Cancel</button>
       <button class="btn-primary" onclick="Donations.save_form('${don?.id||'null'}')">
         <i class="fa-solid fa-floppy-disk"></i> ${isEdit?'Update':'Save'}
       </button>`
    );
  },

  save_form(id) {
    const name   = document.getElementById('df-name').value.trim();
    const email  = document.getElementById('df-email').value.trim();
    const amount = document.getElementById('df-amount').value;
    if (!name || !amount) { Toast.show('Name and amount are required.','error'); return; }
    const local = [...this._localRows];
    const data = {
      name, email, amount: parseFloat(amount),
      date:   document.getElementById('df-date').value,
      status: document.getElementById('df-status').value,
      notes:  document.getElementById('df-notes').value.trim(),
      _source: 'local'
    };
    if (id && id !== 'null') {
      const i = local.findIndex(d => String(d.id) === String(id));
      if (i > -1) local[i] = { ...local[i], ...data };
      Toast.show('Donation updated.','success');
    } else {
      data.id = 'local_' + Store.nextId(local);
      local.push(data);
      Activity.add('fa-hand-holding-heart', `Donation of R${parseFloat(amount).toFixed(2)} from ${name}`);
      Notifs.add('fa-hand-holding-heart', `New donation: R${parseFloat(amount).toFixed(2)} from ${name}`);
      Toast.show('Donation recorded.','success');
    }
    Store.set(this.KEY, local);
    this._localRows = local;
    this._merged = [...this._dbRows, ...local];
    Modal.close();
    this.render();
    Stats.update();
    Charts.renderDonation();
  },

  delete(id) {
    if (!confirm('Delete this donation record?')) return;
    const local = this._localRows.filter(d => String(d.id) !== String(id));
    Store.set(this.KEY, local);
    this._localRows = local;
    this._merged = [...this._dbRows, ...local];
    this.render();
    Stats.update();
    Charts.renderDonation();
    Toast.show('Donation deleted.','success');
  },

  view(id) {
    const d = this.all().find(d => String(d.id) === String(id));
    if (!d) return;
    Modal.open('Donation Details',
      `<div class="detail-grid">
        <div class="detail-item"><span class="label">Donor</span><span class="value">${esc(d.name)}</span></div>
        <div class="detail-item"><span class="label">Email</span><span class="value">${esc(d.email||'N/A')}</span></div>
        <div class="detail-item"><span class="label">Amount</span><span class="value"><strong>R${parseFloat(d.amount||0).toFixed(2)}</strong></span></div>
        <div class="detail-item"><span class="label">Date</span><span class="value">${d.date ? new Date(d.date).toLocaleString() : 'N/A'}</span></div>
        <div class="detail-item"><span class="label">Status</span><span class="value"><span class="status-badge status-${(d.status||'completed').toLowerCase()}">${d.status}</span></span></div>
        <div class="detail-item"><span class="label">Source</span><span class="value">${d._source === 'db' ? 'ðŸŒ Online (Supabase)' : 'ðŸ“ Manually recorded'}</span></div>
        <div class="detail-item detail-message"><span class="label">Message / Notes</span><span class="value" style="white-space:pre-wrap">${esc(d.notes||'N/A')}</span></div>
       </div>`, '');
  }
};

/* ===== MESSAGES ===== */
const Messages = {
  KEY: 'hh_messages',
  init() {
    this.render();
    document.getElementById('msg-search').addEventListener('input', () => this.render());
    document.getElementById('msg-filter').addEventListener('change', () => this.render());
  },
  all()  { return Store.get(this.KEY, []); },
  save(list) { Store.set(this.KEY, list); Stats.update(); },
  render() {
    const q      = document.getElementById('msg-search').value.toLowerCase();
    const filter = document.getElementById('msg-filter').value;
    let list = this.all().filter(m =>
      (!q || `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(q)) &&
      (!filter || m.status === filter)
    );
    const tbody = document.getElementById('msg-tbody');
    if (!list.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No messages found.</td></tr>`; return;
    }
    tbody.innerHTML = list.map(m => `
      <tr style="${m.status==='unread'?'font-weight:600;':''}" >
        <td>${esc(m.name)}</td>
        <td>${esc(m.email)}</td>
        <td>${esc(m.subject||'N/A')}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.message||'')}</td>
        <td>${m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}</td>
        <td class="action-btns">
          <button class="act-btn act-view"  onclick="Messages.view(${m.id})"><i class="fa-solid fa-eye"></i> View</button>
          <button class="act-btn act-read"  onclick="Messages.markRead(${m.id})"><i class="fa-solid fa-check-double"></i></button>
          <button class="act-btn act-delete" onclick="Messages.delete(${m.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
  },
  markRead(id) {
    const list = this.all();
    const m = list.find(m => m.id === id);
    if (m) { m.status = 'read'; this.save(list); this.render(); }
  },
  delete(id) {
    if (!confirm('Delete this message?')) return;
    const list = this.all().filter(m => m.id !== id);
    this.save(list); this.render();
    Toast.show('Message deleted.','success');
  },
  view(id) {
    const m = this.all().find(m => m.id === id);
    if (!m) return;
    this.markRead(id);
    Modal.open('Message Details',
      `<div class="detail-grid">
        <div class="detail-item"><span class="label">From</span><span class="value">${esc(m.name)}</span></div>
        <div class="detail-item"><span class="label">Email</span><span class="value">${esc(m.email)}</span></div>
        <div class="detail-item"><span class="label">Subject</span><span class="value">${esc(m.subject||'N/A')}</span></div>
        <div class="detail-item"><span class="label">Date</span><span class="value">${m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}</span></div>
        <div class="detail-item detail-message"><span class="label">Message</span>
          <span class="value" style="white-space:pre-wrap">${esc(m.message||'')}</span>
        </div>
       </div>`,
      `<a class="btn-primary" href="mailto:${esc(m.email)}?subject=Re: ${encodeURIComponent(m.subject||'')}">
         <i class="fa-solid fa-reply"></i> Reply via Email
       </a>`
    );
  },
  // Allows the main site to submit messages via localStorage
  seed(data) {
    const list = this.all();
    data.id = Store.nextId(list);
    data.status = 'unread';
    data.date = new Date().toISOString();
    list.push(data);
    this.save(list);
    Notifs.add('fa-envelope', `New message from ${data.name}`);
  }
};

/* ===== EVENTS (Supabase-backed with localStorage fallback) ===== */
const Events = {
  KEY: 'hh_events',
  _dbRows: [],
  _localRows: [],
  _ready: false,

  init() {
    const existing = Store.get(this.KEY, []);
    this._localRows = existing;

    document.getElementById('add-event-btn').addEventListener('click', () => this.openForm());
    document.getElementById('evt-search').addEventListener('input', () => this.render());
    
    const scanBtn = document.getElementById('btn-scan-qr');
    if (scanBtn) scanBtn.addEventListener('click', () => this.startCheckInScan());

    this.render();
    this.loadFromDB();
  },

  async loadFromDB() {
    try {
      const { data, error } = await DB
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      this._dbRows = (data || []).map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        date: e.date,
        time: e.time,
        location: e.location,
        venue_name: e.venue_name,
        latitude: e.latitude,
        longitude: e.longitude,
        category: e.category,
        capacity: e.capacity,
        registered: e.registered,
        is_registration_open: e.is_registration_open,
        registration_deadline: e.registration_deadline,
        donation_goal: e.donation_goal,
        volunteer_requirements: e.volunteer_requirements,
        image_url: e.image_url,
        _source: 'db'
      }));
    } catch (err) {
      console.warn('Events DB load failed:', err.message);
    } finally {
      this._ready = true;
      this._merged = [...this._dbRows, ...this._localRows];
      this.render();
      Stats.update();
    }
  },

  all() {
    if (!this._ready) return this._localRows;
    return this._merged || [];
  },

  save(list) {
    const local = list.filter(e => e._source !== 'db');
    Store.set(this.KEY, local);
    this._localRows = local;
    this._merged = [...this._dbRows, ...local];
    Stats.update();
  },

  render() {
    const q = document.getElementById('evt-search').value.toLowerCase();
    const tbody = document.getElementById('evt-tbody');
    
    if (!this._ready) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px"></i>Loading events from databaseâ€¦</td></tr>`;
      return;
    }
    
    const list = this.all().filter(e => !q || `${e.name} ${e.location}`.toLowerCase().includes(q));
    if (!list.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No events found.</td></tr>`; return;
    }
    
    tbody.innerHTML = list.map(e => `
      <tr>
        <td><strong>${esc(e.name)}</strong></td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-muted);font-size:0.82rem;">${esc(e.description||'N/A')}</td>
        <td>${e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</td>
        <td>${esc(e.venue_name||e.location||'N/A')}</td>
        <td>${e.capacity||100}</td>
        <td>${e.registered||0}</td>
        <td class="action-btns">
          <button class="act-btn act-view"   onclick="Events.view('${e.id}')"><i class="fa-solid fa-eye"></i> View</button>
          <button class="act-btn act-edit"   onclick="Events.openForm(Events.all().find(x=>String(x.id)==='${e.id}'))"><i class="fa-solid fa-pen"></i></button>
          <button class="act-btn act-delete" onclick="Events.delete('${e.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  openForm(ev = null) {
    const isEdit = !!ev;
    Modal.open(isEdit ? 'Edit Event' : 'Create Event',
      `<div class="form-row">
         <div class="form-group"><label>Event Name *</label><input id="ef-name" value="${esc(ev?.name||'')}" /></div>
         <div class="form-group"><label>Category</label>
           <select id="ef-category">
             ${['General','Fundraiser','Volunteer','Social','Workshop'].map(c=>`<option ${(ev?.category||'')===c?'selected':''}>${c}</option>`).join('')}
           </select>
         </div>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Date *</label><input id="ef-date" type="date" value="${ev?.date ? ev.date.slice(0,10) : ''}" /></div>
         <div class="form-group"><label>Time</label><input id="ef-time" type="time" value="${ev?.time||''}" /></div>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Venue Name</label><input id="ef-venue" value="${esc(ev?.venue_name||ev?.location||'')}" /></div>
         <div class="form-group"><label>Image URL</label><input id="ef-image" value="${esc(ev?.image_url||'')}" /></div>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Latitude</label><input id="ef-lat" type="number" step="any" value="${ev?.latitude||''}" /></div>
         <div class="form-group"><label>Longitude</label><input id="ef-lng" type="number" step="any" value="${ev?.longitude||''}" /></div>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Capacity *</label><input id="ef-cap" type="number" min="1" value="${ev?.capacity||ev?.maxAttendees||100}" /></div>
         <div class="form-group"><label>Deadline</label><input id="ef-deadline" type="date" value="${ev?.registration_deadline ? ev.registration_deadline.slice(0,10) : ''}" /></div>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Donation Goal (R)</label><input id="ef-goal" type="number" step="any" value="${ev?.donation_goal||''}" /></div>
         <div class="form-group"><label>Volunteer Requirements</label><input id="ef-volreq" value="${esc(ev?.volunteer_requirements||'')}" /></div>
       </div>
       <div class="form-group"><label>Description</label><textarea id="ef-desc">${esc(ev?.description||'')}</textarea></div>
       <div class="form-group" style="display:flex; align-items:center; gap:8px;">
         <input type="checkbox" id="ef-open" style="width:20px;height:20px;" ${(ev?.is_registration_open !== false)?'checked':''} />
         <label for="ef-open" style="margin:0;">Registration Open</label>
       </div>`,
      `<button class="btn-cancel" onclick="Modal.close()">Cancel</button>
       <button class="btn-primary" onclick="Events.save_form('${ev?.id||'null'}')">
         <i class="fa-solid fa-floppy-disk"></i> ${isEdit?'Update':'Create'}
       </button>`
    );
  },

  async save_form(id) {
    const name = document.getElementById('ef-name').value.trim();
    if (!name) { Toast.show('Event name is required.','error'); return; }
    
    const date = document.getElementById('ef-date').value;
    if (!date) { Toast.show('Date is required.','error'); return; }

    const dataObj = {
      name,
      description: document.getElementById('ef-desc').value.trim(),
      date,
      time: document.getElementById('ef-time').value || null,
      venue_name: document.getElementById('ef-venue').value.trim(),
      category: document.getElementById('ef-category').value,
      image_url: document.getElementById('ef-image').value.trim(),
      capacity: parseInt(document.getElementById('ef-cap').value) || 100,
      is_registration_open: document.getElementById('ef-open').checked
    };

    const lat = document.getElementById('ef-lat').value;
    if (lat) dataObj.latitude = parseFloat(lat);
    const lng = document.getElementById('ef-lng').value;
    if (lng) dataObj.longitude = parseFloat(lng);
    const deadline = document.getElementById('ef-deadline').value;
    if (deadline) dataObj.registration_deadline = deadline;
    const goal = document.getElementById('ef-goal').value;
    if (goal) dataObj.donation_goal = parseFloat(goal);
    const volreq = document.getElementById('ef-volreq').value.trim();
    if (volreq) dataObj.volunteer_requirements = volreq;
    
    const editingEvent = id !== 'null' ? this.all().find(e => String(e.id) === String(id)) : null;
    
    if (editingEvent && editingEvent._source === 'db') {
      try {
        Loading.show();
        const { error } = await DB
          .from('events')
          .update(dataObj)
          .eq('id', id);
        
        if (error) throw error;
        Toast.show('Event updated in Database.', 'success');
        Modal.close();
        await this.loadFromDB();
      } catch (err) {
        console.error(err);
        Toast.show('Failed to update event in database: ' + err.message, 'error');
      } finally {
        Loading.hide();
      }
      return;
    }

    if (id === 'null' && this._ready) {
      try {
        Loading.show();
        dataObj.registered = 0;
        const { error } = await DB
          .from('events')
          .insert(dataObj);
        
        if (!error) {
          Toast.show('Event created in Database.', 'success');
          Modal.close();
          await this.loadFromDB();
          return;
        }
        console.error('DB Insert Error:', error);
        Toast.show('Failed to create event in database: ' + error.message, 'error');
      } catch (err) {
        console.error(err);
        Toast.show('Failed to create event in database: ' + err.message, 'error');
      } finally {
        Loading.hide();
      }
      return; // Do not fallback to local storage
    }

    const list = [...this._localRows];
    const localData = { ...dataObj, _source: 'local' };

    if (editingEvent) {
      const i = list.findIndex(e => String(e.id) === String(id));
      if (i > -1) list[i] = { ...list[i], ...localData };
      Toast.show('Local event updated.','success');
    } else {
      localData.id = 'local_' + Store.nextId(list); 
      localData.registered = 0;
      list.push(localData);
      Activity.add('fa-calendar-plus', `Event created: ${name}`);
      Toast.show('Local event created.','success');
    }
    
    this.save(list); 
    Modal.close(); 
    this.render();
  },

  async delete(id) {
    if (!confirm('Delete this event?')) return;
    
    const event = this.all().find(e => String(e.id) === String(id));
    if (event && event._source === 'db') {
      try {
        Loading.show();
        const { error } = await DB
          .from('events')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        Toast.show('Event deleted from Database.', 'success');
        await this.loadFromDB();
      } catch (err) {
        console.error(err);
        Toast.show('Failed to delete event from database: ' + err.message, 'error');
      } finally {
        Loading.hide();
      }
      return;
    }

    const list = this._localRows.filter(e => String(e.id) !== String(id));
    this.save(list); 
    this.render();
    Toast.show('Local event deleted.','success');
  },

  async view(id) {
    const e = this.all().find(x => String(x.id) === String(id));
    if (!e) return;

    Modal.open('Event Details & Registrations',
      `<div class="detail-grid">
        <div class="detail-item"><span class="label">Event Name</span><span class="value"><strong>${esc(e.name)}</strong></span></div>
        <div class="detail-item"><span class="label">Date</span><span class="value">${e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</span></div>
        <div class="detail-item"><span class="label">Location</span><span class="value">${esc(e.venue_name||e.location||'N/A')}</span></div>
        <div class="detail-item"><span class="label">Registration</span><span class="value">${e.registered||0} / ${e.capacity||100}</span></div>
        <div class="detail-item detail-message"><span class="label">Description</span><span class="value">${esc(e.description||'N/A')}</span></div>
       </div>
       <div style="margin-top:20px;">
         <h4 style="font-size:0.95rem;border-bottom:1px solid var(--border-color, #e2e8f0);padding-bottom:8px;margin-bottom:10px;"><i class="fa-solid fa-users"></i> Registrations</h4>
         <ul id="event-rsvp-list" style="list-style:none;max-height:250px;overflow-y:auto;font-size:0.85rem;display:grid;gap:6px;padding:0;">
           <li>Loading registrations...</li>
         </ul>
       </div>`, '');

    const listEl = document.getElementById('event-rsvp-list');
    if (e._source === 'db') {
      try {
        const { data, error } = await DB
          .from('event_registrations')
          .select('*')
          .eq('event_id', id)
          .order('registration_date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          listEl.innerHTML = data.map(r => 
            `<li style="background:rgba(0,0,0,0.02);padding:8px 12px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong>${esc(r.name)}</strong> <span style="color:#64748b;">(${esc(r.attendance_type)})</span>
                <div style="font-size:0.75rem;color:#94a3b8;">${esc(r.email)}</div>
              </div>
              <div style="text-align:right;">
                <span class="status-badge status-${r.checked_in ? 'completed' : 'pending'}">${r.checked_in ? 'Checked In' : 'Pending'}</span>
                <div style="font-size:0.7rem;color:#94a3b8;margin-top:4px;">#${String(r.id).padStart(5, '0')}</div>
              </div>
            </li>`
          ).join('');
        } else {
          listEl.innerHTML = '<li style="color:var(--text-muted, #64748b);font-style:italic;">No registrations yet.</li>';
        }
      } catch (err) {
        console.warn(err);
        listEl.innerHTML = '<li style="color:#ef4444;">Failed to load registrations from database.</li>';
      }
    } else {
      listEl.innerHTML = '<li style="color:var(--text-muted, #64748b);font-style:italic;">Offline event.</li>';
    }
  },

  startCheckInScan() {
    Modal.open('Scan Ticket QR Code', 
      `<div id="qr-reader" style="width:100%; max-width:400px; margin: 0 auto;"></div>
       <div id="qr-reader-results" style="margin-top:20px; text-align:center; font-weight:600;"></div>`, 
      `<button class="btn-cancel" onclick="Events.stopScan()">Close Scanner</button>`
    );
    
    setTimeout(() => {
      if (typeof Html5QrcodeScanner !== 'undefined') {
        this.html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
        this.html5QrcodeScanner.render(this.onScanSuccess.bind(this), this.onScanFailure.bind(this));
      } else {
        document.getElementById('qr-reader-results').innerHTML = '<span style="color:red;">QR Scanner library not loaded.</span>';
      }
    }, 200);
  },

  stopScan() {
    if (this.html5QrcodeScanner) {
      this.html5QrcodeScanner.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
    }
    Modal.close();
  },

  async onScanSuccess(decodedText, decodedResult) {
    // Prevent multiple scans
    if (this.isScanningProc) return;
    this.isScanningProc = true;
    
    try {
      const data = JSON.parse(decodedText);
      if (data.reg_id && data.qr_code_id) {
        document.getElementById('qr-reader-results').innerHTML = `<span style="color:#3b82f6;">Processing Registration #${data.reg_id}...</span>`;
        
        // Verify and update in DB
        const { data: reg, error: fetchErr } = await DB
          .from('event_registrations')
          .select('*, events(name)')
          .eq('id', data.reg_id)
          .eq('qr_code_id', data.qr_code_id)
          .single();
          
        if (fetchErr || !reg) {
          document.getElementById('qr-reader-results').innerHTML = `<span style="color:#ef4444;"><i class="fa-solid fa-xmark"></i> Invalid Ticket!</span>`;
        } else if (reg.checked_in) {
          document.getElementById('qr-reader-results').innerHTML = `<span style="color:#f59e0b;"><i class="fa-solid fa-triangle-exclamation"></i> Already Checked In at ${new Date(reg.arrival_time).toLocaleTimeString()}</span>`;
        } else {
          // Check in
          const { error: updErr } = await DB
            .from('event_registrations')
            .update({ checked_in: true, arrival_time: new Date().toISOString() })
            .eq('id', data.reg_id);
            
          if (updErr) throw updErr;
          
          document.getElementById('qr-reader-results').innerHTML = `<span style="color:#10b981;"><i class="fa-solid fa-check"></i> Success! ${reg.name} checked in for ${reg.events.name}.</span>`;
          Activity.add('fa-qrcode', `${reg.name} checked into ${reg.events.name}`);
        }
      } else {
        document.getElementById('qr-reader-results').innerHTML = `<span style="color:#ef4444;">Unrecognized QR Code format.</span>`;
      }
    } catch (e) {
      console.warn("Scan parse error", e);
      document.getElementById('qr-reader-results').innerHTML = `<span style="color:#ef4444;">Invalid QR Code.</span>`;
    }
    
    // reset lock after 3 seconds
    setTimeout(() => { this.isScanningProc = false; }, 3000);
  },

  onScanFailure(error) {
    // ignore
  }
};;

/* ===== INVENTORY ===== */
const Inventory = {
  KEY: 'hh_inventory',
  DEFAULTS: [
    { id:1, item:'Rice (50kg bags)', category:'Food',      quantity:12, minStock:5,  unit:'bags'   },
    { id:2, item:'School Notebooks',  category:'Education', quantity:80, minStock:20, unit:'pcs'    },
    { id:3, item:'First Aid Kits',    category:'Medical',   quantity:4,  minStock:3,  unit:'kits'   },
    { id:4, item:'Blankets',          category:'Bedding',   quantity:30, minStock:10, unit:'pcs'    },
    { id:5, item:'Toothbrushes',      category:'Hygiene',   quantity:3,  minStock:10, unit:'pcs'    },
    { id:6, item:'Children Shoes',    category:'Clothing',  quantity:18, minStock:15, unit:'pairs'  }
  ],
  init() {
    if (!Store.get(this.KEY, []).length) Store.set(this.KEY, this.DEFAULTS);
    this.render();
    document.getElementById('add-inventory-btn').addEventListener('click', () => this.openForm());
  },
  all()  { return Store.get(this.KEY, []); },
  save(list) { Store.set(this.KEY, list); Stats.update(); },
  statusOf(qty, min) {
    if (qty === 0)     return ['critical','Critical'];
    if (qty <= min)    return ['low','Low Stock'];
    return ['ok','OK'];
  },
  render() {
    const list = this.all();
    const tbody = document.getElementById('inv-tbody');
    if (!list.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No inventory items.</td></tr>`; return;
    }
    tbody.innerHTML = list.map(i => {
      const [sc, sl] = this.statusOf(i.quantity, i.minStock);
      return `<tr>
        <td><strong>${esc(i.item)}</strong></td>
        <td>${esc(i.category)}</td>
        <td>${i.quantity} ${esc(i.unit||'')}</td>
        <td>${i.minStock}</td>
        <td><span class="status-badge status-${sc}">${sl}</span></td>
        <td class="action-btns">
          <button class="act-btn act-edit"   onclick="Inventory.openForm(Inventory.all().find(x=>x.id===${i.id}))"><i class="fa-solid fa-pen"></i></button>
          <button class="act-btn act-approve" onclick="Inventory.restock(${i.id})"><i class="fa-solid fa-plus"></i> Restock</button>
          <button class="act-btn act-delete" onclick="Inventory.delete(${i.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  },
  openForm(item = null) {
    const isEdit = !!item;
    Modal.open(isEdit ? 'Edit Item' : 'Add Inventory Item',
      `<div class="form-group"><label>Item Name</label><input id="if-item" value="${esc(item?.item||'')}" placeholder="Rice (50kg bags)" /></div>
       <div class="form-row">
         <div class="form-group"><label>Category</label>
           <select id="if-cat">
             ${['Food','Education','Medical','Bedding','Clothing','Hygiene','Other'].map(c=>`<option ${(item?.category||'')===c?'selected':''}>${c}</option>`).join('')}
           </select>
         </div>
         <div class="form-group"><label>Unit</label><input id="if-unit" value="${esc(item?.unit||'pcs')}" placeholder="pcs, kg, boxesâ€¦" /></div>
       </div>
       <div class="form-row">
         <div class="form-group"><label>Quantity</label><input id="if-qty" type="number" min="0" value="${item?.quantity??''}" placeholder="0" /></div>
         <div class="form-group"><label>Min Stock</label><input id="if-min" type="number" min="0" value="${item?.minStock??''}" placeholder="5" /></div>
       </div>`,
      `<button class="btn-cancel" onclick="Modal.close()">Cancel</button>
       <button class="btn-primary" onclick="Inventory.save_form(${item?.id||'null'})">
         <i class="fa-solid fa-floppy-disk"></i> ${isEdit?'Update':'Add'}
       </button>`
    );
  },
  save_form(id) {
    const name = document.getElementById('if-item').value.trim();
    if (!name) { Toast.show('Item name required.','error'); return; }
    const list = this.all();
    const data = {
      item: name,
      category: document.getElementById('if-cat').value,
      unit:     document.getElementById('if-unit').value.trim(),
      quantity: parseInt(document.getElementById('if-qty').value) || 0,
      minStock: parseInt(document.getElementById('if-min').value) || 0
    };
    if (id) {
      const i = list.findIndex(x => x.id === id);
      if (i > -1) list[i] = { ...list[i], ...data };
      Toast.show('Item updated.','success');
    } else {
      data.id = Store.nextId(list); list.push(data);
      Activity.add('fa-boxes-stacked', `Inventory item added: ${name}`);
      Toast.show('Item added.','success');
    }
    this.save(list); Modal.close(); this.render();
    const [sc] = this.statusOf(data.quantity, data.minStock);
    if (sc !== 'ok') {
      Notifs.add('fa-triangle-exclamation', `Low stock alert: ${name}`);
      Toast.show(`Low stock alert: ${name}`,'warning');
    }
  },
  restock(id) {
    const qty = prompt('Enter quantity to add:');
    if (qty === null) return;
    const n = parseInt(qty);
    if (isNaN(n) || n <= 0) { Toast.show('Enter a positive number.','error'); return; }
    const list = this.all();
    const item = list.find(i => i.id === id);
    if (item) { item.quantity += n; this.save(list); this.render(); Toast.show(`Restocked ${item.item} (+${n}).`,'success'); }
  },
  delete(id) {
    if (!confirm('Delete this item?')) return;
    const list = this.all().filter(i => i.id !== id);
    this.save(list); this.render();
    Toast.show('Item deleted.','success');
  }
};

/* ===== SPONSORSHIPS (live subscribers from DB) ===== */
const Sponsorships = {
  _rows: [],
  _ready: false,

  init() {
    this.render();
    this.loadFromDB();
    document.getElementById('refresh-sponsors-btn').addEventListener('click', () => this.loadFromDB());
    document.getElementById('spon-search').addEventListener('input', () => this.render());
  },

  async loadFromDB() {
    try {
      Loading.show();
      const { data, error } = await DB
        .from('users')
        .select('id, display_name, email, subscription_amount, subscription_day, last_subscription_date')
        .eq('is_subscriber', 'Y')
        .order('display_name', { ascending: true });
      if (error) throw error;
      this._rows = data || [];
    } catch (err) {
      console.error('Sponsorships DB error:', err);
      Toast.show('Could not load subscribers: ' + err.message, 'error');
    } finally {
      Loading.hide();
    }
    this._ready = true;
    this.render();
    Stats.update();
  },

  count() { return this._rows.length; },

  render() {
    const tbody = document.getElementById('spon-tbody');
    if (!this._ready) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7" style="text-align:center;padding:32px;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px"></i>Loading subscribersâ€¦</td></tr>`;
      return;
    }
    const q = (document.getElementById('spon-search')?.value || '').toLowerCase();
    const list = this._rows.filter(s =>
      !q || `${s.display_name} ${s.email}`.toLowerCase().includes(q)
    );
    if (!list.length) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No subscribed sponsors found.</td></tr>`; return;
    }
    tbody.innerHTML = list.map(s => {
      const amount = parseFloat(s.subscription_amount || 0);
      const lastDate = s.last_subscription_date
        ? new Date(s.last_subscription_date).toLocaleDateString()
        : 'N/A';
      const billingDay = s.subscription_day || 1;
      return `<tr>
        <td><strong>${esc(s.display_name || 'N/A')}</strong></td>
        <td>${esc(s.email)}</td>
        <td><strong>R${amount.toFixed(2)}/mo</strong></td>
        <td>Day ${billingDay}</td>
        <td>${lastDate}</td>
        <td><span class="status-badge status-active">Active</span></td>
        <td class="action-btns">
          <button class="act-btn act-view" onclick="Sponsorships.view('${s.id}')"><i class="fa-solid fa-eye"></i> View</button>
          <button class="act-btn act-email" onclick="Sponsorships.remind('${s.id}')"><i class="fa-solid fa-envelope"></i> Email</button>
        </td>
      </tr>`;
    }).join('');
  },

  view(id) {
    const s = this._rows.find(x => x.id === id);
    if (!s) return;
    const amount = parseFloat(s.subscription_amount || 0);
    Modal.open('Subscriber Details',
      `<div class="detail-grid">
        <div class="detail-item"><span class="label">Name</span><span class="value">${esc(s.display_name || 'N/A')}</span></div>
        <div class="detail-item"><span class="label">Email</span><span class="value">${esc(s.email)}</span></div>
        <div class="detail-item"><span class="label">Monthly Amount</span><span class="value"><strong>R${amount.toFixed(2)}</strong></span></div>
        <div class="detail-item"><span class="label">Billing Day</span><span class="value">Day ${s.subscription_day || 1} of each month</span></div>
        <div class="detail-item"><span class="label">Last Payment</span><span class="value">${s.last_subscription_date ? new Date(s.last_subscription_date).toLocaleString() : 'Not yet processed'}</span></div>
        <div class="detail-item"><span class="label">Status</span><span class="value"><span class="status-badge status-active">Active Subscriber</span></span></div>
       </div>`, '');
  },

  async remind(id) {
    const s = this._rows.find(x => x.id === id);
    if (!s) return;
    try {
      await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templates.sponsorFailed, {
        to_email:      s.email,
        to_name:       s.display_name || 'Sponsor',
        amount:        `R${parseFloat(s.subscription_amount || 0).toFixed(2)}`,
        due_date:      s.subscription_day ? `Day ${s.subscription_day} of each month` : 'N/A',
        org_name:      'Hopeful Hearts Orphanage',
        contact_email: 'hello@hopefulhearts.org'
      });
      Toast.show(`Email sent to ${s.display_name || s.email}.`, 'success');
      Activity.add('fa-envelope', `Subscription email sent to ${s.display_name || s.email}.`);
    } catch (err) {
      console.error('EmailJS remind error:', err);
      Toast.show('Could not send email: ' + (err.text || err.message), 'error');
    }
  },

  // kept for backward compat (Stats, seedDemo)
  all() { return this._rows; },
  checkDuePayments() {}
};

/* ===== REPORTS / PDF EXPORT ===== */
const Reports = {
  export(type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.setTextColor(249, 115, 22);
    doc.text('Hopeful Hearts Orphanage', 14, 18);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);

    const titles = {
      donations:    'Monthly Donations Report',
      volunteers:   'Volunteer Applications Report',
      events:       'Event Attendance Report',
      sponsorships: 'Sponsorship Report',
      inventory:    'Inventory Report'
    };
    doc.text(titles[type] || 'Report', 14, 28);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${now}`, 14, 34);

    let y = 44;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const addRow = (cols, isBold = false) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (isBold) doc.setFont(undefined,'bold');
      cols.forEach((c, i) => doc.text(String(c ?? ''), 14 + i * 42, y));
      if (isBold) doc.setFont(undefined,'normal');
      y += 8;
    };

    const drawLine = () => { doc.setDrawColor(226,232,240); doc.line(14, y-2, 196, y-2); };

    if (type === 'donations') {
      addRow(['Donor','Email','Amount','Date','Status'], true); drawLine();
      Store.get('hh_donations',[]).forEach(d =>
        addRow([d.name, d.email, 'R'+parseFloat(d.amount||0).toFixed(2),
                d.date ? new Date(d.date).toLocaleDateString() : '', d.status]));
    } else if (type === 'volunteers') {
      addRow(['Name','Email','Skills','Availability','Status'], true); drawLine();
      Store.get('hh_volunteers',[]).forEach(v =>
        addRow([v.name, v.email, v.skills, v.availability, v.status]));
    } else if (type === 'events') {
      addRow(['Event','Date','Location','Max','Registered'], true); drawLine();
      Store.get('hh_events',[]).forEach(e =>
        addRow([e.name, e.date ? new Date(e.date).toLocaleDateString() : '',
                e.location, e.maxAttendees, e.registered||0]));
    } else if (type === 'sponsorships') {
      addRow(['Child','Sponsor','Amount/mo','Status','Next Payment'], true); drawLine();
      Store.get('hh_sponsorships',[]).forEach(s =>
        addRow([s.child, s.sponsor, '$'+parseFloat(s.amount||0).toFixed(2),
                s.paymentStatus, s.nextPayment ? new Date(s.nextPayment).toLocaleDateString() : '']));
    } else if (type === 'inventory') {
      addRow(['Item','Category','Qty','Min Stock','Status'], true); drawLine();
      Store.get('hh_inventory',[]).forEach(i => {
        const st = i.quantity === 0 ? 'Critical' : i.quantity <= i.minStock ? 'Low' : 'OK';
        addRow([i.item, i.category, `${i.quantity} ${i.unit||''}`, i.minStock, st]);
      });
    }

    doc.save(`hopeful-hearts-${type}-${now.replace(/\//g,'-')}.pdf`);
    Toast.show('PDF exported successfully.','success');
    Activity.add('fa-file-pdf', `${titles[type]} exported.`);
  }
};

/* ===== UTILITY ===== */
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  Modal.init();
  Theme.init();
  Sidebar.init();
  Nav.init();

  // Notifications toggle
  document.getElementById('notif-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('notif-dropdown');
    const hidden = dd.hasAttribute('hidden');
    if (hidden) { dd.removeAttribute('hidden'); Notifs.render(); }
    else dd.setAttribute('hidden', '');
  });
  document.getElementById('clear-notifs').addEventListener('click', () => {
    Notifs.clear();
    Toast.show('Notifications cleared.','info');
  });
  document.addEventListener('click', (e) => {
    const dd = document.getElementById('notif-dropdown');
    if (!document.getElementById('notif-btn').contains(e.target)) {
      dd.setAttribute('hidden','');
    }
  });

  // Init all modules
  Volunteers.init();
  Donations.init();
  Messages.init();
  Events.init();
  Inventory.init();
  Sponsorships.init();
  Sponsorships.checkDuePayments();

  // Dashboard stats + charts + activity
  Stats.update();
  Charts.init();
  Activity.render();
  Notifs.updateDot();
  Notifs.render();

  // Real-time cross-tab alerts for support tickets
  window.addEventListener('storage', (e) => {
    if (e.key === 'hh_messages') {
      Messages.render();
      Stats.update();
      
      const list = JSON.parse(e.newValue || '[]');
      const oldList = JSON.parse(e.oldValue || '[]');
      if (list.length > oldList.length) {
        const newMsg = list[list.length - 1];
        
        // Show Toast
        Toast.show(`New Ticket: "${newMsg.subject}" from ${newMsg.name}`, 'info');
        
        // Refresh dropdown notifications & activity
        Activity.render();
        Notifs.updateDot();
        Notifs.render();
        
        // Play audio alert
        playNotificationSound();
      }
    }
  });

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn("Audio chime failed:", err);
    }
  }

  // Seed demo data only if NO local non-donation data exists
  // (Donations now come from DB so we skip seeding those)
  const hasAnyData = Store.get('hh_volunteers',[]).length ||
                     Store.get('hh_messages',[]).length;
  if (!hasAnyData) seedDemo();
});

/* ===== DEMO DATA ===== */
function seedDemo() {
  const today = new Date();
  const date = (offset = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString();
  };

  // Note: donations are now fetched live from Supabase N/A no local seed needed

  Store.set('hh_volunteers', [
    { id:1, name:'Sara Ahmed',    email:'sara@email.com',   phone:'555-0101', skills:'Teaching, Cooking',    availability:'Weekends',  status:'Approved', date:date(-30) },
    { id:2, name:'James Obi',     email:'james@email.com',  phone:'555-0102', skills:'Medical, First Aid',   availability:'Weekdays',  status:'Pending',  date:date(-3)  },
    { id:3, name:'Linda Park',    email:'linda@email.com',  phone:'555-0103', skills:'Music, Art',           availability:'Saturdays', status:'Approved', date:date(-15) },
    { id:4, name:'Tom Richards',  email:'tom@email.com',    phone:'555-0104', skills:'Sports, Mentoring',    availability:'Flexible',  status:'Rejected', date:date(-60) }
  ]);

  Store.set('hh_messages', [
    { id:1, name:'Maria Santos',  email:'maria@email.com', subject:'Volunteer inquiry', message:'I would love to help at your orphanage.', date:date(-2), status:'unread' },
    { id:2, name:'Peter Kim',     email:'peter@email.com', subject:'Donation question', message:'Can I donate household items?', date:date(-5), status:'read'   },
    { id:3, name:'Grace Nwosu',   email:'grace@email.com', subject:'Partnership',       message:'Our company would like to partner with you.', date:date(-1), status:'unread' }
  ]);

  Store.set('hh_events', [
    { id:1, name:'Christmas Celebration', description:'Annual Christmas party for the children.', date:date(20).slice(0,10), location:'Main Hall',    maxAttendees:150, registered:42 },
    { id:2, name:'Health Screening Day',  description:'Free medical check-ups for all children.', date:date(7).slice(0,10),  location:'Clinic',       maxAttendees:60,  registered:60 },
    { id:3, name:'Fundraising Gala',      description:'Evening gala for major donors.',            date:date(35).slice(0,10), location:'Grand Hotel',  maxAttendees:200, registered:87 }
  ]);

  // Activity log
  Activity.add('fa-seedling','Dashboard initialized with demo data.');
  Notifs.add('fa-bell','Welcome to Hopeful Hearts Admin Dashboard!');

  // Re-render everything
  Stats.update();
  Charts.init();
  Volunteers.render();
  Donations.render();
  Messages.render();
  Events.render();
  Inventory.render();
  Activity.render();
  Notifs.updateDot();
}

/* ===== EXPOSE TO WINDOW (required for inline onclick in ES module context) ===== */
window.Volunteers   = Volunteers;
window.Donations    = Donations;
window.Messages     = Messages;
window.Events       = Events;
window.Inventory    = Inventory;
window.Sponsorships = Sponsorships;
window.Reports      = Reports;
window.Modal        = Modal;
