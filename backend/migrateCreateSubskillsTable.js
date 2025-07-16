const db = require('./db/database'); // Adjust the path to your db.js file

const createSubskillsTable = `
  CREATE TABLE IF NOT EXISTS subskills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );
`;

db.run(createSubskillsTable, (err) => {
  if (err) {
    console.error('Failed to create subskills table:', err.message);
  } else {
    console.log('Subskills table created or already exists.');
  }
  db.close();
});
