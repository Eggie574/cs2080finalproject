var _a;
/* exported RecordingList */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import { RecordingsDir } from './application.js';
import { Recording } from './recording.js';
export class RecordingList extends Gio.ListStore {
    constructor() {
        super();
        this.cancellable = new Gio.Cancellable();
        // Monitor Direcotry actions
        this.dirMonitor = RecordingsDir.monitor_directory(Gio.FileMonitorFlags.WATCH_MOVES, this.cancellable);
        this.dirMonitor.connect('changed', (_dirMonitor, file1, file2, eventType) => {
            const index = this.getIndex(file1);
            switch (eventType) {
                case Gio.FileMonitorEvent.MOVED_OUT:
                    if (index >= 0)
                        this.remove(index);
                    break;
                case Gio.FileMonitorEvent.MOVED_IN:
                    if (index === -1)
                        this.sortedInsert(new Recording(file1));
                    break;
            }
        });
        void RecordingsDir.enumerate_children_async('standard::name', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, GLib.PRIORITY_LOW, this.cancellable).then(async (enumerator) => {
            await this.enumerateDirectory(enumerator);
        });
    }
    async enumerateDirectory(enumerator) {
        var _b;
        this.enumerator = enumerator;
        if (this.enumerator === null) {
            log('The contents of the Recordings directory were not indexed.');
            return;
        }
        try {
            for (let fileInfos = await this.nextFiles(); fileInfos.length > 0; fileInfos = await this.nextFiles()) {
                fileInfos.forEach((info) => {
                    const file = RecordingsDir.get_child(info.get_name());
                    const recording = new Recording(file);
                    this.sortedInsert(recording);
                });
            }
            (_b = this.enumerator) === null || _b === void 0 ? void 0 : _b.close(this.cancellable);
        }
        catch (e) {
            if (e instanceof GLib.Error) {
                if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    console.error(`Failed to load recordings ${e.message}`);
            }
        }
    }
    async nextFiles() {
        var _b;
        const fileInfos = await ((_b = this.enumerator) === null || _b === void 0 ? void 0 : _b.next_files_async(5, GLib.PRIORITY_LOW, this.cancellable));
        // We check this here because the return value isn't stated as nullable in Gio.
        return fileInfos ? fileInfos : [];
    }
    getIndex(file) {
        for (let i = 0; i < this.get_n_items(); i++) {
            const item = this.get_item(i);
            if (item.uri === file.get_uri())
                return i;
        }
        return -1;
    }
    sortedInsert(recording) {
        let added = false;
        for (let i = 0; i < this.get_n_items(); i++) {
            const curr = this.get_item(i);
            if (curr.timeModified.difference(recording.timeModified) <= 0) {
                this.insert(i, recording);
                added = true;
                break;
            }
        }
        if (!added)
            this.append(recording);
    }
}
_a = RecordingList;
(() => {
    GObject.registerClass(_a);
})();
