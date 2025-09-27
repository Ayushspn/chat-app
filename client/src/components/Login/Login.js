import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import './login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const loginUser = async (formData) => {
    const res = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }

    return res.json();
  };

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setMessage(data.message);
      // You can store token in localStorage or context here
      console.log('Token:', data.token);
    },
    onError: (error) => {
      setMessage(error.message);
    },
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    mutation.mutate(form);
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="login-input"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="login-input"
          required
        />
        <button type="submit" className="login-button" disabled={mutation.isPending}>
          {mutation.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {message && <div className="login-message">{message}</div>}
    </div>
  );
};

export default Login;