import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--accent)' }}>404</h1>
      <h2>Page not found</h2>
      <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">Go back home</Link>
    </div>
  );
}
