import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { Users, Calendar, Ticket, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Admin.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    client.get('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(err => error(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0' }}>Loading dashboard...</div>;
  }

  if (!stats) return null;

  return (
    <div className="admin-page container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of all events and registrations.</p>
        </div>
        <div className="admin-actions">
          <Link to="/admin/events" className="btn btn-ghost">Manage Events</Link>
          <Link to="/admin/events/new" className="btn btn-primary">Create Event</Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon"><Calendar size={24}/></div>
          <div className="stat-content">
            <div className="stat-label">Total Events</div>
            <div className="stat-value">{stats.totalEvents}</div>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon"><Ticket size={24}/></div>
          <div className="stat-content">
            <div className="stat-label">Total Registrations</div>
            <div className="stat-value">{stats.totalRegistrations}</div>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon"><Users size={24}/></div>
          <div className="stat-content">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon"><TrendingUp size={24}/></div>
          <div className="stat-content">
            <div className="stat-label">Avg. Fill Rate</div>
            <div className="stat-value">{stats.fillRate}%</div>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card glass-panel">
          <h3>Registrations by Category</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                />
                <Bar dataKey="registrations" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
