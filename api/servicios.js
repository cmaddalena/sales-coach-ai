import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getServicios(req, res);
  } else if (req.method === 'POST') {
    return createServicio(req, res);
  } else if (req.method === 'PUT') {
    return updateServicio(req, res);
  } else if (req.method === 'DELETE') {
    return deleteServicio(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// ============================================================
// GET: Obtener servicios del usuario
// ============================================================
async function getServicios(req, res) {
  try {
    const { userId, includeInactive } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    let query = supabase
      .from('servicios')
      .select('*')
      .eq('user_id', userId)
      .order('orden', { ascending: true });
    
    // Por defecto, solo mostrar activos
    if (includeInactive !== 'true') {
      query = query.eq('activo', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return res.status(200).json({ servicios: data || [] });
    
  } catch (error) {
    console.error('Error fetching servicios:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================
// POST: Crear nuevo servicio
// ============================================================
async function createServicio(req, res) {
  try {
    const servicioData = req.body;
    
    if (!servicioData.user_id || !servicioData.nombre) {
      return res.status(400).json({ error: 'user_id and nombre are required' });
    }
    
    // Agregar timestamps
    servicioData.created_at = new Date().toISOString();
    servicioData.updated_at = new Date().toISOString();
    
    // Si no se especificó orden, ponerlo al final
    if (!servicioData.orden) {
      const { count } = await supabase
        .from('servicios')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', servicioData.user_id);
      
      servicioData.orden = (count || 0) + 1;
    }
    
    const { data, error } = await supabase
      .from('servicios')
      .insert([servicioData])
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({ servicio: data });
    
  } catch (error) {
    console.error('Error creating servicio:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================
// PUT: Actualizar servicio
// ============================================================
async function updateServicio(req, res) {
  try {
    const { id, ...updates } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    
    // Actualizar timestamp
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('servicios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({ servicio: data });
    
  } catch (error) {
    console.error('Error updating servicio:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================
// DELETE: Eliminar o desactivar servicio
// ============================================================
async function deleteServicio(req, res) {
  try {
    const { id, soft } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    
    // Soft delete (solo desactivar)
    if (soft === 'true') {
      const { data, error } = await supabase
        .from('servicios')
        .update({ 
          activo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(200).json({ 
        servicio: data,
        message: 'Servicio desactivado'
      });
    }
    
    // Hard delete (eliminar completamente)
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(200).json({ 
      success: true,
      message: 'Servicio eliminado'
    });
    
  } catch (error) {
    console.error('Error deleting servicio:', error);
    return res.status(500).json({ error: error.message });
  }
}
