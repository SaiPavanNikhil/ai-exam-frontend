import { Component, ElementRef, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from '../../environments/environment.service';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})
export class ExamComponent implements OnInit, OnDestroy {

  @ViewChild('video') videoRef!: ElementRef;

  // ---------------- STREAMS ----------------
  combinedStream: MediaStream | null = null;
  videoStream: MediaStream | null = null;
  audioStream: MediaStream | null = null;

  // ---------------- RECORDERS ----------------
  videoRecorder: any;
  fullVideo: Blob[] = [];

  // ---------------- FLAGS ----------------
  interviewCompleted = false;
  isSpeaking = false; 
  isGradingPrevious = false; 
  isGeneratingQuestions = false; 
  questionsGenerated = false;    
  isSocketReady = false;

  candidateId!: number;
  candidateName: string = '';
  candidateEmail: string = '';

  // ---------------- DATA ----------------
  answer: string = '';
  currentQuestion: any = null;
  currentQuestionIndex: number = 0;
  generatedQuestionsCount: number = 0;
  interviewId: string = '';
  // candidateName: string = '';
  interviewDetails: any = null;
  
  // 🔥 FIX: Added Missing Variable Definitions
  selectedCourse: any = null;
  interviewQuestions: any[] = [];

  // 👇 ADD THIS LINE HERE TO RESOLVE THE COMPILER ERROR
  speechRecognitionInstance: any = null;

  // ---------------- PDF Handling ----------------
  referencePdf: File | null = null; 
  referencePdfName: string = '';
  aiSessionCategory: string = ''; 
  isGenerating: boolean = false;
  displaySubject: string = '';

  // ---------------- TIMING/STATE ----------------
  timeLeft = 50;
  interval: any;
  questionStartTime: number = 0;
  questionEndTime: number = 0;
  currentQuestionId: number | null = null;

  faceStatus: 'idle' | 'checking' | 'success' | 'error' = 'idle';
  faceError: string = '';
  audioLevel: number = 0;

  audioContext!: AudioContext;
  analyser!: AnalyserNode;
  micStream!: MediaStream;
  preCheckInterval: any;
  okDetected = false;
  isOkListenerActive: boolean = false;

  isEvaluatingResult = false;
  
  mode: 'choice' | 'self' | 'scheduled' = 'choice';
  allowedCourses: any[] = [];
  // selectedCourse: string = '';

  scheduledInterviews: any[] = [];

selectedScheduledInterview: any = null;

  scheduleMessage: string = '';

  isCheckingSchedule: boolean = false;

  isInterviewFinishing = false;

  silenceTimer: any = null;

  candidateStartedSpeaking = false;

  socket!: WebSocket;
  currentQuestionText: any;

  // for intervew end time purposes
  scheduledInterviewEndTimer: any = null;

  scheduledInterviewEndTime: string = '';

  questionSkippedDueToSilence = false;

  audioMeterAnimationId: number | null = null;

  questionSource: 'BANK' | 'AI' = 'BANK';

  

  constructor(private http: HttpClient, private route: ActivatedRoute, public router: Router, private cdr: ChangeDetectorRef,  private ngZone: NgZone) {}

  ngOnInit() {
    this.initPreCheck();
    this.loadCandidateSession();
  }

  ngOnDestroy() {
  this.stopAllStreams();
}

private readonly FACE_ANALYSIS_API =
'https://ai-interview-face-analysis-production.up.railway.app';

  // ================= 1. GENERATE QUESTIONS FROM PDF =================
  generateQuestionsFromPdf() {
    if (!this.referencePdf || !this.selectedCourse) {
      alert("Please select a course and attach a reference syllabus PDF.");
      return;
    }
    
    this.isGeneratingQuestions = true;
    const formData = new FormData();
    formData.append('file', this.referencePdf);
    formData.append('num_questions', '5'); 
    formData.append('course', this.selectedCourse); 

    this.http.post<any>(`${environment.apiBaseUrl}/api/upload-and-generate-questions`, formData)
      .subscribe({
        next: (res) => {
          this.isGeneratingQuestions = false;
          this.questionsGenerated = true;
          this.generatedQuestionsCount = res.count;
          this.aiSessionCategory = res.category;
          this.displaySubject = res.display_subject;
          console.log("✅ Questions generated from PDF. Count:", res.count, "Category:", this.aiSessionCategory);
        },
        error: (err) => {
          this.isGeneratingQuestions = false;
          console.error("❌ PDF Processing failed:", err);
          alert("Failed to process PDF. Please try again.");
        }
      });
  }

  // ================= 2. START INTERVIEW WITH HANDSHAKE & COURSE MATCHING =================
//  startInterview() {
//     // 1. Read the current live scheduled handshake profile record context block
//     this.http.get<any>(`${environment.apiBaseUrl}/api/interviews/latest`)
//       .subscribe({
//         next: (latestRes) => {
//           if (!latestRes.success || !latestRes.data?.candidate?.id) {
//             alert("Unable to verify an active candidate interview session handshake.");
//             return;
//           }

//           // Capture explicit details out of handshake initialization payload data
//           const targetCandidateId = latestRes.data.candidate.id;
//           this.interviewId = latestRes.data.interview.id;
//           this.interviewDetails = latestRes.data;

//           console.log(`🔍 Handshake successful. Resolving question bank assignments for Candidate ID: ${targetCandidateId}`);

//           // 2. Fetch all evaluation question models dynamically matched to this candidate's course track
//           this.http.get<any>(`${environment.apiBaseUrl}/api/get-questions-by-candidate/${targetCandidateId}`)
//             .subscribe({
//               next: async (qRes) => {
//                 if (qRes.success && qRes.questions.length > 0) {
//                   // Bind structural elements cleanly to frontend tracking state blocks
//                   this.interviewQuestions = qRes.questions;
//                   this.candidateName = qRes.candidate_name;
//                   this.selectedCourse = qRes.matched_course; // e.g. "B-Tech", "MCA", etc.
//                   this.currentQuestionIndex = 0;
                  
//                   console.log(`✅ Loaded ${qRes.total_questions} questions for track: ${this.selectedCourse}`);

//                   // 3. Mount device hard
//                   await this.initStreams();
//                   this.startVideoRecording();
//                   this.initWebSocket();
//                   this.startAudioStreaming();
                  
//                   // 4. Trigger assessment flow steps
//                   this.loadNextQuestion(); 
//                   this.startTimer();
                  
//                   clearInterval(this.preCheckInterval);
//                 } else {
//                   alert(`No structured evaluation questions exist in the database bank matching the track: ${qRes.matched_course || 'Unknown'}.`);
//                 }
//               },
//               error: (qErr) => {
//                 console.error("❌ Question mapping lookup execution failure:", qErr);
//                 alert("An exception occurred while building your target course evaluation profile data.");
//               }
//             });
//         },
//         error: (err) => {
//           console.error("❌ Pre-interview handshake sequence crashed:", err);
//           alert("Failed to initialize system authorization settings.");
//         }
//       });
//   }

  scheduledCandidateId: number | null = null;

  startInterview() {

    console.log(`🎬 Launching Exam Room Workspace. Mode: ${this.mode}`);

    // Stop pre-check listeners
    clearInterval(this.preCheckInterval);

    this.okDetected = true;

    if (this.speechRecognitionInstance) {
      this.speechRecognitionInstance.stop();
    }

    // =====================================================
    // SELF ASSESSMENT
    // =====================================================

    if (this.mode === 'self') {

      if (!this.selectedCourse) {

        alert('Please select a course.');

        return;

      }

      // =====================================================
      // QUESTION BANK
      // =====================================================

      if (this.questionSource === 'BANK') {

        this.http.get<any>(
          `${environment.apiBaseUrl}/api/get-questions-by-candidate/${this.candidateId}?course_id=${this.selectedCourse.course_id}`
        )
        .subscribe({

          next: async (res) => {

            console.log(
              '📚 Self Assessment Questions Loaded',
              res
            );

            if (!this.interviewId) {

              this.interviewId =
                `SELF-PRACTICE-${Date.now()}`;

            }

            this.interviewQuestions = res.questions;

            this.currentQuestionIndex = 0;

            this.selectedCourse = {

              course_id: res.course_id,

              course_name: res.course_name,

              branch_name: res.branch_name

            };

            await this.launchHardwareAndMediaPipelines();

          },

          error: (err) => {

            console.error(
              '❌ Failed To Load Question Bank Questions',
              err
            );

            alert(
              err?.error?.detail ||
              'Unable to load questions from Question Bank.'
            );

          }

        });

      }

      // =====================================================
      // AI GENERATED QUESTIONS
      // =====================================================

      else {

        this.http.post<any>(
          `${environment.apiBaseUrl}/api/self-assessment/generate-questions`,
          {
            course_id: this.selectedCourse.course_id
          }
        )
        .subscribe({

          next: async (res) => {

            console.log(
              '📚 AI Generated Self Assessment Questions',
              res
            );

            if (!this.interviewId) {

              this.interviewId =
                `SELF-PRACTICE-${Date.now()}`;

            }

            this.interviewQuestions = res.questions;

            this.currentQuestionIndex = 0;

            this.selectedCourse = {

              course_id: res.course_id,

              course_name: res.course_name,

              branch_name: res.branch_name

            };

            await this.launchHardwareAndMediaPipelines();

          },

          error: (err) => {

            console.error(
              '❌ Failed To Generate Self Assessment Questions',
              err
            );

            alert(
              err?.error?.detail ||
              'Unable to generate interview questions.'
            );

          }

        });

      }

      return;

    }

    // =====================================================
    // SCHEDULED ASSESSMENT
    // =====================================================

    if (this.mode === 'scheduled') {

      const candidateId =
        this.candidateId;

      const interview =
        this.selectedScheduledInterview;

      if (!interview) {

        alert(
          'Please select an interview.'
        );

        return;

      }

      this.http.get<any>(
        `${environment.apiBaseUrl}/api/interviews/load-questions/${candidateId}/${interview.interview_id}`
      )
      .subscribe({

        next: async (res) => {

          console.log(
            '📚 Scheduled Questions Loaded',
            res
          );

          // ✅ Save the candidate ID for later use
          this.scheduledCandidateId = res.candidate_id;

          console.log(
            '👤 Scheduled Candidate ID:',
            this.scheduledCandidateId
          );

          this.interviewId =
            res.interview_id;

          this.interviewQuestions =
            res.questions;

          this.currentQuestionIndex = 0;

          this.selectedScheduledInterview = {

            ...interview,

            interview_type: res.interview_type,

            interview_name: res.interview_name,

            course_id: res.course_id

          };

          await this.launchHardwareAndMediaPipelines();

        },

        error: (err) => {

          console.error(
            '❌ Failed To Load Questions',
            err
          );

          alert(
            err?.error?.detail ||
            'Unable to load scheduled questions.'
          );

        }

      });

      return;

    }

  }

/**
 * Helper function to cleanly trigger webcam layouts, clocks, and websockets 
 * across both execution modes.
 */
async launchHardwareAndMediaPipelines() {

  await this.stopPrecheckAudio();
  await this.initStreams();

  this.startVideoRecording();
  this.initWebSocket();
  await this.startAudioStreaming();
  
  this.loadNextQuestion();
  this.startTimer();
  if (this.mode === 'scheduled') {

    this.startScheduledInterviewEndWatcher();

  }
}

  // ================= 3. SAVE & GRADE =================
  saveAnswer() {

    if (!this.currentQuestion) {
      return;
    }

    let answerText = (this.answer || '').trim();

    // ------------------------------------------
    // Candidate skipped manually
    // ------------------------------------------
    if (answerText === 'Candidate skipped this question manually.') {

      answerText =
        'Candidate skipped this question manually.';

    }

    // ------------------------------------------
    // Candidate skipped because of silence
    // ------------------------------------------
    if (this.questionSkippedDueToSilence) {

      answerText =
        'Candidate did not answer this question. The interview system automatically skipped the question after detecting more than 10 seconds of silence.';

    }

    const formData = new FormData();

    formData.append(
      'candidate_id',
      (this.scheduledCandidateId || this.candidateId).toString()
    );

    formData.append(
      'question_id',
      this.currentQuestion.id.toString()
    );

    formData.append(
      'interview_id',
      this.interviewId.trim()
    );

    formData.append(
      'answer_text',
      answerText
    );

    // Only scheduled interviews have a panel
    if (
      this.mode === 'scheduled' &&
      this.selectedScheduledInterview
    ) {

      formData.append(
        'panel_id',
        this.selectedScheduledInterview.panel_id.toString()
      );

    }

    console.log(
      '💾 Submitting Answer For AI Grading',
      {
        skipped: this.questionSkippedDueToSilence,
        answer: answerText
      }
    );

    this.http.post<any>(
      `${environment.apiBaseUrl}/api/submit-and-grade`,
      formData
    )
    .subscribe({

      next: (res) => {

        console.log(
          '✅ Answer Submitted',
          res
        );

      },

      error: (err) => {

        console.error(
          '❌ Failed To Submit Answer',
          err
        );

      }

    });

  }

  handleNextQuestion() {

    if (this.silenceTimer) {

        clearTimeout(this.silenceTimer);

        this.silenceTimer = null;

    }

    if (
      this.interviewCompleted ||
      this.isInterviewFinishing
    ) {
      return;
    }

    console.log('➡️ handleNextQuestion called');

    // ===========================
    // SELF ASSESSMENT
    // ===========================

    if (this.mode === 'self') {

      const request = this.saveSelfAssessmentAnswer();

      if (!request) {
        return;
      }

      request.subscribe({

        next: () => {

          this.currentQuestionIndex++;

          this.answer = '';

          this.loadNextQuestion();

          this.resetTimer();

        },

        error: (err) => {

          console.error(
            '❌ Failed To Save Self Assessment Answer',
            err
          );

        }

      });

      return;

    }

    // ===========================
    // SCHEDULED INTERVIEW
    // ===========================

    this.saveAnswer();

    this.currentQuestionIndex++;

    this.answer = '';

    this.loadNextQuestion();

    this.resetTimer();

  }



  // ================= 4. LOAD NEXT COMPLIANT QUESTION =================
  loadNextQuestion() {

  // No more questions left
  if (
    !this.interviewQuestions ||
    this.currentQuestionIndex >= this.interviewQuestions.length
  ) {

    console.log(
      `🏁 ${this.mode === 'self'
        ? 'Self Assessment'
        : 'Scheduled Interview'} Completed`
    );

    this.finishInterview();

    return;
  }

  // Clear previous silence timer
  if (this.silenceTimer) {

    clearTimeout(this.silenceTimer);

    this.silenceTimer = null;

  }

  // Reset flags
  this.candidateStartedSpeaking = false;

  this.questionSkippedDueToSilence = false;

  // Load question
  this.currentQuestion =
    this.interviewQuestions[
      this.currentQuestionIndex
    ];

  this.currentQuestionText =
    this.currentQuestion.question_text ||
    this.currentQuestion.question;

  // Reset answer
  this.answer = '';

  // Reset timer
  this.timeLeft = 50;

  console.log(
    `📚 Question ${
      this.currentQuestionIndex + 1
    }/${this.interviewQuestions.length}`
  );

  console.log(
    'Current Question:',
    this.currentQuestion
  );

  this.speakQuestion(
    this.currentQuestion.question_text ||
    this.currentQuestion.question
  );

  this.cdr.detectChanges();
}



  // ================= MEDIA & STREAMING =================
 async initStreams() {

    // If all streams already exist, reuse them
    if (
        this.videoStream &&
        this.audioStream &&
        this.combinedStream
    ) {

        console.log("♻ Reusing existing media streams");

    } else {

        console.log("🎥 Initializing interview media streams...");

        // Camera only
        this.videoStream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

        // Microphone only
        this.audioStream =
            await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: {
                    noiseSuppression: true,
                    echoCancellation: true,
                    autoGainControl: true,
                    channelCount: 1
                }
            });

        // Merge them for recording
        this.combinedStream =
            new MediaStream([
                ...this.videoStream.getVideoTracks(),
                ...this.audioStream.getAudioTracks()
            ]);

    }

    if (this.videoRef?.nativeElement) {

        this.videoRef.nativeElement.srcObject =
            this.videoStream;

    }

    console.log(
        "🎥 Video Tracks:",
        this.videoStream.getVideoTracks().length
    );

    console.log(
        "🎤 Audio Tracks:",
        this.audioStream.getAudioTracks().length
    );

}

  startVideoRecording() {

  this.fullVideo = [];

  this.videoRecorder = new MediaRecorder(
    this.combinedStream!,
    {
      mimeType: 'video/webm;codecs=vp8'
    }
  );

  this.videoRecorder.onstart = () => {

    console.log("🎥 Interview Recording Started");

  };

  this.videoRecorder.ondataavailable = (e: BlobEvent) => {

    if (e.data.size > 0) {

      this.fullVideo.push(e.data);

    }

  };

  this.videoRecorder.onstop = () => {

    console.log("🎬 Recording Finished");

    // Run face analysis for BOTH modes
    this.uploadVideoForEmotionAnalysis();

  };

  this.videoRecorder.start(1000);

}

  initWebSocket() {

    console.log('🔌 Initializing WebSocket...');

    // this.socket = new WebSocket(
    //   'ws://127.0.0.1:8000/ws/audio'
    // );
    this.socket = new WebSocket(
      'wss://ai-exam-backend-code-production.up.railway.app/ws/audio'
    );

    this.socket.onopen = () => {

      console.log('✅ WebSocket Connected');

    };

    this.socket.onmessage = (event) => {

      console.log("📥 RAW MESSAGE:", event.data); 
      const data = JSON.parse(event.data);

      this.ngZone.run(() => {

        // Only process transcript
        if (data.transcript && !this.isSpeaking) {

          // Candidate has started speaking
          if (!this.candidateStartedSpeaking) {

            this.candidateStartedSpeaking = true;

            console.log("🎤 Candidate started answering.");

            // Stop silence timer permanently
            if (this.silenceTimer) {

              clearTimeout(this.silenceTimer);

              this.silenceTimer = null;

            }

          }

          this.answer += ' ' + data.transcript;

          console.log("Transcript:", data.transcript);

          this.cdr.detectChanges();

        }

      });

    };

    this.socket.onerror = (err) => {

      console.error('❌ WebSocket Error:', err);

    };

    this.socket.onclose = () => {

      console.log('🔌 WebSocket Closed');

    };

  }


streamSource!: MediaStreamAudioSourceNode;
streamProcessor!: ScriptProcessorNode;
streamGain!: GainNode;

async startAudioStreaming() {

  if (!this.audioStream) {
    console.error("❌ Audio stream not available.");
    return;
  }

  const audioTracks = this.audioStream.getAudioTracks();

  if (audioTracks.length === 0) {
    console.error("❌ No audio track found.");
    return;
  }

  console.log("🎤 Audio Track:", audioTracks[0]);

  this.audioContext = new AudioContext({
    sampleRate: 16000
  });

  console.log("Before Resume:", this.audioContext.state);

  await this.audioContext.resume();

  console.log("After Resume:", this.audioContext.state);

  this.streamSource =
    this.audioContext.createMediaStreamSource(
      this.audioStream
    );

  this.streamProcessor =
    this.audioContext.createScriptProcessor(
      4096,
      1,
      1
    );

  this.streamGain =
    this.audioContext.createGain();

  // Keep muted
  this.streamGain.gain.value = 0;

  this.streamSource.connect(this.streamProcessor);
  this.streamProcessor.connect(this.streamGain);

  // Required in many Chrome versions so onaudioprocess continues firing
  this.streamGain.connect(this.audioContext.destination);

  this.streamProcessor.onaudioprocess = (e) => {

    console.log("🎤 onaudioprocess fired");

    if (this.isSpeaking) {
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const input = e.inputBuffer.getChannelData(0);

    const pcmData = new Int16Array(input.length);

    for (let i = 0; i < input.length; i++) {
      pcmData[i] =
        Math.max(-1, Math.min(1, input[i])) * 0x7fff;
    }

    console.log("📤 Sending PCM:", pcmData.length);

    this.socket.send(pcmData.buffer);

  };

}
  private _videoRef!: ElementRef<HTMLVideoElement>;

@ViewChild('video', { static: false }) 
set videoContent(content: ElementRef<HTMLVideoElement>) {
  if (content) {
    this._videoRef = content;
    // If the stream was already resolved while the user was on the selection screen, 
    // immediately attach it here the moment the DOM element renders!
    if (this.videoStream) {
      this._videoRef.nativeElement.srcObject = this.videoStream;
    }
  }
}

// ================= PRE-CHECK LOGIC =================
async initPreCheck() {

  try {

    this.videoStream = await navigator.mediaDevices.getUserMedia({
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
    },
    audio: false
});

this.combinedStream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 }
  },
  audio: {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true
  }
});

this.videoStream = this.combinedStream;
this.audioStream = this.combinedStream;

    if (this._videoRef && this._videoRef.nativeElement) {

      this._videoRef.nativeElement.srcObject = this.videoStream;

    }

    // this.startFaceDetectionLoop();

    // COMMENT BOTH
    // this.startAudioMeter();

    setTimeout(() => {
      this.startSpeechDetection();
    }, 300);

  }
  catch(err) {

    console.error(err);

  }

}

  // startFaceDetectionLoop() {
  //   this.faceStatus = 'checking';
  //   this.preCheckInterval = setInterval(() => {
  //     const canvas = document.createElement('canvas');
  //     const video = this.videoRef.nativeElement;
  //     if (!video.videoWidth) return;
  //     canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  //     canvas.getContext('2d')!.drawImage(video, 0, 0);
  //     canvas.toBlob(blob => {
  //       const fd = new FormData(); fd.append('file', blob!, 'f.jpg');
  //       this.http.post<any>(`${environment.apiBaseUrl}/detect-face`, fd).subscribe(res => {
  //         this.faceStatus = res.faces === 1 ? 'success' : 'error';
  //       });
  //     }, 'image/jpeg');
  //   }, 2000);
  // }

  // startAudioMeter() {
  //   this.audioContext = new AudioContext();
  //   const source = this.audioContext.createMediaStreamSource(this.micStream);
  //   this.analyser = this.audioContext.createAnalyser();
  //   source.connect(this.analyser);
  //   const data = new Uint8Array(this.analyser.frequencyBinCount);
  //   const update = () => {
  //     this.analyser.getByteFrequencyData(data);
  //     this.audioLevel = (data.reduce((a, b) => a + b) / data.length) * 2;
  //     requestAnimationFrame(update);
  //   };
  //   update();
  // }
//   startAudioMeter() {
//   // If audioStream is missing tracks, abort gracefully instead of crashing
//   if (!this.audioStream || this.audioStream.getAudioTracks().length === 0) {
//     console.error("❌ No audio track available for the AudioMeter.");
//     return;
//   }

//   const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
//   this.audioContext = new AudioContextClass();
  
//   // FIX: Swapped out the undefined 'this.micStream' for your actual active 'this.audioStream'
//   const source = this.audioContext.createMediaStreamSource(this.audioStream);
//   this.analyser = this.audioContext.createAnalyser();
//   this.analyser.fftSize = 256;
//   source.connect(this.analyser);
  
//   const data = new Uint8Array(this.analyser.frequencyBinCount);
//   const update = () => {

//   // Stop immediately once interview starts
//   if (this.interviewId) {

//     console.log("🛑 Stopping Precheck Audio Meter");

//     if (this.audioMeterAnimationId) {
//       cancelAnimationFrame(this.audioMeterAnimationId);
//       this.audioMeterAnimationId = null;
//     }

//     return;
//   }

//   this.analyser.getByteFrequencyData(data);

//   const total = data.reduce((a, b) => a + b, 0);

//   const average = total / data.length;

//   this.audioLevel = Math.min(
//     Math.round((average / 128) * 100),
//     100
//   );

//   this.audioMeterAnimationId =
//     requestAnimationFrame(update);

// };


//   update();
// }

 // ================= VOICE HANDSHAKE ACTIVATION =================
  // startSpeechDetection() {
  //   if (this.isOkListenerActive) return;
  //   this.isOkListenerActive = true;

  //   const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  //   if (!SpeechRec) {
  //     console.warn("⚠️ Speech Recognition API not supported in this browser viewport.");
  //     return;
  //   }

  //   const rec = new SpeechRec();
  //   rec.continuous = false; // Fresh instances per block prevent buffer lag
  //   rec.lang = 'en-IN';
  //   rec.interimResults = false;

  //   rec.onresult = (e: any) => {
  //     // Grab the latest verbal string phrase transcript converted to lowercase
  //     const msg = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
  //     console.log("🎙️ Speech heard during room initialization pre-check:", msg);

  //     // Matches "ok", "okay", "ok let's go", "ok lets go", or "let's go"
  //     if (msg === 'ok' || msg === 'okay' || msg.includes('ok let') || msg.includes('lets go')) {
  //       console.log("🚀 Launch keyword matched! Booting targeted interview profile arrays...");
  //       this.okDetected = true;
  //       this.isOkListenerActive = false;
        
  //       rec.stop(); // Shut down configuration stage listener cleanly
  //       this.startInterview(); // Immediately transitions state and pulls structural questions
  //     }
  //   };

  //   rec.onend = () => {
  //     // Loop execution routine: If interview hasn't deployed, turn the mic back on to keep listening
  //     if (!this.okDetected && !this.interviewCompleted && !this.interviewId) {
  //       console.log("🔄 Re-initializing voice activation tracking loop...");
  //       try {
  //         rec.start();
  //       } catch (err) {
  //         // Guard against overlapping processing state flags
  //         this.isOkListenerActive = false;
  //       }
  //     } else {
  //       this.isOkListenerActive = false;
  //     }
  //   };

  //   rec.onerror = (err: any) => {
  //     console.error("❌ Speech recognition diagnostic warning:", err.error);
  //     // Let onend handle the loop restoration if it drops out due to silence/timeout
  //   };

  //   rec.start();
  // }
  startSpeechDetection() {
  if (this.isOkListenerActive) return;
  this.isOkListenerActive = true;

  const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  if (!SpeechRec) {
    console.warn("⚠️ Web Speech API is not natively supported inside this browser build framework.");
    return;
  }

  this.speechRecognitionInstance = new SpeechRec();
  this.speechRecognitionInstance.continuous = false;
  this.speechRecognitionInstance.lang = 'en-IN';
  this.speechRecognitionInstance.interimResults = false;

  this.speechRecognitionInstance.onresult = (e: any) => {
    const msg = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("🎙️ Detected Initialization Phrase:", msg);

    if (msg === 'ok' || msg === 'okay' || msg.includes('ok let') || msg.includes('lets go')) {
      this.okDetected = true; 
      this.speechRecognitionInstance.stop();
      
      // 💡 FIX: Both paths must route here to cleanly initialize media, recorders, and DOM layouts!
      this.startInterview();
    }
  };

  this.speechRecognitionInstance.onend = () => {
    this.isOkListenerActive = false;
    
    // Stop looping speech triggers if self-assessment setup is already completed
    if (this.mode === 'self' && this.selectedCourse && this.interviewQuestions.length > 0) {
      console.log("🛑 Self-Assessment layout ready with questions. Ending background voice loop.");
      return;
    }

    if (!this.okDetected && !this.interviewCompleted && !this.interviewId) {
      try {
        this.speechRecognitionInstance.start();
        this.isOkListenerActive = true;
      } catch (err) {
        console.error("Failed to re-engage speech listener loop:", err);
      }
    }
  };

  this.speechRecognitionInstance.onerror = (err: any) => {
    if (err.error !== 'no-speech') {
      console.error("🎙️ Speech Recognition Engine diagnostic notice:", err.error);
    }
  };

  try {
    this.speechRecognitionInstance.start();
  } catch (e) {
    console.error("Speech initialization syntax block error:", e);
  }
}

  // ================= UTILS =================
  startTimer() {

  clearInterval(this.interval);

  this.interval = setInterval(() => {

    this.ngZone.run(() => {

      if (this.timeLeft > 0) {

        this.timeLeft--;

      } else {
        clearInterval(this.interval);

        this.handleNextQuestion();
      }

      this.cdr.detectChanges();

    });

  }, 1000);
}
  resetTimer() {
    clearInterval(this.interval);
    this.timeLeft = 50;
    this.startTimer();
  }

  get formattedTime() {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  speakQuestion(text: string) {

    if (!text) return;

    window.speechSynthesis.cancel();

    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {

      this.isSpeaking = false;

      console.log('🔊 Question finished speaking');

      // Candidate has 10 seconds to START speaking
      this.silenceTimer = setTimeout(() => {

        this.ngZone.run(() => {

          // Already answered something
          if (this.candidateStartedSpeaking) {
            return;
          }

          if (this.interviewCompleted) {
            return;
          }

          console.log("⏰ No response detected.");

          Swal.fire({

            title: 'No Response Detected',

            text: 'No speech was detected for 10 seconds. Are you still thinking about your answer?',

            icon: 'question',

            showCancelButton: true,

            confirmButtonText: 'Skip Question',

            cancelButtonText: 'Continue Answering',

            allowOutsideClick: false,

            allowEscapeKey: false

          }).then((result) => {

            // Candidate chose to skip
            if (result.isConfirmed) {

              this.questionSkippedDueToSilence = true;

              this.answer =
                'Candidate skipped this question after remaining silent for more than 10 seconds.';

              this.handleNextQuestion();

              return;
            }

            // Candidate is still thinking
            this.candidateStartedSpeaking = false;

            this.silenceTimer = setTimeout(() => {

              if (!this.candidateStartedSpeaking && !this.interviewCompleted) {

                this.ngZone.run(() => {

                  // Ask again after another 10 seconds
                  this.speakQuestionSilenceCheck();

                });

              }

            }, 10000);

          });

        });

      }, 10000);

    };

    window.speechSynthesis.speak(utterance);

  }

  private speakQuestionSilenceCheck() {

    Swal.fire({

      title: 'Still No Response',

      text: 'Would you like to skip this question?',

      icon: 'question',

      showCancelButton: true,

      confirmButtonText: 'Skip Question',

      cancelButtonText: 'Continue Answering',

      allowOutsideClick: false,

      allowEscapeKey: false

    }).then((result) => {

      if (result.isConfirmed) {

        this.questionSkippedDueToSilence = true;

        this.answer =
          'Candidate skipped this question after remaining silent for more than 10 seconds.';

        this.handleNextQuestion();

        return;
      }

      this.candidateStartedSpeaking = false;

      this.silenceTimer = setTimeout(() => {

        if (!this.candidateStartedSpeaking && !this.interviewCompleted) {

          this.ngZone.run(() => {

            this.speakQuestionSilenceCheck();

          });

        }

      }, 10000);

    });

  }

  // finishInterview() {
  //   this.interviewCompleted = true;
  //   if (this.videoRecorder?.state !== 'inactive') this.videoRecorder.stop();
  //   if (this.socket) this.socket.close();

  //   this.stopAllStreams();
  //   this.uploadFinalVideo();
  //   alert('🎉 Interview Completed!');
  //   this.router.navigate(['']);
  // }
  async finishInterview() {

    if (this.isInterviewFinishing) {
      return;
    }

    if (this.scheduledInterviewEndTimer) {

      clearTimeout(
        this.scheduledInterviewEndTimer
      );

    }

    this.isInterviewFinishing = true;

    clearInterval(this.interval);

    this.interviewCompleted = true;

    console.log('🏁 Interview Finished');

    // if (this.mode === 'self') {

    //   this.generateFinalSelfAssessmentResult();
    // }
    if (this.mode === 'self') {

      // Show loading immediately
      this.isEvaluatingResult = true;

    }

    // if (
    //     this.mode === 'scheduled' &&
    //     this.videoRecorder &&
    //     this.videoRecorder.state === 'recording'
    // ) {

    //     this.videoRecorder.stop();

    // }
    if (
        this.videoRecorder &&
        this.videoRecorder.state === 'recording'
    ) {

        this.videoRecorder.stop();

    }

    if (this.socket) {

        this.socket.close();

    }

    this.stopAllStreams();

    console.log('✅ Interview Cleanup Completed');

    // ===========================
    // Scheduled Interview Completed
    // ===========================
    if (this.mode === 'scheduled') {

      Swal.fire({
        icon: 'success',
        title: 'Interview Completed',
        html: `
          <div style="font-size:16px">
            <p><strong>Thank you!</strong></p>
            <p>Your interview has been completed successfully.</p>
            <p>You may now close this window.</p>
          </div>
        `,
        confirmButtonText: 'OK',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {

        // Return to login/home page
        this.router.navigate(['/']);

      });

    }

  }

  uploadFinalVideo() {

  if (this.mode === 'self') {
    console.log('📚 Self Assessment - skipping video upload');
    return;
  }

  const blob = new Blob(this.fullVideo, {
    type: 'video/webm'
  });

  const fd = new FormData();
  fd.append('file', blob, 'final.webm');

  this.http.post(
    `${environment.apiBaseUrl}/save-video/${this.interviewId}`,
    fd
  ).subscribe();
}

  goToDashboard() {
    this.router.navigate(['']);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.referencePdf = file;
      this.generateQuestionsFromPdf(); // Routes formatting parameters directly inside clean context handler
    }
  }

  // stopAllStreams() {
  //   if (this.combinedStream) {
  //     this.combinedStream.getTracks().forEach(track => {
  //       track.stop();
  //       console.log(`Stopped track: ${track.kind}`);
  //     });
  //   }
  //   if (this.audioContext) this.audioContext.close();
  //   clearInterval(this.preCheckInterval);
  //   clearInterval(this.interval);
    
  //   this.combinedStream = null;
  //   this.videoStream = null;
  //   this.audioStream = null;
  // }
  stopAllStreams() {
  // Clear tracking operations
  clearInterval(this.preCheckInterval);
  clearInterval(this.interval);

  if (this.speechRecognitionInstance) {
    this.speechRecognitionInstance.stop();
  }

  // Turn off device components safely
  if (this.combinedStream) {
    this.combinedStream.getTracks().forEach(track => {
      track.stop();
      console.log(`Closed Hardware Device Stream Link Component: ${track.kind}`);
    });
  }
  
  if (this.audioContext && this.audioContext.state !== 'closed') {
    this.audioContext.close();
  }

  this.combinedStream = null;
  this.videoStream = null;
  this.audioStream = null;
}

selectMode(choice: 'self' | 'scheduled') {

  this.mode = choice;

  if (choice === 'self') {

    this.selectedCourse = null;

    this.http.get<any>(
      `${environment.apiBaseUrl}/api/candidate-courses/${this.candidateEmail}`
    )
    .subscribe({
      next: (res) => {

        this.allowedCourses =
          res.allowed_courses;

      }
    });

  }

  else if (choice === 'scheduled') {

    this.checkScheduledInterview();

  }

}

fetchLatestInterviewHandshake() {
  // 💡 QUICK FIX: Query using email so the backend can link your candidate table rows together!
  this.http.get<any>(`${environment.apiBaseUrl}/api/interviews/latest?email=${this.candidateEmail}`)
    .subscribe({
      next: (res: any) => {
        if (res.success && res.data?.interview) {
          const interviewData = res.data.interview;
          const currentStatus = interviewData.status;

          if (currentStatus === 'Completed') {
            alert(`The interview session (${interviewData.interview_id}) for ${interviewData.interview_category} has already been completed.`);
            this.mode = 'choice';
          } else {
            this.interviewId = interviewData.interview_id;
            this.selectedCourse = interviewData.interview_category;
            this.loadQuestionsForSelectedCourse();
          }
        } else {
          alert("No scheduled interviews are active for your candidate profile.");
          this.mode = 'choice';
        }
      },
      error: (err: any) => {
        console.error("❌ Handshake lookup failure:", err);
        alert("Unable to verify an active candidate interview session handshake.");
        this.mode = 'choice';
      }
    });
}

  loadQuestionsForSelectedCourse() {

  if (!this.selectedCourse) {
    alert("Please select a course.");
    return;
  }

  console.log("✅ Course selected.");

  // Wait for candidate to say "OK"
  this.startSpeechDetection();
}

backToChoice() {
  this.mode = 'choice';
  this.interviewId = '';
}

loadCandidateSession() {
    const userSessionRaw = localStorage.getItem('user');
    
    if (!userSessionRaw) {
      console.warn("⚠️ No active authorization token detected. Evicting layout view back to gateway.");
      this.router.navigate(['/']); // Redirect to login modal index context
      return;
    }

    try {
      const parsedUserData = JSON.parse(userSessionRaw);
      
      // Store variables into memory for use in all subsequent APIs
      this.candidateId = parsedUserData.id;
      this.candidateName = parsedUserData.name;
      this.candidateEmail = parsedUserData.email;

      console.log(`👤 Active Session Mounted Successfully. Target ID: ${this.candidateId} (${this.candidateName})`);
    } catch (error) {
      console.error("❌ Broken context structural string formatting mapped to local storage node:", error);
      this.router.navigate(['/']);
    }
  }

  // saveSelfAssessmentAnswer() {

  //   if (!this.currentQuestion) {

  //     console.warn('No active question found.');

  //     return null;

  //   }

  //   let answerText = this.answer?.trim() || '';

  //   // ------------------------------------------
  //   // Candidate skipped because of silence
  //   // ------------------------------------------
  //   if (this.questionSkippedDueToSilence) {

  //     answerText =
  //       'Candidate did not answer this question. The interview system automatically skipped the question after detecting more than 10 seconds of silence.';

  //   }

  //   const formData = new FormData();

  //   formData.append(
  //     'candidate_id',
  //     this.candidateId.toString()
  //   );

  //   formData.append(
  //     'question_text',
  //     this.currentQuestion.question_text ||
  //     this.currentQuestion.question
  //   );

  //   formData.append(
  //     'expected_answer',
  //     this.currentQuestion.expected_answer
  //   );

  //   formData.append(
  //     'answer_text',
  //     answerText
  //   );

  //   formData.append(
  //     'assessment_id',
  //     this.interviewId
  //   );

  //   formData.append(
  //     'course',
  //     this.selectedCourse.course_name
  //   );

  //   console.log(
  //     '📤 Saving Self Assessment Answer',
  //     {
  //       question:
  //         this.currentQuestion.question_text ||
  //         this.currentQuestion.question,
  //       expectedAnswer: this.currentQuestion.expected_answer,
  //       skipped: this.questionSkippedDueToSilence,
  //       answer: answerText
  //     }
  //   );

  //   return this.http.post<any>(
  //     `${environment.apiBaseUrl}/api/self-assessment/submit-answer`,
  //     formData
  //   );

  // }

  saveSelfAssessmentAnswer() {

    if (!this.currentQuestion) {

      console.warn('No active question found.');

      return null;

    }

    let answerText = this.answer?.trim() || '';

    // ------------------------------------------
    // Candidate skipped because of silence
    // ------------------------------------------

    if (this.questionSkippedDueToSilence) {

      answerText =
        'Candidate did not answer this question. The interview system automatically skipped the question after detecting more than 10 seconds of silence.';

    }

    const formData = new FormData();

    // ------------------------------------------
    // Candidate
    // ------------------------------------------

    formData.append(
      'candidate_id',
      this.candidateId.toString()
    );

    // ------------------------------------------
    // IMPORTANT: Question ID
    // ------------------------------------------

    formData.append(
      'question_id',
      this.currentQuestion.id.toString()
    );

    // ------------------------------------------
    // Question text
    // ------------------------------------------

    formData.append(
      'question_text',
      this.currentQuestion.question_text ||
      this.currentQuestion.question
    );

    // ------------------------------------------
    // Expected answer
    // ------------------------------------------

    formData.append(
      'expected_answer',
      this.currentQuestion.expected_answer || ''
    );

    // ------------------------------------------
    // Candidate answer
    // ------------------------------------------

    formData.append(
      'answer_text',
      answerText
    );

    // ------------------------------------------
    // Assessment / interview ID
    // ------------------------------------------

    formData.append(
      'assessment_id',
      this.interviewId
    );

    // ------------------------------------------
    // Course
    // ------------------------------------------

    formData.append(
      'course',
      this.selectedCourse?.course_name || ''
    );

    console.log(
      '📤 Saving Self Assessment Answer',
      {
        candidateId: this.candidateId,

        questionId:
          this.currentQuestion.id,

        question:
          this.currentQuestion.question_text ||
          this.currentQuestion.question,

        expectedAnswer:
          this.currentQuestion.expected_answer,

        answer:
          answerText,

        assessmentId:
          this.interviewId,

        course:
          this.selectedCourse?.course_name
      }
    );

    return this.http.post<any>(
      `${environment.apiBaseUrl}/api/self-assessment/submit-answer`,
      formData
    );

  }

generateFinalSelfAssessmentResult() {

  this.isEvaluatingResult = true;

  console.log(
    '📊 Generating Final Self Assessment Result:',
    this.interviewId
  );

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/self-assessment/generate-final-result/${this.interviewId}`,
    {}
  )
  .subscribe({

    next: (res) => {

      console.log(
        '✅ Final Result Generated',
        res
      );

      this.loadFinalSelfAssessmentResult();
    },

    error: (err) => {

      console.error(
        '❌ Failed To Generate Final Result',
        err
      );
    }

  });
}

finalMarks: number = 0;
overallMarks: number = 0;
percentageScore: number = 0;
assignedQuestions: number = 0;
attemptedQuestions: number = 0;
attemptPercentage: number = 0;

finalResponse: any = {
  strengths: [],
  improvements: [],
  summary: ''
};

completedCourse: string = '';

loadFinalSelfAssessmentResult() {

  this.http.get<any>(
    `${environment.apiBaseUrl}/api/self-assessment/result/${this.interviewId}`
  )
  .subscribe({

    next: (res) => {

      console.log('🏆 Final Result Loaded', res);

      this.finalMarks = res.result.final_marks;
      this.overallMarks = res.result.maximum_marks;
      this.percentageScore = res.result.percentage;
      this.completedCourse = res.result.course;
      this.assignedQuestions = res.result.assigned_questions;
      this.attemptedQuestions = res.result.attempted_questions;
      this.attemptPercentage = res.result.attempt_percentage;

      try {

        this.finalResponse = JSON.parse(res.result.final_response);

        if (this.emotionAnalysis) {

          if (!this.finalResponse.improvements) {
            this.finalResponse.improvements = [];
          }

          const metrics = [
            { key: 'confidence', label: 'Confidence' },
            { key: 'engagement', label: 'Engagement' },
            { key: 'eye_contact', label: 'Eye Contact' },
            { key: 'body_language', label: 'Body Language' },
            { key: 'clarity', label: 'Clarity' },
            { key: 'energy_level', label: 'Energy Level' },
            { key: 'calmness', label: 'Calmness' }
          ];

          metrics.forEach(metric => {
            if (this.emotionAnalysis[metric.key] < 60) {
              this.finalResponse.improvements.push(
                `Need to improve ${metric.label}.`
              );
            }
          });

          // Nervousness is opposite (higher is worse)
          if (this.emotionAnalysis.nervousness > 60) {
            this.finalResponse.improvements.push(
              'Need to reduce Nervousness.'
            );
          }

        }

      } catch (e) {

        console.warn(
          '⚠️ Failed to parse final response JSON',
          e
        );

        this.finalResponse = {
          strengths: [],
          improvements: [],
          summary: res.result.final_response
        };

      }

      console.log(
        '🎭 Emotion Analysis Object:',
        this.emotionAnalysis
      );

      console.log(
        '📊 Parsed Final Response:',
        this.finalResponse
      );

      // Hide loader AFTER everything is complete
      this.isEvaluatingResult = false;
      this.cdr.detectChanges();

    },

    error: (err) => {

      console.error(
        '❌ Failed To Load Result',
        err
      );

      this.isEvaluatingResult = false;

    }

  });

}

checkScheduledInterview() {

  if (!this.candidateEmail) {

    alert('Candidate email not found.');

    return;
  }

  this.isCheckingSchedule = true;

  this.http.get<any>(
    `${environment.apiBaseUrl}/api/interviews/check-schedule/${this.candidateEmail}`
  )
  .subscribe({

    next: (res) => {

      this.isCheckingSchedule = false;

      console.log(
        '📅 Schedule Check Response:',
        res
      );

      this.scheduleMessage = res.message;

      this.scheduledInterviews =
        res.interviews || [];

      this.selectedScheduledInterview = null;

      console.log(
        '📋 Scheduled Interview:',
        this.scheduledInterviews
      );

      console.log(
        '🆔 Scheduled Candidate ID:',
        this.scheduledCandidateId
      );

      console.log(
        '📚 Scheduled Course:',
        this.selectedScheduledInterview?.course
      );

      /*
        Possible values:

        none
        upcoming
        ready
        expired
        completed
        cancelled
      */
    },

    error: (err) => {

      this.isCheckingSchedule = false;

      console.error(
        '❌ Schedule Check Failed:',
        err
      );

      alert(
        err?.error?.detail ||
        'Unable to verify scheduled interview.'
      );
    }

  });

}

saveCurrentAnswer() {

  if (!this.currentQuestion) {
    return;
  }

  const payload = {

    candidate_id:
      this.mode === 'scheduled'
        ? this.scheduledCandidateId
        : this.candidateId,

    interview_id:
      this.interviewId,

    question_id:
      this.currentQuestion.id,

    answer_text:
      this.answer || '',

    time_taken:
      50 - this.timeLeft
  };

  console.log(
    '💾 Saving Answer',
    payload
  );

  return this.http.post<any>(
    `${environment.apiBaseUrl}/api/submit-and-grade`,
    payload
  );
}

uploadInterviewRecording() {

  const videoBlob = new Blob(
    this.fullVideo,
    {
      type: 'video/webm'
    }
  );

  if (videoBlob.size === 0) {

    console.error("❌ Recording is empty.");

    return;
  }

  const formData = new FormData();

  formData.append(
    'file',
    videoBlob,
    `${this.interviewId}.webm`
  );

  console.log("⬆ Uploading Interview Recording...");

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/interviews/save-video/${this.interviewId}`,
    formData
  )
  .subscribe({

    next: (res) => {

      console.log(
        "✅ Recording Uploaded Successfully",
        res
      );

    },

    error: (err) => {

      console.error(
        "❌ Recording Upload Failed",
        err
      );

    }

  });

}


emotionAnalysis: any = null;

uploadVideoForEmotionAnalysis() {

  console.log("🎭 Starting Self Assessment Video Analysis...");

  const videoBlob = new Blob(
    this.fullVideo,
    {
      type: 'video/webm'
    }
  );

  if (videoBlob.size === 0) {

    console.error("❌ Recorded video is empty.");

    // Continue with result generation even if video failed
    this.generateFinalSelfAssessmentResult();

    return;

  }

  const formData = new FormData();

  formData.append(
    'file',
    videoBlob,
    `${this.interviewId}.webm`
  );

  console.log("⬆ Uploading video for emotion analysis...");

  this.http.post<any>(
    `${this.FACE_ANALYSIS_API}/analyze-video`,
    formData
  )
  .subscribe({

   next: (res) => {

      console.log(
        "✅ Emotion Analysis Completed",
        res
      );

      // Calculate UI metrics
      this.emotionAnalysis = this.calculateScores(res);

      console.log(
        "🎭 Calculated Emotion Analysis:",
        this.emotionAnalysis
      );

      // Save ORIGINAL face-analysis response into backend
      this.saveVideoAnalysis(res);

      // Continue flow based on interview mode
      if (this.mode === 'self') {

        // Generate AI result for self assessment
        this.generateFinalSelfAssessmentResult();

      } else {

        // Scheduled interview:
        // Upload recording after face analysis completes
        this.uploadInterviewRecording();

      }

    },

    error: (err) => {

      console.error(
        "❌ Emotion Analysis Failed",
        err
      );

      // Continue normal flow even if emotion analysis fails
      if (this.mode === 'self') {

        this.generateFinalSelfAssessmentResult();

      } else {

        this.uploadInterviewRecording();

      }

    }

  });

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
      grade: this.getGrade(overall_score)
    };
}

async stopPrecheckAudio() {

  console.log("🛑 Cleaning Precheck Audio");

  // Stop audio meter animation
  if (this.audioMeterAnimationId) {
    cancelAnimationFrame(this.audioMeterAnimationId);
    this.audioMeterAnimationId = null;
  }

  // Disconnect Web Audio nodes
  try {
    this.streamProcessor?.disconnect();
    this.streamSource?.disconnect();
    this.streamGain?.disconnect();
  } catch (e) {}

  // Close AudioContext
  if (
    this.audioContext &&
    this.audioContext.state !== 'closed'
  ) {
    await this.audioContext.close();
  }

  // Stop SpeechRecognition
  try {
    this.speechRecognitionInstance?.stop();
  } catch (e) {}

  // ⭐ IMPORTANT: Stop ONLY the microphone tracks
  if (this.audioStream) {
    this.audioStream.getAudioTracks().forEach(track => {
      track.stop();
    });
  }

  // Clear reference
  this.audioStream = undefined as any;

}

getGrade(score: number): string {

    if (score >= 93) return 'A+';
    if (score >= 88) return 'A';
    if (score >= 83) return 'A-';
    if (score >= 78) return 'B+';
    if (score >= 73) return 'B';
    if (score >= 68) return 'B-';
    if (score >= 63) return 'C+';
    if (score >= 58) return 'C';
    if (score >= 53) return 'C-';

    return 'D';

}

selectScheduledInterview(interview: any) {

  this.selectedScheduledInterview = interview;

  console.log(
    'Selected Interview:',
    interview
  );

}

startScheduledInterviewEndWatcher() {

  
  if (this.mode !== 'scheduled') {
    return;
  }

  if (!this.selectedScheduledInterview?.scheduled_end_at) {
    return;
  }

  const endTime = new Date(
    this.selectedScheduledInterview.scheduled_end_at
  );

  const now = new Date();

  const remaining =
    endTime.getTime() - now.getTime();

  console.log(
    `⏰ Scheduled interview ends in ${
      Math.round(remaining / 1000)
    } seconds`
  );

  if (remaining <= 0) {

    this.forceEndScheduledInterview();

    return;

  }

  this.scheduledInterviewEndTimer =
    setTimeout(() => {

      this.forceEndScheduledInterview();

    }, remaining);

}
forceEndScheduledInterview() {

  if (
    this.interviewCompleted ||
    this.isInterviewFinishing
  ) {
    return;
  }

  console.log(
    "⏰ Scheduled Interview End Time Reached"
  );

  clearInterval(this.interval);

  if (this.silenceTimer) {

    clearTimeout(this.silenceTimer);

  }

  // Save whatever candidate has spoken
  this.saveAnswer();

  Swal.fire({

    icon: 'info',

    title: 'Interview Time Completed',

    text:
      'The scheduled interview time has ended. Your current answer has been submitted automatically.',

    confirmButtonText: 'OK',

    allowOutsideClick: false,

    allowEscapeKey: false

  }).then(() => {

    this.finishInterview();

  });

}

skipCurrentQuestion() {

  if (!this.currentQuestion || this.interviewCompleted) {
    return;
  }

  Swal.fire({
    title: 'Skip Question?',
    text: 'This question will be marked as skipped. You cannot return to it.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Skip',
    cancelButtonText: 'Continue Answering',
    allowOutsideClick: false
  }).then((result) => {

    if (!result.isConfirmed) {
      return;
    }

    // Stop silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // Stop TTS if still speaking
    window.speechSynthesis.cancel();

    // Save skip reason
    // If the candidate has already answered something,
    // preserve that answer. Otherwise mark it as skipped.
    if (!this.answer || this.answer.trim().length === 0) {

      this.answer =
        'Candidate skipped this question manually.';

    } else {

      console.log(
        '📝 Candidate answered before skipping. Saving transcript:',
        this.answer
      );

    }

    // Move to next question
    this.handleNextQuestion();

  });

}

saveVideoAnalysis(analysis: any) {

  const payload = {

    interview_id: this.interviewId,

    candidate_id:
      this.mode === 'self'
        ? this.candidateId
        : this.scheduledCandidateId,

    interview_mode:
      this.mode === 'self'
        ? 'SELF'
        : 'SCHEDULED',

    analysis: analysis

  };

  console.log(
    "💾 Saving Video Analysis",
    payload
  );

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/interviews/save-video-analysis`,
    payload
  )
  .subscribe({

    next: (res) => {

      console.log(
        "✅ Video Analysis Saved Successfully",
        res
      );

    },

    error: (err) => {

      console.error(
        "❌ Failed To Save Video Analysis",
        err
      );

    }

  });

}

}