import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getICPs(req, res);
  } else if (req.method === 'POST') {
    return createICP(req, res);
  } else if (req.method === 'PUT') {
    return updateICP(req, res);
  } else if (req.method === 'DELETE') {
    return deleteICP(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ============================================================
// GET: Obtener ICPs del usuario
// ============================================================
async function getICPs(req, res) {
  try {
    const { userId, includeInactive } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let query = supabase
      .from('icps')
      .select('*')
      .eq('user_id', userId)
      .order('orden', { ascending: true });

    // Por defecto, solo mostrar activos
    if (includeInactive !== 'true') {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ icps: data || [] });

  } catch (error) {
    console.error('Error fetching ICPs:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================
// POST: Crear nuevo ICP
// ============================================================
async function createICP(req, res) {
  try {
    const icpData = req.body;

    if (!icpData.user_id || !icpData.nombre) {
      return res.status(400).json({ error: 'user_id and nombre are required' });
    }

    // Agregar timestamps
    icpData.created_at = new Date().toISOString();
    icpData.updated_at = new Date().toISOString();

    // Si no se especificó orden, ponerlo al final
    if (!icpData.orden) {
      const { count } = await supabase
        .from('icps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', icpData.user_id);

      icpData.orden = (count || 0) + 1;
    }

    const { data, error } = await supabase
      .from('icps')
      .insert([icpData])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ icp: data });

  } catch (error) {
    console.error('Error creating ICP:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================
// PUT: Actualizar ICP
// ============================================================
async function updateICP(req, res) {
  try {
    const { id, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Actualizar timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('icps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ icp: data });

  } catch (error) {
    console.error('Error updating ICP:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================
// DELETE: Eliminar o desactivar ICP
// ============================================================
async function deleteICP(req, res) {
  try {
    const { id, soft } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Soft delete (solo desactivar)
    if (soft === 'true') {
      const { data, error } = await supabase
        .from('icps')
        .update({
          activo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        icp: data,
        message: 'ICP desactivado'
      });
    }

    // Hard delete (eliminar completamente)
    const { error } = await supabase
      .from('icps')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'ICP eliminado'
    });

  } catch (error) {
    console.error('Error deleting ICP:', error);
    return res.status(500).json({ error: error.message });
  }
}