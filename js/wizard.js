const Wizard = {
  current_step: 0,
  answers: {},
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
      message: 'Objetivo revenue 12 meses (USD)',
      placeholder: '15000'
    },
    {
      id: 'tiempo_disponible',
      type: 'number',
      message: 'Horas/semana disponibles para comercial',
      placeholder: '10'
    }
  ],
  start() {
    const container = document.getElementById('wizard-content');
    container.innerHTML = '<div id="wizard-messages"></div>';
    this.showQuestion();
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
  complete() {
    this.addMessage('bot', 'Perfecto! Generando tu sistema...');
    App.showLoading('Procesando...');
    setTimeout(() => {
      App.hideLoading();
      App.onWizardComplete(this.answers);
    }, 2000);
  }
};
