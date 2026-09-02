import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  // private baseUrl = 'https://ai-exam-backend-code-production.up.railway.app';
  private baseUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  getDashboard(userId: number) {
    return this.http.get(`${this.baseUrl}/dashboard/${userId}`);
  }

  getCandidate(id: number) {
  return this.http.get(`${this.baseUrl}/candidate/${id}`);
 }

//    getQA(id: number) {
//   return this.http.get(`${this.baseUrl}/qa-evaluation-log/${id}`);
//  }

 getQA(candidateId: number, memberId: number, interviewId: string) {
  return this.http.get(`${this.baseUrl}/qa-evaluation-log/${candidateId}/${memberId}/${interviewId}`);
}

getPanelMembers(panelId: number, interviewId: string,candidateId: number) {
  return this.http.get(`${this.baseUrl}/panel-members/${panelId}/${interviewId}/${candidateId}`);
}

saveEvaluation(payload: any) {
  return this.http.post(`${this.baseUrl}/final-evaluation`, payload);
}

saveFinalVerdict(data: any) {
  return this.http.post(`${this.baseUrl}/save-final-verdict`, data);
}

getFinalMark(candidateId: number, memberId: number, interviewId: String) {
  return this.http.get(`${this.baseUrl}/final-mark/${candidateId}/${memberId}/${interviewId}`);
}

getPanelQuestionScores(panelId: number, interviewId: String) {
  return this.http.get(`${this.baseUrl}/panel-question-scores/${panelId}/${interviewId}`);
}


getPanelEvaluationFinalMark(panelId: number,interviewId: String) {
  return this.http.get(`${this.baseUrl}/panel-evaluation-final-mark/${panelId}/${interviewId}`);
}

getFinalVerdict(candidateId: number, memberId: number) {
  return this.http.get<any>(
    `${this.baseUrl}/final-remark/${candidateId}/${memberId}`
  );
}

getVideoAnalysis(interviewId: string, candidateId: number) {

  return this.http.get<any>(
    `${this.baseUrl}/api/interviews/video-analysis/${interviewId}/${candidateId}`
  );

}
}
