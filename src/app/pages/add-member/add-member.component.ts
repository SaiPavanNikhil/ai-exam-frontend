import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';


@Component({
  selector: 'app-add-member',
  standalone: true,   // ✅ REQUIRED
  imports: [FormsModule, CommonModule],
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.css']  // ✅ FIXED
})
export class AddMemberComponent {

  constructor(private http: HttpClient,private router: Router) { }

  member = {
    name: '',
    email: '',
    password: '',
    role: 'member',   // ✅ default
    designation: '',
    memberType: ''
  };

  onSubmit(form: any) {
    if (form.valid) {

      const payload = {
        name: this.member.name,
        email: this.member.email,
        password: this.member.password,
        role: this.member.role,
        designation: this.member.designation,
        memberType: this.member.memberType   // ✅ added
      };

      this.http.post(`${environment.apiBaseUrl}/register`, payload)
        .subscribe({
          next: (res) => {
            console.log('Saved:', res);
            alert('Member added successfully!');
            form.resetForm();

            this.member = {
              name: '',
              email: '',
              password: '',
              role: 'member',
              designation: '',
              memberType: ''
            };
          },
          error: (err) => {
            console.error(err);
            alert('Error saving member');
          }
        });
    }
  }

  goBack() {
    this.router.navigate(['/schedule']);
  }
}