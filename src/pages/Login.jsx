
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
      await onLogin(data.user);
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
          redirectTo: `${window.location.origin}/?reset-password=true`,
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

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #cbd9e8',
    borderRadius: '10px',
    background: '#eef5ff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const primaryButton = {
    width: '100%',
    padding: '15px',
    background: '#0787c9',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: '#edf7ff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(30, 100, 150, 0.10)',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{
          color: '#0787c9',
          fontSize: '34px',
          margin: '0 0 8px',
          lineHeight: 1.15,
        }}>
          J Cooperative and Savings
        </h1>

        <p style={{ color: '#647c91', fontSize: '16px', marginBottom: '28px' }}>
          Building savings. Growing together.
        </p>

        <h2 style={{ fontSize: '27px', marginBottom: '8px', color: '#142b40' }}>
          Welcome Back!
        </h2>

        <p style={{ color: '#647c91', marginBottom: '25px' }}>
          Log in to your cooperative account.
        </p>

        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
          Email Address
        </label>

        <input
          style={{ ...inputStyle, marginBottom: '20px' }}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
          Password
        </label>

        <input
          style={inputStyle}
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          margin: '14px 0 22px',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            cursor: 'pointer',
          }}>
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
            style={{
              border: 'none',
              background: 'none',
              color: '#0787c9',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Forgot Password?
          </button>
        </div>

        {message && (
          <p style={{
            background: '#eaf5ff',
            color: '#176b9d',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
          }} role="alert">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...primaryButton,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '25px',
          color: '#647c91',
        }}>
          Don't have an account yet?
        </div>

        <button
          type="button"
          onClick={() => {
            setMessage('');
            onRegister?.();
          }}
          style={{
            ...primaryButton,
            marginTop: '14px',
            background: '#ffffff',
            color: '#0787c9',
            border: '2px solid #0787c9',
          }}
        >
          Register as Member
        </button>

        <footer style={{
          textAlign: 'center',
          color: '#91a8b9',
          fontSize: '12px',
          marginTop: '28px',
        }}>
          J COOPERATIVE AND SAVINGS © 2026
        </footer>
      </form>
    </main>
  );
}
