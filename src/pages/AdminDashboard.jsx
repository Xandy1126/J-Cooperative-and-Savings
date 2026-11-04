
import React, { useState } from 'react';

export default function AdminDashboard({
  profile,
  stats = {},
  members = [],
  pendingMembers = [],
  onApproveMember,
  onRejectMember,
  onAddDeposit,
  onRefresh,
  onLogout
}) {
  const [activePage, setActivePage] = useState('Dashboard');
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const money = value =>
    Number(value || 0).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
    });

  async function approve(id) {
    try {
      await onApproveMember(id);
      setMessage('Membership approved successfully!');
    } catch (err) {
      setMessage('Approval error: ' + err.message);
    }
  }

  async function reject(id) {
    if (!window.confirm('Reject this membership application?')) return;

    try {
      await onRejectMember(id);
      setMessage('Membership rejected.');
    } catch (err) {
      setMessage('Rejection error: ' + err.message);
    }
  }

  async function submitDeposit(e) {
    e.preventDefault();
    setMessage('');

    if (!selectedMember) {
      setMessage('Please select a member.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setMessage('Please enter a valid amount.');
      return;
    }

    setSaving(true);

    try {
      const balance = await onAddDeposit(
        selectedMember,
        amount,
        notes
      );

      setMessage(
        'Deposit successful! New balance: ' + money(balance)
      );

      setAmount('');
      setNotes('');
      setSelectedMember('');

      if (onRefresh) await onRefresh();
    } catch (err) {
      setMessage('Deposit failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const menu = [
    'Dashboard',
    'Membership Approval',
    'Members',
    'Add Deposit'
  ];

  const styles = {
    app: {
      minHeight: '100vh',
      background: '#f0f7ff',
      fontFamily: 'Arial, sans-serif',
      color: '#18324d'
    },
    header: {
      background: '#0879c9',
      color: 'white',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px'
    },
    layout: {
      display: 'flex',
      minHeight: 'calc(100vh - 75px)',
      flexWrap: 'wrap'
    },
    sidebar: {
      width: '230px',
      background: '#ffffff',
      padding: '18px',
      boxSizing: 'border-box'
    },
    content: {
      flex: 1,
      minWidth: '280px',
      padding: '25px',
      boxSizing: 'border-box'
    },
    menuButton: {
      display: 'block',
      width: '100%',
      padding: '13px',
      marginBottom: '8px',
      border: 'none',
      borderRadius: '8px',
      textAlign: 'left',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 10px #00000010',
      marginBottom: '16px'
    },
    button: {
      padding: '10px 15px',
      border: 'none',
      borderRadius: '7px',
      background: '#0879c9',
      color: 'white',
      cursor: 'pointer',
      margin: '3px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #cbd5e1',
      borderRadius: '7px',
      boxSizing: 'border-box',
      marginTop: '7px',
      marginBottom: '15px'
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>J-Cooperative and Savings</h2>
          <small>Administrator: {profile?.full_name || profile?.email}</small>
        </div>
        <button
          style={{ ...styles.button, background: '#ffffff', color: '#0879c9' }}
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          {menu.map(item => (
            <button
              key={item}
              style={{
                ...styles.menuButton,
                background: activePage === item ? '#dbeeff' : '#ffffff',
                color: '#0879c9'
              }}
              onClick={() => {
                setActivePage(item);
                setMessage('');
              }}
            >
              {item}
            </button>
          ))}
        </aside>

        <main style={styles.content}>
          {message && (
            <div style={styles.card}>
              {message}
            </div>
          )}

          {activePage === 'Dashboard' && (
            <>
              <h2>Admin Dashboard</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '15px'
              }}>
                <div style={styles.card}>
                  <h3>Total Members</h3>
                  <h1>{members.length}</h1>
                </div>
                <div style={styles.card}>
                  <h3>Pending Applications</h3>
                  <h1>{pendingMembers.length}</h1>
                </div>
                <div style={styles.card}>
                  <h3>Total Savings</h3>
                  <h1>{money(stats.savings)}</h1>
                </div>
              </div>
              <button style={styles.button} onClick={onRefresh}>
                Refresh Dashboard
              </button>
            </>
          )}

          {activePage === 'Membership Approval' && (
            <>
              <h2>Membership Approval</h2>
              {pendingMembers.length === 0 ? (
                <div style={styles.card}>No pending applications.</div>
              ) : pendingMembers.map(member => (
                <div style={styles.card} key={member.id}>
                  <h3>{member.full_name}</h3>
                  <p>{member.email}</p>
                  <p>{member.phone}</p>
                  <button
                    style={styles.button}
                    onClick={() => approve(member.id)}
                  >
                    Approve
                  </button>
                  <button
                    style={{ ...styles.button, background: '#dc2626' }}
                    onClick={() => reject(member.id)}
                  >
                    Reject
                  </button>
                </div>
              ))}
            </>
          )}

          {activePage === 'Members' && (
            <>
              <h2>Approved Members ({members.length})</h2>
              {members.length === 0 ? (
                <div style={styles.card}>
                  No approved members found.
                </div>
              ) : (
                <div style={styles.card}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th align="left">Member</th>
                          <th align="left">Email</th>
                          <th align="left">Account Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(member => (
                          <tr key={member.id}>
                            <td style={{ padding: '12px 5px' }}>
                              {member.full_name}
                            </td>
                            <td>{member.email}</td>
                            <td>{member.member_number || 'Pending number'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <button style={styles.button} onClick={onRefresh}>
                Refresh Members
              </button>
            </>
          )}

          {activePage === 'Add Deposit' && (
            <>
              <h2>Add Member Deposit</h2>
              <form style={styles.card} onSubmit={submitDeposit}>
                <label>Select Approved Member</label>
                <select
                  style={styles.input}
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} - {member.member_number}
                    </option>
                  ))}
                </select>

                {members.length === 0 && (
                  <p>No approved members available. Approve a member first.</p>
                )}

                <label>Deposit Amount (₱)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />

                <label>Notes (optional)</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Deposit description"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />

                <button
                  style={styles.button}
                  type="submit"
                  disabled={saving || members.length === 0}
                >
                  {saving ? 'Saving...' : 'Add Deposit'}
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
