/// <reference types="gi-types/gi" />
import Gtk from 'gi://Gtk?version=4.0';
export declare enum WaveType {
    Recorder = 0,
    Player = 1
}
export declare class WaveForm extends Gtk.DrawingArea {
    private _peaks;
    private _position;
    private dragGesture?;
    private hcId;
    private lastX?;
    private waveType;
    constructor(params: Partial<Gtk.DrawingArea.ConstructorProperties> | undefined, type: WaveType);
    private dragBegin;
    private dragUpdate;
    private dragEnd;
    private drawFunc;
    set peak(p: number);
    set peaks(p: number[]);
    set position(pos: number);
    get position(): number;
    private clamped;
    private setSourceRGBA;
    destroy(): void;
}
//# sourceMappingURL=waveform.d.ts.map