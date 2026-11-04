
import React, { useEffect, useState } from 'react';
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

  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // LOAD USER PROFILE
  async function loadProfile(currentUser) {
    if (!currentUser) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      console.error('Profile error:', error);
      setError(error.message);
      return null;
    }

    setProfile(data);
    setError('');

    return data;
  }

  // LOAD ALL APPROVED MEMBERS
  async function loadMembers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'member')
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Members loading error:', error);
      alert('Unable to load members: ' + error.message);
      return;
    }

    // Match the field expected by AdminDashboard
    const formattedMembers = (data || []).map(member => ({
      ...member,
      account_number: member.member_number || 'Not assigned'
    }));

    setMembers(formattedMembers);
  }

  // LOAD PENDING APPLICATIONS
  async function loadPendingMembers() {
    const { data, error } = await supabase.rpc(
      'admin_get_pending_members'
    );

    if (error) {
      console.error('Pending members error:', error);
      alert('Unable to load pending applications: ' + error.message);
      return;
    }

    setPendingMembers(data || []);
  }

  // REFRESH ADMIN DATA
  async function refreshAdminData() {
    await Promise.all([
      loadMembers(),
      loadPendingMembers()
    ]);
  }

  // APPROVE MEMBER
  async function handleApproveMember(memberId) {
    const { data, error } = await supabase.rpc(
      'admin_approve_member',
      { member_id: memberId }
    );

    if (error) {
      alert('Approval failed: ' + error.message);
      throw error;
    }

    await refreshAdminData();

    alert(
      'Member successfully approved!\nMember Number: ' + data
    );

    return data;
  }

  // REJECT MEMBER
  async function handleRejectMember(memberId) {
    const { error } = await supabase.rpc(
      'admin_reject_member',
      { member_id: memberId }
    );

    if (error) {
      alert('Rejection failed: ' + error.message);
      throw error;
    }

    await refreshAdminData();

    alert('Membership application rejected successfully.');
  }

  // MANUAL REFRESH
  async function refreshProfile() {
    if (!user) return;

    setRefreshing(true);

    try {
      await loadProfile(user);
    } finally {
      setRefreshing(false);
    }
  }

  // INITIALIZE SESSION
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setError(error.message);
      }

      setUser(data.session?.user || null);
      setLoading(false);
    }

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        const currentUser = session?.user || null;

        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setMembers([]);
          setPendingMembers([]);
          setError('');
          setPage('login');
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // LOAD PROFILE AFTER LOGIN
  useEffect(() => {
    let active = true;

    async function syncProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!active) return;

      if (error) {
        console.error('Profile loading error:', error);
        setError(error.message);
        setProfile(null);
        return;
      }

      setProfile(data);
      setError('');
    }

    syncProfile();

    return () => {
      active = false;
    };
  }, [user]);

  // LOAD ADMIN MEMBERS AND APPLICATIONS
  useEffect(() => {
    if (profile?.role !== 'admin') {
      setMembers([]);
      setPendingMembers([]);
      return;
    }

    refreshAdminData();

    // Refresh the member list every 15 seconds
    const interval = window.setInterval(() => {
      loadMembers();
      loadPendingMembers();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [profile?.id, profile?.role]);

  // REFRESH PENDING MEMBER STATUS
  useEffect(() => {
    if (
      !user ||
      profile?.role !== 'member' ||
      profile?.status !== 'pending'
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      loadProfile(user);
    }, 10000);

    return () => window.clearInterval(interval);
  }, [user, profile?.role, profile?.status]);

  // LOGOUT
  async function handleLogout() {
    try {
      await logoutUser();
    } catch (err) {
      alert('Logout failed: ' + err.message);
    }
  }

  // LOADING
  if (loading) {
    return (
      <div className="loading">
        Loading J Cooperative...
      </div>
    );
  }

  // LOGIN AND REGISTER
  if (!user) {
    if (page === 'register') {
      return <Register onBack={() => setPage('login')} />;
    }

    return (
      <Login
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          setPage('dashboard');
        }}
        onRegister={() => setPage('register')}
      />
    );
  }

  // PROFILE ERROR
  if (error && !profile) {
    return (
      <div className="loading">
        <h2>Unable to Load Profile</h2>
        <p>{error}</p>

        <button onClick={refreshProfile}>
          Try Again
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="loading">
        Loading your profile...
      </div>
    );
  }

  // ADMIN DASHBOARD
  if (profile.role === 'admin') {
    return (
      <AdminDashboard
        profile={profile}
        members={members}
        pendingMembers={pendingMembers}
        stats={{
          members: members.length,
          savings: 0,
          deposits: 0,
          withdrawals: 0
        }}
        onApproveMember={handleApproveMember}
        onRejectMember={handleRejectMember}
        onLogout={handleLogout}
      />
    );
  }

  // PENDING MEMBERSHIP
  if (profile.status === 'pending') {
    return (
      <div className="loading">
        <h2>Membership Pending</h2>

        <p>
          Hello, {profile.full_name || 'Member'}!
        </p>

        <p>
          Your application is waiting for Admin approval.
        </p>

        <button
          onClick={refreshProfile}
          disabled={refreshing}
        >
          {refreshing ? 'Checking...' : 'Refresh Status'}
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // REJECTED MEMBERSHIP
  if (profile.status === 'rejected') {
    return (
      <div className="loading">
        <h2>Membership Rejected</h2>

        <p>Please contact the administrator.</p>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // ONLY APPROVED MEMBERS
  if (profile.status !== 'approved') {
    return (
      <div className="loading">
        <h2>Membership Status Unavailable</h2>
        <p>Please contact the administrator.</p>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // MEMBER DASHBOARD
  return (
    <Dashboard
      user={user}
      profile={profile}
      onLogout={handleLogout}
    />
  );
}
