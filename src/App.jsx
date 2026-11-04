
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { logoutUser } from './auth.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [page, setPage] = useState('login');
  const [error, setError] = useState('');

  const [stats, setStats] = useState({
    members: 0,
    savings: 0,
    deposits: 0,
    withdrawals: 0
  });

  useEffect(() => {
    let active = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (active) {
        setUser(data.session?.user || null);
        setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);

        if (!session?.user) {
          setProfile(null);
          setMembers([]);
          setPendingMembers([]);
          setPage('login');
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function getProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setError(error.message);
        setProfile(null);
      } else {
        setProfile(data);
        setError(data ? '' : 'Profile not found.');
      }

      setProfileLoading(false);
    }

    getProfile();

    return () => {
      active = false;
    };
  }, [user]);

  // Kunin ang pending at approved members
  const loadAdminData = useCallback(async () => {
    const [pendingResult, membersResult] = await Promise.all([
      supabase.rpc('admin_get_pending_members'),
      supabase.rpc('admin_get_approved_members')
    ]);

    if (pendingResult.error) throw pendingResult.error;
    if (membersResult.error) throw membersResult.error;

    const approved = membersResult.data || [];

    setPendingMembers(pendingResult.data || []);
    setMembers(approved);

    setStats(previous => ({
      ...previous,
      members: approved.length
    }));
  }, []);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    loadAdminData().catch(err => {
      setError('Admin data error: ' + err.message);
    });
  }, [profile, loadAdminData]);

  async function handleApproveMember(memberId) {
    const { data, error } = await supabase.rpc(
      'admin_approve_member',
      { member_id: memberId }
    );

    if (error) throw error;

    await loadAdminData();
    return data;
  }

  async function handleRejectMember(memberId) {
    const { error } = await supabase.rpc(
      'admin_reject_member',
      { member_id: memberId }
    );

    if (error) throw error;

    await loadAdminData();
  }

  // Admin deposit
  async function handleAddDeposit(memberId, amount, notes) {
    const value = Number(amount);

    if (!memberId) throw new Error('Pumili muna ng member.');
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Maglagay ng valid na deposit amount.');
    }

    const { data, error } = await supabase.rpc(
      'admin_add_deposit',
      {
        p_member_id: memberId,
        p_amount: value,
        p_notes: notes || null
      }
    );

    if (error) throw error;

    await loadAdminData();
    return data;
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    setProfile(null);
  }

  if (loading || profileLoading) {
    return <div className="loading">Loading J Cooperative...</div>;
  }

  if (!user) {
    if (page === 'register') {
      return <Register onBack={() => setPage('login')} />;
    }

    return (
      <Login
        onLogin={result => {
          const loggedInUser =
            result?.user ||
            result?.session?.user ||
            result;

          setUser(loggedInUser);
        }}
        onRegister={() => setPage('register')}
      />
    );
  }

  if (error && !profile) {
    return (
      <div className="loading">
        <p>{error}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (!profile) {
    return <div className="loading">Loading profile...</div>;
  }

  if (profile.role === 'admin') {
    return (
      <AdminDashboard
        profile={profile}
        stats={stats}
        members={members}
        pendingMembers={pendingMembers}
        onApproveMember={handleApproveMember}
        onRejectMember={handleRejectMember}
        onAddDeposit={handleAddDeposit}
        onRefresh={loadAdminData}
        onLogout={handleLogout}
      />
    );
  }

  if (profile.status === 'pending') {
    return (
      <div className="loading">
        <h2>Membership Application Pending</h2>
        <p>Please wait for Admin approval.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (profile.status === 'rejected') {
    return (
      <div className="loading">
        <h2>Membership Rejected</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      profile={profile}
      onLogout={handleLogout}
    />
  );
}
