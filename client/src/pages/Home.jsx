import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/apiClient';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import './Home.css';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/events?limit=3&sortBy=event_date&order=asc')
      .then(res => setEvents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      <section className="hero container">
        <div className="hero-content">
          <h1 className="hero-title">
            Experience <br />
            <span className="text-gradient">TCET Life</span>
          </h1>
          <p className="hero-subtitle">
            Discover and register for the most exciting events happening at TCET. From tech hackathons to cultural nights, be part of the community.
          </p>
          <div className="hero-actions">
            <Link to="/events" className="btn btn-primary">
              Explore Events <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="featured-events container">
        <div className="section-header">
          <h2>Upcoming Events</h2>
          <Link to="/events" className="view-all">View all</Link>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card glass-panel"></div>)}
          </div>
        ) : (
          <div className="event-grid">
            {events.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="event-card glass-panel">
                <div className="card-image" style={{ backgroundImage: `url(${event.banner_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80'})` }}>
                  <div className="card-category">{event.category_name}</div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{event.title}</h3>
                  <div className="card-meta">
                    <span className="meta-item"><Calendar size={14}/> {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <span className="meta-item"><MapPin size={14}/> {event.venue}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
