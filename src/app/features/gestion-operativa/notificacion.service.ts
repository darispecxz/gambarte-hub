import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificacionLista, ConteoNoLeidas } from './notificacion.models';

interface Envelope<T> { success: boolean; data: T; message: string; }

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/notificaciones`;

  private unwrap<T>(o: Observable<Envelope<T>>): Observable<T> {
    return o.pipe(map(r => {
      if (!r?.success) throw new Error(r?.message || 'Error de API');
      return r.data;
    }));
  }

  listar(filtros: Record<string, any> = {}): Observable<NotificacionLista> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filtros)) {
      if (v != null && v !== '') params = params.set(k, v.toString());
    }
    return this.unwrap(this.http.get<Envelope<NotificacionLista>>(this.base, { params }));
  }

  contarNoLeidas(agencia?: number): Observable<ConteoNoLeidas> {
    let params = new HttpParams();
    if (agencia) params = params.set('agencia', agencia.toString());
    return this.unwrap(this.http.get<Envelope<ConteoNoLeidas>>(`${this.base}/no-leidas`, { params }));
  }

  marcarLeida(id: number): Observable<void> {
    return this.unwrap(this.http.post<Envelope<void>>(`${this.base}/leer`, { id }));
  }

  marcarTodasLeidas(tipo?: string): Observable<void> {
    return this.unwrap(this.http.post<Envelope<void>>(`${this.base}/leer-todas`, { tipo }));
  }
}
