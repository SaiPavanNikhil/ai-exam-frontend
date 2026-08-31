import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-jd-creation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './jd-creation.component.html',
  styleUrl: './jd-creation.component.css'
})
export class JdCreationComponent {

  // ============================================================
  // BACKEND URL
  // ============================================================

  private readonly API_URL = 'http://127.0.0.1:8000';


  // ============================================================
  // JD DETAILS
  // ============================================================

  jdTitle: string = '';

  selectedFile: File | null = null;


  // ============================================================
  // KEYWORDS
  // ============================================================

  keywords: string[] = [];

  newKeyword: string = '';

  keywordsExtracted: boolean = false;


  // ============================================================
  // LOADING STATES
  // ============================================================

  extractingKeywords: boolean = false;

  saving: boolean = false;


  // ============================================================
  // ERROR / SUCCESS MESSAGE
  // ============================================================

  errorMessage: string = '';

  successMessage: string = '';


  constructor(
    private http: HttpClient
  ) {}


  // ============================================================
  // FILE SELECTION
  // ============================================================

  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    this.clearMessages();

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];


    // ----------------------------------------------------------
    // Validate PDF
    // ----------------------------------------------------------

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {

      this.errorMessage = 'Please upload a PDF file.';

      input.value = '';

      return;
    }


    // ----------------------------------------------------------
    // Store selected file
    // ----------------------------------------------------------

    this.selectedFile = file;


    // ----------------------------------------------------------
    // Reset previous extraction
    // ----------------------------------------------------------

    this.keywords = [];

    this.keywordsExtracted = false;

  }


  // ============================================================
  // REMOVE SELECTED FILE
  // ============================================================

  removeFile(): void {

    this.selectedFile = null;

    this.keywords = [];

    this.newKeyword = '';

    this.keywordsExtracted = false;

    this.clearMessages();

  }


  // ============================================================
  // EXTRACT KEYWORDS
  // ============================================================

  extractKeywords(): void {

  this.clearMessages();

  if (!this.selectedFile) {
    this.errorMessage = 'Please upload a JD PDF first.';
    return;
  }

  this.extractingKeywords = true;

  const formData = new FormData();

  formData.append(
    'file',
    this.selectedFile
  );

  this.http
    .post<any>(
      `${this.API_URL}/jd/extract-keywords`,
      formData
    )
    .subscribe({

      next: (response) => {

        console.log('Keyword API Response:', response);

        this.extractingKeywords = false;

        // Backend returns "status": "success"
        if (
          !response ||
          response.status !== 'success'
        ) {

          this.errorMessage =
            'Unable to extract keywords.';

          return;
        }

        // Get keywords from backend response
        this.keywords = Array.isArray(response.keywords)
          ? response.keywords
          : [];

        console.log(
          'Keywords received:',
          this.keywords
        );

        // Show keyword section
        this.keywordsExtracted = true;

        if (this.keywords.length === 0) {

          this.errorMessage =
            'No relevant keywords were found in the JD.';

          return;
        }

        this.successMessage =
          `${this.keywords.length} keywords extracted successfully.`;

      },

      error: (error) => {

        this.extractingKeywords = false;

        console.error(
          'Keyword extraction error:',
          error
        );

        this.errorMessage =
          error?.error?.detail ||
          'Failed to extract keywords from the JD PDF.';

      }

    });
}


  // ============================================================
  // ADD KEYWORD
  // ============================================================

  addKeyword(): void {

    this.clearMessages();

    const keyword =
      this.newKeyword.trim();


    if (!keyword) {
      return;
    }


    // ----------------------------------------------------------
    // Prevent duplicates
    // ----------------------------------------------------------

    const alreadyExists =
      this.keywords.some(
        existingKeyword =>
          existingKeyword.toLowerCase() ===
          keyword.toLowerCase()
      );


    if (alreadyExists) {

      this.errorMessage =
        'This keyword already exists.';

      return;
    }


    // ----------------------------------------------------------
    // Add keyword
    // ----------------------------------------------------------

    this.keywords.push(keyword);

    this.newKeyword = '';

  }


  // ============================================================
  // REMOVE KEYWORD
  // ============================================================

  removeKeyword(index: number): void {

    this.clearMessages();

    if (
      index < 0 ||
      index >= this.keywords.length
    ) {
      return;
    }


    this.keywords.splice(
      index,
      1
    );

  }


  // ============================================================
  // SAVE JD
  // ============================================================

  saveJD(): void {

    this.clearMessages();


    // ----------------------------------------------------------
    // Validate title
    // ----------------------------------------------------------

    if (!this.jdTitle.trim()) {

      this.errorMessage =
        'Please enter the JD title.';

      return;
    }


    // ----------------------------------------------------------
    // Validate PDF
    // ----------------------------------------------------------

    if (!this.selectedFile) {

      this.errorMessage =
        'Please upload the JD PDF.';

      return;
    }


    // ----------------------------------------------------------
    // Validate keywords
    // ----------------------------------------------------------

    if (this.keywords.length === 0) {

      this.errorMessage =
        'Please add at least one keyword.';

      return;
    }


    // ----------------------------------------------------------
    // Start saving
    // ----------------------------------------------------------

    this.saving = true;


    // ----------------------------------------------------------
    // Create FormData
    // ----------------------------------------------------------

    const formData = new FormData();


    formData.append(
      'jd_title',
      this.jdTitle.trim()
    );


    formData.append(
      'keywords',
      JSON.stringify(this.keywords)
    );


    formData.append(
      'file',
      this.selectedFile
    );


    // ----------------------------------------------------------
    // Call backend
    // ----------------------------------------------------------

    this.http
      .post<any>(
        `${this.API_URL}/jd/save`,
        formData
      )
      .subscribe({

        next: (response) => {

          this.saving = false;


          if (
            !response ||
            !response.success
          ) {

            this.errorMessage =
              response?.message ||
              'Unable to save JD.';

            return;
          }


          // ----------------------------------------------------
          // Success
          // ----------------------------------------------------

          this.successMessage =
            'Job Description saved successfully.';


          console.log(
            'JD saved successfully:',
            response
          );


          // ----------------------------------------------------
          // Reset after successful save
          // ----------------------------------------------------

          this.resetForm();

        },


        error: (error) => {

          this.saving = false;


          console.error(
            'JD save error:',
            error
          );


          this.errorMessage =
            error?.error?.detail ||
            'Failed to save Job Description.';

        }

      });

  }


  // ============================================================
  // RESET FORM
  // ============================================================

  resetForm(): void {

    this.jdTitle = '';

    this.selectedFile = null;

    this.keywords = [];

    this.newKeyword = '';

    this.keywordsExtracted = false;

    this.extractingKeywords = false;

    this.saving = false;

  }


  // ============================================================
  // CLEAR MESSAGES
  // ============================================================

  private clearMessages(): void {

    this.errorMessage = '';

    this.successMessage = '';

  }

}