import React from 'react';

export default function AdminDashboard({ profile, onLogout }) {
  return (
    <main className="dashboard">
      <header>
        <h1>J Cooperative - Admin Panel</h1>
        <button onClick={onLogout}>Logout</button>
      </header>

      <section className="welcome">
        <h2>Welcome, Administrator!</h2>
        <p>{profile?.full_name || 'System Administrator'}</p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h3>Members</h3>
          <h2>0</h2>
          <p>Registered members</p>
        </article>

        <article className="dashboard-card">
          <h3>Pending Loans</h3>
          <h2>0</h2>
          <p>For approval</p>
        </article>

        <article className="dashboard-card">
          <h3>Pending Transactions</h3>
          <h2>0</h2>
          <p>For review</p>
        </article>

        <article className="dashboard-card">
          <h3>Pending Payments</h3>
          <h2>0</h2>
          <p>For approval</p>
        </article>
      </section>
    </main>
  );
}
