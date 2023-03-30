import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayWithFocusComponent } from './play-with-focus.component';

describe('PlayWithFocusComponent', () => {
  let component: PlayWithFocusComponent;
  let fixture: ComponentFixture<PlayWithFocusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ PlayWithFocusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayWithFocusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
