const starter = [
  { id:'g-1', area:'Dach', category:'Gaube', work:'Gaube eindecken / Anschlüsse herstellen', material:'Anschlussblech, Unterspannbahn, Dachziegel, Holz', unit:'Stk', qty:1, materialPrice:0, laborPrice:0, note:'Preis je Gaube' },
  { id:'s-1', area:'Dach', category:'Schornstein', work:'Schornsteineinfassung / Kaminanschluss', material:'Alu-/Bleianschlussband, Blech, Dichtmaterial', unit:'Stk', qty:1, materialPrice:0, laborPrice:0, note:'inkl. Zuschnitt' },
  { id:'o-1', area:'Dach', category:'Ortgang', work:'Erweiterung Ortgang', material:'Ortgangziegel, Ortgangbrett, Unterkonstruktion, Schrauben', unit:'lfm', qty:1, materialPrice:0, laborPrice:0, note:'z. B. 20 cm' },
  { id:'d-1', area:'Dach', category:'Dachüberstand', work:'Erweiterung Dachüberstand', material:'Sparrenverlängerung, Schalung, Dachkastenmaterial', unit:'lfm', qty:1, materialPrice:0, laborPrice:0, note:'z. B. 30 cm' },
  { id:'f-1', area:'Fassade', category:'Fassadenanschluss', work:'Fassadenanschluss herstellen', material:'Blech, Anschlussprofil, Dichtband', unit:'lfm', qty:1, materialPrice:0, laborPrice:0, note:'' },
  { id:'k-1', area:'Klempner', category:'Rinne', work:'Dachrinne montieren / anpassen', material:'Rinne, Halter, Endstücke, Verbinder', unit:'lfm', qty:1, materialPrice:0, laborPrice:0, note:'' }
];

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
input,select{padding:12px;border:1px solid #dfe9e2;border-radius:12px;font:inherit;box-sizing:border-box}
button{border:0;border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer}
.primary{background:#2f6b47;color:white}
.ghost{background:#eef7f0;color:#102018}
.danger{background:#fff0f0;color:#9b1c1c}
.tablewrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
table{width:100%;min-width:1250px;border-collapse:collapse;background:white}
th,td{border-bottom:1px solid #e4eee7;padding:10px;text-align:left;vertical-align:top}
th{color:#66766b;font-size:12px;text-transform:uppercase}
.money{font-weight:700;color:#2f6b47}
.status{margin-top:14px;color:#66766b;font-size:14px}
td input,td select{width:100%}
@media(max-width:900px){
.hero{padding:26px 14px 70px}
.hero h1{font-size:34px}
.card{margin:-35px 10px 24px;padding:15px;border-radius:20px}
.toolbar{display:grid;grid-template-columns:1fr;gap:10px}
.toolbar input,.toolbar select,.toolbar button{width:100%}
table{min-width:1150px}
}
</style>
</head>
<body>
<div class="hero">
  <div class="wrap">
    <span class="badge">Green Lion Energy · SUB-Preisportal</span>
    <h1>Leistungen und Preise sauber pflegen.</h1>
    <p>Hoch Plus Hannover GmbH kann Arbeiten nach Bereichen anlegen, Preise pflegen und gezielt speichern.</p>
  </div>
</div>

<div class="card">
  <h2>Hoch Plus Hannover GmbH</h2>

  <div class="toolbar">
    <input id="search" placeholder="Suchen...">
    <select id="areaFilter">
      <option value="">Alle Bereiche</option>
      <option>Dach</option>
      <option>Fassade</option>
      <option>Klempner</option>
      <option>Sonstiges</option>
    </select>
    <button class="ghost" onclick="addRow()">+ Neue Arbeit</button>
    <button class="primary" onclick="saveAll()">Speichern & aktualisieren</button>
  </div>

  <div class="tablewrap">
    <table>
      <thead>
        <tr>
          <th>Bereich</th>
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

<script>
let items = [];
const fmt = n => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(+n || 0);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

async function load(){
  const r = await fetch('/api/prices');
  const d = await r.json();

  items = (d.items || []).map(x => ({
    area: x.area || 'Dach',
    category: x.category || '',
    work: x.work || '',
    material: x.material || '',
    unit: x.unit || 'Stk',
    qty: +x.qty || 0,
    materialPrice: +x.materialPrice || 0,
    laborPrice: +x.laborPrice || 0,
    note: x.note || '',
    id: x.id || uid()
  }));

  status.textContent = 'Letzte Speicherung: ' + (d.updatedAt ? new Date(d.updatedAt).toLocaleString('de-DE') : 'noch keine');
  render();
}

function render(){
  const q = search.value.toLowerCase();
  const af = areaFilter.value;

  rows.innerHTML = items
    .filter(x => !af || x.area === af)
    .filter(x => JSON.stringify(x).toLowerCase().includes(q))
    .map((x,i) => {
      const total = (+x.qty || 0) * ((+x.materialPrice || 0) + (+x.laborPrice || 0));
      return '<tr>' +
        cell('Bereich', areaSelect(i,x.area)) +
        cell('Kategorie', inp(i,'category',x.category)) +
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

function inp(i,k,v){
  return '<input value="'+String(v ?? '').replaceAll('"','&quot;')+'" onchange="items['+i+'].'+k+'=this.value;render()">';
}

function num(i,k,v){
  return '<input type="number" step="0.01" value="'+(+v || 0)+'" onchange="items['+i+'].'+k+'=+this.value||0;render()">';
}

function areaSelect(i,v){
  const opts = ['Dach','Fassade','Klempner','Sonstiges'];
  return '<select onchange="items['+i+'].area=this.value;render()">' +
    opts.map(o => '<option '+(o===v?'selected':'')+'>'+o+'</option>').join('') +
  '</select>';
}

function addRow(){
  items.unshift({
    id:uid(),
    area:'Dach',
    category:'Neue Arbeit',
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

async function saveAll(){
  status.textContent = 'Speichere...';
  const r = await fetch('/api/prices',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({items})
  });

  if(!r.ok){
    status.textContent = 'Fehler beim Speichern';
    return;
  }

  location.reload();
}

search.oninput = render;
areaFilter.onchange = render;
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
        return new Response(JSON.stringify({ updatedAt:null, items:starter }), { status:200, headers });
      }

      return new Response(JSON.stringify({
        updatedAt: row.updated_at,
        items: JSON.parse(row.payload)
      }), { status:200, headers });
    }

    if (url.pathname === '/api/prices' && request.method === 'POST') {
      await ensureSchema(env.DB);

      const body = await request.json();

      if (!Array.isArray(body.items)) {
        return new Response(JSON.stringify({ error:'items missing' }), { status:400, headers });
      }

      const updatedAt = new Date().toISOString();

      await env.DB.prepare(
        'INSERT INTO prices_state (id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at'
      ).bind('current', JSON.stringify(body.items), updatedAt).run();

      return new Response(JSON.stringify({ updatedAt, items:body.items }), { status:200, headers });
    }

    return new Response('Not found', { status:404 });
  }
};
