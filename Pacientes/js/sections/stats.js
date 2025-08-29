
document.addEventListener('DOMContentLoaded', async function() {
  const seccion = document.getElementById('estadisticas-section');
  if (!seccion) return;

  // 1. Pacientes por tipo de acceso
  const pacientes = await ipcRenderer.invoke('get-pacientes-completos');
  let fistula = 0, cateter = 0, protesis = 0;
  pacientes.forEach(p => {
    const tipo = p.tipo_acceso?.nombre?.toLowerCase() || '';
    if (tipo.includes('fístula')) fistula++;
    else if (tipo.includes('catéter')) cateter++;
    else if (tipo.includes('prótesis')) protesis++;
  });
  window.renderStatsAcceso({ fistula, cateter, protesis });

  // 2. Evolución mensual de pacientes
  // Suponiendo que tienes fecha_alta y fecha_baja
  const meses = {};
  const bajas = {};
  pacientes.forEach(p => {
    if (p.fecha_alta) {
      const mes = p.fecha_alta.slice(0,7); // yyyy-mm
      meses[mes] = (meses[mes] || 0) + 1;
    }
    if (p.fecha_baja) {
      const mes = p.fecha_baja.slice(0,7);
      bajas[mes] = (bajas[mes] || 0) + 1;
    }
  });
  const labels = Array.from(new Set([...Object.keys(meses), ...Object.keys(bajas)])).sort();
  window.renderStatsEvolucion({
    labels,
    altas: labels.map(m => meses[m] || 0),
    bajas: labels.map(m => bajas[m] || 0)
  });

  // 3. Incidencias por tipo
  const incidencias = await ipcRenderer.invoke('get-incidencias-por-tipo');
  window.renderStatsIncidencias({
    labels: incidencias.map(i => i.tipo),
    counts: incidencias.map(i => i.cantidad)
  });
  // 4. Distribución por sexo y edad
  let hombre = 0, mujer = 0, otro = 0;
  const rangosEdad = ['0-18','19-40','41-65','66+'];
  const edadCounts = [0,0,0,0];
  pacientes.forEach(p => {
    if (p.sexo === 'hombre') hombre++;
  else if (p.sexo === 'mujer') mujer++;
  else otro++;
  // Edad
    if (p.fecha_nacimiento) {
      const edad = calcularEdad(p.fecha_nacimiento);
      if (edad <= 18) edadCounts[0]++;
  else if (edad <= 40) edadCounts[1]++;
  else if (edad <= 65) edadCounts[2]++;
  else edadCounts[3]++;
    }
  });
  window.renderStatsSexoEdad({ hombre, mujer, otro, rangosEdad, edadCounts });
  // 5. Ranking de profesionales

  function calcularEdad(fecha) {
    const f = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - f.getFullYear();
  if (hoy.getMonth() < f.getMonth() || (hoy.getMonth() === f.getMonth() && hoy.getDate() < f.getDate())) {
      edad--;
    }
    return edad;
  }
});
const { ipcRenderer } = require('electron');
// stats.js - Sección de Estadísticas avanzada
// Requiere Chart.js

document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('estadisticas-section')) return;

  // Gráfica 1: Pacientes por tipo de acceso
  window.renderStatsAcceso = function(data) {
    const ctx = document.getElementById('stats-chart-acceso').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Fístula', 'Catéter', 'Prótesis'],
        datasets: [{
          data: [data.fistula, data.cateter, data.protesis],
          backgroundColor: ['#34c759', '#14532d', '#009879'],
        }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Pacientes por tipo de acceso', font: { size: 16 } }
        }
      }
    });
  };

  // Gráfica 2: Evolución mensual de pacientes
  window.renderStatsEvolucion = function(data) {
    const ctx = document.getElementById('stats-chart-evolucion').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Altas',
          data: data.altas,
          borderColor: '#34c759',
          fill: false
        }, {
          label: 'Bajas',
          data: data.bajas,
          borderColor: '#ff3b30',
          fill: false
        }]
      },
      options: {
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Evolución mensual de pacientes', font: { size: 16 } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        }
      }
    });
  };

  // Gráfica 3: Incidencias por tipo
  window.renderStatsIncidencias = function(data) {
    const ctx = document.getElementById('stats-chart-incidencias').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Incidencias',
          data: data.counts,
          backgroundColor: '#ff9500',
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Incidencias por tipo', font: { size: 16 } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        }
      }
    });
  };

  // Gráfica 4: Distribución por sexo y edad
  window.renderStatsSexoEdad = function(data) {
    const ctx = document.getElementById('stats-chart-sexo-edad').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Hombre', 'Mujer', 'Otro'],
        datasets: [{
          data: [data.hombre, data.mujer, data.otro],
          backgroundColor: ['#007aff', '#ff2d55', '#a2845e'],
        }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Distribución por sexo', font: { size: 16 } }
        }
      }
    });
    // Edad (barras)
    const ctxEdad = document.getElementById('stats-chart-edad').getContext('2d');
    new Chart(ctxEdad, {
      type: 'bar',
      data: {
        labels: data.rangosEdad,
        datasets: [{
          label: 'Pacientes',
          data: data.edadCounts,
          backgroundColor: '#5ac8fa',
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Distribución por edad', font: { size: 16 } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        }
      }
    });
  };

  // Gráfica 5: Ranking de profesionales
  window.renderStatsProfesionales = function(data) {
    const ctx = document.getElementById('stats-chart-profesionales').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.nombres,
        datasets: [{
          label: 'Pacientes atendidos',
          data: data.counts,
          backgroundColor: '#af52de',
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Ranking de profesionales', font: { size: 16 } }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  };

  // Aquí puedes llamar a las funciones con datos reales
  // Ejemplo:
  // window.renderStatsAcceso({fistula: 20, cateter: 15, protesis: 5});
});
