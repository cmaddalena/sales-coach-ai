import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Manejar diferentes métodos HTTP
  if (req.method === 'GET') {
    return getProfile(req, res);
  } else if (req.method === 'PUT') {
    return updateProfile(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// ============================================================
// GET: Obtener perfil del usuario
// ============================================================
async function getProfile(req, res) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found' });
      }
      throw error;
    }
    
    return res.status(200).json({ profile });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================
// PUT: Actualizar perfil del usuario
// ============================================================
async function updateProfile(req, res) {
  try {
    const { userId, updates, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'updates object is required' });
    }
    
    // Agregar timestamp de actualización
    updates.updated_at = new Date().toISOString();
    
    // Actualizar perfil
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Si se proporcionó una razón, actualizar el último registro del historial
    if (reason) {
      const { error: historyError } = await supabase
        .from('user_profile_history')
        .update({ 
          reason,
          triggered_by: 'manual'
        })
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(1);
      
      if (historyError) {
        console.error('Error updating history reason:', historyError);
        // No fallar si esto falla, es secundario
      }
    }
    
    return res.status(200).json({ 
      profile: updatedProfile,
      message: 'Profile updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: error.message });
  }
}