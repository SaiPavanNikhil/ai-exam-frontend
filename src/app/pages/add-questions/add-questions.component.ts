import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.service';

interface CourseMaster {
  course_id:   number;
  course_code: string;
  course_name: string;
  branch_name: string;
}

interface SubjectMaster {
  subject_id:    number;
  subject_code:  string;
  subject_name:  string;
  semester_no:   number;
  semester_name: string;
  course_id:     number;
  semester_id:   number;
}

interface SemesterItem {
  semester_id:   number;
  semester_no:   number;
  semester_name: string;
}

interface GeneratedQuestion {
  question_text: string;
  expected_answer: string;
  difficulty: string;
  selected: boolean;
}

@Component({
  selector: 'app-add-questions',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './add-questions.component.html',
  styleUrl: './add-questions.component.css'
})
export class AddQuestionsComponent implements OnInit {

  activeTab: 'gemini' | 'manual' = 'gemini';
  // private apiUrl = 'http://localhost:8000';

  // ── Courses ───────────────────────────────────────────────────
  courses:         CourseMaster[] = [];
  isLoadingCourses = false;
  coursesError     = '';

  // ── Subjects (all subjects for selected course) ───────────────
  subjects:          SubjectMaster[] = [];
  isLoadingSubjects  = false;

  // ── Gemini form ───────────────────────────────────────────────
  selectedCourseCode: string      = '';
  selectedCourseId:   number|null = null;
  geminiSelectedSubjectId: number | null = null;
  isGeminiSubjectListOpen: boolean = false;

  // ===== Global Gemini =====
  manualQuestionCount: number = 10;

  generatedQuestions: GeneratedQuestion[] = [];

  isGeneratingQuestions = false;

  isSavingQuestions = false;

  // ── Manual form ───────────────────────────────────────────────
  manualCourseCode:     string      = '';
  manualCourseId:       number|null = null;
  manualSemesterId:     number|null = null;
  manualSubjectId:      number|null = null;
  manualDifficulty:     string      = 'Medium';
  manualQuestionText:   string      = '';
  manualExpectedAnswer: string      = '';
  manualTimeLimit:      number      = 120;

  // ── File ──────────────────────────────────────────────────────
  selectedFile: File|null = null;

  // ── UI ────────────────────────────────────────────────────────
  isLoading     = false;
  statusMessage = '';
  errorMessage  = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  // ═══════════════════════════════════════════════════════════════
  // CLICK OUTSIDE — close subject dropdown like a native <select>
  // ═══════════════════════════════════════════════════════════════
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isGeminiSubjectListOpen) return;
    const target = event.target as HTMLElement;
    const wrapper = this.elRef.nativeElement.querySelector('.subject-dropdown-wrapper');
    if (wrapper && !wrapper.contains(target)) {
      this.isGeminiSubjectListOpen = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAD COURSES
  // ═══════════════════════════════════════════════════════════════
  loadCourses(): void {
    this.isLoadingCourses = true;
    this.coursesError     = '';

    this.http.get<CourseMaster[]>(`${environment.apiBaseUrl}/course-master`).subscribe({
      next: (data) => {
        this.courses          = data ?? [];
        this.isLoadingCourses = false;
        if (!this.courses.length) {
          this.coursesError = 'No courses found. Please add courses first.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.coursesError     = 'Failed to load courses. Is the backend running?';
        this.isLoadingCourses = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // LOAD SUBJECTS by course_id
  // ═══════════════════════════════════════════════════════════════
  loadSubjectsByCourse(courseId: number): void {
    this.subjects          = [];
    this.isLoadingSubjects = true;
    this.cdr.detectChanges();

    this.http.get<SubjectMaster[]>(`${environment.apiBaseUrl}/subjects/by-course/${courseId}`).subscribe({
      next: (data) => {
        this.subjects          = data ?? [];
        this.isLoadingSubjects = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.subjects          = [];
        this.isLoadingSubjects = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * All subjects grouped by semester — used in both tabs.
   * Gemini: readonly display. Manual: semester dropdown source.
   */
  get subjectsBySemester(): { semester_id: number; semester_no: number; semester_name: string; subjects: SubjectMaster[] }[] {
    const map = new Map<number, { semester_id: number; semester_no: number; semester_name: string; subjects: SubjectMaster[] }>();
    for (const s of this.subjects) {
      if (!map.has(s.semester_id)) {
        map.set(s.semester_id, {
          semester_id:   s.semester_id,
          semester_no:   s.semester_no,
          semester_name: s.semester_name,
          subjects:      []
        });
      }
      map.get(s.semester_id)!.subjects.push(s);
    }
    return Array.from(map.values()).sort((a, b) => a.semester_no - b.semester_no);
  }

  /** Unique sorted semester list — used in Manual tab semester dropdown */
  get semesterList(): SemesterItem[] {
    return this.subjectsBySemester.map(g => ({
      semester_id:   g.semester_id,
      semester_no:   g.semester_no,
      semester_name: g.semester_name
    }));
  }

  /** Subjects filtered by selected semester — used in Manual tab subject dropdown */
  get filteredSubjects(): SubjectMaster[] {
    if (!this.manualSemesterId) return [];
    return this.subjects.filter(s => s.semester_id === this.manualSemesterId);
  }

  /** Currently selected Gemini subject object (for the closed-toggle display) */
  get geminiSelectedSubject(): SubjectMaster | undefined {
    return this.subjects.find(s => s.subject_id === this.geminiSelectedSubjectId);
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB SWITCH
  // ═══════════════════════════════════════════════════════════════
  switchTab(tab: 'gemini' | 'manual'): void {
    this.activeTab     = tab;
    this.statusMessage = '';
    this.errorMessage  = '';
  }

  // ═══════════════════════════════════════════════════════════════
  // GEMINI — cascade + dropdown handlers
  // ═══════════════════════════════════════════════════════════════
  onGeminiCourseChange(): void {
    const found                  = this.courses.find(c => c.course_code === this.selectedCourseCode);
    this.selectedCourseId        = found?.course_id ?? null;
    this.subjects                = [];
    this.geminiSelectedSubjectId = null;
    this.isGeminiSubjectListOpen = true;
    this.statusMessage           = '';
    this.errorMessage            = '';

    if (this.selectedCourseId) {
      this.loadSubjectsByCourse(this.selectedCourseId);
    }
  }

  toggleGeminiSubjectDropdown(): void {
    this.isGeminiSubjectListOpen = !this.isGeminiSubjectListOpen;
  }

  toggleGeminiSubject(subjectId: number): void {
    this.geminiSelectedSubjectId =
      this.geminiSelectedSubjectId === subjectId ? null : subjectId;
    this.isGeminiSubjectListOpen = false; // always close after picking, like a native select
  }

  onGenerate(form: any): void {
    if (!form.valid || !this.selectedFile || !this.selectedCourseCode) {
      this.errorMessage = 'Please select a course and upload a PDF.';
      return;
    }

    this.isLoading     = true;
    this.statusMessage = '';
    this.errorMessage  = '';
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('file',      this.selectedFile);
    formData.append('course',    this.selectedCourseCode);
    formData.append('course_id', this.selectedCourseId!.toString());

    if (this.geminiSelectedSubjectId) {
      formData.append('subject_id', this.geminiSelectedSubjectId.toString());
    }

    this.http.post<any>(`${environment.apiBaseUrl}/api/upload-and-generate-questions`, formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.statusMessage           = `✓ Generated questions for ${res.course}`;
          this.selectedFile            = null;
          this.selectedCourseCode      = '';
          this.selectedCourseId        = null;
          this.geminiSelectedSubjectId = null;
          this.isGeminiSubjectListOpen = false;
          this.subjects                = [];
          form.resetForm();
        } else {
          this.errorMessage = res.error || 'Something went wrong.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.detail || 'Failed to generate questions.';
        this.cdr.detectChanges();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // FILE SELECT (AI tab — PDF upload)
  // ═══════════════════════════════════════════════════════════════
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (file && file.type !== 'application/pdf') {
      this.errorMessage = 'Please upload a PDF file.';
      this.selectedFile = null;
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.selectedFile = file;
    this.errorMessage  = '';
    this.cdr.detectChanges();
  }

  // ═══════════════════════════════════════════════════════════════
  // MANUAL — cascade handlers
  // ═══════════════════════════════════════════════════════════════
  onManualCourseChange(): void {
    const found            = this.courses.find(c => c.course_code === this.manualCourseCode);
    this.manualCourseId    = found?.course_id ?? null;
    this.subjects          = [];
    this.manualSemesterId  = null;
    this.manualSubjectId   = null;
    this.statusMessage     = '';
    this.errorMessage      = '';

    if (this.manualCourseId) {
      this.loadSubjectsByCourse(this.manualCourseId);
    }
  }

  onManualSemesterChange(): void {
    this.manualSubjectId = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // MANUAL SUBMIT
  // ═══════════════════════════════════════════════════════════════
  onSubmitManual(form: any): void {
    if (!form.valid || !this.manualSubjectId) {
      this.errorMessage = 'Please fill all fields and select a subject.';
      return;
    }

    this.isLoading     = true;
    this.statusMessage = '';
    this.errorMessage  = '';
    this.cdr.detectChanges();

    const selected = this.getSelectedSubject();

    const payload = {
      course:          this.manualCourseCode,
      course_id:       this.manualCourseId,
      subject_id:      this.manualSubjectId,
      semester_id:     selected?.semester_id  ?? null,
      category:        selected?.subject_name ?? '',
      difficulty:      this.manualDifficulty,
      question_text:   this.manualQuestionText,
      expected_answer: this.manualExpectedAnswer,
      time_limit:      this.manualTimeLimit
    };

    // this.http.post<any>(`${this.apiUrl}/api/add-manual-question`, payload).subscribe({
    //   next: (res) => {
    //     this.isLoading = false;
    //     if (res.success) {
    //       this.statusMessage        = `✓ Question saved — ${this.manualCourseCode} › ${selected?.subject_name}`;
    //       this.manualCourseCode     = '';
    //       this.manualCourseId       = null;
    //       this.manualSemesterId     = null;
    //       this.manualSubjectId      = null;
    //       this.subjects             = [];
    //       this.manualDifficulty     = 'Medium';
    //       this.manualQuestionText   = '';
    //       this.manualExpectedAnswer = '';
    //       this.manualTimeLimit      = 120;
    //       form.resetForm();
    //     } else {
    //       this.errorMessage = res.error || 'Failed to save question.';
    //     }
    //     this.cdr.detectChanges();
    //   },
    //   error: (err) => {
    //     this.isLoading    = false;
    //     this.errorMessage = err?.error?.detail || 'Failed to save question.';
    //     this.cdr.detectChanges();
    //   }
    // });
  }

  /** Helper: find the currently selected manual subject object */
  private getSelectedSubject(): SubjectMaster | undefined {
    return this.subjects.find(s => s.subject_id === this.manualSubjectId);
  }

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════
  goBack(): void {
    this.router.navigate(['/schedule']);
  }

  generateGlobalQuestions(): void {

  if (!this.manualCourseId || !this.manualSubjectId) {
    this.errorMessage = 'Please select course and subject.';
    return;
  }

  this.isLoading = true;
  this.statusMessage = '';
  this.errorMessage = '';

  const payload = {

    course_id: this.manualCourseId,

    subject_id: this.manualSubjectId,

    question_count: this.manualQuestionCount

  };

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/generate-global-questions`,
    payload
  ).subscribe({

    next: (res) => {

      this.isLoading = false;

      if (res.success) {

        this.generatedQuestions =
          (res.questions || []).map((q: any) => ({
            ...q,
            selected: true
          }));

        this.statusMessage =
          `${this.generatedQuestions.length} questions generated successfully.`;

      } else {

        this.errorMessage =
          res.error || 'Failed to generate questions.';

      }

      this.cdr.detectChanges();

    },

    error: (err) => {

      this.isLoading = false;

      this.errorMessage =
        err?.error?.detail || 'Failed to generate questions.';

      this.cdr.detectChanges();

    }

  });

}

saveGeneratedQuestions(): void {

  const selectedQuestions =
    this.generatedQuestions.filter(q => q.selected);

  if (selectedQuestions.length === 0) {

    this.errorMessage =
      'Please select at least one question.';

    return;

  }

  this.isLoading = true;

  const payload = {

    course: this.manualCourseCode,

    course_id: this.manualCourseId,

    subject_id: this.manualSubjectId,

    questions: selectedQuestions.map(q => ({

      question_text: q.question_text,

      expected_answer: q.expected_answer,

      difficulty: q.difficulty

    }))

  };

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/save-global-questions`,
    payload
  ).subscribe({

    next: (res) => {

      this.isLoading = false;

      if (res.success) {

        this.statusMessage =
          `${res.saved} questions saved successfully.`;

        this.generatedQuestions = [];

      } else {

        this.errorMessage =
          res.error || 'Failed to save questions.';

      }

      this.cdr.detectChanges();

    },

    error: (err) => {

      this.isLoading = false;

      this.errorMessage =
        err?.error?.detail || 'Failed to save questions.';

      this.cdr.detectChanges();

    }

  });

}

removeGeneratedQuestion(index: number): void {

  this.generatedQuestions.splice(index, 1);

}
}
