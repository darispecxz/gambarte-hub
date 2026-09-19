import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingComponent } from '../../shared/loading.component';
import { SearchSelectComponent, SearchOption } from '../../shared/search-select.component';
import { RrhhService } from './rrhh.service';
import {
  Dashboard, Empleado, EmpleadoDetalle, Contrato, ParametrosResponse,
  Planilla, PlanillaPreview, PlanillaLinea, Liquidacion,
  SimulacionLiquidacion, Capacitacion, SaldoVacaciones,
  AsistenciaResumen, ControlJornada, AsistenciaDetalle, AsistenciaDetalleResponse,
  VacacionResumen, Cronograma, RrhhTab, EmpleadoSubTab,
  PlantillaDocumento, DocumentoGenerado, DocumentoResultado,
  CsbpAlta, CsbpBaja, CsbpDashboard, CsbpResumenAnual,
  Gestora, ResumenContribuciones, EmpleadoSinGestora,
  Finiquito, FiniquitoCalculo,
  TributariaResult,
  Horario, AsignacionHorario,
  ParametroGestion, EscalaBono, EscalaVacaciones,
} from './rrhh.models';
import { MEMBRETE_GAMBARTE_BASE64 } from '../../shared/membrete-base64';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

interface RrhhTabMeta { label: string; icon: string; desc: string; }

const RRHH_TAB_META: Record<RrhhTab, RrhhTabMeta> = {
  dashboard:       { label: 'Dashboard',          icon: 'ti-layout-dashboard',  desc: 'Indicadores clave de personal, contratos y asistencia.' },
  empleados:       { label: 'Empleados',          icon: 'ti-users',             desc: 'Registro y gestión de empleados activos e inactivos.' },
  planillas:       { label: 'Planillas',          icon: 'ti-receipt',           desc: 'Generación y consulta de planillas de sueldos mensuales.' },
  asistencia:      { label: 'Asistencia',         icon: 'ti-clock',             desc: 'Control de jornada, marcaciones y resumen de asistencia.' },
  vacaciones:      { label: 'Vacaciones',         icon: 'ti-beach',             desc: 'Saldos de vacaciones, cronograma y solicitudes por empleado.' },
  liquidaciones:   { label: 'Liquidaciones',      icon: 'ti-file-invoice',      desc: 'Simulación y cálculo de liquidaciones por finalización de contrato.' },
  capacitaciones:  { label: 'Capacitaciones',     icon: 'ti-school',            desc: 'Registro de capacitaciones realizadas y programadas.' },
  documentos:      { label: 'Documentos',         icon: 'ti-file-text',         desc: 'Generación de documentos laborales desde plantillas.' },
  csbp:            { label: 'CSBP',               icon: 'ti-heartbeat',         desc: 'Gestión de altas, bajas y resumen anual de la Caja de Salud.' },
  gestoras:        { label: 'Gestoras AFP',       icon: 'ti-building-bank',     desc: 'Administración de aportes a gestoras AFP por empleado.' },
  finiquitos:      { label: 'Finiquitos',         icon: 'ti-file-off',          desc: 'Cálculo y registro de finiquitos por desvinculación.' },
  tributaria:      { label: 'P. Tributaria',      icon: 'ti-receipt-tax',       desc: 'Proyección tributaria RC-IVA y formularios fiscales.' },
  horarios:        { label: 'Horarios',           icon: 'ti-calendar-time',     desc: 'Definición de horarios laborales y asignación por empleado.' },
  parametros:      { label: 'Parámetros',         icon: 'ti-settings',          desc: 'Configuración de escalas, bonos y parámetros generales de RRHH.' },
};

@Component({
  selector: 'app-rrhh',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent, SearchSelectComponent],
  templateUrl: './rrhh.component.html',
  styleUrl: './rrhh.component.scss',
})
export class RrhhComponent implements OnInit {
  private svc = inject(RrhhService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tab: RrhhTab = 'dashboard';
  get rrhhTabMeta(): RrhhTabMeta { return RRHH_TAB_META[this.tab]; }
  loading = false;
  error = '';
  ejercicio = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  // Dashboard
  dash: Dashboard | null = null;

  // Catálogos
  catalogoCargos: {id: number; nombre: string}[] = [];
  catalogoAgencias: {id: number; nombre: string}[] = [];

  empleadoOpts: SearchOption[] = [];
  contratoOpts: SearchOption[] = [];
  cargoOpts: SearchOption[] = [];
  agenciaOpts: SearchOption[] = [];
  asistenciaEmpleadoOpts: SearchOption[] = [];
  horarioOpts: SearchOption[] = [];

  private buildEmpleadoOpts(): void {
    const fmt = (e: Empleado) => `${e.apellido_paterno} ${e.apellido_materno || ''} ${e.nombres} — ${e.cargo || 'Sin cargo'}`.trim();
    this.empleadoOpts = this.empleados.map(e => ({ id: e.id, label: fmt(e) }));
    this.contratoOpts = this.empleados.filter(e => e.id_contrato).map(e => ({ id: e.id_contrato!, label: fmt(e) }));
    this.buildAsistenciaOpts();
  }

  private buildAsistenciaOpts(): void {
    if (this.controlJornada) {
      this.asistenciaEmpleadoOpts = this.controlJornada.resumen.map((e: any) => ({ id: e.id_empleado, label: e.empleado }));
    } else {
      this.asistenciaEmpleadoOpts = this.empleadoOpts;
    }
  }

  private buildCargoOpts(): void {
    this.cargoOpts = this.catalogoCargos.map(c => ({ id: c.id, label: c.nombre }));
  }

  private buildAgenciaOpts(): void {
    this.agenciaOpts = this.catalogoAgencias.map(a => ({ id: a.id, label: a.nombre }));
  }

  private buildHorarioOpts(): void {
    this.horarioOpts = this.horarios.map(h => ({ id: h.id, label: `${h.nombre} — ${h.dia || h.dias} (${h.hora_inicio}-${h.hora_fin})` }));
  }

  // Empleados
  empleados: Empleado[] = [];
  estadoFiltro = 'A';
  busqueda = '';
  empleadoDetalle: EmpleadoDetalle | null = null;
  saldoVac: SaldoVacaciones | null = null;
  empSubTab: EmpleadoSubTab = 'personal';
  empAsistencia: AsistenciaDetalleResponse | null = null;

  // Alta / Baja
  altaFormOpen = false;
  bajaFormOpen = false;
  altaForm: Record<string, any> = {};
  bajaForm: Record<string, any> = {};

  // Planillas
  planillas: Planilla[] = [];
  planillaPreview: PlanillaPreview | null = null;

  // Vacaciones
  vacacionesData: VacacionResumen | null = null;
  vacBusqueda = '';
  cronograma: Cronograma | null = null;
  cronogramaVisible = false;
  vacFormOpen = false;
  vacForm = { id_empleado: 0, fecha_inicio: '', fecha_fin: '', tipo: 'VACACION', observaciones: '' };
  vacFormError = '';
  vacFormSuccess = '';
  vacProcessing = false;

  // Asistencia
  controlJornada: ControlJornada | null = null;
  asistenciaDetalleData: AsistenciaDetalleResponse | null = null;
  asistenciaDetalleEmpleado = '';
  asistenciaDetalleOpen = false;
  asistFormOpen = false;
  asistForm = { id_empleado: 0, fecha: '', am_ingreso: '08:00', am_salida: '12:30', pm_ingreso: '13:00', pm_salida: '18:00', extras: 0, atrasos: 0, tipo: 'NORMAL', observaciones: '' };
  asistFormError = '';
  asistFormSuccess = '';
  asistProcessing = false;

  // Liquidaciones
  liquidaciones: Liquidacion[] = [];
  simEmpleadoId = 0;
  simFecha = '';
  simMotivo = 'RENUNCIA';
  simulacion: SimulacionLiquidacion | null = null;

  // Capacitaciones
  capacitaciones: Capacitacion[] = [];

  // Documentos
  plantillas: PlantillaDocumento[] = [];
  documentosGenerados: DocumentoGenerado[] = [];
  docFormOpen = false;
  docPlantillaId = '';
  docParams: Record<string, any> = {};
  docPreview: DocumentoResultado | null = null;
  docProcessing = false;
  docError = '';
  docCategoriaFiltro = '';
  docPrintHtml = '';
  docPrintOpen = false;

  // CSBP
  csbpDash: CsbpDashboard | null = null;
  csbpAltas: CsbpAlta[] = [];
  csbpBajas: CsbpBaja[] = [];
  csbpResumen: CsbpResumenAnual | null = null;
  csbpSubTab: 'dashboard' | 'altas' | 'bajas' | 'aportes' = 'dashboard';

  // Gestoras AFP
  gestorasList: Gestora[] = [];
  gestoraResumen: ResumenContribuciones | null = null;
  gestoraSinGestora: EmpleadoSinGestora[] = [];
  gestoraSubTab: 'gestoras' | 'contribuciones' | 'sin-gestora' = 'gestoras';

  // Finiquitos
  finiquitos: Finiquito[] = [];
  finiquitoCalculo: FiniquitoCalculo | null = null;
  finiquitoEmpleadoId = 0;
  finiquitoFecha = '';
  finiquitoMotivo = 'VOLUNTARIO';

  // Planilla Tributaria
  tributariaData: TributariaResult | null = null;

  // Horarios
  horarios: Horario[] = [];
  horariosAsignaciones: AsignacionHorario[] = [];
  horariosSinHorario: EmpleadoSinGestora[] = [];
  horarioSubTab: 'horarios' | 'asignaciones' | 'sin-horario' = 'horarios';

  // Parámetros
  parametrosData: ParametrosResponse | null = null;
  paramFormOpen = false;
  paramForm: Record<string, any> = {};
  paramEditing: ParametroGestion | null = null;
  paramFormError = '';
  paramFormSuccess = '';

  // Contrato CRUD
  contratoFormOpen = false;
  contratoForm: Record<string, any> = {};
  contratoEditing: Contrato | null = null;
  contratoFormError = '';

  // Feriados
  feriadoFormOpen = false;
  feriadoForm: Record<string, any> = {};
  feriadoEditing: any = null;
  feriadoFormError = '';

  // Capacitacion CRUD
  capFormOpen = false;
  capForm: Record<string, any> = {};
  capEditing: Capacitacion | null = null;
  capFormError = '';

  // Evaluacion CRUD
  evalFormOpen = false;
  evalForm: Record<string, any> = {};
  evalEditing: any = null;
  evalFormError = '';

  // CSBP CRUD
  csbpAltaFormOpen = false;
  csbpAltaForm: Record<string, any> = {};
  csbpBajaFormOpen = false;
  csbpBajaForm: Record<string, any> = {};
  csbpAporteFormOpen = false;
  csbpAporteForm: Record<string, any> = {};
  csbpFormError = '';

  // Gestora CRUD
  gestoraFormOpen = false;
  gestoraForm: Record<string, any> = {};
  gestoraFormError = '';

  // Horario CRUD
  horarioFormOpen = false;
  horarioForm: Record<string, any> = {};
  horarioFormError = '';
  horarioAsignarFormOpen = false;
  horarioAsignarForm: Record<string, any> = {};

  // Planilla generar
  planillaGenerando = false;
  planillaGenMsg = '';

  // Finiquito guardar
  finiquitoGuardando = false;
  finiquitoGuardarMsg = '';

  ngOnInit(): void {
    this.svc.getCatalogoCargos().subscribe({ next: d => { this.catalogoCargos = d; this.buildCargoOpts(); }, error: () => {} });
    this.svc.getCatalogoAgencias().subscribe({ next: d => { this.catalogoAgencias = d; this.buildAgenciaOpts(); }, error: () => {} });
    this.svc.getEmpleados().subscribe({ next: d => { this.empleados = d; this.buildEmpleadoOpts(); }, error: () => {} });
    this.route.queryParams.subscribe(p => {
      if (p['tab']) this.tab = p['tab'] as RrhhTab;
      this.loadTab();
    });
  }

  setTab(t: RrhhTab): void {
    this.tab = t;
    this.router.navigate([], { queryParams: { tab: t }, queryParamsHandling: 'merge' });
    this.loadTab();
  }

  loadTab(): void {
    this.error = '';
    this.loading = true;

    switch (this.tab) {
      case 'dashboard':
        this.svc.getDashboard().subscribe({
          next: d => { this.dash = d; this.loading = false; },
          error: e => this.onError(e),
        });
        break;
      case 'empleados':
        this.loadEmpleados();
        break;
      case 'planillas':
        this.loadPlanillas();
        break;
      case 'vacaciones':
        this.loadVacaciones();
        break;
      case 'asistencia':
        this.loadControlJornada();
        break;
      case 'liquidaciones':
        this.svc.getLiquidaciones().subscribe({
          next: d => { this.liquidaciones = d; this.loading = false; },
          error: e => this.onError(e),
        });
        break;
      case 'capacitaciones':
        this.svc.getCapacitaciones().subscribe({
          next: d => { this.capacitaciones = d; this.loading = false; },
          error: e => this.onError(e),
        });
        break;
      case 'documentos':
        this.loadDocumentos();
        break;
      case 'parametros':
        this.svc.getParametros(this.ejercicio).subscribe({
          next: d => { this.parametrosData = d; this.loading = false; },
          error: e => this.onError(e),
        });
        break;
      case 'csbp':
        this.loadCsbp();
        break;
      case 'gestoras':
        this.loadGestoras();
        break;
      case 'finiquitos':
        this.loadFiniquitos();
        break;
      case 'tributaria':
        this.loadTributaria();
        break;
      case 'horarios':
        this.loadHorarios();
        break;
      default:
        this.loading = false;
    }
  }

  loadEmpleados(): void {
    this.loading = true;
    this.svc.getEmpleados(this.estadoFiltro || undefined, undefined, this.busqueda || undefined).subscribe({
      next: d => { this.empleados = d; this.buildEmpleadoOpts(); this.loading = false; },
      error: e => this.onError(e),
    });
  }

  loadPlanillas(): void {
    this.loading = true;
    this.svc.getPlanillas(this.ejercicio).subscribe({
      next: d => { this.planillas = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  openEmpleado(id: number): void {
    this.loading = true;
    this.empleadoDetalle = null;
    this.saldoVac = null;
    this.empSubTab = 'personal';
    this.empAsistencia = null;
    this.svc.getEmpleadoDetalle(id).subscribe({
      next: d => {
        this.empleadoDetalle = d;
        this.loading = false;
        this.svc.getSaldoVacaciones(id, this.ejercicio).subscribe({
          next: v => this.saldoVac = v,
          error: () => {},
        });
        this.svc.getAsistenciaDetalle(id, this.ejercicio, this.mes).subscribe({
          next: a => this.empAsistencia = a,
          error: () => {},
        });
      },
      error: e => this.onError(e),
    });
  }

  closeEmpleado(): void {
    this.empleadoDetalle = null;
    this.saldoVac = null;
    this.empAsistencia = null;
  }

  setEmpSubTab(t: EmpleadoSubTab): void {
    this.empSubTab = t;
  }

  empNombreCompleto(): string {
    if (!this.empleadoDetalle) return '';
    const e = this.empleadoDetalle.empleado;
    return `${e.apellido_paterno} ${e.apellido_materno || ''} ${e.nombres}`.trim();
  }

  empEdad(): number | null {
    if (!this.empleadoDetalle?.empleado.fecha_nacimiento) return null;
    const nac = new Date(this.empleadoDetalle.empleado.fecha_nacimiento + 'T00:00:00');
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  empAntiguedad(): string {
    if (!this.empleadoDetalle?.empleado.fecha_inicio) return '-';
    const inicio = new Date(this.empleadoDetalle.empleado.fecha_inicio + 'T00:00:00');
    const hoy = new Date();
    const anios = hoy.getFullYear() - inicio.getFullYear();
    const meses = hoy.getMonth() - inicio.getMonth();
    const totalMeses = anios * 12 + meses;
    if (totalMeses < 12) return `${totalMeses} meses`;
    const a = Math.floor(totalMeses / 12);
    const m = totalMeses % 12;
    return m > 0 ? `${a} año${a > 1 ? 's' : ''} ${m} mes${m > 1 ? 'es' : ''}` : `${a} año${a > 1 ? 's' : ''}`;
  }

  openAltaForm(): void {
    const hoy = new Date().toISOString().substring(0, 10);
    this.altaForm = {
      nombres: '', apellido_paterno: '', apellido_materno: '',
      fecha_nacimiento: '', ci: '', telefono: '',
      cargo_asignado: '', num_contrato: '', email_personal: '',
      plataforma: 'Windows',
      memo_adjunto: false, fotocopia_ci: false,
      sistemas: [{ acceso: true, sistema: 'SCGR - SISTEMA DE GIROS, CAMBIOS Y REMESAS', rol: '' }],
      intranet: { dominio_red: true, email_corp: true, intranet_corp: true, voip: false, otros1: false, otros1_nota: '', otros2: false },
      internet: { red_local: true, wifi: true },
      agencias: [] as string[],
      hardware: [
        { accesorio: 'CPU', descripcion: '', codigo: '' },
        { accesorio: 'MONITOR', descripcion: '', codigo: '' },
        { accesorio: 'TECLADO', descripcion: '', codigo: '' },
        { accesorio: 'MOUSE', descripcion: '', codigo: '' },
      ],
      fecha: hoy,
      solicitado_por: '', solicitado_cargo: '',
    };
    this.altaFormOpen = true;
  }

  closeAltaForm(): void { this.altaFormOpen = false; }

  openBajaForm(emp?: Empleado): void {
    const hoy = new Date().toISOString().substring(0, 10);
    this.bajaForm = {
      nombre_completo: emp ? `${emp.apellido_paterno} ${emp.apellido_materno || ''} ${emp.nombres}`.trim() : '',
      ci: emp?.ci || '', telefono: emp?.telefono || '',
      cargo_actual: emp?.cargo || '',
      memo_adjunto: false,
      sistemas: [] as { sistema: string; rol: string; usuario: string }[],
      intranet: { dominio_red: true, email_corp: true, intranet_corp: true, voip: false, otros1: false, otros2: false },
      hardware: [
        { accesorio: 'Teclado', descripcion: '', codigo: '' },
        { accesorio: 'Mouse', descripcion: '', codigo: '' },
        { accesorio: 'Monitor', descripcion: '', codigo: '' },
      ],
      fecha: hoy,
      solicitado_por: '', solicitado_cargo: '',
    };
    this.bajaFormOpen = true;
  }

  closeBajaForm(): void { this.bajaFormOpen = false; }

  addAltaSistema(): void {
    this.altaForm['sistemas'].push({ acceso: true, sistema: '', rol: '' });
  }

  addAltaHardware(): void {
    this.altaForm['hardware'].push({ accesorio: '', descripcion: '', codigo: '' });
  }

  addBajaHardware(): void {
    this.bajaForm['hardware'].push({ accesorio: '', descripcion: '', codigo: '' });
  }

  toggleAltaAgencia(ag: string): void {
    const arr = this.altaForm['agencias'] as string[];
    const idx = arr.indexOf(ag);
    if (idx >= 0) arr.splice(idx, 1); else arr.push(ag);
  }

  onFileSelected(event: Event, form: 'alta' | 'baja', field: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const target = form === 'alta' ? this.altaForm : this.bajaForm;
    if (file && file.type === 'application/pdf') {
      target[field] = file;
      target[field + '_name'] = file.name;
    } else {
      input.value = '';
      target[field] = null;
      target[field + '_name'] = '';
      alert('Solo se admiten archivos PDF');
    }
  }

  exportarAlta(): void {
    const f = this.altaForm;
    const hoy = f['fecha'] || new Date().toISOString().substring(0, 10);
    const agencias = ['Oficina Central', 'Agencia Colón', 'Agencia 6 de Marzo', 'Agencia Oruro Central',
      'Agencia Sucre Central', 'Agencia Cochabamba Central', 'Agencia Yapacani', 'Agencia Santa Cruz Central', 'Agencia Uyuni'];
    const agChecks = agencias.map(a =>
      `<label><input type="checkbox" ${(f['agencias'] as string[]).includes(a) ? 'checked' : ''} disabled /> ${a}</label>`
    ).join('');
    const sistRows = (f['sistemas'] as any[]).map((s: any, i: number) =>
      `<tr><td>${i + 1}.${i + 1}</td><td><input type="checkbox" ${s.acceso ? 'checked' : ''} disabled /></td><td>${s.sistema}</td><td>${s.rol}</td></tr>`
    ).join('');
    const hwRows = (f['hardware'] as any[]).map((h: any, i: number) =>
      `<tr><td>${i + 1}</td><td>${h.accesorio}</td><td>${h.descripcion}</td><td>${h.codigo}</td></tr>`
    ).join('');
    const inet = f['intranet'];
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Formulario Alta de Usuario</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{size:letter;margin:15mm 12mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Roboto,Arial,sans-serif;font-size:10px;color:#222;padding:20px}
h1{text-align:center;font-size:16px;font-weight:bold;margin:0}
h2{text-align:center;font-size:12px;margin:0 0 10px}
.header{display:flex;justify-content:space-between;margin-bottom:10px}
.header-left{font-size:9px;line-height:1.6}
.section{border:1px solid #000;margin-bottom:8px}
.section-title{background:#f0f0f0;padding:4px 8px;font-weight:bold;font-size:10px;border-bottom:1px solid #000;display:flex;justify-content:space-between}
.section-title .tag{font-weight:normal;font-style:italic;font-size:9px}
.row{display:flex;border-bottom:1px solid #ccc;font-size:10px}
.row:last-child{border-bottom:0}
.cell{padding:4px 6px;border-right:1px solid #ccc;flex:1}
.cell:last-child{border-right:0}
.cell label{font-weight:bold;font-size:9px;display:block;margin-bottom:2px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #000;padding:3px 6px;text-align:left;font-size:9px}
th{background:#f0f0f0;font-weight:bold}
.ag-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;padding:6px}
.ag-grid label{font-size:9px;display:flex;align-items:center;gap:4px;padding:2px 0}
.firmas{display:flex;justify-content:space-between;margin-top:40px;padding:0 20px}
.firma{text-align:center;min-width:180px;border-top:1px solid #000;padding-top:4px;font-size:9px}
.checks label{display:flex;align-items:center;gap:4px;padding:2px 0}
</style></head><body>
<div class="header">
  <div class="header-left">Código: GMB/FAU/Nro XX/${new Date().getFullYear()}<br>Fecha Emisión: ${hoy}<br>Versión: 01</div>
  <div style="text-align:center;flex:1"><h1>FORMULARIO</h1><h2>ALTA DE USUARIO</h2></div>
  <div style="width:140px;text-align:right"><img src="assets/gmbsrl.png" style="max-width:130px;max-height:40px" /></div>
</div>
<div class="row" style="border:1px solid #000;margin-bottom:8px">
  <div class="cell"><label>Solicitado Por:</label> ${f['solicitado_por']}</div>
  <div class="cell"><label>Fecha:</label> ${hoy}</div>
  <div class="cell"><label>Cargo:</label> ${f['solicitado_cargo']}</div>
</div>
<div class="section">
  <div class="section-title">1.- DATOS DEL USUARIO PARA LA CREACIÓN DE LAS CUENTAS <span class="tag">[Recursos Humanos]</span></div>
  <div class="row">
    <div class="cell"><label>Nombres</label>${f['nombres']}</div>
    <div class="cell"><label>Apellido Paterno</label>${f['apellido_paterno']}</div>
    <div class="cell"><label>Apellido Materno</label>${f['apellido_materno']}</div>
  </div>
  <div class="row">
    <div class="cell"><label>Fecha de Nacimiento</label>${f['fecha_nacimiento']}</div>
    <div class="cell"><label>Cédula de Identidad</label>${f['ci']}</div>
    <div class="cell"><label>Teléfono</label>${f['telefono']}</div>
  </div>
  <div class="row">
    <div class="cell"><label>Cargo Asignado</label>${f['cargo_asignado']}</div>
    <div class="cell"><label>N° de Contrato</label>${f['num_contrato']}</div>
    <div class="cell checks"><label><input type="checkbox" ${f['memo_adjunto'] ? 'checked' : ''} disabled /> Memorándum Adjunto</label><label><input type="checkbox" ${f['fotocopia_ci'] ? 'checked' : ''} disabled /> Fotocopia Cédula de Identidad</label></div>
  </div>
</div>
<div class="section">
  <div class="section-title">2.- AUTORIZACIÓN Y ACCESOS A LOS SISTEMAS <span class="tag">[Exclusivo Sistemas]</span></div>
  <table><thead><tr><th></th><th>Acceso</th><th>Sistema</th><th>Rol</th></tr></thead><tbody>${sistRows}</tbody></table>
</div>
<div class="section">
  <div class="section-title">3.- AUTORIZACIÓN Y ACCESOS A INTRANET <span class="tag">[Exclusivo Sistemas]</span></div>
  <div class="checks" style="padding:6px">
    <label><input type="checkbox" ${inet['dominio_red'] ? 'checked' : ''} disabled /> Dominio de Red</label>
    <label><input type="checkbox" ${inet['email_corp'] ? 'checked' : ''} disabled /> Email Corporativo</label>
    <label><input type="checkbox" ${inet['intranet_corp'] ? 'checked' : ''} disabled /> Intranet Corporativo</label>
    <label><input type="checkbox" ${inet['voip'] ? 'checked' : ''} disabled /> Servicio VoIP</label>
    ${inet['otros1'] ? `<label><input type="checkbox" checked disabled /> Otros: ${inet['otros1_nota']}</label>` : ''}
  </div>
</div>
<div class="section">
  <div class="section-title">4.- AUTORIZACIÓN Y ACCESOS A INTERNET <span class="tag">[Exclusivo Sistemas]</span></div>
  <div class="checks" style="padding:6px">
    <label><input type="checkbox" ${f['internet']['red_local'] ? 'checked' : ''} disabled /> Red Local</label>
    <label><input type="checkbox" ${f['internet']['wifi'] ? 'checked' : ''} disabled /> Wifi (Celular/Móvil)</label>
  </div>
</div>
<div class="section">
  <div class="section-title">5.- ASIGNACIÓN DE AGENCIA <span class="tag">[Exclusivo Sistemas]</span></div>
  <div class="ag-grid">${agChecks}</div>
</div>
<div class="section">
  <div class="section-title">6.- ASIGNACIÓN DE HARDWARE PARA SU ESTACIÓN DE TRABAJO <span class="tag">[RRHH]</span></div>
  <table><thead><tr><th>N°</th><th>Accesorio</th><th>Descripción</th><th>Código Activo</th></tr></thead><tbody>${hwRows}</tbody></table>
</div>
<div class="firmas">
  <div class="firma">Firma: Autorizador</div>
  <div class="firma">Firma: Responsable RRHH</div>
  <div class="firma">Firma: Responsable Alta</div>
</div>
</body></html>`;

    this.docPrintHtml = html;
    this.docPrintOpen = true;
    setTimeout(() => {
      const iframe = document.getElementById('doc-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) { doc.open(); doc.write(html); doc.close(); }
      }
    }, 100);
  }

  exportarBaja(): void {
    const f = this.bajaForm;
    const hoy = f['fecha'] || new Date().toISOString().substring(0, 10);
    const hwRows = (f['hardware'] as any[]).map((h: any, i: number) =>
      `<tr><td>${i + 1}</td><td>${h.accesorio}</td><td>${h.descripcion}</td><td>${h.codigo}</td></tr>`
    ).join('');
    const inet = f['intranet'];
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Formulario Baja de Usuario</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{size:letter;margin:15mm 12mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Roboto,Arial,sans-serif;font-size:10px;color:#222;padding:20px}
h1{text-align:center;font-size:16px;font-weight:bold;margin:0}
h2{text-align:center;font-size:12px;margin:0 0 10px}
.header{display:flex;justify-content:space-between;margin-bottom:10px}
.header-left{font-size:9px;line-height:1.6}
.section{border:1px solid #000;margin-bottom:8px}
.section-title{background:#f0f0f0;padding:4px 8px;font-weight:bold;font-size:10px;border-bottom:1px solid #000;display:flex;justify-content:space-between}
.section-title .tag{font-weight:normal;font-style:italic;font-size:9px}
.row{display:flex;border-bottom:1px solid #ccc;font-size:10px}
.row:last-child{border-bottom:0}
.cell{padding:4px 6px;border-right:1px solid #ccc;flex:1}
.cell:last-child{border-right:0}
.cell label{font-weight:bold;font-size:9px;display:block;margin-bottom:2px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #000;padding:3px 6px;text-align:left;font-size:9px}
th{background:#f0f0f0;font-weight:bold}
.checks label{display:flex;align-items:center;gap:4px;padding:2px 0}
.firmas{display:flex;justify-content:space-between;margin-top:40px;padding:0 20px}
.firma{text-align:center;min-width:180px;border-top:1px solid #000;padding-top:4px;font-size:9px}
</style></head><body>
<div class="header">
  <div class="header-left">Código: GMB/FBU/N° XX/${new Date().getFullYear()}<br>Fecha Emisión: ${hoy}<br>Versión: 01</div>
  <div style="text-align:center;flex:1"><h1>FORMULARIO</h1><h2>BAJA DE USUARIO</h2></div>
  <div style="width:140px;text-align:right"><img src="assets/gmbsrl.png" style="max-width:130px;max-height:40px" /></div>
</div>
<div class="row" style="border:1px solid #000;margin-bottom:8px">
  <div class="cell"><label>Solicitado Por:</label> ${f['solicitado_por']}</div>
  <div class="cell"><label>Fecha:</label> ${hoy}</div>
  <div class="cell"><label>Cargo:</label> ${f['solicitado_cargo']}</div>
</div>
<div class="section">
  <div class="section-title">1.- DATOS DEL USUARIO DE LA BAJA <span class="tag">[Recursos Humanos]</span></div>
  <div class="row"><div class="cell"><label>Usuario:</label> ${f['nombre_completo']}</div></div>
  <div class="row">
    <div class="cell"><label>Cédula de Identidad:</label> ${f['ci']}</div>
    <div class="cell"><label>Teléfono:</label> ${f['telefono']}</div>
  </div>
  <div class="row">
    <div class="cell"><label>Cargo Actual:</label> ${f['cargo_actual']}</div>
    <div class="cell checks"><label><input type="checkbox" ${f['memo_adjunto'] ? 'checked' : ''} disabled /> Memorándum Adjunto</label></div>
  </div>
</div>
<div class="section">
  <div class="section-title">2.- INACTIVACIÓN, BAJA DE LOS SISTEMAS <span class="tag">[Exclusivo Sistemas]</span></div>
  <table><thead><tr><th>Sistema</th><th>Rol</th><th>Usuario</th></tr></thead>
  <tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
</div>
<div class="section">
  <div class="section-title">3.- INACTIVACIÓN, BAJA DE LA INTRANET <span class="tag">[Exclusivo Sistemas]</span></div>
  <div class="checks" style="padding:6px">
    <label><input type="checkbox" ${inet['dominio_red'] ? 'checked' : ''} disabled /> Dominio de Red</label>
    <label><input type="checkbox" ${inet['email_corp'] ? 'checked' : ''} disabled /> Email Corporativo</label>
    <label><input type="checkbox" ${inet['intranet_corp'] ? 'checked' : ''} disabled /> Intranet Corporativo</label>
    <label><input type="checkbox" ${inet['voip'] ? 'checked' : ''} disabled /> Servicio VoIP</label>
  </div>
</div>
<div class="section">
  <div class="section-title">4.- ENTREGA DE HARDWARE DE LA ESTACIÓN DE TRABAJO <span class="tag">[RRHH]</span></div>
  <table><thead><tr><th>N°</th><th>Accesorio</th><th>Descripción</th><th>Código Activo</th></tr></thead><tbody>${hwRows}</tbody></table>
</div>
<div class="firmas">
  <div class="firma">Firma: Autorizador</div>
  <div class="firma">Firma: Responsable RRHH</div>
  <div class="firma">Firma: Responsable Baja</div>
</div>
</body></html>`;

    this.docPrintHtml = html;
    this.docPrintOpen = true;
    setTimeout(() => {
      const iframe = document.getElementById('doc-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) { doc.open(); doc.write(html); doc.close(); }
      }
    }, 100);
  }

  previewPlanilla(): void {
    this.loading = true;
    this.svc.getPlanillaPreview(this.ejercicio, this.mes).subscribe({
      next: d => { this.planillaPreview = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  closePlanillaPreview(): void {
    this.planillaPreview = null;
  }

  sumCol(lineas: PlanillaLinea[], field: keyof PlanillaLinea): number {
    return lineas.reduce((s, l) => s + ((l[field] as number) || 0), 0);
  }

  sumAfp(lineas: PlanillaLinea[]): number {
    return lineas.reduce((s, l) => s + l.aporte_afp + l.riesgo_comun + l.comision_afp + l.solidario_aseg, 0);
  }

  exportarPlanilla(): void {
    if (!this.planillaPreview) return;
    const p = this.planillaPreview;
    const mesNombre = this.meses[p.mes - 1];
    const rows = p.lineas.map((l, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td class="emp">${l.empleado || 'Emp #' + l.id_empleado}</td>
      <td>${l.cargo || '-'}</td>
      <td class="n">${this.num(l.sueldo_base)}</td>
      <td class="c">30</td>
      <td class="n">${this.num(l.sueldo_base)}</td>
      <td class="c">${l.bono_antiguedad > 0 ? (l as any).antiguedad_anios || '' : ''}</td>
      <td class="n">${this.num(l.bono_antiguedad)}</td>
      <td class="c">${l.horas_extra > 0 ? l.horas_extra : ''}</td>
      <td class="n">${this.num(l.monto_horas_extra)}</td>
      <td class="n">${this.num(l.monto_dominicales)}</td>
      <td class="n">0,00</td>
      <td class="n b">${this.num(l.total_ganado)}</td>
      <td class="n">${this.num(l.aporte_afp + l.riesgo_comun + l.comision_afp + l.solidario_aseg)}</td>
      <td class="n">${this.num(l.nacional_solidario)}</td>
      <td class="n">${this.num(l.rciva)}</td>
      <td class="n">0,00</td>
      <td class="n b">${this.num(l.total_descuentos)}</td>
      <td class="n b liq">${this.num(l.liquido_pagable)}</td>
      <td class="n">${this.num(l.total_patronal)}</td>
    </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Planilla ${mesNombre} ${p.gestion}</title>
<style>
@page{size:letter landscape;margin:8mm 10mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:8px;color:#222}
.header{text-align:center;margin-bottom:6px}
.header img{height:40px;margin-bottom:4px}
.header h1{font-size:11px;text-transform:uppercase;letter-spacing:1px}
.header h2{font-size:9px;color:#555;margin-top:2px}
.info{display:flex;justify-content:space-between;font-size:8px;margin-bottom:6px;padding:0 4px}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #bbb;padding:2px 3px;font-size:7px}
th{background:#ED7D31;color:#fff;text-transform:uppercase;font-size:6.5px;letter-spacing:.3px}
th.grp{background:#c96a28;font-size:7px}
td.c{text-align:center}
td.n{text-align:right;font-variant-numeric:tabular-nums}
td.b{font-weight:bold}
td.emp{white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis}
td.liq{color:#ED7D31}
tr:nth-child(even) td{background:#fafafa}
tfoot td{background:#f5f5f5;font-weight:bold;border-top:2px solid #ED7D31}
.totals{font-size:8px}
.firmas{display:flex;justify-content:space-between;margin-top:20px;padding:0 40px}
.firma{text-align:center;min-width:160px;border-top:1px solid #333;padding-top:3px;font-size:7px}
</style></head><body>
<div class="header">
  <img src="assets/gmbsrl.png" />
  <h1>Planilla de Sueldos y Salarios</h1>
  <h2>Correspondiente al mes: ${mesNombre} ${p.gestion}</h2>
</div>
<div class="info">
  <div><strong>Empresa:</strong> GIROS Y REMESAS DE DINERO GAMBARTE BOLIVIA S.R.L.</div>
  <div><strong>NIT:</strong> 1024717022</div>
  <div><strong>Empleados:</strong> ${p.lineas.length}</div>
</div>
<table>
<thead>
  <tr>
    <th rowspan="2" style="width:18px">N°</th>
    <th rowspan="2">Empleado</th>
    <th rowspan="2">Cargo</th>
    <th rowspan="2">Sueldo Básico</th>
    <th rowspan="2">Días</th>
    <th rowspan="2">Salario Ganado (A)</th>
    <th rowspan="2">Años</th>
    <th rowspan="2">Bono Antig. (B)</th>
    <th colspan="2" class="grp">Horas Extra (C)</th>
    <th colspan="2" class="grp">Otros</th>
    <th rowspan="2">Total Ganado (G)</th>
    <th colspan="4" class="grp">Descuentos</th>
    <th rowspan="2">Total Desc. (L)</th>
    <th rowspan="2">Líquido Pagable</th>
    <th rowspan="2">Patronal</th>
  </tr>
  <tr>
    <th>Cant.</th><th>Monto</th>
    <th>Dominical (E)</th><th>Otros (F)</th>
    <th>AFP 12.71% (H)</th><th>Nac. Sol. (I)</th><th>RC-IVA (J)</th><th>Otros (K)</th>
  </tr>
</thead>
<tbody>${rows}</tbody>
<tfoot><tr class="totals">
  <td colspan="3" class="c"><strong>TOTALES</strong></td>
  <td class="n">${this.num(this.sumCol(p.lineas, 'sueldo_base'))}</td>
  <td></td>
  <td class="n">${this.num(this.sumCol(p.lineas, 'sueldo_base'))}</td>
  <td></td>
  <td class="n">${this.num(this.sumCol(p.lineas, 'bono_antiguedad'))}</td>
  <td></td>
  <td class="n">${this.num(this.sumCol(p.lineas, 'monto_horas_extra'))}</td>
  <td class="n">${this.num(this.sumCol(p.lineas, 'monto_dominicales'))}</td>
  <td class="n">0,00</td>
  <td class="n b">${this.num(p.total_ganado)}</td>
  <td class="n">${this.num(this.sumAfp(p.lineas))}</td>
  <td class="n">${this.num(this.sumCol(p.lineas, 'nacional_solidario'))}</td>
  <td class="n">${this.num(this.sumCol(p.lineas, 'rciva'))}</td>
  <td class="n">0,00</td>
  <td class="n b">${this.num(p.total_descuento)}</td>
  <td class="n b liq">${this.num(p.total_liquido)}</td>
  <td class="n">${this.num(p.total_patronal)}</td>
</tr></tfoot>
</table>
<div class="firmas">
  <div class="firma">Elaborado por</div>
  <div class="firma">Revisado por</div>
  <div class="firma">Aprobado por<br>Gerente General</div>
</div>
</body></html>`;

    this.docPrintHtml = html;
    this.docPrintOpen = true;
    setTimeout(() => {
      const iframe = document.getElementById('doc-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) { doc.open(); doc.write(html); doc.close(); }
      }
    }, 100);
  }

  async exportarPlanillaExcel(): Promise<void> {
    if (!this.planillaPreview) return;
    const p = this.planillaPreview;
    const mesNombre = this.meses[p.mes - 1];
    const wb = new Workbook();
    const ws = wb.addWorksheet(`Planilla ${mesNombre} ${p.gestion}`);

    const orange = 'FFED7D31';
    const darkBg = 'FF14213D';
    const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: orange } };
    const subFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: darkBg } };
    const headerFont = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    const numFmt = '#,##0.00';

    // Title
    const titleRow = ws.addRow(['PLANILLA DE SUELDOS Y SALARIOS']);
    titleRow.font = { bold: true, size: 13 };
    ws.mergeCells(1, 1, 1, 20);
    titleRow.getCell(1).alignment = { horizontal: 'center' };

    const subRow = ws.addRow([`Correspondiente al mes: ${mesNombre} ${p.gestion}`]);
    subRow.font = { bold: true, size: 10 };
    ws.mergeCells(2, 1, 2, 20);
    subRow.getCell(1).alignment = { horizontal: 'center' };

    const infoRow = ws.addRow([
      'Empresa: GIROS Y REMESAS DE DINERO GAMBARTE BOLIVIA S.R.L.', '', '', '', '', '',
      'NIT: 1024717022', '', '', '', '', '', '', '', '', '', '', '', '', `Empleados: ${p.lineas.length}`
    ]);
    infoRow.font = { size: 9 };
    ws.addRow([]);

    // Header row 1 (grouped)
    const h1 = ws.addRow([
      'N°', 'EMPLEADO', 'CARGO', 'SUELDO BÁSICO', 'DÍAS PAG.', 'SALARIO GANADO (A)',
      'AÑOS', 'BONO ANTIG. (B)', 'HORAS EXTRA (C)', '', 'DOMINICAL (E)', 'OTROS (F)',
      'TOTAL GANADO (G)', 'DESCUENTOS', '', '', '', 'TOTAL DESC. (L)',
      'LÍQUIDO PAGABLE', 'PATRONAL'
    ]);
    h1.eachCell(cell => { cell.font = headerFont; cell.fill = headerFill; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }; });

    // Header row 2 (sub-columns)
    const h2 = ws.addRow([
      '', '', '', '', '', '',
      '', '', 'CANT.', 'MONTO', '', '',
      '', 'AFP 12.71% (H)', 'NAC. SOL. (I)', 'RC-IVA (J)', 'OTROS (K)', '',
      '', ''
    ]);
    h2.eachCell(cell => { cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } }; cell.fill = subFill; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }; });

    // Merge header cells (row 5 & 6)
    const r1 = 5, r2 = 6;
    // Single-row headers (rowspan=2)
    [1,2,3,4,5,6,7,8,11,12,13,18,19,20].forEach(c => ws.mergeCells(r1, c, r2, c));
    // Horas Extra colspan=2
    ws.mergeCells(r1, 9, r1, 10);
    // Descuentos colspan=4
    ws.mergeCells(r1, 14, r1, 17);

    // Data rows
    p.lineas.forEach((l, i) => {
      const row = ws.addRow([
        i + 1,
        l.empleado || `Emp #${l.id_empleado}`,
        l.cargo || '-',
        l.sueldo_base,
        30,
        l.sueldo_base,
        l.bono_antiguedad > 0 ? l.antiguedad_anios : '',
        l.bono_antiguedad,
        l.horas_extra > 0 ? l.horas_extra : '',
        l.monto_horas_extra,
        l.monto_dominicales,
        0,
        l.total_ganado,
        l.aporte_afp + l.riesgo_comun + l.comision_afp + l.solidario_aseg,
        l.nacional_solidario,
        l.rciva,
        0,
        l.total_descuentos,
        l.liquido_pagable,
        l.total_patronal
      ]);
      row.eachCell((cell, colNum) => {
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        if (colNum === 1) cell.alignment = { horizontal: 'center' };
        if ([4,6,8,10,11,12,13,14,15,16,17,18,19,20].includes(colNum)) {
          cell.numFmt = numFmt;
          cell.alignment = { horizontal: 'right' };
        }
      });
      // Highlight líquido pagable
      row.getCell(19).font = { bold: true, color: { argb: orange } };
    });

    // Totals
    const totRow = ws.addRow([
      '', 'TOTALES', '', this.sumCol(p.lineas, 'sueldo_base'), '',
      this.sumCol(p.lineas, 'sueldo_base'), '',
      this.sumCol(p.lineas, 'bono_antiguedad'), '',
      this.sumCol(p.lineas, 'monto_horas_extra'),
      this.sumCol(p.lineas, 'monto_dominicales'), 0,
      p.total_ganado,
      this.sumAfp(p.lineas),
      this.sumCol(p.lineas, 'nacional_solidario'),
      this.sumCol(p.lineas, 'rciva'), 0,
      p.total_descuento, p.total_liquido, p.total_patronal
    ]);
    totRow.eachCell((cell, colNum) => {
      cell.font = { bold: true, size: 10 };
      cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      if ([4,6,8,10,11,12,13,14,15,16,17,18,19,20].includes(colNum)) {
        cell.numFmt = numFmt;
        cell.alignment = { horizontal: 'right' };
      }
    });
    totRow.getCell(19).font = { bold: true, size: 11, color: { argb: orange } };

    // Column widths
    const widths = [5, 28, 18, 14, 8, 14, 6, 14, 7, 12, 12, 10, 14, 14, 12, 12, 10, 14, 16, 14];
    widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `Planilla_Sueldos_${mesNombre}_${p.gestion}.xlsx`);
  }

  loadVacaciones(): void {
    this.loading = true;
    this.svc.getVacacionesResumen(this.ejercicio).subscribe({
      next: d => { this.vacacionesData = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  get saldosFiltrados() {
    if (!this.vacacionesData) return [];
    if (!this.vacBusqueda) return this.vacacionesData.saldos;
    const b = this.vacBusqueda.toLowerCase();
    return this.vacacionesData.saldos.filter(s =>
      s.empleado.toLowerCase().includes(b) ||
      s.ci.includes(this.vacBusqueda) ||
      (s.cargo && s.cargo.toLowerCase().includes(b))
    );
  }

  loadCronograma(): void {
    this.cronogramaVisible = true;
    document.body.classList.add('crono-open');
    this.svc.getCronograma(this.ejercicio).subscribe({
      next: d => this.cronograma = d,
      error: () => this.cronograma = null,
    });
  }

  closeCronograma(): void {
    this.cronogramaVisible = false;
    document.body.classList.remove('crono-open');
  }

  printCronograma(): void {
    window.print();
  }

  dowLabel(dow: number): string {
    return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][dow] || '';
  }

  openVacForm(): void {
    this.vacFormOpen = true;
    this.vacFormError = '';
    this.vacFormSuccess = '';
    this.vacForm = { id_empleado: 0, fecha_inicio: '', fecha_fin: '', tipo: 'VACACION', observaciones: '' };
  }

  closeVacForm(): void {
    this.vacFormOpen = false;
  }

  submitVacacion(): void {
    this.vacFormError = '';
    this.vacFormSuccess = '';
    if (!this.vacForm.id_empleado || !this.vacForm.fecha_inicio || !this.vacForm.fecha_fin) {
      this.vacFormError = 'Complete todos los campos obligatorios.';
      return;
    }
    this.vacProcessing = true;
    this.svc.solicitarVacacion(this.vacForm, this.ejercicio).subscribe({
      next: (d: any) => {
        this.vacProcessing = false;
        this.vacFormSuccess = d.nota
          ? `Solicitud simulada (ID ${d.solicitud.id}) — ${d.solicitud.dias} días hábiles. Saldo restante: ${d.saldo_restante}. ${d.nota}`
          : `Solicitud creada (ID ${d.solicitud.id}) — ${d.solicitud.dias} días hábiles. Saldo restante: ${d.saldo_restante}.`;
        this.loadVacaciones();
      },
      error: (e: any) => {
        this.vacProcessing = false;
        this.vacFormError = e?.message || 'Error al registrar la solicitud';
      },
    });
  }

  aprobarVacacion(id: number): void {
    this.vacProcessing = true;
    this.svc.aprobarVacacion(id).subscribe({
      next: () => { this.vacProcessing = false; this.loadVacaciones(); },
      error: (e: any) => { this.vacProcessing = false; this.error = e?.message || 'Error'; },
    });
  }

  rechazarVacacion(id: number): void {
    this.vacProcessing = true;
    this.svc.rechazarVacacion(id).subscribe({
      next: () => { this.vacProcessing = false; this.loadVacaciones(); },
      error: (e: any) => { this.vacProcessing = false; this.error = e?.message || 'Error'; },
    });
  }

  openAsistForm(): void {
    this.asistFormOpen = true;
    this.asistFormError = '';
    this.asistFormSuccess = '';
    this.asistForm = { id_empleado: 0, fecha: '', am_ingreso: '08:00', am_salida: '12:30', pm_ingreso: '13:00', pm_salida: '18:00', extras: 0, atrasos: 0, tipo: 'NORMAL', observaciones: '' };
  }

  closeAsistForm(): void {
    this.asistFormOpen = false;
  }

  submitAsistencia(): void {
    this.asistFormError = '';
    this.asistFormSuccess = '';
    if (!this.asistForm.id_empleado || !this.asistForm.fecha) {
      this.asistFormError = 'Seleccione un empleado y una fecha.';
      return;
    }
    this.asistProcessing = true;
    this.svc.registrarAsistencia(this.asistForm).subscribe({
      next: (d: any) => {
        this.asistProcessing = false;
        this.asistFormSuccess = d.nota
          ? `Asistencia registrada para ${this.asistForm.fecha}. ${d.nota}`
          : `Asistencia registrada correctamente para ${this.asistForm.fecha}.`;
        this.loadControlJornada();
      },
      error: (e: any) => {
        this.asistProcessing = false;
        this.asistFormError = e?.message || 'Error al registrar asistencia';
      },
    });
  }

  loadControlJornada(): void {
    this.loading = true;
    this.svc.getControlJornada(this.ejercicio, this.mes).subscribe({
      next: d => { this.controlJornada = d; this.buildAsistenciaOpts(); this.loading = false; },
      error: e => this.onError(e),
    });
  }

  openAsistenciaDetalle(idEmpleado: number, nombre: string): void {
    this.asistenciaDetalleEmpleado = nombre;
    this.asistenciaDetalleOpen = true;
    this.svc.getAsistenciaDetalle(idEmpleado, this.ejercicio, this.mes).subscribe({
      next: d => this.asistenciaDetalleData = d,
      error: () => this.asistenciaDetalleData = null,
    });
  }

  closeAsistenciaDetalle(): void {
    this.asistenciaDetalleOpen = false;
    this.asistenciaDetalleData = null;
  }

  exportarAsistencia(): void {
    if (!this.asistenciaDetalleData) return;
    const d = this.asistenciaDetalleData;
    const mesNombre = this.meses[d.mes - 1] || '';
    const rows = d.registros.map(r => {
      const dia = new Date(r.fecha + 'T00:00:00').getDate();
      return `<tr class="${r.tipo === 'FALTA' ? 'falta' : r.tipo === 'FERIADO' ? 'feriado' : ''}">
        <td class="c">${dia}</td>
        <td class="c">${r.am_ingreso || ''}</td><td class="c">${r.am_salida || ''}</td>
        <td class="c">${r.pm_ingreso || ''}</td><td class="c">${r.pm_salida || ''}</td>
        <td class="c">${r.horas_extra > 0 ? r.horas_extra : ''}</td>
        <td class="c">${(r.atrasos_min || 0) > 0 ? r.atrasos_min + ' min' : ''}</td>
        <td>${r.tipo !== 'NORMAL' ? r.tipo : ''} ${r.observaciones || ''}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hoja de Asistencia - ${d.empleado}</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{size:letter portrait;margin:0 18mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Roboto,Arial,sans-serif;font-size:10px;color:#222;position:relative;min-height:100vh;background:url('${MEMBRETE_GAMBARTE_BASE64}') no-repeat center center;background-size:100% 100%}
.content{padding:80px 10px 30px}
.title{text-align:center;font-size:13px;font-weight:bold;color:#333;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 20px;margin-bottom:8px;font-size:10px}
.info-grid span{font-weight:bold}
table{width:100%;border-collapse:collapse;margin-bottom:8px}
th{background:#ED7D31;color:#fff;padding:4px 3px;font-size:8px;text-transform:uppercase;letter-spacing:.5px}
th.group{background:#c96a28;font-size:9px}
td{border:1px solid #ccc;padding:3px;font-size:9px}
td.c{text-align:center}
tr.falta td{background:#fff0f0;color:#c0392b}
tr.feriado td{background:#fdf2e9;color:#b35c1e;font-style:italic}
tr:nth-child(even) td{background:#fafbfc}
tr.falta:nth-child(even) td{background:#ffe8e8}
.resumen{margin-top:10px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.resumen-item{border:1px solid #ddd;border-radius:4px;padding:6px;text-align:center}
.resumen-item .val{font-size:16px;font-weight:bold;color:#ED7D31}
.resumen-item .lbl{font-size:8px;color:#666;text-transform:uppercase}
.footer{margin-top:16px;display:flex;justify-content:space-between;font-size:9px;padding-top:10px}
.firma{text-align:center;min-width:200px;border-top:1px solid #333;padding-top:4px;margin-top:40px}
.legal{font-size:7px;color:#888;margin-top:8px;text-align:center}
</style></head><body>
<div class="content">
<div class="title">Hoja de Asistencia</div>
<div class="info-grid">
  <div><span>Nombre:</span> ${d.empleado}</div>
  <div><span>Lugar de Trabajo:</span> ${d.lugar_trabajo}</div>
  <div><span>Cargo:</span> ${d.cargo}</div>
  <div><span>Mes:</span> ${mesNombre} ${d.gestion}</div>
</div>
<table>
  <thead>
    <tr>
      <th rowspan="2" style="width:30px">Día</th>
      <th colspan="2" class="group">Turno Mañana</th>
      <th colspan="2" class="group">Turno Tarde</th>
      <th rowspan="2" style="width:40px">Extras</th>
      <th rowspan="2" style="width:50px">Atrasos</th>
      <th rowspan="2">Observaciones</th>
    </tr>
    <tr>
      <th>Ingreso</th><th>Salida</th>
      <th>Ingreso</th><th>Salida</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="resumen">
  <div class="resumen-item"><div class="val">${d.resumen.dias_trabajados}</div><div class="lbl">Días Trabajados</div></div>
  <div class="resumen-item"><div class="val">${d.resumen.faltas}</div><div class="lbl">Faltas</div></div>
  <div class="resumen-item"><div class="val">${d.resumen.atrasos_total} min</div><div class="lbl">Atrasos Total</div></div>
  <div class="resumen-item"><div class="val">${d.resumen.horas_extra_total}</div><div class="lbl">Horas Extra</div></div>
</div>
<div class="footer">
  <div class="firma">Firma del Empleado</div>
  <div class="firma">Firma del Responsable RRHH</div>
</div>
<div class="legal">Art. 46 LGT — Jornada máxima: 8h/día hombres, 7h/día mujeres. Art. 50 LGT — Horas extra al 100%. Art. 55 LGT — Dominical al 200%.</div>
</div>
</body></html>`;

    this.docPrintHtml = html;
    this.docPrintOpen = true;
    setTimeout(() => {
      const iframe = document.getElementById('doc-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) { doc.open(); doc.write(html); doc.close(); }
      }
    }, 100);
  }

  simularLiquidacion(): void {
    if (!this.simEmpleadoId || !this.simFecha) {
      this.error = 'Seleccione un empleado y fecha para la simulación';
      return;
    }
    this.loading = true;
    this.svc.simularLiquidacion(this.simEmpleadoId, this.simFecha, this.simMotivo).subscribe({
      next: d => { this.simulacion = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  closeSimulacion(): void {
    this.simulacion = null;
  }

  loadDocumentos(): void {
    this.loading = true;
    this.svc.getPlantillas().subscribe({
      next: d => {
        this.plantillas = d;
        this.svc.getDocumentosGenerados().subscribe({
          next: g => { this.documentosGenerados = g; this.loading = false; },
          error: () => { this.loading = false; },
        });
        if (this.empleados.length === 0) {
          this.svc.getEmpleados().subscribe({ next: e => { this.empleados = e; this.buildEmpleadoOpts(); }, error: () => {} });
        }
      },
      error: e => this.onError(e),
    });
  }

  get plantillasFiltradas(): PlantillaDocumento[] {
    if (!this.docCategoriaFiltro) return this.plantillas;
    return this.plantillas.filter(p => p.categoria === this.docCategoriaFiltro);
  }

  get plantillaSeleccionada(): PlantillaDocumento | undefined {
    return this.plantillas.find(p => p.id === this.docPlantillaId);
  }

  openDocForm(plantillaId: string): void {
    this.docPlantillaId = plantillaId;
    this.docParams = {};
    this.docPreview = null;
    this.docError = '';
    this.docFormOpen = true;
  }

  closeDocForm(): void {
    this.docFormOpen = false;
    this.docPreview = null;
  }

  generarDocumento(): void {
    this.docError = '';
    this.docProcessing = true;
    const data = { plantilla: this.docPlantillaId, ...this.docParams };
    this.svc.generarDocumento(data).subscribe({
      next: d => { this.docPreview = d; this.docProcessing = false; },
      error: (e: any) => { this.docError = e?.message || 'Error al generar documento'; this.docProcessing = false; },
    });
  }

  exportarDocumento(): void {
    if (!this.docPreview) return;
    const d = this.docPreview;
    const editableEl = document.getElementById('doc-editable-preview');
    const contenido = editableEl ? editableEl.innerHTML : d.contenido;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${d.titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
<style>
@page{size:letter;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Roboto,Arial,sans-serif;font-size:11px;color:#222;line-height:1.6;position:relative;min-height:100vh;background:url('${MEMBRETE_GAMBARTE_BASE64}') no-repeat center center;background-size:100% 100%}
.contenido{padding:120px 60px 60px 50px}
h2{font-size:14px;text-align:center;margin:20px 0 16px;text-transform:uppercase;letter-spacing:1px;color:#333;font-weight:700}
h3{font-size:12px;margin:14px 0 8px;color:#333;font-weight:700}
h3.subtitulo{text-align:center;font-size:13px;margin-top:-10px;color:#666}
p{margin-bottom:10px;text-align:justify}
ol{margin:0 0 10px 30px}
li{margin-bottom:4px}
hr{border:none;border-top:1px solid #ccc;margin:12px 0}
.firmas{display:flex;justify-content:center;margin-top:50px;gap:40px}
.firma-bloque{text-align:center;min-width:200px}
.firma-linea{border-top:1px solid #333;margin-bottom:6px;margin-top:60px}
.firma-bloque p{margin:2px 0;font-size:11px}
h2.memo-titulo{text-align:center;margin:20px 0 8px;font-size:16px;font-weight:700}
.memo-codigo{font-size:12px;font-weight:bold;color:#333;margin:0 0 16px;text-align:center}
.memo-datos{margin:16px 0 0 40px}
.memo-row{display:flex;margin-bottom:6px;font-size:12px;line-height:1.5}
.memo-row .memo-label{width:90px;font-weight:700;flex-shrink:0}
.memo-row .memo-val{flex:1}
.memo-separator{margin:16px 0;border-bottom:1px solid #333}
.memo-cargo-destino{text-align:center;font-size:13px;margin:16px 0;font-weight:bold}
.memo-pie{margin-top:40px;font-size:10px;color:#555}
.memo-pie p{margin:2px 0;text-align:left}
.norma{font-size:8px;color:#888;text-align:center;margin-top:20px}
table{width:100%;border-collapse:collapse;margin:10px 0}
table th{background:#ED7D31;color:#fff;padding:6px 8px;font-size:10px;font-weight:700;text-align:center}
table td{border:1px solid #ccc;padding:4px 8px;font-size:11px}
</style></head><body>
<div class="contenido">
${contenido}
${d.norma ? '<div class="norma">Documento generado conforme a: ' + d.norma + '</div>' : ''}
</div>
</body></html>`;

    this.docPrintHtml = html;
    this.docPrintOpen = true;
    setTimeout(() => {
      const iframe = document.getElementById('doc-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) { doc.open(); doc.write(html); doc.close(); }
      }
    }, 100);
  }

  imprimirDocumento(): void {
    const iframe = document.getElementById('doc-print-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }

  cerrarPrintPopup(): void {
    this.docPrintOpen = false;
    this.docPrintHtml = '';
  }

  // ── CSBP ──
  loadCsbp(): void {
    this.loading = true;
    this.svc.getCsbpDashboard().subscribe({
      next: d => {
        this.csbpDash = d;
        this.loading = false;
        if (this.csbpSubTab === 'altas') this.loadCsbpAltas();
        else if (this.csbpSubTab === 'bajas') this.loadCsbpBajas();
        else if (this.csbpSubTab === 'aportes') this.loadCsbpAportes();
      },
      error: e => this.onError(e),
    });
  }

  setCsbpSubTab(t: 'dashboard' | 'altas' | 'bajas' | 'aportes'): void {
    this.csbpSubTab = t;
    if (t === 'altas') this.loadCsbpAltas();
    else if (t === 'bajas') this.loadCsbpBajas();
    else if (t === 'aportes') this.loadCsbpAportes();
  }

  loadCsbpAltas(): void {
    this.svc.getCsbpAltas().subscribe({ next: d => this.csbpAltas = d, error: () => {} });
  }

  loadCsbpBajas(): void {
    this.svc.getCsbpBajas().subscribe({ next: d => this.csbpBajas = d, error: () => {} });
  }

  loadCsbpAportes(): void {
    this.svc.getCsbpResumen(this.ejercicio).subscribe({ next: d => this.csbpResumen = d, error: () => {} });
  }

  // ── Gestoras AFP ──
  loadGestoras(): void {
    this.loading = true;
    this.svc.getGestoras().subscribe({
      next: d => { this.gestorasList = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  setGestoraSubTab(t: 'gestoras' | 'contribuciones' | 'sin-gestora'): void {
    this.gestoraSubTab = t;
    if (t === 'contribuciones') this.loadGestoraContribuciones();
    else if (t === 'sin-gestora') this.loadEmpleadosSinGestora();
    else this.loadGestoras();
  }

  loadGestoraContribuciones(): void {
    this.loading = true;
    this.svc.getResumenContribuciones(this.ejercicio).subscribe({
      next: d => { this.gestoraResumen = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  loadEmpleadosSinGestora(): void {
    this.loading = true;
    this.svc.getEmpleadosSinGestora().subscribe({
      next: d => { this.gestoraSinGestora = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  // ── Finiquitos ──
  loadFiniquitos(): void {
    this.loading = true;
    this.svc.getFiniquitos().subscribe({
      next: d => { this.finiquitos = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  calcularFiniquito(): void {
    if (!this.finiquitoEmpleadoId || !this.finiquitoFecha) {
      this.error = 'Seleccione empleado y fecha de retiro';
      return;
    }
    this.loading = true;
    this.finiquitoCalculo = null;
    this.svc.calcularFiniquito(this.finiquitoEmpleadoId, this.finiquitoFecha, this.finiquitoMotivo).subscribe({
      next: d => { this.finiquitoCalculo = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  closeFiniquitoCalculo(): void {
    this.finiquitoCalculo = null;
  }

  motivoBajaLabel(m: string): string {
    const map: Record<string, string> = {
      VOLUNTARIO: 'Retiro voluntario',
      FORZOSO: 'Despido (forzoso)',
      CONCLUSION_CONTRATO: 'Conclusión de contrato',
      CONCLUSION_OBRA: 'Conclusión de obra',
      INCUMPLIMIENTO_CONTRATO: 'Incumplimiento de contrato',
    };
    return map[m] || m;
  }

  // ── Planilla Tributaria ──
  loadTributaria(): void {
    this.loading = true;
    this.svc.calcularTributaria(this.ejercicio, this.mes).subscribe({
      next: d => { this.tributariaData = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  // ── Horarios ──
  loadHorarios(): void {
    this.loading = true;
    this.svc.getHorarios().subscribe({
      next: d => { this.horarios = d; this.buildHorarioOpts(); this.loading = false; },
      error: e => this.onError(e),
    });
  }

  setHorarioSubTab(t: 'horarios' | 'asignaciones' | 'sin-horario'): void {
    this.horarioSubTab = t;
    if (t === 'asignaciones') this.loadHorariosAsignaciones();
    else if (t === 'sin-horario') this.loadEmpleadosSinHorario();
    else this.loadHorarios();
  }

  loadHorariosAsignaciones(): void {
    this.loading = true;
    this.svc.getAsignacionesHorario().subscribe({
      next: d => { this.horariosAsignaciones = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  loadEmpleadosSinHorario(): void {
    this.loading = true;
    this.svc.getEmpleadosSinHorario().subscribe({
      next: d => { this.horariosSinHorario = d; this.loading = false; },
      error: e => this.onError(e),
    });
  }

  // ── Generar Planilla ──
  generarPlanilla(): void {
    this.planillaGenerando = true;
    this.planillaGenMsg = '';
    this.svc.generarPlanilla(this.ejercicio, this.mes).subscribe({
      next: (d: any) => {
        this.planillaGenerando = false;
        this.planillaGenMsg = d.mensaje || 'Planilla generada correctamente';
        this.loadPlanillas();
      },
      error: (e: any) => {
        this.planillaGenerando = false;
        this.planillaGenMsg = e?.message || 'Error al generar planilla';
      },
    });
  }

  // ── Guardar Finiquito ──
  guardarFiniquito(): void {
    if (!this.finiquitoEmpleadoId || !this.finiquitoFecha) {
      this.error = 'Seleccione empleado y fecha de retiro';
      return;
    }
    this.finiquitoGuardando = true;
    this.finiquitoGuardarMsg = '';
    this.svc.guardarFiniquito({
      id_empleado: this.finiquitoEmpleadoId,
      fecha_retiro: this.finiquitoFecha,
      motivo: this.finiquitoMotivo,
    }).subscribe({
      next: () => {
        this.finiquitoGuardando = false;
        this.finiquitoGuardarMsg = 'Finiquito guardado correctamente';
        this.finiquitoCalculo = null;
        this.loadFiniquitos();
      },
      error: (e: any) => {
        this.finiquitoGuardando = false;
        this.finiquitoGuardarMsg = e?.message || 'Error al guardar finiquito';
      },
    });
  }

  // ── Capacitación CRUD ──
  openCapForm(cap?: Capacitacion): void {
    this.capEditing = cap || null;
    this.capForm = cap
      ? { titulo: cap.titulo, tipo: cap.tipo, fecha_inicio: cap.fecha_inicio, fecha_fin: cap.fecha_fin || '', horas_duracion: cap.horas_duracion || '', es_obligatoria: cap.es_obligatoria }
      : { titulo: '', tipo: 'INTERNA', fecha_inicio: '', fecha_fin: '', horas_duracion: '', es_obligatoria: false };
    this.capFormError = '';
    this.capFormOpen = true;
  }

  closeCapForm(): void { this.capFormOpen = false; }

  submitCapacitacion(): void {
    if (!this.capForm['titulo'] || !this.capForm['fecha_inicio']) {
      this.capFormError = 'Complete título y fecha de inicio';
      return;
    }
    const obs = this.capEditing
      ? this.svc.actualizarCapacitacion(this.capEditing.id, this.capForm)
      : this.svc.crearCapacitacion(this.capForm);
    obs.subscribe({
      next: () => { this.capFormOpen = false; this.loadTab(); },
      error: (e: any) => this.capFormError = e?.message || 'Error',
    });
  }

  // ── Evaluación CRUD ──
  openEvalForm(ev?: any): void {
    this.evalEditing = ev || null;
    this.evalForm = ev
      ? { id_empleado: ev.id_empleado, periodo: ev.periodo, puntaje: ev.puntaje || '', observaciones: ev.observaciones || '' }
      : { id_empleado: 0, periodo: `${this.ejercicio}-S1`, puntaje: '', observaciones: '' };
    this.evalFormError = '';
    this.evalFormOpen = true;
  }

  closeEvalForm(): void { this.evalFormOpen = false; }

  submitEvaluacion(): void {
    if (!this.evalForm['id_empleado'] || !this.evalForm['periodo']) {
      this.evalFormError = 'Complete empleado y período';
      return;
    }
    const obs = this.evalEditing
      ? this.svc.actualizarEvaluacion(this.evalEditing.id, this.evalForm)
      : this.svc.crearEvaluacion(this.evalForm);
    obs.subscribe({
      next: () => { this.evalFormOpen = false; this.loadTab(); },
      error: (e: any) => this.evalFormError = e?.message || 'Error',
    });
  }

  // ── Parámetro CRUD ──
  openParamForm(param?: ParametroGestion): void {
    this.paramEditing = param || null;
    this.paramForm = param
      ? { codigo: param.codigo, valor: param.valor, descripcion: param.descripcion, norma_referencia: param.norma_referencia || '', gestion: param.gestion }
      : { codigo: '', valor: 0, descripcion: '', norma_referencia: '', gestion: this.ejercicio };
    this.paramFormError = '';
    this.paramFormSuccess = '';
    this.paramFormOpen = true;
  }

  closeParamForm(): void { this.paramFormOpen = false; }

  submitParametro(): void {
    if (!this.paramForm['codigo'] || !this.paramForm['descripcion']) {
      this.paramFormError = 'Complete código y descripción';
      return;
    }
    const obs = this.paramEditing
      ? this.svc.actualizarParametro(this.paramEditing.id, this.paramForm)
      : this.svc.crearParametro(this.paramForm);
    obs.subscribe({
      next: () => { this.paramFormOpen = false; this.loadTab(); },
      error: (e: any) => this.paramFormError = e?.message || 'Error',
    });
  }

  // ── Feriado CRUD ──
  openFeriadoForm(feriado?: any): void {
    this.feriadoEditing = feriado || null;
    this.feriadoForm = feriado
      ? { fecha: feriado.fecha, nombre: feriado.nombre, tipo: feriado.tipo || 'NACIONAL' }
      : { fecha: '', nombre: '', tipo: 'NACIONAL' };
    this.feriadoFormError = '';
    this.feriadoFormOpen = true;
  }

  closeFeriadoForm(): void { this.feriadoFormOpen = false; }

  submitFeriado(): void {
    if (!this.feriadoForm['fecha'] || !this.feriadoForm['nombre']) {
      this.feriadoFormError = 'Complete fecha y nombre';
      return;
    }
    const obs = this.feriadoEditing
      ? this.svc.actualizarFeriado(this.feriadoEditing.id, this.feriadoForm)
      : this.svc.crearFeriado(this.feriadoForm);
    obs.subscribe({
      next: () => { this.feriadoFormOpen = false; this.loadTab(); },
      error: (e: any) => this.feriadoFormError = e?.message || 'Error',
    });
  }

  eliminarFeriado(id: number): void {
    this.svc.eliminarFeriado(id).subscribe({
      next: () => this.loadTab(),
      error: (e: any) => this.error = e?.message || 'Error al eliminar feriado',
    });
  }

  // ── Contrato CRUD ──
  openContratoForm(contrato?: Contrato): void {
    this.contratoEditing = contrato || null;
    this.contratoForm = contrato
      ? { id_empleado: contrato.id_empleado, tipo_contrato: contrato.tipo_contrato, fecha_inicio: contrato.fecha_inicio, fecha_fin: contrato.fecha_fin || '', sueldo_base: contrato.sueldo_base, id_cargo: contrato.id_cargo || 0, id_agencia: contrato.id_agencia || 0 }
      : { id_empleado: this.empleadoDetalle?.empleado?.id || 0, tipo_contrato: 'INDEFINIDO', fecha_inicio: '', fecha_fin: '', sueldo_base: 0, id_cargo: 0, id_agencia: 0 };
    this.contratoFormError = '';
    this.contratoFormOpen = true;
  }

  closeContratoForm(): void { this.contratoFormOpen = false; }

  submitContrato(): void {
    if (!this.contratoForm['id_empleado'] || !this.contratoForm['fecha_inicio'] || !this.contratoForm['sueldo_base']) {
      this.contratoFormError = 'Complete empleado, fecha de inicio y sueldo';
      return;
    }
    const obs = this.contratoEditing
      ? this.svc.actualizarContrato(this.contratoEditing.id, this.contratoForm)
      : this.svc.crearContrato(this.contratoForm);
    obs.subscribe({
      next: () => {
        this.contratoFormOpen = false;
        if (this.empleadoDetalle) this.openEmpleado(this.empleadoDetalle.empleado.id);
      },
      error: (e: any) => this.contratoFormError = e?.message || 'Error',
    });
  }

  rescindirContrato(id: number): void {
    this.svc.rescindirContrato(id).subscribe({
      next: () => {
        if (this.empleadoDetalle) this.openEmpleado(this.empleadoDetalle.empleado.id);
      },
      error: (e: any) => this.error = e?.message || 'Error al rescindir contrato',
    });
  }

  // ── CSBP CRUD ──
  openCsbpAltaForm(): void {
    this.csbpAltaForm = { id_contrato: 0, fecha_alta: '', descripcion: '' };
    this.csbpFormError = '';
    this.csbpAltaFormOpen = true;
  }

  closeCsbpAltaForm(): void { this.csbpAltaFormOpen = false; }

  submitCsbpAlta(): void {
    if (!this.csbpAltaForm['id_contrato'] || !this.csbpAltaForm['fecha_alta']) {
      this.csbpFormError = 'Complete contrato y fecha de alta';
      return;
    }
    this.svc.crearCsbpAlta(this.csbpAltaForm).subscribe({
      next: () => { this.csbpAltaFormOpen = false; this.loadCsbpAltas(); },
      error: (e: any) => this.csbpFormError = e?.message || 'Error',
    });
  }

  openCsbpBajaForm(): void {
    this.csbpBajaForm = { id_contrato: 0, fecha_baja: '', descripcion: '' };
    this.csbpFormError = '';
    this.csbpBajaFormOpen = true;
  }

  closeCsbpBajaForm(): void { this.csbpBajaFormOpen = false; }

  submitCsbpBaja(): void {
    if (!this.csbpBajaForm['id_contrato'] || !this.csbpBajaForm['fecha_baja']) {
      this.csbpFormError = 'Complete contrato y fecha de baja';
      return;
    }
    this.svc.crearCsbpBaja(this.csbpBajaForm).subscribe({
      next: () => { this.csbpBajaFormOpen = false; this.loadCsbpBajas(); },
      error: (e: any) => this.csbpFormError = e?.message || 'Error',
    });
  }

  openCsbpAporteForm(): void {
    this.csbpAporteForm = { gestion: this.ejercicio, mes: this.mes, total_aporte: 0 };
    this.csbpFormError = '';
    this.csbpAporteFormOpen = true;
  }

  closeCsbpAporteForm(): void { this.csbpAporteFormOpen = false; }

  submitCsbpAporte(): void {
    if (!this.csbpAporteForm['total_aporte']) {
      this.csbpFormError = 'Ingrese el total del aporte';
      return;
    }
    this.svc.crearCsbpAporte(this.csbpAporteForm).subscribe({
      next: () => { this.csbpAporteFormOpen = false; this.loadCsbpAportes(); },
      error: (e: any) => this.csbpFormError = e?.message || 'Error',
    });
  }

  // ── Gestora CRUD ──
  openGestoraForm(): void {
    this.gestoraForm = { id_contrato: 0, nombre_gestora: 'FUTURO DE BOLIVIA AFP', fecha_inicio: '' };
    this.gestoraFormError = '';
    this.gestoraFormOpen = true;
  }

  closeGestoraForm(): void { this.gestoraFormOpen = false; }

  submitGestora(): void {
    if (!this.gestoraForm['id_contrato'] || !this.gestoraForm['nombre_gestora'] || !this.gestoraForm['fecha_inicio']) {
      this.gestoraFormError = 'Complete todos los campos';
      return;
    }
    this.svc.crearGestora(this.gestoraForm).subscribe({
      next: () => { this.gestoraFormOpen = false; this.loadGestoras(); },
      error: (e: any) => this.gestoraFormError = e?.message || 'Error',
    });
  }

  // ── Horario CRUD ──
  openHorarioForm(): void {
    this.horarioForm = { nombre: '', dia: 'LUNES', hora_inicio: '08:00', hora_fin: '12:00' };
    this.horarioFormError = '';
    this.horarioFormOpen = true;
  }

  closeHorarioForm(): void { this.horarioFormOpen = false; }

  submitHorario(): void {
    if (!this.horarioForm['nombre'] || !this.horarioForm['dia']) {
      this.horarioFormError = 'Complete nombre y día';
      return;
    }
    this.svc.crearHorario(this.horarioForm).subscribe({
      next: () => { this.horarioFormOpen = false; this.loadHorarios(); },
      error: (e: any) => this.horarioFormError = e?.message || 'Error',
    });
  }

  desactivarHorario(id: number): void {
    this.svc.desactivarHorario(id).subscribe({
      next: () => this.loadHorarios(),
      error: (e: any) => this.error = e?.message || 'Error al desactivar horario',
    });
  }

  openHorarioAsignarForm(): void {
    this.horarioAsignarForm = { id_contrato: 0, id_horario: 0, vigencia_desde: '' };
    this.horarioFormError = '';
    this.horarioAsignarFormOpen = true;
  }

  closeHorarioAsignarForm(): void { this.horarioAsignarFormOpen = false; }

  submitHorarioAsignar(): void {
    if (!this.horarioAsignarForm['id_contrato'] || !this.horarioAsignarForm['id_horario'] || !this.horarioAsignarForm['vigencia_desde']) {
      this.horarioFormError = 'Complete todos los campos';
      return;
    }
    this.svc.asignarHorario(this.horarioAsignarForm).subscribe({
      next: () => { this.horarioAsignarFormOpen = false; this.loadHorariosAsignaciones(); },
      error: (e: any) => this.horarioFormError = e?.message || 'Error',
    });
  }

  diaLabel(d: string): string {
    const map: Record<string, string> = {
      LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue',
      VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom',
    };
    return map[d] || d;
  }

  private onError(e: any): void {
    this.error = e?.message || 'Error inesperado';
    this.loading = false;
  }

  num(v: number | null | undefined, decimals = 2): string {
    if (v === null || v === undefined) return '-';
    return v.toLocaleString('es-BO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  tipoContratoLabel(t: string): string {
    const map: Record<string, string> = {
      INDEFINIDO: 'Indefinido',
      PLAZO_FIJO: 'Plazo fijo',
      TEMPORADA: 'Temporada',
      OBRA_SERVICIO: 'Obra/Servicio',
      TELETRABAJO: 'Teletrabajo',
    };
    return map[t] || t;
  }

  motivoLabel(m: string): string {
    const map: Record<string, string> = {
      RENUNCIA: 'Renuncia voluntaria',
      DESPIDO_JUSTIFICADO: 'Despido justificado',
      DESPIDO_INJUSTIFICADO: 'Despido injustificado',
      FIN_CONTRATO: 'Fin de contrato',
      FALLECIMIENTO: 'Fallecimiento',
    };
    return map[m] || m;
  }

  estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'A': case 'VIGENTE': case 'APROBADA': case 'PAGADA': case 'COMPLETADA': case 'APROBADO': return 'active';
      case 'D': case 'RESCINDIDO': case 'ANULADA': case 'RECHAZADA': case 'CANCELADA': case 'REPROBADO': return 'closed';
      default: return 'inactive';
    }
  }

  Math = Math;

  meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
}
