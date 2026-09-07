import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { MovimientoAgencia } from '../../gestion-operativa.models';
import { fmt } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-movimientos-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movimientos-tab.component.html',
  styleUrl: './movimientos-tab.component.scss',
})
export class MovimientosTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  movimientosDia: MovimientoAgencia[] = [];
  loading = true;

  fmt = fmt;

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['fecha']?.firstChange && !changes['version']?.firstChange) {
      this.loadData();
    }
  }

  private loadData(): void {
    this.loading = true;
    this.svc.getMovimientosDia(this.fecha).subscribe({
      next: (d) => { this.movimientosDia = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
