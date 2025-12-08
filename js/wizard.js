const Wizard = {
  current_step: 0,
  answers: {},
  user: null,
  
  questions: [
    {
      id: 'welcome',
      type: 'info',
      message: '👋 Hola! Soy tu Sales Coach AI.\n\nVoy a ayudarte a armar tu sistema comercial completo.\n\n15-20 minutos. ¿Arrancamos?',
      options: [{ text: 'Dale, empecemos', value: 'yes' }]
    },
    {
      id: 'nombre',
      type: 'text',
      message: '¿Cuál es tu nombre?',
      placeholder: 'Tu nombre'
    },
    {
      id: 'negocio',
      type: 'text',
      message: 'Genial {nombre}! ¿Qué vendés?',
      placeholder: 'Ej: Servicios automatización IA'
    },
    {
      id: 'icp_principal',
      type: 'text',
      message: '¿Quién es tu cliente ideal?',
      placeholder: 'Ej: Inmobiliarias CABA 20-50 agentes'
    },
    {
      id: 'revenue_actual',
      type: 'number',
      message: 'Revenue mensual actual (USD aprox)',
      placeholder: '3000'
    },
    {
      id: 'revenue_objetivo',
      type: 'number',
      message: 'Objetivo revenue mensual (USD)',
      placeholder: '15000'
    },
    {
      id: 'tiempo_disponible',
      type: 'number',
      message: 'Horas/semana disponibles para comercial',
      placeholder: '10'
    }
  ],
  
  async start() {
    // Get current user
    await this.loadUser();
    
    const container = document.getElementById('wizard-content');
    container.innerHTML = '<div id="wizard-messages"></div>';
    this.showQuestion();
  },
  
  async loadUser() {
    // Load Supabase
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@supabase/supabase-js@2.39.0/dist/umd/supabase.js';
    
    return new Promise((resolve) => {
      script.onload = async () => {
        const createClient = window.supabase.createClient;
        const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          window.location.href = '/auth.html';
          return;
        }
        
        this.user = user;
        this.supabase = supabase;
        resolve();
      };
      document.head.appendChild(script);
    });
  },
  
  showQuestion() {
    const q = this.questions[this.current_step];
    if (!q) {
      this.complete();
      return;
    }
    
    let msg = q.message;
    Object.keys(this.answers).forEach(k => {
      msg = msg.replace(`{${k}}`, this.answers[k]);
    });
    
    this.addMessage('bot', msg);
    this.showInput(q);
  },
  
  showInput(q) {
    const container = document.getElementById('wizard-messages');
    let html = '';
    
    if (q.type === 'info' || q.type === 'options') {
      html = q.options.map(opt => 
        `<button class="btn-primary" onclick="Wizard.answer('${opt.value}')">${opt.text}</button>`
      ).join('');
    } else {
      html = `
        <input 
          type="${q.type === 'number' ? 'number' : 'text'}" 
          id="wizard-input" 
          placeholder="${q.placeholder || ''}"
          onkeypress="if(event.key==='Enter') Wizard.submitText()"
        />
        <button class="btn-primary" onclick="Wizard.submitText()">Continuar</button>
      `;
    }
    
    const div = document.createElement('div');
    div.className = 'wizard-input-container';
    div.innerHTML = html;
    container.appendChild(div);
    
    setTimeout(() => {
      const input = document.getElementById('wizard-input');
      if (input) input.focus();
    }, 100);
  },
  
  addMessage(type, text) {
    const container = document.getElementById('wizard-messages');
    const div = document.createElement('div');
    div.className = `message message-${type}`;
    div.textContent = text;
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
  },
  
  submitText() {
    const input = document.getElementById('wizard-input');
    if (!input || !input.value.trim()) return;
    this.answer(input.value.trim());
  },
  
  answer(value) {
    const q = this.questions[this.current_step];
    this.answers[q.id] = value;
    
    if (q.type !== 'info') {
      this.addMessage('user', value);
    }
    
    const inputContainer = document.querySelector('.wizard-input-container');
    if (inputContainer) inputContainer.remove();
    
    this.current_step++;
    setTimeout(() => this.showQuestion(), 500);
  },
  
  async complete() {
    this.addMessage('bot', 'Perfecto! Guardando tu perfil...');
    App.showLoading('Procesando...');
    
    try {
      // Save to Supabase
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert({
          user_id: this.user.id,
          nombre: this.answers.nombre,
          tipo_negocio: this.answers.negocio,
          objetivo_revenue_mensual: parseInt(this.answers.revenue_objetivo),
          horas_semana_ventas: parseInt(this.answers.tiempo_disponible),
          // Otros campos con valores default
          pais: 'Argentina',
          idiomas: ['español']
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving profile:', error);
        this.addMessage('bot', '❌ Error guardando perfil. Intentá de nuevo.');
        App.hideLoading();
        return;
      }
      
      // También crear primer objetivo
      await this.supabase
        .from('objetivos')
        .insert({
          user_id: this.user.id,
          tipo: 'revenue_total',
          categoria: 'revenue',
          valor_objetivo: parseInt(this.answers.revenue_objetivo),
          valor_actual: parseInt(this.answers.revenue_actual),
          periodo: 'mes',
          estado: 'activo'
        });
      
      // Success!
      App.hideLoading();
      this.addMessage('bot', '✅ ¡Perfil creado! Cargando tu dashboard...');
      
      setTimeout(() => {
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
      }, 2000);
      
    } catch (err) {
      console.error('Error:', err);
      this.addMessage('bot', '❌ Error inesperado. Recargá la página.');
      App.hideLoading();
    }
  }
};
