import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, MapPin, Clock, Users, CloudSun, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import './EventDetails.css';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [regStatus, setRegStatus] = useState(false);
  const [regLoading, setRegLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [weather, setWeather] = useState(null);

  useEffect(() => {
    client.get(`/events/${id}`)
      .then(res => {
        setEvent(res.data);
        if (res.data.is_outdoor && res.data.latitude && res.data.longitude) {
          fetchWeather(res.data.latitude, res.data.longitude, res.data.event_date);
        }
      })
      .catch(err => {
        error('Failed to load event details');
        navigate('/events');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && user.role === 'student') {
      client.get(`/events/${id}/registration-status`)
        .then(res => setRegStatus(res.data.registered))
        .catch(console.error)
        .finally(() => setRegLoading(false));
    } else {
      setRegLoading(false);
    }
  }, [id, user]);

  const fetchWeather = async (lat, lon, dateStr) => {
    try {
      // Free Open-Meteo API
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
      const data = await res.json();
      
      if (data && data.daily) {
        // Find the index of the event date in the forecast (if it's within the next 7 days)
        const eventDate = new Date(dateStr).toISOString().split('T')[0];
        const dateIndex = data.daily.time.indexOf(eventDate);
        
        if (dateIndex !== -1) {
          setWeather({
            maxTemp: data.daily.temperature_2m_max[dateIndex],
            minTemp: data.daily.temperature_2m_min[dateIndex],
            // Simplified weather mapping based on WMO codes
            condition: data.daily.weathercode[dateIndex] < 45 ? 'Clear/Cloudy' : 'Rain/Showers'
          });
        } else {
            setWeather({ condition: 'Forecast unavailable for this date' });
        }
      }
    } catch (err) {
      console.error('Weather API failed', err);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      info('Please log in to register');
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setActionLoading(true);
    try {
      await client.post(`/events/${id}/register`);
      success('Successfully registered for the event!');
      setRegStatus(true);
      // Optimistically update count
      setEvent(prev => ({ ...prev, registration_count: prev.registration_count + 1 }));
    } catch (err) {
      error(err.message || 'Failed to register');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    
    setActionLoading(true);
    try {
      await client.delete(`/events/${id}/register`);
      success('Registration cancelled');
      setRegStatus(false);
      setEvent(prev => ({ ...prev, registration_count: prev.registration_count - 1 }));
    } catch (err) {
      error(err.message || 'Failed to cancel registration');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div className="skeleton-card glass-panel" style={{ height: '400px' }}></div>
      </div>
    );
  }

  if (!event) return null;

  const isPast = new Date(event.event_date) < new Date(new Date().toDateString());
  const isFull = event.registration_count >= event.capacity;
  const seatsLeft = event.capacity - event.registration_count;

  return (
    <div className="event-details-page animate-fade-in">
      <div className="event-banner" style={{ backgroundImage: `url(${event.banner_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80'})` }}>
        <div className="banner-overlay"></div>
        <div className="container banner-content">
          <Link to="/events" className="back-link"><ArrowLeft size={16}/> Back to events</Link>
          <div className="event-category-badge">{event.category_name}</div>
          <h1 className="event-title-large">{event.title}</h1>
          <div className="event-organizer">Organized by {event.organizer_name}</div>
        </div>
      </div>

      <div className="container event-body">
        <div className="event-main">
          <section className="event-section glass-panel">
            <h2>About this event</h2>
            <div className="event-description">
              {event.description.split('\n').map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </section>

          {event.is_outdoor && weather && (
            <section className="event-section weather-section glass-panel">
              <h3><CloudSun size={20} className="mr-2" style={{ color: 'var(--accent)', verticalAlign: 'middle' }}/> Weather Forecast</h3>
              {weather.maxTemp ? (
                <div className="weather-info">
                  <div className="weather-temp">
                    <span className="max-temp">{weather.maxTemp}°C</span>
                    <span className="min-temp">/ {weather.minTemp}°C</span>
                  </div>
                  <div className="weather-condition">{weather.condition}</div>
                </div>
              ) : (
                <p className="text-muted">{weather.condition}</p>
              )}
            </section>
          )}
        </div>

        <aside className="event-sidebar">
          <div className="sidebar-card glass-panel sticky-sidebar">
            <div className="sidebar-details">
              <div className="detail-item">
                <Calendar className="detail-icon" size={20}/>
                <div>
                  <div className="detail-label">Date</div>
                  <div className="detail-value">{new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              
              <div className="detail-item">
                <Clock className="detail-icon" size={20}/>
                <div>
                  <div className="detail-label">Time</div>
                  <div className="detail-value">
                    {event.start_time.substring(0,5)} {event.end_time ? `- ${event.end_time.substring(0,5)}` : ''}
                  </div>
                </div>
              </div>

              <div className="detail-item">
                <MapPin className="detail-icon" size={20}/>
                <div>
                  <div className="detail-label">Venue</div>
                  <div className="detail-value">{event.venue}</div>
                  {event.is_outdoor === 1 && <span className="badge badge-outline mt-1">Outdoor</span>}
                </div>
              </div>

              <div className="detail-item">
                <Users className="detail-icon" size={20}/>
                <div>
                  <div className="detail-label">Availability</div>
                  <div className="detail-value">
                    {event.registration_count} / {event.capacity} registered
                  </div>
                  {seatsLeft > 0 && seatsLeft <= 20 && !isPast && (
                    <div className="text-warning text-sm mt-1">Only {seatsLeft} seats left!</div>
                  )}
                </div>
              </div>
            </div>

            <div className="registration-action">
              {regLoading ? (
                <button className="btn btn-primary w-100" disabled>Loading...</button>
              ) : user && user.role !== 'student' ? (
                <div className="alert alert-info">
                  <InfoIcon /> Organizers and Admins cannot register for events.
                </div>
              ) : isPast ? (
                <div className="alert alert-secondary">
                  <AlertCircle size={18}/> This event has already ended.
                </div>
              ) : regStatus ? (
                <div className="registered-state">
                  <div className="success-message">
                    <CheckCircle size={18}/> You are registered!
                  </div>
                  <button 
                    onClick={handleCancel} 
                    className="btn btn-ghost w-100 text-danger mt-2"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel Registration'}
                  </button>
                </div>
              ) : isFull ? (
                <div className="alert alert-warning">
                  <AlertCircle size={18}/> Event is full.
                </div>
              ) : (
                <button 
                  onClick={handleRegister} 
                  className="btn btn-primary w-100 btn-lg"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Register Now'}
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoIcon() {
  return <AlertCircle size={18} style={{ marginRight: '8px' }} />;
}
