
import React, { useState } from 'react';

export default function AdminDashboard({
  profile,
  onLogout,
  stats = {},
  members = [],
  pendingMembers = [],
  onAddDeposit,
  onApproveMember,
  onRejectMember,
}) {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
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

  async function handleApproval(member, action) {
    setMessage('');

    const callback =
      action === 'approve' ? onApproveMember : onRejectMember;

    if (!callback) {
      setMessage(
        'Membership approval is not yet connected to Supabase. Please connect the Admin functions in App.jsx.'
      );
      return;
    }

    const confirmed = window.confirm(
      action === 'approve'
        ? `Approve membership of ${member.full_name || member.email}?`
        : `Reject membership of ${member.full_name || member.email}?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(member.id);

      await callback(member.id);

      setMessage(
        action === 'approve'
          ? 'Member successfully approved!'
          : 'Membership application rejected.'
      );
    } catch (error) {
      setMessage(error.message || 'Unable to process membership.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    setMessage('');

    if (!selectedMember || Number(amount) <= 0) {
      setMessage('Please select a member and enter a valid amount.');
      return;
    }

    if (!onAddDeposit) {
      setMessage('Deposit is not yet connected to Supabase.');
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
  }

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
              {item.id === 'approval' && pendingMembers.length > 0 && (
                <span className="pending-count">
                  {pendingMembers.length}
                </span>
              )}
            </button>
          ))}
        </aside>

        <section className="admin-content">
          <div className="welcome">
            <h2>Welcome, Administrator!</h2>
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
                  <p>Approved members</p>
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
                    ✅ Membership Approval ({pendingMembers.length})
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

          {activePage === 'approval' && (
            <section className="admin-panel">
              <h2>New Member Applications</h2>
              <p>Review and confirm new membership registrations.</p>

              {message && (
                <p className="admin-message">{message}</p>
              )}

              {pendingMembers.length === 0 ? (
                <div className="empty-state">
                  <h3>No Pending Applications</h3>
                  <p>
                    New member registrations will appear here.
                  </p>
                </div>
              ) : (
                <div className="approval-list">
                  {pendingMembers.map((member) => (
                    <article
                      className="approval-card"
                      key={member.id}
                    >
                      <div className="approval-details">
                        <h3>
                          {member.full_name || 'Unnamed Member'}
                        </h3>

                        <p>{member.email || 'No email available'}</p>

                        <p>
                          Application ID: {member.id}
                        </p>

                        <span className="pending-label">
                          PENDING APPROVAL
                        </span>
                      </div>

                      <div className="approval-actions">
                        <button
                          className="approve-btn"
                          disabled={processingId === member.id}
                          onClick={() =>
                            handleApproval(member, 'approve')
                          }
                        >
                          {processingId === member.id
                            ? 'Processing...'
                            : '✓ Approve'}
                        </button>

                        <button
                          className="reject-btn"
                          disabled={processingId === member.id}
                          onClick={() =>
                            handleApproval(member, 'reject')
                          }
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === 'deposit' && (
            <section className="admin-panel">
              <h2>Record Member Deposit</h2>
              <p>Select a member and enter the deposit amount.</p>

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

          {activePage === 'members' && (
            <section className="admin-panel">
              <h2>Approved Members</h2>

              {members.length === 0 ? (
                <p>No approved members found.</p>
              ) : (
                members.map((member) => (
                  <article className="approval-card" key={member.id}>
                    <div>
                      <h3>{member.full_name}</h3>
                      <p>{member.email}</p>
                      <p>{member.account_number || 'No account number'}</p>
                    </div>
                    <span className="approved-label">APPROVED</span>
                  </article>
                ))
              )}
            </section>
          )}

          {['withdrawal', 'transactions', 'reports'].includes(activePage) && (
            <section className="admin-panel">
              <h2>{pageTitles[activePage]}</h2>
              <p>
                This section still needs its Supabase database integration.
              </p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
