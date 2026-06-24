const starter = [
  { id:'g-1', category:'Gaube', work:'Gaube eindecken / Anschlüsse herstellen', material:'Anschlussblech, Unterspannbahn, Dachziegel, Holz', unit:'Stk', qty:1, materialPrice:0, laborPrice:0, note:'Preis je Gaube' },
  { id:'s-1', category:'Schornstein', work:'Schornsteineinfassung / Kaminanschluss', material:'Alu-/Bleianschlussband, Blech, Dichtmaterial', unit:'Stk', qty:1, materialPrice:0, laborPrice:0, note:'inkl. Zuschnitt' },
  { id:'o-1', category:'Ortgang', work:'Erweiterung Ortgang', material:'Ortgangziegel, Ortgangbrett, Unterkonstruktion, Schrauben', unit:'lfm', qty:1, materialPrice:0, laborPrice:0, note:'z. B. 20 cm' },
  { id:'d-1', category:'Dachüberstand', work:'Erweiterung Dachüberstand', material:'Sparrenverlängerung, Schalung, Dachkastenmaterial', unit:'lfm', qty:1, materialPrice:0, laborPrice:0, note:'z. B. 30 cm' }
];

const defaultCategories = ['Gaube','Schornstein','Ortgang','Dachüberstand','Fassade','Klempner','Sonstiges'];

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

async function ensureSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS prices_state (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS prices_history (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      summary TEXT NOT NULL,
      before_payload TEXT NOT NULL,
      after_payload TEXT NOT NULL
    )
  `).run();
}

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Green Lion Energy · SUB-Preisportal</title>
<style>
body{margin:0;font-family:Arial,sans-serif;background:#f5faf6;color:#102018}
.hero{background:linear-gradient(135deg,#0d2418,#2f6b47);color:white;padding:38px 18px 78px}
.wrap{max-width:1300px;margin:auto}
.badge{display:inline-block;border:1px solid #9fc36c;border-radius:999px;padding:8px 14px;font-weight:700}
.hero h1{font-size:48px;line-height:1.05;margin:22px 0 12px}
.card{background:white;margin:-40px auto 30px;padding:24px;border-radius:26px;box-shadow:0 20px 60px #0002;max-width:1300px}
.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
input,select,textarea{padding:12px;border:1px solid #dfe9e2;border-radius:12px;font:inherit;box-sizing:border-box}
button{border:0;border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer}
.primary{background:#2f6b47;color:white}
.ghost{background:#eef7f0;color:#102018}
.danger{background:#fff0f0;color:#9b1c1c}
.dark{background:#102018;color:white}
.tablewrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
table{width:100%;min-width:1180px;border-collapse:collapse;background:white}
th,td{border-bottom:1px solid #e4eee7;padding:10px;text-align:left;vertical-align:top}
th{color:#66766b;font-size:12px;text-transform:uppercase}
.money{font-weight:700;color:#2f6b47}
.status{margin-top:14px;color:#66766b;font-size:14px}
td input,td select{width:100%}
.modal{display:none;position:fixed;inset:0;background:#0008;z-index:99;padding:20px;overflow:auto}
.modalbox{background:white;max-width:1000px;margin:30px auto;padding:22px;border-radius:22px}
.histitem{border:1px solid #e4eee7;border-radius:14px;padding:14px;margin:10px 0;background:#fbfffc}
.small{font-size:13px;color:#66766b}
pre{white-space:pre-wrap;background:#f3f7f4;padding:12px;border-radius:12px;overflow:auto}
@media(max-width:900px){
.hero{padding:26px 14px 70px}
.hero h1{font-size:34px}
.card{margin:-35px 10px 24px;padding:15px;border-radius:20px}
.toolbar{display:grid;grid-template-columns:1fr;gap:10px}
.toolbar input,.toolbar select,.toolbar button{width:100%}
table{min-width:1100px}
}
</style>
</head>
<body>

<div class="hero">
  <div class="wrap">
    <span class="badge">Green Lion Energy · SUB-Preisportal</span>
    <h1>Leistungen und Preise sauber pflegen.</h1>
    <p>Hoch Plus Hannover GmbH kann Arbeiten anlegen, Kategorien auswählen und Änderungen nachvollziehbar speichern.</p>
  </div>
</div>

<div class="card">
  <h2>Hoch Plus Hannover GmbH</h2>

  <div class="toolbar">
    <input id="search" placeholder="Suchen...">
    <select id="categoryFilter"><option value="">Alle Kategorien</option></select>
    <input id="newCategory" placeholder="Neue Kategorie">
    <button class="ghost" onclick="addCategory()">+ Kategorie</button>
    <button class="ghost" onclick="addRow()">+ Neue Arbeit</button>
    <button class="dark" onclick="openHistory()">Historie</button>
    <button class="primary" onclick="saveAll()">Speichern & aktualisieren</button>
  </div>

  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>Kategorie</th>
          <th>Leistung</th>
          <th>Material</th>
          <th>EH</th>
          <th>Menge</th>
          <th>Material €/EH</th>
          <th>Arbeit €/EH</th>
          <th>Gesamt</th>
          <th>Hinweis</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
  </div>

  <div class="status" id="status">Lade Daten...</div>
</div>

<div class="modal" id="historyModal">
  <div class="modalbox">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
      <h2>Änderungshistorie</h2>
      <button class="danger" onclick="closeHistory()">Schließen</button>
    </div>
    <div id="historyList">Lade Historie...</div>
  </div>
</div>

<script>
let items = [];
let categories = [];
let lastLoadedItems = [];

const fmt = n => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(+n || 0);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

function normalizeItem(x){
  return {
    id: x.id || uid(),
    category: x.category || 'Sonstiges',
    work: x.work || '',
    material: x.material || '',
    unit: x.unit || 'Stk',
    qty: +x.qty || 0,
    materialPrice: +x.materialPrice || 0,
    laborPrice: +x.laborPrice || 0,
    note: x.note || ''
  };
}

async function load(){
  const r = await fetch('/api/prices');
  const d = await r.json();

  items = (d.items || []).map(normalizeItem);
  lastLoadedItems = JSON.parse(JSON.stringify(items));

  categories = Array.from(new Set([...(d.categories || []), ...items.map(x=>x.category), ...${JSON.stringify(defaultCategories)}])).filter(Boolean);

  status.textContent = 'Letzte Speicherung: ' + (d.updatedAt ? new Date(d.updatedAt).toLocaleString('de-DE') : 'noch keine');
  renderCategoryFilter();
  render();
}

function renderCategoryFilter(){
  categoryFilter.innerHTML = '<option value="">Alle Kategorien</option>' + categories.map(c => '<option>'+esc(c)+'</option>').join('');
}

function render(){
  const q = search.value.toLowerCase();
  const cf = categoryFilter.value;

  rows.innerHTML = items
    .filter(x => !cf || x.category === cf)
    .filter(x => JSON.stringify(x).toLowerCase().includes(q))
    .map((x,i) => {
      const total = (+x.qty || 0) * ((+x.materialPrice || 0) + (+x.laborPrice || 0));
      return '<tr>' +
        cell('Kategorie', categorySelect(i,x.category)) +
        cell('Leistung', inp(i,'work',x.work)) +
        cell('Material', inp(i,'material',x.material)) +
        cell('EH', inp(i,'unit',x.unit)) +
        cell('Menge', num(i,'qty',x.qty)) +
        cell('Material €/EH', num(i,'materialPrice',x.materialPrice)) +
        cell('Arbeit €/EH', num(i,'laborPrice',x.laborPrice)) +
        cell('Gesamt','<span class="money">'+fmt(total)+'</span>') +
        cell('Hinweis', inp(i,'note',x.note)) +
        cell('', '<button class="danger" onclick="delRow('+i+')">Löschen</button>') +
      '</tr>';
    }).join('');
}

function cell(label,value){ return '<td data-label="'+label+'">'+value+'</td>'; }
function esc(v){ return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

function inp(i,k,v){
  return '<input value="'+esc(v)+'" onchange="items['+i+'].'+k+'=this.value;render()">';
}

function num(i,k,v){
  return '<input type="number" step="0.01" value="'+(+v || 0)+'" onchange="items['+i+'].'+k+'=+this.value||0;render()">';
}

function categorySelect(i,v){
  return '<select onchange="items['+i+'].category=this.value;render()">' +
    categories.map(c => '<option '+(c===v?'selected':'')+'>'+esc(c)+'</option>').join('') +
  '</select>';
}

function addCategory(){
  const c = newCategory.value.trim();
  if(!c) return;
  if(!categories.includes(c)) categories.push(c);
  newCategory.value = '';
  renderCategoryFilter();
  render();
}

function addRow(){
  if(!categories.length) categories = ${JSON.stringify(defaultCategories)};
  items.unshift({
    id:uid(),
    category:categories[0] || 'Sonstiges',
    work:'',
    material:'',
    unit:'Stk',
    qty:1,
    materialPrice:0,
    laborPrice:0,
    note:''
  });
  render();
}

function delRow(i){
  if(confirm('Position wirklich löschen?')){
    items.splice(i,1);
    render();
  }
}

function diffSummary(before, after){
  const bMap = Object.fromEntries(before.map(x => [x.id, x]));
  const aMap = Object.fromEntries(after.map(x => [x.id, x]));
  const changes = [];

  for(const id in aMap){
    if(!bMap[id]){
      changes.push('Neu: ' + (aMap[id].work || aMap[id].category || id));
      continue;
    }

    const fields = ['category','work','material','unit','qty','materialPrice','laborPrice','note'];
    for(const f of fields){
      if(String(bMap[id][f] ?? '') !== String(aMap[id][f] ?? '')){
        changes.push((aMap[id].work || bMap[id].work || id) + ': ' + f + ' von "' + (bMap[id][f] ?? '') + '" zu "' + (aMap[id][f] ?? '') + '"');
      }
    }
  }

  for(const id in bMap){
    if(!aMap[id]){
      changes.push('Gelöscht: ' + (bMap[id].work || bMap[id].category || id));
    }
  }

  return changes.length ? changes.join('\\n') : 'Keine sichtbaren Änderungen';
}

async function saveAll(){
  status.textContent = 'Speichere...';

  const summary = diffSummary(lastLoadedItems, items);

  const r = await fetch('/api/prices',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      items,
      categories,
      before:lastLoadedItems,
      summary
    })
  });

  if(!r.ok){
    status.textContent = 'Fehler beim Speichern';
    return;
  }

  location.reload();
}

async function openHistory(){
  historyModal.style.display = 'block';
  historyList.textContent = 'Lade Historie...';

  const r = await fetch('/api/history');
  const d = await r.json();

  if(!d.history || !d.history.length){
    historyList.textContent = 'Noch keine Historie vorhanden.';
    return;
  }

  historyList.innerHTML = d.history.map(h => 
    '<div class="histitem">' +
      '<b>'+new Date(h.created_at).toLocaleString('de-DE')+'</b>' +
      '<pre>'+esc(h.summary)+'</pre>' +
    '</div>'
  ).join('');
}

function closeHistory(){
  historyModal.style.display = 'none';
}

search.oninput = render;
categoryFilter.onchange = render;
load();
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(html, {
        headers: { 'content-type': 'text/html; charset=utf-8' }
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ error:'D1 Binding DB fehlt' }), { status:500, headers });
    }

    if (url.pathname === '/api/prices' && request.method === 'GET') {
      await ensureSchema(env.DB);

      const row = await env.DB.prepare(
        'SELECT payload, updated_at FROM prices_state WHERE id=?'
      ).bind('current').first();

      if (!row) {
        return new Response(JSON.stringify({
          updatedAt:null,
          items:starter,
          categories:defaultCategories
        }), { status:200, headers });
      }

      const payload = JSON.parse(row.payload);

      return new Response(JSON.stringify({
        updatedAt: row.updated_at,
        items: payload.items || payload,
        categories: payload.categories || defaultCategories
      }), { status:200, headers });
    }

    if (url.pathname === '/api/prices' && request.method === 'POST') {
      await ensureSchema(env.DB);

      const body = await request.json();

      if (!Array.isArray(body.items)) {
        return new Response(JSON.stringify({ error:'items missing' }), { status:400, headers });
      }

      const oldRow = await env.DB.prepare(
        'SELECT payload FROM prices_state WHERE id=?'
      ).bind('current').first();

      .bind(Date.now().toString(), updatedAt, body.summary || 'Änderung gespeichert', beforePayload, payload).run();tCategories});
      const updatedAt = new Date().toISOString();
      const payload = JSON.stringify({
        items: body.items,
        categories: body.categories || defaultCategories
      });

      await env.DB.prepare(
        'INSERT INTO prices_state (id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at'
      ).bind('current', payload, updatedAt).run();

      await env.DB.prepare(
        'INSERT INTO prices_history (id,created_at,summary,before_payload,after_payload) VALUES (?,?,?,?,?)'
      ).bind(uid(), updatedAt, body.summary || 'Änderung gespeichert', beforePayload, payload).run();

      return new Response(JSON.stringify({
        updatedAt,
        items:body.items,
        categories:body.categories || defaultCategories
      }), { status:200, headers });
    }

    if (url.pathname === '/api/history' && request.method === 'GET') {
      await ensureSchema(env.DB);

      const result = await env.DB.prepare(
        'SELECT id,created_at,summary FROM prices_history ORDER BY created_at DESC LIMIT 100'
      ).all();

      return new Response(JSON.stringify({ history: result.results || [] }), { status:200, headers });
    }

    return new Response('Not found', { status:404 });
  }
};
