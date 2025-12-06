const Chat = {
  init() {
    this.addMessage('bot', '👋 Buen día! ¿Cómo arrancamos hoy?');
  },
  addMessage(type, text, actions = null) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `message message-${type}`;
    div.textContent = text;
    if (actions) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.textContent = action.text;
        btn.className = action.primary ? 'primary' : '';
        btn.onclick = action.onClick;
        actionsDiv.appendChild(btn);
      });
      div.appendChild(actionsDiv);
    }
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
    App.state.conversation_history.push({
      role: type === 'user' ? 'user' : 'assistant',
      content: text
    });
    App.saveState();
  },
  async send() {
    const input = document.getElementById('user-input');
    const mensaje = input.value.trim();
    if (!mensaje) return;
    input.value = '';
    this.addMessage('user', mensaje);
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    App.showLoading('Pensando...');
    try {
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api'
        : '/api';
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: mensaje,
          contexto_usuario: {
            nombre: App.state.excel_data?.config?.nombre || 'Usuario',
            negocio: App.state.excel_data?.config?.negocio,
            icp_principal: App.state.excel_data?.config?.icp_principal,
            excel_data: App.state.excel_data
          },
          conversacion_historia: App.state.conversation_history.slice(-10)
        })
      });
      const data = await response.json();
      App.hideLoading();
      this.addMessage('bot', data.respuesta);
      if (data.structured_data?.action_detected) {
        App.state.metricas_semana = data.structured_data.metricas_actualizadas || App.state.metricas_semana;
        App.state.cambios_desde_ultimo_backup++;
        App.saveState();
        App.updateStats();
      }
    } catch (error) {
      App.hideLoading();
      this.addMessage('bot', '❌ Error conectando. Verificá tu conexión e intentá de nuevo.');
      console.error('Error:', error);
    }
    sendBtn.disabled = false;
    input.focus();
  }
};
