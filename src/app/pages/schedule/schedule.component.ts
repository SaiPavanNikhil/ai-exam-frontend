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

  courses: any[] = [];

  selectedCourseId: number | null = null;

  selectedCourse = '';

  // ==========================================================
  // CANDIDATES
  // ==========================================================

  candidates: any[] = [];

  selectedCandidateId: number | null = null;

  // Optional target headcount — informational only, no longer restricts selection
  studentCount: number | null = null;

  // Students added for this interview
  selectedCandidates: any[] = [];

  subjects: any[] = [];

  selectedSubjectId: number | null = null;

  // ==========================================================
  // INTERVIEW DETAILS
  // ==========================================================

  interviewDate = '';
  startTime = '';
  endTime = '';
  interviewName = '';

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

  todayDate: string = new Date().toISOString().split('T')[0];

  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loggedUser =
      JSON.parse(localStorage.getItem('user') || 'null');

    this.getCourses();

    this.loadUsersFromBackend();

    this.loadPanels();

  }

  // ==========================================================
  // COURSE CHANGED
  // ==========================================================

  onCourseChange(): void {

    this.selectedCandidates = [];
    this.selectedSubjectId = null;

    this.candidates = [];
    this.subjects = [];

    if (!this.selectedCourseId) {
      return;
    }

    // Fetch Candidates
    this.http.get<any[]>(
      `${environment.apiBaseUrl}/candidates/by-course/${this.selectedCourseId}`
    ).subscribe({

      next: (res) => {

        this.candidates = res || [];

        // Auto-select every candidate by default.
        // The user can uncheck anyone they don't want from the list.
        this.selectedCandidates = [...this.candidates];

      },

      error: (err) => {

        console.error('Error fetching candidates', err);

      }

    });

    // Fetch Subjects
    this.http.get<any[]>(
      `${environment.apiBaseUrl}/subjects/by-course/${this.selectedCourseId}`
    ).subscribe({

      next: (res) => {

        this.subjects = res || [];

      },

      error: (err) => {

        console.error('Error fetching subjects', err);

      }

    });

  }

  // ==========================================================
  // CANDIDATE CHANGED
  // ==========================================================

  onCandidateChange(): void {

    // for future reference
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

    if (this.panelMode === 'existing') {

      const chairman =
        this.existingPanelMembers.find(
          (m: any) => m.id === this.existingChairmanId
        );

      return chairman
        ? chairman.name
        : 'Not Assigned';

    }

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

    const basicValid =
      !!(
        this.interviewName &&
        this.selectedCourseId &&
        this.interviewDate &&
        this.startTime &&
        this.endTime &&
        this.selectedCandidates.length > 0
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

    if (!this.canProceedStep1()) {
      return;
    }

    this.generateInterviewId();

    this.currentStep = 3;

  }

  // ==========================================================
  // SCHEDULE INTERVIEW
  // ==========================================================

  scheduleInterview(): void {

    this.isLoading = true;

    this.apiError = '';

    const payload: any = {

      interview_id: this.generatedInterviewId,

      course_id: this.selectedCourseId,

      subject_id: this.selectedSubjectId,

      candidate_ids: this.selectedCandidates.map(
        c => c.id
      ),

      interview_date: this.interviewDate,

      start_time: this.startTime,

      end_time: this.endTime,

      interview_name: this.interviewName,

    };

    if (this.panelMode === 'existing') {

      payload.panel_id = this.selectedPanelId;

    }

    else {

      payload.panel_name =
        this.newPanelName ||
        `${this.getSelectedCourseName()} Panel`;

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

          this.generatedInterviewId =
            res.interview_id;

          this.currentStep = 4;

        }

        else {

          this.apiError =
            res.message ||
            'Unable to schedule interview.';

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

    this.selectedCourseId = null;

    this.selectedSubjectId = null;

    this.studentCount = null;

    this.candidates = [];

    this.subjects = [];

    this.selectedCandidateId = null;

    this.selectedCandidates = [];

    this.interviewDate = '';

    this.startTime = '';

    this.endTime = '';

    this.interviewName = '';

    this.panelMode = 'new';

    this.selectedPanelId = null;

    this.newPanelName = '';

    this.selectedMembers = [];

    this.chairmanUserId = null;

    this.apiError = '';

    this.isLoading = false;

    this.existingPanelMembers = [];

    this.existingChairmanId = null;

  }

  // ==========================================================
  // LOAD COURSES
  // ==========================================================

  getCourses(): void {
    this.http.get<any>(
      `${environment.apiBaseUrl}/course-master`
    ).subscribe({
      next: (res: any) => {
        this.courses = res;
      },
      error: (err) => {
        console.error('Error fetching courses', err);
      }
    });
  }

  // ==========================================================
  // MANUAL CANDIDATE ADD / REMOVE (dropdown-based fallback)
  // ==========================================================

  addCandidate(): void {

    if (!this.selectedCandidateId) {
      alert('Please select a student.');
      return;
    }

    const student = this.candidates.find(
      c => c.id === this.selectedCandidateId
    );

    if (!student) {
      return;
    }

    const alreadyExists = this.selectedCandidates.some(
      c => c.id === student.id
    );

    if (alreadyExists) {
      alert('Student already selected.');
      return;
    }

    this.selectedCandidates.push(student);

    // Reset dropdown
    this.selectedCandidateId = null;
  }

  removeCandidate(id: number): void {

    this.selectedCandidates =
      this.selectedCandidates.filter(c => c.id !== id);

  }

  getSelectedCourseName(): string {

    const course = this.courses.find(
      c => c.course_id === this.selectedCourseId
    );

    return course
      ? `${course.course_name} - ${course.branch_name}`
      : '';

  }

  getSelectedSubjectName(): string {

    const subject = this.subjects.find(
      s => s.subject_id === this.selectedSubjectId
    );

    return subject
      ? `${subject.subject_code} - ${subject.subject_name}`
      : '';

  }

  // ==========================================================
  // INITIALS (used for the student avatar circles)
  // ==========================================================

  getInitials(name: string): string {

    if (!name) {
      return '';
    }

    const parts = name.trim().split(' ');

    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';

    return (first + last).toUpperCase();

  }

  // ==========================================================
  // SELECTED STUDENTS MODAL
  // ==========================================================

  showSelectedStudentsModal = false;

  openSelectedCandidatesModal(): void {

    this.showSelectedStudentsModal = true;

  }

  closeSelectedCandidatesModal(): void {

    this.showSelectedStudentsModal = false;

  }

  // ==========================================================
  // EXISTING PANEL
  // ==========================================================

  existingPanelMembers: any[] = [];

  existingChairmanId: number | null = null;

  onExistingPanelChange(): void {

    this.existingPanelMembers = [];
    this.existingChairmanId = null;

    if (!this.selectedPanelId) {
      return;
    }

    this.http.get<any>(
      `${environment.apiBaseUrl}/api/panels/${this.selectedPanelId}/members`
    ).subscribe({

      next: (res) => {

        if (res.success) {

          this.existingPanelMembers = res.members || [];

          this.existingChairmanId = res.chairman_user_id;

        }

      },

      error: (err) => {

        console.error('Error loading panel members', err);

      }

    });

  }

  // ==========================================================
  // STUDENT SELECTION (checkbox list)
  // ==========================================================
  //
  // All fetched candidates are selected by default (see onCourseChange).
  // Toggling a checkbox simply adds/removes that single student —
  // there is no cap or disabled state tied to `studentCount`.
  // ==========================================================

  toggleCandidate(candidate: any, event: any): void {

    const checked = event.target.checked;

    if (checked) {

      if (!this.isCandidateSelected(candidate.id)) {
        this.selectedCandidates.push(candidate);
      }

    } else {

      this.selectedCandidates =
        this.selectedCandidates.filter(
          c => c.id !== candidate.id
        );

    }

  }

  isCandidateSelected(candidateId: number): boolean {

    return this.selectedCandidates.some(
      c => c.id === candidateId
    );

  }

  // Select / clear-all helpers for the list header
  selectAllCandidates(): void {
    this.selectedCandidates = [...this.candidates];
  }

  clearAllCandidates(): void {
    this.selectedCandidates = [];
  }

  get allCandidatesSelected(): boolean {
    return (
      this.candidates.length > 0 &&
      this.selectedCandidates.length === this.candidates.length
    );
  }

}