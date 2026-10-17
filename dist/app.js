/**
 * ============================================================================
 * LÓGICA DE APLICACIÓN: AGENDA COMITÉ Y VOCALES · EMPRESARIAS SEVILLANAS
 * Autora / Arquitectura: Rocío Cano · SeviAI (https://seviai.es)
 *
 * POR QUÉ ESTA ARQUITECTURA:
 * 1. Fidelidad absoluta al Google Sheet `Agenda_Comite_Empresarias_Sevillanas_Base_N8N`:
 *    Respeta exactamente los nombres de columnas y validaciones de datos de las
 *    3 pestañas (`EVENTOS`, `RESPUESTAS`, `EQUIPO_AUTORIZADO`).
 * 2. Sincronización híbrida (n8n Webhooks + Respaldo Local):
 *    Se conecta a los 3 endpoints del workflow de n8n (`agenda-comite-datos`,
 *    `agenda-comite-evento`, `agenda-comite-asistencia`). Si en algún momento hay
 *    un corte de red o el Google Sheet está vacío, mantiene copia local para que
 *    ninguna vocal o miembro del comité pierda una confirmación.
 * 3. Confirmación multi-persona:
 *    Permite que una integrante se apunte a sí misma en 1 clic o marque a varias
 *    compañeras a la vez (ej. cuando acuerdan en reunión ir 3 en representación).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. EQUIPO AUTORIZADO BASE (Espejo exacto de la pestaña EQUIPO_AUTORIZADO)
// Por qué lo incluimos como base: garantiza que desde el minuto 1 estén las 5
// integrantes del Comité Ejecutivo, las 6 Vocales y la plaza de Técnico aunque
// aún no se hayan verificado todos los correos personales en el Excel.
// ----------------------------------------------------------------------------
const DEFAULT_EQUIPO = [
  {
    id_integrante: 'EQ-001',
    nombre_apellidos: 'Mariló Caro Cals',
    cargo: 'Presidenta',
    email_acceso: 'presidencia@empresariassevillanas.es',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Presidenta de Empresarias Sevillanas'
  },
  {
    id_integrante: 'EQ-002',
    nombre_apellidos: 'Mercedes Núñez Arcos',
    cargo: 'Vicepresidenta primera de Instituciones',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Comité Ejecutivo'
  },
  {
    id_integrante: 'EQ-003',
    nombre_apellidos: 'Rocío Cano Fernández-Piedra',
    cargo: 'Vicepresidenta segunda de Comunicaciones',
    email_acceso: 'vicepresidentacomunicacion@empresariassevillanas.es',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Comité Ejecutivo'
  },
  {
    id_integrante: 'EQ-004',
    nombre_apellidos: 'Macarena Pérez Ocaña',
    cargo: 'Secretaria General',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Comité Ejecutivo'
  },
  {
    id_integrante: 'EQ-005',
    nombre_apellidos: 'Victoria Luna Ortiz',
    cargo: 'Tesorera',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Comité Ejecutivo'
  },
  {
    id_integrante: 'EQ-006',
    nombre_apellidos: 'Mónica Durán',
    cargo: 'Vocal',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Junta Directiva'
  },
  {
    id_integrante: 'EQ-007',
    nombre_apellidos: 'Marisa Hervás',
    cargo: 'Vocal',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Junta Directiva'
  },
  {
    id_integrante: 'EQ-008',
    nombre_apellidos: 'Yolanda Hervás',
    cargo: 'Vocal',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Junta Directiva'
  },
  {
    id_integrante: 'EQ-009',
    nombre_apellidos: 'Encarna Moreno',
    cargo: 'Vocal',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Junta Directiva'
  },
  {
    id_integrante: 'EQ-010',
    nombre_apellidos: 'Patricia Muñoz',
    cargo: 'Vocal',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Junta Directiva'
  },
  {
    id_integrante: 'EQ-011',
    nombre_apellidos: 'María José Rodríguez',
    cargo: 'Vocal',
    email_acceso: '',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Junta Directiva'
  },
  {
    id_integrante: 'EQ-012',
    nombre_apellidos: 'Técnico de la Asociación',
    cargo: 'Técnico Gestión / Secretaría Técnica',
    email_acceso: 'info@empresariassevillanas.es',
    puede_crear_eventos: 'Si',
    puede_responder: 'Si',
    estado_acceso: 'Habilitado',
    observaciones: 'Perfil técnico de apoyo administrativo para carga de eventos'
  }
];

// ----------------------------------------------------------------------------
// 2. EVENTOS INICIALES VACÍOS (Agenda 100% limpia)
// Por qué: empieza sin eventos de prueba para que muestre únicamente las
// convocatorias reales cargadas desde el Google Sheet o creadas por la Junta.
// ----------------------------------------------------------------------------
const INITIAL_SAMPLE_EVENTS = [];

// ----------------------------------------------------------------------------
// 3. ESTADO GLOBAL DE LA APLICACIÓN
// ----------------------------------------------------------------------------
const STORAGE_KEYS = {
  CONFIG: 'es_agenda_config_v2',
  SESSION: 'es_agenda_session_v2',
  CACHE_EVENTOS: 'es_agenda_eventos_v2',
  CACHE_RESPUESTAS: 'es_agenda_respuestas_v2',
  CACHE_EQUIPO: 'es_agenda_equipo_v2'
};

const state = {
  config: {
    // URL del servidor n8n de Rocío donde hemos creado el workflow "Agenda Comité - Empresarias Sevillanas"
    webhookBaseUrl: 'https://n8n-n8n.npfusf.easypanel.host/webhook',
    pin: '2026'
  },
  activeMemberId: 'EQ-003', // Por defecto Rocío Cano hasta que elija en el login
  authenticated: false,
  isOnlineSync: false,
  currentView: 'both', // 'both' | 'list' | 'calendar' | 'team'
  calendarMonth: new Date(2026, 10, 1), // Se actualiza al mes actual al cargar
  selectedDayFilter: null, // 'YYYY-MM-DD' si se pulsa un día concreto del calendario
  filters: {
    search: '',
    type: 'all',
    coverage: 'all',
    memberId: 'all'
  },
  equipo: [...DEFAULT_EQUIPO],
  eventos: [],
  respuestas: []
};

// ----------------------------------------------------------------------------
// 4. INICIALIZACIÓN AL CARGAR EL DOM
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();

  // Ajustar el mes inicial del calendario al mes actual real (Octubre 2026)
  const today = new Date();
  state.calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  populateMemberSelectors();
  setupEventListeners();
  checkAuthGate();

  // Sincronizamos datos con n8n / Google Sheets en segundo plano al arrancar
  await syncFromN8n(false);
  renderAll();
});

/**
 * Carga configuración, sesión y caché local desde localStorage.
 * Por qué: evita que la usuaria tenga que introducir el PIN cada vez que entra
 * desde un enlace del grupo de WhatsApp y ofrece carga instantánea.
 */
function loadLocalState() {
  try {
    // Limpiar evento de ejemplo de la versión v1 si existía en el navegador
    localStorage.removeItem('es_agenda_eventos_v1');
    localStorage.removeItem('es_agenda_respuestas_v1');

    const savedCfg = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (savedCfg) {
      const parsed = JSON.parse(savedCfg);
      if (parsed.webhookBaseUrl) state.config.webhookBaseUrl = parsed.webhookBaseUrl.replace(/\/+$/, '');
      if (parsed.pin) state.config.pin = String(parsed.pin);
    }

    const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION) || localStorage.getItem('es_agenda_session_v1');
    if (savedSession) {
      const sess = JSON.parse(savedSession);
      if (sess.authenticated && sess.activeMemberId) {
        state.authenticated = true;
        state.activeMemberId = sess.activeMemberId;
      }
    }

    const cachedEventos = localStorage.getItem(STORAGE_KEYS.CACHE_EVENTOS);
    if (cachedEventos) {
      state.eventos = JSON.parse(cachedEventos);
    } else {
      state.eventos = [];
    }

    const cachedRespuestas = localStorage.getItem(STORAGE_KEYS.CACHE_RESPUESTAS);
    if (cachedRespuestas) {
      state.respuestas = JSON.parse(cachedRespuestas);
    }

    const cachedEquipo = localStorage.getItem(STORAGE_KEYS.CACHE_EQUIPO);
    if (cachedEquipo) {
      const parsedEq = JSON.parse(cachedEquipo);
      if (Array.isArray(parsedEq) && parsedEq.length > 0) {
        state.equipo = mergeEquipoWithDefaults(parsedEq);
      }
    }
  } catch (err) {
    console.warn('Error leyendo caché local:', err);
    state.eventos = [...INITIAL_SAMPLE_EVENTS];
  }
}

/**
 * Guarda en localStorage la copia actualizada de eventos, respuestas y equipo.
 */
function saveCacheToLocal() {
  try {
    localStorage.setItem(STORAGE_KEYS.CACHE_EVENTOS, JSON.stringify(state.eventos));
    localStorage.setItem(STORAGE_KEYS.CACHE_RESPUESTAS, JSON.stringify(state.respuestas));
    localStorage.setItem(STORAGE_KEYS.CACHE_EQUIPO, JSON.stringify(state.equipo));
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e);
  }
}

/**
 * Combina las integrantes leídas de EQUIPO_AUTORIZADO en Google Sheets con la
 * lista base (asegurando que no se pierdan nombres si hay problemas de codificación
 * y que siempre esté disponible el perfil de Técnico EQ-012).
 */
function mergeEquipoWithDefaults(sheetEquipo) {
  const map = new Map();
  DEFAULT_EQUIPO.forEach(item => map.set(item.id_integrante, { ...item }));
  sheetEquipo.forEach(row => {
    if (!row || !row.id_integrante) return;
    const id = String(row.id_integrante).trim();
    const existing = map.get(id) || {};
    // Si el nombre del Excel viene con caracteres rotos (), preservamos el nombre limpio
    const cleanName = (row.nombre_apellidos && !String(row.nombre_apellidos).includes('\uFFFD'))
      ? String(row.nombre_apellidos).trim()
      : (existing.nombre_apellidos || String(row.nombre_apellidos || '').trim());
    map.set(id, {
      ...existing,
      ...row,
      id_integrante: id,
      nombre_apellidos: cleanName
    });
  });
  return Array.from(map.values());
}

// ----------------------------------------------------------------------------
// 5. SINCRONIZACIÓN CON N8N Y GOOGLE SHEETS
// ----------------------------------------------------------------------------

/**
 * Actualiza el indicador visual de estado de conexión en la barra superior.
 */
function updateSyncIndicator(online, customText) {
  state.isOnlineSync = online;
  const dot = document.getElementById('sync-status-dot');
  const txt = document.getElementById('sync-status-text');
  if (!dot || !txt) return;

  dot.className = 'sync-dot ' + (online ? 'online' : 'local');
  txt.textContent = customText || (online ? 'Sincronizado con Google Sheets' : 'Modo local (pendiente activar Sheet en n8n)');
}

/**
 * Consulta el endpoint GET `/agenda-comite-datos` en n8n para traer las filas
 * de `EVENTOS`, `RESPUESTAS` y `EQUIPO_AUTORIZADO`.
 */
async function syncFromN8n(showFeedback = true) {
  const url = `${state.config.webhookBaseUrl}/agenda-comite-datos`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.ok) {
      if (Array.isArray(data.equipo) && data.equipo.length > 0) {
        state.equipo = mergeEquipoWithDefaults(data.equipo);
      }
      if (Array.isArray(data.eventos)) {
        state.eventos = data.eventos.map(normalizeEventoRow);
      }
      if (Array.isArray(data.respuestas)) {
        state.respuestas = data.respuestas.map(normalizeRespuestaRow);
      }
      saveCacheToLocal();
      populateMemberSelectors();
      updateSyncIndicator(true, 'Sincronizado con Google Sheets');
      if (showFeedback) showToast('Agenda sincronizada correctamente con Google Sheets.');
      renderAll();
      return true;
    }
    throw new Error('Respuesta sin formato esperado');
  } catch (err) {
    updateSyncIndicator(false, 'Modo respaldo activo (Configurar Sheet en n8n)');
    if (showFeedback) {
      showToast('Trabajando con copia local. En cuanto actives el workflow en n8n se sincronizará con Google Sheets.');
    }
    return false;
  }
}

/**
 * Normaliza una fila de la pestaña EVENTOS para garantizar fechas en formato YYYY-MM-DD.
 */
function normalizeEventoRow(row) {
  return {
    id_evento: String(row.id_evento || '').trim(),
    titulo: String(row.titulo || 'Evento sin título').trim(),
    organizador: String(row.organizador || '').trim(),
    tipo_evento: String(row.tipo_evento || 'Institucional').trim(),
    fecha_inicio: normalizeDateString(row.fecha_inicio),
    hora_inicio: normalizeTimeString(row.hora_inicio),
    fecha_fin: normalizeDateString(row.fecha_fin || row.fecha_inicio),
    hora_fin: normalizeTimeString(row.hora_fin),
    lugar: String(row.lugar || '').trim(),
    enlace_evento: String(row.enlace_evento || '').trim(),
    plazas_representacion: row.plazas_representacion !== undefined && row.plazas_representacion !== null ? String(row.plazas_representacion).trim() : '',
    estado: String(row.estado || 'Confirmado').trim(),
    creado_por: String(row.creado_por || '').trim(),
    fecha_registro: String(row.fecha_registro || '').trim(),
    observaciones: String(row.observaciones || '').trim()
  };
}

/**
 * Normaliza una fila de la pestaña RESPUESTAS.
 */
function normalizeRespuestaRow(row) {
  const idEv = String(row.id_evento || '').trim();
  const idInt = String(row.id_integrante || '').trim();
  return {
    id_respuesta: String(row.id_respuesta || `${idEv}_${idInt}`).trim(),
    id_evento: idEv,
    id_integrante: idInt,
    nombre_apellidos: String(row.nombre_apellidos || '').trim(),
    respuesta: String(row.respuesta || 'Voy').trim(),
    representante_confirmada: String(row.representante_confirmada || 'Si').trim(),
    fecha_respuesta: String(row.fecha_respuesta || '').trim(),
    observaciones: String(row.observaciones || '').trim()
  };
}

function normalizeDateString(val) {
  if (!val) return '';
  const str = String(val).trim();
  // Si viene DD/MM/YYYY lo pasamos a YYYY-MM-DD
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return str.slice(0, 10);
}

function normalizeTimeString(val) {
  if (!val) return '';
  const str = String(val).trim();
  const hm = str.match(/(\d{1,2}):(\d{2})/);
  if (hm) {
    return `${hm[1].padStart(2, '0')}:${hm[2]}`;
  }
  return str;
}

// ----------------------------------------------------------------------------
// 6. POBLADO DE SELECTORES Y GESTIÓN DE ACCESO (GATEWAY)
// ----------------------------------------------------------------------------
function populateMemberSelectors() {
  const loginSelect = document.getElementById('login-member-select');
  const filterMember = document.getElementById('filter-member');
  const creadoPorSelect = document.getElementById('ev-creado-por');

  if (loginSelect) {
    loginSelect.innerHTML = state.equipo.map(m =>
      `<option value="${escapeHtml(m.id_integrante)}" ${m.id_integrante === state.activeMemberId ? 'selected' : ''}>
        ${escapeHtml(m.nombre_apellidos)} — ${escapeHtml(m.cargo)}
      </option>`
    ).join('');
  }

  if (filterMember) {
    const currentVal = filterMember.value || 'all';
    filterMember.innerHTML = `<option value="all">Ver todas las integrantes</option>` +
      state.equipo.map(m =>
        `<option value="${escapeHtml(m.id_integrante)}">${escapeHtml(m.nombre_apellidos)} (${escapeHtml(m.cargo)})</option>`
      ).join('');
    filterMember.value = currentVal;
  }

  if (creadoPorSelect) {
    const activeMember = getActiveMember();
    creadoPorSelect.innerHTML = state.equipo.map(m =>
      `<option value="${escapeHtml(m.nombre_apellidos)}" ${activeMember && m.id_integrante === activeMember.id_integrante ? 'selected' : ''}>
        ${escapeHtml(m.nombre_apellidos)} (${escapeHtml(m.cargo)})
      </option>`
    ).join('');
  }

  updateActiveUserDisplay();
}

function getActiveMember() {
  return state.equipo.find(m => m.id_integrante === state.activeMemberId) || state.equipo[0];
}

function updateActiveUserDisplay() {
  const active = getActiveMember();
  const nameEl = document.getElementById('active-user-name');
  const footEl = document.getElementById('kpi-my-foot');
  if (nameEl && active) {
    nameEl.textContent = `${active.nombre_apellidos}`;
  }
  if (footEl && active) {
    footEl.textContent = `Confirmados por ${active.nombre_apellidos.split(' ')[0]}`;
  }
}

function checkAuthGate() {
  const gate = document.getElementById('auth-gate');
  if (!gate) return;
  if (state.authenticated) {
    gate.classList.add('hidden');
  } else {
    gate.classList.remove('hidden');
  }
}

// ----------------------------------------------------------------------------
// 7. RENDERIZADO GLOBAL (KPIs + CALENDARIO + LISTA DE EVENTOS + EQUIPO)
// ----------------------------------------------------------------------------
function renderAll() {
  updateActiveUserDisplay();
  renderKPIs();
  renderCalendar();
  renderEventsList();
  renderTeamTable();
}

/**
 * Devuelve las respuestas asociadas a un `id_evento`.
 */
function getResponsesForEvent(id_evento) {
  return state.respuestas.filter(r => r.id_evento === id_evento);
}

/**
 * Devuelve las representantes que han respondido "Voy" a un evento.
 */
function getGoingForEvent(id_evento) {
  return getResponsesForEvent(id_evento).filter(r => r.respuesta === 'Voy');
}

/**
 * Calcula y pinta los 4 indicadores ejecutivos superiores.
 */
function renderKPIs() {
  const activeEvents = state.eventos.filter(e => e.estado !== 'Cancelado');
  let unassignedCount = 0;
  let coveredCount = 0;
  let myCount = 0;

  activeEvents.forEach(ev => {
    const going = getGoingForEvent(ev.id_evento);
    if (going.length === 0) {
      unassignedCount++;
    } else {
      coveredCount++;
    }
    if (going.some(r => r.id_integrante === state.activeMemberId)) {
      myCount++;
    }
  });

  document.getElementById('kpi-total-events').textContent = activeEvents.length;
  document.getElementById('kpi-unassigned-events').textContent = unassignedCount;
  document.getElementById('kpi-covered-events').textContent = coveredCount;
  document.getElementById('kpi-my-events').textContent = myCount;
}

/**
 * Filtra y ordena los eventos según los controles activos y el día seleccionado.
 */
function getFilteredEvents() {
  const q = state.filters.search.toLowerCase().trim();

  return state.eventos
    .filter(ev => {
      // Filtro por día concreto pulsado en el calendario
      if (state.selectedDayFilter && ev.fecha_inicio !== state.selectedDayFilter) {
        return false;
      }

      // Filtro por tipo de evento
      if (state.filters.type !== 'all' && ev.tipo_evento !== state.filters.type) {
        return false;
      }

      const going = getGoingForEvent(ev.id_evento);

      // Filtro por cobertura de representación
      if (state.filters.coverage === 'unassigned' && (going.length > 0 || ev.estado === 'Cancelado')) {
        return false;
      }
      if (state.filters.coverage === 'covered' && going.length === 0) {
        return false;
      }
      if (state.filters.coverage === 'mine' && !going.some(r => r.id_integrante === state.activeMemberId)) {
        return false;
      }

      // Filtro por integrante específica
      if (state.filters.memberId !== 'all' && !going.some(r => r.id_integrante === state.filters.memberId)) {
        return false;
      }

      // Filtro de búsqueda textual (título, organizador, lugar, observaciones, asistentes)
      if (q) {
        const haystack = [
          ev.titulo,
          ev.organizador,
          ev.lugar,
          ev.tipo_evento,
          ev.observaciones,
          ...going.map(g => g.nombre_apellidos)
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const da = `${a.fecha_inicio || '9999-99-99'} ${a.hora_inicio || '00:00'}`;
      const db = `${b.fecha_inicio || '9999-99-99'} ${b.hora_inicio || '00:00'}`;
      return da.localeCompare(db);
    });
}

// ----------------------------------------------------------------------------
// 8. RENDERIZADO DEL CALENDARIO MENSUAL INTERACTIVO
// ----------------------------------------------------------------------------
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const label = document.getElementById('cal-month-label');
  const clearDayBtn = document.getElementById('cal-clear-day');
  if (!grid || !label) return;

  const year = state.calendarMonth.getFullYear();
  const month = state.calendarMonth.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  label.textContent = `${monthNames[month]} ${year}`;

  if (clearDayBtn) {
    clearDayBtn.classList.toggle('hidden', !state.selectedDayFilter);
  }

  // Primer día del mes (ajustado a Lunes = 0 ... Domingo = 6)
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const todayIso = new Date().toISOString().slice(0, 10);
  const cellsHtml = [];

  // Días de relleno del mes anterior
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    cellsHtml.push(`
      <div class="calendar-cell other-month">
        <div class="day-number-row"><span class="day-number">${d}</span></div>
      </div>
    `);
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = isoDate === todayIso;
    const isSelected = state.selectedDayFilter === isoDate;

    const dayEvents = state.eventos
      .filter(e => e.fecha_inicio === isoDate)
      .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));

    const pillsHtml = dayEvents.map(ev => {
      const going = getGoingForEvent(ev.id_evento);
      const pillClass = ev.estado === 'Cancelado'
        ? ''
        : (going.length > 0 ? 'covered' : 'unassigned');
      const timePrefix = ev.hora_inicio ? `${ev.hora_inicio} ` : '';
      return `
        <div
          class="cal-event-pill ${pillClass}"
          data-event-id="${escapeHtml(ev.id_evento)}"
          title="${escapeHtml(ev.titulo)} (${going.length} confirmadas)"
        >
          ${escapeHtml(timePrefix + ev.titulo)}
        </div>
      `;
    }).join('');

    cellsHtml.push(`
      <div class="calendar-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'selected-day' : ''}" data-iso-date="${isoDate}">
        <div class="day-number-row">
          <span class="day-number">${day}</span>
          ${dayEvents.length > 0 ? `<span style="font-size:0.68rem; color:#666666; font-weight:600;">${dayEvents.length} ev.</span>` : ''}
        </div>
        ${pillsHtml}
      </div>
    `);
  }

  // Relleno final para completar múltiplo de 7 celdas
  const totalCells = startDayOfWeek + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    cellsHtml.push(`
      <div class="calendar-cell other-month">
        <div class="day-number-row"><span class="day-number">${i}</span></div>
      </div>
    `);
  }

  grid.innerHTML = cellsHtml.join('');

  // Eventos de clic en las píldoras o en los días del calendario
  grid.querySelectorAll('.cal-event-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      const evId = pill.getAttribute('data-event-id');
      openRsvpModal(evId);
    });
  });

  grid.querySelectorAll('.calendar-cell[data-iso-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const iso = cell.getAttribute('data-iso-date');
      state.selectedDayFilter = (state.selectedDayFilter === iso) ? null : iso;
      renderCalendar();
      renderEventsList();
    });
  });
}

// ----------------------------------------------------------------------------
// 9. RENDERIZADO DE LA LISTA DETALLADA DE EVENTOS Y ASISTENCIA
// ----------------------------------------------------------------------------
function renderEventsList() {
  const container = document.getElementById('events-container');
  const countLabel = document.getElementById('events-count-label');
  if (!container) return;

  const filtered = getFilteredEvents();
  if (countLabel) countLabel.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background:#FFFFFF; border:1px solid #E5E5E5; border-radius:10px; padding:2.5rem 1.5rem; text-align:center;">
        <p style="font-family:'Montserrat',sans-serif; font-weight:700; font-size:1rem; color:#000000; margin:0 0 0.4rem;">
          No hay eventos que coincidan con el filtro seleccionado
        </p>
        <p style="font-size:0.86rem; color:#666666; margin:0 0 1rem;">
          Puedes limpiar los filtros o pulsar en "+ Nuevo Evento" para registrar una nueva convocatoria institucional.
        </p>
        <button type="button" class="btn btn-primary" onclick="openNewEventModal()">
          + Registrar Nuevo Evento
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(ev => buildEventCardHtml(ev)).join('');

  // Enlazar botones de cada tarjeta
  container.querySelectorAll('[data-action="open-rsvp"]').forEach(btn => {
    btn.addEventListener('click', () => openRsvpModal(btn.getAttribute('data-id')));
  });

  container.querySelectorAll('[data-action="quick-voy"]').forEach(btn => {
    btn.addEventListener('click', () => quickConfirmMe(btn.getAttribute('data-id'), 'Voy'));
  });

  container.querySelectorAll('[data-action="quick-nopuedo"]').forEach(btn => {
    btn.addEventListener('click', () => quickConfirmMe(btn.getAttribute('data-id'), 'No puedo'));
  });

  container.querySelectorAll('[data-action="edit-event"]').forEach(btn => {
    btn.addEventListener('click', () => openEditEventModal(btn.getAttribute('data-id')));
  });

  container.querySelectorAll('[data-action="share-whatsapp"]').forEach(btn => {
    btn.addEventListener('click', () => copyEventForWhatsApp(btn.getAttribute('data-id')));
  });
}

/**
 * Construye el HTML de una tarjeta de evento individual.
 */
function buildEventCardHtml(ev) {
  const dateParts = formatSpanishDateParts(ev.fecha_inicio);
  const responses = getResponsesForEvent(ev.id_evento);
  const going = responses.filter(r => r.respuesta === 'Voy');
  const notGoing = responses.filter(r => r.respuesta === 'No puedo');
  const pending = responses.filter(r => r.respuesta === 'Pendiente');

  const myResponse = responses.find(r => r.id_integrante === state.activeMemberId);
  const plazasMax = parseInt(ev.plazas_representacion, 10) || 0;
  const needsRep = ev.estado !== 'Cancelado' && going.length === 0;

  let repHeaderBadge = '';
  if (needsRep) {
    repHeaderBadge = `<span class="badge badge-status-Cancelado">⚠️ Sin representante aún</span>`;
  } else if (plazasMax > 0) {
    repHeaderBadge = `<span class="badge badge-status-Confirmado">✅ ${going.length} / ${plazasMax} plazas cubiertas</span>`;
  } else {
    repHeaderBadge = `<span class="badge badge-status-Confirmado">✅ ${going.length} representante(s)</span>`;
  }

  const goingChipsHtml = going.length > 0
    ? going.map(r => {
        const memberObj = state.equipo.find(m => m.id_integrante === r.id_integrante);
        const cargoStr = memberObj ? memberObj.cargo : '';
        return `
          <div class="attendee-chip going">
            <div>
              <strong>✅ ${escapeHtml(r.nombre_apellidos)}</strong>
              ${cargoStr ? `<span style="display:block; font-size:0.7rem; color:#666666;">${escapeHtml(cargoStr)}</span>` : ''}
              ${r.observaciones ? `<span style="display:block; font-size:0.72rem; color:#333333; font-style:italic;">"${escapeHtml(r.observaciones)}"</span>` : ''}
            </div>
            ${r.representante_confirmada === 'Si' ? `<span class="badge badge-status-Confirmado" style="font-size:0.65rem;">Oficial</span>` : ''}
          </div>
        `;
      }).join('')
    : `<div style="font-size:0.8rem; color:#b94817; background:#fdf3ec; border:1px dashed #f5b995; border-radius:6px; padding:0.55rem 0.7rem;">
         Nadie del Comité ni Vocales ha confirmado asistencia todavía.
       </div>`;

  const notGoingNames = notGoing.map(r => r.nombre_apellidos).join(', ');
  const pendingNames = pending.map(r => r.nombre_apellidos).join(', ');

  return `
    <article class="event-card ${needsRep ? 'needs-rep' : 'has-rep'}">
      <!-- Columna 1: Fecha visual -->
      <div class="event-date-badge">
        <span class="event-date-month">${escapeHtml(dateParts.monthShort)}</span>
        <span class="event-date-day">${escapeHtml(dateParts.day)}</span>
        <span class="event-date-weekday">${escapeHtml(dateParts.weekday)}</span>
      </div>

      <!-- Columna 2: Datos del evento -->
      <div>
        <div class="event-info-top">
          <span class="badge badge-type">${escapeHtml(ev.tipo_evento || 'Institucional')}</span>
          <span class="badge badge-status-${escapeHtml(ev.estado || 'Confirmado')}">${escapeHtml(ev.estado || 'Confirmado')}</span>
          ${plazasMax > 0 ? `<span class="badge" style="background:#f0ece5; color:#1d1b1a; border:1px solid rgba(29,27,26,0.2);">👥 Cupo recomendado: ${plazasMax} personas</span>` : ''}
        </div>

        <h3 class="event-title">${escapeHtml(ev.titulo)}</h3>
        ${ev.organizador ? `<div class="event-organizer">Organiza: ${escapeHtml(ev.organizador)}</div>` : ''}

        <div class="event-meta-list">
          <span class="event-meta-item">
            🕒 <strong>Horario:</strong> ${escapeHtml(ev.hora_inicio || 'Por confirmar')}${ev.hora_fin ? ' a ' + escapeHtml(ev.hora_fin) : ''}
          </span>
          <span class="event-meta-item">
            📍 <strong>Lugar:</strong> ${escapeHtml(ev.lugar || 'Pendiente de confirmar')}
          </span>
          ${ev.enlace_evento ? `
            <span class="event-meta-item">
              🔗 <a href="${escapeHtml(ev.enlace_evento)}" target="_blank" rel="noopener" style="color:#e66f2d; font-weight:600;">Ver convocatoria / enlace</a>
            </span>
          ` : ''}
        </div>

        ${ev.observaciones ? `<div class="event-notes"><strong>Notas:</strong> ${escapeHtml(ev.observaciones)}</div>` : ''}

        <div style="margin-top:0.75rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
          <span style="font-size:0.74rem; color:#6e6862;">
            ID: <code>${escapeHtml(ev.id_evento)}</code> ${ev.creado_por ? `· Registrado por ${escapeHtml(ev.creado_por)}` : ''}
          </span>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-outline btn-sm" data-action="share-whatsapp" data-id="${escapeHtml(ev.id_evento)}" title="Copiar resumen listo para pegar en el WhatsApp del Comité">
              📲 Copiar para WhatsApp
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-action="edit-event" data-id="${escapeHtml(ev.id_evento)}">
              ✏️ Editar evento
            </button>
          </div>
        </div>
      </div>

      <!-- Columna 3: Representación y Confirmación de Asistencia -->
      <div class="event-attendance-box">
        <div class="rep-status-header">
          <span>Representación Junta Directiva</span>
          ${repHeaderBadge}
        </div>

        <div class="attendee-chips">
          ${goingChipsHtml}
        </div>

        ${notGoingNames ? `
          <div style="font-size:0.74rem; color:#6e6862;">
            <strong>No pueden asistir (${notGoing.length}):</strong> ${escapeHtml(notGoingNames)}
          </div>
        ` : ''}

        ${pendingNames ? `
          <div style="font-size:0.74rem; color:#92400E;">
            <strong>Pendientes (${pending.length}):</strong> ${escapeHtml(pendingNames)}
          </div>
        ` : ''}

        <!-- Botones de acción rápida en 1 clic + botón para apuntar a varias personas -->
        <div style="display:flex; gap:0.4rem; margin-top:0.2rem;">
          <button
            type="button"
            class="btn ${myResponse && myResponse.respuesta === 'Voy' ? 'btn-dark' : 'btn-primary'} btn-sm"
            style="flex:1;"
            data-action="quick-voy"
            data-id="${escapeHtml(ev.id_evento)}"
          >
            ${myResponse && myResponse.respuesta === 'Voy' ? '✓ Yo asisto' : '🙋‍♀️ Yo puedo ir'}
          </button>
          <button
            type="button"
            class="btn btn-outline btn-sm"
            style="flex:1;"
            data-action="quick-nopuedo"
            data-id="${escapeHtml(ev.id_evento)}"
          >
            ${myResponse && myResponse.respuesta === 'No puedo' ? '✗ No puedo (marcado)' : 'No puedo'}
          </button>
        </div>

        <button
          type="button"
          class="btn btn-outline btn-sm"
          style="width:100%;"
          data-action="open-rsvp"
          data-id="${escapeHtml(ev.id_evento)}"
        >
          👥 Apuntar / gestionar varias compañeras
        </button>
      </div>
    </article>
  `;
}

// ----------------------------------------------------------------------------
// 10. TABLA DE EQUIPO AUTORIZADO (PESTAÑA EQUIPO_AUTORIZADO)
// ----------------------------------------------------------------------------
function renderTeamTable() {
  const tbody = document.getElementById('team-table-body');
  if (!tbody) return;

  tbody.innerHTML = state.equipo.map(m => {
    const confirmedCount = state.respuestas.filter(
      r => r.id_integrante === m.id_integrante && r.respuesta === 'Voy'
    ).length;

    return `
      <tr style="border-bottom: 1px solid rgba(29,27,26,0.12);">
        <td style="padding: 0.65rem; font-family: monospace; font-weight:600;">${escapeHtml(m.id_integrante)}</td>
        <td style="padding: 0.65rem; font-weight: 600; color:#1d1b1a;">${escapeHtml(m.nombre_apellidos)}</td>
        <td style="padding: 0.65rem; color:#2c2927;">${escapeHtml(m.cargo)}</td>
        <td style="padding: 0.65rem;"><span class="badge badge-status-Confirmado">${escapeHtml(m.puede_crear_eventos || 'Si')}</span></td>
        <td style="padding: 0.65rem;"><span class="badge badge-status-Confirmado">${escapeHtml(m.puede_responder || 'Si')}</span></td>
        <td style="padding: 0.65rem; font-weight:700;">${confirmedCount} evento(s)</td>
      </tr>
    `;
  }).join('');
}

// ----------------------------------------------------------------------------
// 11. CONFIRMACIÓN RÁPIDA Y CONFIRMACIÓN MÚLTIPLE (PESTAÑA RESPUESTAS)
// ----------------------------------------------------------------------------

/**
 * Permite a la usuaria activa confirmar "Voy" o "No puedo" en un solo clic
 * sin ni siquiera abrir el modal si solo quiere responder por sí misma.
 */
async function quickConfirmMe(id_evento, respuestaStatus) {
  const me = getActiveMember();
  if (!me) return;

  const payloadItem = {
    id_respuesta: `${id_evento}_${me.id_integrante}`,
    id_evento,
    id_integrante: me.id_integrante,
    nombre_apellidos: me.nombre_apellidos,
    respuesta: respuestaStatus,
    representante_confirmada: respuestaStatus === 'Voy' ? 'Si' : 'No',
    fecha_respuesta: new Date().toISOString().replace('T', ' ').substring(0, 19),
    observaciones: ''
  };

  await saveRespuestasBatch(id_evento, [payloadItem]);
}

/**
 * Abre el modal para confirmar asistencia de 1 o varias compañeras a la vez
 * (con desplegable / checklist buscable).
 */
function openRsvpModal(id_evento) {
  const ev = state.eventos.find(e => e.id_evento === id_evento);
  if (!ev) return;

  document.getElementById('rsvp-event-id').value = ev.id_evento;
  document.getElementById('rsvp-event-subtitle').textContent = `${ev.titulo} · ${formatSpanishDateParts(ev.fecha_inicio).fullDate} (${ev.hora_inicio || ''})`;
  document.getElementById('rsvp-member-search').value = '';
  document.getElementById('rsvp-status').value = 'Voy';
  document.getElementById('rsvp-rep-confirmada').value = 'Si';
  document.getElementById('rsvp-observaciones').value = '';

  renderRsvpChecklist(ev.id_evento, [state.activeMemberId], '');
  document.getElementById('modal-rsvp').classList.remove('hidden');
}

function renderRsvpChecklist(id_evento, selectedIds, searchFilter = '') {
  const container = document.getElementById('rsvp-members-checklist');
  if (!container) return;

  const q = searchFilter.toLowerCase().trim();
  const existingResponses = getResponsesForEvent(id_evento);

  container.innerHTML = state.equipo
    .filter(m => {
      if (!q) return true;
      return `${m.nombre_apellidos} ${m.cargo}`.toLowerCase().includes(q);
    })
    .map(m => {
      const isChecked = selectedIds.includes(m.id_integrante);
      const prevResp = existingResponses.find(r => r.id_integrante === m.id_integrante);
      const statusBadge = prevResp
        ? `<span style="font-size:0.68rem; color:${prevResp.respuesta === 'Voy' ? '#065F46' : '#6e6862'}; font-weight:600;">(Actual: ${escapeHtml(prevResp.respuesta)})</span>`
        : '';

      return `
        <label class="member-check-item ${isChecked ? 'checked' : ''}" data-member-id="${escapeHtml(m.id_integrante)}">
          <input
            type="checkbox"
            name="rsvp-member"
            value="${escapeHtml(m.id_integrante)}"
            ${isChecked ? 'checked' : ''}
          />
          <div>
            <strong>${escapeHtml(m.nombre_apellidos)}</strong> ${statusBadge}
            <span class="member-role-tag">${escapeHtml(m.cargo)}</span>
          </div>
        </label>
      `;
    }).join('');

  container.querySelectorAll('input[name="rsvp-member"]').forEach(chk => {
    chk.addEventListener('change', () => {
      const label = chk.closest('.member-check-item');
      if (label) label.classList.toggle('checked', chk.checked);
    });
  });
}

function getSelectedRsvpMemberIds() {
  return Array.from(document.querySelectorAll('#rsvp-members-checklist input[name="rsvp-member"]:checked'))
    .map(el => el.value);
}

/**
 * Guarda un lote de confirmaciones (1 o varias integrantes) en el estado local
 * y las envía al webhook `POST /agenda-comite-asistencia` de n8n.
 */
async function saveRespuestasBatch(id_evento, items) {
  // 1. Actualización inmediata (optimista) en memoria y localStorage
  items.forEach(newItem => {
    const idx = state.respuestas.findIndex(
      r => r.id_respuesta === newItem.id_respuesta ||
           (r.id_evento === newItem.id_evento && r.id_integrante === newItem.id_integrante)
    );
    if (idx >= 0) {
      state.respuestas[idx] = { ...state.respuestas[idx], ...newItem };
    } else {
      state.respuestas.push(newItem);
    }
  });

  saveCacheToLocal();
  renderAll();

  // 2. Envío asíncrono al webhook de n8n para persistir en la pestaña RESPUESTAS
  try {
    const res = await fetch(`${state.config.webhookBaseUrl}/agenda-comite-asistencia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_evento,
        respuestas: items
      })
    });
    if (res.ok) {
      updateSyncIndicator(true, 'Sincronizado con Google Sheets');
      showToast(`Confirmación guardada en Google Sheets (${items.length} integrante${items.length > 1 ? 's' : ''}).`);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    updateSyncIndicator(false, 'Guardado localmente (pendiente Sheet en n8n)');
    showToast(`Confirmación registrada (${items.length} integrante${items.length > 1 ? 's' : ''}).`);
  }
}

// ----------------------------------------------------------------------------
// 12. CREACIÓN Y EDICIÓN DE EVENTOS (FORMULARIO DIRECTO SIN COSTE DE IA)
// ----------------------------------------------------------------------------
function openNewEventModal() {
  document.getElementById('modal-event-title').textContent = 'Registrar Nuevo Evento en Agenda';
  document.getElementById('ev-id').value = '';
  document.getElementById('ev-titulo').value = '';
  document.getElementById('ev-organizador').value = '';
  document.getElementById('ev-tipo').value = 'Institucional';
  document.getElementById('ev-fecha-inicio').value = state.selectedDayFilter || new Date().toISOString().slice(0, 10);
  document.getElementById('ev-hora-inicio').value = '';
  document.getElementById('ev-fecha-fin').value = '';
  document.getElementById('ev-hora-fin').value = '';
  document.getElementById('ev-lugar').value = '';
  document.getElementById('ev-plazas').value = '';
  document.getElementById('ev-estado').value = 'Confirmado';
  document.getElementById('ev-enlace').value = '';
  document.getElementById('ev-observaciones').value = '';

  const active = getActiveMember();
  if (active) {
    document.getElementById('ev-creado-por').value = active.nombre_apellidos;
  }

  document.getElementById('modal-event').classList.remove('hidden');
}

function openEditEventModal(id_evento) {
  const ev = state.eventos.find(e => e.id_evento === id_evento);
  if (!ev) return;

  document.getElementById('modal-event-title').textContent = 'Editar Evento de la Agenda';
  document.getElementById('ev-id').value = ev.id_evento;
  document.getElementById('ev-titulo').value = ev.titulo || '';
  document.getElementById('ev-organizador').value = ev.organizador || '';
  document.getElementById('ev-tipo').value = ev.tipo_evento || 'Institucional';
  document.getElementById('ev-fecha-inicio').value = ev.fecha_inicio || '';
  document.getElementById('ev-hora-inicio').value = ev.hora_inicio || '';
  document.getElementById('ev-fecha-fin').value = ev.fecha_fin || '';
  document.getElementById('ev-hora-fin').value = ev.hora_fin || '';
  document.getElementById('ev-lugar').value = ev.lugar || '';
  document.getElementById('ev-plazas').value = ev.plazas_representacion || '';
  document.getElementById('ev-estado').value = ev.estado || 'Confirmado';
  document.getElementById('ev-enlace').value = ev.enlace_evento || '';
  document.getElementById('ev-creado-por').value = ev.creado_por || '';
  document.getElementById('ev-observaciones').value = ev.observaciones || '';

  document.getElementById('modal-event').classList.remove('hidden');
}

// ----------------------------------------------------------------------------
// 13. UTILIDADES (FORMATO DE FECHA, WHATSAPP Y EXPORTACIÓN CSV)
// ----------------------------------------------------------------------------
function formatSpanishDateParts(isoDate) {
  if (!isoDate) {
    return { day: '--', monthShort: '---', weekday: '---', fullDate: 'Fecha pendiente' };
  }
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) {
    return { day: isoDate, monthShort: '', weekday: '', fullDate: isoDate };
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const monthsShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return {
    day: String(parts[2]).padStart(2, '0'),
    monthShort: monthsShort[d.getMonth()] || '',
    weekday: weekdays[d.getDay()] || '',
    fullDate: `${String(parts[2]).padStart(2, '0')}/${String(parts[1]).padStart(2, '0')}/${parts[0]}`
  };
}

/**
 * Genera y copia al portapapeles una ficha limpia del evento lista para pegar
 * en el grupo de WhatsApp del Comité cuando quieran avisar de una convocatoria.
 */
function copyEventForWhatsApp(id_evento) {
  const ev = state.eventos.find(e => e.id_evento === id_evento);
  if (!ev) return;

  const going = getGoingForEvent(ev.id_evento);
  const goingList = going.length > 0
    ? going.map(g => `✅ ${g.nombre_apellidos}`).join('\n')
    : '⚠️ Aún sin representante asignada';

  const dParts = formatSpanishDateParts(ev.fecha_inicio);
  const msg = [
    `📌 *CONVOCATORIA EMPRESARIAS SEVILLANAS*`,
    `*Evento:* ${ev.titulo}`,
    ev.organizador ? `*Organiza:* ${ev.organizador}` : null,
    `📅 *Fecha:* ${dParts.weekday} ${dParts.fullDate} · ${ev.hora_inicio || ''}${ev.hora_fin ? ' a ' + ev.hora_fin : ''}`,
    `📍 *Lugar:* ${ev.lugar || 'Por confirmar'}`,
    ev.plazas_representacion ? `👥 *Plazas representación:* ${ev.plazas_representacion}` : null,
    ``,
    `*Asistencia confirmada en Agenda:*`,
    goingList,
    ``,
    `👉 Confirma si puedes asistir en la Agenda del Comité: ${window.location.href}`
  ].filter(Boolean).join('\n');

  navigator.clipboard.writeText(msg).then(() => {
    showToast('Resumen copiado al portapapeles. Ya puedes pegarlo en WhatsApp.');
  }).catch(() => {
    showToast('No se pudo copiar automáticamente.');
  });
}

/**
 * Descarga un archivo CSV compatible con Excel.
 * - Si `onlyMine = false`: descarga todos los eventos de la agenda.
 * - Si `onlyMine = true`: descarga exclusivamente los eventos a los que la
 *   usuaria activa ha confirmado que asiste ("Voy").
 */
function exportAgendaToCsv(onlyMine = false) {
  const active = getActiveMember();
  const sourceEvents = onlyMine
    ? state.eventos.filter(ev =>
        getGoingForEvent(ev.id_evento).some(r => r.id_integrante === state.activeMemberId)
      )
    : state.eventos;

  if (onlyMine && sourceEvents.length === 0) {
    showToast('Aún no tienes eventos confirmados con "Voy" para exportar.');
    return;
  }

  const headers = [
    'id_evento', 'titulo', 'organizador', 'tipo_evento', 'fecha_inicio',
    'hora_inicio', 'fecha_fin', 'hora_fin', 'lugar', 'plazas_representacion',
    'estado', 'representantes_confirmadas', 'no_pueden', 'observaciones'
  ];

  const rows = sourceEvents.map(ev => {
    const resps = getResponsesForEvent(ev.id_evento);
    const going = resps.filter(r => r.respuesta === 'Voy').map(r => r.nombre_apellidos).join(' | ');
    const notGoing = resps.filter(r => r.respuesta === 'No puedo').map(r => r.nombre_apellidos).join(' | ');

    return [
      ev.id_evento, ev.titulo, ev.organizador, ev.tipo_evento, ev.fecha_inicio,
      ev.hora_inicio, ev.fecha_fin, ev.hora_fin, ev.lugar, ev.plazas_representacion,
      ev.estado, going, notGoing, ev.observaciones
    ].map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  const memberSlug = active
    ? active.nombre_apellidos.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
    : 'Integrante';
  a.download = onlyMine
    ? `Mis_Eventos_${memberSlug}_${dateStr}.csv`
    : `Agenda_Completa_Empresarias_Sevillanas_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------------------------------
// 14. EVENT LISTENERS DE LA INTERFAZ
// ----------------------------------------------------------------------------
function setupEventListeners() {
  // Login form (PIN + selección de integrante)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pinInput = document.getElementById('login-pin-input').value.trim();
      const memberSelect = document.getElementById('login-member-select').value;
      const errEl = document.getElementById('login-error');

      if (pinInput !== state.config.pin) {
        if (errEl) errEl.classList.remove('hidden');
        return;
      }

      if (errEl) errEl.classList.add('hidden');
      state.activeMemberId = memberSelect;
      state.authenticated = true;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
        authenticated: true,
        activeMemberId: state.activeMemberId
      }));
      checkAuthGate();
      populateMemberSelectors();
      renderAll();
      showToast(`Bienvenida, ${getActiveMember().nombre_apellidos}`);
    });
  }

  // Botón cambiar de integrante activa
  document.getElementById('btn-switch-user')?.addEventListener('click', () => {
    state.authenticated = false;
    checkAuthGate();
  });

  // Botón actualizar datos desde n8n
  document.getElementById('btn-refresh-data')?.addEventListener('click', () => {
    syncFromN8n(true);
  });

  // Botón "+ Nuevo Evento"
  document.getElementById('btn-new-event')?.addEventListener('click', () => {
    openNewEventModal();
  });

  // Cerrar / cancelar modal de evento
  document.getElementById('btn-close-event-modal')?.addEventListener('click', () => {
    document.getElementById('modal-event').classList.add('hidden');
  });
  document.getElementById('btn-cancel-event')?.addEventListener('click', () => {
    document.getElementById('modal-event').classList.add('hidden');
  });

  // Extractor de texto de invitación
  document.getElementById('btn-toggle-paste')?.addEventListener('click', () => {
    document.getElementById('paste-area-container')?.classList.toggle('hidden');
  });
  document.getElementById('btn-extract-text')?.addEventListener('click', () => {
    extractInvitationFromText();
  });

  // Guardar Evento (Formulario Nuevo / Editar Evento)
  document.getElementById('form-event')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const existingId = document.getElementById('ev-id').value.trim();
    const now = new Date();
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();

    const fechaInicio = document.getElementById('ev-fecha-inicio').value;
    const newEv = normalizeEventoRow({
      id_evento: existingId || `EVT-${stamp}-${rand}`,
      titulo: document.getElementById('ev-titulo').value,
      organizador: document.getElementById('ev-organizador').value,
      tipo_evento: document.getElementById('ev-tipo').value,
      fecha_inicio: fechaInicio,
      hora_inicio: document.getElementById('ev-hora-inicio').value,
      fecha_fin: document.getElementById('ev-fecha-fin').value || fechaInicio,
      hora_fin: document.getElementById('ev-hora-fin').value,
      lugar: document.getElementById('ev-lugar').value,
      plazas_representacion: document.getElementById('ev-plazas').value,
      estado: document.getElementById('ev-estado').value,
      enlace_evento: document.getElementById('ev-enlace').value,
      creado_por: document.getElementById('ev-creado-por').value,
      fecha_registro: now.toISOString().replace('T', ' ').substring(0, 19),
      observaciones: document.getElementById('ev-observaciones').value
    });

    // Actualizar en estado local inmediatamente
    const existingIdx = state.eventos.findIndex(item => item.id_evento === newEv.id_evento);
    if (existingIdx >= 0) {
      state.eventos[existingIdx] = newEv;
    } else {
      state.eventos.push(newEv);
    }

    // Posicionar el calendario en el mes del evento recién creado
    if (newEv.fecha_inicio) {
      const [y, m] = newEv.fecha_inicio.split('-').map(Number);
      if (y && m) state.calendarMonth = new Date(y, m - 1, 1);
    }

    saveCacheToLocal();
    document.getElementById('modal-event').classList.add('hidden');
    renderAll();

    // Enviar a n8n (pestaña EVENTOS)
    try {
      const res = await fetch(`${state.config.webhookBaseUrl}/agenda-comite-evento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEv)
      });
      if (res.ok) {
        updateSyncIndicator(true, 'Sincronizado con Google Sheets');
        showToast('Evento guardado en la Agenda y en Google Sheets.');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      updateSyncIndicator(false, 'Guardado localmente (pendiente Sheet en n8n)');
      showToast('Evento guardado en la Agenda.');
    }
  });

  // Modal de Confirmación de Asistencia (RSVP)
  document.getElementById('btn-close-rsvp-modal')?.addEventListener('click', () => {
    document.getElementById('modal-rsvp').classList.add('hidden');
  });
  document.getElementById('btn-cancel-rsvp')?.addEventListener('click', () => {
    document.getElementById('modal-rsvp').classList.add('hidden');
  });

  document.getElementById('rsvp-member-search')?.addEventListener('input', (e) => {
    const id_evento = document.getElementById('rsvp-event-id').value;
    const currentlyChecked = getSelectedRsvpMemberIds();
    renderRsvpChecklist(id_evento, currentlyChecked, e.target.value);
  });

  document.getElementById('btn-rsvp-only-me')?.addEventListener('click', () => {
    const id_evento = document.getElementById('rsvp-event-id').value;
    document.getElementById('rsvp-member-search').value = '';
    renderRsvpChecklist(id_evento, [state.activeMemberId], '');
  });

  document.getElementById('rsvp-status')?.addEventListener('change', (e) => {
    const repSelect = document.getElementById('rsvp-rep-confirmada');
    if (repSelect) {
      repSelect.value = e.target.value === 'Voy' ? 'Si' : 'No';
    }
  });

  document.getElementById('form-rsvp')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_evento = document.getElementById('rsvp-event-id').value;
    const selectedIds = getSelectedRsvpMemberIds();
    if (selectedIds.length === 0) {
      showToast('Selecciona al menos una integrante de la lista.');
      return;
    }

    const respuestaVal = document.getElementById('rsvp-status').value;
    const repConfirmadaVal = document.getElementById('rsvp-rep-confirmada').value;
    const obsVal = document.getElementById('rsvp-observaciones').value.trim();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const batch = selectedIds.map(memberId => {
      const member = state.equipo.find(m => m.id_integrante === memberId);
      return {
        id_respuesta: `${id_evento}_${memberId}`,
        id_evento,
        id_integrante: memberId,
        nombre_apellidos: member ? member.nombre_apellidos : memberId,
        respuesta: respuestaVal,
        representante_confirmada: repConfirmadaVal,
        fecha_respuesta: nowStr,
        observaciones: obsVal
      };
    });

    document.getElementById('modal-rsvp').classList.add('hidden');
    await saveRespuestasBatch(id_evento, batch);
  });

  // Navegación de meses en el calendario
  document.getElementById('cal-prev-month')?.addEventListener('click', () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('cal-next-month')?.addEventListener('click', () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  document.getElementById('cal-today')?.addEventListener('click', () => {
    const now = new Date();
    state.calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    state.selectedDayFilter = null;
    renderCalendar();
    renderEventsList();
  });
  document.getElementById('cal-clear-day')?.addEventListener('click', () => {
    state.selectedDayFilter = null;
    renderCalendar();
    renderEventsList();
  });

  // Pestañas de vista (Calendario + Agenda / Solo Lista / Solo Calendario / Equipo)
  document.querySelectorAll('.view-tabs .nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.view-tabs .nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const view = tab.getAttribute('data-view');
      state.currentView = view;

      const secCal = document.getElementById('section-calendar');
      const secList = document.getElementById('section-events-list');
      const secTeam = document.getElementById('section-team');

      secCal.classList.toggle('hidden', view === 'list' || view === 'team');
      secList.classList.toggle('hidden', view === 'calendar' || view === 'team');
      secTeam.classList.toggle('hidden', view !== 'team');
    });
  });

  // Filtros de búsqueda, tipo, cobertura e integrante
  document.getElementById('filter-search')?.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderEventsList();
  });
  document.getElementById('filter-type')?.addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    renderEventsList();
  });
  document.getElementById('filter-coverage')?.addEventListener('change', (e) => {
    state.filters.coverage = e.target.value;
    renderEventsList();
  });
  document.getElementById('filter-member')?.addEventListener('change', (e) => {
    state.filters.memberId = e.target.value;
    renderEventsList();
  });

  // Clic en las tarjetas KPI para filtrar rápidamente
  document.querySelectorAll('.kpi-card[data-kpi-filter]').forEach(card => {
    card.addEventListener('click', () => {
      const filterVal = card.getAttribute('data-kpi-filter');
      state.filters.coverage = filterVal;
      const covSelect = document.getElementById('filter-coverage');
      if (covSelect) covSelect.value = filterVal;
      renderEventsList();
    });
  });

  // Exportar CSV (Mis Eventos o Todos los Eventos)
  document.getElementById('btn-export-my-csv')?.addEventListener('click', () => exportAgendaToCsv(true));
  document.getElementById('btn-export-csv')?.addEventListener('click', () => exportAgendaToCsv(false));

  // Configuración n8n
  document.getElementById('btn-sync-settings')?.addEventListener('click', () => {
    document.getElementById('cfg-webhook-base').value = state.config.webhookBaseUrl;
    document.getElementById('cfg-pin').value = state.config.pin;
    document.getElementById('modal-settings').classList.remove('hidden');
  });
  document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => {
    document.getElementById('modal-settings').classList.add('hidden');
  });
  document.getElementById('btn-test-connection')?.addEventListener('click', async () => {
    state.config.webhookBaseUrl = document.getElementById('cfg-webhook-base').value.trim().replace(/\/+$/, '');
    await syncFromN8n(true);
  });
  document.getElementById('form-settings')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    state.config.webhookBaseUrl = document.getElementById('cfg-webhook-base').value.trim().replace(/\/+$/, '');
    state.config.pin = document.getElementById('cfg-pin').value.trim() || '2026';
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(state.config));
    document.getElementById('modal-settings').classList.add('hidden');
    await syncFromN8n(true);
  });
}

// ----------------------------------------------------------------------------
// 15. HELPERS DE SEGURIDAD Y NOTIFICACIONES
// ----------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 4200);
}
