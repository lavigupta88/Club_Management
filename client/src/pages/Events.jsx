import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import client from '../api/apiClient';
import { Search, Calendar, MapPin, Filter } from 'lucide-react';
import './Events.css';

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    client.get('/events/categories')
      .then(res => setCategories(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams(searchParams);
    query.set('limit', '12'); // Fixed limit for grid
    
    client.get(`/events?${query.toString()}`)
      .then(res => {
        setEvents(res.data);
        setPagination(res.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const q = fd.get('search');
    const newParams = new URLSearchParams(searchParams);
    if (q) newParams.set('search', q);
    else newParams.delete('search');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategory = (c) => {
    const newParams = new URLSearchParams(searchParams);
    if (c) newParams.set('category', c);
    else newParams.delete('category');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePage = (p) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', p.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="events-page container animate-fade-in">
      <div className="page-header">
        <h1>Discover Events</h1>
        <p className="page-subtitle">Find your next big experience at TCET.</p>
      </div>

      <div className="filters glass-panel">
        <form onSubmit={handleSearch} className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            name="search"
            placeholder="Search events by title, description or venue..."
            defaultValue={search}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        
        <div className="category-filters">
          <div className="filter-label"><Filter size={16}/> Filter by category:</div>
          <div className="category-chips">
            <button 
              className={`chip ${!category ? 'active' : ''}`}
              onClick={() => handleCategory('')}
            >
              All
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                className={`chip ${category === cat.name ? 'active' : ''}`}
                onClick={() => handleCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card glass-panel"></div>)}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state glass-panel">
          <h3>No events found</h3>
          <p>Try adjusting your search or filters.</p>
          <button onClick={() => setSearchParams({})} className="btn btn-ghost mt-3">Clear all filters</button>
        </div>
      ) : (
        <>
          <div className="event-grid">
            {events.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="event-card glass-panel">
                <div className="card-image" style={{ backgroundImage: `url(${event.banner_url || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80'})` }}>
                  <div className="card-category">{event.category_name}</div>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{event.title}</h3>
                  <div className="card-meta">
                    <span className="meta-item"><Calendar size={14}/> {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="meta-item"><MapPin size={14}/> {event.venue}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-ghost" 
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
              >
                Previous
              </button>
              <span className="page-info">Page {page} of {pagination.totalPages}</span>
              <button 
                className="btn btn-ghost" 
                disabled={page >= pagination.totalPages}
                onClick={() => handlePage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
