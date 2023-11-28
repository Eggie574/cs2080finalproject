"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingList = void 0;
/* exported RecordingList */
const _1 = require("gi://Gio");
const _2 = require("gi://GLib");
const _3 = require("gi://GObject");
const application_js_1 = require("./application.js");
const recording_js_1 = require("./recording.js");
class RecordingList extends _1.default.ListStore {
    constructor() {
        super();
        this.cancellable = new _1.default.Cancellable();
        // Monitor Direcotry actions
        this.dirMonitor = application_js_1.RecordingsDir.monitor_directory(_1.default.FileMonitorFlags.WATCH_MOVES, this.cancellable);
        this.dirMonitor.connect('changed', (_dirMonitor, file1, file2, eventType) => {
            const index = this.getIndex(file1);
            switch (eventType) {
                case _1.default.FileMonitorEvent.MOVED_OUT:
                    if (index >= 0)
                        this.remove(index);
                    break;
                case _1.default.FileMonitorEvent.MOVED_IN:
                    if (index === -1)
                        this.sortedInsert(new recording_js_1.Recording(file1));
                    break;
            }
        });
        void application_js_1.RecordingsDir.enumerate_children_async('standard::name', _1.default.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, _2.default.PRIORITY_LOW, this.cancellable).then(async (enumerator) => {
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
                    const file = application_js_1.RecordingsDir.get_child(info.get_name());
                    const recording = new recording_js_1.Recording(file);
                    this.sortedInsert(recording);
                });
            }
            (_b = this.enumerator) === null || _b === void 0 ? void 0 : _b.close(this.cancellable);
        }
        catch (e) {
            if (e instanceof _2.default.Error) {
                if (!e.matches(_1.default.IOErrorEnum, _1.default.IOErrorEnum.CANCELLED))
                    console.error(`Failed to load recordings ${e.message}`);
            }
        }
    }
    async nextFiles() {
        var _b;
        const fileInfos = await ((_b = this.enumerator) === null || _b === void 0 ? void 0 : _b.next_files_async(5, _2.default.PRIORITY_LOW, this.cancellable));
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
exports.RecordingList = RecordingList;
_a = RecordingList;
(() => {
    _3.default.registerClass(_a);
})();
//# sourceMappingURL=recordingList.js.map