import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Plus, Edit, Trash2, Users } from 'lucide-react';
import './Admin.css';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const loadEvents = () => {
    setLoading(true);
    client.get('/events')
      .then(res => setEvents(res.data.data || res.data))
      .catch(err => error(err.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await client.delete(`/events/${id}`);
      success('Event deleted successfully');
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      error(err.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0' }}>Loading events management...</div>;
  }

  return (
    <div className="admin-page container animate-fade-in">
      <div className="admin-header">
        <div>
          <h1>Manage Events</h1>
          <p className="page-subtitle">Create, update, or remove club events.</p>
        </div>
        <div className="admin-actions">
          <Link to="/admin" className="btn btn-ghost">Dashboard</Link>
          <Link to="/admin/events/new" className="btn btn-primary">
            <Plus size={18} style={{ marginRight: '6px' }} /> Create Event
          </Link>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No events found. Click "Create Event" to add one.
                </td>
              </tr>
            ) : (
              events.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <strong>{ev.title}</strong>
                  </td>
                  <td><span className="badge badge-secondary">{ev.category_name || 'General'}</span></td>
                  <td>{ev.event_date} ({ev.start_time?.slice(0,5)})</td>
                  <td>{ev.venue}</td>
                  <td>{ev.registered_count || 0} / {ev.capacity}</td>
                  <td>
                    <span className={`badge ${ev.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {ev.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/admin/events/${ev.id}/registrations`} className="btn btn-sm btn-ghost" title="View Registrations">
                        <Users size={16} />
                      </Link>
                      <Link to={`/admin/events/${ev.id}/edit`} className="btn btn-sm btn-ghost" title="Edit Event">
                        <Edit size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(ev.id, ev.title)} 
                        className="btn btn-sm btn-danger" 
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
