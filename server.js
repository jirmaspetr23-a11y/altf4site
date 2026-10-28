/*
 * Viper Gaming Team – Backend (Node.js + Express + SQLite)
 *
 * Endpointy:
 *   POST /api/admin/generate-invite   – vygeneruje nový unikátní registrační kód (chráněno admin tokenem)
 *   GET  /api/admin/invites           – seznam všech kódů (chráněno admin tokenem)
 *   POST /api/verify-invite           – ověří platnost kódu a označí ho jako použitý
 *   POST /api/register                – zaregistruje nového uživatele
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Chyba při připojení k databázi:', err.message);
    process.exit(1);
  }
  console.log('Připojeno k SQLite databázi:', dbPath);
});

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    const safeExt = ['.png','.jpg','.jpeg','.gif','.webp'].includes(ext) ? ext : '.png';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`);
  }
});
const upload = multer({ storage: uploadStorage, limits: { fileSize: 5 * 1024 * 1024 } });
app.use('/uploads', express.static(uploadsDir));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    two_factor_secret TEXT NOT NULL,
    is_2fa_verified INTEGER DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'member',
    game_role TEXT,
    gaming_rank TEXT,
    banned_at DATETIME,
    ban_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS InviteCodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS CommunityMessages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '' CHECK(length(body) <= 1000),
    image_url TEXT,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    parent_message_id INTEGER,
    edited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS wiki_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(updated_by) REFERENCES Users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS hall_of_fame (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    player_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'mvp',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS scrims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opponent TEXT NOT NULL,
    scrim_time DATETIME NOT NULL,
    server_ip TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'upcoming',
    result TEXT NOT NULL DEFAULT 'pending',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES Users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES Users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS clip_votes (
    clip_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(clip_id, user_id),
    FOREIGN KEY(clip_id) REFERENCES clips(id),
    FOREIGN KEY(user_id) REFERENCES Users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS stratbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    map_name TEXT NOT NULL DEFAULT '',
    side TEXT NOT NULL DEFAULT 'attack',
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES Users(id)
  )`);

  // Seed vzorových ocenění do Síně slávy (jen pokud ještě neexistují)
  const hofSeed = [
    ['Tactical Mastermind & Captain', 'S1mtry', 'Vynikající vedení týmu, precizní callouty a taktická příprava na turnajích.', 'mvp'],
    ['Founder & Leader Award', 'OPskank', 'Zakladatel a pilíř týmu ALT-F4 Allstars, zajištění chodu hubu a zázemí.', 'milestone'],
    ['Nejlepší Support & Moderátor', 'Halkas', 'Jistota v zádech, perfektní kontrola utility a spolehlivá moderace komunity.', 'mvp'],
    ['Clutch King', 'machyy', 'Vynikající schopnost otáčet prohraná kola a chladná hlava v kritických situacích (1v3/1v4).', 'tournament_win'],
    ['Entry Fragger of the Season', 'MonteCZ', 'Nebezpečný první kontakt s nepřítelem, otevírání bomby a agresivní map control.', 'mvp'],
    ['Consistency Award', 'srcPik', 'Stabilní výkony v každém zápase, vysoké procento trade-killů a spolehlivý spoluhráč.', 'milestone']
  ];
  hofSeed.forEach(([title, player_name, description, category]) => {
    db.run(
      'INSERT INTO hall_of_fame (title, player_name, description, category) SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM hall_of_fame WHERE title = ? AND player_name = ?)',
      [title, player_name, description, category, title, player_name]
    );
  });

  // Seed 4 wiki článků (jen pokud je tabulka prázdná)
  db.get('SELECT COUNT(*) AS c FROM wiki_pages', (err, row) => {
    if (err) { console.error('Chyba při kontrole wiki_pages:', err.message); return; }
    if (row && row.c > 0) return;
    const wikiSeed = [
      ['Valorant Ekonomika 101',
       'Pistol round: Základ pro celé poloviny hry. Koupě lehkého štítu a schopností, případně Classic + plná utilita.\n' +
       'Eco round: Šetření peněz, nákup Classiců/Sheriffů, snaha o eliminaci jednoho soupeře a sebrání jeho zbraně (tzv. eco-frag).\n' +
       'Full buy: Vandal nebo Phantom, plné štíty (Heavy Shields) a kompletní utilita pro celý tým.\n' +
       'Bonus round: Kolo po vyhraném pistol roundu – hraje se s levnějšími zbraněmi nepřítele, cílem je zlomit jejich ekonomiku.'],
      ['Základy Aimingu a Crosshair Placement',
       'Crosshair Placement: Měřte neustále ve výšce hlavy soupeře. Sledujte rohy a schody, kde se hlavy objevují, nemiřte do země.\n' +
       'Counter-straffing a pohyb: Nikdy nestřílejte za běhu. Pro okamžité zastavení a přesnou střelbu uvolněte klávesu pohybu nebo ťukněte opačný směr.\n' +
       'Burst vs. Spray: Na střední a dálkové vzdálenosti střílejte po 2–3 ranách (burst), full-spray funguje spolehlivě jen na těsno.'],
      ['Týmová komunikace a Trade Kills',
       'Přesné callouty: Pojmenovávejte pozice stručně a jasně (např. "A Heaven", "B Long", "Default", "Connector").\n' +
       'Trade Kills: Pokud padne váš spoluhráč, musíte nepřítele okamžitě dorazit. Nikdy nevstupujte do soubojů sami bez zajištění záad a prostoru (tzv. trading).\n' +
       'Synergie utilit: Kombinujte odhalovací schopnosti (Sova/Fade) s blesky a kouřovými granáty.'],
      ['Role agentů v týmu',
       'Duelisté (Jett, Reyna, Raze, Neon): Vstupují na bomby jako první (entry fraggeři), vytvářejí prostor pro tým.\n' +
       'Initiatoři (Sova, Fade, Skye, Gekko): Odhalují pozice nepřátel za zdmi a čistí nebezpečné úhly.\n' +
       'Controlleri (Omen, Viper, Brimstone, Clove): Zamezují výhledu soupeře pomocí kouřů (smokes) a kontrolují tempo mapy.\n' +
       'Sentinelu (Killjoy, Cypher, Deadlock, Sage): Hlídají flanky (záda týmu), zdržují postup nepřátel pastmi a brání bomb site.']
    ];
    const stmt = db.prepare('INSERT INTO wiki_pages (title, content, updated_by) VALUES (?, ?, ?)');
    wikiSeed.forEach(([title, content]) => stmt.run(title, content, null));
    stmt.finalize((ferr) => {
      if (ferr) console.error('Chyba při seedu wiki_pages:', ferr.message);
      else console.log('Vloženy 4 wiki články.');
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS stream_settings (
    id INTEGER PRIMARY KEY,
    stream_url TEXT NOT NULL DEFAULT '',
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(updated_by) REFERENCES Users(id)
  )`);
  db.run('INSERT OR IGNORE INTO stream_settings (id, stream_url) VALUES (1, \'\')');

   db.run(`CREATE TABLE IF NOT EXISTS map_vetos (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     opponent_name TEXT NOT NULL,
     match_format TEXT NOT NULL,
     map_pool TEXT NOT NULL,
     banned_maps TEXT NOT NULL DEFAULT '[]',
     picked_maps TEXT NOT NULL DEFAULT '[]',
     status TEXT NOT NULL DEFAULT 'active',
     created_by INTEGER,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY(created_by) REFERENCES Users(id)
   )`);

   db.run(`CREATE TABLE IF NOT EXISTS message_reactions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     message_id INTEGER NOT NULL,
     user_id INTEGER NOT NULL,
     emoji TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY(user_id) REFERENCES Users(id)
   )`);
   db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_message_reactions_unique ON message_reactions(message_id, user_id, emoji)');
   db.run('CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id)');

  db.run(`CREATE TABLE IF NOT EXISTS direct_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '' CHECK(length(content) <= 1000),
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_direct_messages_users ON direct_messages(sender_id, receiver_id, id)');
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    actor_id INTEGER,
    type TEXT NOT NULL,
    message_id INTEGER,
    content TEXT,
    message TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES Users(id),
    FOREIGN KEY(actor_id) REFERENCES Users(id)
  )`);
  // Migrace starších databází: doplnit sloupec message
  db.all("PRAGMA table_info(notifications)", (err, cols) => {
    if (err || !Array.isArray(cols)) return;
    const hasMessage = cols.some(c => c && c.name === 'message');
    if (!hasMessage) {
      db.run('ALTER TABLE notifications ADD COLUMN message TEXT', (aerr) => {
        if (aerr) console.error('Migrace notifications.message selhala:', aerr.message);
        else db.run('UPDATE notifications SET message = COALESCE(message, content) WHERE message IS NULL');
      });
    } else {
      db.run('UPDATE notifications SET message = COALESCE(message, content) WHERE message IS NULL');
    }
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, id)');
  db.run('ALTER TABLE Users ADD COLUMN role TEXT NOT NULL DEFAULT \'member\'', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci rolí:', err.message);
  });
  db.run('ALTER TABLE CommunityMessages ADD COLUMN image_url TEXT', err => {
  db.run('ALTER TABLE CommunityMessages ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci is_pinned (CommunityMessages):', err.message);
  });

    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci image_url (CommunityMessages):', err.message);
  });
  db.run('ALTER TABLE direct_messages ADD COLUMN image_url TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci image_url (direct_messages):', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN banned_at DATETIME', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci banů:', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN ban_reason TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci důvodu banu:', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN bio TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci bio:', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN avatar_url TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci avatar_url:', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN game_role TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci game_role:', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN gaming_rank TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci gaming_rank:', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN riot_id TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci riot_id:', err.message);
  });
  db.run('ALTER TABLE Users ADD COLUMN steam_profile TEXT', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci steam_profile:', err.message);
  });
  db.run('ALTER TABLE InviteCodes ADD COLUMN used_by INTEGER', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci used_by:', err.message);
  });
  // Tabulka skupin kanálů (zalozky) – vlastníci mohou vytvářet, mazat a přejmenovávat
  db.run(`CREATE TABLE IF NOT EXISTS CommunityChannelGroups (
    group_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`);
  db.get('SELECT COUNT(*) AS c FROM CommunityChannelGroups', (err, row) => {
    if (err || (row && row.c > 0)) return;
    const defaultGroups = [
      ['info', 'INFORMACE', 'info', 1],
      ['community', 'KOMUNITA', 'community', 2],
      ['management', 'SPRÁVA', 'owner', 3]
    ];
    defaultGroups.forEach(g => db.run('INSERT INTO CommunityChannelGroups (group_id, name, type, sort_order) VALUES (?, ?, ?, ?)', g));
  });

  db.run(`CREATE TABLE IF NOT EXISTS CommunityChannels (
    channel_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    group_id TEXT NOT NULL DEFAULT 'community',
    is_readonly INTEGER NOT NULL DEFAULT 0
  )`);
  db.run('ALTER TABLE CommunityChannels ADD COLUMN group_id TEXT DEFAULT \'community\'', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci group_id:', err.message);
  });
  db.run('ALTER TABLE CommunityChannels ADD COLUMN is_readonly INTEGER NOT NULL DEFAULT 0', err => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci is_readonly:', err.message);
  });
  db.get('SELECT COUNT(*) AS c FROM CommunityChannels', (err, row) => {
    if (err || (row && row.c > 0)) return;
    const defaultChannels = [
      ['news', 'novinky', 'Dění v týmu ALT-F4 Allstars', 1, 'info'],
      ['rules', 'pravidla', 'Základní pravidla komunity', 2, 'info'],
      ['general', 'obecný-chat', 'Pokec s týmem', 1, 'community'],
      ['tactics', 'taktiky', 'Plány, strategie a rozbory', 2, 'community'],
      ['lfg', 'hledám-partu', 'Najdi spoluhráče do další hry', 3, 'community'],
      ['team-management', 'správa týmu', 'Správa členů a kanálů', 1, 'management']
    ];
    defaultChannels.forEach(c => db.run('INSERT INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES (?, ?, ?, ?, ?)', c));
  });
  db.run("UPDATE Users SET role = 'owner' WHERE username = 'OPskank' AND is_2fa_verified = 1");
  db.run('ALTER TABLE CommunityMessages ADD COLUMN parent_message_id INTEGER', err => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Chyba při migraci odpovědí zpráv:', err.message);
    }
  });
  db.run('ALTER TABLE CommunityMessages ADD COLUMN edited_at DATETIME', err => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Chyba při migraci úprav zpráv:', err.message);
    }
  });
  db.run('CREATE INDEX IF NOT EXISTS idx_community_messages_channel_id ON CommunityMessages(channel_id, id)');
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS event_responses (
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('attending','declined')),
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opponent TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('win','loss')),
    score TEXT,
    map_name TEXT,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY(created_by) REFERENCES Users(id)
  )`);
  db.run("INSERT OR IGNORE INTO CommunityChannelGroups (group_id, name, type, sort_order) VALUES ('turnaje', 'TURNAJE', 'community', 4)");
  db.run("INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES ('tournaments', 'kalendář', 'Kalendář akcí a turnajů', 1, 'turnaje')");
  db.run("INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES ('matches', 'výsledky zápasů', 'Historie odehraných zápasů', 2, 'turnaje')");

  // Seed 20 vzorových zápasů ve Valorantu (jen pokud je tabulka prázdná)
  db.get('SELECT COUNT(*) AS c FROM match_history', (err, row) => {
    if (err) { console.error('Chyba při kontrole match_history:', err.message); return; }
    if (row && row.c > 0) return;
    const seedMatches = [
      ['Cyber Wolves', 'win', '13:5', 'Ascent', '2026-10-05 18:00:00'],
      ['Pixel Smashers', 'win', '13:8', 'Bind', '2026-10-06 19:30:00'],
      ['Savage Squad', 'win', '13:11', 'Haven', '2026-10-07 20:00:00'],
      ['Phantom Gaming', 'win', '14:12', 'Split', '2026-10-08 18:15:00'],
      ['Neon Strike', 'win', '13:7', 'Lotus', '2026-10-09 19:00:00'],
      ['Reloaded eSports', 'win', '13:4', 'Sunset', '2026-10-10 20:30:00'],
      ['Cyber Wolves', 'win', '13:9', 'Icebox', '2026-10-11 18:45:00'],
      ['Pixel Smashers', 'win', '13:6', 'Pearl', '2026-10-12 19:15:00'],
      ['Savage Squad', 'win', '13:10', 'Abyss', '2026-10-13 20:00:00'],
      ['Phantom Gaming', 'win', '13:2', 'Ascent', '2026-10-14 18:30:00'],
      ['Neon Strike', 'win', '13:11', 'Bind', '2026-10-15 19:45:00'],
      ['Reloaded eSports', 'win', '14:12', 'Haven', '2026-10-16 20:15:00'],
      ['Cyber Wolves', 'win', '13:8', 'Split', '2026-10-17 18:00:00'],
      ['Pixel Smashers', 'win', '13:5', 'Lotus', '2026-10-18 19:30:00'],
      ['Savage Squad', 'win', '13:7', 'Sunset', '2026-10-19 20:00:00'],
      ['Phantom Gaming', 'loss', '9:13', 'Icebox', '2026-10-20 18:45:00'],
      ['Neon Strike', 'win', '13:6', 'Pearl', '2026-10-21 19:15:00'],
      ['Reloaded eSports', 'win', '13:10', 'Abyss', '2026-10-22 20:00:00'],
      ['Cyber Wolves', 'loss', '11:13', 'Ascent', '2026-10-23 18:30:00'],
      ['Pixel Smashers', 'win', '13:4', 'Bind', '2026-10-24 19:00:00']
    ];
    const stmt = db.prepare('INSERT INTO match_history (opponent, result, score, map_name, played_at) VALUES (?, ?, ?, ?, ?)');
    seedMatches.forEach((m) => stmt.run(m[0], m[1], m[2], m[3], m[4]));
    stmt.finalize((ferr) => {
      if (ferr) console.error('Chyba při seedu match_history:', ferr.message);
      else console.log('Vloženo 20 vzorových zápasů do match_history.');
    });
  });

});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, 'script.js')));
app.get('/video/intro.mp4', (req, res) => res.sendFile(path.join(__dirname, 'video', 'intro.mp4')));
app.get('/photo/team-logo.jpg', (req, res) => res.sendFile(path.join(__dirname, 'photo', 'Cyber-reaper_wielding_energy_scythe_20261023130152.jpg')));

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chybí autorizační hlavička Bearer token.' });
  }
  const token = authHeader.split(' ')[1];
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Neplatný admin token.' });
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chybí přihlašovací token.' });
  }

  let claims;
  try {
    claims = jwt.verify(authHeader.slice(7), JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Přihlašovací relace vypršela nebo není platná.' });
  }

  get('SELECT id, username, role, is_2fa_verified, banned_at FROM Users WHERE id = ?', [claims.userId])
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'Účet není aktivní.' });
      }
      if (user.banned_at) {
        return res.status(403).json({ error: 'Tento účet byl zablokován.' });
      }
      if (!user.is_2fa_verified) {
        return res.status(401).json({ error: 'Účet není aktivní.' });
      }
      req.auth = { ...claims, username: user.username, role: user.role || 'member' };
      next();
    })
    .catch(err => {
      console.error('Chyba při ověřování relace:', err.message);
      res.status(500).json({ error: 'Interní chyba serveru.' });
    });
}


function requireOwnerOrModerator(req, res, next) {
  if (req.auth.role !== 'owner' && req.auth.role !== 'moderator') {
    return res.status(403).json({ error: 'Tato akce je pouze pro moderátory a vlastníky.' });
  }
  next();
}

function requireTeamOwner(req, res, next) {
  if (req.auth.role !== 'owner') {
    return res.status(403).json({ error: 'Tato akce je pouze pro vlastníka týmu.' });
  }
  next();
}

function requireScrimManager(req, res, next) {
  if (!['owner', 'moderator', 'captain'].includes(req.auth.role)) {
    return res.status(403).json({ error: 'Tato akce je pouze pro kapitány, moderátory a vlastníky.' });
  }
  next();
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err); else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}
async function loadReactionsByMessage(messageIds, userId) {
  const result = new Map();
  const ids = [...new Set((messageIds || []).filter(id => Number.isSafeInteger(Number(id)) && Number(id) > 0).map(Number))];
  ids.forEach(id => result.set(id, []));
  if (!ids.length) return result;
  const placeholders = ids.map(() => '?').join(',');
  const rows = await all(
    `SELECT message_id, emoji, user_id FROM message_reactions WHERE message_id IN (${placeholders})`,
    ids
  );
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.message_id)) grouped.set(row.message_id, new Map());
    const emojiMap = grouped.get(row.message_id);
    if (!emojiMap.has(row.emoji)) {
      emojiMap.set(row.emoji, { emoji: row.emoji, count: 0, reacted: false });
    }
    const item = emojiMap.get(row.emoji);
    item.count += 1;
    if (row.user_id === userId) item.reacted = true;
  }
  for (const [messageId, emojiMap] of grouped) {
    result.set(messageId, Array.from(emojiMap.values()));
  }
  return result;
}

async function getReactionsForMessage(messageId, userId) {
  const map = await loadReactionsByMessage([messageId], userId);
  return map.get(Number(messageId)) || [];
}



function findCommunityChannel(channelId) {
  return get(
    `SELECT channel.channel_id, channel.name, channel.description, channel.sort_order,
      channel.group_id, channel.is_readonly, groups.type AS group_type
    FROM CommunityChannels AS channel
    LEFT JOIN CommunityChannelGroups AS groups ON groups.group_id = channel.group_id
    WHERE channel.channel_id = ?`,
    [channelId]
  );
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

async function createInviteCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    if (await get('SELECT id FROM InviteCodes WHERE code = ?', [code])) continue;
    await run('INSERT INTO InviteCodes (code, is_used) VALUES (?, 0)', [code]);
    return code;
  }
  throw new Error('Nepodařilo se vygenerovat unikátní kód.');
}

// ============================================================================
// ADMIN ENDPOINTY
// ============================================================================


app.post('/api/admin/generate-invite', requireAdmin, async (req, res) => {
  try {
    let code;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateInviteCode();
      attempts++;
      if (attempts > maxAttempts) {
        return res.status(500).json({ error: 'Nepodařilo se vygenerovat unikátní kód.' });
      }
    } while (await get('SELECT id FROM InviteCodes WHERE code = ?', [code]));

    await run('INSERT INTO InviteCodes (code, is_used) VALUES (?, 0)', [code]);

    console.log(`Admin vygeneroval nový kód: ${code}`);
    res.status(201).json({
      success: true,
      code,
      message: 'Registrační kód byl vygenerován.'
    });
  } catch (err) {
    console.error('Chyba při generování kódu:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});


app.get('/api/admin/invites', requireAdmin, async (req, res) => {
  try {
    const rows = await all('SELECT id, code, is_used, created_at FROM InviteCodes ORDER BY created_at DESC');
    res.json({
      success: true,
      invites: rows.map((row) => ({
        id: row.id,
        code: row.code,
        is_used: Boolean(row.is_used),
        created_at: row.created_at
      }))
    });
  } catch (err) {
    console.error('Chyba při načítání kódů:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.post('/api/community/invites', requireAuth, requireTeamOwner, async (req, res) => {
  try {
    const code = await createInviteCode();
    res.status(201).json({ success: true, code });
  } catch (err) {
    console.error('Chyba při generování invite kódu vlastníkem:', err.message);
    res.status(500).json({ error: 'Invite kód se nepodařilo vytvořit.' });
  }
});

app.get('/api/invites', requireAuth, requireTeamOwner, async (req, res) => {
  try {
    const rows = await all(
      `SELECT ic.id, ic.code, ic.is_used, ic.used_by, ic.created_at, u.username AS used_by_username
       FROM InviteCodes ic
       LEFT JOIN Users u ON u.id = ic.used_by
       ORDER BY ic.created_at DESC`
    );
    res.json({
      success: true,
      invites: rows.map(row => ({
        id: row.id,
        code: row.code,
        is_used: Boolean(row.is_used),
        used_by: row.used_by || null,
        used_by_username: row.used_by_username || null,
        created_at: row.created_at
      }))
    });
  } catch (err) {
    console.error('Chyba při načítání pozvánek:', err.message);
    res.status(500).json({ error: 'Pozvánky se nepodařilo načíst.' });
  }
});

app.delete('/api/invites/:code', requireAuth, requireTeamOwner, async (req, res) => {
  const code = String(req.params.code || '').trim();
  if (!code) return res.status(400).json({ error: 'Chybí kód.' });
  try {
    const invite = await get('SELECT id, is_used FROM InviteCodes WHERE code = ?', [code]);
    if (!invite) return res.status(404).json({ error: 'Pozvánka nebyla nalezena.' });
    if (invite.is_used) return res.status(400).json({ error: 'Použitý kód nelze smazat.' });
    await run('DELETE FROM InviteCodes WHERE code = ? AND is_used = 0', [code]);
    res.json({ success: true, message: 'Pozvánka byla smazána.' });
  } catch (err) {
    console.error('Chyba při mazání pozvánky:', err.message);
    res.status(500).json({ error: 'Pozvánku se nepodařilo smazat.' });
  }
});

app.get('/api/community/channels', requireAuth, async (req, res) => {
  try {
    const savedChannels = await all('SELECT channel_id, name, description, sort_order, group_id, is_readonly FROM CommunityChannels');
    const savedGroups = await all('SELECT group_id, name, type, sort_order FROM CommunityChannelGroups ORDER BY sort_order');
    const channels = savedChannels.sort((a, b) => {
      const groupOrder = savedGroups.find(group => group.group_id === a.group_id)?.sort_order
        - savedGroups.find(group => group.group_id === b.group_id)?.sort_order;
      return groupOrder || a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'cs');
    });
    res.json({ success: true, channels, groups: savedGroups });
  } catch (err) {
    console.error('Chyba při načítání textových kanálů:', err.message);
    res.status(500).json({ error: 'Kanály se nepodařilo načíst.' });
  }
});

// Seznam všech skupin kanálů (pro vlastníka)
app.get('/api/admin/channel-groups', requireAuth, requireTeamOwner, async (req, res) => {
  try {
    const groups = await all('SELECT group_id, name, type, sort_order FROM CommunityChannelGroups ORDER BY sort_order');
    res.json({ success: true, groups });
  } catch (err) {
    console.error('Chyba při načítání skupin kanálů:', err.message);
    res.status(500).json({ error: 'Skupiny kanálů se nepodařilo načíst.' });
  }
});


app.post('/api/admin/channel-groups', requireAuth, requireTeamOwner, async (req, res) => {
  const { group_id, name, type = 'community', sort_order = 0 } = req.body;
  if (!group_id || !/^[a-z0-9-]+$/.test(group_id)) {
    return res.status(400).json({ error: 'Neplatné ID skupiny (pouze malá písmena, čísla a pomlčky).' });
  }
  if (!name || name.trim().length < 2 || name.trim().length > 32) {
    return res.status(400).json({ error: 'Název skupiny musí mít 2–32 znaků.' });
  }
  try {
    await run(
      'INSERT INTO CommunityChannelGroups (group_id, name, type, sort_order) VALUES (?, ?, ?, ?)',
      [group_id, name.trim(), type, Number(sort_order) || 0]
    );
    res.status(201).json({ success: true, group: { group_id, name: name.trim(), type, sort_order: Number(sort_order) || 0 } });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Skupina s tímto ID již existuje.' });
    }
    console.error('Chyba při vytváření skupiny kanálů:', err.message);
    res.status(500).json({ error: 'Skupinu kanálů se nepodařilo vytvořit.' });
  }
});

// Úprava skupiny kanálů (přejmenování, typ, řazení)
app.put('/api/admin/channel-groups/:groupId', requireAuth, requireTeamOwner, async (req, res) => {
  const { groupId } = req.params;
  const { name, type, sort_order } = req.body;
  const updates = [];
  const params = [];
  if (typeof name === 'string' && name.trim()) {
    if (name.trim().length < 2 || name.trim().length > 32) {
      return res.status(400).json({ error: 'Název skupiny musí mít 2–32 znaků.' });
    }
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (typeof type === 'string') {
    updates.push('type = ?');
    params.push(type);
  }
  if (typeof sort_order === 'number') {
    updates.push('sort_order = ?');
    params.push(sort_order);
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'Chybí pole k aktualizaci.' });
  }
  params.push(groupId);
  try {
    const result = await run(
      'UPDATE CommunityChannelGroups SET ' + updates.join(', ') + ' WHERE group_id = ?',
      params
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Skupina kanálů nebyla nalezena.' });
    }
    const group = await get('SELECT group_id, name, type, sort_order FROM CommunityChannelGroups WHERE group_id = ?', [groupId]);
    res.json({ success: true, group });
  } catch (err) {
    console.error('Chyba při úpravě skupiny kanálů:', err.message);
    res.status(500).json({ error: 'Skupinu kanálů se nepodařilo upravit.' });
  }
});

// Smazání skupiny kanálů – kanály ve skupině dostanou výchozí skupinu 'community'
app.delete('/api/admin/channel-groups/:groupId', requireAuth, requireTeamOwner, async (req, res) => {
  const { groupId } = req.params;
  try {
    await run('UPDATE CommunityChannels SET group_id = ? WHERE group_id = ?', ['community', groupId]);
    const result = await run('DELETE FROM CommunityChannelGroups WHERE group_id = ?', [groupId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Skupina kanálů nebyla nalezena.' });
    }
    res.json({ success: true, message: 'Skupina smazána, kanály přesunuty do výchozí skupiny.' });
  } catch (err) {
    console.error('Chyba při mazání skupiny kanálů:', err.message);
    res.status(500).json({ error: 'Skupinu kanálů se nepodařilo smazat.' });
  }
});
app.post('/api/community/channels', requireAuth, requireTeamOwner, async (req, res) => {
  const { channel_id, name, description, group_id = 'community', sort_order = 0, is_readonly = false } = req.body;
  if (!channel_id || !/^[a-z0-9-]+$/.test(channel_id)) {
    return res.status(400).json({ error: 'Neplatné ID kanálu (pouze malá písmena, čísla a pomlčky).' });
  }
  if (!name || name.trim().length < 2 || name.trim().length > 32) {
    return res.status(400).json({ error: 'Název kanálu musí mít 2–32 znaků.' });
  }
  if (description && description.length > 120) {
    return res.status(400).json({ error: 'Popis smí mít nejvýše 120 znaků.' });
  }
  const group = await get('SELECT group_id FROM CommunityChannelGroups WHERE group_id = ?', [group_id]);
  if (!group) {
    return res.status(400).json({ error: 'Zadaná skupina kanálů neexistuje.' });
  }
  try {
    await run(
      'INSERT INTO CommunityChannels (channel_id, name, description, sort_order, group_id, is_readonly) VALUES (?, ?, ?, ?, ?, ?)',
      [channel_id, name.trim(), description ? description.trim() : '', Number(sort_order) || 0, group_id, is_readonly ? 1 : 0]
    );
    res.status(201).json({ success: true, channel: { channel_id, name: name.trim(), description: description ? description.trim() : '', sort_order: Number(sort_order) || 0, group_id, is_readonly: is_readonly ? 1 : 0 } });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Kanál s tímto ID již existuje.' });
    }
    console.error('Chyba při vytváření kanálu:', err.message);
    res.status(500).json({ error: 'Kanál se nepodařilo vytvořit.' });
  }
});

app.put('/api/community/channels/:channelId', requireAuth, requireTeamOwner, async (req, res) => {
  const { channelId } = req.params;
  const { name, description, group_id, sort_order, is_readonly } = req.body;
  const updates = [];
  const params = [];
  if (typeof name === 'string' && name.trim()) {
    if (name.trim().length < 2 || name.trim().length > 32) {
      return res.status(400).json({ error: 'Název kanálu musí mít 2–32 znaků.' });
    }
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (typeof description === 'string') {
    if (description.length > 120) {
      return res.status(400).json({ error: 'Popis smí mít nejvýše 120 znaků.' });
    }
    updates.push('description = ?');
    params.push(description.trim());
  }
  if (typeof group_id === 'string') {
    const group = await get('SELECT group_id FROM CommunityChannelGroups WHERE group_id = ?', [group_id]);
    if (!group) {
      return res.status(400).json({ error: 'Zadaná skupina kanálů neexistuje.' });
    }
    updates.push('group_id = ?');
    params.push(group_id);
  }
  if (typeof sort_order === 'number') {
    updates.push('sort_order = ?');
    params.push(sort_order);
  }
  if (typeof is_readonly === 'boolean') {
    updates.push('is_readonly = ?');
    params.push(is_readonly ? 1 : 0);
  }
  if (updates.length === 0) {
    return res.status(400).json({ error: 'Chybí pole k aktualizaci.' });
  }
  try {
    const existing = await get('SELECT channel_id FROM CommunityChannels WHERE channel_id = ?', [channelId]);
    if (!existing) {
      return res.status(404).json({ error: 'Kanál nebyl nalezen.' });
    }
    params.push(channelId);
    const result = await run(
      'UPDATE CommunityChannels SET ' + updates.join(', ') + ' WHERE channel_id = ?',
      params
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kanál nebyl nalezen.' });
    }
    const channel = await get('SELECT channel_id, name, description, sort_order, group_id, is_readonly FROM CommunityChannels WHERE channel_id = ?', [channelId]);
    res.json({ success: true, channel });
  } catch (err) {
    console.error('Chyba při úpravě kanálu:', err.message);
    res.status(500).json({ error: 'Kanál se nepodařilo upravit.' });
  }
});

app.delete('/api/community/channels/:channelId', requireAuth, requireTeamOwner, async (req, res) => {
  const { channelId } = req.params;
  try {
    const channel = await get('SELECT channel_id FROM CommunityChannels WHERE channel_id = ?', [channelId]);
    if (!channel) return res.status(404).json({ error: 'Kanál nebyl nalezen.' });
    await run('DELETE FROM CommunityMessages WHERE channel_id = ?', [channelId]);
    await run('DELETE FROM CommunityChannels WHERE channel_id = ?', [channelId]);
    res.json({ success: true, deletedId: channelId });
  } catch (err) {
    console.error('Chyba při mazání kanálu:', err.message);
    res.status(500).json({ error: 'Kanál se nepodařilo smazat.' });
  }
});
app.post('/api/verify-invite', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Chybí parametr code.' });
    }

    const invite = await get('SELECT id, code, is_used FROM InviteCodes WHERE code = ?', [code.trim()]);

    if (!invite) {
      return res.status(404).json({ error: 'Platný kód nebyl nalezen.' });
    }

    if (invite.is_used) {
      return res.status(400).json({ error: 'Tento kód již byl použit.' });
    }

    await run('UPDATE InviteCodes SET is_used = 1 WHERE id = ?', [invite.id]);

    console.log(`Kód ověřen a označen jako použitý: ${code}`);
    res.json({
      success: true,
      valid: true,
      message: 'Kód je platný. Můžete pokračovat k registraci.'
    });
  } catch (err) {
    console.error('Chyba při ověřování kódu:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});


app.post('/api/register', async (req, res) => {
  try {
    const { username, two_factor_secret, invite_code } = req.body;

    if (!username || !two_factor_secret || !invite_code) {
      return res.status(400).json({ error: 'Chybí povinné parametry: username, two_factor_secret, invite_code.' });
    }

    const invite = await get('SELECT id, is_used FROM InviteCodes WHERE code = ?', [invite_code.trim()]);

    if (!invite) {
      return res.status(404).json({ error: 'Platný kód nebyl nalezen.' });
    }

    if (!invite.is_used) {
      return res.status(400).json({ error: 'Kód ještě nebyl ověřen. Nejprve ověřte kód pomocí /api/verify-invite.' });
    }

    const result = await run(
      'INSERT INTO Users (username, two_factor_secret) VALUES (?, ?)',
      [username.trim(), two_factor_secret.trim()]
    );

    await run('UPDATE InviteCodes SET used_by = ? WHERE code = ?', [result.lastID, invite_code.trim()]);

    console.log(`Nový uživatel zaregistrován: ${username} (id: ${result.lastID})`);
    res.status(201).json({
      success: true,
      userId: result.lastID,
      username: username.trim(),
      message: 'Registrace proběhla úspěšně.'
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      if (err.message.includes('username')) {
        return res.status(409).json({ error: 'Uživatelské jméno již existuje.' });
      }
      return res.status(409).json({ error: 'Tento záznam již existuje.' });
    }
    console.error('Chyba při registraci:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});


app.post('/api/register-step-1', async (req, res) => {
  try {
    const { username, invite_code } = req.body;

    if (!username || !invite_code) {
      return res.status(400).json({ error: 'Chybí povinné parametry: username, invite_code.' });
    }

    // Ověříme invite kód
    const invite = await get('SELECT id, is_used FROM InviteCodes WHERE code = ?', [invite_code.trim()]);

    if (!invite) {
      return res.status(404).json({ error: 'Platný kód nebyl nalezen.' });
    }

    if (invite.is_used) {
      return res.status(400).json({ error: 'Tento kód již byl použit.' });
    }

    // Dokončený účet nelze znovu zaregistrovat; čekající registraci lze obnovit novým invite kódem.
    const existingUser = await get(
      'SELECT id, is_2fa_verified, banned_at FROM Users WHERE username = ?',
      [username.trim()]
    );
    if (existingUser?.banned_at) {
      return res.status(403).json({ error: 'Tento účet byl zablokován.' });
    }
    if (existingUser && existingUser.is_2fa_verified) {
      return res.status(409).json({ error: 'Uživatelské jméno již existuje.' });
    }

    // Označíme kód jako použitý
    await run('UPDATE InviteCodes SET is_used = 1 WHERE id = ?', [invite.id]);

    // Vygenerujeme TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Viper:${username.trim()}`,
      issuer: 'Viper',
      length: 20
    }).base32;

    // Vytvoříme účet nebo obnovíme jeho dosud nepotvrzené 2FA.
    let userId;
    if (existingUser) {
      await run(
        'UPDATE Users SET two_factor_secret = ?, is_2fa_verified = 0 WHERE id = ?',
        [secret, existingUser.id]
      );
      userId = existingUser.id;
    } else {
      const result = await run(
        'INSERT INTO Users (username, two_factor_secret, is_2fa_verified) VALUES (?, ?, 0)',
        [username.trim(), secret]
      );
      userId = result.lastID;
    }

    await run('UPDATE InviteCodes SET used_by = ? WHERE code = ?', [userId, invite_code.trim()]);

    // Vygenerujeme otpauth:// URL pro QR kód
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret,
      encoding: 'base32',
      label: `Viper:${username.trim()}`,
      issuer: 'Viper',
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });

    // Vygenerujeme QR kód jako Base64 Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    console.log(`Krok 1 registrace: uživatel ${username.trim()} vytvořen, čeká na 2FA verifikaci.`);
    res.status(201).json({
      success: true,
      userId,
      username: username.trim(),
      qrCode: qrCodeDataUrl,
      setupKey: secret,
      message: 'Uživatel vytvořen. Naskenujte QR kód do Google Authenticatoru a potvrďte registraci.'
    });
  } catch (err) {
    console.error('Chyba při registraci krok 1:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});


app.post('/api/register-step-2', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const totp_code = String(req.body.totp_code || '').trim();

    if (!username || !totp_code || totp_code.length !== 6) {
      return res.status(400).json({ error: 'Chybí povinné parametry: username, totp_code (6 číslic).' });
    }

    // Najdeme uživatele
    const user = await get('SELECT id, username, two_factor_secret, is_2fa_verified FROM Users WHERE username = ?', [username]);

    if (!user) {
      return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
    }

    if (user.is_2fa_verified) {
      return res.status(400).json({ error: 'Registrace již byla dokončena.' });
    }

    // Ověříme TOTP kód
    const tokenValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: String(totp_code).trim(),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      window: 1
    });

    if (!tokenValid) {
      return res.status(400).json({ error: 'Neplatný 2FA kód. Zkuste to znovu.' });
    }

    // Označíme registraci jako dokončenou
    await run('UPDATE Users SET is_2fa_verified = 1 WHERE id = ?', [user.id]);

    console.log(`Krok 2 registrace: uživatel ${username.trim()} ověřen pomocí 2FA.`);
    res.json({
      success: true,
      username: user.username,
      message: 'Registrace byla úspěšně dokončena.'
    });
  } catch (err) {
    console.error('Chyba při registraci krok 2:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});


app.post('/api/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const totp_code = String(req.body.totp_code || '').trim();

    if (!username || !totp_code || totp_code.length !== 6) {
      return res.status(400).json({ error: 'Chybí povinné parametry: username, totp_code (6 číslic).' });
    }

    // Najdeme uživatele podle přezdívky
    const user = await get('SELECT id, username, two_factor_secret, is_2fa_verified, banned_at, role FROM Users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje.' });
    }

    if (user.banned_at) {
      return res.status(403).json({ error: 'Tento účet byl zablokován.' });
    }

    if (!user.is_2fa_verified) {
      return res.status(401).json({ error: 'Registrace nebyla dokončena. Nejprve potvrďte 2FA.' });
    }

    // Ověříme TOTP kód
    const tokenValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: String(totp_code).trim(),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      window: 1
    });

    if (!tokenValid) {
      return res.status(401).json({ error: 'Neplatný 2FA kód.' });
    }

    // Vygenerujeme JWT token (platnost 24 hodin)
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`Uživatel přihlášen: ${user.username}`);
    res.json({
      success: true,
      token,
      username: user.username,
      role: user.role || 'member',
      message: 'Přihlášení proběhlo úspěšně.'
    });
  } catch (err) {
    console.error('Chyba při přihlášení:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

// --- Hall of Fame ---
app.get('/api/hall-of-fame', requireAuth, async (req, res) => {
  try {
    const rows = await all('SELECT id, title, player_name, description, category, created_at FROM hall_of_fame ORDER BY created_at DESC, id DESC');
    res.json({ success: true, entries: rows || [] });
  } catch (err) {
    console.error('Chyba při načítání Síně slávy:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.post('/api/hall-of-fame', requireAuth, requireOwnerOrModerator, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const player_name = String(req.body.player_name || '').trim();
    const description = String(req.body.description || '').trim();
    const category = String(req.body.category || 'mvp').trim() || 'mvp';
    if (!title || !player_name) {
      return res.status(400).json({ error: 'Chybí povinné parametry: title, player_name.' });
    }
    const result = await run('INSERT INTO hall_of_fame (title, player_name, description, category) VALUES (?, ?, ?, ?)', [title, player_name, description, category]);
    res.json({ success: true, id: result.lastID, message: 'Záznam přidán do Síně slávy.' });
  } catch (err) {
    console.error('Chyba při přidání do Síně slávy:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.delete('/api/hall-of-fame/:id', requireAuth, requireTeamOwner, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Neplatné ID.' });
    await run('DELETE FROM hall_of_fame WHERE id = ?', [id]);
    res.json({ success: true, message: 'Záznam byl smazán.' });
  } catch (err) {
    console.error('Chyba při mazání ze Síně slávy:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

// --- Scrim Schedule ---
app.get('/api/scrims', requireAuth, async (req, res) => {
  try {
    const rows = await all('SELECT id, opponent, scrim_time, server_ip, status, result, created_by, created_at FROM scrims ORDER BY datetime(scrim_time) ASC, id ASC');
    res.json({ success: true, scrims: rows || [] });
  } catch (err) {
    console.error('Chyba při načítání scrimů:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.post('/api/scrims', requireAuth, requireScrimManager, async (req, res) => {
  try {
    const opponent = String(req.body.opponent || '').trim();
    const scrim_time = String(req.body.scrim_time || '').trim();
    const server_ip = String(req.body.server_ip || '').trim();
    const status = String(req.body.status || 'upcoming').trim() || 'upcoming';
    const result = String(req.body.result || 'pending').trim() || 'pending';
    if (!opponent || !scrim_time) {
      return res.status(400).json({ error: 'Chybí povinné parametry: opponent, scrim_time.' });
    }
    const created = await run('INSERT INTO scrims (opponent, scrim_time, server_ip, status, result, created_by) VALUES (?, ?, ?, ?, ?, ?)', [opponent, scrim_time, server_ip, status, result, req.auth.userId]);
    res.json({ success: true, id: created.lastID, message: 'Scrim byl naplánován.' });
  } catch (err) {
    console.error('Chyba při přidání scrimu:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.delete('/api/scrims/:id', requireAuth, requireTeamOwner, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Neplatné ID.' });
    await run('DELETE FROM scrims WHERE id = ?', [id]);
    res.json({ success: true, message: 'Scrim byl smazán.' });
  } catch (err) {
    console.error('Chyba při mazání scrimu:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

// --- Clips Gallery ---
app.get('/api/clips', requireAuth, async (req, res) => {
  try {
    const rows = await all(`
      SELECT c.id, c.title, c.url, c.description, c.created_at, c.user_id, u.username,
        (SELECT COUNT(*) FROM clip_votes v WHERE v.clip_id = c.id) AS votes
      FROM clips c JOIN Users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, clips: rows || [] });
  } catch (err) {
    console.error('Chyba při načítání klipů:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.post('/api/clips', requireAuth, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const url = String(req.body.url || '').trim();
    const description = String(req.body.description || '').trim();
    if (!title || !url) return res.status(400).json({ error: 'Chybí title nebo url.' });
    const created = await run('INSERT INTO clips (user_id, title, url, description) VALUES (?, ?, ?, ?)', [req.auth.userId, title, url, description]);
    res.json({ success: true, id: created.lastID });
  } catch (err) {
    console.error('Chyba při přidání klipu:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.post('/api/clips/:id/vote', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Neplatné ID.' });
    await run('INSERT OR IGNORE INTO clip_votes (clip_id, user_id) VALUES (?, ?)', [id, req.auth.userId]);
    const row = await get('SELECT COUNT(*) AS c FROM clip_votes WHERE clip_id = ?', [id]);
    res.json({ success: true, votes: row ? row.c : 0 });
  } catch (err) {
    console.error('Chyba při hlasování:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

// --- Stratbook ---
app.get('/api/stratbook', requireAuth, async (req, res) => {
  try {
    const rows = await all(`
      SELECT s.id, s.map_name, s.side, s.title, s.content, s.image_url, s.created_at, u.username
      FROM stratbook s LEFT JOIN Users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, strategies: rows || [] });
  } catch (err) {
    console.error('Chyba při načítání stratbooku:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.post('/api/stratbook', requireAuth, async (req, res) => {
  try {
    const map_name = String(req.body.map_name || '').trim();
    const side = String(req.body.side || 'attack').trim();
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '').trim();
    const image_url = String(req.body.image_url || '').trim();
    if (!title) return res.status(400).json({ error: 'Chybí title.' });
    const created = await run('INSERT INTO stratbook (user_id, map_name, side, title, content, image_url) VALUES (?, ?, ?, ?, ?, ?)', [req.auth.userId, map_name, side, title, content, image_url]);
    res.json({ success: true, id: created.lastID });
  } catch (err) {
    console.error('Chyba při přidání strategie:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});


// --- Events / Tournaments ---
app.get('/api/events', requireAuth, async (req, res) => {
  try {
    const events = await all('SELECT id, title, description, event_date, created_by FROM events WHERE datetime(event_date) >= datetime("now","-1 day") ORDER BY datetime(event_date) ASC');
    const responses = await all(`
      SELECT er.event_id, er.user_id, er.status, u.username
      FROM event_responses er
      JOIN Users u ON u.id = er.user_id
    `);
    const byEvent = new Map();
    responses.forEach(r => {
      if (!byEvent.has(r.event_id)) byEvent.set(r.event_id, { attending: [], declined: [] });
      const bucket = byEvent.get(r.event_id);
      const person = { id: r.user_id, username: r.username };
      if (r.status === 'attending') bucket.attending.push(person);
      else bucket.declined.push(person);
    });

    const result = events.map(e => {
      const b = byEvent.get(e.id) || { attending: [], declined: [] };
      const myResp = responses.find(r => r.event_id === e.id && r.user_id === req.auth.userId);
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        event_date: e.event_date,
        created_by: e.created_by,
        attending: b.attending,
        declined: b.declined,
        my_status: myResp ? myResp.status : null
      };
    });
    res.json({ success: true, events: result });
  } catch (err) {
    console.error('Chyba při načítání akcí:', err.message);
    res.status(500).json({ error: 'Akce se nepodařilo načíst.' });
  }
});

app.post('/api/events', requireAuth, requireTeamOwner, async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const event_date = typeof req.body.event_date === 'string' ? req.body.event_date.trim() : '';

  if (!title || !event_date) {
    return res.status(400).json({ error: 'Název a datum jsou povinné.' });
  }

  try {
    const result = await run(
      'INSERT INTO events (title, description, event_date, created_by) VALUES (?, ?, ?, ?)',
      [title, description || null, event_date, req.auth.userId]
    );
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    console.error('Chyba při vytváření akce:', err.message);
    res.status(500).json({ error: 'Akci se nepodařilo vytvořit.' });
  }
});

app.delete('/api/events/:id', requireAuth, requireTeamOwner, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Neplatné ID akce.' });
  }
  try {
    await run('DELETE FROM event_responses WHERE event_id = ?', [id]);
    await run('DELETE FROM events WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Chyba při mazání akce:', err.message);
    res.status(500).json({ error: 'Akci se nepodařilo smazat.' });
  }
});

app.get('/api/matches', requireAuth, async (req, res) => {
  try {
    const matches = await all('SELECT id, opponent, result, score, map_name, played_at, created_by FROM match_history ORDER BY datetime(played_at) DESC, id DESC');
    res.json({ success: true, matches });
  } catch (err) {
    console.error('Chyba při načítání zápasů:', err.message);
    res.status(500).json({ error: 'Zápasy se nepodařilo načíst.' });
  }
});

app.post('/api/matches', requireAuth, requireOwnerOrModerator, async (req, res) => {
  const opponent = typeof req.body.opponent === 'string' ? req.body.opponent.trim() : '';
  const result = req.body.result === 'win' || req.body.result === 'loss' ? req.body.result : '';
  const score = typeof req.body.score === 'string' ? req.body.score.trim() : '';
  const map_name = typeof req.body.map_name === 'string' ? req.body.map_name.trim() : '';

  if (!opponent || !result) {
    return res.status(400).json({ error: 'Soupeř a výsledek jsou povinné.' });
  }

  try {
    const inserted = await run(
      'INSERT INTO match_history (opponent, result, score, map_name, created_by) VALUES (?, ?, ?, ?, ?)',
      [opponent, result, score || null, map_name || null, req.auth.userId]
    );
    res.json({ success: true, id: inserted.lastID });
  } catch (err) {
    console.error('Chyba při ukládání zápasu:', err.message);
    res.status(500).json({ error: 'Zápas se nepodařilo uložit.' });
  }
});

app.delete('/api/matches/:id', requireAuth, requireTeamOwner, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Neplatné ID zápasu.' });
  }
  try {
    await run('DELETE FROM match_history WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Chyba při mazání zápasu:', err.message);
    res.status(500).json({ error: 'Zápas se nepodařilo smazat.' });
  }
});

app.get('/api/stream', requireAuth, async (req, res) => {
  try {
    const row = await get('SELECT stream_url, updated_at, updated_by FROM stream_settings WHERE id = 1');
    res.json({ success: true, stream_url: row ? (row.stream_url || '') : '', updated_at: row ? row.updated_at : null });
  } catch (err) {
    console.error('Chyba při načítání streamu:', err.message);
    res.status(500).json({ error: 'Stream se nepodařilo načíst.' });
  }
});

app.post('/api/stream', requireAuth, requireTeamOwner, async (req, res) => {
  const stream_url = typeof req.body.stream_url === 'string' ? req.body.stream_url.trim() : '';
  try {
    await run('UPDATE stream_settings SET stream_url = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [stream_url, req.auth.userId]);
    res.json({ success: true, stream_url });
  } catch (err) {
    console.error('Chyba při ukládání streamu:', err.message);
    res.status(500).json({ error: 'Stream se nepodařilo uložit.' });
  }
});

const MAP_VETO_POOL = ['Ascent', 'Bind', 'Haven', 'Split', 'Lotus', 'Sunset', 'Icebox', 'Pearl', 'Abyss'];

function canManageVeto(role) {
  return role === 'owner' || role === 'moderator' || role === 'captain';
}

app.get('/api/vetos', requireAuth, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM map_vetos ORDER BY created_at DESC, id DESC');
    const vetos = (rows || []).map((r) => ({
      id: r.id,
      opponent_name: r.opponent_name,
      match_format: r.match_format,
      map_pool: JSON.parse(r.map_pool || '[]'),
      banned_maps: JSON.parse(r.banned_maps || '[]'),
      picked_maps: JSON.parse(r.picked_maps || '[]'),
      status: r.status,
      created_by: r.created_by,
      created_at: r.created_at
    }));
    res.json({ success: true, vetos });
  } catch (err) {
    console.error('Chyba při načítání vet:', err.message);
    res.status(500).json({ error: 'Veta se nepodařilo načíst.' });
  }
});

app.post('/api/vetos', requireAuth, async (req, res) => {
  if (!canManageVeto(req.auth.role)) {
    return res.status(403).json({ error: 'Tato akce je pouze pro moderátory, kapitány a vlastníky.' });
  }
  const opponent_name = typeof req.body.opponent_name === 'string' ? req.body.opponent_name.trim() : '';
  const match_format = typeof req.body.match_format === 'string' ? req.body.match_format.trim().toUpperCase() : '';
  if (!opponent_name) {
    return res.status(400).json({ error: 'Chybí jméno soupeře.' });
  }
  if (match_format !== 'BO1' && match_format !== 'BO3') {
    return res.status(400).json({ error: 'Neplatný formát zápasu (BO1 nebo BO3).' });
  }
  try {
    const result = await run(
      'INSERT INTO map_vetos (opponent_name, match_format, map_pool, banned_maps, picked_maps, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [opponent_name, match_format, JSON.stringify(MAP_VETO_POOL), '[]', '[]', 'active', req.auth.userId]
    );
    const veto = await get('SELECT * FROM map_vetos WHERE id = ?', [result.lastID]);
    res.status(201).json({
      success: true,
      veto: {
        id: veto.id,
        opponent_name: veto.opponent_name,
        match_format: veto.match_format,
        map_pool: JSON.parse(veto.map_pool),
        banned_maps: JSON.parse(veto.banned_maps),
        picked_maps: JSON.parse(veto.picked_maps),
        status: veto.status,
        created_by: veto.created_by,
        created_at: veto.created_at
      }
    });
  } catch (err) {
    console.error('Chyba při vytváření veta:', err.message);
    res.status(500).json({ error: 'Veto se nepodařilo vytvořit.' });
  }
});

app.post('/api/vetos/:id/action', requireAuth, async (req, res) => {
  if (!canManageVeto(req.auth.role)) {
    return res.status(403).json({ error: 'Tato akce je pouze pro moderátory, kapitány a vlastníky.' });
  }
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Neplatné ID veta.' });
  }
  const action = typeof req.body.action === 'string' ? req.body.action.trim().toLowerCase() : '';
  const map = typeof req.body.map === 'string' ? req.body.map.trim() : '';
  if (action !== 'ban' && action !== 'pick') {
    return res.status(400).json({ error: 'Neplatná akce (ban nebo pick).' });
  }
  if (!MAP_VETO_POOL.includes(map)) {
    return res.status(400).json({ error: 'Neplatná mapa.' });
  }
  try {
    const veto = await get('SELECT * FROM map_vetos WHERE id = ?', [id]);
    if (!veto) return res.status(404).json({ error: 'Veto nebylo nalezeno.' });
    if (veto.status !== 'active') {
      return res.status(400).json({ error: 'Veto již bylo ukončeno.' });
    }
    const banned = JSON.parse(veto.banned_maps || '[]');
    const picked = JSON.parse(veto.picked_maps || '[]');
    if (banned.includes(map) || picked.includes(map)) {
      return res.status(400).json({ error: 'Mapa již byla použita.' });
    }
    if (action === 'ban') banned.push(map);
    else picked.push(map);

    const remaining = MAP_VETO_POOL.filter((m) => !banned.includes(m) && !picked.includes(m));
    const threshold = veto.match_format === 'BO1' ? 1 : 3;
    const status = remaining.length <= threshold ? 'finished' : 'active';

    await run(
      'UPDATE map_vetos SET banned_maps = ?, picked_maps = ?, status = ? WHERE id = ?',
      [JSON.stringify(banned), JSON.stringify(picked), status, id]
    );

    const updated = await get('SELECT * FROM map_vetos WHERE id = ?', [id]);
    res.json({
      success: true,
      veto: {
        id: updated.id,
        opponent_name: updated.opponent_name,
        match_format: updated.match_format,
        map_pool: JSON.parse(updated.map_pool),
        banned_maps: JSON.parse(updated.banned_maps),
        picked_maps: JSON.parse(updated.picked_maps),
        status: updated.status,
        created_by: updated.created_by,
        created_at: updated.created_at
      }
    });
  } catch (err) {
    console.error('Chyba při akci veta:', err.message);
    res.status(500).json({ error: 'Akce veta se nepodařila.' });
  }
});

app.post('/api/events/:id/rsvp', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body.status;
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Neplatné ID akce.' });
  }
  if (status !== 'attending' && status !== 'declined') {
    return res.status(400).json({ error: 'Neplatný status.' });
  }
  try {
    const event = await get('SELECT id FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ error: 'Akce nebyla nalezena.' });
    await run('INSERT OR REPLACE INTO event_responses (event_id, user_id, status) VALUES (?, ?, ?)', [id, req.auth.userId, status]);
    res.json({ success: true });
  } catch (err) {
    console.error('Chyba při RSVP:', err.message);
    res.status(500).json({ error: 'Odpověď se nepodařilo uložit.' });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function handleSession(req, res) {
  try {
    const user = await get(
      'SELECT username, role, game_role, gaming_rank, riot_id, steam_profile, is_2fa_verified, bio, avatar_url FROM Users WHERE id = ?',
      [req.auth.userId]
    );

    if (!user || !user.is_2fa_verified) {
      return res.status(401).json({ error: 'Účet není aktivní.' });
    }

    res.json({ success: true, username: user.username, role: user.role || 'member', game_role: user.game_role || '', gaming_rank: user.gaming_rank || '', riot_id: user.riot_id || '', steam_profile: user.steam_profile || '', bio: user.bio || '', avatar_url: user.avatar_url || '' });
  } catch (err) {
    console.error('Chyba při ověřování relace:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
}

app.get('/api/session', requireAuth, handleSession);
app.get('/api/me', requireAuth, handleSession);
app.get('/api/user', requireAuth, handleSession);

app.get('/api/community/players', requireAuth, async (req, res) => {
  try {
    const players = await all(
      'SELECT id, username, role, game_role, gaming_rank, riot_id, steam_profile FROM Users WHERE is_2fa_verified = 1 AND banned_at IS NULL ORDER BY username COLLATE NOCASE'
    );
    res.json({
      success: true,
      players: players.map(player => ({
        id: player.id,
        username: player.username,
        role: player.role || 'member',
        game_role: player.game_role || '',
        gaming_rank: player.gaming_rank || '',
        riot_id: player.riot_id || '',
        steam_profile: player.steam_profile || '',
        isCurrentUser: player.id === req.auth.userId
      }))
    });
  } catch (err) {
    console.error('Chyba při načítání hráčů:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const users = await all(
      'SELECT id, username, role, game_role, gaming_rank, riot_id, steam_profile FROM Users WHERE is_2fa_verified = 1 AND banned_at IS NULL ORDER BY username COLLATE NOCASE'
    );
    res.json({ success: true, users });
  } catch (err) {
    console.error('Chyba při načítání uživatelů:', err.message);
    res.status(500).json({ error: 'Uživatele se nepodařilo načíst.' });
  }
});

app.put('/api/users/me', requireAuth, async (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const bio = typeof req.body.bio === 'string' ? req.body.bio.trim() : '';
  const avatar_url = typeof req.body.avatar_url === 'string' ? req.body.avatar_url.trim() : '';
  const gaming_rank = typeof req.body.gaming_rank === 'string' ? req.body.gaming_rank.trim().slice(0, 64) : (typeof req.body.rank === 'string' ? req.body.rank.trim().slice(0, 64) : '');
  const riot_id = typeof req.body.riot_id === 'string' ? req.body.riot_id.trim().slice(0, 64) : '';
  const steam_profile = typeof req.body.steam_profile === 'string' ? req.body.steam_profile.trim().slice(0, 200) : '';

  if (!username || username.length < 2 || username.length > 32) {
    return res.status(400).json({ error: 'Přezdívka musí mít 2 až 32 znaků.' });
  }

  try {
    const existing = await get('SELECT id FROM Users WHERE username = ? AND id != ?', [username, req.auth.userId]);
    if (existing) {
      return res.status(409).json({ error: 'Tato přezdívka je již obsazená.' });
    }

    await run(
      'UPDATE Users SET username = ?, bio = ?, avatar_url = ?, gaming_rank = ?, riot_id = ?, steam_profile = ? WHERE id = ?',
      [username, bio || null, avatar_url || null, gaming_rank || null, riot_id || null, steam_profile || null, req.auth.userId]
    );

    const user = await get(
      'SELECT id, username, role, bio, avatar_url, gaming_rank, riot_id, steam_profile FROM Users WHERE id = ?',
      [req.auth.userId]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'member',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        gaming_rank: user.gaming_rank || '',
        riot_id: user.riot_id || '',
        steam_profile: user.steam_profile || ''
      }
    });
  } catch (err) {
    console.error('Chyba při aktualizaci profilu:', err.message);
    res.status(500).json({ error: 'Profil se nepodařilo aktualizovat.' });
  }
});


app.get('/api/direct-messages/:otherUserId', requireAuth, async (req, res) => {
  const otherUserId = Number(req.params.otherUserId);
  if (!Number.isSafeInteger(otherUserId) || otherUserId <= 0) {
    return res.status(400).json({ error: 'Neplatný uživatel.' });
  }
  try {
    const otherUser = await get('SELECT id, username FROM Users WHERE id = ? AND is_2fa_verified = 1', [otherUserId]);
    if (!otherUser) return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
    const rows = await all(
      `SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.image_url, dm.created_at, u.username AS sender_name,
              u.role AS sender_role, u.gaming_rank AS sender_gaming_rank
       FROM direct_messages dm
       JOIN Users u ON u.id = dm.sender_id
       WHERE (dm.sender_id = ? AND dm.receiver_id = ?) OR (dm.sender_id = ? AND dm.receiver_id = ?)
       ORDER BY dm.id ASC`,
      [req.auth.userId, otherUserId, otherUserId, req.auth.userId]
    );
    const reactionsByMessage = await loadReactionsByMessage(rows.map(row => row.id), req.auth.userId);
    const messages = rows.map(row => ({
      id: row.id,
      sender_id: row.sender_id,
      receiver_id: row.receiver_id,
      content: row.content,
      image_url: row.image_url || '',
      created_at: row.created_at,
      sender_name: row.sender_name,
      sender_role: row.sender_role || 'member',
      sender_gaming_rank: row.sender_gaming_rank || '',
      isOwn: row.sender_id === req.auth.userId,
      reactions: reactionsByMessage.get(row.id) || []
    }));
    res.json({ success: true, user: otherUser, messages });
  } catch (err) {
    console.error('Chyba při načítání soukromých zpráv:', err.message);
    res.status(500).json({ error: 'Soukromé zprávy se nepodařilo načíst.' });
  }
});

app.post('/api/direct-messages', requireAuth, async (req, res) => {
  const receiverId = Number(req.body.receiver_id);
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  const imageUrl = typeof req.body.image_url === 'string' ? req.body.image_url.trim() : (typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : '');
  if (!Number.isSafeInteger(receiverId) || receiverId <= 0) {
    return res.status(400).json({ error: 'Neplatný příjemce.' });
  }
  if (!content && !imageUrl) {
    return res.status(400).json({ error: 'Zpráva musí obsahovat text nebo obrázek.' });
  }
  if (content.length > 1000) {
    return res.status(400).json({ error: 'Zpráva musí mít nejvýše 1000 znaků.' });
  }
  if (receiverId === req.auth.userId) {
    return res.status(400).json({ error: 'Nemůžete psát sami sobě.' });
  }
  try {
    const receiver = await get('SELECT id, username FROM Users WHERE id = ? AND is_2fa_verified = 1 AND banned_at IS NULL', [receiverId]);
    if (!receiver) return res.status(404).json({ error: 'Příjemce nebyl nalezen.' });
    const result = await run(
      'INSERT INTO direct_messages (sender_id, receiver_id, content, image_url) VALUES (?, ?, ?, ?)',
      [req.auth.userId, receiverId, content, imageUrl || null]
    );
    const message = await get('SELECT id, sender_id, receiver_id, content, image_url, created_at FROM direct_messages WHERE id = ?', [result.lastID]);
    // Notifikace o nové soukromé zprávě
    try {
      await run(
        'INSERT INTO notifications (user_id, actor_id, type, message_id, content, message) VALUES (?, ?, ?, ?, ?, ?)',
        [receiverId, req.auth.userId, 'dm', result.lastID, content, content]
      );
      const users = await all('SELECT id, username FROM Users WHERE is_2fa_verified = 1 AND banned_at IS NULL');
      const mentioned = new Set();
      const mentionRegex = /@([A-Za-z0-9_.-]+)/g;
      let m;
      while ((m = mentionRegex.exec(content)) !== null) {
        const found = users.find(u => u.username.toLowerCase() === m[1].toLowerCase());
        if (found && found.id !== req.auth.userId && found.id !== receiverId) mentioned.add(found.id);
      }
      for (const uid of mentioned) {
        await run(
          'INSERT INTO notifications (user_id, actor_id, type, message_id, content, message) VALUES (?, ?, ?, ?, ?, ?)',
          [uid, req.auth.userId, 'mention', result.lastID, content, content]
        );
      }
    } catch (notifyErr) {
      console.error('Chyba při vytváření notifikace DM:', notifyErr.message);
    }
    res.status(201).json({
      success: true,
      message: { ...message, isOwn: true }
    });
  } catch (err) {
    console.error('Chyba při odesílání soukromé zprávy:', err.message);
    res.status(500).json({ error: 'Soukromou zprávu se nepodařilo odeslat.' });
  }
});

app.post('/api/community/members/:id/ban', requireAuth, requireTeamOwner, async (req, res) => {
  const memberId = Number(req.params.id);
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 200) : '';
  if (!Number.isSafeInteger(memberId) || memberId <= 0) return res.status(400).json({ error: 'Neplatný člen týmu.' });

  try {
    const member = await get('SELECT id, username, role, is_2fa_verified FROM Users WHERE id = ?', [memberId]);
    if (!member || !member.is_2fa_verified) return res.status(404).json({ error: 'Aktivní člen nebyl nalezen.' });
    if (member.id === req.auth.userId || member.role === 'owner') {
      return res.status(403).json({ error: 'Vlastníka týmu nelze zabanovat.' });
    }

    await run(
      'UPDATE Users SET is_2fa_verified = 0, banned_at = CURRENT_TIMESTAMP, ban_reason = ? WHERE id = ?',
      [reason, memberId]
    );
    res.json({ success: true, username: member.username });
  } catch (err) {
    console.error('Chyba při banování člena:', err.message);
    res.status(500).json({ error: 'Člena se nepodařilo zablokovat.' });
  }
});

app.delete('/api/community/members/:id', requireAuth, requireTeamOwner, async (req, res) => {
  const memberId = Number(req.params.id);
  if (!Number.isSafeInteger(memberId) || memberId <= 0) return res.status(400).json({ error: 'Neplatný člen týmu.' });

  try {
    const member = await get('SELECT id, username, role, is_2fa_verified FROM Users WHERE id = ?', [memberId]);
    if (!member || !member.is_2fa_verified) return res.status(404).json({ error: 'Aktivní člen nebyl nalezen.' });
    if (member.id === req.auth.userId || member.role === 'owner') {
      return res.status(403).json({ error: 'Vlastníka týmu nelze kicknout.' });
    }

    await run(
      "UPDATE Users SET is_2fa_verified = 0, two_factor_secret = '', banned_at = NULL, ban_reason = NULL WHERE id = ?",
      [memberId]
    );
    res.json({ success: true, username: member.username });
  } catch (err) {
    console.error('Chyba při kicknutí člena:', err.message);
    res.status(500).json({ error: 'Člena se nepodařilo odebrat.' });
  }
});

app.get('/api/community/messages', requireAuth, async (req, res) => {
  const { channel } = req.query;

  try {
    const channelRecord = await findCommunityChannel(channel);
    if (!channelRecord) return res.status(404).json({ error: 'Textový kanál nebyl nalezen.' });
    if (channelRecord.group_type === 'owner' && req.auth.role !== 'owner') {
      return res.status(403).json({ error: 'Do tohoto kanálu nemáš přístup.' });
    }
    const rows = await all(
      `SELECT message.id, message.author_name, message.body, message.image_url, message.is_pinned, message.created_at,
        message.parent_message_id, message.edited_at, message.user_id,
        u.role AS author_role, u.gaming_rank AS author_gaming_rank,
        parent.author_name AS reply_author_name, parent.body AS reply_body
      FROM CommunityMessages AS message
      LEFT JOIN CommunityMessages AS parent ON parent.id = message.parent_message_id
      LEFT JOIN Users AS u ON u.id = message.user_id
      WHERE message.channel_id = ? ORDER BY message.id DESC LIMIT 100`,
      [channel]
    );
    const reactionsByMessage = await loadReactionsByMessage(rows.map(row => row.id), req.auth.userId);
    const messages = rows.reverse().map(({ user_id, author_role, author_gaming_rank, ...message }) => ({
      ...message,
      author_role: author_role || 'member',
      author_gaming_rank: author_gaming_rank || '',
      isOwn: user_id === req.auth.userId,
      reactions: reactionsByMessage.get(message.id) || []
    }));
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Chyba při načítání zpráv:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.post('/api/community/messages', requireAuth, async (req, res) => {
  const { channelId, body, replyTo = null, image_url, imageUrl } = req.body;
  const messageBody = typeof body === 'string' ? body.trim() : '';
  const imageValue = typeof image_url === 'string' ? image_url.trim() : (typeof imageUrl === 'string' ? imageUrl.trim() : '');

  if (!messageBody && !imageValue) {
    return res.status(400).json({ error: 'Zpráva musí mít 1 až 1000 znaků nebo obrázek.' });
  }
  if (messageBody.length > 1000) {
    return res.status(400).json({ error: 'Zpráva musí mít nejvýše 1000 znaků.' });
  }
  if (replyTo !== null && (!Number.isSafeInteger(Number(replyTo)) || Number(replyTo) <= 0)) {
    return res.status(400).json({ error: 'Neplatná cílová zpráva.' });
  }

  try {
    const channelRecord = await findCommunityChannel(channelId);
    if (!channelRecord) return res.status(404).json({ error: 'Textový kanál nebyl nalezen.' });
    if (channelRecord.group_type === 'owner' && req.auth.role !== 'owner') {
      return res.status(403).json({ error: 'Do tohoto kanálu nemáš přístup.' });
    }
    if (channelRecord.is_readonly && req.auth.role !== 'owner') {
      return res.status(403).json({ error: 'Nemáte oprávnění psát do tohoto kanálu' });
    }
    const user = await get(
      'SELECT username, is_2fa_verified FROM Users WHERE id = ?',
      [req.auth.userId]
    );
    if (!user || !user.is_2fa_verified) {
      return res.status(401).json({ error: 'Účet není aktivní.' });
    }

    if (replyTo !== null) {
      const parent = await get('SELECT id, channel_id FROM CommunityMessages WHERE id = ?', [Number(replyTo)]);
      if (!parent || parent.channel_id !== channelId) {
        return res.status(404).json({ error: 'Zpráva pro odpověď nebyla nalezena v tomto kanálu.' });
      }
    }

    const result = await run(
      'INSERT INTO CommunityMessages (channel_id, user_id, author_name, body, image_url, parent_message_id) VALUES (?, ?, ?, ?, ?, ?)',
      [channelId, req.auth.userId, user.username, messageBody, imageValue || null, replyTo === null ? null : Number(replyTo)]
    );
    const message = await get(
      `SELECT message.id, message.author_name, message.body, message.image_url, message.is_pinned, message.created_at,
        message.parent_message_id, message.edited_at,
        u.role AS author_role, u.gaming_rank AS author_gaming_rank,
        parent.author_name AS reply_author_name, parent.body AS reply_body
      FROM CommunityMessages AS message
      LEFT JOIN CommunityMessages AS parent ON parent.id = message.parent_message_id
      LEFT JOIN Users AS u ON u.id = message.user_id
      WHERE message.id = ?`,
      [result.lastID]
    );
    // Notifikace o zmínkách @username
    try {
      const users = await all('SELECT id, username FROM Users WHERE is_2fa_verified = 1 AND banned_at IS NULL');
      const mentioned = new Set();
      const mentionRegex = /@([A-Za-z0-9_.-]+)/g;
      let m;
      while ((m = mentionRegex.exec(messageBody)) !== null) {
        const found = users.find(u => u.username.toLowerCase() === m[1].toLowerCase());
        if (found && found.id !== req.auth.userId) mentioned.add(found.id);
      }
      for (const uid of mentioned) {
        await run(
          'INSERT INTO notifications (user_id, actor_id, type, message_id, content, message) VALUES (?, ?, ?, ?, ?, ?)',
          [uid, req.auth.userId, 'mention', result.lastID, messageBody, messageBody]
        );
      }
    } catch (notifyErr) {
      console.error('Chyba při vytváření notifikace zmínky:', notifyErr.message);
    }
    const enrichedMessage = { ...message, author_role: message.author_role || 'member', author_gaming_rank: message.author_gaming_rank || '', isOwn: true };
    res.status(201).json({ success: true, message: enrichedMessage });
  } catch (err) {
    console.error('Chyba při ukládání zprávy:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.patch('/api/community/messages/:id', requireAuth, async (req, res) => {
  const messageId = Number(req.params.id);
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
  if (!Number.isSafeInteger(messageId) || messageId <= 0) {
    return res.status(400).json({ error: 'Neplatná zpráva.' });
  }
  if (!body || body.length > 1000) {
    return res.status(400).json({ error: 'Zpráva musí mít 1 až 1000 znaků.' });
  }

  try {
    const message = await get('SELECT id, user_id FROM CommunityMessages WHERE id = ?', [messageId]);
    if (!message) return res.status(404).json({ error: 'Zpráva nebyla nalezena.' });
    if (message.user_id !== req.auth.userId) {
      return res.status(403).json({ error: 'Upravit můžeš pouze vlastní zprávu.' });
    }

    await run('UPDATE CommunityMessages SET body = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?', [body, messageId]);
    const updated = await get(
      `SELECT message.id, message.author_name, message.body, message.created_at,
        message.parent_message_id, message.edited_at,
        parent.author_name AS reply_author_name, parent.body AS reply_body
      FROM CommunityMessages AS message
      LEFT JOIN CommunityMessages AS parent ON parent.id = message.parent_message_id
      WHERE message.id = ?`,
      [messageId]
    );
    res.json({ success: true, message: { ...updated, isOwn: true } });
  } catch (err) {
    console.error('Chyba při úpravě zprávy:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.delete('/api/community/messages/:id', requireAuth, async (req, res) => {
  const messageId = Number(req.params.id);
  if (!Number.isSafeInteger(messageId) || messageId <= 0) {
    return res.status(400).json({ error: 'Neplatná zpráva.' });
  }

  try {
    const message = await get('SELECT id, user_id FROM CommunityMessages WHERE id = ?', [messageId]);
    if (!message) return res.status(404).json({ error: 'Zpráva nebyla nalezena.' });
    if (message.user_id !== req.auth.userId && req.auth.role !== 'owner') {
      return res.status(403).json({ error: 'Smazat můžeš pouze vlastní zprávu.' });
    }

    await run('UPDATE CommunityMessages SET parent_message_id = NULL WHERE parent_message_id = ?', [messageId]);
    await run('DELETE FROM message_reactions WHERE message_id = ?', [messageId]);
    await run('DELETE FROM CommunityMessages WHERE id = ?', [messageId]);
    res.json({ success: true, deletedId: messageId });
  } catch (err) {
    console.error('Chyba při mazání zprávy:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.put('/api/messages/:id/pin', requireAuth, requireOwnerOrModerator, async (req, res) => {
  const messageId = Number(req.params.id);
  if (!Number.isSafeInteger(messageId) || messageId <= 0) {
    return res.status(400).json({ error: 'Neplatná zpráva.' });
  }

  try {
    const message = await get('SELECT id, channel_id, is_pinned FROM CommunityMessages WHERE id = ?', [messageId]);
    if (!message) return res.status(404).json({ error: 'Zpráva nebyla nalezena.' });

    const newPinned = message.is_pinned ? 0 : 1;
    await run('UPDATE CommunityMessages SET is_pinned = ? WHERE id = ?', [newPinned, messageId]);
    res.json({ success: true, id: messageId, channel_id: message.channel_id, is_pinned: newPinned });
  } catch (err) {
    console.error('Chyba při připínání zprávy:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.get('/api/channels/:id/pins', requireAuth, async (req, res) => {
  const channelId = req.params.id;
  try {
    const channelRecord = await findCommunityChannel(channelId);
    if (!channelRecord) return res.status(404).json({ error: 'Textový kanál nebyl nalezen.' });
    if (channelRecord.group_type === 'owner' && req.auth.role !== 'owner') {
      return res.status(403).json({ error: 'Do tohoto kanálu nemáš přístup.' });
    }

    const rows = await all(
      `SELECT message.id, message.author_name, message.body, message.image_url, message.is_pinned, message.created_at,
        message.parent_message_id, message.edited_at, message.user_id,
        u.role AS author_role, u.gaming_rank AS author_gaming_rank
      FROM CommunityMessages AS message
      LEFT JOIN Users AS u ON u.id = message.user_id
      WHERE message.channel_id = ? AND message.is_pinned = 1 ORDER BY message.id DESC`,
      [channelId]
    );
    const messages = rows.map(({ user_id, author_role, author_gaming_rank, ...message }) => ({
      ...message,
      author_role: author_role || 'member',
      author_gaming_rank: author_gaming_rank || '',
      isOwn: user_id === req.auth.userId
    }));
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Chyba při načítání připnutých zpráv:', err.message);
    res.status(500).json({ error: 'Interní chyba serveru.' });
  }
});

app.get('/api/wiki', requireAuth, async (req, res) => {
  try {
    const rows = await all(
      `SELECT wp.id, wp.title, wp.content, wp.updated_at, wp.updated_by, u.username AS updated_by_name
       FROM wiki_pages AS wp
       LEFT JOIN Users AS u ON u.id = wp.updated_by
       ORDER BY wp.updated_at DESC, wp.id DESC`
    );
    const pages = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      updated_by: row.updated_by,
      updated_by_name: row.updated_by_name || 'Neznámý',
      updated_at: row.updated_at
    }));
    res.json({ success: true, pages });
  } catch (err) {
    console.error('Chyba při načítání wiki:', err.message);
    res.status(500).json({ error: 'Wiki stránky se nepodařilo načíst.' });
  }
});

app.post('/api/wiki', requireAuth, requireOwnerOrModerator, async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body.content === 'string' ? req.body.content : '';
  if (!title || title.length > 120) {
    return res.status(400).json({ error: 'Nadpis musí mít 1 až 120 znaků.' });
  }
  if (content.length > 20000) {
    return res.status(400).json({ error: 'Obsah je příliš dlouhý.' });
  }
  try {
    const result = await run(
      'INSERT INTO wiki_pages (title, content, updated_by, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [title, content, req.auth.userId]
    );
    res.status(201).json({ success: true, id: result.lastID, title, content, updated_by: req.auth.userId, updated_by_name: req.auth.username, updated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Chyba při vytváření wiki stránky:', err.message);
    res.status(500).json({ error: 'Wiki stránku se nepodařilo vytvořit.' });
  }
});

app.put('/api/wiki/:id', requireAuth, requireOwnerOrModerator, async (req, res) => {
  const pageId = Number(req.params.id);
  if (!Number.isSafeInteger(pageId) || pageId <= 0) {
    return res.status(400).json({ error: 'Neplatná stránka.' });
  }
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body.content === 'string' ? req.body.content : '';
  if (!title || title.length > 120) {
    return res.status(400).json({ error: 'Nadpis musí mít 1 až 120 znaků.' });
  }
  if (content.length > 20000) {
    return res.status(400).json({ error: 'Obsah je příliš dlouhý.' });
  }
  try {
    const page = await get('SELECT id FROM wiki_pages WHERE id = ?', [pageId]);
    if (!page) return res.status(404).json({ error: 'Stránka nebyla nalezena.' });
    await run(
      'UPDATE wiki_pages SET title = ?, content = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, req.auth.userId, pageId]
    );
    const updated = await get(
      `SELECT wp.id, wp.title, wp.content, wp.updated_at, wp.updated_by, u.username AS updated_by_name
       FROM wiki_pages AS wp LEFT JOIN Users AS u ON u.id = wp.updated_by WHERE wp.id = ?`,
      [pageId]
    );
    res.json({ success: true, page: {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      updated_by: updated.updated_by,
      updated_by_name: updated.updated_by_name || 'Neznámý',
      updated_at: updated.updated_at
    }});
  } catch (err) {
    console.error('Chyba při úpravě wiki stránky:', err.message);
    res.status(500).json({ error: 'Wiki stránku se nepodařilo upravit.' });
  }
});

app.delete('/api/wiki/:id', requireAuth, requireTeamOwner, async (req, res) => {
  const pageId = Number(req.params.id);
  if (!Number.isSafeInteger(pageId) || pageId <= 0) {
    return res.status(400).json({ error: 'Neplatná stránka.' });
  }
  try {
    const page = await get('SELECT id FROM wiki_pages WHERE id = ?', [pageId]);
    if (!page) return res.status(404).json({ error: 'Stránka nebyla nalezena.' });
    await run('DELETE FROM wiki_pages WHERE id = ?', [pageId]);
    res.json({ success: true, deletedId: pageId });
  } catch (err) {
    console.error('Chyba při mazání wiki stránky:', err.message);
    res.status(500).json({ error: 'Wiki stránku se nepodařilo smazat.' });
  }
});

app.post('/api/messages/:id/reactions', requireAuth, async (req, res) => {
  const messageId = Number(req.params.id);
  if (!Number.isSafeInteger(messageId) || messageId <= 0) {
    return res.status(400).json({ error: 'Neplatná zpráva.' });
  }
  const emoji = typeof req.body.emoji === 'string' ? req.body.emoji.trim() : '';
  if (!emoji || emoji.length > 16) {
    return res.status(400).json({ error: 'Neplatné emoji.' });
  }

  try {
    let isDirect = false;
    let message = await get('SELECT id, channel_id, user_id FROM CommunityMessages WHERE id = ?', [messageId]);
    if (!message) {
      const dm = await get('SELECT id, sender_id, receiver_id FROM direct_messages WHERE id = ?', [messageId]);
      if (dm) {
        message = dm;
        isDirect = true;
      }
    }
    if (!message) return res.status(404).json({ error: 'Zpráva nebyla nalezena.' });

    if (isDirect) {
      if (message.sender_id !== req.auth.userId && message.receiver_id !== req.auth.userId) {
        return res.status(403).json({ error: 'K této zprávě nemáš přístup.' });
      }
    } else {
      const channelRecord = await findCommunityChannel(message.channel_id);
      if (!channelRecord) return res.status(404).json({ error: 'Textový kanál nebyl nalezen.' });
      if (channelRecord.group_type === 'owner' && req.auth.role !== 'owner') {
        return res.status(403).json({ error: 'Do tohoto kanálu nemáš přístup.' });
      }
    }

    const existing = await get(
      'SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [messageId, req.auth.userId, emoji]
    );

    let reacted;
    if (existing) {
      await run('DELETE FROM message_reactions WHERE id = ?', [existing.id]);
      reacted = false;
    } else {
      try {
        await run(
          'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
          [messageId, req.auth.userId, emoji]
        );
        reacted = true;
      } catch (err) {
        if (/UNIQUE/i.test(err.message || '')) {
          await run(
            'DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
            [messageId, req.auth.userId, emoji]
          );
          reacted = false;
        } else {
          throw err;
        }
      }
    }

    const reactions = await getReactionsForMessage(messageId, req.auth.userId);
    res.json({ success: true, reacted, reactions });
  } catch (err) {
    console.error('Chyba při reakci na zprávu:', err.message);
    res.status(500).json({ error: 'Reakci se nepodařilo uložit.' });
  }
});


app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const rows = await all(
      `SELECT n.id, n.type, n.message_id, n.content, n.message, n.is_read, n.created_at, n.actor_id,
              u.username AS actor_name, cm.channel_id
       FROM notifications n
       LEFT JOIN Users u ON u.id = n.actor_id
       LEFT JOIN CommunityMessages cm ON cm.id = n.message_id
       WHERE n.user_id = ?
       ORDER BY n.id DESC
       LIMIT 200`,
      [req.auth.userId]
    );
    const notifications = rows.map(row => ({
      id: row.id,
      type: row.type,
      message_id: row.message_id,
      content: row.content,
      message: row.message || row.content,
      is_read: !!row.is_read,
      created_at: row.created_at,
      actor_id: row.actor_id,
      actor_name: row.actor_name,
      channel_id: row.channel_id || null
    }));
    res.json({ success: true, notifications, count: notifications.filter(n => !n.is_read).length });
  } catch (err) {
    console.error('Chyba při načítání notifikací:', err.message);
    res.status(500).json({ error: 'Notifikace se nepodařilo načíst.' });
  }
});

app.post('/api/notifications/read-all', requireAuth, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.auth.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Chyba při označování notifikací:', err.message);
    res.status(500).json({ error: 'Notifikace se nepodařilo označit.' });
  }
});

app.post('/api/notifications/read', requireAuth, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.auth.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Chyba při označování notifikací:', err.message);
    res.status(500).json({ error: 'Notifikace se nepodařilo označit.' });
  }
});

app.put('/api/users/:id/role', requireAuth, requireTeamOwner, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Neplatný uživatel.' });
  }
  const role = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : '';
  const allowedRoles = ['member', 'moderator', 'captain', 'vip'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Neplatná role.' });
  }
  try {
    const target = await get('SELECT id, role FROM Users WHERE id = ? AND is_2fa_verified = 1 AND banned_at IS NULL', [userId]);
    if (!target) return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
    if (target.role === 'owner') {
      return res.status(403).json({ error: 'Roli vlastníka nelze měnit.' });
    }
    if (userId === req.auth.userId) {
      return res.status(400).json({ error: 'Nemůžete měnit vlastní roli.' });
    }
    await run('UPDATE Users SET role = ? WHERE id = ?', [role, userId]);
    res.json({ success: true, user: { id: userId, role } });
  } catch (err) {
    console.error('Chyba při změně role:', err.message);
    res.status(500).json({ error: 'Roli se nepodařilo změnit.' });
  }
});

app.put('/api/users/me/rank', requireAuth, async (req, res) => {
  const gaming_rank = typeof req.body.gaming_rank === 'string'
    ? req.body.gaming_rank.trim().slice(0, 64)
    : (typeof req.body.rank === 'string' ? req.body.rank.trim().slice(0, 64) : '');
  try {
    await run('UPDATE Users SET gaming_rank = ? WHERE id = ?', [gaming_rank || null, req.auth.userId]);
    const user = await get('SELECT id, username, role, gaming_rank FROM Users WHERE id = ?', [req.auth.userId]);
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role || 'member', gaming_rank: user.gaming_rank || '' } });
  } catch (err) {
    console.error('Chyba při nastavení ranku:', err.message);
    res.status(500).json({ error: 'Rank se nepodařilo nastavit.' });
  }
});




app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nebyl nahrán žádný soubor.' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url, filename: req.file.filename });
});

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
  console.log(`Admin token: ${ADMIN_TOKEN ? 'nastaven' : 'NENÍ NASTAVEN (viz .env)'}`);
});

module.exports = { app, db };
