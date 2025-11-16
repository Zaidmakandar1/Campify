// FRONTEND ERROR HANDLING FIXES
// Add these error handling improvements to your components

// 1. Enhanced error handling for AI insights
export const safeUpsertAIInsight = async (supabase: any, insightType: string, targetId: string, data: any) => {
  try {
    // Use the new database function instead of direct upsert
    const { data: result, error } = await supabase.rpc('upsert_ai_insight', {
      p_insight_type: insightType,
      p_target_id: targetId,
      p_insight_data: data,
      p_confidence_score: 0.8
    });

    if (error) {
      console.warn('AI insight upsert failed:', error);
      return null;
    }
    return result;
  } catch (err) {
    console.warn('AI insight operation failed silently:', err);
    return null;
  }
};

// 2. Safe club creation with better error handling
export const safeCreateClub = async (supabase: any, user: any) => {
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .insert({
        name: `${user.email?.split('@')[0] || 'User'}'s Club`,
        description: 'Club profile created for venue booking',
        contact_email: user.email,
        created_by: user.id,
        is_verified: false
      })
      .select('id')
      .single();

    if (error) {
      console.error('Club creation error:', error);
      throw new Error(`Failed to create club: ${error.message}`);
    }

    return club;
  } catch (err) {
    console.error('Safe club creation failed:', err);
    throw err;
  }
};

// 3. Safe clubs query with fallback
export const safeGetClubs = async (supabase: any) => {
  try {
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('id, name, description, category, is_verified')
      .limit(10);

    if (error) {
      console.warn('Clubs query failed:', error);
      return [];
    }

    return clubs || [];
  } catch (err) {
    console.warn('Safe clubs query failed:', err);
    return [];
  }
};