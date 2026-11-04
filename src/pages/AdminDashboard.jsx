
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
  const [stats, setStats] = useState({
    members: 0,
    savings: 0,
    deposits: 0,
    withdrawals: 0
  });

  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // LOAD ADMIN DATA
  async function loadAdminData() {
    const [pendingResult, membersResult] = await Promise.all([
      supabase.rpc('admin_get_pending_members'),

      supabase
        .from('profiles')
        .select('id, full_name, email, member_number, status')
        .eq('role', 'member')
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
    ]);

    if (pendingResult.error) {
      console.error('Pending members error:', pendingResult.error);
      throw pendingResult.error;
    }

    if (membersResult.error) {
      console.error('Approved members error:', membersResult.error);
      throw membersResult.error;
    }

    const approvedMembers = (membersResult.data || []).map(member => ({
      ...member,
      account_number: member.member_number
    }));

    setPendingMembers(pendingResult.data || []);
    setMembers(approvedMembers);

    setStats({
      members: approvedMembers.length,
      savings: 0,
      deposits: 0,
      withdrawals: 0
    });
  }

  // APPROVE MEMBER
  async function handleApproveMember(memberId) {
    const { data, error } = await supabase.rpc(
      'admin_approve_member',
      { member_id: memberId }
    );

    if (error) throw error;

    await loadAdminData();

    return data;
  }

  // REJECT MEMBER
  async function handleRejectMember(memberId) {
    const { error } = await supabase.rpc(
      'admin_reject_member',
      { member_id: memberId }
    );

    if (error) throw error;

    await loadAdminData();
  }

  // LOAD PROFILE
  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setError(error.message);
      }

      setUser(data.session?.user || null);
      setLoading(false);
    }

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setUser(session?.user || null);

        if (!session?.user) {
          setProfile(null);
          setMembers([]);
          setPendingMembers([]);
          setPage('login');
          setError('');
        }
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // FETCH USER PROFILE
  useEffect(() => {
    let active = true;

    async function fetchProfile() {
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
        setError(error.message);
        setProfile(null);
        return;
      }

      setProfile(data);
      setError('');
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [user]);

  // LOAD ADMIN DASHBOARD DATA
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    loadAdminData().catch(error => {
      console.error('Unable to load admin dashboard:', error);
      setError(error.message);
    });
  }, [profile]);

  async function handleLogout() {
    await logoutUser();
  }

  if (loading) {
    return <div className="loading">Loading J Cooperative...</div>;
  }

  if (!user) {
    if (page === 'register') {
      return <Register onBack={() => setPage('login')} />;
    }

    return (
      <Login
        onLogin={loggedInUser => {
          setUser(loggedInUser);
          setPage('dashboard');
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
    return <div className="loading">Loading your profile...</div>;
  }

  // ADMIN DASHBOARD
  if (profile.role === 'admin') {
    return (
      <AdminDashboard
        profile={profile}
        stats={stats}
        members={members}
        pendingMembers={pendingMembers}
        onApproveMember={handleApproveMember}
        onRejectMember={handleRejectMember}
        onLogout={handleLogout}
      />
    );
  }

  // PENDING MEMBER
  if (profile.status === 'pending') {
    return (
      <div className="loading">
        <h2>Membership Pending</h2>
        <p>Your application is waiting for Admin approval.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // REJECTED MEMBER
  if (profile.status === 'rejected') {
    return (
      <div className="loading">
        <h2>Membership Rejected</h2>
        <p>Please contact the administrator.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (profile.status !== 'approved') {
    return <div className="loading">Your membership status is unavailable.</div>;
  }

  return (
    <Dashboard
      user={user}
      profile={profile}
      onLogout={handleLogout}
    />
  );
}
