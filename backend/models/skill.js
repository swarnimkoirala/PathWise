const mongoose = require('mongoose');

const SubSkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: Number, required: true }
});

const SkillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  progress: { type: Number, required: true },
  subSkills: [SubSkillSchema]
});

module.exports = mongoose.model('Skill', SkillSchema);
