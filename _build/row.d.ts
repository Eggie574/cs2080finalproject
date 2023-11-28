/// <reference types="gi-types/gi.js" />
import Gtk from 'gi://Gtk?version=4.0';
import { Recording } from './recording.js';
import { WaveForm } from './waveform.js';
export declare enum RowState {
    Playing = 0,
    Paused = 1
}
export declare class Row extends Gtk.ListBoxRow {
    private _playbackStack;
    private _mainStack;
    private _waveformStack;
    private _rightStack;
    private _name;
    private _entry;
    private _date;
    private _duration;
    private _revealer;
    private _playbackControls;
    private _playBtn;
    private _pauseBtn;
    recording: Recording;
    private _expanded;
    private _editMode;
    private _state;
    waveform: WaveForm;
    private actionGroup;
    private exportDialog?;
    private saveRenameAction;
    private renameAction;
    private pauseAction;
    private playAction;
    private keyController;
    constructor(recording: Recording);
    private onRenameRecording;
    set editMode(state: boolean);
    get editMode(): boolean;
    set expanded(state: boolean);
    get expanded(): boolean;
    set state(rowState: RowState);
    get state(): RowState;
}
//# sourceMappingURL=row.d.ts.map