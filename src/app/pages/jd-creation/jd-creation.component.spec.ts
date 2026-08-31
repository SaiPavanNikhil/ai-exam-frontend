import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JdCreationComponent } from './jd-creation.component';

describe('JdCreationComponent', () => {
  let component: JdCreationComponent;
  let fixture: ComponentFixture<JdCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JdCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JdCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
