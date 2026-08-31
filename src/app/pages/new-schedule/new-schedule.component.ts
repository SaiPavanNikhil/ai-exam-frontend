import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink, RouterLinkActive } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment.service';

interface CourseMaster {
  course_id: number;
  course_code: string;
  course_name: string;
  branch_name: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  course_program: string;
  department_branch: string;
  created_at: string;
  semester?: number | null;
  course_id?: number | null; 
  year?: string | null;       // ← ADD
  course?: string | null;     // ← ADD 
}

interface ParsedCourseRow {
  course_code: string;
  course_name: string;
  branch_name: string;
}

// ── NEW: parsed row from the candidate+semester Excel ──
interface ParsedCandidateSemRow {
  name: string;
  email: string;
  phone: string;
  department_branch: string;
  semester: number | null;
    year: string | null;        // ← ADD
  course: string | null;
}

@Component({
  selector: 'app-new-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule ],
  templateUrl: './new-schedule.component.html',
  styleUrls: ['./new-schedule.component.css']
})
export class NewScheduleComponent implements OnInit {

  // private BASE_URL = 'http://localhost:8000';

  courses: CourseMaster[] = [];
  candidates: Candidate[] = [];

  selectedCourseCode: string = '';
  selectedCourse: CourseMaster | null = null;

  isLoadingCourses = false;
  isLoadingCandidates = false;
  isCommitting = false;

  coursesError = '';
  candidatesError = '';
  commitSuccess = '';
  commitError = '';

  semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];  // ← ADD

  // ── Card 0: Course Master Excel Upload ──────────────
  courseExcelFile: File | null = null;
  parsedCourseRows: ParsedCourseRow[] = [];
  isParsingCourseExcel = false;
  isUploadingCourses = false;
  courseUploadError = '';
  courseUploadSuccess = '';

  // ── Card 2: Candidate + Semester Excel Upload ────────
  candidateExcelFile: File | null = null;
  parsedCandidateRows: ParsedCandidateSemRow[] = [];
  isParsingCandidateExcel = false;
  candidateParseError = '';
  candidateParseSuccess = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  // ════════════════════════════════════════════════════
  // COURSES
  // ════════════════════════════════════════════════════

  loadCourses(): void {
    this.isLoadingCourses = true;
    this.coursesError = '';
    this.cdr.detectChanges();

    this.http.get<CourseMaster[]>(`${environment.apiBaseUrl}/course-master`).subscribe({
      next: (data) => {
        this.courses = data ?? [];
        this.isLoadingCourses = false;
        if (this.courses.length === 0) {
          this.coursesError = 'Backend responded, but course_master table returned 0 rows.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ /course-master failed:', err);
        this.coursesError = 'Failed to load courses. Is the backend running?';
        this.isLoadingCourses = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCourseSelect(): void {
    this.selectedCourse = this.courses.find(c => c.course_code === this.selectedCourseCode) || null;
    // Reset downstream state whenever course changes
    this.candidates = [];
    this.parsedCandidateRows = [];
    this.candidateExcelFile = null;
    this.candidateParseError = '';
    this.candidateParseSuccess = '';
    this.commitSuccess = '';
    this.commitError = '';
    this.candidatesError = '';
  }

  fetchCandidates(): void {
    if (!this.selectedCourseCode) return;
    this.isLoadingCandidates = true;
    this.candidatesError = '';
    this.commitSuccess = '';
    this.commitError = '';
    this.cdr.detectChanges();

    this.http.get<Candidate[]>(`${environment.apiBaseUrl}/candidates/by-course/${this.selectedCourseCode}`).subscribe({
      next: (data) => {
        this.candidates = (data ?? []).map(c => ({ ...c, semester: c.semester ?? null }));
        this.isLoadingCandidates = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ /candidates/by-course failed:', err);
        this.candidatesError = 'Failed to fetch candidates. Please try again.';
        this.isLoadingCandidates = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════
  // CARD 2 — CANDIDATE + SEMESTER EXCEL UPLOAD
  // Accepted columns (case-insensitive):
  //   name / full_name / student_name
  //   email
  //   phone / mobile / contact
  //   department_branch / branch / department
  //   semester / sem
  // ════════════════════════════════════════════════════

  onCandidateExcelSelected(event: Event): void {
    if (!this.selectedCourseCode) {
      this.candidateParseError = 'Please select a course first before uploading candidates.';
      return;
    }

    const element = event.target as HTMLInputElement;
    if (!element?.files?.length) return;

    const file = element.files[0];
    this.candidateExcelFile = file;
    this.parsedCandidateRows = [];
    this.candidateParseError = '';
    this.candidateParseSuccess = '';
    this.isParsingCandidateExcel = true;
    this.cdr.detectChanges();

    const reader = new FileReader();

    reader.onerror = () => {
      this.isParsingCandidateExcel = false;
      this.candidateParseError = 'Browser failed to read the file.';
      this.cdr.detectChanges();
    };

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const target = e.target;
        if (!target?.result) throw new Error('FileReader returned empty result.');

        const data = new Uint8Array(target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', raw: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawObjects: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawObjects?.length) {
          this.candidateParseError = 'File was read but contains 0 rows.';
          this.isParsingCandidateExcel = false;
          this.cdr.detectChanges();
          return;
        }

        const parsed: ParsedCandidateSemRow[] = [];
        const semErrors: number[] = [];

        for (const row of rawObjects) {
          // Normalise all keys to lowercase+trimmed
          const r: any = {};
          Object.keys(row).forEach(k => r[k.toLowerCase().trim()] = row[k]);

          const name = String(
            r['name'] ?? r['full_name'] ?? r['student_name'] ?? ''
          ).trim();

          const email = String(r['email'] ?? '').trim();

          const phone = String(
            r['phone'] ?? r['mobile'] ?? r['contact'] ?? ''
          ).trim();

          const dept = String(
            r['department_branch'] ?? r['branch'] ?? r['department'] ?? ''
          ).trim();

          const rawSem = r['semester'] ?? r['sem'] ?? '';
          const semNum = parseInt(String(rawSem).trim(), 10);
          const semester: number | null = (!isNaN(semNum) && semNum >= 1 && semNum <= 8)
            ? semNum
            : null;

          // ── NEW: year & course ──
          // const year = String(r['year'] ?? r['academic_year'] ?? '').trim() || null;
          const rawYear = String(r['year'] ?? r['academic_year'] ?? '').trim();
          const yearMap: Record<string, string> = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
          const year = yearMap[rawYear] ?? (rawYear || null);
          const course = String(r['course'] ?? r['course_program'] ?? r['course_code'] ?? '').trim() || null;

          if (!name && !email) continue;
          if (semester === null && rawSem !== '') semErrors.push(parsed.length + 1);

          parsed.push({ name, email, phone, department_branch: dept, semester, year, course });
        }

        if (!parsed.length) {
          this.candidateParseError =
            "No rows could be mapped. Check columns: name, email, phone, department_branch, semester";
          this.candidateExcelFile = null;
        } else {
          this.parsedCandidateRows = parsed;
          const warn = semErrors.length
            ? ` ⚠️ ${semErrors.length} row(s) have invalid/missing semester values (rows: ${semErrors.slice(0, 5).join(', ')}${semErrors.length > 5 ? '…' : ''}).`
            : '';
          this.candidateParseSuccess =
            `✓ ${parsed.length} candidate row(s) parsed from "${file.name}".${warn}`;
        }

        this.isParsingCandidateExcel = false;
        this.cdr.detectChanges();

      } catch (err: any) {
        this.isParsingCandidateExcel = false;
        this.candidateExcelFile = null;
        this.candidateParseError = `Failed to parse file: ${err?.message || err}`;
        this.cdr.detectChanges();
        console.error('❌ Candidate Excel parse error:', err);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  /** Merge parsed Excel rows into the candidates[] table for review */
  loadParsedCandidatesIntoTable(): void {
    if (!this.parsedCandidateRows.length) return;

    // Convert ParsedCandidateSemRow → Candidate shape (id = 0 means "new/not yet in DB")
    this.candidates = this.parsedCandidateRows.map((r, i) => ({
      id: 0,
      name: r.name,
      email: r.email,
      phone: r.phone,
      course_program: this.selectedCourseCode,
      course_id: this.selectedCourse?.course_id ?? null,
      department_branch: r.department_branch,
      created_at: '',
      semester: r.semester,
      year: r.year ?? null,        // ← ADD
      course: r.course ?? null     // ← ADD
    }));
    this.cdr.detectChanges();
  }

  clearCandidateExcel(): void {
    this.parsedCandidateRows = [];
    this.candidateExcelFile = null;
    this.candidateParseError = '';
    this.candidateParseSuccess = '';
    // also clear table if it was populated from this excel
    if (this.candidates.some(c => c.id === 0)) this.candidates = [];
    this.cdr.detectChanges();
  }

  // ════════════════════════════════════════════════════
  // CANDIDATE TABLE helpers
  // ════════════════════════════════════════════════════

  get totalCount(): number { return this.candidates.length; }

  get assignedCount(): number {
    return this.candidates.filter(c => c.semester !== null && c.semester !== undefined).length;
  }

  get pendingCount(): number { return this.totalCount - this.assignedCount; }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  canCommit(): boolean {
    return this.candidates.length > 0 && this.pendingCount === 0 && !this.isCommitting;
  }

  // ════════════════════════════════════════════════════
  // COMMIT — handles both existing (id > 0) and new (id === 0) candidates
  // ════════════════════════════════════════════════════

  commitAll(): void {
    if (!this.canCommit()) return;

    const hasNew = this.candidates.some(c => c.id === 0);

    if (hasNew) {
      // Save new candidates first via bulk-students endpoint, then assign semester
      this._saveNewCandidatesThenCommit();
    } else {
      this._commitSemestersOnly();
    }
  }

  private _commitSemestersOnly(): void {
    this.isCommitting = true;
    this.commitSuccess = '';
    this.commitError = '';
    this.cdr.detectChanges();

    const payload = this.candidates.map(c => ({
      candidate_id: c.id,
      semester: c.semester,
      year: c.year ?? null   // 🆕
    }));

    this.http.post(`${environment.apiBaseUrl}/candidates/assign-semester`, payload).subscribe({
      next: () => {
        this.commitSuccess = `✓ ${this.candidates.length} candidate(s) updated with semester successfully.`;
        this.isCommitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ commit failed:', err);
        this.commitError = 'Failed to commit. Please try again.';
        this.isCommitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  private _saveNewCandidatesThenCommit(): void {
    this.isCommitting = true;
    this.commitSuccess = '';
    this.commitError = '';
    this.cdr.detectChanges();

    const studentsPayload = {
      course_program: this.selectedCourseCode,
      students: this.candidates.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        department_branch: c.department_branch,
          year: c.year ?? null   // 🆕
      }))
    };

    this.http.post<any>(`${environment.apiBaseUrl}/api/save-bulk-students`, studentsPayload).subscribe({
    next: (res) => {
      if (!res?.success) {
        this.commitError = 'Failed to save new candidates.';
        this.isCommitting = false;
        this.cdr.detectChanges();
        return;
      }
      this.http.get<Candidate[]>(`${environment.apiBaseUrl}/candidates/by-course/${this.selectedCourseCode}`).subscribe({
        next: (saved) => {
          // 🆕 carry both semester AND year forward, keyed by email
          const extraMap = new Map<string, { semester: number | null; year: string | null }>(
            this.candidates.map(c => [c.email.toLowerCase(), { semester: c.semester ?? null, year: c.year ?? null }])
          );
          const withSem = (saved ?? []).map(c => {
            const extra = extraMap.get(c.email.toLowerCase());
            return {
              ...c,
              semester: extra?.semester ?? c.semester ?? null,
              year: extra?.year ?? c.year ?? null
            };
          });
          this.candidates = withSem;

          const semPayload = withSem
            .filter(c => c.semester !== null)
            .map(c => ({ candidate_id: c.id, semester: c.semester, year: c.year ?? null })); // 🆕 year added

          if (!semPayload.length) {
            this.commitSuccess = `✓ ${saved.length} candidate(s) saved. No semesters to assign.`;
            this.isCommitting = false;
            this.cdr.detectChanges();
            return;
          }

          this.http.post(`${environment.apiBaseUrl}/candidates/assign-semester`, semPayload).subscribe({
            next: () => {
              this.commitSuccess = `✓ ${saved.length} candidate(s) saved and semester assigned successfully.`;
              this.parsedCandidateRows = [];
              this.candidateExcelFile = null;
              this.isCommitting = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('❌ semester assign after save failed:', err);
              this.commitError = 'Candidates saved but semester assignment failed. Please retry.';
              this.isCommitting = false;
              this.cdr.detectChanges();
            }
          });
        },
        error: () => {
          this.commitError = 'Candidates saved but could not fetch IDs for semester assignment.';
          this.isCommitting = false;
          this.cdr.detectChanges();
        }
      });
    },
    error: (err) => {
      console.error('❌ save-bulk-students failed:', err);
      this.commitError = err?.error?.detail || 'Failed to save candidates.';
      this.isCommitting = false;
      this.cdr.detectChanges();
    }
  });
}
  

  // ════════════════════════════════════════════════════
  // CARD 0 — COURSE MASTER EXCEL UPLOAD
  // ════════════════════════════════════════════════════

  onCourseExcelSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (!element?.files?.length) return;

    const file = element.files[0];
    this.courseExcelFile = file;
    this.parsedCourseRows = [];
    this.courseUploadError = '';
    this.courseUploadSuccess = '';
    this.isParsingCourseExcel = true;
    this.cdr.detectChanges();

    const reader = new FileReader();

    reader.onerror = () => {
      this.isParsingCourseExcel = false;
      this.courseUploadError = 'The browser failed to read the file.';
      this.cdr.detectChanges();
    };

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const target = e.target;
        if (!target?.result) throw new Error('FileReader returned an empty result.');

        const data = new Uint8Array(target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', raw: true });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawObjects: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawObjects?.length) {
          this.courseUploadError = 'The file was read but contained 0 rows.';
          this.isParsingCourseExcel = false;
          this.cdr.detectChanges();
          return;
        }

        const targetData: ParsedCourseRow[] = [];

        for (const row of rawObjects) {
          const cleanRow: any = {};
          Object.keys(row).forEach(key => cleanRow[key.toLowerCase().trim()] = row[key]);

          const courseCode = String(
            cleanRow['course_code'] ?? cleanRow['course code'] ?? cleanRow['code'] ?? ''
          ).trim();
          const courseName = String(
            cleanRow['course_name'] ?? cleanRow['course name'] ?? cleanRow['name'] ?? ''
          ).trim();
          const branchName = String(
            cleanRow['branch_name'] ?? cleanRow['branch name'] ?? cleanRow['branch'] ?? ''
          ).trim();

          if (!courseCode && !courseName) continue;
          targetData.push({ course_code: courseCode, course_name: courseName, branch_name: branchName });
        }

        if (!targetData.length) {
          this.courseUploadError =
            "Could not map any rows. Check columns: course_code, course_name, branch_name.";
          this.courseExcelFile = null;
        } else {
          this.parsedCourseRows = targetData;
        }

        this.isParsingCourseExcel = false;
        this.cdr.detectChanges();

      } catch (err: any) {
        this.isParsingCourseExcel = false;
        this.courseExcelFile = null;
        this.courseUploadError = `Failed to parse the file: ${err?.message || err}`;
        this.cdr.detectChanges();
      }
    };

    reader.readAsArrayBuffer(file);
  }

  uploadParsedCourses(): void {
    if (!this.parsedCourseRows.length) {
      this.courseUploadError = 'No parsed rows to upload.';
      return;
    }
    this.isUploadingCourses = true;
    this.courseUploadError = '';
    this.courseUploadSuccess = '';
    this.cdr.detectChanges();

    this.http.post<any>(`${environment.apiBaseUrl}/course-master/bulk-upload`, { courses: this.parsedCourseRows }).subscribe({
      next: (res) => {
        this.isUploadingCourses = false;
        if (res?.success) {
          const skippedNote = res.skipped_existing?.length
            ? ` (${res.skipped_existing.length} skipped as duplicates: ${res.skipped_existing.join(', ')})`
            : '';
          this.courseUploadSuccess = `✓ ${res.inserted_count} course(s) added.${skippedNote}`;
          this.parsedCourseRows = [];
          this.courseExcelFile = null;
          this.loadCourses();
        } else {
          this.courseUploadError = 'The server did not confirm the upload.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isUploadingCourses = false;
        this.courseUploadError = err?.error?.detail || 'Failed to upload courses.';
        this.cdr.detectChanges();
      }
    });
  }

  clearParsedCourses(): void {
    this.parsedCourseRows = [];
    this.courseExcelFile = null;
    this.courseUploadError = '';
    this.courseUploadSuccess = '';
  }
}