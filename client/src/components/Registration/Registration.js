import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import './Registration.css';
import { API_BASE } from '../../config';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const registerUser = async (formData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }

    return res.json();
  };

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      setMessage(data.message);
      setMessageType('success');
      setForm({ username: '', email: '', password: '' });
      setTimeout(() => setMessage(''), 5000);
    },
    onError: (error) => {
      setMessage(error.message);
      setMessageType('error');
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
    <div className="register-container">
      <div className="register-form-wrapper">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join our community today</p>
        <form onSubmit={handleSubmit} className="register-form" autoComplete="off">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="register-input"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="register-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="register-input"
            required
          />
          <button type="submit" className="register-button" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        {message && (
          <div className={`register-message ${messageType}`}>
            {message}
          </div>
        )}
        <div className="register-footer">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
    </div>
  );
};

export default Register;