import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Download, AlertCircle } from 'lucide-react';
import './MyRegistrations.css';

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const { error } = useToast();

  useEffect(() => {
    client.get('/registrations/me')
      .then(res => setRegistrations(res.data))
      .catch(err => error(err.message || 'Failed to load registrations'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadTicket = async (regId) => {
    try {
      const html = await client.get(`/registrations/${regId}/ticket`);
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${regId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      error('Failed to download ticket');
    }
  };

  const now = new Date(new Date().toDateString());
  const upcoming = registrations.filter(r => r.registration_status === 'registered' && new Date(r.event_date) >= now);
  const past = registrations.filter(r => r.registration_status === 'registered' && new Date(r.event_date) < now);
  const cancelled = registrations.filter(r => r.registration_status === 'cancelled');

  const displayedList = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled;

  return (
    <div className="my-registrations container animate-fade-in">
      <div className="page-header">
        <h1>My Tickets</h1>
        <p className="page-subtitle">Manage your event registrations and download tickets.</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
          Past ({past.length})
        </button>
        <button className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>
          Cancelled ({cancelled.length})
        </button>
      </div>

      {loading ? (
        <div className="skeleton-grid">
          <div className="skeleton-card glass-panel" style={{height:'150px'}}></div>
          <div className="skeleton-card glass-panel" style={{height:'150px'}}></div>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="empty-state glass-panel">
          <AlertCircle size={48} className="text-muted mb-3 mx-auto" />
          <h3>No {activeTab} registrations</h3>
          {activeTab === 'upcoming' && (
            <Link to="/events" className="btn btn-primary mt-3">Browse Events</Link>
          )}
        </div>
      ) : (
        <div className="ticket-list">
          {displayedList.map(reg => (
            <div key={reg.registration_id} className="ticket-card glass-panel">
              <div className="ticket-date-box">
                <div className="ticket-month">{new Date(reg.event_date).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</div>
                <div className="ticket-day">{new Date(reg.event_date).getDate()}</div>
              </div>
              <div className="ticket-content">
                <div className="ticket-header-row">
                  <span className="badge badge-outline">{reg.category_name}</span>
                  {reg.attended > 0 && <span className="badge badge-success ml-2">Attended</span>}
                </div>
                <h3 className="ticket-title"><Link to={`/events/${reg.event_id}`}>{reg.title}</Link></h3>
                <div className="ticket-meta">
                  <span className="meta-item"><Calendar size={14}/> {reg.start_time.substring(0,5)}</span>
                  <span className="meta-item"><MapPin size={14}/> {reg.venue}</span>
                </div>
              </div>
              <div className="ticket-actions">
                {reg.registration_status === 'registered' && activeTab === 'upcoming' && (
                  <button onClick={() => handleDownloadTicket(reg.registration_id)} className="btn btn-primary btn-icon">
                    <Download size={18}/> Download Ticket
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
