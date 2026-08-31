import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {


  //  private baseUrl = 'https://ai-exam-backend-code-production.up.railway.app';
   private baseUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

   getInterviewDetails(userId: number) {
    return this.http.get(`${this.baseUrl}/interviews/formatted/${userId}`);
  }


  getByUser(userId: number) {
    return this.http.get(`${this.baseUrl}/interviews/user/${userId}`);
  }

  getMemberInterviews(userId: number, candidateId: number) {
    return this.http.get(`${this.baseUrl}/member/interviews/${userId}/${candidateId}`);
  }

  getInterviewCandidates(interviewId: string) {
    return this.http.get<any>(
      `${this.baseUrl}/interviews/candidates/${interviewId}`
    );
  }
}
