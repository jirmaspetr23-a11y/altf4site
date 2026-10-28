const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Chyba při připojení k databázi:', err.message);
    process.exit(1);
  }
  console.log('Připojeno k SQLite databázi:', dbPath);
});

db.serialize(() => {
  // Tabulka InviteCodes – jednorázové registrační kódy
  db.run(`
    CREATE TABLE IF NOT EXISTS InviteCodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Chyba při vytváření tabulky InviteCodes:', err.message);
    } else {
      console.log('Tabulka InviteCodes připravena.');
    }
  });

  // Tabulka Users – registrovaní uživatelé
  db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      two_factor_secret TEXT NOT NULL,
      is_2fa_verified INTEGER DEFAULT 0,
      role TEXT NOT NULL DEFAULT 'member',
      banned_at DATETIME,
      ban_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Chyba při vytváření tabulky Users:', err.message);
    } else {
      console.log('Tabulka Users připravena.');
    }
  });

  db.run('ALTER TABLE Users ADD COLUMN role TEXT NOT NULL DEFAULT \'member\'', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Chyba při migraci rolí:', err.message);
    }
  });
  db.run('ALTER TABLE Users ADD COLUMN banned_at DATETIME', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Chyba při migraci banů:', err.message);
    }
  });
  db.run('ALTER TABLE Users ADD COLUMN ban_reason TEXT', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Chyba při migraci důvodu banu:', err.message);
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS CommunityMessages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL CHECK(length(body) <= 1000),
      parent_message_id INTEGER,
      edited_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Chyba při vytváření tabulky CommunityMessages:', err.message);
    } else {
      console.log('Tabulka CommunityMessages připravena.');
    }
  });

  db.run('ALTER TABLE CommunityMessages ADD COLUMN parent_message_id INTEGER', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Chyba při migraci odpovědí zpráv:', err.message);
    }
  });

  db.run('ALTER TABLE CommunityMessages ADD COLUMN edited_at DATETIME', (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Chyba při migraci úprav zpráv:', err.message);
    }
  });

  db.run('CREATE INDEX IF NOT EXISTS idx_community_messages_channel_id ON CommunityMessages(channel_id, id)');

  // Tabulka skupin kanálů (zalozky) – vlastníci mohou vytvářet, mazat a přejmenovávat
  db.run(`
    CREATE TABLE IF NOT EXISTS CommunityChannelGroups (
      group_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
  db.run('INSERT OR IGNORE INTO CommunityChannelGroups (group_id, name, type, sort_order) VALUES (?, ?, ?, ?)', ['info', 'INFORMACE', 'info', 1]);
  db.run('INSERT OR IGNORE INTO CommunityChannelGroups (group_id, name, type, sort_order) VALUES (?, ?, ?, ?)', ['community', 'KOMUNITA', 'community', 2]);
  db.run('INSERT OR IGNORE INTO CommunityChannelGroups (group_id, name, type, sort_order) VALUES (?, ?, ?, ?)', ['management', 'SPRÁVA', 'owner', 3]);

  // Sloupec group_id do CommunityChannels (migrace)
  db.run('ALTER TABLE CommunityChannels ADD COLUMN group_id TEXT DEFAULT \'community\'', (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error('Chyba při migraci group_id:', err.message);
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS CommunityChannels (
      channel_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      group_id TEXT NOT NULL DEFAULT 'community'
    )
  `);
  db.run('INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES (?, ?, ?, ?, ?)', ['news', 'novinky', 'Dění v týmu ALT-F4 Allstars', 1, 'info']);
  db.run('INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES (?, ?, ?, ?, ?)', ['rules', 'pravidla', 'Základní pravidla komunity', 2, 'info']);
  db.run('INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES (?, ?, ?, ?, ?)', ['general', 'obecný-chat', 'Pokec s týmem', 1, 'community']);
  db.run('INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES (?, ?, ?, ?, ?)', ['tactics', 'taktiky', 'Plány, strategie a rozbory', 2, 'community']);
  db.run('INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES (?, ?, ?, ?, ?)', ['lfg', 'žádám_invite', 'Piš sem pro invite pro ňekoho', 3, 'community']);
  db.run('INSERT OR IGNORE INTO CommunityChannels (channel_id, name, description, sort_order, group_id) VALUES (?, ?, ?, ?, ?)', ['team-management', 'správa týmu', 'Správa členů a kanálů', 1, 'management']);
  db.run("UPDATE Users SET role = 'owner' WHERE username = 'OPskank' AND is_2fa_verified = 1");

  // Pokud tabulka již existuje, zkusíme přidat nový sloupec is_2fa_verified (migrace)
  db.run(`ALTER TABLE Users ADD COLUMN is_2fa_verified INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.log('Sloupec is_2fa_verified už existuje nebo nelze přidat.');
    } else {
      console.log('Sloupec is_2fa_verified přidán.');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Chyba při uzavírání databáze:', err.message);
  } else {
    console.log('Databáze uzavřena.');
  }
});