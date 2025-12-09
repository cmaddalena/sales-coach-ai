// ═══════════════════════════════════════════════════════════════
// api/motor-decision-core-simple.js
// Versión simplificada que funciona sin depender de datos completos
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    console.log('[COACH] Loading data for user:', userId);
    
    // ═══════════════════════════════════════════════════════════
    // CARGAR PERFIL BÁSICO
    // ═══════════════════════════════════════════════════════════
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.error('[COACH] Profile error:', profileError);
      throw new Error(`Error cargando perfil: ${profileError.message}`);
    }
    
    console.log('[COACH] Profile loaded:', profile?.nombre);
    
    // ═══════════════════════════════════════════════════════════
    // CARGAR OBJETIVO (puede no existir)
    // ═══════════════════════════════════════════════════════════
    
    const { data: objetivos } = await supabase
      .from('objetivos')
      .select('*')
      .eq('user_id', userId)
      .eq('estado', 'activo')
      .limit(1);
    
    const objetivo = objetivos?.[0];
    
    // ═══════════════════════════════════════════════════════════
    // CARGAR CONTACTOS (puede estar vacío)
    // ═══════════════════════════════════════════════════════════
    
    const { data: contactos } = await supabase
      .from('contactos')
      .select('*')
      .eq('user_id', userId);
    
    const totalContactos = contactos?.length || 0;
    const calientes = contactos?.filter(c => c.temperatura > 70).length || 0;
    const tibios = contactos?.filter(c => c.temperatura >= 40 && c.temperatura <= 70).length || 0;
    
    // ═══════════════════════════════════════════════════════════
    // ANÁLISIS SIMPLIFICADO
    // ═══════════════════════════════════════════════════════════
    
    let situacion = '';
    let plan = '';
    let lever_type = 'maintain';
    
    if (totalContactos === 0) {
      lever_type = 'pipeline_emergency';
      situacion = '🚨 Pipeline vacío. Necesitás empezar a prospectar.';
      plan = `Che ${profile.nombre}, tu pipeline está vacío. 

🎯 Plan HOY:
• Identificar 10 empresas objetivo
• Contactar 5 por LinkedIn
• Follow-up a 2 contactos tibios

Empecemos simple: ¿Cuál es tu ICP (cliente ideal)?`;
    } else if (calientes === 0) {
      lever_type = 'prospecting_sprint';
      situacion = `Pipeline bajo (${totalContactos} contactos, 0 calientes)`;
      plan = `${profile.nombre}, tenés ${totalContactos} contactos pero ninguno caliente.

🎯 Prioridad: Calentar pipeline
• ${tibios} contactos tibios → follow-up HOY
• Agregar 5 contactos nuevos esta semana

¿Cuál de tus ${tibios} tibios tiene más chance de cerrar?`;
    } else if (objetivo && objetivo.valor_actual < objetivo.valor_objetivo * 0.5) {
      lever_type = 'goal_push';
      const gap = objetivo.valor_objetivo - (objetivo.valor_actual || 0);
      situacion = `${Math.round((objetivo.valor_actual / objetivo.valor_objetivo) * 100)}% del objetivo. Gap: $${gap}`;
      plan = `${profile.nombre}, estás en ${Math.round((objetivo.valor_actual / objetivo.valor_objetivo) * 100)}% del objetivo.

📊 Situación:
• Objetivo: $${objetivo.valor_objetivo}
• Actual: $${objetivo.valor_actual || 0}
• Gap: $${gap}

🎯 Plan:
• Cerrar ${calientes} leads calientes
• Follow-up propuestas pendientes
• Prospección focalizada

Empecemos con tu lead más caliente.`;
    } else {
      lever_type = 'maintain';
      situacion = `Sistema ok. ${calientes} leads calientes, ${tibios} tibios.`;
      plan = `${profile.nombre}, todo funcionando bien! 💪

📊 Pipeline:
• ${calientes} leads calientes
• ${tibios} leads tibios
• ${totalContactos} total

Seguí con tu ritmo actual. ¿En qué puedo ayudarte hoy?`;
    }
    
    // ═══════════════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════════════
    
    console.log('[COACH] Returning response, lever:', lever_type);
    
    res.status(200).json({
      situation: {
        emotional: {
          energia: profile.energia || 7,
          motivacion: 7,
          estado: 'estable'
        },
        progress: {
          porcentaje: objetivo ? (objetivo.valor_actual || 0) / objetivo.valor_objetivo : 0,
          objetivo: objetivo?.valor_objetivo || 0,
          actual: objetivo?.valor_actual || 0,
          gap: objetivo ? objetivo.valor_objetivo - (objetivo.valor_actual || 0) : 0
        },
        pipeline: {
          calientes,
          tibios,
          total: totalContactos,
          salud: totalContactos > 0 ? (calientes + tibios * 0.5) / totalContactos : 0
        }
      },
      critical_lever: {
        type: lever_type,
        situacion: situacion
      },
      plan: {
        mensaje_principal: plan,
        tipo: lever_type,
        confidence: 0.8
      },
      message: plan,
      confidence: 0.8,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[COACH] Error completo:', error);
    console.error('[COACH] Stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Error interno',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
