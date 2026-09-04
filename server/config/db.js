const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/db.json');

// Initial in-memory state
let db = {
  users: [],
  events: [],
  tickets: []
};

// Ensure data directory exists
const initDb = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(content);
    } catch (e) {
      console.error('Error loading db.json, using fresh state', e);
    }
  } else {
    saveDb();
  }
};

const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving db.json', e);
  }
};

module.exports = {
  db,
  initDb,
  saveDb
};
