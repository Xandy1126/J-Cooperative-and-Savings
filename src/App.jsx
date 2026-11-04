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
      setError('Unable to load your profile. Please contact the administrator.');
      setProfile(null);
      return;
    }

    setProfile(data);
    setError('');
  }

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session?.user) {
        setUser(data.session.user);
        await loadProfile(data.session.user);
      }

      if (mounted) setLoading(false);
    }

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          setPage('dashboard');
        } else {
          setUser(null);
          setProfile(null);
          setPage('login');
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
        onLogin={async (loggedInUser) => {
          setUser(loggedInUser);
          await loadProfile(loggedInUser);
          setPage('dashboard');
        }}
        onRegister={() => setPage('register')}
      />
    );
  }

  if (error) {
    return (
      <div className="loading">
        <p>{error}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (!profile) {
    return <div className="loading">Profile not found.</div>;
  }

  if (profile.role === 'admin') {
    return (
      <AdminDashboard
        profile={profile}
        onLogout={handleLogout}
      />
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
