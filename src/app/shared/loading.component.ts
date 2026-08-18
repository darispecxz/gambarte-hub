import { Component, Input } from '@angular/core';

/** Spinner de carga reutilizable. */
@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading-block">
      <span class="spin lg"></span>
      <span>{{ message }}</span>
    </div>
  `,
})
export class LoadingComponent {
  @Input() message = 'Cargando…';
}
