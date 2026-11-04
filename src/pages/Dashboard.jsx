
import React, { useState } from 'react';

export default function Dashboard({ user, profile, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');

  const fullName = profile?.full_name || user?.email || 'Member';
  const accountNumber = profile?.account_number || 'Pending Approval';

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'savings', icon: '💰', label: 'My Savings' },
    { id: 'deposit', icon: '📥', label: 'My Deposits' },
    { id: 'withdrawal', icon: '💸', label: 'Withdrawal Request' },
    { id: 'transactions', icon: '📄', label: 'Transaction History' },
    { id: 'profile', icon: '👤', label: 'My Profile' },
  ];

  const cardStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 15px rgba(20,80,120,0.06)',
    border: '1px solid #e2edf5',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f8ff',
      fontFamily: 'Arial, sans-serif',
      color: '#17496b'
    }}>
      <header style={{
        background: '#fff',
        padding: '18px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e0edf5',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#0879bd' }}>
            🏦 J-COOPERATIVE
          </h2>
          <small style={{ color: '#7895aa' }}>
            SAVINGS MANAGEMENT
          </small>
        </div>

        <button onClick={onLogout} style={{
          background: '#e8f5ff',
          color: '#0879bd',
          border: 0,
          borderRadius: 12,
          padding: '13px 22px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Logout ↗
        </button>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 85px)' }}>
        <aside style={{
          width: 250,
          background: '#fff',
          padding: 20,
          borderRight: '1px solid #e0edf5',
          flexShrink: 0
        }}>
          <p style={{ color: '#8ba5b7', fontWeight: 'bold', fontSize: 13 }}>
            MEMBER MENU
          </p>

          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 15,
                marginBottom: 8,
                border: 0,
                borderRadius: 12,
                background: activePage === item.id ? '#e3f3ff' : 'transparent',
                color: activePage === item.id ? '#0879bd' : '#365c77',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 15
              }}
            >
              {item.icon}　{item.label}
            </button>
          ))}
        </aside>

        <main style={{ padding: 30, flex: 1, minWidth: 0 }}>
          <h1 style={{ marginTop: 0 }}>
            {menuItems.find(item => item.id === activePage)?.label}
          </h1>

          <p style={{ color: '#7895aa' }}>
            Welcome, {fullName}!
          </p>

          {activePage === 'dashboard' && (
            <>
              <div style={{
                ...cardStyle,
                marginTop: 25,
                background: 'linear-gradient(120deg, #0879bd, #42b6e9)',
                color: '#fff'
              }}>
                <p style={{ margin: 0 }}>MY COOPERATIVE ACCOUNT</p>
                <h2 style={{ fontSize: 26, marginBottom: 5 }}>
                  {accountNumber}
                </h2>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  {fullName}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 18,
                marginTop: 22
              }}>
                <article style={cardStyle}>
                  <p>💰 Available Savings</p>
                  <h2>₱0.00</h2>
                  <small>Current balance</small>
                </article>

                <article style={cardStyle}>
                  <p>📥 Total Deposits</p>
                  <h2>₱0.00</h2>
                  <small>Recorded deposits</small>
                </article>

                <article style={cardStyle}>
                  <p>💸 Total Withdrawals</p>
                  <h2>₱0.00</h2>
                  <small>Approved withdrawals</small>
                </article>

                <article style={cardStyle}>
                  <p>📄 Transactions</p>
                  <h2>0</h2>
                  <small>Transaction records</small>
                </article>
              </div>

              <section style={{ ...cardStyle, marginTop: 22 }}>
                <h3>Recent Transactions</h3>
                <p style={{ textAlign: 'center', color: '#8ba5b7', padding: 25 }}>
                  No transactions available yet.
                </p>
              </section>
            </>
          )}

          {activePage === 'savings' && (
            <section style={cardStyle}>
              <h2>My Savings</h2>
              <h1>₱0.00</h1>
              <p>Available savings balance</p>
            </section>
          )}

          {activePage === 'deposit' && (
            <section style={cardStyle}>
              <h2>My Deposits</h2>
              <p>View deposits recorded by your cooperative administrator.</p>
              <p>No deposit records available yet.</p>
            </section>
          )}

          {activePage === 'withdrawal' && (
            <section style={cardStyle}>
              <h2>Withdrawal Request</h2>
              <p>Withdrawal requests will be subject to administrator approval.</p>
              <p>Withdrawal request submission will be connected next.</p>
            </section>
          )}

          {activePage === 'transactions' && (
            <section style={cardStyle}>
              <h2>Transaction History</h2>
              <p>No transaction records available yet.</p>
            </section>
          )}

          {activePage === 'profile' && (
            <section style={cardStyle}>
              <h2>My Profile</h2>
              <p><b>Full Name:</b> {fullName}</p>
              <p><b>Email:</b> {user?.email || 'Not available'}</p>
              <p><b>Phone:</b> {profile?.phone || 'Not available'}</p>
              <p><b>Address:</b> {profile?.address || 'Not available'}</p>
              <p><b>Account Number:</b> {accountNumber}</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
