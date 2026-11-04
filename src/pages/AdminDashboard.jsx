
import React, { useState } from 'react';

export default function AdminDashboard({
  profile,
  onLogout,
  stats = {},
  members = [],
  onAddDeposit,
}) {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const money = (value) =>
    Number(value || 0).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP',
    });

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'members', label: 'Member Management', icon: '👥' },
    { id: 'approval', label: 'Membership Approval', icon: '✅' },
    { id: 'deposit', label: 'Add Member Deposit', icon: '💰' },
    { id: 'withdrawal', label: 'Withdrawal Approval', icon: '💸' },
    { id: 'transactions', label: 'Transaction History', icon: '📄' },
    { id: 'reports', label: 'Cash Flow Reports', icon: '📊' },
  ];

  const pageTitles = {
    dashboard: 'Dashboard Overview',
    members: 'Member Management',
    approval: 'Membership Approval',
    deposit: 'Add Member Deposit',
    withdrawal: 'Withdrawal Approval',
    transactions: 'Transaction History',
    reports: 'Cash Flow Reports',
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!selectedMember || Number(amount) <= 0) {
      setMessage('Please select a member and enter a valid amount.');
      return;
    }

    if (!onAddDeposit) {
      setMessage('Deposit is not yet connected to the database.');
      return;
    }

    try {
      setSaving(true);

      await onAddDeposit({
        memberId: selectedMember,
        amount: Number(amount),
        description: description.trim(),
      });

      setMessage('Deposit successfully recorded!');
      setSelectedMember('');
      setAmount('');
      setDescription('');
    } catch (error) {
      setMessage(error.message || 'Unable to record deposit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <h1>J Cooperative - Admin Panel</h1>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <h3>ADMIN MENU</h3>

          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`admin-menu-item ${
                activePage === item.id ? 'active' : ''
              }`}
              onClick={() => {
                setActivePage(item.id);
                setMessage('');
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        <section className="admin-content">
          <div className="welcome">
            <h2>
              Welcome, Administrator!
            </h2>
            <p>
              {profile?.full_name || 'System Administrator'}
            </p>
          </div>

          <h2 className="page-heading">
            {pageTitles[activePage]}
          </h2>

          {activePage === 'dashboard' && (
            <>
              <section className="dashboard-grid">
                <article className="dashboard-card">
                  <h3>Total Members</h3>
                  <h2>{stats.members ?? 0}</h2>
                  <p>Registered members</p>
                </article>

                <article className="dashboard-card">
                  <h3>Total Savings</h3>
                  <h2>{money(stats.savings)}</h2>
                  <p>Current member balances</p>
                </article>

                <article className="dashboard-card">
                  <h3>Total Deposits</h3>
                  <h2>{money(stats.deposits)}</h2>
                  <p>Recorded deposits</p>
                </article>

                <article className="dashboard-card">
                  <h3>Total Withdrawals</h3>
                  <h2>{money(stats.withdrawals)}</h2>
                  <p>Approved withdrawals</p>
                </article>
              </section>

              <section className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-grid">
                  <button onClick={() => setActivePage('approval')}>
                    ✅ Membership Approval
                  </button>
                  <button onClick={() => setActivePage('deposit')}>
                    💰 Add Deposit
                  </button>
                  <button onClick={() => setActivePage('withdrawal')}>
                    💸 Approve Withdrawal
                  </button>
                  <button onClick={() => setActivePage('transactions')}>
                    📄 View Transactions
                  </button>
                </div>
              </section>
            </>
          )}

          {activePage === 'deposit' && (
            <section className="admin-panel">
              <h2>Record Member Deposit</h2>
              <p>Select the member and enter the deposit amount.</p>

              <form onSubmit={handleDeposit}>
                <label>Choose Member</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  required
                >
                  <option value="">Select a member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.account_number || 'No Account Number'}
                      {' - '}
                      {member.full_name}
                    </option>
                  ))}
                </select>

                <label>Deposit Amount (PHP)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />

                <label>Description / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="deposit-preview">
                  <span>Deposit Amount</span>
                  <strong>{money(amount)}</strong>
                </div>

                {message && (
                  <p className="admin-message">{message}</p>
                )}

                <button
                  type="submit"
                  className="confirm-deposit-btn"
                  disabled={saving || !onAddDeposit}
                >
                  {saving ? 'Recording...' : 'Confirm Deposit'}
                </button>
              </form>
            </section>
          )}

          {activePage !== 'dashboard' &&
            activePage !== 'deposit' && (
              <section className="admin-panel">
                <h2>{pageTitles[activePage]}</h2>
                <p>
                  This section is ready for its database integration.
                </p>
              </section>
            )}
        </section>
      </div>
    </main>
  );
}
