import { CommonModule } from '@angular/common';
import { Component, ElementRef, Renderer2, ViewChildren, QueryList } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-play-with-focus',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="myForm">
      <input type="text" formControlName="firstName" #firstNameInput (keydown)="onInputKeyDown($event, firstNameInput)">
      <input type="text" formControlName="lastName" #lastNameInput (keydown)="onInputKeyDown($event, lastNameInput)">
      <input type="text" formControlName="email" #emailInput (keydown)="onInputKeyDown($event, emailInput)">
      <input type="text" formControlName="phone" #phoneInput (keydown)="onInputKeyDown($event, phoneInput)">
    </form>
  `
})
export class PlayWithFocusComponent {
  @ViewChildren('firstNameInput, lastNameInput, emailInput, phoneInput') inputElements!: QueryList<ElementRef>;

  myForm = new FormGroup({
    firstName: new FormControl(),
    lastName: new FormControl(),
    email: new FormControl(),
    phone: new FormControl(),
  });

  constructor(private renderer: Renderer2) { }

  // Function to move focus to the next input element
  private moveFocusToNextInput(currentInput: ElementRef): void {
    const currentIndex = this.inputElements.toArray().indexOf(currentInput);
    const nextIndex = currentIndex + 1;
    if (nextIndex < this.inputElements.length) {
      const nextInput = this.inputElements.toArray()[nextIndex];
      this.renderer.selectRootElement(nextInput.nativeElement).focus();
    }
  }

  // Event handler for the "keydown" event
  public onInputKeyDown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const formControlName = input.getAttribute('formControlName');
      const nextInput = this.inputElements.find(el => el.nativeElement.getAttribute('formControlName') === formControlName);

      if (nextInput) {
        this.moveFocusToNextInput(nextInput);
      }
    }
  }
}

