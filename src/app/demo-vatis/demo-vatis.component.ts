import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
// @ts-ignore
import VTC from "@vatis-tech/asr-client-js";

const VTC_SERVICE = "LIVE_ASR";
const VTC_LANGUAGE = "ro_RO";
const VTC_LOG = true;
const VTC_MICROPHONE_TIMESLICE = 500;
const VTC_FRAME_LENGTH = 0.6;
const VTC_FRAME_OVERLAP = 1.0;
const VTC_BUFFER_OFFSET = 0.5;
const NO_INSTANCES_AVAILABLE_ERROR_CODE = 429;
const NO_INSTANCES_AVAILABLE_ERROR_MESSAGE = "No instance available";
const VTC_API_JWT_KEY = "";
const VTC_HOST = "https://vatis.tech/api/v1";

const Microfone_Generator_Initialized = '@vatis-tech/asr-client-js: Initialized the "MicrophoneGenerator" plugin.';
const Socket_IOClient_Generator_Destroy = '@vatis-tech/asr-client-js: Destroy the "SocketIOClientGenerator" plugin.';

@Component({
  selector: 'app-demo3',
  templateUrl: './demo-vatis.component.html',
  styleUrls: ['./demo-vatis.component.scss']
})
export class DemoVatisComponent {
  private vtcInstance?: VTC = undefined;

  private recState = {
    play: false,
    vtcInitialized: false,
    timeStamps: new Array<string>(),
    transcriptFrames: new Array<any>(),
    error: false,
    isDestroying: false,
    needNewTimeStamp: false
  };

  private isControlPressed: boolean = false;
  private focusedInput: string | undefined;

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

  constructor(private fb: FormBuilder) { }

  public ngOnInit(): void {
    // this.demo3Form.valueChanges.subscribe((obs) => console.log(obs));
    // this.demo3Form.statusChanges.subscribe((st) => console.warn(st));
  }

  public onSubmit() {
    console.warn(this.demoForm.value);
  }

  public onFocusCapture(controlName: string) {
    console.log(`Focused field: ${controlName}`);
  }

  public onKeyDown(event: any) {
    if (!this.isControlPressed) {
      this.focusedInput = event.target.id;
      this.isControlPressed = true;
      this.toggleRec();
    }
  }

  public onKeyUp(event: any) {
    if (this.isControlPressed) {
      this.isControlPressed = false;
      this.focusedInput = undefined;
      this.recState.play = false;

      if (this.vtcInstance !== null && !this.vtcInstance.isDestroying && !this.recState.isDestroying) {
        console.log('init destroying VTC on onKeyUp event');
        this.vtcInstance.destroy();
      }
    }
  }

  private toggleRec() {
    if (this.recState.isDestroying) {
      return;
    }

    console.log('toggle Rec');
    if (!this.vtcInstance) {
      this.recState.play = true;
      this.recState.needNewTimeStamp = true;

      this.vtcInstance = new VTC({
        service: VTC_SERVICE,
        language: VTC_LANGUAGE,
        apiKey: VTC_API_JWT_KEY,
        onData: (data: any) => this.onData(data),
        log: VTC_LOG,
        onDestroyCallback: () => this.onDestroy(),
        host: VTC_HOST,
        microphoneTimeslice: VTC_MICROPHONE_TIMESLICE,
        frameLength: VTC_FRAME_LENGTH,
        frameOverlap: VTC_FRAME_OVERLAP,
        bufferOffset: VTC_BUFFER_OFFSET,
        errorHandler: (err: any) => this.onHandleError(err),
        logger: (info: any) => {
          if (info.currentState === Microfone_Generator_Initialized) {
            this.recState.vtcInitialized = true;
          } else if (info.currentState === Socket_IOClient_Generator_Destroy && this.recState.vtcInitialized && this.recState.play) {
            this.recState.play = false;
            this.recState.vtcInitialized = false;
            this.recState.error = true;
            this.vtcInstance = null;

            console.log("#INFO: The Vatis Tech ASR SERVICE has interrupted the connection. Please try again in a few minutes, and if this issue persists, please contact us at support@vatis.tech.");
          }
        }
      });

    } else if (this.vtcInstance !== undefined && this.recState.play) {
      console.warn('this.vtcInstance !== undefined && this.recState.play -> call vtcInstance.destroy')
      this.recState.play = false;
      this.recState.isDestroying = true;
      this.vtcInstance.destroy();
    }
  }

  private onDestroy() {
    if (this.recState.isDestroying && !this.recState.error) {
      this.recState.vtcInitialized = false;
      this.recState.isDestroying = false;
      this.vtcInstance = null;
    }
  }

  private onHandleError(e: any) {
    this.recState.play = false;
    this.recState.vtcInitialized = false;
    this.recState.error = true;

    this.vtcInstance = undefined;

    if (e && (e.status === NO_INSTANCES_AVAILABLE_ERROR_CODE || e.message === NO_INSTANCES_AVAILABLE_ERROR_MESSAGE)) {
      console.log("#ERROR: We're sorry, but there are no instances of the Vatis Tech ASR SERVICE free. Please try again later. If you should have one, please contact us at support@vatis.tech.");
    } else {
      console.log("#ERROR: There was a server error. Please try again later, and if this issue persists, please contact us at support@vatis.tech.");
    }
  }

  private onData(data: any) {
    if (this.recState.needNewTimeStamp && data.transcript !== "") {
      const today = new Date();
      const hh = String(today.getHours()).padStart(2, "0");
      const mm = String(today.getMinutes()).padStart(2, "0");
      const ss = String(today.getSeconds()).padStart(2, "0");

      this.recState.needNewTimeStamp = false;
      this.recState.timeStamps = [`${hh}:${mm}:${ss}`, ...this.recState.timeStamps];
      console.log(this.recState.timeStamps);
    }

    if (data.transcript === "") {
    } else if (
      this.recState.transcriptFrames.length &&
      this.recState.transcriptFrames[0].headers.FrameStartTime === data.headers.FrameStartTime &&
      this.recState.transcriptFrames[0].headers.Sid === data.headers.Sid
    ) {
      const newTranscriptFrames = [...this.recState.transcriptFrames];
      newTranscriptFrames[0] = data;
      this.recState.transcriptFrames = newTranscriptFrames;
      this.displayTranscript({ data, replace: true });
    } else {
      this.recState.transcriptFrames = [data, ...this.recState.transcriptFrames];
      this.displayTranscript({ data, replace: false });
    }
  }

  private displayTranscript(obj: { data: any, replace: boolean }) {
    const timeStampWrapper = this.recState.timeStamps[0];
    if (timeStampWrapper === null) {
      console.log('this.recState.timeStamps[0]: -> ');
      console.log(this.recState.timeStamps[0]);
    }

    if (obj.replace) {
      console.log('REPLACE ELEMENT: -> ');
      console.log(`${obj.data.headers.FrameStartTime}`);

      console.log('NEW REPLACED TEXT: -> ');
      console.log(obj.data.transcript);
    } else {
      // const hd = this.humanizeDuration(obj.data.headers.FrameStartTime);
      // console.warn(hd);
      console.warn(obj.data.headers.FrameStartTime);
      console.warn(obj.data.transcript);
    }
    /*let value = '';
    const transcripts = this.recState.transcriptFrames;
    if (!transcripts || transcripts?.length === 0) {
      value = 'NOT INIT';
    }
    else {
      let timeIndex = 0;
      const t = transcripts.map((prop: any, key: any) => {
        // let segment = this.humanizeDuration(prop.headers.FrameStartTime);
        let transcript = prop.transcript;
        value = transcript;

        if ((key !== transcripts.length - 1 && prop.headers.Sid !== transcripts[key + 1].headers.Sid) || key === transcripts.length - 1) {
          this.recState.timeStamps[timeIndex++]
        }
      });

      return 'EMPTY';
    }*/
  }
}
