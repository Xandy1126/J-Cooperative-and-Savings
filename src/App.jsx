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
  const [pendingMembers, setPendingMembers] = useState([]);

  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [error, setError] = useState('');
  const [pendingError, setPendingError] = useState('');

  // Listen for login and logout
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user || null);

      if (!session?.user) {
        setProfile(null);
        setPendingMembers([]);
        setError('');
        setPendingError('');
        setPage('login');
      }
    });

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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load logged-in user's profile
  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setProfile(null);
      } else if (!data) {
        setError('Profile not found. Please contact the administrator.');
        setProfile(null);
      } else {
        setProfile(data);
        setError('');
      }

      setProfileLoading(false);
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Get pending membership applications
  const loadPendingMembers = useCallback(async () => {
    setPendingLoading(true);
    setPendingError('');

    const { data, error } = await supabase.rpc(
      'admin_get_pending_members'
    );

    if (error) {
      console.error('Pending members error:', error);
      setPendingError(error.message);
      setPendingMembers([]);
    } else {
      setPendingMembers(data || []);
    }

    setPendingLoading(false);
  }, []);

  // Automatically load applications when Admin logs in
  useEffect(() => {
    if (profile?.role === 'admin') {
      loadPendingMembers();
    } else {
      setPendingMembers([]);
    }
  }, [profile, loadPendingMembers]);

  // Approve member
  async function handleApproveMember(memberId) {
    const confirmed = window.confirm(
      'Are you sure you want to approve this membership application?'
    );

    if (!confirmed) return;

    const { data, error } = await supabase.rpc(
      'admin_approve_member',
      {
        member_id: memberId
      }
    );

    if (error) {
      alert('Approval failed: ' + error.message);
      return;
    }

    alert('Member approved successfully! Account Number: ' + data);

    await loadPendingMembers();
  }

  // Reject member
  async function handleRejectMember(memberId) {
    const confirmed = window.confirm(
      'Are you sure you want to reject this membership application?'
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc(
      'admin_reject_member',
      {
        member_id: memberId
      }
    );

    if (error) {
      alert('Rejection failed: ' + error.message);
      return;
    }

    alert('Membership application rejected.');

    await loadPendingMembers();
  }

  // Logout
  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      alert('Logout failed: ' + error.message);
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="loading">
        Loading J Cooperative...
      </div>
    );
  }

  // Login and registration pages
  if (!user) {
    if (page === 'register') {
      return (
        <Register
          onBack={() => setPage('login')}
        />
      );
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

  // Profile loading error
  if (error) {
    return (
      <div className="loading">
        <p>{error}</p>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="loading">
        Profile not found.
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // Admin Dashboard
  if (profile.role === 'admin') {
    return (
      <>
        {pendingError && (
          <div
            style={{
              padding: '12px',
              margin: '12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px'
            }}
          >
            Unable to load pending applications: {pendingError}
          </div>
        )}

        <AdminDashboard
          profile={profile}
          onLogout={handleLogout}
          pendingMembers={pendingMembers}
          onApproveMember={handleApproveMember}
          onRejectMember={handleRejectMember}
          pendingLoading={pendingLoading}
        />
      </>
    );
  }

  // Pending Member
  if (profile.status === 'pending') {
    return (
      <div className="loading">
        <h2>Membership Application Pending</h2>
        <p>
          Your registration has been received.
          Please wait for the administrator to approve your membership.
        </p>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // Rejected Member
  if (profile.status === 'rejected') {
    return (
      <div className="loading">
        <h2>Membership Application Rejected</h2>
        <p>
          Your membership application was not approved.
          Please contact the administrator.
        </p>
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // Approved Member Dashboard
  return (
    <Dashboard
      user={user}
      profile={profile}
      onLogout={handleLogout}
    />
  );
}
