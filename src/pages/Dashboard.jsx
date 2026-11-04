import React from 'react';

export default function Dashboard({ user, profile, onLogout }) {
  return (
    <main className="dashboard">
      <header>
        <h1>J Cooperative and Savings</h1>
        <button onClick={onLogout}>Logout</button>
      </header>

      <section className="welcome">
        <h2>Welcome, {profile?.full_name || user?.email}!</h2>
        <p>Your cooperative account overview</p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h3>My Savings</h3>
          <h2>₱0.00</h2>
          <p>Available balance</p>
        </article>

        <article className="dashboard-card">
          <h3>Loan Applications</h3>
          <h2>0</h2>
          <p>Applications submitted</p>
        </article>

        <article className="dashboard-card">
          <h3>Transactions</h3>
          <h2>0</h2>
          <p>Transaction records</p>
        </article>
      </section>
    </main>
  );
}
