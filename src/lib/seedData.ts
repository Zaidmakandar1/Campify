import { supabase } from '@/integrations/supabase/client';

export const seedSampleData = async () => {
  try {
    // Sample venues
    const venues = [
      {
        name: 'Main Auditorium',
        description: 'Large auditorium perfect for conferences and major events',
        capacity: 500,
        amenities: ['projector', 'sound system', 'air conditioning', 'parking']
      },
      {
        name: 'Student Center Hall',
        description: 'Flexible space for meetings and social events',
        capacity: 150,
        amenities: ['wifi', 'catering', 'tables', 'chairs']
      },
      {
        name: 'Library Conference Room',
        description: 'Quiet space ideal for academic discussions',
        capacity: 50,
        amenities: ['wifi', 'projector', 'whiteboard']
      },
      {
        name: 'Outdoor Amphitheater',
        description: 'Open-air venue for cultural events and performances',
        capacity: 300,
        amenities: ['sound system', 'stage', 'lighting']
      }
    ];

    const { error: venuesError } = await supabase
      .from('venues')
      .upsert(venues, { onConflict: 'name' });

    if (venuesError) {
      console.error('Error seeding venues:', venuesError);
    } else {
      console.log('Venues seeded successfully');
    }

    // Sample feedback
    const feedback = [
      {
        title: 'Need more water fountains in the library',
        content: 'The library only has one water fountain on the ground floor. Students studying on upper floors have to go all the way down just to get water. This is especially inconvenient during exam periods when the library is packed.',
        category: 'facilities',
        upvotes: 15
      },
      {
        title: 'Extend computer lab hours during finals',
        content: 'Computer labs close at 10 PM, but many students need to work on projects late into the night during finals week. Please consider extending hours to at least midnight during exam periods.',
        category: 'academics',
        upvotes: 23
      },
      {
        title: 'More vegetarian options in cafeteria',
        content: 'The cafeteria has limited vegetarian options, and they are often the same every day. It would be great to have more variety and healthier vegetarian meals.',
        category: 'facilities',
        upvotes: 8
      },
      {
        title: 'Improve WiFi in dormitories',
        content: 'WiFi connection in the dormitories is very slow and unreliable, especially during peak hours. This makes it difficult to attend online classes and complete assignments.',
        category: 'facilities',
        upvotes: 31
      },
      {
        title: 'Create more study spaces',
        content: 'During exam periods, it\'s very difficult to find quiet study spaces on campus. The library fills up quickly and there aren\'t many alternative locations.',
        category: 'facilities',
        upvotes: 19,
        is_resolved: true
      }
    ];

    const { error: feedbackError } = await supabase
      .from('feedback')
      .upsert(feedback, { onConflict: 'title' });

    if (feedbackError) {
      console.error('Error seeding feedback:', feedbackError);
    } else {
      console.log('Feedback seeded successfully');
    }

    return { success: true };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
};