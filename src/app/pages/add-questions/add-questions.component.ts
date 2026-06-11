import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-questions',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-questions.component.html',
  styleUrl: './add-questions.component.css'
})
export class AddQuestionsComponent {
  // ✅ Navigation & UI State Tabs
  activeTab: 'gemini' | 'manual' = 'gemini';

  // ✅ Form Bindings - PART 1: GEMINI AI MODE
  selectedCourse: string = '';
  numQuestions: number = 3;
  selectedFile: File | null = null;

  // ✅ Form Bindings - PART 2: MANUAL FORM MODE
  manualCourse: string = '';
  manualCategory: string = '';
  manualDifficulty: string = 'Medium';
  manualQuestionText: string = '';
  manualExpectedAnswer: string = '';
  manualTimeLimit: number = 120; // Default limit matching backend fallback constraints
  
  // ✅ Interface Operational App States
  isLoading: boolean = false;
  statusMessage: string = '';
  errorMessage: string = '';

  // ✅ Centralized API Base target path variable
  private apiUrl = 'https://ai-exam-backend-code-production.up.railway.app';

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Switches structural rendering tabs and flushes existing message banners
   */
  switchTab(tab: 'gemini' | 'manual'): void {
    this.activeTab = tab;
    this.statusMessage = '';
    this.errorMessage = '';
  }

  /**
   * Catches user file updates and ensures it meets PDF validation constraints
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
      this.errorMessage = '';
    } else {
      this.selectedFile = null;
      this.errorMessage = 'Invalid format. Please attach a structural reference PDF.';
    }
  }

  /**
   * Submits the binary document data along with selected course labels via FormData boundaries
   */
  onGenerate(form: any): void {
    if (!form.valid || !this.selectedFile) {
      this.errorMessage = 'Please select a course and upload a reference syllabus document.';
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('num_questions', this.numQuestions.toString());
    formData.append('course', this.selectedCourse);

    this.http.post<any>(`${this.apiUrl}/api/upload-and-generate-questions`, formData)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.statusMessage = `🚀 Successfully generated ${res.count} questions for ${res.course} under Category partition: ${res.category}!`;
            
            // Clean view attachments and state blocks
            this.selectedFile = null;
            form.resetForm({
              course: '',
              numQuestions: 3
            });
            this.selectedCourse = '';
            this.numQuestions = 3;
          } else {
            this.errorMessage = res.error || 'The model encountered an anomaly while evaluating text segments.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.detail || 'An exception occurred while processing parameters with the question engine.';
          console.error("Gemini processing log failure exception:", err);
        }
      });
  }

  /**
   * Submits manually created question blocks directly through standard JSON payloads
   */
  onSubmitManual(form: any): void {
    if (!form.valid) {
      this.errorMessage = 'Please complete all required fields inside the manual form frame.';
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.errorMessage = '';

    // Construct standard JSON model object mapping payload matching database requirements
    const payload = {
      course: this.manualCourse,
      category: this.manualCategory,
      difficulty: this.manualDifficulty,
      question_text: this.manualQuestionText,
      expected_answer: this.manualExpectedAnswer,
      time_limit: this.manualTimeLimit
    };

    this.http.post<any>(`${this.apiUrl}/api/add-manual-question`, payload)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.statusMessage = `✅ Question successfully pinned into the database bank for program track: ${res.course}!`;
            
            // Reset manual form variables cleanly back to defaults
            form.resetForm({
              manualCourse: '',
              manualCategory: '',
              manualDifficulty: 'Medium',
              manualQuestionText: '',
              manualExpectedAnswer: '',
              manualTimeLimit: 120
            });
            this.manualCourse = '';
            this.manualCategory = '';
            this.manualDifficulty = 'Medium';
            this.manualQuestionText = '';
            this.manualExpectedAnswer = '';
            this.manualTimeLimit = 120;
          } else {
            this.errorMessage = res.error || 'Database rejected data matrix parameters.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.detail || 'An issue arose while writing manual row parameters to the server bank.';
          console.error("Manual database record entry dump context:", err);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/schedule']);
  }
}