import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  loggedUser: any = null;

  constructor(private router: Router) {
    this.loggedUser = JSON.parse(localStorage.getItem('user') || 'null');
  }

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['']);
  }
}
