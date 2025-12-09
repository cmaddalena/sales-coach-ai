// ═══════════════════════════════════════════════════════════════
// api/motor-decision-core.js
// Motor de decisión ultra-personalizado
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { identifyCriticalLever, generatePlan } from './motor-decision-lever-plan.js';
import { craftMessage } from './motor-decision-message.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // usar service role en backend
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
    
    console.log('[COACH] Starting for userId:', userId);
    
    // ═══════════════════════════════════════════════════
    // PASO 1: CARGAR PERFIL COMPLETO 360°
    // ═══════════════════════════════════════════════════
    
    console.log('[COACH] Loading profile...');
    const profile = await loadDeepProfile(userId);
    console.log('[COACH] Profile loaded:', profile?.nombre);
    
    console.log('[COACH] Loading what works...');
    const whatWorks = await loadWhatWorks(userId);
    console.log('[COACH] What works loaded, patterns:', whatWorks?.all?.length || 0);
    
    console.log('[COACH] Loading emotional state...');
    const emotionalState = await loadEmotionalState(userId);
    console.log('[COACH] Emotional state:', emotionalState?.sentimiento);
    
    console.log('[COACH] Loading current context...');
    const currentContext = await loadCurrentContext(userId);
    console.log('[COACH] Context loaded, momentum:', currentContext?.momentum);
    
    console.log('[COACH] Loading objetivos...');
    const objetivos = await loadObjetivos(userId);
    console.log('[COACH] Objetivos loaded:', objetivos?.length || 0);
    
    console.log('[COACH] Loading leads...');
    const leads = await loadLeads(userId);
    console.log('[COACH] Leads loaded:', leads?.length || 0);
    
    console.log('[COACH] Loading interactions...');
    const interactions = await loadRecentInteractions(userId, 30);
    console.log('[COACH] Interactions loaded:', interactions?.length || 0);
    
    // ═══════════════════════════════════════════════════
    // PASO 2: ANÁLISIS SITUACIONAL PROFUNDO
    // ═══════════════════════════════════════════════════
    
    const situationAnalysis = analyzeSituation({
      profile,
      whatWorks,
      emotionalState,
      currentContext,
      objetivos,
      leads,
      interactions
    });
    
    // ═══════════════════════════════════════════════════
    // PASO 3: IDENTIFICAR PALANCA CRÍTICA
    // ═══════════════════════════════════════════════════
    
    const criticalLever = identifyCriticalLever(situationAnalysis);
    
    // ═══════════════════════════════════════════════════
    // PASO 4: GENERAR PLAN PERSONALIZADO
    // ═══════════════════════════════════════════════════
    
    const personalizedPlan = await generatePlan({
      lever: criticalLever,
      situation: situationAnalysis,
      profile,
      whatWorks
    });
    
    // ═══════════════════════════════════════════════════
    // PASO 5: CRAFT MESSAGE (Tono personalizado DISC)
    // ═══════════════════════════════════════════════════
    
    const message = craftMessage({
      plan: personalizedPlan,
      disc: profile.disc_profile,
      emotionalState: situationAnalysis.emotional,
      momentum: situationAnalysis.momentum
    });
    
    // ═══════════════════════════════════════════════════
    // PASO 6: GUARDAR DECISIÓN (auditabilidad)
    // ═══════════════════════════════════════════════════
    
    await logDecision({
      userId,
      situationAnalysis,
      criticalLever,
      personalizedPlan,
      message
    });
    
    // ═══════════════════════════════════════════════════
    // RESPONSE
    // ═══════════════════════════════════════════════════
    
    res.status(200).json({
      situation: situationAnalysis,
      critical_lever: criticalLever,
      plan: personalizedPlan,
      message: message,
      confidence: personalizedPlan.confidence
    });
    
  } catch (error) {
    console.error('Motor decisión error:', error);
    res.status(500).json({ error: error.message });
  }
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Load Deep Profile
// ═══════════════════════════════════════════════════════════════

async function loadDeepProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Load What Works (Learnings personales)
// ═══════════════════════════════════════════════════════════════

async function loadWhatWorks(userId) {
  const { data, error } = await supabase
    .from('user_what_works')
    .select('*')
    .eq('user_id', userId)
    .eq('estado', 'confirmado')
    .order('nivel_confianza', { ascending: false });
  
  if (error) throw error;
  
  return {
    all: data || [],
    top_patterns: (data || []).slice(0, 5),
    timing: data?.find(w => w.pattern_type === 'timing'),
    canal: data?.find(w => w.pattern_type === 'canal'),
    speech: data?.find(w => w.pattern_type === 'speech'),
    follow_up: data?.find(w => w.pattern_type === 'follow_up')
  };
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Load Emotional State
// ═══════════════════════════════════════════════════════════════

async function loadEmotionalState(userId) {
  // Obtener último estado emocional (últimos 7 días)
  const { data, error } = await supabase
    .from('user_emotional_state')
    .select('*')
    .eq('user_id', userId)
    .gte('fecha', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(7);
  
  if (error) throw error;
  
  if (!data || data.length === 0) {
    // Default neutral
    return {
      sentimiento: 'neutral',
      energia: 7,
      motivacion: 7,
      estres: 5,
      confianza: 7,
      tendencia: 'estable'
    };
  }
  
  const latest = data[0];
  const trend = calculateTrend(data);
  
  return {
    ...latest,
    tendencia: trend,
    historia: data
  };
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Load Current Context
// ═══════════════════════════════════════════════════════════════

async function loadCurrentContext(userId) {
  const { data, error } = await supabase
    .from('user_current_context')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  if (!data) {
    // Crear contexto inicial
    await supabase.rpc('update_user_context', { p_user_id: userId });
    
    const { data: newData } = await supabase
      .from('user_current_context')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return newData;
  }
  
  return data;
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Load Objetivos
// ═══════════════════════════════════════════════════════════════

async function loadObjetivos(userId) {
  const { data, error } = await supabase
    .from('objetivos')
    .select('*')
    .eq('user_id', userId)
    .eq('estado', 'activo');
  
  if (error) throw error;
  
  return data || [];
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Load Leads
// ═══════════════════════════════════════════════════════════════

async function loadLeads(userId) {
  const { data, error } = await supabase
    .from('contactos')
    .select('*')
    .eq('user_id', userId)
    .neq('tipo', 'archivado')
    .order('temperatura', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Load Recent Interactions
// ═══════════════════════════════════════════════════════════════

async function loadRecentInteractions(userId, days) {
  const { data, error } = await supabase
    .from('interacciones')
    .select('*')
    .eq('user_id', userId)
    .gte('fecha', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('fecha', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Analyze Situation
// ═══════════════════════════════════════════════════════════════

function analyzeSituation({
  profile,
  whatWorks,
  emotionalState,
  currentContext,
  objetivos,
  leads,
  interactions
}) {
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const diasRestantes = daysInMonth - dayOfMonth;
  
  const objetivoRevenue = objetivos.find(o => o.tipo === 'revenue_total');
  
  return {
    // Momento emocional
    emotional: {
      estado: emotionalState.sentimiento,
      energia: emotionalState.energia,
      motivacion: emotionalState.motivacion,
      estres: emotionalState.estres,
      confianza: emotionalState.confianza,
      tendencia: emotionalState.tendencia,
      alerta: emotionalState.motivacion < 4 || emotionalState.estres > 7
    },
    
    // Progreso vs objetivo
    progress: {
      porcentaje: currentContext.objetivo_mes_progress || 0,
      proyeccion: currentContext.proyeccion_mes || 0,
      gap: currentContext.gap || 0,
      velocidad_actual: currentContext.velocidad_actual || 0,
      velocidad_necesaria: currentContext.velocidad_necesaria || 0,
      objetivo: objetivoRevenue?.valor_objetivo || 0,
      actual: objetivoRevenue?.valor_actual || 0,
      dias_restantes: diasRestantes,
      realista: (currentContext.proyeccion_mes || 0) >= ((objetivoRevenue?.valor_objetivo || 0) * 0.8),
      urgencia: diasRestantes < 10 && (currentContext.gap || 0) > 0.3
    },
    
    // Pipeline health
    pipeline: {
      calientes: leads.filter(l => l.temperatura > 70).length,
      tibios: leads.filter(l => l.temperatura >= 40 && l.temperatura <= 70).length,
      frios: leads.filter(l => l.temperatura < 40).length,
      total: leads.length,
      salud: calculatePipelineHealth(leads),
      bottleneck: identifyBottleneck(leads),
      dias_sin_prospección: currentContext.dias_sin_actividad || 0,
      propuestas_pendientes: leads.filter(l => l.stage === 'propuesta').length,
      demos_pendientes: leads.filter(l => l.stage === 'demo').length
    },
    
    // Momentum
    momentum: {
      estado: currentContext.momentum || 'estable',
      racha_actual: currentContext.racha_actual || 0,
      mejor_racha: currentContext.mejor_racha_mes || 0,
      cierres_mes: currentContext.cierres_ultimos_30d || 0,
      vs_mes_anterior: currentContext.cierres_vs_mes_anterior || 0,
      tendencia: calculateMomentumTrend(interactions)
    },
    
    // Timing óptimo
    timing: {
      ahora: now,
      hora: now.getHours(),
      dia_semana: ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()],
      energia_ahora: getEnergiaForTime(profile.bloques_energia, now),
      mejor_momento_hoy: profile.mejor_momento_dia,
      momento_optimo: isOptimalTiming(profile, whatWorks, now)
    }
  };
}


// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function calculateTrend(emotionalHistory) {
  if (emotionalHistory.length < 3) return 'estable';
  
  const recent = emotionalHistory.slice(0, 3);
  const avgMotivacionRecent = recent.reduce((sum, e) => sum + e.motivacion, 0) / recent.length;
  
  const older = emotionalHistory.slice(3, 6);
  if (older.length === 0) return 'estable';
  
  const avgMotivacionOlder = older.reduce((sum, e) => sum + e.motivacion, 0) / older.length;
  
  if (avgMotivacionRecent > avgMotivacionOlder + 1) return 'mejorando';
  if (avgMotivacionRecent < avgMotivacionOlder - 1) return 'declinando';
  return 'estable';
}

function calculatePipelineHealth(leads) {
  if (leads.length === 0) return 0;
  
  const calientes = leads.filter(l => l.temperatura > 70).length;
  const tibios = leads.filter(l => l.temperatura >= 40).length;
  
  // Salud = proporción leads con temperatura decente
  return (calientes * 1.5 + tibios) / leads.length;
}

function identifyBottleneck(leads) {
  const stages = {
    prospecto: leads.filter(l => l.stage === 'prospecto').length,
    contactado: leads.filter(l => l.stage === 'contactado').length,
    conversacion: leads.filter(l => l.stage === 'conversacion').length,
    demo: leads.filter(l => l.stage === 'demo').length,
    propuesta: leads.filter(l => l.stage === 'propuesta').length
  };
  
  // Bottleneck = stage con más leads estancados
  const maxStage = Object.entries(stages).reduce((max, [stage, count]) => 
    count > max[1] ? [stage, count] : max
  , ['', 0]);
  
  if (stages.prospecto > 20) return 'prospection';
  if (stages.conversacion > stages.demo * 2) return 'conversion_demo';
  if (stages.propuesta > 5) return 'close';
  
  return 'none';
}

function calculateMomentumTrend(interactions) {
  if (interactions.length < 5) return 'iniciando';
  
  const recent = interactions.slice(0, Math.floor(interactions.length / 2));
  const older = interactions.slice(Math.floor(interactions.length / 2));
  
  const recentPositive = recent.filter(i => i.resultado === 'positivo' || i.resultado === 'interesado').length;
  const olderPositive = older.filter(i => i.resultado === 'positivo' || i.resultado === 'interesado').length;
  
  const recentRate = recentPositive / recent.length;
  const olderRate = olderPositive / older.length;
  
  if (recentRate > olderRate + 0.1) return 'acelerando';
  if (recentRate < olderRate - 0.1) return 'declinando';
  return 'estable';
}

function getEnergiaForTime(bloquesEnergia, date) {
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 12) return bloquesEnergia?.manana || 'media';
  if (hour >= 12 && hour < 18) return bloquesEnergia?.tarde || 'media';
  if (hour >= 18 && hour < 22) return bloquesEnergia?.noche || 'baja';
  return 'baja';
}

function isOptimalTiming(profile, whatWorks, date) {
  const dia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][date.getDay()];
  const hora = date.getHours();
  
  // Check learnings
  const timingLearning = whatWorks.timing;
  if (timingLearning) {
    if (timingLearning.mejor_dia_semana === dia && 
        timingLearning.mejor_horario && 
        timingLearning.mejor_horario.includes(`${hora}:`)) {
      return true;
    }
  }
  
  return false;
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Log Decision
// ═══════════════════════════════════════════════════════════════

async function logDecision({ userId, situationAnalysis, criticalLever, personalizedPlan, message }) {
  await supabase
    .from('decisiones_sistema')
    .insert({
      user_id: userId,
      situacion_analizada: situationAnalysis,
      variables_consideradas: {
        emotional: situationAnalysis.emotional,
        progress: situationAnalysis.progress,
        pipeline: situationAnalysis.pipeline,
        momentum: situationAnalysis.momentum
      },
      palanca_critica: criticalLever.type,
      razonamiento: criticalLever.reasoning,
      recomendacion_generada: {
        plan: personalizedPlan,
        message: message
      },
      confianza: personalizedPlan.confidence || 0.7
    });
}
