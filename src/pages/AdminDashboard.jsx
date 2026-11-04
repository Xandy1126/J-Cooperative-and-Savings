
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

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
  const [page, setPage] = useState('Dashboard');
  const [selectedMember, setSelectedMember] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('daily');

  const money = value =>
    Number(value || 0).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
    });

  const styles = {
    app: {
      minHeight: '100vh',
      background: '#eef6ff',
      fontFamily: 'Arial, sans-serif',
      color: '#17324d'
    },
    header: {
      background: '#0879c9',
      color: '#fff',
      padding: '18px 25px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10
    },
    layout: {
      display: 'flex',
      minHeight: 'calc(100vh - 75px)',
      flexWrap: 'wrap'
    },
    sidebar: {
      width: 235,
      background: '#fff',
      padding: 18,
      boxSizing: 'border-box'
    },
    content: {
      flex: 1,
      minWidth: 280,
      padding: 25,
      boxSizing: 'border-box'
    },
    card: {
      background: '#fff',
      padding: 20,
      borderRadius: 12,
      boxShadow: '0 2px 9px #00000010',
      marginBottom: 16
    },
    button: {
      background: '#0879c9',
      color: '#fff',
      padding: '11px 16px',
      border: 0,
      borderRadius: 7,
      cursor: 'pointer',
      margin: 3
    },
    input: {
      display: 'block',
      width: '100%',
      padding: 12,
      marginTop: 7,
      marginBottom: 16,
      border: '1px solid #ccd8e5',
      borderRadius: 7,
      boxSizing: 'border-box'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: 550
    },
    cell: {
      padding: 12,
      borderBottom: '1px solid #e5edf5',
      textAlign: 'left'
    }
  };

  async function loadRecords() {
    setError('');

    const { data: tx, error: txError } = await supabase
      .from('jcs_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txError) {
      setError('Transaction history: ' + txError.message);
    } else {
      setTransactions(tx || []);
    }

    // Withdrawal requests are loaded if the table exists.
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from('jcs_withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (withdrawalError) {
      setRequests([]);
      if (withdrawalError.code !== '42P01') {
        setError('Withdrawal requests: ' + withdrawalError.message);
      }
    } else {
      setRequests(withdrawals || []);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  async function refreshAll() {
    try {
      if (onRefresh) await onRefresh();
      await loadRecords();
    } catch (err) {
      setError(err.message);
    }
  }

  async function approveMember(id) {
    try {
      setMessage('');
      setError('');
      await onApproveMember(id);
      await refreshAll();
      setMessage('Membership approved successfully!');
    } catch (err) {
      setError(err.message);
    }
  }

  async function rejectMember(id) {
    if (!window.confirm('Are you sure you want to reject this member?')) return;

    try {
      await onRejectMember(id);
      await refreshAll();
      setMessage('Membership rejected.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitDeposit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (!selectedMember) throw new Error('Please select a member.');
      if (!amount || Number(amount) <= 0) {
        throw new Error('Enter a valid deposit amount.');
      }

      await onAddDeposit(selectedMember, Number(amount), notes);

      setMessage('Deposit successfully recorded!');
      setSelectedMember('');
      setAmount('');
      setNotes('');

      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const totalDeposits = transactions
    .filter(tx => tx.transaction_type === 'deposit')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalWithdrawals = transactions
    .filter(tx => tx.transaction_type === 'withdrawal')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalSavings = members.reduce(
    (sum, member) => sum + Number(member.balance || 0),
    0
  );

  async function updateWithdrawal(id, status) {
    if (!window.confirm(`Are you sure you want to ${status} this withdrawal?`)) return;

    setError('');
    setMessage('');

    try {
      const { error } = await supabase.rpc('admin_process_withdrawal', {
        p_request_id: id,
        p_status: status
      });

      if (error) throw error;

      await refreshAll();
      setMessage('Withdrawal request ' + status + ' successfully.');
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    const date = new Date(tx.created_at);
    const now = new Date();

    if (reportType === 'daily') {
      return date.toDateString() === now.toDateString();
    }

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  function navButton(name) {
    return (
      <button
        key={name}
        onClick={() => {
          setPage(name);
          setMessage('');
          setError('');
          if (name === 'Transaction History' || name === 'Withdrawal Requests') {
            refreshAll();
          }
        }}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: 13,
          marginBottom: 7,
          border: 0,
          borderRadius: 7,
          cursor: 'pointer',
          background: page === name ? '#dceeff' : '#fff',
          color: '#0879c9',
          fontWeight: 'bold'
        }}
      >
        {name}
      </button>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>J-Cooperative and Savings</h2>
          <small>Admin: {profile?.full_name || profile?.email}</small>
        </div>

        <button
          style={{ ...styles.button, background: '#fff', color: '#0879c9' }}
          onClick={onLogout}
        >
          Logout
        </button>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          {[
            'Dashboard',
            'Membership Approval',
            'Members',
            'Add Deposit',
            'Withdrawal Requests',
            'Transaction History',
            'Reports'
          ].map(navButton)}
        </aside>

        <main style={styles.content}>
          {message && (
            <div style={{ ...styles.card, color: '#087a40' }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ ...styles.card, color: '#c62828' }}>
              {error}
            </div>
          )}

          {page === 'Dashboard' && (
            <>
              <h2>Admin Dashboard</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 15
              }}>
                {[
                  ['Total Members', members.length],
                  ['Total Savings', money(totalSavings)],
                  ['Total Deposits', money(totalDeposits)],
                  ['Total Withdrawals', money(totalWithdrawals)]
                ].map(([title, value]) => (
                  <div style={styles.card} key={title}>
                    <h3>{title}</h3>
                    <h2>{value}</h2>
                  </div>
                ))}
              </div>

              <button style={styles.button} onClick={refreshAll}>
                Refresh Dashboard
              </button>
            </>
          )}

          {page === 'Membership Approval' && (
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
                    onClick={() => approveMember(member.id)}
                  >
                    Approve
                  </button>
                  <button
                    style={{ ...styles.button, background: '#dc2626' }}
                    onClick={() => rejectMember(member.id)}
                  >
                    Reject
                  </button>
                </div>
              ))}
            </>
          )}

          {page === 'Members' && (
            <>
              <h2>Approved Members ({members.length})</h2>

              <div style={styles.card}>
                {members.length === 0 ? (
                  'No approved members found.'
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.cell}>Name</th>
                          <th style={styles.cell}>Email</th>
                          <th style={styles.cell}>Member Number</th>
                          <th style={styles.cell}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(member => (
                          <tr key={member.id}>
                            <td style={styles.cell}>{member.full_name}</td>
                            <td style={styles.cell}>{member.email}</td>
                            <td style={styles.cell}>{member.member_number}</td>
                            <td style={styles.cell}>
                              {money(member.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <button style={styles.button} onClick={refreshAll}>
                Refresh Members
              </button>
            </>
          )}

          {page === 'Add Deposit' && (
            <>
              <h2>Add Member Deposit</h2>

              <form style={styles.card} onSubmit={submitDeposit}>
                <label>Select Member</label>
                <select
                  style={styles.input}
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  required
                >
                  <option value="">-- Choose Approved Member --</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.full_name} ({member.member_number})
                    </option>
                  ))}
                </select>

                {members.length === 0 && (
                  <p>No approved members available. Please refresh.</p>
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

                <label>Notes</label>
                <input
                  style={styles.input}
                  placeholder="Optional description"
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

          {page === 'Withdrawal Requests' && (
            <>
              <h2>Withdrawal Requests</h2>

              {requests.length === 0 ? (
                <div style={styles.card}>No withdrawal requests found.</div>
              ) : requests.map(request => (
                <div style={styles.card} key={request.id}>
                  <p><b>Member ID:</b> {request.member_id}</p>
                  <p><b>Amount:</b> {money(request.amount)}</p>
                  <p><b>Status:</b> {request.status}</p>

                  {request.status === 'pending' && (
                    <>
                      <button
                        style={styles.button}
                        onClick={() => updateWithdrawal(request.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        style={{ ...styles.button, background: '#dc2626' }}
                        onClick={() => updateWithdrawal(request.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          {page === 'Transaction History' && (
            <>
              <h2>Transaction History</h2>

              <div style={styles.card}>
                {transactions.length === 0 ? (
                  'No transactions recorded.'
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.cell}>Date</th>
                          <th style={styles.cell}>Member ID</th>
                          <th style={styles.cell}>Type</th>
                          <th style={styles.cell}>Amount</th>
                          <th style={styles.cell}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id}>
                            <td style={styles.cell}>
                              {new Date(tx.created_at).toLocaleString()}
                            </td>
                            <td style={styles.cell}>{tx.member_id}</td>
                            <td style={styles.cell}>{tx.transaction_type}</td>
                            <td style={styles.cell}>{money(tx.amount)}</td>
                            <td style={styles.cell}>{tx.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {page === 'Reports' && (
            <>
              <h2>Reports</h2>

              <div style={styles.card}>
                <label>Report Period</label>
                <select
                  style={styles.input}
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                >
                  <option value="daily">Today</option>
                  <option value="monthly">This Month</option>
                </select>

                <h3>Deposits: {money(
                  filteredTransactions
                    .filter(tx => tx.transaction_type === 'deposit')
                    .reduce((sum, tx) => sum + Number(tx.amount), 0)
                )}</h3>

                <h3>Withdrawals: {money(
                  filteredTransactions
                    .filter(tx => tx.transaction_type === 'withdrawal')
                    .reduce((sum, tx) => sum + Number(tx.amount), 0)
                )}</h3>

                <h3>Transactions: {filteredTransactions.length}</h3>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
