import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setMessage('Login successful!');
      navigate('/');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed.');
    }
  };

  const handleGuestLogin = () => {
    // Set a dummy guest token - you can adjust if you want
    localStorage.setItem('token', 'guest-token');
    setMessage('Logged in as Guest.');
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="mb-3">Login</h2>
        {message && <div className="alert alert-info">{message}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary w-100 mb-2">
            Login
          </button>
        </form>
        <button
          type="button"
          className="btn btn-secondary w-100"
          onClick={handleGuestLogin}
        >
          Login as Guest
        </button>
      </div>
    </div>
  );
};

export default Login;
