/// <reference types="gi-types/gi.js" />
import Gio from 'gi://Gio';
export declare class RecordingList extends Gio.ListStore {
    private enumerator?;
    cancellable: Gio.Cancellable;
    dirMonitor: Gio.FileMonitor;
    constructor();
    private enumerateDirectory;
    private nextFiles;
    private getIndex;
    private sortedInsert;
}
//# sourceMappingURL=recordingList.d.ts.map