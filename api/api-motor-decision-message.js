// ═══════════════════════════════════════════════════════════════
// api/motor-decision-message.js
// Craft message con tono personalizado según DISC + estado emocional
// ═══════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Craft Message
// Adapta tono según DISC, estado emocional y momentum
// ═══════════════════════════════════════════════════════════════

export function craftMessage({ plan, disc, emotionalState, momentum }) {
  
  const style = determineStyle(disc, emotionalState, momentum);
  
  // ═══════════════════════════════════════════════════════════
  // ESTILO: Direct & Competitive (Alto D + buen momentum)
  // ═══════════════════════════════════════════════════════════
  
  if (style === 'direct_competitive') {
    return craftDirectCompetitive(plan, emotionalState, momentum);
  }
  
  // ═══════════════════════════════════════════════════════════
  // ESTILO: Supportive & Motivational (Alto I/S + momentum bajo)
  // ═══════════════════════════════════════════════════════════
  
  if (style === 'supportive_motivational') {
    return craftSupportiveMotivational(plan, emotionalState, momentum);
  }
  
  // ═══════════════════════════════════════════════════════════
  // ESTILO: Analytical & Structured (Alto C + prefiere datos)
  // ═══════════════════════════════════════════════════════════
  
  if (style === 'analytical_structured') {
    return craftAnalyticalStructured(plan, emotionalState, momentum);
  }
  
  // ═══════════════════════════════════════════════════════════
  // ESTILO: Balanced (Mix o default)
  // ═══════════════════════════════════════════════════════════
  
  return craftBalanced(plan, emotionalState, momentum);
}


// ═══════════════════════════════════════════════════════════════
// FUNCIÓN: Determine Style
// Decide qué estilo usar según perfil
// ═══════════════════════════════════════════════════════════════

function determineStyle(disc, emotionalState, momentum) {
  
  // Parsear DISC si es JSON string
  let discProfile;
  if (typeof disc === 'string') {
    try {
      discProfile = JSON.parse(disc);
    } catch {
      discProfile = { D: 50, I: 50, S: 50, C: 50 };
    }
  } else {
    discProfile = disc || { D: 50, I: 50, S: 50, C: 50 };
  }
  
  const highD = discProfile.D > 65;
  const highI = discProfile.I > 65;
  const highS = discProfile.S > 65;
  const highC = discProfile.C > 65;
  
  const goodMomentum = momentum.estado === 'acelerando' || momentum.tendencia === 'acelerando';
  const lowMotivation = emotionalState.motivacion < 5;
  
  // Alto D + buen momentum = direct competitive
  if (highD && goodMomentum && !lowMotivation) {
    return 'direct_competitive';
  }
  
  // Alto I o S + momentum bajo = supportive motivational
  if ((highI || highS) && (lowMotivation || !goodMomentum)) {
    return 'supportive_motivational';
  }
  
  // Alto C = analytical structured
  if (highC) {
    return 'analytical_structured';
  }
  
  return 'balanced';
}


// ═══════════════════════════════════════════════════════════════
// CRAFT: Direct & Competitive
// ═══════════════════════════════════════════════════════════════

function craftDirectCompetitive(plan, emotionalState, momentum) {
  
  if (plan.type === 'proposal_follow_up') {
    return `
🎯 SITUACIÓN:

OBJETIVO MES: $${plan.diagnostico.valor_pipeline / plan.diagnostico.propuestas_pendientes * (1 / 0.5) || 10000}
ACTUAL: ${plan.diagnostico.valor_esperado ? `$${plan.diagnostico.valor_esperado}` : 'Calculando...'}
GAP: Pipeline $${plan.diagnostico.valor_pipeline}

DIAGNÓSTICO:
• ${plan.diagnostico.propuestas_pendientes} propuestas abiertas
• Valor pipeline: $${plan.diagnostico.valor_pipeline}
• Conversión esperada: ${(plan.diagnostico.conversion_rate_historica * 100).toFixed(0)}%

PALANCA CRÍTICA: CERRAR PROPUESTAS EXISTENTES

PLAN HOY:
${plan.plan_follow_up.urgentes.map((p, i) => 
  `${i + 1}. ${p.nombre} (${p.empresa}) - Día ${p.dias_desde} - ${p.accion}`
).join('\n')}

PROYECCIÓN SI EJECUTÁS:
• ${Math.floor(plan.diagnostico.propuestas_pendientes * plan.diagnostico.conversion_rate_historica)} cierres esperados
• $${plan.diagnostico.valor_esperado} revenue
• Probabilidad cumplir objetivo: ${plan.confidence * 100}%

¿Arrancamos con ${plan.plan_follow_up.urgentes[0]?.nombre || 'primera propuesta'}?
    `.trim();
  }
  
  if (plan.type === 'pipeline_emergency') {
    return `
🚨 ALERTA PIPELINE

SITUACIÓN:
• ${plan.plan_rescate.objetivo_semana} contactos necesarios
• ${plan.diagnostico.dias_hasta_secar} días hasta pipeline seco
• Conversion rate: ${(plan.plan_rescate.conversion_esperada * 100).toFixed(0)}%

META HOY: ${plan.plan_rescate.objetivo_hoy} contactos
Canal: ${plan.plan_rescate.canal}
Horario: ${plan.plan_rescate.horario}
Speech: "${plan.plan_rescate.speech_validado}"

TRACKING:
• Semana: ${plan.plan_rescate.objetivo_semana} contactos
• → ${Math.floor(plan.plan_rescate.objetivo_semana * 0.3)} respuestas
• → ${Math.floor(plan.plan_rescate.objetivo_semana * 0.15)} demos
• → ${Math.floor(plan.plan_rescate.objetivo_semana * 0.15 * 0.5)} cierres

NO ES OPCIONAL. Es matemática.

¿Bloqueamos 1h ahora?
    `.trim();
  }
  
  return plan.mensaje_principal;
}


// ═══════════════════════════════════════════════════════════════
// CRAFT: Supportive & Motivational
// ═══════════════════════════════════════════════════════════════

function craftSupportiveMotivational(plan, emotionalState, momentum) {
  
  if (plan.type === 'emotional_support') {
    return `
Hey 👋

${plan.frase_motivacional}

Veo que estás con energía ${emotionalState.energia}/10 y motivación ${emotionalState.motivacion}/10.

${plan.diagnostico.posible_causa !== 'No identificada' ? `Entiendo que "${plan.diagnostico.posible_causa}".` : ''}

💡 Hacemos esto:

En vez de pensar en TODO lo que falta, generemos un win rápido AHORA para recuperar momentum.

Opciones (elegí la que más te cierre):

${plan.accion_inmediata.opciones.map((opt, i) => 
  `${i + 1}. ${opt.accion} (${opt.tiempo_min} min, ${(opt.probabilidad_exito * 100).toFixed(0)}% éxito)`
).join('\n')}

Una vez que tengás ese win, volvemos a armar el plan con más energía.

¿Cuál de las 3 te late más? 🚀
    `.trim();
  }
  
  if (plan.type === 'proposal_follow_up') {
    return `
Che, mirá lo que tenemos 👀

✨ La buena noticia:
Tenés ${plan.diagnostico.propuestas_pendientes} propuestas pendientes por $${plan.diagnostico.valor_pipeline}.

📊 Tu data histórica:
Follow-up día 7 = ${(plan.diagnostico.conversion_rate_historica * 100).toFixed(0)}% conversión
Esperar más = baja a 30%

💪 Plan para HOY:

${plan.plan_follow_up.urgentes.slice(0, 3).map((p, i) => 
  `${i + 1}. ${p.nombre} (${p.dias_desde} días, temperatura ${p.temperatura})`
).join('\n')}

No hace falta cerrarlas todas hoy. Con que avances 2-3, ya cambia el mes.

${plan.insights.approach}

Estoy acá para lo que necesites. ¿Arrancamos con ${plan.plan_follow_up.urgentes[0]?.nombre || 'la primera'}?
    `.trim();
  }
  
  if (plan.type === 'pipeline_emergency') {
    return `
Ok, situación real 📊

Pipeline está bajo: ${plan.diagnostico.leads_calientes} calientes, ${plan.diagnostico.leads_tibios} tibios.

Sé que puede sonar abrumador, pero miralo así:

${plan.plan_rescate.objetivo_hoy} contactos hoy × ${plan.plan_rescate.conversion_esperada * 100}% conversión = ${Math.floor(plan.plan_rescate.objetivo_hoy * plan.plan_rescate.conversion_esperada)} demos esperadas.

Y vos ya sabés que tu speech en ${plan.plan_rescate.canal} funciona bien.

🎯 Plan simple:
• Bloqueá 1h ${plan.plan_rescate.horario}
• Usamos tu speech: "${plan.plan_rescate.speech_validado.substring(0, 50)}..."
• Vamos de a uno, sin presión

Después de los primeros 3-4, agarrás ritmo. Lo he visto mil veces.

¿Dale? Yo te acompaño. 💪
    `.trim();
  }
  
  return plan.mensaje_principal;
}


// ═══════════════════════════════════════════════════════════════
// CRAFT: Analytical & Structured
// ═══════════════════════════════════════════════════════════════

function craftAnalyticalStructured(plan, emotionalState, momentum) {
  
  if (plan.type === 'proposal_follow_up') {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANÁLISIS PROPUESTAS PENDIENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MÉTRICAS PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Propuestas abiertas:     ${plan.diagnostico.propuestas_pendientes}
Valor pipeline:          $${plan.diagnostico.valor_pipeline.toLocaleString()}
Conversión histórica:    ${(plan.diagnostico.conversion_rate_historica * 100).toFixed(1)}%
Valor esperado:          $${plan.diagnostico.valor_esperado.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANÁLISIS TEMPORAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Propuestas Urgentes (Día 5-9):
${plan.plan_follow_up.urgentes.map((p, i) => 
  `${i + 1}. ${p.nombre.padEnd(20)} | Día ${String(p.dias_desde).padStart(2)} | Temp: ${String(p.temperatura).padStart(3)} | $${p.valor.toLocaleString()}`
).join('\n')}

Próximas Urgentes (Día 3-4):
${plan.plan_follow_up.proximas.map((p, i) => 
  `${i + 1}. ${p.nombre.padEnd(20)} | Día ${String(p.dias_desde).padStart(2)} | Temp: ${String(p.temperatura).padStart(3)} | $${p.valor.toLocaleString()}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATOS DECISIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Insight crítico:
${plan.insights.momento_critico}

Metodología validada:
${plan.insights.approach}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAN EJECUCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prioridad 1: ${plan.plan_follow_up.urgentes[0]?.nombre || 'N/A'}
  - Acción: ${plan.plan_follow_up.urgentes[0]?.accion || 'N/A'}
  - Valor: $${plan.plan_follow_up.urgentes[0]?.valor.toLocaleString() || '0'}
  - Script: "${plan.plan_follow_up.urgentes[0]?.script || 'N/A'}"
  
Tiempo estimado: ${plan.plan_follow_up.urgentes.length * 15} minutos
ROI esperado: $${plan.diagnostico.valor_esperado.toLocaleString()}
Confianza: ${(plan.confidence * 100).toFixed(1)}%

¿Proceder según plan?
    `.trim();
  }
  
  if (plan.type === 'pipeline_emergency') {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALERTA: PIPELINE CRÍTICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTADO ACTUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Leads calientes:         ${plan.diagnostico.leads_calientes}
Leads tibios:            ${plan.diagnostico.leads_tibios}
Días sin prospección:    ${plan.diagnostico.dias_hasta_secar}
Urgencia:                ${plan.diagnostico.urgencia}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÁLCULO NECESIDADES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Meta semana:             ${plan.plan_rescate.objetivo_semana} contactos
Meta diaria:             ${plan.plan_rescate.objetivo_hoy} contactos
Canal óptimo:            ${plan.plan_rescate.canal}
Horario óptimo:          ${plan.plan_rescate.horario}
Día óptimo:              ${plan.plan_rescate.dia_optimo}

Conversión esperada:     ${(plan.plan_rescate.conversion_esperada * 100).toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROYECCIÓN EMBUDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contactos:               ${plan.plan_rescate.objetivo_semana}
  ↓ ${(plan.plan_rescate.conversion_esperada * 2 * 100).toFixed(0)}% respuesta
Respuestas:              ${Math.floor(plan.plan_rescate.objetivo_semana * plan.plan_rescate.conversion_esperada * 2)}
  ↓ 50% demo
Demos:                   ${Math.floor(plan.plan_rescate.objetivo_semana * plan.plan_rescate.conversion_esperada)}
  ↓ 50% cierre
Cierres:                 ${Math.floor(plan.plan_rescate.objetivo_semana * plan.plan_rescate.conversion_esperada * 0.5)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METODOLOGÍA VALIDADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Speech: "${plan.plan_rescate.speech_validado}"

Datos históricos: ${(plan.plan_rescate.conversion_esperada * 100).toFixed(0)}% conversión en ${plan.plan_rescate.dia_optimo} ${plan.plan_rescate.horario}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recomendación: Ejecutar plan inmediatamente.
Confianza: ${(plan.confidence * 100).toFixed(1)}%

¿Iniciar secuencia?
    `.trim();
  }
  
  return plan.mensaje_principal;
}


// ═══════════════════════════════════════════════════════════════
// CRAFT: Balanced (Default)
// ═══════════════════════════════════════════════════════════════

function craftBalanced(plan, emotionalState, momentum) {
  return `
${plan.mensaje_principal}

${plan.diagnostico ? `
📊 Situación:
${Object.entries(plan.diagnostico).slice(0, 3).map(([key, value]) => 
  `• ${key}: ${value}`
).join('\n')}
` : ''}

${plan.plan_rescate || plan.plan_follow_up ? `
🎯 Plan de acción:
${plan.plan_rescate ? 
  `• ${plan.plan_rescate.objetivo_hoy} contactos hoy
• Canal: ${plan.plan_rescate.canal}
• Horario: ${plan.plan_rescate.horario}` 
  : ''}
${plan.plan_follow_up ? 
  plan.plan_follow_up.urgentes.slice(0, 3).map((p, i) => 
    `${i + 1}. ${p.nombre} - ${p.accion}`
  ).join('\n')
  : ''}
` : ''}

¿Arrancamos?
  `.trim();
}


// Exportar función principal
export { craftMessage, determineStyle };
