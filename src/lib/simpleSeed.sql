-- Simple seed data that you can run directly in Supabase SQL Editor
-- Run this after creating your user account

-- Insert sample venues
INSERT INTO public.venues (name, description, capacity, amenities) VALUES
('Main Auditorium', 'Large auditorium perfect for conferences and major events', 500, ARRAY['projector', 'sound system', 'air conditioning', 'parking']),
('Student Center Hall', 'Flexible space for meetings and social events', 150, ARRAY['wifi', 'catering', 'tables', 'chairs']),
('Library Conference Room', 'Quiet space ideal for academic discussions', 50, ARRAY['wifi', 'projector', 'whiteboard']),
('Outdoor Amphitheater', 'Open-air venue for cultural events and performances', 300, ARRAY['sound system', 'stage', 'lighting'])
ON CONFLICT (name) DO NOTHING;

-- Insert sample clubs (without profile_id for now)
INSERT INTO public.clubs (name, description, performance_score) VALUES
('Computer Science Club', 'A community for CS students to learn, collaborate, and build amazing projects together.', 85),
('Drama Society', 'Bringing stories to life through theater, acting workshops, and creative performances.', 92),
('Environmental Club', 'Working towards a sustainable future through campus initiatives and awareness campaigns.', 78),
('Photography Club', 'Capturing moments and developing skills in digital and film photography.', 88)
ON CONFLICT (name) DO NOTHING;

-- Insert sample feedback (without created_by for now)
INSERT INTO public.feedback (title, content, category, upvotes, is_resolved) VALUES
('Need more water fountains in the library', 'The library only has one water fountain on the ground floor. Students studying on upper floors have to go all the way down just to get water. This is especially inconvenient during exam periods when the library is packed.', 'facilities', 15, false),
('Extend computer lab hours during finals', 'Computer labs close at 10 PM, but many students need to work on projects late into the night during finals week. Please consider extending hours to at least midnight during exam periods.', 'academics', 23, false),
('More vegetarian options in cafeteria', 'The cafeteria has limited vegetarian options, and they are often the same every day. It would be great to have more variety and healthier vegetarian meals.', 'facilities', 8, false),
('Improve WiFi in dormitories', 'WiFi connection in the dormitories is very slow and unreliable, especially during peak hours. This makes it difficult to attend online classes and complete assignments.', 'facilities', 31, false),
('Create more study spaces', 'During exam periods, it is very difficult to find quiet study spaces on campus. The library fills up quickly and there are not many alternative locations.', 'facilities', 19, true)
ON CONFLICT (title) DO NOTHING;