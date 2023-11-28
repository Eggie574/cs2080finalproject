/// <reference types="gi-types/gi.js" />
import Adw from 'gi://Adw';
declare enum WindowState {
    Empty = 0,
    List = 1,
    Recorder = 2
}
export declare class Window extends Adw.ApplicationWindow {
    private _mainStack;
    private _emptyPage;
    private _column;
    private _headerRevealer;
    private _toastOverlay;
    private recorder;
    private recorderWidget;
    private player;
    private recordingList;
    private itemsSignalId;
    private recordingListWidget;
    private toastUndo;
    private undoSignalID;
    private undoAction;
    private _state;
    constructor(params: Partial<Adw.Application.ConstructorProperties>);
    vfunc_close_request(): boolean;
    private onRecorderStarted;
    private onRecorderCanceled;
    private onRecorderStopped;
    private sendNotification;
    set state(state: WindowState);
    get state(): WindowState;
}
export {};
//# sourceMappingURL=window.d.ts.map