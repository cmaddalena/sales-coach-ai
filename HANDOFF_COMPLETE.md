# 🚀 SALES COACH AI - HANDOFF DOCUMENT COMPLETO
## Para VS Code + OpenRouter + Claude API

**Fecha:** 2024-12-08  
**Estado:** Sistema 85% funcional, 1 bug crítico en APIs backend  
**Objetivo:** Fix bug API motor-decision-core + testing completo

---

## 📋 ÍNDICE

1. [Estado Actual del Sistema](#estado-actual)
2. [Arquitectura Completa](#arquitectura)
3. [Estructura de Archivos](#estructura-archivos)
4. [Base de Datos](#base-de-datos)
5. [Bug Actual (Crítico)](#bug-actual)
6. [Pasos para Resolver](#pasos-resolver)
7. [Testing Checklist](#testing)
8. [Deploy Process](#deploy)
9. [Documentos de Referencia](#documentos-referencia)

---

## 🎯 ESTADO ACTUAL DEL SISTEMA {#estado-actual}

### **LO QUE FUNCIONA ✅**

```
Infraestructura (100%)
├─ ✅ Vercel deployment configurado
├─ ✅ Supabase PostgreSQL setup completo
├─ ✅ Variables entorno configuradas
└─ ✅ Git repository funcionando

Auth System (100%)
├─ ✅ Signup/Login con Supabase Auth
├─ ✅ Email confirmation
├─ ✅ Protected routes
└─ ✅ Session management

Frontend (90%)
├─ ✅ Dashboard básico carga datos
├─ ✅ Wizard onboarding completo
├─ ✅ Tabs navigation (Overview/Coach/Leads)
└─ ⚠️ Tab Coach muestra error (API falla)

Base de Datos (100%)
├─ ✅ Schema completo 18 tablas
├─ ✅ RLS policies configuradas
├─ ✅ Triggers y funciones helper
└─ ✅ Datos usuario guardados correctamente
```

### **LO QUE NO FUNCIONA ❌**

```
Backend APIs (50%)
├─ ❌ /api/motor-decision-core → 500 Internal Error
├─ ❓ /api/motor-decision-lever-plan (no testeado, depende del anterior)
└─ ❓ /api/motor-decision-message (no testeado, depende del anterior)

Pendientes Implementar
├─ ⏳ CRUD Contactos
├─ ⏳ Daily Tasks interactivas
├─ ⏳ Chat IA contextual
├─ ⏳ Content Engine
└─ ⏳ Cron jobs automáticos
```

---

## 🏗️ ARQUITECTURA COMPLETA {#arquitectura}

### **Stack Tecnológico**

```
FRONTEND:
- HTML5 / CSS3 / Vanilla JavaScript
- Supabase JS Client (@supabase/supabase-js)
- No frameworks (decisión arquitectura: simplicidad)

BACKEND:
- Vercel Serverless Functions (Node.js)
- Supabase PostgreSQL
- OpenAI GPT-4 API (para motor inteligencia)

INFRAESTRUCTURA:
- Hosting: Vercel
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Storage: Supabase Storage (futuro)
- Analytics: Pendiente
```

### **Flujo de Datos**

```
Usuario Browser
    ↓
[Frontend] HTML + JS
    ↓
Supabase Auth (login/session)
    ↓
    ├─→ [Queries directas] → Supabase DB (via RLS)
    │   ├─ user_profiles
    │   ├─ contactos
    │   ├─ objetivos
    │   └─ interacciones
    │
    └─→ [APIs Backend] → Vercel Functions
        ├─ /api/motor-decision-core
        ├─ /api/motor-decision-lever-plan
        └─ /api/motor-decision-message
            ↓
        Supabase DB (via Service Role)
            ↓
        [Análisis + IA]
            ↓
        Response → Frontend
```

### **Principios Arquitectura**

1. **Defense in Depth:** RLS + API validation + rate limiting
2. **Serverless First:** No servers, solo functions
3. **Database First:** Lógica compleja en DB (triggers, functions)
4. **Progressive Enhancement:** Sistema funciona sin JS complejo

---

## 📁 ESTRUCTURA DE ARCHIVOS {#estructura-archivos}

```
sales-coach-ai/
│
├── api/                                 # Vercel Serverless Functions
│   ├── motor-decision-core.js          # ❌ 500 ERROR (bug actual)
│   ├── motor-decision-lever-plan.js    # ❓ no testeado
│   ├── motor-decision-message.js       # ❓ no testeado
│   ├── chat.js                          # ⏳ pendiente
│   └── analyze-context.js               # ⏳ pendiente
│
├── css/
│   └── styles.css                       # Estilos globales
│
├── js/
│   ├── supabase-client.js              # ✅ Cliente Supabase
│   └── wizard.js                        # ✅ Onboarding wizard
│
├── auth.html                            # ✅ Login/Signup
├── index.html                           # ✅ Landing/Redirect
├── dashboard.html                       # ✅ Dashboard principal (con bug en Coach tab)
├── wizard.html                          # ✅ Wizard onboarding
│
├── package.json                         # Dependencies
├── vercel.json                          # Vercel config
├── .gitignore                          
├── .env.local                           # ⚠️ NO commitear (variables locales)
└── README.md
```

### **Archivos Clave - Descripción**

#### **api/motor-decision-core.js** ❌ BUG AQUÍ

**Qué debe hacer:**
```javascript
1. Recibir POST request con { userId }
2. Autenticar usuario
3. Cargar perfil completo:
   - user_profiles
   - user_what_works
   - user_emotional_state
   - user_current_context
   - objetivos
   - contactos
   - interacciones
4. Analizar situación (emotional, progress, pipeline, momentum)
5. Identificar palanca crítica
6. Generar plan personalizado
7. Craft message adaptado a DISC
8. Return JSON con recomendación
```

**Qué está fallando:**
- Error 500 Internal Server Error
- Posibles causas:
  - Imports/exports mal configurados
  - Funciones helper no implementadas
  - Variables de entorno faltantes
  - Sintaxis error

**Dependencias:**
- Importa funciones de `motor-decision-lever-plan.js`
- Importa funciones de `motor-decision-message.js`
- Usa `@supabase/supabase-js`

---

#### **dashboard.html** ⚠️ FUNCIONA PARCIAL

**Qué funciona:**
- ✅ Auth check al cargar
- ✅ Stats cards cargan datos Supabase
- ✅ Tabs Overview/Coach/Leads
- ✅ Tab Overview muestra stats

**Qué NO funciona:**
- ❌ Tab "Tu Coach" llama API y recibe 500
- Línea exacta error: `dashboard.html:459`

**Código relevante (línea ~459):**
```javascript
async function loadCoachData() {
  try {
    document.getElementById('frase-dia').textContent = 'Analizando tu situación...';
    
    const response = await fetch('/api/motor-decision-core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });
    
    if (!response.ok) throw new Error('Error');  // ← AQUÍ FALLA (500)
    
    const data = await response.json();
    renderCoachData(data);
    
  } catch (error) {
    console.error('Error coach:', error);
    document.getElementById('frase-dia').textContent = 'Error cargando coach. Por favor refrescá.';
  }
}
```

**Fix necesario:**
- Agregar `Authorization` header con token Supabase
- O modificar API para no requerir auth header (menos seguro)

---

## 🗄️ BASE DE DATOS {#base-de-datos}

### **Schema Completo**

```sql
-- 18 TABLAS PRINCIPALES

-- CORE
1. user_profiles                    # Perfil usuario + DISC + energía
2. objetivos                        # Objetivos usuario (revenue, demos, etc)
3. contactos                        # Red completa (leads/clientes/partners)
4. interacciones                    # Historial interacciones con contactos

-- PRODUCTOS / ICPs
5. productos                        # Productos usuario vende
6. icps                            # ICPs usuario trabaja
7. canales_usuario                 # Canales prospección preferidos

-- MOTOR INTELIGENCIA
8. user_what_works                 # Patterns validados (qué funciona para usuario)
9. user_emotional_state            # Estado emocional tracking
10. user_current_context           # Snapshot situación actual
11. knowledge_base                 # Knowledge global (timing, canales, etc)
12. frases_motivacionales         # Frases motivación según situación
13. recursos_apoyo                # Recursos cuando usuario estancado
14. user_feedback                 # Feedback explícito usuario
15. decisiones_sistema            # Log decisiones motor IA (auditabilidad)

-- TRACKING
16. metrics_snapshots             # Snapshot métricas diarias
17. conversation_history          # Historial conversaciones IA
18. recomendaciones              # Recomendaciones generadas
```

### **Tablas Críticas para Motor**

#### **user_profiles**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  
  -- Identidad
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo_negocio TEXT NOT NULL,
  pais TEXT,
  idiomas TEXT[],
  
  -- DISC Profile
  disc_profile JSONB,
  -- Ejemplo: {"D": 75, "I": 40, "S": 30, "C": 70}
  
  -- ADN Comercial
  superpoder TEXT,
  kryptonita TEXT,
  como_aprende_mejor TEXT,
  recibe_feedback TEXT,
  
  -- Objetivos generales
  objetivo_revenue_mensual DECIMAL,
  horas_semana_ventas INT,
  
  -- Estado actual
  energia INT DEFAULT 7,
  momentum TEXT DEFAULT 'estable',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **user_current_context**
```sql
CREATE TABLE user_current_context (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  
  -- Objetivo mes actual
  objetivo_mes_progress JSONB,
  /*
  {
    "objetivo_id": "uuid",
    "tipo": "revenue_total",
    "valor_objetivo": 10000,
    "valor_actual": 4200,
    "porcentaje": 0.42,
    "proyeccion": 8500,
    "gap": 5800,
    "realista": false
  }
  */
  
  -- Timing
  dias_restantes INT,
  velocidad_actual DECIMAL,
  velocidad_necesaria DECIMAL,
  
  -- Pipeline
  leads_calientes INT DEFAULT 0,
  leads_tibios INT DEFAULT 0,
  leads_frios INT DEFAULT 0,
  demos_agendadas INT DEFAULT 0,
  propuestas_enviadas INT DEFAULT 0,
  propuestas_pendientes INT DEFAULT 0,
  
  -- Actividad
  ultimo_contacto_nuevo TIMESTAMP,
  ultimo_cierre TIMESTAMP,
  ultimo_rechazo TIMESTAMP,
  dias_sin_actividad INT DEFAULT 0,
  
  -- Momentum
  cierres_ultimos_30d INT DEFAULT 0,
  cierres_vs_mes_anterior DECIMAL,
  mejor_racha_mes INT DEFAULT 0,
  racha_actual INT DEFAULT 0,
  
  -- Desvíos detectados
  desvios JSONB,
  
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **user_what_works**
```sql
CREATE TABLE user_what_works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Pattern detectado
  pattern_type TEXT NOT NULL,
  -- timing / canal / speech / follow_up / content / approach
  
  pattern_description TEXT NOT NULL,
  -- "LinkedIn Martes 10am = 73% respuesta"
  
  -- Validación
  veces_validado INT DEFAULT 0,
  veces_funciono INT DEFAULT 0,
  tasa_exito DECIMAL DEFAULT 0.0,
  sample_size INT DEFAULT 0,
  
  -- Detalles
  mejor_horario TEXT,
  mejor_dia_semana TEXT,
  mejor_speech TEXT,
  mejor_formato TEXT,
  
  -- Por qué funciona
  por_que_funciona TEXT,
  
  -- Estado
  nivel_confianza DECIMAL DEFAULT 0.0,
  estado TEXT DEFAULT 'validando',
  -- validando / confirmado / refutado
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Funciones Helper DB**

#### **update_user_context()**
```sql
CREATE OR REPLACE FUNCTION update_user_context(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_objetivo RECORD;
  v_dias_restantes INT;
  v_dias_mes INT;
BEGIN
  -- Obtener objetivo mes actual
  SELECT * INTO v_objetivo
  FROM objetivos
  WHERE user_id = p_user_id
    AND tipo = 'revenue_total'
    AND periodo = 'mes'
    AND estado = 'activo'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calcular días restantes mes
  v_dias_mes := DATE_PART('day', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day');
  v_dias_restantes := v_dias_mes - DATE_PART('day', CURRENT_DATE);
  
  -- Actualizar o crear contexto
  INSERT INTO user_current_context (
    user_id,
    objetivo_mes_progress,
    dias_restantes,
    velocidad_actual,
    velocidad_necesaria
  )
  VALUES (
    p_user_id,
    jsonb_build_object(
      'objetivo_id', v_objetivo.id,
      'tipo', v_objetivo.tipo,
      'valor_objetivo', v_objetivo.valor_objetivo,
      'valor_actual', v_objetivo.valor_actual,
      'porcentaje', COALESCE(v_objetivo.valor_actual / NULLIF(v_objetivo.valor_objetivo, 0), 0),
      'gap', v_objetivo.valor_objetivo - COALESCE(v_objetivo.valor_actual, 0)
    ),
    v_dias_restantes,
    CASE WHEN v_dias_restantes > 0 
         THEN COALESCE(v_objetivo.valor_actual, 0) / (DATE_PART('day', CURRENT_DATE)::DECIMAL)
         ELSE 0 
    END,
    CASE WHEN v_dias_restantes > 0 
         THEN (v_objetivo.valor_objetivo - COALESCE(v_objetivo.valor_actual, 0)) / v_dias_restantes::DECIMAL
         ELSE 0 
    END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    objetivo_mes_progress = EXCLUDED.objetivo_mes_progress,
    dias_restantes = EXCLUDED.dias_restantes,
    velocidad_actual = EXCLUDED.velocidad_actual,
    velocidad_necesaria = EXCLUDED.velocidad_necesaria,
    updated_at = NOW();
    
  -- Actualizar contadores pipeline
  UPDATE user_current_context SET
    leads_calientes = (SELECT COUNT(*) FROM contactos WHERE user_id = p_user_id AND temperatura > 70),
    leads_tibios = (SELECT COUNT(*) FROM contactos WHERE user_id = p_user_id AND temperatura BETWEEN 40 AND 70),
    leads_frios = (SELECT COUNT(*) FROM contactos WHERE user_id = p_user_id AND temperatura < 40)
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### **RLS Policies**

**Todas las tablas tienen RLS habilitado:**
```sql
-- Ejemplo: contactos
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own contacts"
  ON contactos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own contacts"
  ON contactos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own contacts"
  ON contactos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own contacts"
  ON contactos FOR DELETE
  USING (auth.uid() = user_id);
```

**IMPORTANTE:** RLS es la primera línea de defensa. Usuarios SOLO ven SUS datos.

---

## 🐛 BUG ACTUAL (CRÍTICO) {#bug-actual}

### **Descripción**

**API:** `/api/motor-decision-core`  
**Status:** 500 Internal Server Error  
**Impacto:** Tab "Tu Coach" no funciona  

### **Error Exacto**

```
Console error:
POST https://sales-coach-ai-xi.vercel.app/api/motor-decision-core 500 (Internal Server Error)
Error coach: Error
    at loadCoachData (dashboard.html:465:33)
```

### **Posibles Causas**

1. **Imports/Exports mal configurados**
   ```javascript
   // motor-decision-core.js intenta importar:
   import { identifyCriticalLever, generatePlan } from './motor-decision-lever-plan.js';
   import { craftMessage } from './motor-decision-message.js';
   
   // Pero tal vez exports no coinciden o paths incorrectos
   ```

2. **Funciones helper no implementadas**
   ```javascript
   // Estas funciones se llaman pero tal vez no existen:
   - loadDeepProfile()
   - loadWhatWorks()
   - loadEmotionalState()
   - analyzeSituation()
   - etc.
   ```

3. **Variables entorno faltantes**
   ```javascript
   // Vercel debe tener:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - OPENAI_API_KEY (si usa GPT-4)
   ```

4. **Auth header faltante**
   ```javascript
   // Frontend NO envía Authorization header
   // API espera validar auth
   ```

### **Cómo Verificar Causa Real**

**Ver logs Vercel:**
```bash
vercel logs --project=sales-coach-ai
```

O en dashboard: https://vercel.com/charlys-projects-362d3fa0/sales-coach-ai → Functions → motor-decision-core → Logs

**El log mostrará el error exacto** (stack trace completo).

---

## 🔧 PASOS PARA RESOLVER {#pasos-resolver}

### **PASO 1: Ver Logs Vercel**

```bash
# En terminal
vercel logs --project=sales-coach-ai

# O en browser
https://vercel.com/charlys-projects-362d3fa0/sales-coach-ai
→ Functions → motor-decision-core → View Logs
```

**Buscar:**
- Stack trace completo
- Línea exacta donde falla
- Error message específico

---

### **PASO 2: Verificar Variables Entorno**

```bash
# Vercel Dashboard
https://vercel.com/charlys-projects-362d3fa0/sales-coach-ai
→ Settings → Environment Variables

# Verificar que existen:
SUPABASE_URL=https://vrauyvcwmgqlbqrnkngx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (opcional)
OPENAI_API_KEY=sk-... (si usa GPT-4)
```

Si falta alguna, agregarla.

---

### **PASO 3: Revisar Imports/Exports**

**motor-decision-lever-plan.js debe exportar:**
```javascript
export function identifyCriticalLever(situation) {
  // ...
}

export async function generatePlan(data) {
  // ...
}
```

**motor-decision-message.js debe exportar:**
```javascript
export function craftMessage(data) {
  // ...
}

export function determineStyle(disc, emotionalState, momentum) {
  // ...
}
```

**motor-decision-core.js debe importar:**
```javascript
import { createClient } from '@supabase/supabase-js';
import { identifyCriticalLever, generatePlan } from './motor-decision-lever-plan.js';
import { craftMessage } from './motor-decision-message.js';
```

**IMPORTANTE:** En Vercel Functions, los imports relativos pueden ser tricky. Tal vez necesites usar paths absolutos o re-estructurar.

---

### **PASO 4: Implementar Funciones Helper Faltantes**

Si los logs muestran "function X is not defined", implementarlas:

```javascript
// En motor-decision-core.js

async function loadDeepProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

async function loadWhatWorks(userId) {
  const { data, error } = await supabase
    .from('user_what_works')
    .select('*')
    .eq('user_id', userId)
    .eq('estado', 'confirmado');
  
  if (error) throw error;
  return data || [];
}

// etc...
```

---

### **PASO 5: Simplificar para Testing**

Si hay muchos errores, crear versión simplificada que funcione:

```javascript
// motor-decision-core.js - VERSIÓN SIMPLE

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userId } = req.body;
    
    // Cargar solo lo básico
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Response simple
    res.status(200).json({
      situation: { test: true },
      critical_lever: { type: 'test' },
      plan: { mensaje_principal: `Hola ${profile.nombre}! Sistema funcionando.` },
      message: 'Test OK',
      confidence: 1.0
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Internal error',
      details: error.message 
    });
  }
}
```

Una vez funcione esta versión simple, agregar complejidad incremental.

---

### **PASO 6: Deploy y Test**

```bash
# Commit cambios
git add .
git commit -m "fix: motor decision API"
git push origin main

# Deploy
vercel --prod

# Test
# Ir a: https://sales-coach-ai-xi.vercel.app/dashboard.html
# Click tab "Tu Coach"
# Ver consola para errors
```

---

### **PASO 7: Agregar Auth Header (si necesario)**

Si la API requiere validar auth, actualizar frontend:

```javascript
// En dashboard.html, función loadCoachData()

async function loadCoachData() {
  try {
    // Obtener token Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No session');
    }
    
    const response = await fetch('/api/motor-decision-core', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}` // ← AGREGAR
      },
      body: JSON.stringify({ userId: currentUser.id })
    });
    
    // ...
  }
}
```

Y en la API validar:

```javascript
// motor-decision-core.js

const authHeader = req.headers.authorization;
if (!authHeader) {
  return res.status(401).json({ error: 'Unauthorized' });
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return res.status(401).json({ error: 'Invalid token' });
}

// Verificar que userId === user.id
if (req.body.userId !== user.id) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## ✅ TESTING CHECKLIST {#testing}

### **Pre-Deploy**

```
□ Variables entorno configuradas Vercel
□ Código sin errores sintaxis
□ Imports/exports correctos
□ Dependencies instaladas (package.json)
```

### **Post-Deploy**

```
□ API responde (no 404)
□ API no da 500 (ver logs)
□ Frontend recibe response
□ Dashboard Coach muestra datos
□ Sin errores consola browser
```

### **Testing Completo**

```
□ Login funciona
□ Dashboard carga
□ Stats correctos
□ Tab Overview OK
□ Tab Coach OK (frase + estado + plan)
□ Tab Leads OK (placeholder)
□ Logout funciona
```

---

## 🚀 DEPLOY PROCESS {#deploy}

### **Local Development**

```bash
# Instalar dependencies
npm install

# Variables entorno locales
# Crear .env.local con:
SUPABASE_URL=https://vrauyvcwmgqlbqrnkngx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
OPENAI_API_KEY=sk-...

# Correr local (si tienes Vercel CLI)
vercel dev

# O simplemente abrir archivos HTML en browser
# (las APIs no funcionarán local, solo en Vercel)
```

### **Deploy a Vercel**

```bash
# Opción 1: Git push (auto-deploy)
git add .
git commit -m "tu mensaje"
git push origin main
# Vercel detecta push y deploya automático

# Opción 2: Vercel CLI
vercel --prod

# Ver deploy
vercel ls
```

### **Ver Logs**

```bash
# Real-time logs
vercel logs --follow

# Últimos logs
vercel logs

# Logs específicos función
vercel logs --function=motor-decision-core
```

### **Rollback (si es necesario)**

```bash
# Ver deployments
vercel ls

# Rollback a deployment específico
vercel rollback <deployment-url>
```

---

## 📚 DOCUMENTOS DE REFERENCIA {#documentos-referencia}

### **Documentos Completos Generados**

1. **SALES_COACH_AI_DOCUMENTO_FUNCIONAL.md** (15K palabras)
   - Visión producto
   - Usuarios objetivo
   - Casos de uso
   - Funcionalidades core
   - Roadmap

2. **ARQUITECTURA_MOTOR_COMPLETO.md** (15K palabras)
   - Motor inteligencia 3 capas
   - Identificación palancas críticas
   - Generación planes personalizados
   - Tono personalizado DISC
   - Implementación técnica

3. **SUPABASE_SETUP.sql**
   - Schema completo DB
   - RLS policies
   - Triggers
   - Funciones helper
   - Índices

4. **SCHEMA_MOTOR_UPDATES.sql**
   - Tablas motor inteligencia
   - user_what_works
   - user_emotional_state
   - user_current_context
   - knowledge_base

5. **SECURITY_GUIDELINES.md**
   - RLS best practices
   - API security
   - Rate limiting
   - GDPR compliance
   - Secrets management

6. **MONETIZACION_CROSSELLING.md**
   - Modelo freemium
   - Crosselling inteligente
   - Integración DelegUp/BeAlfa/Builders
   - Proyección revenue

### **Código de Referencia**

**APIs Backend:**
- `/mnt/user-data/outputs/api-motor-decision-core.js`
- `/mnt/user-data/outputs/api-motor-decision-lever-plan.js`
- `/mnt/user-data/outputs/api-motor-decision-message.js`

**Frontend:**
- `/mnt/user-data/outputs/dashboard-updated.html`
- `/mnt/user-data/outputs/dashboard-coach.html`

**Versiones Alternativas:**
- `/mnt/user-data/outputs/motor-decision-core-simple.js` (versión simplificada funcional)
- `/mnt/user-data/outputs/motor-decision-core-secure.js` (versión con validación auth)

---

## 🎯 OBJETIVO INMEDIATO

**Hacer funcionar `/api/motor-decision-core` para que Tab "Tu Coach" muestre:**

```
Frase del día: "Motivación personalizada"

Tu momento:
- Energía: 7/10 ████████░░
- Motivación: 7/10 ████████░░
- Progreso mes: 3% ██░░░░░░░░

Situación detectada:
"Pipeline bajo. Necesitás más prospección."

Qué hacer AHORA:
• Contactar 5 inmobiliarias LinkedIn
• Follow-up propuestas pendientes
```

---

## 🆘 AYUDA ADICIONAL

### **Si te trabás:**

1. **Ver logs Vercel** (probablemente ahí está la respuesta)
2. **Simplificar código** (versión mínima que funcione)
3. **Test incremental** (agregar features de a poco)
4. **Usar versión simple** del archivo generado

### **Comandos Útiles**

```bash
# Ver estructura proyecto
tree -L 2 -I 'node_modules'

# Ver logs Vercel
vercel logs --follow

# Test API local (si Vercel dev funciona)
curl -X POST http://localhost:3000/api/motor-decision-core \
  -H "Content-Type: application/json" \
  -d '{"userId":"uuid-aqui"}'

# Re-deploy forzado
vercel --force

# Ver variables entorno
vercel env ls
```

### **Contactos Útiles**

- Supabase Dashboard: https://supabase.com/dashboard/project/vrauyvcwmgqlbqrnkngx
- Vercel Dashboard: https://vercel.com/charlys-projects-362d3fa0/sales-coach-ai
- Repo GitHub: https://github.com/cmaddalena/sales-coach-ai

---

## ✅ CHECKLIST FINAL

```
□ Logs Vercel revisados
□ Error específico identificado
□ Fix aplicado
□ Variables entorno verificadas
□ Imports/exports correctos
□ Deploy exitoso
□ API responde 200
□ Frontend muestra datos
□ Testing completo pasado
```

---

**FIN HANDOFF DOCUMENT**

🚀 **Suerte con el debugging!**

Si tenés dudas, los documentos de referencia tienen TODO el contexto necesario.
