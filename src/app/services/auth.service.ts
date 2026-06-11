import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

    private baseUrl = 'https://ai-exam-backend-code-production.up.railway.app'; // FastAPI URL

  constructor(private http: HttpClient) {}

  // ✅ Login API
  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

   getUser(userId: number) {
    return this.http.get(`${this.baseUrl}/user/${userId}`);
  }
}
