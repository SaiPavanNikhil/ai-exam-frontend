import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
// import { environment } from '../../environments/environment.service';
import {
  JdScheduleService,
  JobDescription,
  CourseMaster
} from './jd-schedule.service';
import { environment } from '../../environments/environment.service';
// import { environment } from '../environments/environment.service';

interface EligibilityRow {
  course_id: number;
  course_label: string;
  year: string;
}

@Component({
  selector: 'app-jd-schedule-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jd-schedule-form.component.html',
  styleUrls: ['./jd-schedule-form.component.css']
})
export class JdScheduleFormComponent implements OnInit {

  jdList: JobDescription[] = [];
  courseList: CourseMaster[] = [];
  yearList: string[] = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  selectedJdId: number | null = null;
  selectedCourseId: number | null = null;
  selectedYear: string = '';

  eligibilityRows: EligibilityRow[] = [];

  // ===== Interview Committee (reused from Schedule Interview) =====
  panelMode: 'existing' | 'new' = 'existing';
  existingPanels: any[] = [];
  selectedPanelId: number | null = null;
  existingPanelMembers: any[] = [];
  existingChairmanId: number | null = null;

  newPanelName = '';
  availableMembers: any[] = [];
  selectedMembers: any[] = [];
  chairmanUserId: number | null = null;

  loading = false;
  saving = false;
  errorMsg = '';

  constructor(
    private scheduleService: JdScheduleService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.scheduleService.getJobDescriptions().subscribe({
      next: data => this.jdList = data,
      error: () => this.errorMsg = 'Failed to load job descriptions'
    });

    this.scheduleService.getCourses().subscribe({
      next: data => {
        this.courseList = data;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Failed to load courses';
        this.loading = false;
      }
    });

    this.loadPanels();
    this.loadInterviewers();
  }

  // ===== Eligibility =====

  get canAdd(): boolean {
    return !!this.selectedCourseId && !!this.selectedYear;
  }

  addEligibilityRow(): void {
    if (!this.canAdd) return;

    const course = this.courseList.find(c => c.course_id === this.selectedCourseId);
    if (!course) return;

    const exists = this.eligibilityRows.some(
      r => r.course_id === this.selectedCourseId && r.year === this.selectedYear
    );
    if (exists) {
      this.errorMsg = 'This course + year combination is already added';
      return;
    }

    this.eligibilityRows.push({
      course_id: course.course_id,
      course_label: `${course.course_name} (${course.course_code})`,
      year: this.selectedYear
    });

    this.errorMsg = '';
    this.selectedCourseId = null;
    this.selectedYear = '';
  }

  removeEligibilityRow(index: number): void {
    this.eligibilityRows.splice(index, 1);
  }

  get showCommittee(): boolean {
    return !!this.selectedJdId && this.eligibilityRows.length > 0;
  }

  // ===== Interview Committee logic (mirrors ScheduleComponent) =====

  loadPanels(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/api/panels`).subscribe({
      next: (res) => {
        if (res.success) this.existingPanels = res.data;
      },
      error: (err) => console.error('Error loading panels', err)
    });
  }

  loadInterviewers(): void {
    this.http.get<any>(`${environment.apiBaseUrl}/api/users/interviewers`).subscribe({
      next: (res) => {
        if (res.success) {
          this.availableMembers = res.data.filter((u: any) => u.role === 'member');
        }
      },
      error: (err) => console.error('Error loading interviewers', err)
    });
  }

  onExistingPanelChange(): void {
    this.existingPanelMembers = [];
    this.existingChairmanId = null;

    if (!this.selectedPanelId) return;

    this.http.get<any>(`${environment.apiBaseUrl}/api/panels/${this.selectedPanelId}/members`).subscribe({
      next: (res) => {
        if (res.success) {
          this.existingPanelMembers = res.members || [];
          this.existingChairmanId = res.chairman_user_id;
        }
      },
      error: (err) => console.error('Error loading panel members', err)
    });
  }

  addMember(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (!id) return;

    const member = this.availableMembers.find(m => m.id === id);
    if (member && !this.isMemberSelected(id)) {
      this.selectedMembers.push(member);
      if (this.selectedMembers.length === 1) {
        this.chairmanUserId = member.id;
      }
    }
    (event.target as HTMLSelectElement).value = '';
  }

  removeMember(id: number): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.id !== id);
    if (this.chairmanUserId === id) {
      this.chairmanUserId = this.selectedMembers.length ? this.selectedMembers[0].id : null;
    }
  }

  setChairman(id: number): void {
    this.chairmanUserId = id;
  }

  isMemberSelected(id: number): boolean {
    return this.selectedMembers.some(m => m.id === id);
  }

  get canSaveCommittee(): boolean {
    return this.panelMode === 'existing'
      ? !!this.selectedPanelId
      : (this.selectedMembers.length > 0 && this.chairmanUserId != null && !!this.newPanelName);
  }

  // ===== Save =====

  get canSave(): boolean {
    return !!this.selectedJdId && this.eligibilityRows.length > 0 && this.canSaveCommittee;
  }

  onSave(): void {
    if (!this.canSave) return;

    this.saving = true;
    this.errorMsg = '';

    const payload: any = {
      jd_id: this.selectedJdId,
      eligibility: this.eligibilityRows.map(r => ({
        course_id: r.course_id,
        year: r.year
      }))
    };

    if (this.panelMode === 'existing') {
      payload.panel_id = this.selectedPanelId;
    } else {
      payload.panel_name = this.newPanelName;
      payload.chairman_user_id = this.chairmanUserId;
      payload.member_user_ids = this.selectedMembers.map(m => m.id);
    }

    this.scheduleService.saveSchedule(payload).subscribe({
      next: () => {
        this.saving = false;
        alert('JD schedule saved successfully');
        this.resetForm();
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = 'Failed to save schedule';
        console.error(err);
      }
    });
  }

  resetForm(): void {
    this.selectedJdId = null;
    this.eligibilityRows = [];
    this.panelMode = 'existing';
    this.selectedPanelId = null;
    this.existingPanelMembers = [];
    this.newPanelName = '';
    this.selectedMembers = [];
    this.chairmanUserId = null;
  }
}