/// <reference types="gi-types/gi.js" />
import GObject from 'gi://GObject';
import Gst from 'gi://Gst';
import { Recording } from './recording.js';
export declare const EncodingProfiles: {
    name: string;
    containerCaps: string;
    audioCaps: string;
    contentType: string;
    extension: string;
}[];
export declare class Recorder extends GObject.Object {
    private peaks;
    private _duration;
    private _current_peak;
    private pipeline;
    private level?;
    private ebin?;
    private filesink?;
    private recordBus?;
    private handlerId?;
    private file?;
    private timeout?;
    private pipeState?;
    constructor();
    start(): void;
    pause(): void;
    resume(): void;
    stop(): Recording | undefined;
    private onMessageReceived;
    private getChannel;
    private getProfile;
    get duration(): number;
    set duration(val: number);
    get current_peak(): number;
    set current_peak(peak: number);
    get state(): Gst.State | undefined;
    set state(s: Gst.State | undefined);
}
//# sourceMappingURL=recorder.d.ts.map