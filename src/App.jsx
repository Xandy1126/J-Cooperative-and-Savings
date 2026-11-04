
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
  const [pendingMembers, setPendingMembers] = useState([]);
  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProfile(currentUser) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      setError(error.message);
      setProfile(null);
      return null;
    }

    setProfile(data);
    setError('');
    return data;
  }

  async function loadPendingMembers() {
    const { data, error } = await supabase.rpc(
      'admin_get_pending_members'
    );

    if (error) {
      console.error('Pending members error:', error);
      setError(error.message);
      return;
    }

    setPendingMembers(data || []);
  }

  async function handleApproveMember(memberId) {
    const { data, error } = await supabase.rpc(
      'admin_approve_member',
      { member_id: memberId }
    );

    if (error) {
      alert('Approval failed: ' + error.message);
      return;
    }

    alert('Member approved! Member Number: ' + data);
    await loadPendingMembers();
  }

  async function handleRejectMember(memberId) {
    const confirmed = window.confirm(
      'Are you sure you want to reject this membership application?'
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc(
      'admin_reject_member',
      { member_id: memberId }
    );

    if (error) {
      alert('Rejection failed: ' + error.message);
      return;
    }

    alert('Membership application rejected.');
    await loadPendingMembers();
  }

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

        setUser(session?.user || null);

        if (!session?.user) {
          setProfile(null);
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

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadPendingMembers();
    } else {
      setPendingMembers([]);
    }
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
        onLogin={(loggedInUser) => {
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

  if (profile.role === 'admin') {
    return (
      <AdminDashboard
        profile={profile}
        pendingMembers={pendingMembers}
        onApproveMember={handleApproveMember}
        onRejectMember={handleRejectMember}
        onLogout={handleLogout}
      />
    );
  }

  if (profile.status === 'pending') {
    return (
      <div className="loading">
        <h2>Membership Pending</h2>
        <p>Your application is waiting for Admin approval.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

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
