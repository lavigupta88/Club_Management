import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import client from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Save } from 'lucide-react';
import './Admin.css';

export default function EventForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    venue: '',
    event_date: '',
    start_time: '10:00',
    end_time: '12:00',
    capacity: 100,
    banner_url: '',
    is_outdoor: false,
    latitude: '',
    longitude: '',
    status: 'published'
  });

  useEffect(() => {
    // Load categories
    client.get('/events/categories')
      .then(res => {
        const cats = res.data.data || res.data;
        setCategories(cats);
        if (cats.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: cats[0].id }));
        }
      })
      .catch(err => console.error('Failed to load categories', err));

    // If editing, load event details
    if (isEdit) {
      client.get(`/events/${id}`)
        .then(res => {
          const ev = res.data.data || res.data;
          setFormData({
            title: ev.title || '',
            description: ev.description || '',
            category_id: ev.category_id || '',
            venue: ev.venue || '',
            event_date: ev.event_date ? ev.event_date.split('T')[0] : '',
            start_time: ev.start_time || '10:00',
            end_time: ev.end_time || '',
            capacity: ev.capacity || 100,
            banner_url: ev.banner_url || '',
            is_outdoor: Boolean(ev.is_outdoor),
            latitude: ev.latitude || '',
            longitude: ev.longitude || '',
            status: ev.status || 'published'
          });
        })
        .catch(err => error(err.message || 'Failed to load event details'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id, 10),
        capacity: parseInt(formData.capacity, 10),
        is_outdoor: formData.is_outdoor ? 1 : 0
      };

      if (isEdit) {
        await client.put(`/events/${id}`, payload);
        success('Event updated successfully');
      } else {
        await client.post('/events', payload);
        success('Event created successfully');
      }
      navigate('/admin/events');
    } catch (err) {
      error(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem 0' }}>Loading event form...</div>;
  }

  return (
    <div className="admin-page container animate-fade-in">
      <div className="admin-header">
        <div>
          <Link to="/admin/events" className="btn btn-sm btn-ghost" style={{ marginBottom: '8px' }}>
            <ArrowLeft size={16} style={{ marginRight: '4px' }} /> Back to Events
          </Link>
          <h1>{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input 
              type="text" 
              name="title" 
              className="form-control" 
              required 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g. Annual Tech Symposium"
            />
          </div>

          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select 
                name="category_id" 
                className="form-control" 
                required 
                value={formData.category_id} 
                onChange={handleChange}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                name="status" 
                className="form-control" 
                value={formData.status} 
                onChange={handleChange}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Description *</label>
            <textarea 
              name="description" 
              className="form-control" 
              rows="5" 
              required 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Detailed description of the event..."
            />
          </div>

          <div className="grid grid-3" style={{ gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Event Date *</label>
              <input 
                type="date" 
                name="event_date" 
                className="form-control" 
                required 
                value={formData.event_date} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input 
                type="time" 
                name="start_time" 
                className="form-control" 
                required 
                value={formData.start_time} 
                onChange={handleChange} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input 
                type="time" 
                name="end_time" 
                className="form-control" 
                value={formData.end_time} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Venue *</label>
              <input 
                type="text" 
                name="venue" 
                className="form-control" 
                required 
                value={formData.venue} 
                onChange={handleChange} 
                placeholder="e.g. Main Auditorium"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Capacity (Max Seats) *</label>
              <input 
                type="number" 
                name="capacity" 
                className="form-control" 
                min="1" 
                required 
                value={formData.capacity} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Banner Image URL</label>
            <input 
              type="url" 
              name="banner_url" 
              className="form-control" 
              value={formData.banner_url} 
              onChange={handleChange} 
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="grid grid-3" style={{ gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  name="is_outdoor" 
                  checked={formData.is_outdoor} 
                  onChange={handleChange} 
                />
                Outdoor Event (Fetch Weather)
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input 
                type="number" 
                step="any" 
                name="latitude" 
                className="form-control" 
                value={formData.latitude} 
                onChange={handleChange} 
                placeholder="12.9716"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input 
                type="number" 
                step="any" 
                name="longitude" 
                className="form-control" 
                value={formData.longitude} 
                onChange={handleChange} 
                placeholder="77.5946"
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/admin/events" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} style={{ marginRight: '6px' }} />
              {submitting ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
