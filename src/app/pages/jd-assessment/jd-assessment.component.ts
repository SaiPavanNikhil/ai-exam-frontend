import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-jd-assessment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './jd-assessment.component.html',
  styleUrl: './jd-assessment.component.css'
})
export class JdAssessmentComponent {

  // ==========================================================
  // CURRENT SCREEN
  // ==========================================================

  currentScreen:
    | 'list'
    | 'prestart'
    | 'assessment'
    | 'review' = 'list';


  // ==========================================================
  // ASSESSMENT
  // ==========================================================

  currentQuestion: number = 0;

  attemptNumber: number = 1;

  isRecording: boolean = false;


  // ==========================================================
  // QUESTIONS
  // ==========================================================

  questions: string[] = [

    'What is FastAPI and what are its main advantages?',

    'Explain the difference between synchronous and asynchronous programming in Python.',

    'How would you design a REST API for a large-scale application?',

    'What is dependency injection and how is it used in FastAPI?',

    'Explain the difference between SQL and NoSQL databases.',

    'How would you optimize a slow PostgreSQL query?',

    'What is authentication and authorization?',

    'Explain how you would handle exceptions in a FastAPI application.',

    'What is Docker and why is it useful for backend applications?',

    'Explain the process you would follow to deploy a FastAPI application.'
  ];


  // ==========================================================
  // ANSWERS
  // ==========================================================

  answers: string[] = [];

  skippedQuestions: boolean[] = [];

  currentAnswer: string = '';


  constructor() {

    this.answers =
      new Array(this.questions.length).fill('');

    this.skippedQuestions =
      new Array(this.questions.length).fill(false);

  }


  // ==========================================================
  // REGISTER
  // ==========================================================

  registerAssessment(): void {

    alert(
      'You have successfully registered for this assessment.'
    );

    // Static demonstration:
    // Move directly to pre-start screen.

    this.currentScreen = 'prestart';

  }


  // ==========================================================
  // START PRE-ASSESSMENT
  // ==========================================================

  startPreAssessment(): void {

    this.currentScreen = 'prestart';

  }


  // ==========================================================
  // START ASSESSMENT
  // ==========================================================

  startAssessment(): void {

    this.currentQuestion = 0;

    this.currentAnswer = '';

    this.isRecording = false;

    this.currentScreen = 'assessment';

    this.loadCurrentAnswer();

  }


  // ==========================================================
  // LOAD CURRENT ANSWER
  // ==========================================================

  loadCurrentAnswer(): void {

    this.currentAnswer =
      this.answers[this.currentQuestion] || '';

  }


  // ==========================================================
  // SUBMIT ANSWER
  // ==========================================================

  submitAnswer(): void {

    const answer =
      this.currentAnswer.trim();


    if (!answer) {

      alert(
        'Please provide an answer before submitting.'
      );

      return;
    }


    // Save answer locally for now.

    this.answers[this.currentQuestion] =
      answer;


    this.skippedQuestions[this.currentQuestion] =
      false;


    // Stop recording if active.

    this.isRecording = false;


    // Last question

    if (
      this.currentQuestion ===
      this.questions.length - 1
    ) {

      this.finishAssessment();

      return;
    }


    // Move to next question

    this.currentQuestion++;

    this.loadCurrentAnswer();

  }


  // ==========================================================
  // SKIP QUESTION
  // ==========================================================

  skipQuestion(): void {

    this.answers[this.currentQuestion] = '';

    this.skippedQuestions[this.currentQuestion] =
      true;


    this.isRecording = false;


    // Last question

    if (
      this.currentQuestion ===
      this.questions.length - 1
    ) {

      this.finishAssessment();

      return;
    }


    this.currentQuestion++;

    this.loadCurrentAnswer();

  }


  // ==========================================================
  // GO TO QUESTION
  // ==========================================================

  goToQuestion(index: number): void {

    this.currentQuestion = index;

    this.loadCurrentAnswer();

    this.isRecording = false;

  }


  // ==========================================================
  // SPEECH TO TEXT
  // ==========================================================

  toggleRecording(): void {

    this.isRecording =
      !this.isRecording;


    if (this.isRecording) {

      /*
       * Static implementation for now.
       *
       * Real browser SpeechRecognition /
       * backend speech-to-text will be connected later.
       */

      console.log(
        'Speech recognition started'
      );

    } else {

      console.log(
        'Speech recognition stopped'
      );

    }

  }


  // ==========================================================
  // FINISH ASSESSMENT
  // ==========================================================

  finishAssessment(): void {

    this.isRecording = false;

    this.currentScreen = 'review';

  }


  // ==========================================================
  // TAKE ANOTHER ATTEMPT
  // ==========================================================

  takeAnotherAttempt(): void {

    this.attemptNumber++;

    this.currentQuestion = 0;

    this.currentAnswer = '';

    this.answers =
      new Array(this.questions.length).fill('');

    this.skippedQuestions =
      new Array(this.questions.length).fill('');

    this.currentScreen = 'prestart';

  }


  // ==========================================================
  // BACK TO LIST
  // ==========================================================

  backToList(): void {

    this.currentScreen = 'list';

  }


  // ==========================================================
  // ANSWERED COUNT
  // ==========================================================

  get answeredCount(): number {

    return this.answers.filter(
      answer =>
        !!answer &&
        answer.trim().length > 0
    ).length;

  }


  // ==========================================================
  // SKIPPED COUNT
  // ==========================================================

  get skippedCount(): number {

    return this.skippedQuestions.filter(
      skipped => skipped
    ).length;

  }

}