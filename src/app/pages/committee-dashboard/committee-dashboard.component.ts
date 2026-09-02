import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { InterviewService } from '../../services/interview.service';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

interface InterviewSchedule {
  interviewId: string;
  date: string;
  time: string;
  role: string;
  chairman: string;
  panel: string;
  status: 'Live' | 'Done' | 'Pending';
}

interface EvaluationQA {
  question: string;
  answer: string;
  score?: number;
}

interface Candidate {
  name: string;
  init: string;
  initBg: string;
  initColor: string;
  meta: string;
  listMeta: string;
  dob: string;
  gen: string;
  mob: string;
  email: string;
  cgpa: string;
  sem: string;
  skills: string[];
  ai: string;
  aiTags: [string, string][];
  sub: string;
  schedule: InterviewSchedule;
  recordedVideo?: string;
  evaluations: EvaluationQA[];
}



interface Criterion {
  label: string;
  key: string;
}

interface Criteria {
  name: string;
  score: number;
}

@Component({
  selector: 'app-committee-dashboard',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, FormsModule, CommonModule],
  templateUrl: './committee-dashboard.component.html',
  styleUrl: './committee-dashboard.component.css'
})
export class CommitteeDashboardComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  isVideoModalOpen = false;
  interviewCandidates: any[] = [];
  assignCandidates: any[] = [];
  interviews: any[] = [];
  selectedMemberDetails: any = null;
  isMemberModalOpen = false;
  members: any[] = [];
  panelMembers: any[] | null = null;
  dashboard: any = {};
  user: any = {};
  userId!: number;

  isEvaluated: boolean = false;
  selectedIndex: number = 0;   // 👉 first item selected
  isOpen = true;              // 👉 dropdown open
  selectedCandidate: any = null; // 👉 no fake empty object

  // candidates: Candidate[] = [
  //   {
  //     name: 'Rahul Sharma',
  //     init: 'R',
  //     initBg: '#eef2ff',
  //     initColor: '#4f46e5',
  //     meta: 'B.Tech Computer Science · BHU · Roll: CS2101',
  //     listMeta: 'B.Tech · CSE · CS2101 · BHU',
  //     dob: '12 Mar 2002',
  //     gen: 'Male · OBC',
  //     mob: '9812345678',
  //     email: 'rahul@bhu.ac.in',
  //     cgpa: '8.7 CGPA',
  //     sem: '3rd Year / Sem 6',
  //     skills: ['Python', 'Machine Learning', 'SQL', 'React', 'Java'],
  //     ai: 'Rahul demonstrates strong analytical reasoning and ML fundamentals. His CGPA of 8.7 and project portfolio suggest above-average technical aptitude.',
  //     aiTags: [
  //       ['strength', 'Strong ML background'],
  //       ['strength', 'High academic score'],
  //       ['watch', 'Verify project depth'],
  //       ['info', 'Relocation: Yes']
  //     ],
  //     sub: 'Rahul Sharma · B.Tech CSE',
  //     schedule: {
  //       interviewId: 'IVW-2026-4821',
  //       date: '15 Apr 2026',
  //       time: '10:00 AM – 1:00 PM',
  //       role: 'Software Engineer',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Live'
  //     },
  //     recordedVideo: 'https://www.w3schools.com/html/mov_bbb.mp4',
  //     evaluations: [
  //       { question: 'Explain OOP concepts', answer: 'Inheritance, Polymorphism, Encapsulation, Abstraction...', score: 9 },
  //       { question: 'What is REST API?', answer: 'Representational State Transfer...', score: 8 },
  //       { question: 'Reverse a linked list', answer: 'Using three pointers method...', score: 10 }
  //     ]
  //   },
  //   {
  //     name: 'Priya Mehta',
  //     init: 'P',
  //     initBg: '#f0fdf4',
  //     initColor: '#16a34a',
  //     meta: 'B.Tech IT · IIT Delhi · Roll: IT2089',
  //     listMeta: 'B.Tech · IT · IT2089 · IIT Delhi',
  //     dob: '5 Jun 2001',
  //     gen: 'Female · General',
  //     mob: '9876543210',
  //     email: 'priya@iitd.ac.in',
  //     cgpa: '9.1 CGPA',
  //     sem: '4th Year / Sem 8',
  //     skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
  //     ai: 'Priya shows exceptional academic performance and a solid full-stack portfolio. Cloud certifications add strong practical value.',
  //     aiTags: [
  //       ['strength', 'Excellent CGPA'],
  //       ['strength', 'Cloud certified'],
  //       ['info', 'Full-stack ready'],
  //       ['info', 'Relocation: Yes']
  //     ],
  //     sub: 'Priya Mehta · B.Tech IT',
  //     schedule: {
  //       interviewId: 'IVW-2026-4822',
  //       date: '16 Apr 2026',
  //       time: '2:00 PM – 5:00 PM',
  //       role: 'Full Stack Developer',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Done'
  //     },
  //     evaluations: []
  //   },
  //   {
  //     name: 'Ankit Verma',
  //     init: 'A',
  //     initBg: '#fffbeb',
  //     initColor: '#d97706',
  //     meta: 'B.Tech ECE · NIT Allahabad · Roll: EC1992',
  //     listMeta: 'B.Tech · ECE · EC1992 · NIT',
  //     dob: '20 Nov 2002',
  //     gen: 'Male · SC',
  //     mob: '9001122334',
  //     email: 'ankit@nit.ac.in',
  //     cgpa: '7.4 CGPA',
  //     sem: '3rd Year / Sem 6',
  //     skills: ['Embedded C', 'MATLAB', 'Arduino'],
  //     ai: 'Strong embedded systems background with DRDO internship.',
  //     aiTags: [['strength', 'DRDO intern'], ['watch', 'Moderate CGPA']],
  //     sub: 'Ankit Verma · B.Tech ECE',
  //     schedule: {
  //       interviewId: 'IVW-2026-4823',
  //       date: '17 Apr 2026',
  //       time: '9:00 AM – 12:00 PM',
  //       role: 'Embedded Engineer',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Pending'
  //     },
  //     evaluations: []
  //   },
  //   {
  //     name: 'Sneha Patel',
  //     init: 'S',
  //     initBg: '#fef2f2',
  //     initColor: '#dc2626',
  //     meta: 'B.Tech CSE · BITS Pilani · Roll: CS1874',
  //     listMeta: 'B.Tech · CSE · CS1874 · BITS',
  //     dob: '8 Feb 2003',
  //     gen: 'Female · General',
  //     mob: '9654321098',
  //     email: 'sneha@bits.ac.in',
  //     cgpa: '8.2 CGPA',
  //     sem: '3rd Year / Sem 6',
  //     skills: ['C++', 'Competitive Programming', 'Django'],
  //     ai: 'Excellent in competitive programming (CodeChef 3-star). Strong algorithmic skills.',
  //     aiTags: [['strength', 'CP 3-star'], ['watch', 'Team collaboration?']],
  //     sub: 'Sneha Patel · B.Tech CSE',
  //     schedule: {
  //       interviewId: 'IVW-2026-4824',
  //       date: '18 Apr 2026',
  //       time: '3:00 PM – 6:00 PM',
  //       role: 'SDE Intern',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Pending'
  //     },
  //     evaluations: []
  //   }
  // ];

  defaultTags = [
    'Strong ML background',
    'High academic score',
    'Verify project depth',
    'Relocation: Yes'
  ];

  staticQA = [
    {
      question: 'Explain OOP concepts',
      answer: 'Object-Oriented Programming (OOP) is a programming approach where you organize code using objects and classes, making it easier to manage, reuse, and scale.',
      score: 9
    },
    {
      question: 'What is REST API?',
      answer: 'A REST API (Representational State Transfer Application Programming Interface) is a way for different software systems to communicate over the internet using standard HTTP methods.',
      score: 8
    },
    {
      question: 'Reverse a linked list',
      answer: 'Reversing a linked list is a classic problem. The idea is to change the direction of the next pointers so the list goes backward.',
      score: 10
    }
  ];
  // criteria: Criterion[] = [
  //   { label: 'Technical Knowledge', key: 'tech' },
  //   { label: 'Problem Solving', key: 'prob' },
  //   { label: 'Communication', key: 'comm' },
  //   { label: 'Domain Aptitude', key: 'domain' },
  //   { label: 'Overall Impression', key: 'overall' }
  // ];

  criteria: Criteria[] = [
    { name: 'Technical Knowledge', score: 0 },
    { name: 'Confidence', score: 0 },
    { name: 'Communication', score: 0 },
    // { name: 'Domain Aptitude', score: 0 },
    { name: 'Overall Impression', score: 0 }
  ];

  scores: { [key: string]: number } = {};
  verdict = '';
  remarks = '';
  currentCandidateIndex = 0;
  showSuccessOverlay = false;
  evaluatedCount = 1;

  constructor(private sanitizer: DomSanitizer, private interviewService: InterviewService
    , private dashboardService: DashboardService
    , private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }


  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user')!);
    this.userId = user.id;
    console.log('User ID:', this.userId);
    this.getLoginUserData();
    this.getDashBoardData();
    this.getInterviewListData();


    // this.initializeScores();
    // this.getInterviewCandidatesData();
  }


  goToChairmanPage() {
    this.router.navigate(['/ChairmanDashboard', this.userId]);
  }

  selectedRowIndex: number | null = null;
  selectedInterview: any = null;

 viewDetails(item: any, index: number) {

  // Toggle close
  if (this.selectedRowIndex === index) {
    this.selectedRowIndex = null;
    this.selectedInterview = null;
    this.isEvaluated = false;
    return;
  }

  // Open row
  this.selectedRowIndex = index;
  this.selectedInterview = item;

  console.log("👉 Candidate ID:", item.candidate_id);
  console.log("👉 Interview ID:", item.interview_id);
  console.log("👉 User ID:", this.userId);

  // Initially allow editing
  this.isEvaluated = false;

  // Check whether THIS USER has already evaluated THIS candidate
  this.dashboardService
    .getFinalVerdict(item.candidate_id, this.userId)
    .subscribe({
      next: (res: any) => {

        console.log("👉 FINAL EVALUATION RESPONSE:", res);

        const remarkArr = res?.remark;

        // Existing evaluation found
        if (
          Array.isArray(remarkArr) &&
          remarkArr.length > 0 &&
          remarkArr[0] &&
          remarkArr[0].trim() !== ''
        ) {
          this.isEvaluated = true;
        } else {
          this.isEvaluated = false;
        }

        console.log(
          "🔒 SUBMIT DISABLED:",
          this.isEvaluated
        );
      },

      error: (err) => {

        console.error(
          "❌ FINAL EVALUATION API ERROR:",
          err
        );

        // If no evaluation exists / API returns error,
        // allow evaluation
        this.isEvaluated = false;
      }
    });

  // Load candidates for selected interview
  this.loadInterviewCandidates(item.interview_id);
}
  // Get Login User Data
  getLoginUserData() {
    this.authService.getUser(this.userId).subscribe({
      next: (res: any) => {
        this.user = res;
      },
      error: (err) => {
        console.error('Error fetching user', err);
      }
    });
  }

  // Get Dashboard  User Data
  getDashBoardData() {
    this.dashboardService.getDashboard(this.userId).subscribe({
      next: (res: any) => {
        this.dashboard = res;
      },
      error: (err) => {
        console.error('Error loading dashboard', err);
      }
    });
  }


  // Get Interview   Data
  getInterviewListData() {
    this.interviewService.getInterviewDetails(this.userId).subscribe({
      next: (res: any) => {
        this.interviews = res;
      },
      error: (err) => {
        console.error('Error loading dashboard', err);
      }
    });
  }
  //get Interview Dropdwon
  loadInterviewCandidates(interviewId: string) {

    this.interviewService
      .getInterviewCandidates(interviewId)
      .subscribe({

        next: (res: any) => {

          console.log("Candidates:", res);

          this.assignCandidates = res.candidates || [];

          this.selectedCandidate = null;

          this.panelMembers = null;

          this.selectedIndex = -1;

        },

        error: (err) => {

          console.error(err);

        }

      });

  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }


  viewMemberDetails(member: any) {
  console.log("Clicked 👉", member);

  if (!this.selectedInterview?.interview_id) {
    console.error("❌ No interview selected");
    return;
  }

  const panelId = member.panel_id;
  const interviewId = this.selectedInterview.interview_id;

  console.log("👉 Panel ID:", panelId);
  console.log("👉 Interview ID:", interviewId);

  // Reset before fetching
  this.isEvaluated = false;

  forkJoin({
    qa: this.dashboardService.getPanelQuestionScores(
      panelId,
      interviewId
    ),

    final: this.dashboardService.getPanelEvaluationFinalMark(
      panelId,
      interviewId
    )
  }).subscribe({
    next: (res: any) => {

      console.log("QA RESPONSE 👉", res.qa);
      console.log("FINAL RESPONSE 👉", res.final);

      // Store the complete response
      this.selectedMemberDetails = {
        qaList: res.qa,
        final: res.final
      };

      this.members = res.final;

      console.log(
        "FINAL UI DATA 👉",
        this.selectedMemberDetails
      );

      // =====================================================
      // CHECK WHETHER FINAL EVALUATION ALREADY EXISTS
      // =====================================================

      const finalData = res.final;

      if (
        finalData &&
        Array.isArray(finalData) &&
        finalData.length > 0
      ) {

        // Check if at least one actual evaluation exists
        const existingEvaluation = finalData.some((item: any) => {

          return (
            item.technical_knowledge !== null &&
            item.technical_knowledge !== undefined &&
            Number(item.technical_knowledge) > 0
          ) ||
            (
              item.problem_solving !== null &&
              item.problem_solving !== undefined &&
              Number(item.problem_solving) > 0
            ) ||
            (
              item.communication !== null &&
              item.communication !== undefined &&
              Number(item.communication) > 0
            ) ||
            (
              item.domain_aptitude !== null &&
              item.domain_aptitude !== undefined &&
              Number(item.domain_aptitude) > 0
            ) ||
            (
              item.overall_impression !== null &&
              item.overall_impression !== undefined &&
              Number(item.overall_impression) > 0
            ) ||
            (
              item.remark &&
              item.remark.trim() !== ''
            ) ||
            (
              item.final_verdict &&
              item.final_verdict !== 'Pending'
            );
        });

        this.isEvaluated = existingEvaluation;

      } else {
        // No final evaluation data
        this.isEvaluated = false;
      }

      console.log(
        "🔒 Submit Button Disabled:",
        this.isEvaluated
      );

      this.isMemberModalOpen = true;
    },

    error: (err) => {

      console.error(
        "❌ PANEL EVALUATION ERROR 👉",
        err
      );

      // If API fails, don't mark it as evaluated
      this.isEvaluated = false;
    }
  });
}

  closeMemberModal() {
    this.isMemberModalOpen = false;
  }

  closeRightPanel() {
    this.selectedCandidate = null;
    this.selectedInterview = null;
  }

  selectCandidate(candidate: any, index: number) {

  this.selectedIndex = index;

  const candidateId = candidate.candidate_id;

  // Initially assume this candidate has NOT been evaluated
  // =====================================================
// CLEAR PREVIOUS CANDIDATE DATA IMMEDIATELY
// =====================================================

this.isEvaluated = false;

this.selectedCandidate = null;
this.panelMembers = null;
this.questionScores = [];

this.selectedMemberDetails = null;

// Reset evaluation fields
this.resetFinalMarks();

// Force Angular to remove previous candidate from UI
this.cdr.detectChanges();

console.log(
  "🔄 Previous candidate cleared. Loading candidate:",
  candidateId
);

  forkJoin({

    candidate: this.dashboardService.getCandidate(candidateId),

    qa: this.dashboardService.getQA(
      candidateId,
      this.userId,
      this.selectedInterview.interview_id
    ),

    panel: this.dashboardService.getPanelMembers(
      candidate.panel_id,
      this.selectedInterview.interview_id,
      candidateId
    ),

    emotion: this.dashboardService.getVideoAnalysis(
      this.selectedInterview.interview_id,
      candidateId
    ),

    // Existing final evaluation
    finalMark: this.dashboardService.getFinalMark(
      candidateId,
      this.userId,
      this.selectedInterview.interview_id
    ),

    questionScores: this.dashboardService.getPanelQuestionScores(
      candidate.panel_id,
      this.selectedInterview.interview_id
    )

  }).subscribe({

    next: (res: any) => {

      console.log("=================================");
      console.log("FINAL MARK API RESPONSE 👉", res.finalMark);
      console.log("=================================");

      // Candidate data
      this.selectedCandidate = res.candidate;

      // QA list
      this.selectedCandidate.qaList =
        res.qa?.qaList || [];

      console.log(
        'Q&A Evaluation Log 👉',
        this.selectedCandidate.qaList
      );

      // AI Question Scores
      this.questionScores =
        res.questionScores || [];

      console.log(
        '🤖 AI Question Scores 👉',
        this.questionScores
      );

      // Technical Knowledge AI Score
      const technicalKnowledge =
        this.calculateTechnicalKnowledgeForMember(
          this.user?.name
        );

      console.log(
        '🧠 Technical Knowledge AI Score:',
        technicalKnowledge
      );

      this.criteria[0].score =
        technicalKnowledge;

      // Clean skills
      if (this.selectedCandidate.skills) {
        this.selectedCandidate.skills =
          this.selectedCandidate.skills.map(
            (s: string) => s.trim()
          );
      }

      // Panel members
      this.panelMembers = res.panel;

      console.log(
        'PANEL 👉',
        this.panelMembers
      );

      // =====================================================
      // CHECK EXISTING FINAL EVALUATION
      // =====================================================

      if (
        res.finalMark &&
        !res.finalMark.message
      ) {

        console.log(
          "✅ EXISTING FINAL EVALUATION FOUND"
        );

        // Load existing values
        this.setFinalMarks(res.finalMark);

        // IMPORTANT:
        // Existing evaluation means button must be disabled
        this.isEvaluated = true;

      } else {

        console.log(
          "🆕 NO FINAL EVALUATION FOUND"
        );

        this.resetFinalMarks();

        // Allow new evaluation
        this.isEvaluated = false;
      }

      console.log(
        "🔒 isEvaluated =",
        this.isEvaluated
      );

      this.cdr.detectChanges();

      // =====================================================
      // Calculate facial analysis scores
      // =====================================================

      if (res.emotion) {

        console.log(
          "🎭 Raw Emotion:",
          res.emotion
        );

        const face =
          this.calculateScores(res.emotion);

        console.log(
          "🎭 Calculated Emotion:",
          face
        );

        // IMPORTANT:
        // Only overwrite these scores if there is NO
        // existing final evaluation.
        if (!this.isEvaluated) {

          this.criteria[1].score =
            Math.round(face.confidence / 10);

          this.criteria[2].score =
            Math.round(face.communication / 10);

          this.criteria[3].score =
            Math.round(face.overall_score / 10);
        }
      }

      console.log(
        "🔒 FINAL BUTTON STATE:",
        this.isEvaluated
      );

      console.log(
        'FINAL DATA 👉',
        this.selectedCandidate
      );
    },

    error: (err) => {

      console.error(
        "❌ Candidate loading error:",
        err
      );

      this.isEvaluated = false;
    }

  });
}

  setFinalMarks(data: any) {

    console.log("📥 Setting existing final marks:", data);

    this.criteria = [

      {
        name: 'Technical Knowledge',
        score: Number(data.technical_knowledge ?? 0)
      },

      {
        name: 'Confidence',
        score: Number(data.problem_solving ?? 0)
      },

      {
        name: 'Communication',
        score: Number(data.communication ?? 0)
      },

      {
        name: 'Overall Impression',
        score: Number(data.overall_impression ?? 0)
      }

    ];

    this.remarks = data.remark ?? '';
    this.verdict = data.final_verdict ?? '';

    console.log(
      "📊 Existing Criteria:",
      this.criteria
    );

    console.log(
      "📝 Existing Remarks:",
      this.remarks
    );

    console.log(
      "🏆 Existing Verdict:",
      this.verdict
    );
  }

  resetFinalMarks() {
    this.criteria = [
      { name: 'Technical Knowledge', score: 0 },
      { name: 'Confidence', score: 0 },
      { name: 'Communication', score: 0 },
      // { name: 'Domain Aptitude', score: 0 },
      { name: 'Overall Impression', score: 0 }
    ];

    this.remarks = '';
    this.verdict = '';
  }

  selectVerdict(value: string) {
    this.verdict = value;
  }

  get completedCount(): number {
    return this.panelMembers?.filter((m: any) => m.status === 'Done')?.length || 0;
  }

  //  submit() {

  //   const payload = {
  //     candidateId: this.selectedCandidate.id,
  //     memberId: this.userId,
  //     remark: this.remarks,
  //     verdict: this.verdict,

  //     qaList: this.selectedCandidate.qaList.map((q: any) => ({
  //       question_id: q.question_id,   // ✅ ADD THIS
  //       score: q.score || 0
  //     }))
  //   };

  //   console.log('Sending Payload 👉', payload);

  //   this.dashboardService.saveEvaluation(payload).subscribe({
  //     next: (res: any) => {
  //       console.log('Saved ✅', res);
  //       alert('Evaluation submitted successfully!');
  //     },
  //     error: (err) => {
  //       console.error('Error ❌', err);
  //       alert('Failed to submit');
  //     }
  //   });
  // }

  // submit() {

  //   const payload = {
  //     candidateId: this.selectedCandidate.id, // ✅ FIXED
  //     memberId: this.userId,
  //     remark: this.remarks,
  //     verdict: this.verdict,

  //     // ✅ QA LIST
  //     qaList: this.selectedCandidate.qaList.map((q: any) => ({
  //       question_id: q.question_id,
  //       score: q.score || 0
  //     })),

  //     // ✅ FINAL MARKING
  //     technical_knowledge: this.criteria[0].score,
  //     problem_solving: this.criteria[1].score,
  //     communication: this.criteria[2].score,
  //     domain_aptitude: this.criteria[3].score,
  //     overall_impression: this.criteria[4].score
  //   };

  //   console.log('Sending Payload 👉', payload);

  //   this.dashboardService.saveEvaluation(payload).subscribe({
  //     next: (res: any) => {
  //       console.log('Saved ✅', res);
  //       alert('Evaluation submitted successfully!');
  //     },
  //     error: (err) => {
  //       console.error('Error ❌', err);
  //       alert('Failed to submit');
  //     }
  //   });
  // }

  questionScores: any[] = [];

  isDataFetched: boolean = false;

  calculateTechnicalKnowledgeForMember(memberName: string): number {

  if (!this.questionScores || this.questionScores.length === 0) {
    return 0;
  }

  const scores: number[] = [];

  this.questionScores.forEach((question: any) => {

    if (
      !question.members ||
      !Array.isArray(question.members)
    ) {
      return;
    }

    const member = question.members.find(
      (m: any) => m.name === memberName
    );

    if (
      member &&
      member.score !== null &&
      member.score !== undefined
    ) {

      const score = Number(member.score);

      if (!isNaN(score)) {
        scores.push(score);
      }

    }

  });

  if (scores.length === 0) {
    return 0;
  }

  const total = scores.reduce(
    (sum, score) => sum + score,
    0
  );

  const average = total / scores.length;

  // AI question scores are out of 10.
  // Technical Knowledge is also out of 10.
  return Math.round(average);
}

  submit() {

  if (!this.selectedCandidate) {
    alert('Please select a candidate.');
    return;
  }

  const payload = {
    candidateId: this.selectedCandidate.id,
    memberId: this.userId,
    remark: this.remarks,
    verdict: this.verdict,
    interview_id: this.selectedInterview.interview_id,

    qaList: (this.selectedCandidate.qaList || []).map((q: any) => ({
      question_id: q.question_id,
      score: q.score || 0
    })),

    technical_knowledge: this.criteria[0]?.score || 0,
    problem_solving: this.criteria[1]?.score || 0,
    communication: this.criteria[2]?.score || 0,
    domain_aptitude: this.criteria[3]?.score || 0,

    // You currently DON'T have criteria[4]
    overall_impression: this.criteria[3]?.score || 0
  };

  console.log('Sending Payload 👉', payload);

  this.dashboardService.saveEvaluation(payload).subscribe({

    next: (res: any) => {

      console.log('Saved ✅', res);

      alert(
        res?.message ||
        'Evaluation submitted successfully!'
      );

      window.location.reload();
    },

    error: (err) => {

      console.error('Error ❌', err);

      alert(
        err?.error?.error ||
        err?.error?.detail ||
        'Failed to submit'
      );

    }

  });
}

  getTagClass(tag: string) {
    tag = tag.toLowerCase();

    if (tag.includes('strong') || tag.includes('high')) return 'tag green';
    if (tag.includes('verify')) return 'tag red';
    if (tag.includes('relocation')) return 'tag blue';

    return 'tag';
  }
  get totalScore(): number {
    return this.criteria.reduce((sum, c) => sum + c.score, 0);
  }

  // get totalScore(): number {
  //   return Object.values(this.scores).reduce((a, b) => a + b, 0);
  // }

  get safeVideoUrl(): SafeUrl | null {
    if (!this.selectedCandidate.recordedVideo) return null;
    return this.sanitizer.bypassSecurityTrustUrl(this.selectedCandidate.recordedVideo);
  }

  // 🔥 Dynamic avatar color
  getColor(name: string): string {
    const colors = ['#6C5CE7', '#00B894', '#0984E3', '#E17055', '#FD79A8'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }








  updateScore(key: string, event: any): void {
    let value = parseInt(event.target.value) || 0;
    value = Math.min(10, Math.max(0, value));
    this.scores[key] = value;
    event.target.value = value;
  }

  setVerdict(val: string): void {
    this.verdict = val;
  }

  // submitEvaluation(): void {
  //   if (this.totalScore === 0 || !this.verdict) {
  //     alert('Please complete all scores and select a verdict');
  //     return;
  //   }

  //   this.showSuccessOverlay = true;
  //   setTimeout(() => {
  //     this.showSuccessOverlay = false;
  //     this.evaluatedCount++;
  //     this.selectedCandidate[this.currentCandidateIndex].schedule.status = 'Done';
  //   }, 2200);
  // }

  openVideoModal(): void {
    this.isVideoModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeVideoModal(): void {
    this.isVideoModalOpen = false;
    document.body.style.overflow = '';

    // Pause video when closing modal
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
    }
  }

  getStatusClass(candidate: Candidate): string {
    switch (candidate.schedule.status) {
      case 'Live': return 'status-live';
      case 'Done': return 'status-done';
      default: return 'status-pending';
    }
  }

  getScoreClass(score?: number): string {
    if (score === undefined) return 'mid';
    if (score >= 8) return 'high';
    if (score >= 6) return 'mid';
    return 'low';
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      this.router.navigate(['/']);
    }
  }

  getTotal(member: any): number {
    return (
      (member.technical_knowledge || 0) +
      (member.problem_solving || 0) +
      (member.communication || 0) +
      (member.domain_aptitude || 0) +
      (member.overall_impression || 0)
    );
  }

  getAverage(member: any): number {
    const total = this.getTotal(member);
    return total / 5; // 5 criteria
  }

  calculateScores(raw: any) {
    const total    = raw.total_analyzed_frames || 1;
    const happy    = raw.happy_frames    || 0;
    const neutral  = raw.neutral_frames  || 0;
    const sad      = raw.sad_frames      || 0;
    const angry    = raw.angry_frames    || 0;
    const fear     = raw.fear_frames     || 0;
    const disgust  = raw.disgust_frames  || 0;
    const surprise = raw.surprise_frames || 0;

    const happyR    = happy    / total;
    const neutralR  = neutral  / total;
    const sadR      = sad      / total;
    const angryR    = angry    / total;
    const fearR     = fear     / total;
    const disgustR  = disgust  / total;
    const surpriseR = surprise / total;
    

    const positiveR = happyR + surpriseR * 0.6;
    const negativeR = sadR + angryR * 1.2 + fearR * 1.0 + disgustR * 0.8;

    const confidence = Math.round(Math.min(100, Math.max(0,
      50 + positiveR * 50 + neutralR * 20 - negativeR * 60
    )));

    // const nervousness = Math.round(Math.min(100, Math.max(0,
    //   fearR * 100 * 2.0 + sadR * 100 * 1.0 + angryR * 100 * 1.5 + disgustR * 100 * 0.8
    // )));

    const answer_quality = Math.round(Math.min(100, Math.max(0,
      45 + neutralR * 30 + positiveR * 45 - negativeR * 50
    )));

    const engagement = Math.round(Math.min(100, Math.max(0,
      25 + positiveR * 70 + neutralR * 15 - negativeR * 40
    )));

    const eye_contact = Math.round(Math.min(100, Math.max(0,
      40 + neutralR * 55 + positiveR * 35 - negativeR * 60
    )));

    const body_language = Math.round(Math.min(100, Math.max(0,
      30 + neutralR * 40 + positiveR * 50 - negativeR * 55
    )));

    const clarity = Math.round(Math.min(100, Math.max(0,
      40 + neutralR * 45 + positiveR * 40 - negativeR * 45
    )));

    const energy_level = Math.round(Math.min(100, Math.max(0,
      20 + positiveR * 75 + neutralR * 15 - negativeR * 30
    )));

    const calmness = Math.round(Math.min(100, Math.max(0,
      30 + neutralR * 65 + positiveR * 25 - negativeR * 80
    )));

    const communication = Math.round((clarity + body_language) / 2);

     // ---------------------------------------------------------
    // ✅ NERVOUSNESS — fixed so it can never collapse to 0
    // ---------------------------------------------------------

    // 1) Rebalanced, bounded weighted average of negative emotions.
    //    Fear's weight reduced (was 2.0x) since DeepFace commonly
    //    confuses fear with surprise/alertness.
    const nervousWeightSum = 1.4 + 1.0 + 1.2 + 0.8; // fear, sad, angry, disgust
    const rawNervousness = Math.round(
      ((fearR * 1.4 + sadR * 1.0 + angryR * 1.2 + disgustR * 0.8) / nervousWeightSum) * 100
    );

    // 2) Guard against tiny/unreliable frame samples. Instead of
    //    multiplying the raw score down (which compounds to 0),
    //    BLEND it toward a mild baseline when sample size is thin —
    //    low data should read as "uncertain", not "confidently zero".
    const minReliableFrames = 15;
    const sampleConfidence = Math.min(1, total / minReliableFrames);
    const baselineNervousness = 15;
    const sampledNervousness = Math.round(
      rawNervousness * sampleConfidence + baselineNervousness * (1 - sampleConfidence)
    );

    // 3) Reconcile with confidence/communication using a SUBTRACTIVE
    //    reduction (not a second multiplier) — high composure lowers
    //    nervousness but can't compound with step 2 to erase it.
    const composure = (communication + confidence) / 2; // 0–100
    const composureReduction = Math.round(composure / 4); // e.g. composure 73 → -18
    const nervousness = Math.max(5, Math.min(100, sampledNervousness - composureReduction));

    const overall_score = Math.max(0, Math.min(100, Math.round(
        confidence     * 0.20 +
        answer_quality * 0.18 +
        engagement     * 0.14 +
        eye_contact    * 0.13 +
        body_language  * 0.10 +
        clarity        * 0.12 +
        energy_level   * 0.07 +
        communication  * 0.22 +
        calmness       * 0.06 -
        nervousness    * 0.08
      )));

      return {
        ...raw,
        confidence,
        nervousness,
        answer_quality,
        engagement,
        eye_contact,
        body_language,
        communication,
        clarity,
        energy_level,
        calmness,
        overall_score,
        // grade: this.getGrade(overall_score)
      };
  }

}