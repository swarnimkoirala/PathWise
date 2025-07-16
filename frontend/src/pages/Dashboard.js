import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const BACKEND_URL = 'http://localhost:5000';

const Dashboard = () => {
  const token = localStorage.getItem('token');

  const [skills, setSkills] = useState([]);
  const [mode, setMode] = useState('list');
  const [currentSkillName, setCurrentSkillName] = useState('');
  const [relatedSubSkills, setRelatedSubSkills] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [loadingSkillId, setLoadingSkillId] = useState(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/skills`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSkills(res.data);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  const handleAddSkillName = () => {
    if (!currentSkillName.trim()) {
      alert('Please enter a skill name');
      return;
    }

    const initialSubs = [
      `${currentSkillName} fundamentals`,
      `${currentSkillName} advanced concepts`,
      `Practical ${currentSkillName}`,
      `Tools for ${currentSkillName}`,
      `Best practices in ${currentSkillName}`,
      `${currentSkillName} certifications`,
      `${currentSkillName} online courses`
    ].map(name => ({ name, level: 5 }));

    setRelatedSubSkills(initialSubs);
    setAiSuggestion('');
    setMode('questionnaire');
    setEditingSkillId(null);
  };

  const handleSubSkillLevelChange = (index, newLevel) => {
    const updatedSubs = [...relatedSubSkills];
    updatedSubs[index].level = Number(newLevel);
    setRelatedSubSkills(updatedSubs);
  };

  const handleQuestionnaireSubmit = async () => {
    try {
      const classifyPayload = {
        careerGoal: currentSkillName,
        skills: relatedSubSkills.map(s => s.name),
      };

      const classifyRes = await axios.post(
        `${BACKEND_URL}/api/huggingface/classify`,
        classifyPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const skillGaps = classifyRes.data.skillGaps || [];

      let prompt = `You are a career coach assistant.

The user is working on the skill: "${currentSkillName}".
${skillGaps.length > 0
  ? `Identified skill gaps include: ${skillGaps.join(', ')}.`
  : `The user has no major gaps, but wants to deepen expertise.`}

Suggest **ONE** specific and practical item for each of the following:

1. 📜 Certificate or Course (e.g., Coursera, edX, etc.)
2. 🇺 License (if applicable to the domain)
3. 🧪 Independent Project (small and practical)
4. 🧠 Concept to Master (advanced or complementary topic)

Keep each suggestion brief (1 sentence) and directly relevant to the skill.
Format your response like:

1. Certificate: ...
2. License: ...
3. Project: ...
4. Concept: ...
`;

      const suggestRes = await axios.post(
        `${BACKEND_URL}/api/huggingface/suggest`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const learningSuggestions = suggestRes.data.suggestion || 'No suggestions available.';
      setAiSuggestion(learningSuggestions);

      const overallProgress =
        relatedSubSkills.reduce((acc, s) => acc + s.level, 0) / relatedSubSkills.length;

      const payload = {
        name: currentSkillName,
        progress: Math.round((overallProgress / 10) * 100),
        subSkills: relatedSubSkills,
      };

      if (editingSkillId) {
        await axios.put(`${BACKEND_URL}/api/skills/${editingSkillId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/skills`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setMode('list');
      setCurrentSkillName('');
      setRelatedSubSkills([]);
      setEditingSkillId(null);
      setAiSuggestion('');
      fetchSkills();
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      alert('Failed to submit skill levels and get suggestions.');
    }
  };

  const handleEditSkill = async (skill) => {
    setCurrentSkillName(skill.name);
    setEditingSkillId(skill.id);
    setAiSuggestion('');
    const subSkills = skill.subSkills || [];

    if (subSkills.length > 0) {
      setRelatedSubSkills(subSkills);
      setMode('questionnaire');
    } else {
      const initialSubs = [
        `${skill.name} fundamentals`,
        `${skill.name} advanced concepts`,
        `Practical ${skill.name}`,
        `Tools for ${skill.name}`,
        `Best practices in ${skill.name}`,
        `${skill.name} certifications`,
        `${skill.name} online courses`
      ].map(name => ({ name, level: 5 }));

      setRelatedSubSkills(initialSubs);
      setMode('questionnaire');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSkills();
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('Could not delete skill.');
    }
  };

  const handleAiSuggestionSkill = async (skill) => {
    setLoadingSkillId(skill.id);
    setAiSuggestions((prev) => ({ ...prev, [skill.id]: null }));

    try {
      const classifyPayload = {
        careerGoal: skill.name,
        skills: skill.subSkills?.map(s => s.name) || [`${skill.name} Basics`],
      };

      const classifyRes = await axios.post(
        `${BACKEND_URL}/api/huggingface/classify`,
        classifyPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const skillGaps = classifyRes.data.skillGaps || [];

      let prompt = `You are a career coach assistant.

The user is working on the skill: "${skill.name}".
${skillGaps.length > 0
  ? `Identified skill gaps include: ${skillGaps.join(', ')}.`
  : `The user has no major gaps, but wants to deepen expertise.`}

Suggest **ONE** specific and practical item for each of the following:

1. 📜 Certificate or Course (e.g., Coursera, edX, etc.)
2. 🇺 License (if applicable to the domain)
3. 🧪 Independent Project (small and practical)
4. 🧠 Concept to Master (advanced or complementary topic)

Keep each suggestion brief (1 sentence) and directly relevant to the skill.
Format your response like:

1. Certificate: ...
2. License: ...
3. Project: ...
4. Concept: ...
`;

      const suggestRes = await axios.post(
        `${BACKEND_URL}/api/huggingface/suggest`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const suggestion = suggestRes.data.suggestion || 'No suggestions available.';
      setAiSuggestions((prev) => ({ ...prev, [skill.id]: suggestion }));
    } catch (error) {
      console.error('Failed to fetch AI suggestion:', error);
      setAiSuggestions((prev) => ({ ...prev, [skill.id]: 'Failed to get suggestion.' }));
    } finally {
      setLoadingSkillId(null);
    }
  };

  if (mode === 'addSkillName') {
    return (
      <div className="skill-form-container" style={{ maxWidth: 600, marginTop: 40 }}>
        <h2>Add New Skill</h2>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Enter skill name"
          value={currentSkillName}
          onChange={e => setCurrentSkillName(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAddSkillName}>
          Continue
        </button>
        <button
          className="btn btn-secondary ms-2"
          onClick={() => {
            setMode('list');
            setCurrentSkillName('');
          }}
        >
          Back to Skills
        </button>
      </div>
    );
  }

  if (mode === 'questionnaire') {
    return (
      <div className="skill-form-container" style={{ maxWidth: 600, marginTop: 40 }}>
        <h2>Rate Sub-Skills for "{currentSkillName}"</h2>
        {relatedSubSkills.map((sub, idx) => (
          <div key={sub.name} className="mb-3">
            <label>
              {sub.name}: {sub.level}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={sub.level}
              onChange={e => handleSubSkillLevelChange(idx, e.target.value)}
              className="form-range"
            />
          </div>
        ))}

        <button className="btn btn-success" onClick={handleQuestionnaireSubmit}>
          Submit & Get Suggestions
        </button>

        <button
          className="btn btn-secondary ms-2"
          onClick={() => {
            setMode('list');
            setCurrentSkillName('');
            setRelatedSubSkills([]);
            setAiSuggestion('');
          }}
        >
          Cancel
        </button>

        {aiSuggestion && (
          <div className="alert alert-info mt-4" style={{ whiteSpace: 'pre-wrap' }}>
            <strong>AI Suggestions:</strong>
            <br />
            {aiSuggestion}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="container" style={{ maxWidth: 800, marginTop: 40 }}>
        <h2 className="dashboard-title">Your Skills</h2>
        <button
          className="btn btn-primary add-skill-btn mb-3"
          onClick={() => setMode('addSkillName')}
        >
          + Add New Skill
        </button>

        {skills.length === 0 && <p>No skills yet. Add one above.</p>}

        <ul className="list-group">
          {skills.map(skill => (
            <li
              key={skill.id}
              className="list-group-item d-flex flex-column align-items-start"
            >
              <div className="d-flex justify-content-between w-100">
                <div>
                  <strong>{skill.name}</strong>
                  <div className="progress mt-1" style={{ height: '20px', width: '250px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${isNaN(skill.progress) ? 0 : skill.progress}%` }}
                      aria-valuenow={skill.progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {isNaN(skill.progress) ? '0%' : `${skill.progress}%`}
                    </div>
                  </div>
                </div>
                <div className="btn-group">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditSkill(skill)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSkill(skill.id)}>
                    Delete
                  </button>
                  <button
                    className="btn btn-sm btn-outline-info"
                    disabled={loadingSkillId === skill.id}
                    onClick={() => handleAiSuggestionSkill(skill)}
                  >
                    {loadingSkillId === skill.id ? 'Loading...' : 'AI Suggestion'}
                  </button>
                </div>
              </div>
              {aiSuggestions[skill.id] && (
                <div className="alert alert-secondary mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                  <strong>Suggestion:</strong> {aiSuggestions[skill.id]}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
