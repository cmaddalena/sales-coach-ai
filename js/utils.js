const Utils = {
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  daysSince(date) {
    if (!date) return 999;
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
