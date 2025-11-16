import { supabase } from '@/integrations/supabase/client';

export const seedSampleData = async () => {
  try {
    console.log('Starting data seeding...');

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User must be authenticated to seed data');
    }

    // Sample venues (these don't require special permissions)
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

    console.log('Seeding venues...');
    const { error: venuesError } = await supabase
      .from('venues')
      .insert(venues);

    if (venuesError) {
      console.error('Error seeding venues:', venuesError);
      // Don't fail completely if venues already exist
      if (!venuesError.message.includes('duplicate key')) {
        throw venuesError;
      }
    } else {
      console.log('Venues seeded successfully');
    }

    // Sample feedback (these will be created by the current user)
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

    console.log('Seeding feedback...');
    const { error: feedbackError } = await supabase
      .from('feedback')
      .insert(feedback);

    if (feedbackError) {
      console.error('Error seeding feedback:', feedbackError);
      // Don't fail completely if feedback already exists
      if (!feedbackError.message.includes('duplicate key')) {
        throw feedbackError;
      }
    } else {
      console.log('Feedback seeded successfully');
    }

    // Sample clubs data
    const clubs = [
      {
        name: 'Computer Science Club',
        description: 'A community for CS students to learn, collaborate, and build amazing projects together.',
        performance_score: 85
      },
      {
        name: 'Drama Society',
        description: 'Bringing stories to life through theater, acting workshops, and creative performances.',
        performance_score: 92
      },
      {
        name: 'Environmental Club',
        description: 'Working towards a sustainable future through campus initiatives and awareness campaigns.',
        performance_score: 78
      },
      {
        name: 'Photography Club',
        description: 'Capturing moments and developing skills in digital and film photography.',
        performance_score: 88
      }
    ];

    console.log('Seeding clubs...');
    const { error: clubsError } = await supabase
      .from('clubs')
      .insert(clubs);

    if (clubsError) {
      console.error('Error seeding clubs:', clubsError);
      // Don't fail completely if clubs already exist
      if (!clubsError.message.includes('duplicate key')) {
        throw clubsError;
      }
    } else {
      console.log('Clubs seeded successfully');
    }

    return { success: true };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
};