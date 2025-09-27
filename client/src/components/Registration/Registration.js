import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const registerUser = async (formData) => {
    const res = await fetch('http://localhost:5000/auth/register', {
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
      setForm({ username: '', email: '', password: '' });
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
    <div className="register-container">
      <h2 className="register-title">Register</h2>
      <form onSubmit={handleSubmit} className="register-form" autoComplete='off'>
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
          placeholder="Email"
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
          {mutation.isPending ? 'Registering...' : 'Register'}
        </button>
      </form>
      {message && <div className="register-message">{message}</div>}
    </div>
  );
};

export default Register;