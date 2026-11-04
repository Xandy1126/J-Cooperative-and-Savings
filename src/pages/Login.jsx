
import React, { useState } from 'react';
import { loginUser } from '../auth.js';
import { supabase } from '../supabaseClient.js';

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = await loginUser(email.trim(), password);
      onLogin(data.user);
    } catch (error) {
      setMessage(error.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage('Please enter your email address first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/?reset-password=true`
        }
      );

      if (error) throw error;
      setMessage('Password reset link sent! Please check your email.');
    } catch (error) {
      setMessage(error.message || 'Unable to send password reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>J Cooperative and Savings</h1>
        <p>Building savings. Growing together.</p>

        <h2>Welcome Back!</h2>
        <p>Log in to your cooperative account.</p>

        <label htmlFor="login-email">Email Address</label>
        <input
          id="login-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <label>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Show password
        </label>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          Forgot Password?
        </button>

        {message && <p role="alert">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>

        <p>Don't have an account yet?</p>

        <button type="button" onClick={onRegister}>
          Register as Member
        </button>

        <footer>J COOPERATIVE AND SAVINGS</footer>
      </form>
    </main>
  );
}
