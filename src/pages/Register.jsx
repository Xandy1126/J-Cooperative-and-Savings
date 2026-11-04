import React, { useState } from 'react';
import { registerMember } from '../auth.js';

export default function Register({ onBack }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await registerMember(form);
      setMessage('Registration successful! Please check your email for confirmation.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>J Cooperative</h1>
        <h2>Member Registration</h2>
        <p>Create your member account</p>

        <label>Full Name</label>
        <input name="fullName" value={form.fullName}
          onChange={updateField} required />

        <label>Email Address</label>
        <input type="email" name="email" value={form.email}
          onChange={updateField} required />

        <label>Phone Number</label>
        <input name="phone" value={form.phone}
          onChange={updateField} required />

        <label>Address</label>
        <input name="address" value={form.address}
          onChange={updateField} required />

        <label>Password</label>
        <input type="password" name="password" value={form.password}
          onChange={updateField} minLength={8} required />

        {message && <p>{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Create Account'}
        </button>

        <button type="button" onClick={onBack}>
          Back to Login
        </button>
      </form>
    </main>
  );
}
