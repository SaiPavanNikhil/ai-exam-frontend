import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateQuestionGenerationComponent } from './candidate-question-generation.component';

describe('CandidateQuestionGenerationComponent', () => {
  let component: CandidateQuestionGenerationComponent;
  let fixture: ComponentFixture<CandidateQuestionGenerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateQuestionGenerationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateQuestionGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
