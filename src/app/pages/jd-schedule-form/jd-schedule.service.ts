import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JobDescription {
  id: number;
  title: string;
}

export interface CourseMaster {
  course_id: number;
  course_code: string;
  course_name: string;
  branch_name: string;
}

export interface EligibilityItem {
  course_id: number;
  year: string;
}

export interface JDScheduleCreate {
  jd_id: number;
  eligibility: EligibilityItem[];
  panel_id?: number | null;
  panel_name?: string;
  chairman_user_id?: number | null;
  member_user_ids?: number[];
}

export interface JDScheduleOut {
  id: number;
  jd_id: number;
  panel_id: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class JdScheduleService {

  private apiBase = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  getJobDescriptions(): Observable<JobDescription[]> {
    return this.http.get<JobDescription[]>(`${this.apiBase}/job-descriptions`);
  }

  getCourses(): Observable<CourseMaster[]> {
    return this.http.get<CourseMaster[]>(`${this.apiBase}/course-master`);
  }

  saveSchedule(payload: JDScheduleCreate): Observable<JDScheduleOut> {
    return this.http.post<JDScheduleOut>(`${this.apiBase}/jd-schedule`, payload);
  }
}