/**
 * Seed script — populates the campus_events database with demo data.
 * Run: npm run seed (from /server)
 */
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');
const path   = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = require('../config/env');

async function seed() {
  const conn = await mysql.createConnection({
    host: env.db.host, port: env.db.port,
    user: env.db.user, password: env.db.password,
    multipleStatements: true,
  });

  console.log('[Seed] Connected to MySQL');

  // Create database
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${env.db.database}\``);

  // Drop tables in reverse dependency order
  await conn.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS attendance;
    DROP TABLE IF EXISTS registrations;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS roles;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  // Create tables
  await conn.query(`
    CREATE TABLE roles (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(20) NOT NULL UNIQUE
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100)  NOT NULL,
      email         VARCHAR(150)  NOT NULL UNIQUE,
      password_hash VARCHAR(255)  NOT NULL,
      role_id       INT           NOT NULL DEFAULT 1,
      avatar_url    VARCHAR(500)  DEFAULT NULL,
      created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      INDEX idx_users_email (email)
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE categories (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      icon VARCHAR(50) DEFAULT NULL
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE events (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(200)  NOT NULL,
      description  TEXT          NOT NULL,
      category_id  INT           NOT NULL,
      organizer_id INT           NOT NULL,
      venue        VARCHAR(200)  NOT NULL,
      event_date   DATE          NOT NULL,
      start_time   TIME          NOT NULL,
      end_time     TIME          DEFAULT NULL,
      banner_url   VARCHAR(500)  DEFAULT NULL,
      capacity     INT           NOT NULL DEFAULT 100,
      is_outdoor   TINYINT(1)    DEFAULT 0,
      latitude     DECIMAL(10,7) DEFAULT NULL,
      longitude    DECIMAL(10,7) DEFAULT NULL,
      status       ENUM('draft','published','cancelled') DEFAULT 'published',
      created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id)  REFERENCES categories(id),
      FOREIGN KEY (organizer_id) REFERENCES users(id),
      INDEX idx_events_date     (event_date),
      INDEX idx_events_status   (status),
      INDEX idx_events_category (category_id)
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE registrations (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT  NOT NULL,
      event_id      INT  NOT NULL,
      status        ENUM('registered','cancelled') DEFAULT 'registered',
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE INDEX idx_reg_user_event (user_id, event_id),
      INDEX idx_reg_event (event_id)
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE attendance (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      registration_id INT NOT NULL,
      marked_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      marked_by       INT NOT NULL,
      FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
      FOREIGN KEY (marked_by)       REFERENCES users(id),
      UNIQUE INDEX idx_att_registration (registration_id)
    ) ENGINE=InnoDB
  `);

  console.log('[Seed] Tables created');

  // Roles
  await conn.query("INSERT INTO roles (name) VALUES ('student'), ('organizer'), ('admin')");

  // Users (bcrypt hashed passwords)
  const adminHash     = await bcrypt.hash('Admin@123', 10);
  const organizerHash = await bcrypt.hash('Organizer@123', 10);
  const studentHash   = await bcrypt.hash('Student@123', 10);

  await conn.query(
    `INSERT INTO users (name, email, password_hash, role_id) VALUES
      ('Dr. Anand Verma',   'admin@campus.edu',          ?, 3),
      ('Priya Sharma',      'priya.sharma@campus.edu',   ?, 2),
      ('Prof. Meera Iyer',  'meera.iyer@campus.edu',     ?, 2),
      ('Rahul Kumar',       'rahul.kumar@campus.edu',    ?, 1),
      ('Sneha Patel',       'sneha.patel@campus.edu',    ?, 1),
      ('Arjun Mehta',       'arjun.mehta@campus.edu',    ?, 1),
      ('Kavya Nair',        'kavya.nair@campus.edu',     ?, 1),
      ('Rohan Desai',       'rohan.desai@campus.edu',    ?, 1)`,
    [adminHash, organizerHash, organizerHash, studentHash, studentHash, studentHash, studentHash, studentHash]
  );

  console.log('[Seed] Users created');

  // Categories
  await conn.query(
    `INSERT INTO categories (name, icon) VALUES
      ('Technical',  'cpu'),
      ('Cultural',   'music'),
      ('Sports',     'trophy'),
      ('Workshop',   'wrench'),
      ('Seminar',    'presentation'),
      ('Hackathon',  'code'),
      ('Placement',  'briefcase')`
  );

  // Events — dates relative to "now" for realistic demo
  // Using fixed dates around Sep-Dec 2026 for reproducibility
  await conn.query(
    `INSERT INTO events (title, description, category_id, organizer_id, venue, event_date, start_time, end_time, capacity, is_outdoor, latitude, longitude, banner_url) VALUES
      ('Orientation Day 2026',
       'Welcome session for all freshers. Meet the faculty, student council, and explore campus clubs. Includes a guided campus tour, interactive Q&A with department heads, and a networking lunch.',
       5, 1, 'Main Auditorium, Block A', '2026-08-18', '09:00', '13:00', 500, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80'),

      ('Code Sprint 1.0',
       'A fast-paced 6-hour coding competition. Solve algorithmic challenges across three difficulty tiers. Prizes worth Rs. 25,000 for the top three teams. Open to all branches.',
       1, 2, 'CS Lab Complex, Block D', '2026-08-29', '10:00', '16:00', 60, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80'),

      ('Independence Day Cultural Program',
       'Patriotic performances, folk dances from across India, a short film screening by the Film Society, and an address by the Chief Guest, Padma Shri recipient Dr. Sunita Rao.',
       2, 1, 'Central Lawn', '2026-08-15', '08:00', '11:30', 300, 1, 28.6139, 77.2090,
       'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80'),

      ('Alumni Connect: Career Roadmap',
       'Panel discussion with five distinguished alumni working at Microsoft, Flipkart, ISRO, McKinsey, and a Y Combinator-backed startup. Learn about career paths, industry expectations, and how to stand out.',
       5, 3, 'Seminar Hall B, Block C', '2026-09-12', '14:00', '17:00', 150, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80'),

      ('TechFest 2026: Innovation Summit',
       'The flagship annual tech fest featuring keynotes from industry leaders, project exhibitions by final-year students, a robotics demo arena, and the grand finale of the inter-college quiz. Two days of pure innovation.',
       1, 2, 'Main Auditorium & Exhibition Hall', '2026-10-10', '09:30', '18:00', 400, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'),

      ('Inter-College Cricket Tournament',
       'Six colleges compete in a T20 format over two days. Matches on both the main ground and the practice pitch. Food stalls, live commentary by RJ Kiran, and the winner takes home the Chancellor\\'s Cup.',
       3, 1, 'Sports Ground', '2026-10-15', '07:30', '18:00', 200, 1, 28.6150, 77.2100,
       'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80'),

      ('Quantum Computing Workshop',
       'A hands-on, half-day workshop led by Dr. Ravi Shankar from IISc Bangalore. Topics include qubits, superposition, entanglement, and programming on IBM Qiskit. Laptops required; prior Python knowledge assumed.',
       4, 3, 'CS Lab 201, Block D', '2026-10-18', '10:00', '14:00', 40, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80'),

      ('Startup Pitch Night',
       'Ten student-led startups pitch to a panel of angel investors and VCs. Three-minute pitches followed by Q&A. The top team receives seed funding of Rs. 1,00,000 from the E-Cell incubator.',
       5, 2, 'Entrepreneurship Cell, Innovation Block', '2026-10-22', '18:00', '21:00', 100, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80'),

      ('Rang: Annual Cultural Night',
       'The most awaited evening of the year. Live band performance by The Local Train, stand-up comedy by campus comedians, classical dance showcase, and a fashion walk. Gates close at 7 PM sharp.',
       2, 1, 'Open Air Theatre', '2026-10-28', '17:30', '22:00', 500, 1, 28.6130, 77.2080,
       'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'),

      ('Machine Learning Bootcamp',
       'Three-session bootcamp covering supervised learning, neural networks, and real-world deployment. Build and deploy a sentiment analysis model by day three. Certificates issued to all who complete assignments.',
       4, 3, 'Data Science Lab, Block E', '2026-11-05', '10:00', '16:00', 50, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80'),

      ('Placement Talk: Cracking Product Roles',
       'Interactive session by Ananya Joshi, Product Manager at Google Bangalore, on how to prepare for PM interviews, build a product portfolio, and transition from engineering to product management.',
       7, 2, 'Placement Auditorium, Admin Block', '2026-11-12', '11:00', '13:30', 300, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80'),

      ('Hackathon: Build for Bharat',
       'A 36-hour hackathon focused on solving real problems in Indian agriculture, healthcare, and education. Mentors from Razorpay, Swiggy, and Zerodha. Top prize: Rs. 50,000 and internship offers.',
       6, 2, 'Innovation Hub, Ground Floor', '2026-11-20', '18:00', '06:00', 120, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80'),

      ('Photography Walk & Exhibition',
       'Morning walk through the heritage neighbourhood near campus, guided by award-winning photographer Nikhil Vyas. Afternoon: curate and exhibit your best shots in the gallery. Open to all skill levels.',
       2, 3, 'Campus Main Gate (start point)', '2026-11-25', '06:30', '15:00', 60, 1, 28.6145, 77.2095,
       'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80'),

      ('Sports Day 2026',
       'Annual sports day with track and field events, tug of war, relay races, and the much-awaited staff vs students cricket match. Medal ceremony by the Vice Chancellor at 5 PM.',
       3, 1, 'Athletics Track & Main Ground', '2026-12-05', '07:00', '17:30', 400, 1, 28.6155, 77.2105,
       'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=800&q=80'),

      ('TEDx Campus: Ideas Worth Sharing',
       'Six speakers, six transformative ideas. This year\\'s theme: "Beyond Boundaries." Speakers include a 22-year-old climate activist, a neuroscience researcher, and the founder of a rural ed-tech platform.',
       5, 1, 'Main Auditorium, Block A', '2026-12-15', '10:00', '16:00', 250, 0, NULL, NULL,
       'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80')`
  );

  console.log('[Seed] Events created');

  // Sample registrations for demo accounts
  await conn.query(
    `INSERT INTO registrations (user_id, event_id, status) VALUES
      (4, 5, 'registered'), (4, 6, 'registered'), (4, 7, 'registered'), (4, 9, 'registered'),
      (5, 5, 'registered'), (5, 8, 'registered'), (5, 9, 'registered'), (5, 10, 'registered'),
      (6, 5, 'registered'), (6, 6, 'registered'), (6, 11, 'registered'), (6, 12, 'registered'),
      (7, 7, 'registered'), (7, 9, 'registered'), (7, 10, 'registered'),
      (8, 5, 'registered'), (8, 12, 'registered'), (8, 14, 'registered'),
      (4, 1, 'registered'), (5, 1, 'registered'), (6, 1, 'registered'), (7, 1, 'registered'), (8, 1, 'registered'),
      (4, 3, 'registered'), (5, 3, 'registered'), (6, 3, 'registered')`
  );

  // Mark attendance for past events
  await conn.query(
    `INSERT INTO attendance (registration_id, marked_by) VALUES
      (19, 1), (20, 1), (21, 1), (22, 1), (23, 1),
      (24, 1), (25, 1), (26, 1)`
  );

  console.log('[Seed] Registrations and attendance created');
  console.log('[Seed] Done! Database seeded successfully.');
  console.log('');
  console.log('  Default credentials:');
  console.log('  ─────────────────────────────────────');
  console.log('  Admin:     admin@campus.edu / Admin@123');
  console.log('  Organizer: priya.sharma@campus.edu / Organizer@123');
  console.log('  Student:   rahul.kumar@campus.edu / Student@123');
  console.log('');

  await conn.end();
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
