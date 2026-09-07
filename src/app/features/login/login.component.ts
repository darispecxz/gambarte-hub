import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { AgenciaInfo } from '../../core/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  usuario = '';
  password = '';
  idAgencia = -1;
  agencies: AgenciaInfo[] = [];
  loadingAgencies = false;
  submitting = false;
  error = '';
  showPassword = false;
  currentYear = new Date().getFullYear();

  onUsuarioBlur(): void {
    const login = this.usuario.trim();
    if (!login) { this.agencies = []; return; }

    this.loadingAgencies = true;
    this.error = '';
    this.auth.getAgencies(login).subscribe({
      next: list => {
        this.agencies = list;
        this.idAgencia = list.length === 1 ? list[0].id_agencia : -1;
        this.loadingAgencies = false;
      },
      error: () => {
        this.agencies = [];
        this.loadingAgencies = false;
      },
    });
  }

  submit(): void {
    this.error = '';
    if (!this.usuario.trim() || !this.password || this.idAgencia < 0) {
      this.error = 'Complete todos los campos.';
      return;
    }

    this.submitting = true;
    this.auth.login({
      usuario: this.usuario.trim(),
      password: this.password,
      id_agencia: this.idAgencia,
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/tablero']);
      },
      error: err => {
        this.submitting = false;
        const body = err.error;
        this.error = body?.message ?? 'Error de conexión con el servidor.';
      },
    });
  }
}
