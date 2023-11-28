/// <reference types="gi-types/gi.js" />
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gst from 'gi://Gst';
export declare class Recording extends GObject.Object {
    private _file;
    private _peaks;
    private loadedPeaks;
    private _extension?;
    private _timeModified;
    private _timeCreated;
    private _duration?;
    pipeline?: Gst.Bin | null;
    constructor(file: Gio.File);
    get name(): string | null;
    set name(filename: string | null);
    get extension(): string | undefined;
    get timeModified(): GLib.DateTime;
    get timeCreated(): GLib.DateTime;
    get duration(): number;
    get file(): Gio.File;
    get uri(): string;
    set peaks(data: number[]);
    get peaks(): number[];
    delete(): Promise<void>;
    save(dest: Gio.File): void;
    get waveformCache(): Gio.File;
    loadPeaks(): Promise<void>;
    private generatePeaks;
}
//# sourceMappingURL=recording.d.ts.map