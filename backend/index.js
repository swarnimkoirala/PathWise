// index.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const huggingFaceRoutes = require('./routes/huggingface');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/huggingface', huggingFaceRoutes); // ✅ THIS is your AI route
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
