import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.prod';

interface Candidate {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  department_branch?: string;
  course_program?: string;
}

@Component({
  selector: 'app-candidate-question-generation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './candidate-question-generation.component.html',
  styleUrl: './candidate-question-generation.component.css'
})
export class CandidateQuestionGenerationComponent implements OnInit {

  // ============================================================
  // MODAL
  // ============================================================

  showAiInterviewModal = false;


  // ============================================================
  // CANDIDATES
  // ============================================================

  candidates: Candidate[] = [];

  selectedCandidateId: number | null = null;

  selectedCandidate: Candidate | null = null;

  // ============================================================
  // RESUME
  // ============================================================

  resumeFile: File | null = null;


  // ============================================================
  // LOADING / MESSAGES
  // ============================================================

  loading = false;

  errorMessage = '';

  successMessage = '';


  // ============================================================
  // API
  // ============================================================

  private apiUrl = environment.apiBaseUrl;


  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private http: HttpClient
  ) {}


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    this.loadCandidates();

  }


  // ============================================================
  // LOAD CANDIDATES
  // ============================================================

  loadCandidates(): void {

    this.http.get<any>(
      `${this.apiUrl}/api/candidates`
    ).subscribe({

      next: (response) => {

        console.log(
          'Candidates API response:',
          response
        );


        /*
         * Backend response:
         *
         * {
         *   success: true,
         *   total_candidates: 5,
         *   candidates: [...]
         * }
         */

        if (Array.isArray(response)) {

          this.candidates = response;

        }

        else if (
          response &&
          Array.isArray(response.candidates)
        ) {

          this.candidates = response.candidates;

        }

        else if (
          response &&
          Array.isArray(response.data)
        ) {

          this.candidates = response.data;

        }

        else {

          this.candidates = [];

        }


        console.log(
          'Candidates loaded:',
          this.candidates
        );

      },

      error: (error) => {

        console.error(
          'Failed to load candidates:',
          error
        );

        this.candidates = [];

        this.errorMessage =
          error?.error?.detail ||
          'Unable to load candidates. Please try again.';

      }

    });

  }


  // ============================================================
  // OPEN MODAL
  // ============================================================

  openAiInterviewModal(candidate: Candidate): void {

  this.resetForm();

  this.selectedCandidate = candidate;

  this.selectedCandidateId = candidate.id;

  this.showAiInterviewModal = true;

}


  // ============================================================
  // CLOSE MODAL
  // ============================================================

  closeAiInterviewModal(): void {

    if (this.loading) {

      return;

    }

    this.showAiInterviewModal = false;

    this.resetForm();

  }


  // ============================================================
  // RESET FORM
  // ============================================================

  resetForm(): void {

  this.selectedCandidateId = null;

  this.selectedCandidate = null;

  this.resumeFile = null;

  this.errorMessage = '';

  this.successMessage = '';

}


  // ============================================================
  // RESUME SELECTION
  // ============================================================

  onResumeSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {

      this.resumeFile = null;

      return;

    }


    const file = input.files[0];

    console.log(
      'Selected resume:',
      file
    );


    // ==========================================================
    // PDF VALIDATION
    // ==========================================================

    const fileName =
      file.name.toLowerCase();

    const extension =
      fileName.split('.').pop();


    if (
      extension !== 'pdf'
    ) {

      this.errorMessage =
        'Please select a PDF resume.';

      input.value = '';

      this.resumeFile = null;

      return;

    }


    // ==========================================================
    // MIME TYPE VALIDATION
    // ==========================================================

    if (
      file.type &&
      file.type !== 'application/pdf'
    ) {

      this.errorMessage =
        'Only PDF resumes are allowed.';

      input.value = '';

      this.resumeFile = null;

      return;

    }


    // ==========================================================
    // FILE SIZE VALIDATION
    // ==========================================================

    const maxSize =
      10 * 1024 * 1024; // 10 MB


    if (file.size > maxSize) {

      this.errorMessage =
        'Resume size must be less than 10 MB.';

      input.value = '';

      this.resumeFile = null;

      return;

    }


    // ==========================================================
    // SAVE FILE
    // ==========================================================

    this.resumeFile = file;

    this.errorMessage = '';

    this.successMessage = '';


    console.log(
      'Resume selected successfully:',
      this.resumeFile.name
    );

  }


  // ============================================================
  // GENERATE QUESTIONS
  // ============================================================

  generateQuestions(): void {

  this.errorMessage = '';
  this.successMessage = '';


  // ==========================================================
  // VALIDATE CANDIDATE
  // ==========================================================

  if (!this.selectedCandidate) {

    this.errorMessage =
      'Please select a candidate.';

    return;

  }


  // ==========================================================
  // VALIDATE RESUME
  // ==========================================================

  if (!this.resumeFile) {

    this.errorMessage =
      'Please upload a resume.';

    return;

  }


  // ==========================================================
  // PREPARE FORMDATA
  // ==========================================================

  const formData = new FormData();


  formData.append(
    'candidate_id',
    this.selectedCandidate.id.toString()
  );


  formData.append(
    'resume',
    this.resumeFile
  );


  console.log(
    'Generating AI questions for:',
    this.selectedCandidate.name
  );

  console.log(
    'Candidate ID:',
    this.selectedCandidate.id
  );

  console.log(
    'Resume:',
    this.resumeFile.name
  );


  // ==========================================================
  // LOADING
  // ==========================================================

  this.loading = true;


  // ==========================================================
  // API
  // ==========================================================

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/admin/jd-assessment/generate`,
    formData
  ).subscribe({

    // ========================================================
    // SUCCESS
    // ========================================================

    next: (response) => {

      console.log(
        'AI question generation response:',
        response
      );


      this.loading = false;


      this.successMessage =
        response?.message ||
        'AI interview questions generated successfully.';


      /*
       * Keep modal open for now so we can inspect
       * the generated response.
       *
       * Later we can redirect to the generated
       * interview/question page.
       */

    },


    // ========================================================
    // ERROR
    // ========================================================

    error: (error) => {

      console.error(
        'AI question generation failed:',
        error
      );


      this.loading = false;


      this.errorMessage =
        error?.error?.detail ||
        error?.error?.message ||
        'Failed to generate interview questions.';

    }

  });

}

}