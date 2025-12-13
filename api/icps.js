import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { method } = req;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (method === 'GET') {
      // Obtener ICPs
      const { userId, includeInactive } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId requerido' });
      }

      let query = supabase
        .from('icps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('activo', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({ icps: data || [] });
    }

    if (method === 'POST') {
      // Crear ICP
      const icpData = req.body;

      if (!icpData.user_id || !icpData.nombre) {
        return res.status(400).json({ error: 'user_id y nombre son requeridos' });
      }

      const { data, error } = await supabase
        .from('icps')
        .insert([icpData])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ icp: data });
    }

    if (method === 'PUT') {
      // Actualizar ICP
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id requerido' });
      }

      const { data, error } = await supabase
        .from('icps')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ icp: data });
    }

    if (method === 'DELETE') {
      // Eliminar ICP
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'id requerido' });
      }

      const { error } = await supabase
        .from('icps')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en /api/icps:', error);
    return res.status(500).json({ error: error.message });
  }
}