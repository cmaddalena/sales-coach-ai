import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getContactos(req, res);
  } else if (req.method === 'POST') {
    return createContacto(req, res);
  } else if (req.method === 'DELETE') {
    return deleteContacto(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getContactos(req, res) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('user_id', userId)
      .order('ultima_interaccion', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json({ contactos: data || [] });
  } catch (error) {
    console.error('Error fetching contactos:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function createContacto(req, res) {
  try {
    const contactoData = req.body;
    
    if (!contactoData.user_id || !contactoData.nombre) {
      return res.status(400).json({ error: 'user_id and nombre are required' });
    }
    
    contactoData.created_at = new Date().toISOString();
    contactoData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('contactos')
      .insert([contactoData])
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({ contacto: data });
  } catch (error) {
    console.error('Error creating contacto:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function deleteContacto(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }
    
    const { error } = await supabase
      .from('contactos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting contacto:', error);
    return res.status(500).json({ error: error.message });
  }
}
