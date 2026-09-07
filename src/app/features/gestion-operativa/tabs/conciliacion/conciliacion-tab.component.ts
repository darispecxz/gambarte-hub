import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestionOperativaService } from '../../gestion-operativa.service';
import { ConciliacionRemesas } from '../../gestion-operativa.models';
import { fmt } from '../../gestion-operativa.utils';

@Component({
  selector: 'app-conciliacion-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conciliacion-tab.component.html',
})
export class ConciliacionTabComponent implements OnInit, OnChanges {
  @Input({ required: true }) fecha!: string;
  @Input() version = 0;

  private svc = inject(GestionOperativaService);

  conciliacion: ConciliacionRemesas | null = null;
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
    this.svc.getConciliacionRemesas(this.fecha).subscribe({
      next: (d) => { this.conciliacion = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
