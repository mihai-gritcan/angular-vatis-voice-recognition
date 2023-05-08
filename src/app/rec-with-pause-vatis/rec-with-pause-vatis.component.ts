import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// @ts-ignore
import VTC from "@vatis-tech/asr-client-js";
import { environment } from '../environments/environment';

const VTC_SERVICE = "LIVE_ASR";
const VTC_LANGUAGE = "ro_RO";
const VTC_LOG = true;
const VTC_MICROPHONE_TIMESLICE = 500;
const VTC_FRAME_LENGTH = 0.6;
const VTC_FRAME_OVERLAP = 1.0;
const VTC_BUFFER_OFFSET = 0.5;
const NO_INSTANCES_AVAILABLE_ERROR_CODE = 429;
const NO_INSTANCES_AVAILABLE_ERROR_MESSAGE = "No instance available";
const VTC_API_JWT_KEY = environment.vtcApiJwtKey;
const VTC_HOST = "https://vatis.tech/api/v1";

const SocketIOClientGenerator_Initialized = '@vatis-tech/asr-client-js: Initialized the "SocketIOClientGenerator" plugin.';
const MicrofoneGenerator_Initialized = '@vatis-tech/asr-client-js: Initialized the "MicrophoneGenerator" plugin.';
const SocketIOClientGenerator_Destroy = '@vatis-tech/asr-client-js: Destroy the "SocketIOClientGenerator" plugin.';

const VTC_CUSTOM_COMMANDS = {
  spokenCommandsList: [
    { command: "NEXT_FIELD", regex: ["mai departe", "următorul"] },
    { command: "PREV_FIELD", regex: ["înapoi", "precedentul"] }
  ]
};

@Component({
  selector: 'app-new-demo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rec-with-pause-vatis.component.html',
  styleUrls: ['./rec-with-pause-vatis.component.scss']
})
export class RecWithPauseVatisComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('start, end, continueFrom, serie, documentDate, diagCode, prescriptionPlace, documentNumber') inputElements!: QueryList<ElementRef>;

  public demoForm = this.fb.group({
    start: ['', Validators.required],
    end: ['', Validators.required],
    continueFrom: [''],
    bases: [{ value: 0, disabled: true }],
    days: [{ value: 0, disabled: true }],
    dailyAverage: [{ value: 0, disabled: true }],
    serie: [''],
    documentDate: [''],
    diagCode: [''],
    prescriptionPlace: [''],
    documentNumber: [''],
  });

  public get canStart() { return !this.getVtcRecState.canPlay; }

  public get canStopRec() { return this.getVtcRecState.canPlay; }

  public errorReason = '';
  public get micCanListen() { return this.getVtcRecState.vtcInitialized; }
  public get micIsInPause() { return this.getVtcRecState.vtcInitialized && !this._isControlKeyPressed; }
  public get micIsListening() { return this.getVtcRecState.vtcInitialized && this._isControlKeyPressed; }

  private _isRecStoppedByUser = false;

  private _isControlKeyPressed: boolean = false;

  private _vtcInstance?: VTC = undefined;

  private _vtcRecState = { vtcInitialized: false, canPlay: false, error: false, isDestroying: false };

  private get getVtcRecState() { return this._vtcRecState; }

  private setVtcRecState(args: { vtcInitialized?: boolean, canPlay?: boolean, error?: boolean, isDestroying?: boolean }) {
    if (args?.vtcInitialized !== undefined) this._vtcRecState.vtcInitialized = args.vtcInitialized;
    if (args?.canPlay !== undefined) this._vtcRecState.canPlay = args.canPlay;
    if (args?.isDestroying !== undefined) this._vtcRecState.isDestroying = args.isDestroying;

    if (args?.error !== undefined) {
      this._vtcRecState.error = args.error;
    } else {
      this.errorReason = !this._isRecStoppedByUser ? '' : this.errorReason;
    }

    // TODO: another way to handle when the socket is initialized doesn't exist yet. So we will rely on the message pushed through the logger
    // TODO: we need a callback called 'ready' to handle it immediately after initialization to call the pause method
    if (args?.vtcInitialized === true) {
      console.log('AUTO-PAUSE VTC INSTANCE RECORDING');
      this._vtcInstance.pause();
    }
  }

  private _currentFocusedInput: ElementRef | undefined = undefined;
  private _orderedInputElements: ElementRef[] = [];

  constructor(private fb: FormBuilder, private renderer: Renderer2) { }

  public ngOnInit(): void {
    this.onStartRec();
  }

  public ngAfterViewInit(): void {
    const elementsArray = this.inputElements.toArray();
    this._orderedInputElements = elementsArray.sort((a, b) => a.nativeElement.getAttribute('tabIndex') - b.nativeElement.getAttribute('tabIndex'));

    this.setFocusInFirstInput();
  }

  public ngOnDestroy(): void {
    if (this._vtcInstance && !this.getVtcRecState.isDestroying) {
      this._vtcInstance.destroy();
    }
  }

  public onSubmit() {
    console.table(this.demoForm.value);
  }

  public onFocusCapture(event: FocusEvent) {
    const inputName = (event.target as HTMLInputElement).getAttribute('formControlName');
    if (!inputName) return;

    const curentFocusedInput = this.inputElements.find(el => el.nativeElement.getAttribute('formControlName') === inputName);
    this._currentFocusedInput = curentFocusedInput;
  }

  public onKeyDown(event: any) {
    if (!this._isControlKeyPressed) {
      this._isControlKeyPressed = true;

      this._vtcInstance?.resume();
    }
  }

  public onKeyUp(event: any) {
    if (this._isControlKeyPressed) {
      this._isControlKeyPressed = false;

      this._vtcInstance?.pause();
    }
  }

  public onStartRec() {
    // this.setFocusInFirstInput();
    this.toggleRec();
  }

  private setFocusInFirstInput() {
    const firstFocusedInput = this.inputElements.find(el => el.nativeElement.getAttribute('formControlName') === 'start')!;
    this.renderer.selectRootElement(firstFocusedInput.nativeElement).focus();
  }

  public onStopRec() {
    this.toggleRec();
    this._isRecStoppedByUser = true;
    this.errorReason = 'stopped by user';
  }

  private toggleRec() {
    if (this.getVtcRecState.isDestroying) return;

    if (!this._vtcInstance) {
      this.initializeVtcInstance();
      this.setVtcRecState({ canPlay: true });
    } else if (this._vtcInstance !== undefined && this.getVtcRecState.canPlay) {
      this.setVtcRecState({ canPlay: false, isDestroying: true });
      this._vtcInstance.destroy();
    }
  }

  private initializeVtcInstance(): void {
    this._vtcInstance = new VTC({
      host: VTC_HOST,
      apiKey: VTC_API_JWT_KEY,
      service: VTC_SERVICE,
      language: VTC_LANGUAGE,
      config: VTC_CUSTOM_COMMANDS,

      log: VTC_LOG,
      microphoneTimeslice: VTC_MICROPHONE_TIMESLICE,
      frameLength: VTC_FRAME_LENGTH,
      frameOverlap: VTC_FRAME_OVERLAP,
      bufferOffset: VTC_BUFFER_OFFSET,

      onData: (data: any) => this.onData(data),
      onCommandData: (commandData: any) => this.onCommandData(commandData),
      errorHandler: (err: any) => this.onHandleError(err),
      logger: (info: any) => this.onLog(info),
      onDestroyCallback: () => this.onDestroy()
    });
  }

  private onData(data: any) {
    if (data && data.words && data.words.length > 0) {
      if (data.headers.FinalFrame === true) {
        if (VTC_CUSTOM_COMMANDS.spokenCommandsList.map((x) => x.command).includes(data.headers.SpokenCommand)) { /**/ }
        else { this.onTranscriptReceived(data.transcript); }
      }
    }
  }

  private onCommandData(commandData: any) {
    const curentFocusedInput = this._currentFocusedInput;

    if (commandData.headers.SpokenCommand === 'NEXT_FIELD') {
      // console.log('NEXT_FIELD event captured');

      if (curentFocusedInput) {
        this.moveFocus(curentFocusedInput, MoveDirection.Next);
      }
    }
    else if (commandData.headers.SpokenCommand === 'PREV_FIELD') {
      // console.log('PREV_FIELD event captured');

      if (curentFocusedInput) {
        this.moveFocus(curentFocusedInput, MoveDirection.Prev);
      }
    }
  }

  private onHandleError(e: any) {
    this.setVtcRecState({ error: true, vtcInitialized: false, canPlay: false });

    this._vtcInstance = undefined;

    if (e && (e.status === NO_INSTANCES_AVAILABLE_ERROR_CODE || e.message === NO_INSTANCES_AVAILABLE_ERROR_MESSAGE)) {
      console.warn("#ERROR: We're sorry, but there are no instances of the Vatis Tech ASR SERVICE free. Please try again later. If you should have one, please contact us at support@vatis.tech.");
      this.errorReason = 'No instances of the Vatis Tech ASR SERVICE free';
    } else {
      console.warn("#ERROR: There was a server error. Please try again later, and if this issue persists, please contact us at support@vatis.tech.");
      this.errorReason = 'vatis.tech server error';
    }
  }

  private onLog(info: any) {
    if (info.currentState === SocketIOClientGenerator_Initialized) {
      /* handle when the socket is initialized. Note: that does not mean that the MicrophoneGenerator is initilized also */
    }
    else if (info.currentState === MicrofoneGenerator_Initialized) {
      this.setVtcRecState({ vtcInitialized: true });
    } else if (info.currentState === SocketIOClientGenerator_Destroy && this.getVtcRecState.vtcInitialized && this.getVtcRecState.canPlay) {
      this.setVtcRecState({ vtcInitialized: false, canPlay: false, error: true });

      this._vtcInstance = null;
      console.warn("#INFO: The Vatis Tech ASR SERVICE has interrupted the connection. Please try again in a few minutes, and if this issue persists, please contact us at support@vatis.tech.");
    }
  }

  private onDestroy() {
    if (this.getVtcRecState.isDestroying && !this.getVtcRecState.error) {
      this.setVtcRecState({ vtcInitialized: false, isDestroying: false });

      this._vtcInstance = null;
    }
  }

  private onTranscriptReceived(transcript: string) {
    // console.log(transcript);
    if (this._currentFocusedInput) {
      this._currentFocusedInput.nativeElement.value = transcript.slice(0, -1);
    }
  }

  private moveFocus(currentInput: ElementRef, direction: MoveDirection) {
    const currentIndex = this._orderedInputElements.indexOf(currentInput);

    let targetIndex: number | undefined;
    if (direction == MoveDirection.Next) {
      const nextIndex = currentIndex + 1;
      targetIndex = nextIndex < this.inputElements.length ? nextIndex : undefined;
    } else if (direction == MoveDirection.Prev) {
      const prevIndex = currentIndex - 1;
      targetIndex = prevIndex >= 0 ? prevIndex : undefined;
    }

    if (targetIndex === undefined) return;

    const targetInput = this._orderedInputElements[targetIndex];

    const elementToFocus = this.inputElements.find((x) => x == targetInput);
    if (elementToFocus) {
      this.renderer.selectRootElement(targetInput.nativeElement).focus();
    }
  }
}

enum MoveDirection {
  Next,
  Prev
}
