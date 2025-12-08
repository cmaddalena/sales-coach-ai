// ═══════════════════════════════════════════════════════════════
// api/motor-decision-lever-plan.js
// Identificación de palanca crítica + generación de plan
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Identify Critical Lever
// La palanca que más impacto tendrá AHORA para este usuario
// ═══════════════════════════════════════════════════════════════

export function identifyCriticalLever(situationAnalysis) {
  
  const { emotional, progress, pipeline, momentum, timing } = situationAnalysis;
  
  // ═══════════════════════════════════════════════════════════
  // REGLA 1: SALUD EMOCIONAL PRIMERO
  // Si motivación/confianza muy baja, nada más importa
  // ═══════════════════════════════════════════════════════════
  
  if (emotional.motivacion < 4 || emotional.estres > 7) {
    return {
      type: 'emotional_support',
      urgency: 'critical',
      action: 'restore_confidence',
      reasoning: `Estado emocional comprometido (motivación: ${emotional.motivacion}/10, estrés: ${emotional.estres}/10). Prioridad recuperar energía antes que acciones comerciales.`,
      impacto_estimado: 'alto',
      tiempo_resolucion: '1-2 días'
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // REGLA 2: PIPELINE SECO = CRISIS INMINENTE
  // Sin prospección = sin ventas en 2-3 semanas
  // ═══════════════════════════════════════════════════════════
  
  if (pipeline.dias_sin_prospección > 7 || (pipeline.calientes < 3 && pipeline.tibios < 5)) {
    return {
      type: 'pipeline_emergency',
      urgency: 'high',
      action: 'massive_prospecting',
      reasoning: `Pipeline crítico: ${pipeline.dias_sin_prospección} días sin prospectar, solo ${pipeline.calientes} leads calientes. Pipeline se agota en ~14 días.`,
      impacto_estimado: 'crítico',
      tiempo_resolucion: '1 semana',
      meta_inmediata: '15 contactos/día por 5 días'
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // REGLA 3: GAP OBJETIVO >30% + ÚLTIMOS 10 DÍAS
  // Necesita action URGENTE para cumplir
  // ═══════════════════════════════════════════════════════════
  
  if (progress.urgencia && progress.gap > progress.objetivo * 0.3) {
    
    // Sub-análisis: ¿Dónde está el bottleneck?
    
    if (pipeline.bottleneck === 'prospection') {
      return {
        type: 'prospecting_sprint',
        urgency: 'high',
        action: 'massive_outreach',
        reasoning: `Gap $${progress.gap.toFixed(0)} (${(progress.gap / progress.objetivo * 100).toFixed(0)}%) con ${progress.dias_restantes} días. Bottleneck: prospección. Necesitás ${Math.ceil(progress.gap / 700)} cierres = ${Math.ceil(progress.gap / 700 * 2.5)} demos = ${Math.ceil(progress.gap / 700 * 6)} contactos.`,
        impacto_estimado: 'alto',
        meta_inmediata: `${Math.ceil(progress.gap / 700 * 6 / progress.dias_restantes)} contactos/día`
      };
    }
    
    if (pipeline.bottleneck === 'conversion_demo' && pipeline.demos_pendientes > 3) {
      return {
        type: 'close_existing_demos',
        urgency: 'high',
        action: 'demo_push',
        reasoning: `${pipeline.demos_pendientes} demos pendientes. Cerrar existentes más rápido que buscar nuevos. Valor pipeline demos: $${pipeline.demos_pendientes * 700}.`,
        impacto_estimado: 'muy alto',
        tiempo_resolucion: '3-5 días',
        probabilidad_exito: 0.75
      };
    }
    
    if (pipeline.bottleneck === 'close' && pipeline.propuestas_pendientes > 3) {
      return {
        type: 'proposal_follow_up',
        urgency: 'high',
        action: 'aggressive_follow_up',
        reasoning: `${pipeline.propuestas_pendientes} propuestas sin cerrar. Follow-up agresivo día 5-7 crítico (65% conversión según tu data). Valor pipeline: $${pipeline.propuestas_pendientes * 700}.`,
        impacto_estimado: 'muy alto',
        tiempo_resolucion: '2-3 días',
        valor_pipeline: pipeline.propuestas_pendientes * 700
      };
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // REGLA 4: MOMENTUM BAJANDO
  // Prevenir antes que caiga más
  // ═══════════════════════════════════════════════════════════
  
  if (momentum.tendencia === 'declinando' && momentum.vs_mes_anterior < -0.2) {
    return {
      type: 'momentum_recovery',
      urgency: 'medium',
      action: 'quick_wins',
      reasoning: `Momentum -${Math.abs(momentum.vs_mes_anterior * 100).toFixed(0)}% vs mes anterior. Generar quick wins para recuperar confianza y ritmo.`,
      impacto_estimado: 'medio-alto',
      tiempo_resolucion: '3-5 días'
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // REGLA 5: LEADS FRÍOS ACUMULADOS
  // Reactivar más fácil que prospectar desde 0
  // ═══════════════════════════════════════════════════════════
  
  if (pipeline.frios > 20 && pipeline.calientes < 5) {
    return {
      type: 'lead_reactivation',
      urgency: 'medium',
      action: 'warm_up_cold_leads',
      reasoning: `${pipeline.frios} leads fríos dormidos vs solo ${pipeline.calientes} calientes. Reactivar con nuevo approach 3× más fácil que prospectar desde 0.`,
      impacto_estimado: 'medio',
      tiempo_resolucion: '1 semana',
      conversion_esperada: 0.15
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // REGLA 6: TODO OK - OPTIMIZAR
  // Sistema funcionando, momento de escalar
  // ═══════════════════════════════════════════════════════════
  
  if (progress.realista && emotional.motivacion > 6 && pipeline.salud > 0.7) {
    return {
      type: 'optimization',
      urgency: 'low',
      action: 'scale_what_works',
      reasoning: 'Sistema funcionando bien. Momento de escalar lo que funciona y mejorar eficiencia.',
      impacto_estimado: 'medio',
      tiempo_resolucion: 'continuo'
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DEFAULT: MANTENER RITMO
  // ═══════════════════════════════════════════════════════════
  
  return {
    type: 'maintain',
    urgency: 'low',
    action: 'continue_rhythm',
    reasoning: 'Continuar ritmo actual. Todo en orden.',
    impacto_estimado: 'bajo'
  };
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Generate Plan
// Genera plan de acción basado en la palanca crítica
// ═══════════════════════════════════════════════════════════════

export async function generatePlan({ lever, situation, profile, whatWorks }) {
  
  switch (lever.type) {
    
    // ═══════════════════════════════════════════════════════
    // PLAN: EMOTIONAL SUPPORT
    // ═══════════════════════════════════════════════════════
    
    case 'emotional_support':
      return await generateEmotionalSupportPlan(situation, profile);
    
    // ═══════════════════════════════════════════════════════
    // PLAN: PIPELINE EMERGENCY
    // ═══════════════════════════════════════════════════════
    
    case 'pipeline_emergency':
      return await generatePipelineEmergencyPlan(situation, profile, whatWorks);
    
    // ═══════════════════════════════════════════════════════
    // PLAN: PROSPECTING SPRINT
    // ═══════════════════════════════════════════════════════
    
    case 'prospecting_sprint':
      return await generateProspectingSprintPlan(situation, profile, whatWorks);
    
    // ═══════════════════════════════════════════════════════
    // PLAN: PROPOSAL FOLLOW-UP
    // ═══════════════════════════════════════════════════════
    
    case 'proposal_follow_up':
      return await generateProposalFollowUpPlan(situation, profile, whatWorks);
    
    // ═══════════════════════════════════════════════════════
    // PLAN: CLOSE EXISTING DEMOS
    // ═══════════════════════════════════════════════════════
    
    case 'close_existing_demos':
      return await generateCloseExistingDemosPlan(situation, profile, whatWorks);
    
    // ═══════════════════════════════════════════════════════
    // PLAN: MOMENTUM RECOVERY
    // ═══════════════════════════════════════════════════════
    
    case 'momentum_recovery':
      return await generateMomentumRecoveryPlan(situation, profile, whatWorks);
    
    // ═══════════════════════════════════════════════════════
    // PLAN: LEAD REACTIVATION
    // ═══════════════════════════════════════════════════════
    
    case 'lead_reactivation':
      return await generateLeadReactivationPlan(situation, profile, whatWorks);
    
    // ═══════════════════════════════════════════════════════
    // PLAN: OPTIMIZATION
    // ═══════════════════════════════════════════════════════
    
    case 'optimization':
      return await generateOptimizationPlan(situation, profile, whatWorks);
    
    // ═══════════════════════════════════════════════════════
    // DEFAULT
    // ═══════════════════════════════════════════════════════
    
    default:
      return {
        type: lever.type,
        mensaje_principal: 'Continuar ritmo actual.',
        acciones: [],
        confidence: 0.5
      };
  }
}


// ═══════════════════════════════════════════════════════════════
// PLAN ESPECÍFICO: Emotional Support
// ═══════════════════════════════════════════════════════════════

async function generateEmotionalSupportPlan(situation, profile) {
  
  const { emotional } = situation;
  
  // Identificar trigger emocional
  const { data: recentState } = await supabase
    .from('user_emotional_state')
    .select('*')
    .eq('user_id', profile.user_id)
    .order('created_at', { ascending: false })
    .limit(3);
  
  let posibleCausa = 'No identificada';
  if (recentState && recentState.length > 0 && recentState[0].que_paso) {
    posibleCausa = recentState[0].que_paso;
  }
  
  // Recursos de apoyo
  const { data: recursos } = await supabase
    .from('recursos_apoyo')
    .select('*')
    .in('categoria', ['abrumado', 'estancado', 'sin_clientes'])
    .limit(3);
  
  // Frase motivacional
  const { data: frases } = await supabase
    .from('frases_motivacionales')
    .select('*')
    .eq('categoria', emotional.motivacion < 5 ? 'sin_clientes' : 'abrumado')
    .limit(1);
  
  return {
    type: 'emotional_support',
    mensaje_principal: `Che ${profile.nombre}, noto que estás con baja energía. Antes de planear acciones, hablemos.`,
    
    diagnostico: {
      estado: emotional.estado,
      motivacion: emotional.motivacion,
      estres: emotional.estres,
      posible_causa: posibleCausa,
      impacto: 'Baja motivación reduce conversión 40%+ según datos históricos.'
    },
    
    accion_inmediata: {
      tipo: 'micro_win',
      descripcion: 'Generá un win rápido para recuperar confianza',
      opciones: [
        {
          accion: 'Pedí testimonio a cliente feliz',
          tiempo_min: 10,
          probabilidad_exito: 0.9,
          impacto_emocional: 'alto',
          speech: `Che [cliente], ¿te puedo pedir un favor? Estoy armando casos de éxito. ¿Me contarías en 2-3 líneas qué cambió desde que empezaste a usar [producto]?`
        },
        {
          accion: 'Contactá lead caliente casi cerrado',
          tiempo_min: 15,
          probabilidad_cierre: 0.7,
          impacto_emocional: 'muy alto',
          speech: 'Usar tu mejor speech validado'
        },
        {
          accion: 'Publicá win reciente en LinkedIn',
          tiempo_min: 10,
          probabilidad_engagement: 0.8,
          impacto_emocional: 'medio-alto'
        }
      ]
    },
    
    recursos_apoyo: recursos || [],
    frase_motivacional: frases?.[0]?.frase || 'Un paso a la vez. Vos podés.',
    
    confidence: 0.8
  };
}


// ═══════════════════════════════════════════════════════════════
// PLAN ESPECÍFICO: Pipeline Emergency
// ═══════════════════════════════════════════════════════════════

async function generatePipelineEmergencyPlan(situation, profile, whatWorks) {
  
  const { pipeline, progress, timing } = situation;
  
  // Calcular cuántos leads necesita
  const leadsNecesarios = Math.ceil(progress.gap / 700 * 6); // asumiendo 15% conversión total
  const contactosPorDia = Math.ceil(leadsNecesarios / progress.dias_restantes);
  
  // Mejor canal
  const mejorCanal = whatWorks.canal?.funciona_con?.canal || 'linkedin';
  const mejorHorario = whatWorks.timing?.mejor_horario || timing.mejor_momento_hoy || '10:00-11:00';
  const mejorDia = whatWorks.timing?.mejor_dia_semana || 'martes';
  
  // Speech validado
  const speech = whatWorks.speech?.mejor_speech || 
    `Hola [nombre], vi que [empresa] está [observación específica]. Tenemos [resultado concreto] para [tipo empresa] como la tuya. ¿15 min esta semana?`;
  
  return {
    type: 'pipeline_emergency',
    mensaje_principal: `🚨 ${profile.nombre}, pipeline crítico. ${pipeline.dias_sin_prospección} días sin prospectar = crisis en 2 semanas.`,
    
    diagnostico: {
      leads_calientes: pipeline.calientes,
      leads_tibios: pipeline.tibios,
      dias_hasta_secar: Math.ceil((pipeline.calientes + pipeline.tibios * 0.5) / 3),
      urgencia: 'ALTA'
    },
    
    plan_rescate: {
      objetivo_hoy: contactosPorDia,
      objetivo_semana: leadsNecesarios,
      canal: mejorCanal,
      horario: mejorHorario,
      dia_optimo: mejorDia,
      
      speech_validado: speech,
      conversion_esperada: whatWorks.canal?.tasa_exito || 0.15,
      
      lista_priorizada: {
        descripcion: `Generaremos lista de ${contactosPorDia} contactos priorizados`,
        filtros: [
          `ICP: ${profile.icp_principal || 'definir'}`,
          `Canal: ${mejorCanal}`,
          `Excluir: contactados últimos 30 días`
        ]
      },
      
      tracking: {
        meta_dia: contactosPorDia,
        meta_semana: leadsNecesarios,
        razon: `Necesitás ~${Math.ceil(progress.gap / 700)} cierres para objetivo. Backwards: ${leadsNecesarios} contactos → ${Math.ceil(leadsNecesarios * 0.3)} respuestas → ${Math.ceil(leadsNecesarios * 0.15)} demos → ${Math.ceil(progress.gap / 700)} cierres.`
      }
    },
    
    motivacion: `Sé que son muchos. Pero tu data dice: ${mejorDia} ${mejorHorario} con ese speech convertís ${((whatWorks.canal?.tasa_exito || 0.15) * 100).toFixed(0)}%. Bloqueá 1h, ponemos timer, hacemos batch.`,
    
    confidence: 0.85
  };
}


// ═══════════════════════════════════════════════════════════════
// PLAN ESPECÍFICO: Proposal Follow-Up
// ═══════════════════════════════════════════════════════════════

async function generateProposalFollowUpPlan(situation, profile, whatWorks) {
  
  const { pipeline, progress } = situation;
  
  // Obtener propuestas abiertas
  const { data: propuestas } = await supabase
    .from('contactos')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('stage', 'propuesta')
    .order('temperatura', { ascending: false });
  
  // Calcular días desde propuesta
  const propuestasConDias = (propuestas || []).map(p => {
    const diasDesde = Math.floor((Date.now() - new Date(p.stage_fecha_entrada).getTime()) / (1000 * 60 * 60 * 24));
    return { ...p, dias_desde_propuesta: diasDesde };
  });
  
  // Priorizar por urgencia (día 5-7 crítico)
  const urgentes = propuestasConDias.filter(p => p.dias_desde_propuesta >= 5 && p.dias_desde_propuesta <= 9);
  const proximasUrgentes = propuestasConDias.filter(p => p.dias_desde_propuesta >= 3 && p.dias_desde_propuesta < 5);
  
  return {
    type: 'proposal_follow_up',
    mensaje_principal: `${profile.nombre}, tenés ${pipeline.propuestas_pendientes} propuestas sin cerrar. Día 5-7 post-propuesta es crítico.`,
    
    diagnostico: {
      propuestas_pendientes: pipeline.propuestas_pendientes,
      valor_pipeline: pipeline.propuestas_pendientes * 700,
      conversion_rate_historica: whatWorks.follow_up?.tasa_exito || 0.5,
      valor_esperado: Math.round(pipeline.propuestas_pendientes * 700 * (whatWorks.follow_up?.tasa_exito || 0.5))
    },
    
    plan_follow_up: {
      urgentes: urgentes.map(p => ({
        nombre: p.nombre,
        empresa: p.empresa,
        dias_desde: p.dias_desde_propuesta,
        temperatura: p.temperatura,
        valor: p.valor_estimado || 700,
        accion: 'Llamar HOY',
        script: generateFollowUpScript(p, profile, 'urgente')
      })),
      
      proximas: proximasUrgentes.map(p => ({
        nombre: p.nombre,
        empresa: p.empresa,
        dias_desde: p.dias_desde_propuesta,
        temperatura: p.temperatura,
        valor: p.valor_estimado || 700,
        accion: 'Agendar mañana',
        script: generateFollowUpScript(p, profile, 'proximo')
      }))
    },
    
    insights: {
      momento_critico: 'Día 7 post-propuesta: 65% conversión vs 30% si esperás más',
      approach: 'Consultivo, no vendedor. "¿Cómo viene el tema? ¿Qué necesitás para decidir?"',
      objeciones_comunes: ['presupuesto', 'timing', 'necesita aprobación'],
      como_manejar: 'Ser directo: "Entiendo. ¿Es un no definitivo o un no por ahora?"'
    },
    
    confidence: 0.9
  };
}


// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function generateFollowUpScript(contacto, profile, urgencia) {
  if (urgencia === 'urgente') {
    return `Che ${contacto.nombre}, ¿cómo viene el tema ${contacto.empresa}? Ya pasaron ${contacto.dias_desde_propuesta} días de la propuesta. ¿Qué necesitás para decidir?`;
  } else {
    return `Hola ${contacto.nombre}, paso a chequear cómo viene la propuesta para ${contacto.empresa}. ¿Tuviste chance de revisarla? ¿Alguna duda?`;
  }
}


// Exportar funciones
export { generateProposalFollowUpPlan };
