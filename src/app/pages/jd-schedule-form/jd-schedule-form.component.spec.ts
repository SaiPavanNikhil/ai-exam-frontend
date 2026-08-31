import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JdScheduleFormComponent } from './jd-schedule-form.component';

describe('JdScheduleFormComponent', () => {
  let component: JdScheduleFormComponent;
  let fixture: ComponentFixture<JdScheduleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JdScheduleFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JdScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
