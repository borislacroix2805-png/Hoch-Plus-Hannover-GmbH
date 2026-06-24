const starter = [
  {id:'g-1',category:'Gaube',work:'Gaube eindecken / Anschlüsse herstellen',material:'Anschlussblech, Unterspannbahn, Dachziegel, Holz',unit:'Stk',qty:1,materialPrice:0,laborPrice:0,note:'Preis je Gaube'},
  {id:'s-1',category:'Schornstein',work:'Schornsteineinfassung / Kaminanschluss',material:'Alu-/Bleianschlussband, Anschlussblech, Dichtmaterial',unit:'Stk',qty:1,materialPrice:0,laborPrice:0,note:'inkl. Zuschnitt und Abdichtung'},
  {id:'o-1',category:'Ortgang',work:'Erweiterung Ortgang',material:'Ortgangziegel, Ortgangbrett, Unterkonstruktion, Schrauben',unit:'lfm',qty:1,materialPrice:0,laborPrice:0,note:'z. B. Verlängerung 20 cm'},
  {id:'d-1',category:'Dachüberstand',work:'Erweiterung Dachüberstand',material:'Sparrenverlängerung, Schalung, Dachkastenmaterial',unit:'lfm',qty:1,materialPrice:0,laborPrice:0,note:'z. B. beidseitig 30 cm'},
  {id:'d-2',category:'Dachüberstand',work:'Dachkasten / Traufkasten herstellen',material:'Holz/OSB, Lüftungsband, Schrauben',unit:'lfm',qty:1,materialPrice:0,laborPrice:0,note:'sauberer Traufabschluss'}
];
const headers = {'content-type': 'application/json; charset=utf-8','cache-control': 'no-store'};
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS prices_state (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
}
export async function onRequestGet({ env }) {
  try {
    if (!env.DB) throw new Error('D1 Binding DB fehlt. Bitte in Cloudflare eine D1-Datenbank mit Variablenname DB verbinden.');
    await ensureSchema(env.DB);
    const row = await env.DB.prepare('SELECT payload, updated_at FROM prices_state WHERE id = ?').bind('current').first();
    if (!row) return new Response(JSON.stringify({ updatedAt: null, items: starter }), { status: 200, headers });
    return new Response(JSON.stringify({ updatedAt: row.updated_at, items: JSON.parse(row.payload) }), { status: 200, headers });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
}
export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) throw new Error('D1 Binding DB fehlt. Bitte in Cloudflare eine D1-Datenbank mit Variablenname DB verbinden.');
    await ensureSchema(env.DB);
    const body = await request.json();
    if (!Array.isArray(body.items)) return new Response(JSON.stringify({ error: 'items missing' }), { status: 400, headers });
    const updatedAt = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO prices_state (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`).bind('current', JSON.stringify(body.items), updatedAt).run();
    return new Response(JSON.stringify({ updatedAt, items: body.items }), { status: 200, headers });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers }); }
}
