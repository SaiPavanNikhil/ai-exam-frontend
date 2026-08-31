// import { Routes } from '@angular/router';
// import { ExamComponent } from './pages/exam/exam.component';
// import { ScheduleComponent } from './pages/schedule/schedule.component';
// import { LandingPageComponent } from './pages/landing-page/landing-page.component';
// import { CommitteeDashboardComponent } from './pages/committee-dashboard/committee-dashboard.component';
// import { ChairmanDashboardComponent } from './pages/chairman-dashboard/chairman-dashboard.component';
// import { AddMemberComponent } from './pages/add-member/add-member.component';
// import { AddQuestionsComponent } from './pages/add-questions/add-questions.component';
// import { CandidateLoginComponent } from './pages/candidate-login/candidate-login.component';
// import { RegisterStudentsComponent } from './pages/register-students/register-students.component';
// import { NewScheduleComponent } from './pages/new-schedule/new-schedule.component';

// export const routes: Routes = [
//     // { path: '', component: ExamComponent },
//     // { path: 'schedule', component: ScheduleComponent },
//     // { path: 'LandingPage', component: LandingPageComponent },

// { path: 'exam', component: ExamComponent },
//     { path: 'schedule', component: ScheduleComponent },
//     { path: 'CommitteeDashboard', component: CommitteeDashboardComponent },
//     // { path: 'ChairmanDashboard', component: ChairmanDashboardComponent },
//     { path: '', component: LandingPageComponent },
//       { path: 'CommitteeDashboard/:id', component: CommitteeDashboardComponent },
//     { path: 'ChairmanDashboard/:id', component: ChairmanDashboardComponent },
//          { path: 'add-member', component: AddMemberComponent },
//       { path: 'add-question', component: AddQuestionsComponent },
//       { path: 'login', component: CandidateLoginComponent },
//       { path: 'register-candidate', component: RegisterStudentsComponent },
//       { path: 'new-schedule', component: NewScheduleComponent },
// ];
import { Routes } from '@angular/router';
import { ExamComponent } from './pages/exam/exam.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { CommitteeDashboardComponent } from './pages/committee-dashboard/committee-dashboard.component';
import { ChairmanDashboardComponent } from './pages/chairman-dashboard/chairman-dashboard.component';
import { AddMemberComponent } from './pages/add-member/add-member.component';
import { AddQuestionsComponent } from './pages/add-questions/add-questions.component';
import { CandidateLoginComponent } from './pages/candidate-login/candidate-login.component';
import { RegisterStudentsComponent } from './pages/register-students/register-students.component';
import { NewScheduleComponent } from './pages/new-schedule/new-schedule.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { CandidateQuestionGenerationComponent } from './pages/candidate-question-generation/candidate-question-generation.component';
import { JdCreationComponent } from './pages/jd-creation/jd-creation.component';
import { JdAssessmentComponent } from './pages/jd-assessment/jd-assessment.component';
import { JdScheduleFormComponent } from './pages/jd-schedule-form/jd-schedule-form.component';
// import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [

  // Pages WITHOUT sidebar (public / standalone)
  { path: '', component: LandingPageComponent },
  { path: 'exam', component: ExamComponent },
  { path: 'login', component: CandidateLoginComponent },
  { path: 'CommitteeDashboard', component: CommitteeDashboardComponent },
  { path: 'CommitteeDashboard/:id', component: CommitteeDashboardComponent },
  { path: 'ChairmanDashboard/:id', component: ChairmanDashboardComponent },

  // Pages WITH fixed sidebar
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'schedule', component: ScheduleComponent },
      { path: 'new-schedule', component: NewScheduleComponent },
      { path: 'add-member', component: AddMemberComponent },
      { path: 'add-question', component: AddQuestionsComponent },
      { path: 'register-candidate', component: RegisterStudentsComponent },
      { path: 'jd-creation', component: JdCreationComponent },
      { path: 'jd-assessment', component: JdAssessmentComponent },
      // { path: 'generate-candidate-questions', component: CandidateQuestionGenerationComponent },
    ]
  },
   { path: 'jd-form', component: JdScheduleFormComponent }
];