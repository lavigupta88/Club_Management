<?php
/**
 * ExportController — CSV export of registrations for a given event.
 */

class ExportController
{
    public static function csv(int $eventId, PDO $pdo): void
    {
        // Verify event exists
        $stmt = $pdo->prepare('SELECT id, title FROM events WHERE id = ?');
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            json_error('Event not found', 404);
        }

        // Fetch registrations
        $stmt = $pdo->prepare(
            "SELECT u.name, u.email, r.status, r.registered_at,
                    CASE WHEN a.id IS NOT NULL THEN 'Yes' ELSE 'No' END AS attended
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             LEFT JOIN attendance a ON a.registration_id = r.id
             WHERE r.event_id = ?
             ORDER BY r.registered_at ASC"
        );
        $stmt->execute([$eventId]);
        $rows = $stmt->fetchAll();

        // Build CSV
        $filename = 'registrations_' . preg_replace('/[^a-zA-Z0-9]/', '_', $event['title']) . '.csv';

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['Name', 'Email', 'Status', 'Registered At', 'Attended']);

        foreach ($rows as $row) {
            fputcsv($out, [
                $row['name'],
                $row['email'],
                ucfirst($row['status']),
                $row['registered_at'],
                $row['attended'],
            ]);
        }

        fclose($out);
        exit;
    }
}
