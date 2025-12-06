const App = {
  state: {
    user_id: null,
    wizard_completed: false,
    excel_data: null,
    conversation_history: [],
    cambios_desde_ultimo_backup: 0
  },
  init() {
    console.log('🚀 Sales Coach AI iniciando...');
    this.loadState();
    if (this.state.wizard_completed) {
      this.showChat();
    } else {
      this.showWizard();
    }
    setInterval(() => this.saveState(), 30000);
  },
  loadState() {
    const saved = localStorage.getItem('sales_coach_state');
    if (saved) {
      this.state = JSON.parse(saved);
    } else {
      this.state.user_id = Utils.generateId();
      this.saveState();
    }
  },
  saveState() {
    localStorage.setItem('sales_coach_state', JSON.stringify(this.state));
  },
  showWizard() {
    document.getElementById('wizard-container').classList.remove('hidden');
    document.getElementById('chat-container').classList.add('hidden');
  },
  showChat() {
    document.getElementById('wizard-container').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    Chat.init();
    this.updateStats();
    this.checkBackupNeeded();
  },
  onWizardComplete(wizard_data) {
    this.state.wizard_completed = true;
    this.state.excel_data = ExcelHandler.generateFromWizard(wizard_data);
    this.saveState();
    ExcelHandler.downloadExcel(this.state.excel_data);
    this.showChat();
    Chat.addMessage('bot', `
✅ Tu sistema está listo!

📥 Excel descargado con todo configurado.

Ahora vamos a trabajar juntos día a día.

¿Cómo viene hoy?
    `);
  },
  ofrecerRestaurar() {
    const html = `
      <div style="text-align: center; padding: 40px;">
        <h2>Restaurar desde Excel</h2>
        <p>Subí tu último Excel backup</p>
        <input type="file" id="excel-restore" accept=".xlsx" style="margin: 20px 0;" />
        <br/>
        <button class="btn-primary" onclick="App.restaurarExcel()">Restaurar</button>
        <button class="btn-secondary" onclick="location.reload()">Cancelar</button>
      </div>
    `;
    document.getElementById('wizard-content').innerHTML = html;
  },
  async restaurarExcel() {
    const file = document.getElementById('excel-restore').files[0];
    if (!file) return alert('Seleccioná un archivo Excel');
    this.showLoading('Restaurando...');
    try {
      const excel_data = await ExcelHandler.restaurarFromExcel(file);
      this.state.wizard_completed = true;
      this.state.excel_data = excel_data;
      this.state.conversation_history = [];
      this.saveState();
      this.hideLoading();
      this.showChat();
      Chat.addMessage('bot', `
✅ Sistema restaurado!

Recuperé tu configuración y data.

¿Seguimos trabajando?
      `);
    } catch (error) {
      this.hideLoading();
      alert('Error restaurando Excel: ' + error.message);
    }
  },
  updateStats() {
    if (!this.state.excel_data) return;
    const m = this.state.excel_data.metricas_semana || {};
    const o = this.state.excel_data.objetivos_semana || {};
    document.getElementById('stat-semana').textContent = 
      `${m.contactos || 0}/${o.contactos || 20}`;
    document.getElementById('stat-demos').textContent = 
      `${m.demos || 0}/${o.demos || 3}`;
    document.getElementById('stat-revenue').textContent = 
      `$${((m.revenue || 0) / 1000).toFixed(1)}K`;
  },
  checkBackupNeeded() {
    const cambios = this.state.cambios_desde_ultimo_backup || 0;
    const lastBackup = this.state.excel_data?.last_backup_date;
    const dias = lastBackup ? Utils.daysSince(lastBackup) : 999;
    if (dias >= 7 || cambios >= 50) {
      setTimeout(() => {
        Chat.addMessage('bot', `
💾 Recomiendo descargar backup actualizado.

${dias >= 7 ? `Hace ${dias} días sin backup.` : ''}
${cambios >= 50 ? `${cambios} cambios sin guardar.` : ''}

¿Descargamos ahora?
        `, [
          {
            text: 'Sí, descargar',
            primary: true,
            onClick: () => {
              ExcelHandler.downloadExcel(this.state.excel_data);
              this.state.excel_data.last_backup_date = new Date().toISOString();
              this.state.cambios_desde_ultimo_backup = 0;
              this.saveState();
              Chat.addMessage('bot', '✅ Backup descargado!');
            }
          },
          {
            text: 'Después',
            onClick: () => {}
          }
        ]);
      }, 3000);
    }
  },
  showLoading(msg = 'Procesando...') {
    document.getElementById('loading-text').textContent = msg;
    document.getElementById('loading').classList.remove('hidden');
  },
  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  }
};
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('user-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        Chat.send();
      }
    });
  }
});
