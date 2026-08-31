import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JdAssessmentComponent } from './jd-assessment.component';

describe('JdAssessmentComponent', () => {
  let component: JdAssessmentComponent;
  let fixture: ComponentFixture<JdAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JdAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JdAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
