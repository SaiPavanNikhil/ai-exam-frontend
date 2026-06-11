import { Component, ChangeDetectorRef } from '@angular/core'; // 👈 Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-register-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-students.component.html',
  styleUrl: './register-students.component.css'
})
export class RegisterStudentsComponent {
  selectedCourse: string = '';
  excelFile: File | null = null;
  parsedStudents: any[] = []; // Clear array

  isParsing: boolean = false;
  isSaving: boolean = false;
  statusMessage: string = '';
  errorMessage: string = '';

  private apiUrl = 'http://127.0.0.1:8000';

  // 👈 Inject the ChangeDetector reference into the constructor
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  onExcelSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (!element || !element.files || element.files.length === 0) {
      console.error("❌ No file selected or file element target missing.");
      return;
    }

    const file = element.files[0];
    this.excelFile = file;
    this.parsedStudents = [];
    this.statusMessage = '';
    this.errorMessage = '';
    this.isParsing = true;

    console.log(`📂 Selected File Metadata -> Name: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

    const reader = new FileReader();
    
    // Fallback error catcher on the reader stream itself
    reader.onerror = (errorEvent) => {
      console.error("❌ FileReader stream hit a critical read error:", errorEvent);
      this.isParsing = false;
      this.errorMessage = "The browser failed to read the file data bytes.";
      this.cdr.detectChanges();
    };

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const target = e.target;
        if (!target || !target.result) {
          throw new Error("FileReader completed loading but returned an empty result buffer.");
        }

        const data = new Uint8Array(target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', raw: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Strategy change: Use clean object parsing directly with lower-case header fallback normalization
        const rawObjects: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        console.log("📊 1. RAW OBJECTS EXTRACTED FROM SHEET:", rawObjects);

        if (!rawObjects || rawObjects.length === 0) {
          this.errorMessage = "SheetJS read the file but found 0 row data structures.";
          this.isParsing = false;
          this.cdr.detectChanges();
          return;
        }

        const targetData: any[] = [];

        for (const row of rawObjects) {
          // Normalize row keys to handle any mixed casing from your file structure dynamically
          const cleanRow: any = {};
          Object.keys(row).forEach(key => {
            cleanRow[key.toLowerCase().trim()] = row[key];
          });

          // Match your precise sheet column layout values
          const nameVal = String(cleanRow['name'] || '').trim();
          const emailVal = String(cleanRow['email'] || '').trim();
          const phoneVal = String(cleanRow['phone'] || '').trim();
          const branchVal = String(cleanRow['branch'] || 'General').trim();

          // Skip completely empty spacer rows inside the sheet
          if (!nameVal && !emailVal) continue;

          targetData.push({
            name: nameVal,
            email: emailVal,
            phone: phoneVal,
            department_branch: branchVal
          });
        }

        console.log("🚀 2. RE-MADE FRONTEND MATRIX RENDER ARRAY:", targetData);

        if (targetData.length === 0) {
          this.errorMessage = "Could not map any student profiles. Check that your columns are named 'Name', 'Email', 'Phone', and 'Branch'.";
          this.excelFile = null;
        } else {
          this.parsedStudents = targetData;
        }

        this.isParsing = false;
        this.cdr.detectChanges(); // Force template to render data table structures immediately

      } catch (err: any) {
        this.isParsing = false;
        this.excelFile = null;
        this.errorMessage = `Parsing Engine Exception: ${err?.message || err}`;
        this.cdr.detectChanges();
        console.error("❌ SHEETJS EXTRACTION CRITICAL EXCEPTION:", err);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  saveBulkRoster(): void {
    if (!this.selectedCourse) {
      this.errorMessage = 'Please select a Target Course Program first.';
      return;
    }
    if (this.parsedStudents.length === 0) {
      this.errorMessage = 'No student rows available to save. Please upload a valid Excel sheet.';
      return;
    }

    this.isSaving = true;
    this.statusMessage = '';
    this.errorMessage = '';

    // Create the exact payload expected by the Pydantic schema on the backend
    const payload = {
      course_program: this.selectedCourse,
      students: this.parsedStudents
    };

    this.http.post<any>(`${this.apiUrl}/api/save-bulk-students`, payload)
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.statusMessage = `🎉 Success! Registered ${res.inserted_count} candidates under track: ${this.selectedCourse}.`;
            // Wipe state clean upon a successful transaction
            this.parsedStudents = [];
            this.excelFile = null;
            this.selectedCourse = '';
          } else {
            this.errorMessage = res.error || 'The server database rejected the records.';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = err?.error?.detail || 'An issue occurred while committing records to the database backend.';
          this.cdr.detectChanges();
          console.error("❌ Submit error details:", err);
        }
      });
  }
}