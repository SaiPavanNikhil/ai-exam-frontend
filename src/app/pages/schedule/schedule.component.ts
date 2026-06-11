import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { environment } from '../../environments/environment.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    
    RouterModule
  ],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css'
})
export class ScheduleComponent implements OnInit {

  // private apiUrl = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ==========================================================
  // GENERAL
  // ==========================================================

  loggedUser: any = null;
  isLoading = false;
  apiError = '';

  currentStep = 1;
  scheduleSuccess = false;

  generatedInterviewId = '';

  // ==========================================================
  // COURSE
  // ==========================================================

  courses: string[] = [
    'BBA',
    'MBA',
    'B-Tech',
    'MCA',
    'B.Com',
    'M.Com'
  ];

  selectedCourse = '';

  // ==========================================================
  // CANDIDATES
  // ==========================================================

  candidates: any[] = [];

  selectedCandidateId: number | null = null;

  selectedCandidate: any = null;

  // ==========================================================
  // INTERVIEW DETAILS
  // ==========================================================

  interviewDate = '';
  startTime = '';
  endTime = '';

  // ==========================================================
  // PANEL
  // ==========================================================

  panelMode: 'existing' | 'new' = 'new';

  existingPanels: any[] = [];

  selectedPanelId: number | null = null;

  newPanelName = '';

  chairmanUserId: number | null = null;

  selectedMembers: any[] = [];

  availableMembers: any[] = [];

  // ==========================================================
  // VIEW ALL INTERVIEWS
  // ==========================================================

  showAllInterviews = false;

  allInterviews: any[] = [];

  interviewsLoading = false;

  interviewsError = '';

  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loggedUser =
      JSON.parse(localStorage.getItem('user') || 'null');

   

    this.loadUsersFromBackend();

    this.loadPanels();

  }

  // ==========================================================
  // LOAD COURSES
  // ==========================================================


  // ==========================================================
  // COURSE CHANGED
  // ==========================================================

  onCourseChange(): void {

    this.selectedCandidate = null;

    this.selectedCandidateId = null;

    this.candidates = [];

    if (!this.selectedCourse) {

      return;

    }

    this.http.get<any>(
      `${environment.apiBaseUrl}/api/candidates/course/${this.selectedCourse}`
    ).subscribe({

      next: (res) => {

        if (res.success) {

          this.candidates = res.candidates;

        }

      },

      error: (err) => {

        console.error(err);

      }

    });

  }

  // ==========================================================
  // CANDIDATE CHANGED
  // ==========================================================

  onCandidateChange(): void {

    this.selectedCandidate =
      this.candidates.find(
        c => c.id == this.selectedCandidateId
      );

  }

  // ==========================================================
  // INTERVIEW ID
  // ==========================================================

  generateInterviewId(): void {

    if (!this.generatedInterviewId) {

      this.generatedInterviewId =
        'IVW-' +
        new Date().getFullYear() +
        '-' +
        Math.floor(1000 + Math.random() * 9000);

    }

  }

  // ==========================================================
  // LOAD USERS
  // ==========================================================

  loadUsersFromBackend(): void {

    this.http.get<any>(
      `${environment.apiBaseUrl}/api/users/interviewers`
    ).subscribe({

      next: (res) => {

        if (res.success) {

          this.availableMembers =
            res.data.filter(
              (u: any) => u.role === 'member'
            );

        }

      },

      error: (err) => {

        console.error(err);

      }

    });

  }

  // ==========================================================
  // LOAD PANELS
  // ==========================================================

  loadPanels(): void {

    this.http.get<any>(
      `${environment.apiBaseUrl}/api/panels`
    ).subscribe({

      next: (res) => {

        if (res.success) {

          this.existingPanels = res.data;

        }

      },

      error: (err) => {

        console.error(err);

      }

    });

  }

  // ==========================================================
  // MEMBER FUNCTIONS
  // ==========================================================

  addMember(event: Event): void {

    const id =
      Number(
        (event.target as HTMLSelectElement).value
      );

    if (!id) {

      return;

    }

    const member =
      this.availableMembers.find(
        m => m.id === id
      );

    if (
      member &&
      !this.isMemberSelected(id)
    ) {

      this.selectedMembers.push(member);

      if (this.selectedMembers.length === 1) {

        this.chairmanUserId = member.id;

      }

    }

    (event.target as HTMLSelectElement).value = '';

  }

  removeMember(id: number): void {

    this.selectedMembers =
      this.selectedMembers.filter(
        m => m.id !== id
      );

    if (this.chairmanUserId === id) {

      this.chairmanUserId =
        this.selectedMembers.length
          ? this.selectedMembers[0].id
          : null;

    }

  }

  setChairman(id: number): void {

    this.chairmanUserId = id;

  }

  isMemberSelected(id: number): boolean {

    return this.selectedMembers.some(
      m => m.id === id
    );

  }

  getChairmanName(): string {

    const chairman =
      this.selectedMembers.find(
        m => m.id === this.chairmanUserId
      );

    return chairman
      ? chairman.name
      : 'Not Assigned';

  }

  get panelAssigned(): string {

    if (this.panelMode === 'existing') {

      const panel =
        this.existingPanels.find(
          p => p.id == this.selectedPanelId
        );

      return panel
        ? panel.panel_name
        : '-';

    }

    return this.newPanelName || '-';

  }

    // ==========================================================
  // VALIDATIONS
  // ==========================================================

  canProceedStep1(): boolean {

     console.log({
      selectedCourse: this.selectedCourse,
      selectedCandidate: this.selectedCandidate,
      interviewDate: this.interviewDate,
      startTime: this.startTime,
      endTime: this.endTime,
      panelMode: this.panelMode,
      selectedPanelId: this.selectedPanelId,
      selectedMembers: this.selectedMembers.length,
      chairmanUserId: this.chairmanUserId
    });

    const basicValid =
      !!(
        this.selectedCourse &&
        this.selectedCandidate &&
        this.interviewDate &&
        this.startTime &&
        this.endTime
      );

    const panelValid =
      this.panelMode === 'existing'
        ? !!this.selectedPanelId
        : (
            this.selectedMembers.length > 0 &&
            this.chairmanUserId != null
          );

    return basicValid && panelValid;

  }

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  goToStep(step: number): void {

    if (step < this.currentStep) {

      this.currentStep = step;

      return;

    }

    if (step === 2 && this.canProceedStep1()) {

      this.generateInterviewId();

      this.currentStep = 2;

    }

    if (step === 3 && this.currentStep === 2) {

      this.currentStep = 3;

    }

  }

  nextStep(): void {

    if (this.currentStep === 1) {

      this.generateInterviewId();

      this.currentStep = 2;

      return;

    }

    if (this.currentStep === 2) {

      this.currentStep = 3;

      return;

    }

  }

  // ==========================================================
  // SCHEDULE INTERVIEW
  // ==========================================================

  scheduleInterview(): void {

    this.isLoading = true;

    this.apiError = '';

    const payload: any = {

      candidate_id:
        this.selectedCandidateId,

      interview_category:
        this.selectedCourse,

      interview_date:
        this.interviewDate,

      start_time:
        this.startTime,

      end_time:
        this.endTime,

      interview_id:
        this.generatedInterviewId

    };

    if (this.panelMode === 'existing') {

      payload.panel_id =
        this.selectedPanelId;

    }

    else {

      payload.panel_name =
        this.newPanelName ||
        `${this.selectedCourse} Panel`;

      payload.chairman_user_id =
        this.chairmanUserId;

      payload.member_user_ids =
        this.selectedMembers.map(
          m => m.id
        );

    }

    this.http.post<any>(
      `${environment.apiBaseUrl}/api/interviews/schedule`,
      payload
    ).subscribe({

      next: (res) => {

        this.isLoading = false;

        if (res.success) {

          this.scheduleSuccess = true;

          this.currentStep = 4;

        }

        else {

          this.apiError =
            res.message;

        }

      },

      error: (err) => {

        this.isLoading = false;

        this.apiError =
          err.error?.detail ||
          'Unable to schedule interview.';

      }

    });

  }

  // ==========================================================
  // VIEW ALL INTERVIEWS
  // ==========================================================

  openAllInterviews(): void {

    this.showAllInterviews = true;

    this.loadAllInterviews();

  }

  closeAllInterviews(): void {

    this.showAllInterviews = false;

  }

  loadAllInterviews(): void {

    this.interviewsLoading = true;

    this.http.get<any>(
      `${environment.apiBaseUrl}/api/interviews`
    ).subscribe({

      next: (res) => {

        this.interviewsLoading = false;

        if (res.success) {

          this.allInterviews = res.data;

        }

      },

      error: () => {

        this.interviewsLoading = false;

        this.interviewsError =
          'Unable to load interviews';

      }

    });

  }

  // ==========================================================
  // DELETE INTERVIEW
  // ==========================================================

  confirmDeleteInterview(
    interviewId: string
  ): void {

    if (
      !confirm(
        `Delete Interview ${interviewId}?`
      )
    ) {

      return;

    }

    this.http.delete<any>(
      `${environment.apiBaseUrl}/api/interviews/${interviewId}`
    ).subscribe({

      next: (res) => {

        if (res.success) {

          this.loadAllInterviews();

        }

      }

    });

  }

  // ==========================================================
  // STATUS
  // ==========================================================

  getStatusClass(status: string): string {

    switch (
      status?.toLowerCase()
    ) {

      case 'scheduled':

        return 'status-scheduled';

      case 'completed':

        return 'status-completed';

      case 'cancelled':

        return 'status-cancelled';

      default:

        return 'status-scheduled';

    }

  }

  get completedCount(): number {

    return this.allInterviews.filter(
      i =>
        i.status?.toLowerCase() ===
        'completed'
    ).length;

  }

  get scheduledCount(): number {

    return this.allInterviews.filter(
      i =>
        i.status?.toLowerCase() ===
        'scheduled'
    ).length;

  }

  // ==========================================================
  // DATE FORMAT
  // ==========================================================

  formatScheduledAt(
    value: string
  ): {
    date: string;
    time: string;
  } {

    if (!value) {

      return {

        date: '-',
        time: '-'

      };

    }

    const d = new Date(value);

    return {

      date:
        d.toLocaleDateString(),

      time:
        d.toLocaleTimeString([], {

          hour: '2-digit',

          minute: '2-digit'

        })

    };

  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  logout(): void {

    localStorage.clear();

    sessionStorage.clear();

    this.router.navigate(['/']);

  }

  // ==========================================================
  // RESET
  // ==========================================================

  resetForm(): void {

    this.currentStep = 1;

    this.scheduleSuccess = false;

    this.generatedInterviewId = '';

    this.selectedCourse = '';

    this.candidates = [];

    this.selectedCandidate = null;

    this.selectedCandidateId = null;

    this.interviewDate = '';

    this.startTime = '';

    this.endTime = '';

    this.panelMode = 'new';

    this.selectedPanelId = null;

    this.newPanelName = '';

    this.selectedMembers = [];

    this.chairmanUserId = null;

    this.apiError = '';

    this.isLoading = false;

  }

  
}