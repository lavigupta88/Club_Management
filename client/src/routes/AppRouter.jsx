import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';

import Home from '../pages/Home';
import Events from '../pages/Events';
import EventDetails from '../pages/EventDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import MyRegistrations from '../pages/MyRegistrations';
import Dashboard from '../pages/Dashboard';
import ManageEvents from '../pages/ManageEvents';
import EventForm from '../pages/EventForm';
import RegistrationsTable from '../pages/RegistrationsTable';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: 'events', element: <Events /> },
      { path: 'events/:id', element: <EventDetails /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      
      // Student protected routes
      {
        element: <ProtectedRoute allowedRoles={['student']} />,
        children: [
          { path: 'my-registrations', element: <MyRegistrations /> },
        ]
      },
      
      // Admin/Organizer protected routes
      {
        element: <ProtectedRoute allowedRoles={['admin', 'organizer']} />,
        children: [
          { path: 'admin', element: <Dashboard /> },
          { path: 'admin/events', element: <ManageEvents /> },
          { path: 'admin/events/new', element: <EventForm /> },
          { path: 'admin/events/:id/edit', element: <EventForm /> },
          { path: 'admin/events/:id/registrations', element: <RegistrationsTable /> },
        ]
      }
    ]
  }
]);

export default router;
