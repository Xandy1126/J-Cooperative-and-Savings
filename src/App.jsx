import React from 'react';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f9ff',
      fontFamily: 'Arial, sans-serif',
      color: '#0f172a'
    }}>
      <header style={{
        background: '#0284c7',
        color: 'white',
        padding: '22px',
        textAlign: 'center'
      }}>
        <h1>J Cooperative and Savings</h1>
        <p>Building a Better Financial Future Together</p>
      </header>

      <main style={{
        maxWidth: '900px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>Welcome to J Cooperative!</h2>
        <p>Your trusted cooperative savings management platform.</p>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '30px'
        }}>
          <button style={buttonStyle}>
            Member Login
          </button>

          <button style={buttonStyle}>
            Admin Login
          </button>

          <button style={{
            ...buttonStyle,
            background: '#16a34a'
          }}>
            Become a Member
          </button>
        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '25px',
        color: '#64748b'
      }}>
        © 2026 J Cooperative and Savings
      </footer>
    </div>
  );
}

const buttonStyle = {
  background: '#0284c7',
  color: 'white',
  border: 'none',
  padding: '14px 22px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '15px'
};
