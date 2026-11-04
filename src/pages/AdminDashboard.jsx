
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

  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'approval', label: 'Membership Approval', icon: '✅' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'deposit', label: 'Add Deposit', icon: '💰' },
    { id: 'withdrawal', label: 'Withdrawal Requests', icon: '💸' },
    { id: 'transactions', label: 'Transaction History', icon: '📄' },
    { id: 'reports', label: 'Reports', icon: '📊' },
  ];

  const cardStyle = {
    background: '#ffffff',
    padding: '22px',
    borderRadius: '14px',
    border: '1px solid #e1edf5',
    boxShadow: '0 3px 12px rgba(20,90,130,0.05)',
  };

  const buttonStyle = {
    border: 'none',
    borderRadius: '10px',
    padding: '12px 16px',
    cursor: 'pointer',
    fontWeight: '600',
  };

  function navigate(page) {
    setActivePage(page);
    setMessage('');
  }

  async function handleApproval(member, action) {
    const callback =
      action === 'approve' ? onApproveMember : onRejectMember;

    if (!callback) {
      setMessage('Approval is not yet connected to Supabase. Please check App.jsx.');
      return;
    }

    const confirmed = window.confirm(
      `${action === 'approve' ? 'Approve' : 'Reject'} ${member.full_name || member.email}?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(member.id);
      setMessage('');
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

  const pageTitle = {
    dashboard: 'Dashboard',
    approval: 'Membership Approval',
    members: 'Member Management',
    deposit: 'Add Member Deposit',
    withdrawal: 'Withdrawal Requests',
    transactions: 'Transaction History',
    reports: 'Cash Flow Reports',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f8ff',
      fontFamily: 'Arial, sans-serif',
      color: '#164766',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        .jcs-layout {
          display: flex;
          min-height: calc(100vh - 70px);
        }
        .jcs-sidebar {
          width: 245px;
          background: white;
          padding: 22px 14px;
          border-right: 1px solid #e1edf5;
          flex-shrink: 0;
        }
        .jcs-main {
          flex: 1;
          padding: 28px;
          min-width: 0;
        }
        .jcs-menu {
          display: flex;
          width: 100%;
          text-align: left;
          align-items: center;
          gap: 12px;
          padding: 13px;
          margin-bottom: 6px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: #46677d;
          cursor: pointer;
          font-size: 14px;
        }
        .jcs-menu.active {
          background: #e4f3ff;
          color: #0879bd;
          font-weight: bold;
        }
        .jcs-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .jcs-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .jcs-action {
          background: #eaf6ff;
          color: #176b9d;
          border: 1px solid #d6ebfa;
          padding: 20px 10px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
        }
        .jcs-action:hover { background: #d9efff; }
        .jcs-input {
          width: 100%;
          padding: 12px;
          margin: 8px 0 18px;
          border: 1px solid #cbdde9;
          border-radius: 8px;
          font-size: 15px;
        }
        .jcs-member {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding: 17px;
          border: 1px solid #e1edf5;
          border-radius: 10px;
          margin-top: 12px;
          background: white;
        }
        @media(max-width: 900px) {
          .jcs-cards { grid-template-columns: repeat(2, 1fr); }
          .jcs-actions { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width: 650px) {
          .jcs-layout { display: block; }
          .jcs-sidebar {
            width: 100%;
            padding: 12px;
            border-right: none;
            border-bottom: 1px solid #e1edf5;
          }
          .jcs-menu {
            display: inline-flex;
            width: auto;
            margin: 3px;
            padding: 10px;
          }
          .jcs-main { padding: 17px; }
          .jcs-cards { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        height: 70,
        background: '#ffffff',
        padding: '0 25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e1edf5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#168bd2',
            color: 'white',
            width: 42,
            height: 42,
            borderRadius: 11,
            display: 'grid',
            placeItems: 'center',
            fontSize: 22,
          }}>🏦</div>
          <div>
            <strong style={{ fontSize: 17 }}>J-COOPERATIVE</strong>
            <div style={{ fontSize: 10, color: '#6c91a8' }}>
              SAVINGS MANAGEMENT
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            ...buttonStyle,
            background: '#eaf5fc',
            color: '#176b9d',
          }}
        >
          Logout ↗
        </button>
      </header>

      <div className="jcs-layout">

        {/* SIDEBAR */}
        <aside className="jcs-sidebar">
          <div style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: '#8ba7b8',
            margin: '5px 10px 15px',
          }}>
            ADMIN MENU
          </div>

          {menu.map((item) => (
            <button
              key={item.id}
              className={`jcs-menu ${activePage === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.id === 'approval' && pendingMembers.length > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#168bd2',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: 20,
                  fontSize: 11,
                }}>
                  {pendingMembers.length}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="jcs-main">
          <div style={{ marginBottom: 25 }}>
            <h2 style={{ margin: 0, fontSize: 25 }}>
              {pageTitle[activePage]}
            </h2>
            <p style={{ color: '#7593a7', margin: '7px 0 0' }}>
              Welcome back, {profile?.full_name || 'Administrator'}!
            </p>
          </div>

          {message && (
            <div style={{
              background: '#e6f5ff',
              color: '#176b9d',
              padding: 13,
              borderRadius: 9,
              marginBottom: 18,
            }}>
              {message}
            </div>
          )}

          {/* DASHBOARD */}
          {activePage === 'dashboard' && (
            <>
              <div className="jcs-cards">
                {[
                  ['👥', 'Total Members', stats.members, 'Approved members'],
                  ['💰', 'Total Savings', money(stats.savings), 'Current balances'],
                  ['📥', 'Total Deposits', money(stats.deposits), 'Recorded deposits'],
                  ['📤', 'Total Withdrawals', money(stats.withdrawals), 'Approved withdrawals'],
                ].map((item) => (
                  <div key={item[1]} style={cardStyle}>
                    <div style={{ fontSize: 27 }}>{item[0]}</div>
                    <p style={{ color: '#7795a9', fontSize: 13 }}>{item[1]}</p>
                    <h2 style={{ fontSize: 23, margin: '8px 0' }}>
                      {item[2] ?? 0}
                    </h2>
                    <small style={{ color: '#8ba7b8' }}>{item[3]}</small>
                  </div>
                ))}
              </div>

              <section style={{ ...cardStyle, marginTop: 22 }}>
                <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
                <div className="jcs-actions">
                  {[
                    ['✅', 'Membership Approval', 'approval'],
                    ['💰', 'Add Deposit', 'deposit'],
                    ['💸', 'Withdrawals', 'withdrawal'],
                    ['📄', 'Transactions', 'transactions'],
                  ].map((action) => (
                    <button
                      key={action[2]}
                      className="jcs-action"
                      onClick={() => navigate(action[2])}
                    >
                      <div style={{ fontSize: 25, marginBottom: 8 }}>
                        {action[0]}
                      </div>
                      {action[1]}
                    </button>
                  ))}
                </div>
              </section>

              <section style={{ ...cardStyle, marginTop: 22 }}>
                <h3 style={{ marginTop: 0 }}>Recent Activities</h3>
                <p style={{ color: '#8ba7b8', fontSize: 14 }}>
                  Transaction history integration will appear here.
                </p>
              </section>
            </>
          )}

          {/* MEMBERSHIP APPROVAL */}
          {activePage === 'approval' && (
            <section style={cardStyle}>
              <h3>New Member Applications</h3>
              <p style={{ color: '#7795a9' }}>
                Review membership registrations.
              </p>

              {pendingMembers.length === 0 ? (
                <p style={{ padding: 25, textAlign: 'center', color: '#8ba7b8' }}>
                  No pending applications.
                </p>
              ) : pendingMembers.map((member) => (
                <div className="jcs-member" key={member.id}>
                  <div>
                    <strong>{member.full_name || 'Unnamed Member'}</strong>
                    <p style={{ margin: '5px 0', color: '#7795a9' }}>
                      {member.email || 'No email'}
                    </p>
                    <span style={{ color: '#d18a22', fontSize: 12 }}>
                      PENDING APPROVAL
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={processingId === member.id}
                      onClick={() => handleApproval(member, 'approve')}
                      style={{
                        ...buttonStyle,
                        background: '#168bd2',
                        color: 'white',
                      }}
                    >
                      {processingId === member.id ? 'Processing...' : '✓ Approve'}
                    </button>

                    <button
                      disabled={processingId === member.id}
                      onClick={() => handleApproval(member, 'reject')}
                      style={{
                        ...buttonStyle,
                        background: '#fff0f0',
                        color: '#d34b4b',
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* MEMBERS */}
          {activePage === 'members' && (
            <section style={cardStyle}>
              <h3>Approved Members</h3>
              {members.length === 0 ? (
                <p>No approved members found.</p>
              ) : members.map((member) => (
                <div className="jcs-member" key={member.id}>
                  <div>
                    <strong>{member.full_name}</strong>
                    <p style={{ color: '#7795a9' }}>{member.email}</p>
                    <small>{member.account_number || 'No account number'}</small>
                  </div>
                  <span style={{ color: '#168b63', fontWeight: 'bold' }}>
                    APPROVED
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* ADD DEPOSIT */}
          {activePage === 'deposit' && (
            <section style={{ ...cardStyle, maxWidth: 650 }}>
              <h3>Record Member Deposit</h3>
              <p style={{ color: '#7795a9' }}>
                Add savings to an approved member account.
              </p>

              <form onSubmit={handleDeposit}>
                <label>Choose Member</label>
                <select
                  className="jcs-input"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  required
                >
                  <option value="">Select a member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.account_number || 'No Account Number'} - {member.full_name}
                    </option>
                  ))}
                </select>

                <label>Deposit Amount (PHP)</label>
                <input
                  className="jcs-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />

                <label>Remarks (Optional)</label>
                <input
                  className="jcs-input"
                  type="text"
                  placeholder="Enter remarks"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <h3 style={{ color: '#168bd2' }}>
                  Deposit: {money(amount)}
                </h3>

                <button
                  type="submit"
                  disabled={saving || !onAddDeposit}
                  style={{
                    ...buttonStyle,
                    background: '#168bd2',
                    color: 'white',
                    width: '100%',
                    marginTop: 10,
                    opacity: saving || !onAddDeposit ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Recording...' : 'Confirm Deposit'}
                </button>
              </form>
            </section>
          )}

          {/* OTHER SECTIONS */}
          {['withdrawal', 'transactions', 'reports'].includes(activePage) && (
            <section style={cardStyle}>
              <h3>{pageTitle[activePage]}</h3>
              <p style={{ color: '#7795a9' }}>
                This section still needs its Supabase database integration.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
