// ═══════════════════════════════════════════════════════════════
// api/motor-decision-lever-plan.js
// Identificación de palanca crítica + generación de plan
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

let supabase;

function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}


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
  const supabaseClient = getSupabase();
  
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
// PLAN ESPECÍFICO: Prospecting Sprint
// ═══════════════════════════════════════════════════════════════

async function generateProspectingSprintPlan(situation, profile, whatWorks) {
  
  const { pipeline, progress, timing } = situation;
  
  // Similar a pipeline emergency pero con foco en GAP específico
  const leadsNecesarios = Math.ceil(progress.gap / 700 * 6); // 15% conversión total
  const contactosPorDia = Math.ceil(leadsNecesarios / Math.max(progress.dias_restantes, 1));
  
  // Mejor canal
  const mejorCanal = whatWorks.canal?.mejor_canal || 'linkedin';
  const mejorHorario = whatWorks.timing?.mejor_horario || timing.mejor_momento_hoy || '10:00-11:00';
  
  // Speech validado
  const speech = whatWorks.speech?.mejor_speech || 
    `Hola [nombre], vi que [empresa] está [observación]. Tenemos [resultado] para [tipo empresa] como la tuya. ¿15 min esta semana?`;
  
  return {
    type: 'prospecting_sprint',
    mensaje_principal: `${profile.nombre}, GAP $${progress.gap.toFixed(0)} con ${progress.dias_restantes} días. Sprint intensivo necesario.`,
    
    diagnostico: {
      gap_actual: `$${progress.gap.toFixed(0)}`,
      gap_porcentaje: `${(progress.gap / progress.objetivo * 100).toFixed(0)}%`,
      dias_restantes: progress.dias_restantes,
      velocidad_actual: `$${progress.velocidad_actual.toFixed(0)}/día`,
      velocidad_necesaria: `$${progress.velocidad_necesaria.toFixed(0)}/día`,
      deficit: `$${(progress.velocidad_necesaria - progress.velocidad_actual).toFixed(0)}/día`,
      urgencia: 'CRÍTICA'
    },
    
    plan_sprint: {
      duracion: `${progress.dias_restantes} días`,
      objetivo_diario: contactosPorDia,
      objetivo_total: leadsNecesarios,
      
      breakdown_inverso: {
        cierres_necesarios: Math.ceil(progress.gap / 700),
        demos_necesarias: Math.ceil(progress.gap / 700 * 2.5), // 40% conversión demo→cierre
        respuestas_necesarias: Math.ceil(progress.gap / 700 * 5), // 50% respuesta→demo
        contactos_necesarios: leadsNecesarios, // 30% contacto→respuesta
        logica: 'Trabajando backwards desde gap'
      },
      
      metodologia: {
        canal: mejorCanal,
        horario_optimo: mejorHorario,
        speech: speech,
        conversion_esperada: whatWorks.canal?.tasa_exito || 0.15,
        tiempo_por_contacto: '5-7 min',
        tiempo_total_dia: `${Math.ceil(contactosPorDia * 6 / 60)} horas/día`
      },
      
      calendario_sprint: generateSprintCalendar(progress.dias_restantes, contactosPorDia),
      
      tracking: {
        meta_dia: contactosPorDia,
        checkpoint: 'Evaluar cada 2 días',
        pivot_trigger: 'Si conversión <10% después día 2, cambiar approach'
      }
    },
    
    riesgos: {
      burnout: 'Alto volumen puede agotar. Priorizar calidad sobre cantidad si ves que baja conversión.',
      realismo: progress.dias_restantes < 5 ? 'Gap puede ser muy grande para tiempo disponible. Considera ajustar objetivo.' : 'Realista con ejecución disciplinada.',
      alternativas: progress.dias_restantes < 3 ? 'Considerar cerrar leads calientes existentes vs prospectar nuevos' : null
    },
    
    motivacion: `Es intenso, pero tu data dice que podés. ${mejorCanal} + ${mejorHorario} = ${((whatWorks.canal?.tasa_exito || 0.15) * 100).toFixed(0)}% conversión. ${contactosPorDia} contactos/día × ${progress.dias_restantes} días = objetivo cumplido.`,
    
    confidence: progress.dias_restantes >= 7 ? 0.75 : 0.6
  };
}

function generateSprintCalendar(dias, contactosPorDia) {
  const calendar = [];
  const hoy = new Date();
  
  for (let i = 0; i < Math.min(dias, 14); i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    
    calendar.push({
      dia: i + 1,
      fecha: fecha.toLocaleDateString('es-AR'),
      dia_semana: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][fecha.getDay()],
      objetivo: contactosPorDia,
      checkpoint: (i + 1) % 2 === 0 ? 'Evaluar progreso' : null
    });
  }
  
  return calendar;
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
// PLAN ESPECÍFICO: Close Existing Demos
// ═══════════════════════════════════════════════════════════════

async function generateCloseExistingDemosPlan(situation, profile, whatWorks) {
  
  const { pipeline, progress } = situation;
  
  // Obtener demos pendientes
  const { data: demos } = await supabase
    .from('contactos')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('stage', 'demo')
    .order('temperatura', { ascending: false });
  
  // Calcular días desde demo
  const demosConDias = (demos || []).map(d => {
    const diasDesde = Math.floor((Date.now() - new Date(d.stage_fecha_entrada).getTime()) / (1000 * 60 * 60 * 24));
    return { ...d, dias_desde_demo: diasDesde };
  });
  
  // Priorizar por temperatura y días
  const urgentes = demosConDias.filter(d => d.dias_desde_demo >= 3 && d.temperatura > 60);
  const calientes = demosConDias.filter(d => d.temperatura > 70);
  
  return {
    type: 'close_existing_demos',
    mensaje_principal: `${profile.nombre}, tenés ${pipeline.demos_pendientes} demos pendientes. Cerrarlas vale más que buscar nuevas.`,
    
    diagnostico: {
      demos_pendientes: pipeline.demos_pendientes,
      valor_estimado: pipeline.demos_pendientes * 700,
      conversion_esperada: 0.5, // 50% demos → propuesta → cierre
      valor_esperado: Math.round(pipeline.demos_pendientes * 700 * 0.5)
    },
    
    plan_cierre: {
      demos_urgentes: urgentes.slice(0, 5).map(d => ({
        nombre: d.nombre,
        empresa: d.empresa,
        dias_desde: d.dias_desde_demo,
        temperatura: d.temperatura,
        valor: d.valor_estimado || 700,
        accion: 'Enviar propuesta HOY',
        next_step: `Preparar propuesta específica para ${d.empresa}. Follow-up: "Che ${d.nombre}, armé propuesta custom para ${d.empresa}. ¿La vemos mañana?"`
      })),
      
      demos_calientes: calientes.slice(0, 3).map(d => ({
        nombre: d.nombre,
        empresa: d.empresa,
        temperatura: d.temperatura,
        valor: d.valor_estimado || 700,
        accion: 'Push para propuesta esta semana',
        next_step: `Follow-up consultivo. "¿Qué necesitás para que armemos propuesta?"`
      }))
    },
    
    estrategia: {
      enfoque: 'Velocidad sin presión',
      approach: 'Después de demo, ventana de 48-72hs crítica. Curiosidad alta, momento ideal para propuesta.',
      objeciones_comunes: ['necesito pensarlo', 'consultar con socio', 'presupuesto'],
      como_manejar: {
        'necesito pensarlo': 'Che, perfecto. ¿Qué específicamente necesitás evaluar? Te ayudo.',
        'consultar con socio': '¿Cuándo hablan? Te mando mail resumen para que compartas.',
        'presupuesto': 'Entiendo. ¿Tenés un rango aprobado? Puedo adaptar plan.'
      }
    },
    
    motivacion: `Convertir estas ${pipeline.demos_pendientes} demos = $${pipeline.demos_pendientes * 700 * 0.5} sin prospección. ROI 10× vs buscar nuevos.`,
    
    confidence: 0.85
  };
}


// ═══════════════════════════════════════════════════════════════
// PLAN ESPECÍFICO: Momentum Recovery
// ═══════════════════════════════════════════════════════════════

async function generateMomentumRecoveryPlan(situation, profile, whatWorks) {
  
  const { momentum, emotional, pipeline } = situation;
  
  // Identificar qué cambió
  const { data: recentCierres } = await supabase
    .from('interacciones')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('resultado', 'cerrado')
    .gte('fecha', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
    .order('fecha', { ascending: false });
  
  const cierresRecientes = recentCierres?.length || 0;
  const ultimoCierre = recentCierres?.[0];
  const diasSinCierre = ultimoCierre 
    ? Math.floor((Date.now() - new Date(ultimoCierre.fecha).getTime()) / (1000 * 60 * 60 * 24))
    : 30;
  
  return {
    type: 'momentum_recovery',
    mensaje_principal: `${profile.nombre}, momentum bajando ${Math.abs(momentum.vs_mes_anterior * 100).toFixed(0)}% vs mes anterior. Generemos quick wins.`,
    
    diagnostico: {
      momentum_actual: momentum.estado,
      tendencia: momentum.tendencia,
      vs_mes_anterior: `${(momentum.vs_mes_anterior * 100).toFixed(0)}%`,
      dias_sin_cierre: diasSinCierre,
      racha_mejor: momentum.mejor_racha,
      racha_actual: momentum.racha_actual,
      gap_racha: momentum.mejor_racha - momentum.racha_actual
    },
    
    plan_recovery: {
      objetivo: 'Generar 2-3 quick wins en próximos 5 días',
      
      quick_wins: [
        {
          tipo: 'Cierre fácil',
          target: 'Lead más caliente (temp >80)',
          accion: 'Push suave para cerrar',
          probabilidad: 0.8,
          tiempo: '1-2 días',
          impacto_momentum: 'muy alto',
          script: `Che [nombre], venimos charlando hace ${diasSinCierre > 7 ? 'un tiempo' : 'poco'}. ¿Arrancamos ya o necesitás algo más?`
        },
        {
          tipo: 'Testimonio cliente feliz',
          target: 'Cliente con mejores resultados',
          accion: 'Pedir testimonio + caso éxito',
          probabilidad: 0.9,
          tiempo: '15 minutos',
          impacto_momentum: 'medio-alto',
          script: `Che [cliente], armando casos éxito. ¿Me contás en 2-3 líneas qué cambió desde que arrancaste?`
        },
        {
          tipo: 'Reactivar lead tibio',
          target: 'Lead temp 50-70 sin contacto >30d',
          accion: 'Nuevo approach con insight fresh',
          probabilidad: 0.4,
          tiempo: '2-3 días',
          impacto_momentum: 'medio',
          script: `Che [nombre], vi que [empresa] está [observación]. Pensé en vos porque [insight específico]. ¿Hablamos 15 min?`
        }
      ],
      
      anti_pattern: {
        evitar: [
          'Prospección masiva sin estrategia (agota sin resultados)',
          'Follow-up desesperado (espanta leads)',
          'Cambiar strategy completa (confunde)'
        ],
        hacer: [
          'Wins pequeños y visibles',
          'Volver a lo que funcionaba antes',
          'Celebrar cada mini-win'
        ]
      }
    },
    
    insights: {
      causa_probable: diasSinCierre > 14 ? 'Ciclo sin cierres' : momentum.racha_actual < 2 ? 'Perdió racha' : 'Normal fluctuation',
      solucion: 'Quick wins restauran confianza → confianza mejora conversión → conversión genera momentum',
      tiempo_recovery: '5-7 días con wins consistentes'
    },
    
    motivacion: `Tu mejor racha fue ${momentum.mejor_racha} cierres seguidos. Ya lo hiciste una vez, podés volver ahí. Empecemos con un win fácil.`,
    
    confidence: 0.75
  };
}


// ═══════════════════════════════════════════════════════════════
// PLAN ESPECÍFICO: Lead Reactivation
// ═══════════════════════════════════════════════════════════════

async function generateLeadReactivationPlan(situation, profile, whatWorks) {
  
  const { pipeline } = situation;
  
  // Obtener leads fríos con historia
  const { data: leadsFrios } = await supabase
    .from('contactos')
    .select('*')
    .eq('user_id', profile.user_id)
    .lt('temperatura', 40)
    .neq('tipo', 'archivado')
    .order('ultima_interaccion', { ascending: false })
    .limit(30);
  
  // Segmentar por tipo
  const conInteraccion = (leadsFrios || []).filter(l => l.ultima_interaccion);
  const sinInteraccion = (leadsFrios || []).filter(l => !l.ultima_interaccion);
  
  // Calcular días desde última interacción
  const leadsConDias = conInteraccion.map(l => {
    const diasDesde = Math.floor((Date.now() - new Date(l.ultima_interaccion).getTime()) / (1000 * 60 * 60 * 24));
    return { ...l, dias_sin_contacto: diasDesde };
  });
  
  // Priorizar: 30-60 días (no muy reciente, no muy viejo)
  const sweetSpot = leadsConDias.filter(l => l.dias_sin_contacto >= 30 && l.dias_sin_contacto <= 90);
  
  return {
    type: 'lead_reactivation',
    mensaje_principal: `${profile.nombre}, tenés ${pipeline.frios} leads fríos dormidos. Reactivar 3× más fácil que prospectar desde 0.`,
    
    diagnostico: {
      leads_frios: pipeline.frios,
      con_historia: conInteraccion.length,
      sin_historia: sinInteraccion.length,
      sweet_spot: sweetSpot.length,
      conversion_esperada: 0.15,
      valor_estimado: Math.round(sweetSpot.length * 0.15 * 700)
    },
    
    plan_reactivacion: {
      segmento_1: {
        nombre: 'Sweet Spot (30-90 días)',
        cantidad: sweetSpot.length,
        estrategia: 'Nuevo approach con insight fresh',
        probabilidad: 0.15,
        leads: sweetSpot.slice(0, 10).map(l => ({
          nombre: l.nombre,
          empresa: l.empresa,
          dias_sin_contacto: l.dias_sin_contacto,
          contexto_previo: l.notas || 'Sin notas',
          nuevo_approach: `Che ${l.nombre}, hace ${l.dias_sin_contacto} días hablamos de [tema]. Desde entonces salió [novedad/insight]. ¿Vale la pena que charlemos 15 min?`
        }))
      },
      
      segmento_2: {
        nombre: 'Contactados hace poco (15-30 días)',
        cantidad: leadsConDias.filter(l => l.dias_sin_contacto < 30).length,
        estrategia: 'Follow-up suave',
        probabilidad: 0.1,
        approach: 'Check-in casual, no vendedor'
      },
      
      segmento_3: {
        nombre: 'Muy viejos (>90 días)',
        cantidad: leadsConDias.filter(l => l.dias_sin_contacto > 90).length,
        estrategia: 'Approach casi como nuevo',
        probabilidad: 0.05,
        approach: 'Recomienzo con nuevo value prop'
      }
    },
    
    mejores_practicas: {
      que_funciona: [
        'Mencionar insight nuevo/actualización relevante (no "checking in")',
        'Reconocer tiempo pasado con humor ("Sé que hace mil que no hablamos...")',
        'Valor claro upfront ("Tengo algo que creo te puede servir")',
        'CTA simple (15 min, no "cuándo te viene bien?")'
      ],
      que_evitar: [
        '"Just checking in"',
        '"Volviendo a contactarte sobre..."',
        'Pitch largo del producto original',
        'Presión o urgencia artificial'
      ]
    },
    
    templates: {
      sweet_spot: `Che ${profile.nombre}, hace [X días] hablamos de [tema]. Vi que [empresa] está [observación/novedad]. Pensé: esto le sirve. ¿15 min esta semana?`,
      muy_viejo: `Hola [nombre], sé que hace mucho no hablamos. [Empresa] lanzó [novedad]. Hablamos hace [tiempo] de [tema], creo que ahora tiene más sentido. ¿Vale una charla?`,
      casual_checkin: `Che [nombre], no sé si seguís con el tema [X] en [empresa], pero salió [novedad]. Si te sirve, te cuento. Sino todo bien igual!`
    },
    
    ejecucion: {
      ritmo: '5-7 reactivaciones/día',
      canal: whatWorks.canal?.mejor_canal || 'email + LinkedIn',
      momento: whatWorks.timing?.mejor_horario || 'Mañana 10-12hs',
      seguimiento: 'Si no responde en 3 días, un follow-up. Si no responde ahí, archivar.'
    },
    
    motivacion: `Estos leads ya te conocen, ya tuvieron curiosidad antes. Nueva conversación con ellos = 3× más fácil que desde 0. ${sweetSpot.length} sweet spot × 15% conversión = ${Math.ceil(sweetSpot.length * 0.15)} demos.`,
    
    confidence: 0.7
  };
}


// ═══════════════════════════════════════════════════════════════
// PLAN ESPECÍFICO: Optimization
// ═══════════════════════════════════════════════════════════════

async function generateOptimizationPlan(situation, profile, whatWorks) {
  
  const { pipeline, progress, momentum } = situation;
  
  // Analizar qué está funcionando mejor
  const topPatterns = whatWorks.top_patterns || [];
  
  return {
    type: 'optimization',
    mensaje_principal: `${profile.nombre}, sistema funcionando bien. Momento de optimizar y escalar.`,
    
    diagnostico: {
      progreso_objetivo: `${(progress.porcentaje * 100).toFixed(0)}%`,
      proyeccion: progress.realista ? 'Realista' : 'Optimista',
      salud_pipeline: `${(pipeline.salud * 100).toFixed(0)}%`,
      momentum: momentum.estado,
      calificacion_general: 'Bueno'
    },
    
    oportunidades_mejora: [
      {
        area: 'Eficiencia temporal',
        oportunidad: 'Doblar lo que funciona en menos tiempo',
        accion: 'Bloquear slots específicos para actividades high-ROI',
        impacto: 'medio-alto',
        implementacion: {
          paso_1: 'Identificar tu slot más productivo (ej: Martes 10-12)',
          paso_2: 'Bloquear ese slot semanal SOLO para prospección',
          paso_3: 'Medir resultados 2 semanas',
          paso_4: 'Si funciona, agregar otro slot'
        }
      },
      {
        area: 'Conversión pipeline',
        oportunidad: `Mejorar conversión de ${pipeline.tibios} leads tibios`,
        accion: 'Nurturing system (1 touchpoint semanal)',
        impacto: 'medio',
        implementacion: {
          sistema: 'Lunes: insight relevante / Jueves: caso éxito / Sábado: pregunta consultiva',
          tiempo: '15 min/semana para armar contenido',
          esperado: `${Math.ceil(pipeline.tibios * 0.1)} leads tibios → calientes (10% conversión)`
        }
      },
      {
        area: 'Leverage',
        oportunidad: 'Automatizar/delegar tareas repetitivas',
        accion: 'Identificar tareas <$20/hora value',
        impacto: 'alto',
        ejemplos: [
          'Investigación pre-contacto → asistente virtual',
          'Follow-ups simples → templates + scheduling',
          'Propuestas básicas → template master',
          'LinkedIn prospecting → Sales Navigator + automatización'
        ]
      },
      {
        area: 'Learning loops',
        oportunidad: 'Codificar patterns validados',
        accion: 'Documentar qué funciona para replicar',
        impacto: 'medio-alto',
        implementacion: {
          que_documentar: topPatterns.map(p => p.pattern_description).join(', '),
          como: 'Notion/Google Doc con: Qué probé → Qué funcionó → Por qué funcionó → Cómo replicar',
          frecuencia: 'Review mensual patterns'
        }
      }
    ],
    
    plan_90_dias: {
      mes_1: {
        objetivo: 'Optimizar eficiencia actual',
        kpis: [
          'Identificar top 3 patterns validados',
          'Bloquear 2 slots semanales high-ROI',
          'Documentar playbook básico'
        ]
      },
      mes_2: {
        objetivo: 'Escalar lo que funciona',
        kpis: [
          'Doblar volumen actividades high-ROI',
          'Automatizar 3 tareas repetitivas',
          'Testear 1 canal nuevo'
        ]
      },
      mes_3: {
        objetivo: 'Scale & systemize',
        kpis: [
          'Pipeline 2× actual',
          'Sistema nurturing funcionando',
          'Playbook completo documentado'
        ]
      }
    },
    
    insights: {
      momento: 'Estás en top 20% vendedores que llegan acá. Optimizar ahora te lleva a top 5%.',
      riesgo: 'Complacencia. Momentum es frágil, mantener ritmo crítico.',
      recomendacion: 'No cambies nada core. Optimizá en los bordes.'
    },
    
    confidence: 0.7
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


// Exportar funciones (ya exportadas inline pero por claridad)
// Las funciones principales ya están exportadas:
// - export function identifyCriticalLever()
// - export async function generatePlan()
