-- TEST HUB QUERY
-- Run this after COMPLETE_HUB_FIX.sql to verify the Hub will work

-- Test the exact query that Hub.tsx uses
SELECT 
    events.*,
    venues.name as venue_name,
    clubs.name as club_name
FROM events
LEFT JOIN venues ON events.venue_id = venues.id
LEFT JOIN clubs ON events.club_id = clubs.id
WHERE events.is_completed = false
ORDER BY events.start_date DESC;

-- Also test completed events
SELECT 
    events.*,
    venues.name as venue_name,
    clubs.name as club_name
FROM events
LEFT JOIN venues ON events.venue_id = venues.id
LEFT JOIN clubs ON events.club_id = clubs.id
WHERE events.is_completed = true
ORDER BY events.start_date DESC;