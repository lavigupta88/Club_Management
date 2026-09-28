<?php
/**
 * AttendanceController — Attendance summary stats for an event.
 */

class AttendanceController
{
    public static function summary(int $eventId, PDO $pdo): void
    {
        // Verify event exists
        $stmt = $pdo->prepare('SELECT id, title, capacity FROM events WHERE id = ?');
        $stmt->execute([$eventId]);
        $event = $stmt->fetch();

        if (!$event) {
            json_error('Event not found', 404);
        }

        // Total registered
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS total FROM registrations WHERE event_id = ? AND status = 'registered'"
        );
        $stmt->execute([$eventId]);
        $totalRegistered = (int) $stmt->fetch()['total'];

        // Total attended
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS total
             FROM attendance a
             JOIN registrations r ON a.registration_id = r.id
             WHERE r.event_id = ? AND r.status = 'registered'"
        );
        $stmt->execute([$eventId]);
        $totalAttended = (int) $stmt->fetch()['total'];

        // Cancelled
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) AS total FROM registrations WHERE event_id = ? AND status = 'cancelled'"
        );
        $stmt->execute([$eventId]);
        $totalCancelled = (int) $stmt->fetch()['total'];

        $attendanceRate = $totalRegistered > 0
            ? round(($totalAttended / $totalRegistered) * 100, 1)
            : 0;

        json_success([
            'event_id'        => $eventId,
            'event_title'     => $event['title'],
            'capacity'        => (int) $event['capacity'],
            'registered'      => $totalRegistered,
            'attended'        => $totalAttended,
            'cancelled'       => $totalCancelled,
            'attendance_rate' => $attendanceRate,
        ]);
    }
}
