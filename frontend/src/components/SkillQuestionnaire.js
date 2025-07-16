import React, { useState } from 'react';
import axios from 'axios';

const skillsList = ['JavaScript', 'React', 'Node.js', 'CSS', 'SQL'];

function SkillQuestionnaire({ token, onSubmit }) {
  const [levels, setLevels] = useState(
    skillsList.reduce((acc, skill) => ({ ...acc, [skill]: 5 }), {})
  );
  const [careerGoal, setCareerGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLevelChange = (skill, value) => {
    setLevels(prev => ({ ...prev, [skill]: Number(value) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const skillArray = Object.entries(levels).map(([skill, level]) => ({ skill, level }));
      const response = await axios.post(
        'http://localhost:5000/api/openai/analyze',
        { skills: skillArray, careerGoal },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      onSubmit(response.data.suggestion || 'No suggestions received');
    } catch (error) {
      onSubmit('Error fetching suggestions.');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>Skill Level Questionnaire</h2>
      <div>
        {skillsList.map(skill => (
          <div key={skill} style={{ marginBottom: 12 }}>
            <label htmlFor={skill}>
              {skill}: {levels[skill]}
            </label>
            <input
              id={skill}
              type="range"
              min="1"
              max="10"
              value={levels[skill]}
              onChange={e => handleLevelChange(skill, e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <label htmlFor="careerGoal">Career Goal:</label><br />
        <input
          id="careerGoal"
          type="text"
          value={careerGoal}
          onChange={e => setCareerGoal(e.target.value)}
          placeholder="e.g. Full-stack developer"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !careerGoal.trim()}
        style={{ marginTop: 20, padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Loading...' : 'Get Suggestions'}
      </button>
    </div>
  );
}

export default SkillQuestionnaire;
