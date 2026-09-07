export type TipoNotificacion = 'fondeo' | 'operacion' | 'riesgo' | 'reporte' | 'cumplimiento';
export type UrgenciaNotificacion = 'critica' | 'alta' | 'media' | 'baja';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  urgencia: UrgenciaNotificacion;
  codigo: string;
  titulo: string;
  mensaje: string;
  datos: Record<string, any> | null;
  idAgencia: number | null;
  agencia: string | null;
  leida: boolean;
  fechaCreacion: string;
}

export interface NotificacionLista {
  items: Notificacion[];
  total: number;
}

export interface ConteoNoLeidas {
  total: number;
  critica: number;
  alta: number;
  media: number;
  baja: number;
}
