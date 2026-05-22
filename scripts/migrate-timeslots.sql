-- Migration: Populate appointment_time_slots from existing appointments
-- Run this script to migrate existing appointments to use appointment_time_slots table
-- Each existing appointment becomes a single timeslot with its current date/startTime/endTime

BEGIN;

-- Insert existing appointments as timeslots
INSERT INTO appointment_time_slots ("appointmentId", date, "startTime", "endTime", "createdAt")
SELECT 
  id,
  date,
  "startTime",
  "endTime",
  NOW()
FROM appointments
ON CONFLICT ("appointmentId", date, "startTime") DO NOTHING;

-- Verify migration: count should match number of appointments
-- SELECT COUNT(*) as slot_count FROM appointment_time_slots;
-- SELECT COUNT(*) as appointment_count FROM appointments;

COMMIT;
