# Campus Events

A production-quality College Event Management web application.

## Tech Stack
* **Frontend:** React (Vite) + CSS Modules (Glassmorphism design)
* **Backend:** Node.js + Express.js REST API
* **Microservice:** PHP 8 (Reports, Tickets)
* **Database:** MySQL

## Requirements
* Node.js (v18+)
* PHP 8.0+
* MySQL (or XAMPP)

## Installation & Setup

1. **Database Setup**
   * Start MySQL (via XAMPP or natively).
   * Open `server/.env` and update your `DB_PASSWORD` if required.
   * Run the seed script to create tables and insert dummy data:
     ```bash
     cd server
     npm run seed
     ```

2. **Backend (Express)**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *Runs on http://localhost:5000*

3. **PHP Microservice**
   ```bash
   cd php-service
   php -S localhost:8080 -t .
   ```
   *Runs on http://localhost:8080*

4. **Frontend (React)**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Runs on http://localhost:5173*

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@campus.edu` | `Admin@123` |
| **Organizer** | `priya.sharma@campus.edu` | `Organizer@123` |
| **Student** | `rahul.kumar@campus.edu` | `Student@123` |

## API Reference (v1)

### Auth
* `POST /api/v1/auth/register` - Register a student account
* `POST /api/v1/auth/login` - Authenticate & get JWT token
* `GET /api/v1/auth/me` - Get current user profile

### Events
* `GET /api/v1/events` - List events (Supports `?page=1&limit=10&search=xyz&category=Technical`)
* `GET /api/v1/events/:id` - Get single event details
* `POST /api/v1/events` - Create event (Admin/Org)
* `PUT /api/v1/events/:id` - Update event (Admin/Org)
* `DELETE /api/v1/events/:id` - Delete event (Admin)

### Registrations
* `POST /api/v1/events/:id/register` - Register for an event
* `DELETE /api/v1/events/:id/register` - Cancel registration
* `GET /api/v1/registrations/me` - List user's registrations
* `GET /api/v1/registrations/:id/ticket` - Proxy to PHP for HTML ticket

### Admin (Proxy to PHP)
* `GET /api/v1/admin/dashboard` - Stats overview
* `GET /api/v1/admin/events/:id/registrations` - List registrations for an event
* `POST /api/v1/admin/attendance` - Mark attendance (`{registration_id: 1}`)
* `GET /api/v1/admin/events/:id/export/csv` - Proxy to PHP CSV export
