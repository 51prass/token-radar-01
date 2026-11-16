// Token Radar dashboard — renders window.RADAR, no network, no fetch.
// Views: #/ (board), #/protocol/<slug> (detail), #/live (live tokens),
// #/model (how the model works). Board filters live in the hash query:
// #/?category=Dexs&chain=Ethereum&sort=growth

(function () {
  'use strict';
  var D = window.RADAR;
  if (!D) { document.body.textContent = 'No radar data.'; return; }

  var watch = {};
  D.rows.forEach(function (r) { watch[r.slug] = true; });

  function $(id) { return document.getElementById(id); }

  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2).replace(/0$/, '') + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(v) {
    if (v === null || v === undefined) return '—';
    return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  }
  function ageText(days) {
    if (days === null || days === undefined) return '—';
    if (days < 365) return days + 'd';
    var y = Math.floor(days / 365), m = Math.floor((days % 365) / 30);
    return y + 'y' + (m > 0 ? ' ' + m + 'm' : '');
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---- header, stats, filters -------------------------------------------
  $('meta').textContent = 'Snapshot as of ' + D.as_of + ' · ' + D.watchlist_size +
    ' protocols on the watchlist · ' + D.board_size + ' rows ranked · Model ' + D.model_version;
  $('asof').textContent = D.as_of;
  $('asof2').textContent = D.as_of;
  $('modelv').textContent = D.model_version;

  var top = D.rows[0];
  var med = D.rows[Math.floor(D.rows.length / 2)];
  var cats = {};
  D.rows.forEach(function (r) { if (r.category) cats[r.category] = 1; });
  $('stats').innerHTML =
    '<div class="stat"><b>' + D.watchlist_size + '</b><span>on the watchlist</span></div>' +
    '<div class="stat"><b>' + D.board_size + '</b><span>rows ranked</span></div>' +
    '<div class="stat"><b>' + D.early_size + '</b><span>early finds below the floor</span></div>' +
    '<div class="stat"><b>' + money(top.implied_value_usd) + '</b><span>top implied value</span></div>' +
    '<div class="stat"><b>' + money(med.implied_value_usd) + '</b><span>median implied value</span></div>' +
    '<div class="stat"><b>' + Object.keys(cats).length + '</b><span>categories on the board</span></div>';

  var catSel = $('cat'), chainSel = $('chain');
  catSel.innerHTML = '<option value="">All categories</option>' +
    Object.keys(cats).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
  var chains = {};
  D.rows.forEach(function (r) { r.chains.forEach(function (c) { chains[c] = 1; }); });
  chainSel.innerHTML = '<option value="">All chains</option>' +
    Object.keys(chains).sort().map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');

  // ---- board --------------------------------------------------------------
  var state = { q: '', cat: '', chain: '', sort: 'value' };
  var maxImplied = top.implied_value_usd;

  function filtered() {
    var q = state.q.toLowerCase();
    var list = D.rows.filter(function (r) {
      if (state.cat && r.category !== state.cat) return false;
      if (state.chain && r.chains.indexOf(state.chain) < 0) return false;
      if (q && (r.name.toLowerCase().indexOf(q) < 0 && r.slug.indexOf(q) < 0)) return false;
      return true;
    });
    if (state.sort === 'tvl') list = list.slice().sort(function (a, b) { return b.tvl_usd - a.tvl_usd; });
    else if (state.sort === 'growth') list = list.slice().sort(function (a, b) { return (b.change_7d === null ? -1e9 : b.change_7d) - (a.change_7d === null ? -1e9 : a.change_7d); });
    else if (state.sort === 'age') list = list.slice().sort(function (a, b) { return (b.age_days === null ? -1 : b.age_days) - (a.age_days === null ? -1 : a.age_days); });
    return list;
  }

  function renderBoard() {
    var list = filtered();
    var html = list.map(function (r) {
      var cls = r.change_7d === null ? '' : (r.change_7d >= 0 ? 'up' : 'down');
      var badge = watch[r.slug] ? '<span class="badge">watchlist</span>' : '';
      var w = Math.max(2, Math.round((r.implied_value_usd / maxImplied) * 100));
      return '<tr data-slug="' + esc(r.slug) + '">' +
        '<td class="rank">' + r.rank + '</td>' +
        '<td><span class="name">' + esc(r.name) + '</span>' + badge + '</td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.slice(0, 2).join(', ') || '—') + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + cls + '">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + ageText(r.age_days) + '</td>' +
        '<td class="num"><b>' + money(r.implied_value_usd) + '</b><div class="bar"><i style="width:' + w + '%"></i></div></td>' +
        '</tr>';
    }).join('');
    $('rows').innerHTML = html;
    $('empty').hidden = list.length > 0;
  }

  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-slug]');
    if (tr) location.hash = '#/protocol/' + tr.getAttribute('data-slug');
  });

  // ---- detail ---------------------------------------------------------------
  function renderDetail(slug) {
    var r = null;
    for (var i = 0; i < D.rows.length; i++) if (D.rows[i].slug === slug) { r = D.rows[i]; break; }
    var box = $('detail');
    if (!r) { box.hidden = true; return; }
    var m = r;
    box.innerHTML =
      '<h2>#' + r.rank + ' — ' + esc(r.name) + '</h2>' +
      '<p class="sub">' + esc(r.category || 'Uncategorised') + ' · ' + esc(r.chains.join(', ') || 'no chain listed') +
      ' · tracked since ' + esc(r.listed_at || 'unknown') + (watch[r.slug] ? ' · <span class="badge">on the watchlist</span>' : '') + '</p>' +
      '<div class="kv">' +
      '<div><b>' + money(r.implied_value_usd) + '</b><span>implied value</span></div>' +
      '<div><b>' + money(r.tvl_usd) + '</b><span>TVL</span></div>' +
      '<div><b class="' + (r.change_7d === null ? '' : (r.change_7d >= 0 ? 'up' : 'down')) + '">' + pct(r.change_7d) + '</b><span>TVL change, 7 days</span></div>' +
      '<div><b>' + ageText(r.age_days) + '</b><span>tracked, no token</span></div>' +
      '</div>' +
      '<h3>How the model scores it</h3>' +
      '<ul class="factors">' +
      '<li><b>size ×' + m.size_multiple + '</b> — TVL ' + money(r.tvl_usd) + ' buys a multiple of ' + m.size_multiple + ': the bigger the protocol, the lower the multiple.</li>' +
      '<li><b>category ×' + m.category_multiple + '</b> — ' + esc(r.category || 'uncategorised') + ' revenue quality.</li>' +
      '<li><b>growth ×' + m.growth_multiplier + '</b> — 7-day TVL change ' + pct(r.change_7d) + '.</li>' +
      '<li><b>maturity ×' + m.maturity_multiplier + '</b> — ' + ageText(r.age_days) + ' tracked with no token.</li>' +
      '<li><b>breadth ×' + m.breadth_multiplier + '</b> — live on ' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + '.</li>' +
      '</ul>' +
      '<h3>How to farm it</h3>' +
      '<ol class="steps">' + r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<p class="note">' + esc(r.name) + ' records no token in DefiLlama\u2019s data as of ' + D.as_of +
      ' — that is not proof it has none. Never pay anyone to claim an airdrop for you.</p>';
    box.hidden = false;
    box.scrollIntoView({ block: 'start' });
  }

  // ---- live view ------------------------------------------------------------
  $('live-rows').innerHTML = D.live.map(function (p) {
    var cls = p.change_7d === null ? '' : (p.change_7d >= 0 ? 'up' : 'down');
    return '<tr><td><span class="name">' + esc(p.name) + '</span></td>' +
      '<td>' + esc(p.category || '—') + '</td>' +
      '<td>' + esc(p.chains.slice(0, 2).join(', ') || '—') + '</td>' +
      '<td class="num">' + money(p.tvl_usd) + '</td>' +
      '<td class="num"><b>' + (p.mcap_usd === null ? '—' : money(p.mcap_usd)) + '</b></td>' +
      '<td class="num ' + cls + '">' + pct(p.change_7d) + '</td></tr>';
  }).join('');

  // ---- routing --------------------------------------------------------------
  var tabs = document.querySelectorAll('#tabs button');
  function setTab(view) {
    tabs.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === view); });
    $('controls').style.display = view === 'board' ? '' : 'none';
    $('stats').style.display = view === 'board' ? '' : 'none';
    $('board-wrap').hidden = view !== 'board';
    $('live-wrap').hidden = view !== 'live';
    $('model-wrap').hidden = view !== 'model';
    if (view !== 'board') $('detail').hidden = true;
  }
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      location.hash = '#/' + (b.getAttribute('data-view') === 'board' ? '' : b.getAttribute('data-view'));
    });
  });

  function route() {
    var h = location.hash || '#/';
    var path = h.slice(2);
    if (path.charAt(0) === '/') path = path.slice(1);
    var qi = path.indexOf('?');
    var query = {};
    if (qi >= 0) {
      path.slice(qi + 1).split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv[0]) query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
      path = path.slice(0, qi);
    }
    if (path.indexOf('protocol/') === 0) {
      setTab('board');
      renderBoard();
      renderDetail(path.slice('protocol/'.length));
      return;
    }
    if (path === 'live') { setTab('live'); return; }
    if (path === 'model') { setTab('model'); return; }
    setTab('board');
    $('detail').hidden = true;
    window.scrollTo(0, 0);
    var hasCat = false;
    for (var ci = 0; ci < catSel.options.length; ci++) if (catSel.options[ci].value === query.category) hasCat = true;
    if (query.category && hasCat) {
      state.cat = query.category; catSel.value = query.category;
    }
    if (query.chain) { state.chain = query.chain; chainSel.value = query.chain; }
    if (query.sort) { state.sort = query.sort; $('sort').value = query.sort; }
    if (query.q) { state.q = query.q; $('q').value = query.q; }
    renderBoard();
  }

  $('q').addEventListener('input', function () { state.q = $('q').value; renderBoard(); });
  catSel.addEventListener('change', function () { state.cat = catSel.value; renderBoard(); });
  chainSel.addEventListener('change', function () { state.chain = chainSel.value; renderBoard(); });
  $('sort').addEventListener('change', function () { state.sort = $('sort').value; renderBoard(); });
  window.addEventListener('hashchange', route);
  route();
})();
