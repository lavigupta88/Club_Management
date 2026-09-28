import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Download, CheckCircle, XCircle, Search } from 'lucide-react';
import './Admin.css';

export default function RegistrationsTable() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [event, setEvent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { success, error } = useToast();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      client.get(`/events/${id}`),
      client.get(`/admin/events/${id}/registrations`),
      client.get(`/admin/events/${id}/attendance-summary`).catch(() => null)
    ])
      .then(([evRes, regRes, sumRes]) => {
        setEvent(evRes.data.data || evRes.data);
        setRegistrations(regRes.data.data || regRes.data || []);
        if (sumRes && sumRes.data) {
          setSummary(sumRes.data.data || sumRes.data);
        }
      })
      .catch(err => error(err.message || 'Failed to load registration data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleAttendance = async (regId) => {
    try {
      await client.post('/admin/attendance', { registration_id: regId });
      success('Attendance updated');
      setRegistrations(prev =>
        prev.map(r => r.registration_id === regId ? { ...r, attended: r.attended ? 0 : 1 } : r)
      );
    } catch (err) {
      error(err.message || 'Failed to update attendance');
    }
  };

  const handleExportCsv = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    window.open(`${backendUrl}/admin/events/${id}/export/csv`, '_blank');
  };

  const filteredRegistrations = registrations.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0' }}>Loading registrations...</div>;
  }

  return (
    <div className="admin-page container animate-fade-in">
      <div className="admin-header">
        <div>
          <Link to="/admin/events" className="btn btn-sm btn-ghost" style={{ marginBottom: '8px' }}>
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to Events
          </Link>
          <h1>Registrations: {event?.title}</h1>
          <p className="page-subtitle">Manage attendees and track attendance.</p>
        </div>
        <div className="admin-actions">
          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={18} style={{ marginRight: '6px' }} /> Export CSV
          </button>
        </div>
      </div>

      {summary && (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card glass-panel">
            <div className="stat-content">
              <div className="stat-label">Total Registered</div>
              <div className="stat-value">{summary.total_registered || 0}</div>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-content">
              <div className="stat-label">Attended</div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{summary.attended || 0}</div>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-content">
              <div className="stat-label">Attendance Rate</div>
              <div className="stat-value">{summary.attendance_rate || 0}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="search-box" style={{ maxWidth: '300px', marginBottom: '1.5rem' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search attendee by name or email..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reg ID</th>
                <th>Attendee Name</th>
                <th>Email</th>
                <th>Registered At</th>
                <th>Status</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No registrations found.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(r => (
                  <tr key={r.registration_id}>
                    <td>#{r.registration_id}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.email}</td>
                    <td>{new Date(r.registered_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${r.status === 'registered' ? 'badge-success' : 'badge-danger'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleAttendance(r.registration_id)}
                        className={`btn btn-sm ${r.attended ? 'btn-success' : 'btn-ghost'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {r.attended ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                        {r.attended ? 'Attended' : 'Mark Attended'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
