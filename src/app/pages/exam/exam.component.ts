import { Component, ElementRef, ViewChild, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
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
  selectedCourse: string = ''; 
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
  allowedCourses: string[] = [];
  // selectedCourse: string = '';

  scheduledInterviewStatus: string = '';

  scheduledInterview: any = null;

  scheduleMessage: string = '';

  isCheckingSchedule: boolean = false;

  isInterviewFinishing = false;


  socket!: WebSocket;
  currentQuestionText: any;

  constructor(private http: HttpClient, private route: ActivatedRoute, public router: Router, private cdr: ChangeDetectorRef,  private ngZone: NgZone) {}

  ngOnInit() {
    this.initPreCheck();
    this.loadCandidateSession();
  }

  ngOnDestroy() {
  this.stopAllStreams();
}

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

//                   // 3. Mount device hardware loops & connect real-time sockets
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

    if (!this.interviewId) {
      this.interviewId =
        `SELF-PRACTICE-${Date.now()}`;
    }

    this.launchHardwareAndMediaPipelines();

    return;
  }

  // =====================================================
  // SCHEDULED ASSESSMENT
  // =====================================================

  if (this.mode === 'scheduled') {

  const candidateId =
    this.scheduledCandidateId;

  const course =
    this.scheduledInterview?.course;

  if (!candidateId || !course) {

    alert(
      'Interview details not found.'
    );

    return;
  }

  this.http.get<any>(
    `${environment.apiBaseUrl}/api/interviews/load-questions/${candidateId}/${course}`
  )
  .subscribe({

    next: async (res) => {

      console.log(
        '📚 Scheduled Questions Loaded',
        res
      );

      this.interviewId =
        res.interview_id;

      this.selectedCourse =
        res.course;

      this.interviewQuestions =
        res.questions;

      this.currentQuestionIndex = 0;

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

  if (!this.combinedStream) {
      await this.initStreams();
  }

  this.startVideoRecording();
  this.initWebSocket();
  this.startAudioStreaming();
  
  this.loadNextQuestion();
  this.startTimer();
}

  // ================= 3. SAVE & GRADE =================
  saveAnswer() {

  if (!this.currentQuestion) {
    return;
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
    'answer_text',
    (this.answer || '').trim()
  );

  formData.append(
    'panel_id',
    this.scheduledInterview.panel_id.toString()
  );

  console.log(
    '💾 Submitting Answer For AI Grading'
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

    if (
      this.interviewCompleted ||
      this.isInterviewFinishing
    ) {
      return;
    }

    console.log('➡️ handleNextQuestion called');

    if (this.mode === 'self') {
      this.saveSelfAssessmentAnswer();
    } else {
      this.saveAnswer();
    }

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

  // Load question from already-loaded array
  this.currentQuestion =
    this.interviewQuestions[
      this.currentQuestionIndex
    ];

  this.currentQuestionText =
    this.currentQuestion.question_text;

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

  // Speak question
  this.speakQuestion(
    this.currentQuestion.question_text
  );

  this.cdr.detectChanges();
}



  // ================= MEDIA & STREAMING =================
  async initStreams() {

    if (this.combinedStream) {
        console.log("♻ Reusing existing media stream");
        return;
    }

    this.combinedStream =
        await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                noiseSuppression: true,
                echoCancellation: true,
                autoGainControl: true
            }
        });

    this.videoStream =
        new MediaStream(this.combinedStream.getVideoTracks());

    this.audioStream =
        new MediaStream(this.combinedStream.getAudioTracks());

    this.videoRef.nativeElement.srcObject =
        this.videoStream;
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

    this.uploadInterviewRecording();

  };

  this.videoRecorder.start(1000);

}

  initWebSocket() {

  console.log('🔌 Initializing WebSocket...');

  this.socket = new WebSocket('ws://127.0.0.1:8000/ws/audio');

  this.socket.onopen = () => {
    console.log('✅ WebSocket Connected');
  };

  this.socket.onmessage = (event) => {

  const data = JSON.parse(event.data);

  this.ngZone.run(() => {

    if (data.transcript && !this.isSpeaking) {

      this.answer += ' ' + data.transcript;

      console.log('Transcript Added:', data.transcript);

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

  startAudioStreaming() {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(this.audioStream!);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    // processor.connect(audioContext.destination);
    const gain = audioContext.createGain();
    gain.gain.value = 0;

    processor.connect(gain);
    gain.connect(audioContext.destination);
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
      }
      if (
          this.socket?.readyState === WebSocket.OPEN &&
          !this.isSpeaking
      ) {
          this.socket.send(pcmData.buffer);
      }
    };
  }
  private _videoRef!: ElementRef<HTMLVideoElement>;

@ViewChild('video', { static: false }) set videoContent(content: ElementRef<HTMLVideoElement>) {
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
    this.combinedStream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
      audio: { noiseSuppression: true, echoCancellation: true } 
    });
    
    // Fall back to assigning the unified stream reference directly
    this.videoStream = this.combinedStream;
    this.audioStream = this.combinedStream;
    
    // 💡 FIX: Changed 'this.videoRef' to 'this._videoRef' to match your private property
    if (this._videoRef && this._videoRef.nativeElement) {
      this._videoRef.nativeElement.srcObject = this.videoStream;
      
      // Explicitly trigger play to bypass strict browser interaction rules
      this._videoRef.nativeElement.onloadedmetadata = () => {
        this._videoRef.nativeElement.play().catch((err: any) => 
          console.error("Video play execution interrupted:", err)
        );
      };
    }
    
    this.startFaceDetectionLoop();
    this.startAudioMeter();
    
    setTimeout(() => {
      this.startSpeechDetection();
    }, 300);

  } catch (err: any) { // 💡 FIX: Explicitly typed 'err' as 'any' to bypass strict compilation rules
    this.faceStatus = 'error';
    this.faceError = 'Camera/Microphone hardware link failed.';
    console.error("❌ Pre-check media initialization failed:", err);
  }
}

  startFaceDetectionLoop() {
    this.faceStatus = 'checking';
    this.preCheckInterval = setInterval(() => {
      const canvas = document.createElement('canvas');
      const video = this.videoRef.nativeElement;
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      canvas.toBlob(blob => {
        const fd = new FormData(); fd.append('file', blob!, 'f.jpg');
        this.http.post<any>(`${environment.apiBaseUrl}/detect-face`, fd).subscribe(res => {
          this.faceStatus = res.faces === 1 ? 'success' : 'error';
        });
      }, 'image/jpeg');
    }, 2000);
  }

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
  startAudioMeter() {
  // If audioStream is missing tracks, abort gracefully instead of crashing
  if (!this.audioStream || this.audioStream.getAudioTracks().length === 0) {
    console.error("❌ No audio track available for the AudioMeter.");
    return;
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  this.audioContext = new AudioContextClass();
  
  // FIX: Swapped out the undefined 'this.micStream' for your actual active 'this.audioStream'
  const source = this.audioContext.createMediaStreamSource(this.audioStream);
  this.analyser = this.audioContext.createAnalyser();
  this.analyser.fftSize = 256;
  source.connect(this.analyser);
  
  const data = new Uint8Array(this.analyser.frequencyBinCount);
  const update = () => {
    // Stop processing if user leaves the screen or interview starts
    if (!this.mode || this.interviewId) return; 

    this.analyser.getByteFrequencyData(data);
    const total = data.reduce((a, b) => a + b, 0);
    const average = total / data.length;
    
    // Smooth out and scale the visual bar percentage mapping
    this.audioLevel = Math.min(Math.round((average / 128) * 100), 100);
    requestAnimationFrame(update);
  };
  update();
}

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

  // Stop any existing speech first
  window.speechSynthesis.cancel();

  this.isSpeaking = true;

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onend = () => {

    this.isSpeaking = false;

    console.log('🔊 Question finished speaking');
  };

  window.speechSynthesis.speak(utterance);
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

    this.isInterviewFinishing = true;

    clearInterval(this.interval);

    this.interviewCompleted = true;

    console.log('🏁 Interview Finished');

    if (this.mode === 'self') {

      this.generateFinalSelfAssessmentResult();

    }

    if (
        this.mode === 'scheduled' &&
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

    this.selectedCourse = '';

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
    alert("Please ensure a valid course track is selected before proceeding.");
    return;
  }

  console.log(`📡 Fetching question inventory for Candidate ID: ${this.candidateId}, Course: ${this.selectedCourse}`);

  this.http.get<any>(`${environment.apiBaseUrl}/api/get-questions-by-candidate/${this.candidateId}?selected_course=${this.selectedCourse}`)
    .subscribe({
      next: (qRes: any) => {
        if (qRes.success && qRes.questions && qRes.questions.length > 0) {
          
          this.interviewQuestions = qRes.questions; 
          this.currentQuestionIndex = 0;
          console.log(`✅ Loaded ${qRes.total_questions} questions for track: ${qRes.matched_course}`);
          
          // 💡 FLOW CHANGE: Questions are ready in memory! Now activate the voice listener to wait for "OK"
          this.startSpeechDetection();
          
        } else {
          alert("The question bank returned an empty response block for this course category.");
        }
      },
      error: (err: any) => {
        console.error("❌ Failed to pull question stack:", err);
        const errorDetail = err?.error?.detail || "Could not retrieve question arrays from the database.";
        alert(errorDetail);
      }
    });
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

  saveSelfAssessmentAnswer() {

  if (!this.currentQuestion) {
    console.warn('No active question found.');
    return;
  }

  const answerText = this.answer?.trim() || '';

  const formData = new FormData();

  formData.append(
    'candidate_id',
    this.candidateId.toString()
  );

  formData.append(
    'question_id',
    this.currentQuestion.id.toString()
  );

  formData.append(
    'answer_text',
    answerText
  );

  formData.append(
    'assessment_id',
    this.interviewId
  );

  formData.append(
    'course',
    this.selectedCourse
  );

  console.log('📤 Saving Self Assessment Answer');

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/self-assessment/submit-answer`,
    formData
  )
  .subscribe({
    next: (res) => {

      console.log(
        '✅ Answer Saved Successfully',
        res
      );

    },
    error: (err) => {

      console.error(
        '❌ Failed To Save Answer',
        err
      );

    }
  });
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

      console.log(
        '🏆 Final Result Loaded',
        res
      );

      this.finalMarks =
        res.result.final_marks;

      this.overallMarks =
        res.result.maximum_marks;

      this.completedCourse =
        res.result.course;

        this.isEvaluatingResult = false;

      try {

        this.finalResponse =
          JSON.parse(res.result.final_response);

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
        '📊 Parsed Final Response:',
        this.finalResponse
      );
    },

    error: (err) => {

      this.isEvaluatingResult = false;

      console.error(
        '❌ Failed To Load Result',
        err
      );
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

      this.scheduledInterviewStatus =
        res.status;

      this.scheduleMessage =
        res.message;

      this.scheduledInterview =
        res.interview || null;

      // IMPORTANT
      this.scheduledCandidateId =
        res.interview?.candidate_id || null;

      console.log(
        '📋 Scheduled Interview:',
        this.scheduledInterview
      );

      console.log(
        '🆔 Scheduled Candidate ID:',
        this.scheduledCandidateId
      );

      console.log(
        '📚 Scheduled Course:',
        this.scheduledInterview?.course
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


}
