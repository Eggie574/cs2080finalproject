import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import { Recorder } from './recorder.js';
declare enum RecorderState {
    Recording = 0,
    Paused = 1,
    Stopped = 2
}
export declare class RecorderWidget extends Gtk.Box {
    private _recorderBox;
    private _playbackStack;
    private _recorderTime;
    private _pauseBtn;
    private _resumeBtn;
    private recorder;
    private waveform;
    actionsGroup: Gio.SimpleActionGroup;
    constructor(recorder: Recorder);
    private onPause;
    private onResume;
    private onStart;
    private onCancel;
    private onStop;
    set state(recorderState: RecorderState);
}
export {};
//# sourceMappingURL=recorderWidget.d.ts.map