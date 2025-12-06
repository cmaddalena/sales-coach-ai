const ExcelHandler = {
  generateFromWizard(wizard_data) {
    return {
      config: {
        user_id: Utils.generateId(),
        ...wizard_data,
        created_at: new Date().toISOString()
      },
      objetivos_semana: {
        contactos: 20,
        conversaciones: 10,
        demos: 3,
        propuestas: 2
      },
      metricas_semana: {
        contactos: 0,
        conversaciones: 0,
        demos: 0,
        propuestas: 0,
        cierres: 0,
        revenue: 0
      },
      personas: [],
      tracking: [],
      time_tracking: [],
      learnings: [],
      last_backup_date: new Date().toISOString(),
      cambios_desde_ultimo_backup: 0
    };
  },
  downloadExcel(excel_data) {
    const wb = XLSX.utils.book_new();
    const ws_config = XLSX.utils.json_to_sheet([{
      'user_id': excel_data.config.user_id,
      'Nombre': excel_data.config.nombre,
      'Negocio': excel_data.config.negocio,
      'ICP Principal': excel_data.config.icp_principal,
      'Revenue Actual': excel_data.config.revenue_actual,
      'Revenue Objetivo': excel_data.config.revenue_objetivo,
      'Tiempo/semana': excel_data.config.tiempo_disponible
    }]);
    XLSX.utils.book_append_sheet(wb, ws_config, 'Config');
    if (excel_data.personas && excel_data.personas.length > 0) {
      const ws_personas = XLSX.utils.json_to_sheet(excel_data.personas);
      XLSX.utils.book_append_sheet(wb, ws_personas, 'Personas');
    }
    if (excel_data.tracking && excel_data.tracking.length > 0) {
      const ws_tracking = XLSX.utils.json_to_sheet(excel_data.tracking);
      XLSX.utils.book_append_sheet(wb, ws_tracking, 'Tracking');
    }
    const ws_metricas = XLSX.utils.json_to_sheet([excel_data.metricas_semana]);
    XLSX.utils.book_append_sheet(wb, ws_metricas, 'Métricas');
    const filename = `SalesCoach_${excel_data.config.nombre}_${Utils.formatDate(new Date())}.xlsx`;
    XLSX.writeFile(wb, filename);
  },
  async restaurarFromExcel(file) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const config = XLSX.utils.sheet_to_json(workbook.Sheets['Config'])[0];
    const personas = XLSX.utils.sheet_to_json(workbook.Sheets['Personas'] || {});
    const tracking = XLSX.utils.sheet_to_json(workbook.Sheets['Tracking'] || {});
    return {
      config: config,
      personas: personas,
      tracking: tracking,
      metricas_semana: XLSX.utils.sheet_to_json(workbook.Sheets['Métricas'] || {})[0] || {},
      objetivos_semana: { contactos: 20, demos: 3, propuestas: 2 },
      time_tracking: [],
      learnings: [],
      last_backup_date: new Date().toISOString(),
      cambios_desde_ultimo_backup: 0
    };
  }
};
