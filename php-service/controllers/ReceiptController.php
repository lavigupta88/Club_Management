<?php
/**
 * ReceiptController — Generates a printable HTML ticket for a registration.
 */

class ReceiptController
{
    public static function ticket(int $registrationId, PDO $pdo): void
    {
        $stmt = $pdo->prepare(
            "SELECT r.id AS registration_id, r.registered_at, r.status,
                    u.name AS student_name, u.email AS student_email,
                    e.title AS event_title, e.venue, e.event_date, e.start_time, e.end_time,
                    c.name AS category
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             JOIN events e ON r.event_id = e.id
             JOIN categories c ON e.category_id = c.id
             WHERE r.id = ?"
        );
        $stmt->execute([$registrationId]);
        $data = $stmt->fetch();

        if (!$data) {
            json_error('Registration not found', 404);
        }

        $ticketCode = strtoupper('CE-' . str_pad($data['registration_id'], 5, '0', STR_PAD_LEFT));
        $eventDate  = date('l, j F Y', strtotime($data['event_date']));
        $startTime  = date('g:i A', strtotime($data['start_time']));
        $endTime    = $data['end_time'] ? date('g:i A', strtotime($data['end_time'])) : '';
        $timeRange  = $endTime ? "$startTime — $endTime" : $startTime;

        header('Content-Type: text/html; charset=utf-8');

        echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket — {$data['event_title']}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #0f1117;
      color: #e2e4e9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .ticket {
      width: 100%;
      max-width: 520px;
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      overflow: hidden;
    }
    .ticket-header {
      background: linear-gradient(135deg, hsl(36, 85%, 45%) 0%, hsl(36, 70%, 35%) 100%);
      padding: 28px 32px;
      text-align: center;
    }
    .ticket-header h1 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: rgba(255,255,255,0.85);
      margin-bottom: 8px;
    }
    .ticket-header .event-name {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
    }
    .ticket-body {
      padding: 28px 32px;
    }
    .ticket-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .ticket-row:last-child { border-bottom: none; }
    .ticket-label {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255,255,255,0.45);
    }
    .ticket-value {
      font-size: 14px;
      font-weight: 500;
      color: #e2e4e9;
      text-align: right;
    }
    .ticket-footer {
      padding: 20px 32px;
      text-align: center;
      border-top: 1px dashed rgba(255,255,255,0.12);
    }
    .ticket-code {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 4px;
      color: hsl(36, 85%, 55%);
      font-family: 'Courier New', monospace;
    }
    .ticket-note {
      font-size: 11px;
      color: rgba(255,255,255,0.35);
      margin-top: 8px;
    }
    @media print {
      body { background: #fff; color: #111; }
      .ticket { border: 2px solid #333; background: #fff; backdrop-filter: none; }
      .ticket-header { background: #333; }
      .ticket-label { color: #666; }
      .ticket-value { color: #111; }
      .ticket-code { color: #b37400; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <h1>Campus Events</h1>
      <div class="event-name">{$data['event_title']}</div>
    </div>
    <div class="ticket-body">
      <div class="ticket-row">
        <span class="ticket-label">Attendee</span>
        <span class="ticket-value">{$data['student_name']}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Email</span>
        <span class="ticket-value">{$data['student_email']}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Date</span>
        <span class="ticket-value">{$eventDate}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Time</span>
        <span class="ticket-value">{$timeRange}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Venue</span>
        <span class="ticket-value">{$data['venue']}</span>
      </div>
      <div class="ticket-row">
        <span class="ticket-label">Category</span>
        <span class="ticket-value">{$data['category']}</span>
      </div>
    </div>
    <div class="ticket-footer">
      <div class="ticket-code">{$ticketCode}</div>
      <div class="ticket-note">Present this ticket at the venue entrance</div>
    </div>
  </div>
</body>
</html>
HTML;
        exit;
    }
}
