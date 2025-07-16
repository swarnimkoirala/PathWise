const express = require('express');
const router = express.Router();
const db = require('../db/database');
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// Helper: fetch subskills by skill_id
const getSubSkills = (skillId) =>
  new Promise((resolve, reject) => {
    db.all('SELECT name, level FROM subskills WHERE skill_id = ?', [skillId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

// Get all skills with subskills for user
router.get('/', authenticate, async (req, res) => {
  try {
    db.all('SELECT * FROM skills WHERE user_id = ?', [req.userId], async (err, skills) => {
      if (err) return res.status(500).json({ error: err.message });

      // For each skill fetch subskills
      const skillsWithSubs = await Promise.all(
        skills.map(async (skill) => {
          const subSkills = await getSubSkills(skill.id);
          return { ...skill, subSkills };
        })
      );

      res.json(skillsWithSubs);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Add new skill with subskills using transaction
router.post('/', authenticate, (req, res) => {
  const { name, progress = 0, subSkills = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Skill name required' });

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(
      'INSERT INTO skills (user_id, name, progress) VALUES (?, ?, ?)',
      [req.userId, name, progress],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        const skillId = this.lastID;

        if (subSkills.length === 0) {
          db.run('COMMIT');
          return res.status(201).json({ id: skillId, name, progress, subSkills: [] });
        }

        const placeholders = subSkills.map(() => '(?, ?, ?)').join(',');
        const values = [];
        subSkills.forEach(({ name, level }) => {
          values.push(skillId, name, level);
        });

        db.run(
          `INSERT INTO subskills (skill_id, name, level) VALUES ${placeholders}`,
          values,
          (err2) => {
            if (err2) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err2.message });
            }
            db.run('COMMIT');
            res.status(201).json({ id: skillId, name, progress, subSkills });
          }
        );
      }
    );
  });
});

// Update skill with subskills using transaction (replace all subskills)
router.put('/:id', authenticate, (req, res) => {
  const { name, progress, subSkills = [] } = req.body;
  const skillId = req.params.id;

  if (!name || progress == null) return res.status(400).json({ error: 'Name and progress required' });

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(
      'UPDATE skills SET name = ?, progress = ? WHERE id = ? AND user_id = ?',
      [name, progress, skillId, req.userId],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Skill not found' });
        }

        // Delete old subskills for this skill
        db.run('DELETE FROM subskills WHERE skill_id = ?', [skillId], (delErr) => {
          if (delErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: delErr.message });
          }

          if (subSkills.length === 0) {
            db.run('COMMIT');
            return res.json({ message: 'Skill updated', id: skillId, name, progress, subSkills: [] });
          }

          // Insert new subskills
          const placeholders = subSkills.map(() => '(?, ?, ?)').join(',');
          const values = [];
          subSkills.forEach(({ name, level }) => {
            values.push(skillId, name, level);
          });

          db.run(
            `INSERT INTO subskills (skill_id, name, level) VALUES ${placeholders}`,
            values,
            (insertErr) => {
              if (insertErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: insertErr.message });
              }
              db.run('COMMIT');
              res.json({ message: 'Skill updated', id: skillId, name, progress, subSkills });
            }
          );
        });
      }
    );
  });
});

// Delete skill and cascade subskills (if foreign key cascade doesn't work)
router.delete('/:id', authenticate, (req, res) => {
  const skillId = req.params.id;
  db.run('DELETE FROM subskills WHERE skill_id = ?', [skillId], (err1) => {
    if (err1) return res.status(500).json({ error: err1.message });

    db.run(
      'DELETE FROM skills WHERE id = ? AND user_id = ?',
      [skillId, req.userId],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Skill not found' });
        res.json({ message: 'Skill deleted' });
      }
    );
  });
});

module.exports = router;
