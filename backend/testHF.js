require('dotenv').config();
const axios = require('axios');

async function testHF() {
  const model = 'facebook/bart-large-mnli'; // public model
  const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

  try {
    const response = await axios.post(apiUrl, 
      { inputs: "I love programming.", parameters: { candidate_labels: ["programming", "sports", "politics"] } },
      { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
    );

    console.log('HF response:', response.data);
  } catch (error) {
    console.error('Error from HF API:', error.response?.data || error.message);
  }
}

testHF();
