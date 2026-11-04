
import React, { useEffect, useState, useCallback } from 'react';
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
  const loadAdminData = useCallback(async () => {
    const [pendingResult, membersResult] = await Promise.all([
      supabase.rpc('admin_get_pending_members'),

      supabase
        .from('profiles')
        .select('id, full_name, email, member_number, status, created_at')
        .eq('role', 'member')
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
    ]);

    if (pendingResult.error) {
      throw pendingResult.error;
    }

    if (membersResult.error) {
      throw membersResult.error;
    }

    const approvedMembers = (membersResult.data || []).map(member => ({
      ...member,
      account_number: member.member_number
    }));

    setPendingMembers(pendingResult.data || []);
    setMembers(approvedMembers);

    setStats(previous => ({
      ...previous,
      members: approvedMembers.length
    }));

    setError('');
  }, []);

  // APPROVE MEMBER
  async function handleApproveMember(memberId) {
    const { data, error } = await supabase.rpc(
      'admin_approve_member',
      { member_id: memberId }
    );

    if (error) {
      throw error;
    }

    await loadAdminData();

    return data;
  }

  // REJECT MEMBER
  async function handleRejectMember(memberId) {
    const { error } = await supabase.rpc(
      'admin_reject_member',
      { member_id: memberId }
    );

    if (error) {
      throw error;
    }

    await loadAdminData();
  }

  // CHECK LOGIN SESSION
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (active) {
          setUser(data.session?.user || null);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initialize();

    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;

        setUser(session?.user || null);

        if (!session?.user) {
          setProfile(null);
          setMembers([]);
          setPendingMembers([]);
          setPage('login');
          setError('');
        }
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // FETCH PROFILE
  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (active) {
          setProfile(data);
          setError('');
        }
      } catch (err) {
        if (active) {
          setProfile(null);
          setError(err.message);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [user]);

  // LOAD ADMIN DASHBOARD
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    let active = true;

    async function refreshAdminData() {
      try {
        await loadAdminData();
      } catch (err) {
        console.error('Admin dashboard error:', err);

        if (active) {
          setError(err.message);
        }
      }
    }

    refreshAdminData();

    return () => {
      active = false;
    };
  }, [profile, loadAdminData]);

  // LOGOUT
  async function handleLogout() {
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
      setPage('login');
    } catch (err) {
      setError(err.message);
    }
  }

  // LOADING
  if (loading) {
    return <div className="loading">Loading J Cooperative...</div>;
  }

  // LOGIN AND REGISTER
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
        onLogin={loggedInUser => {
          const authenticatedUser =
            loggedInUser?.user ||
            loggedInUser?.session?.user ||
            loggedInUser;

          setUser(authenticatedUser);
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
        <h2>Unable to load profile</h2>
        <p>{error}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // PROFILE LOADING
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
        stats={stats}
        members={members}
        pendingMembers={pendingMembers}
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
        <p>Your application is waiting for Admin approval.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // REJECTED MEMBERSHIP
  if (profile.status === 'rejected') {
    return (
      <div className="loading">
        <h2>Membership Rejected</h2>
        <p>Please contact the administrator.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  // UNAPPROVED MEMBERSHIP
  if (profile.status !== 'approved') {
    return (
      <div className="loading">
        <h2>Membership Unavailable</h2>
        <p>Your membership status is not yet approved.</p>
        <button onClick={handleLogout}>Logout</button>
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
