-- This is just for testing purposes - update one trip to 'en cours' status to test the map functionality
-- You can run this manually in your Supabase SQL editor:
-- UPDATE trips SET status = 'en cours' WHERE id = (SELECT trip_id FROM bookings WHERE status = 'confirmed' LIMIT 1);

-- For now, let's create a quick test to confirm the issue
SELECT 
  b.id as booking_id,
  t.id as trip_id,
  t.status as current_trip_status,
  t.from_location,
  t.to_location,
  CASE 
    WHEN t.status = 'en cours' THEN 'Map should show'
    ELSE 'Map will not show - trip must be "en cours"'
  END as map_visibility_status
FROM bookings b 
JOIN trips t ON b.trip_id = t.id 
WHERE b.status = 'confirmed'
ORDER BY b.created_at DESC 
LIMIT 3;