"use strict";
/* exported Window */
/*
 * Copyright 2013 Meg Ford
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Meg Ford <megford@gnome.org>
 *
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Window = void 0;
const _1 = require("gi://Adw");
const _2 = require("gi://Gio");
const _3 = require("gi://GLib");
const _4 = require("gi://GObject");
const _5 = require("gi://Gst");
const _6 = require("gi://GstPlayer");
const recorder_js_1 = require("./recorder.js");
const recordingList_js_1 = require("./recordingList.js");
const recordingListWidget_js_1 = require("./recordingListWidget.js");
const recorderWidget_js_1 = require("./recorderWidget.js");
var WindowState;
(function (WindowState) {
    WindowState[WindowState["Empty"] = 0] = "Empty";
    WindowState[WindowState["List"] = 1] = "List";
    WindowState[WindowState["Recorder"] = 2] = "Recorder";
})(WindowState || (WindowState = {}));
class Window extends _1.default.ApplicationWindow {
    constructor(params) {
        super(params);
        this.iconName = pkg.name;
        this._state = WindowState.Empty;
        this.recorder = new recorder_js_1.Recorder();
        this.recorderWidget = new recorderWidget_js_1.RecorderWidget(this.recorder);
        this._mainStack.add_named(this.recorderWidget, 'recorder');
        const dispatcher = _6.default.PlayerGMainContextSignalDispatcher.new(null);
        this.player = _6.default.Player.new(null, dispatcher);
        this.player.connect('end-of-stream', () => this.player.stop());
        this.recordingList = new recordingList_js_1.RecordingList();
        this.itemsSignalId = this.recordingList.connect('items-changed', () => {
            if (this.state !== WindowState.Recorder) {
                if (this.recordingList.get_n_items() === 0)
                    this.state = WindowState.Empty;
                else
                    this.state = WindowState.List;
            }
        });
        this.recordingListWidget = new recordingListWidget_js_1.RecordingsListWidget(this.recordingList, this.player);
        this.recordingListWidget.connect('row-deleted', (_listBox, recording, index) => {
            this.recordingList.remove(index);
            let message;
            if (recording.name) {
                message = _('"%s" deleted').format(recording.name);
            }
            else {
                message = _('Recording deleted');
            }
            this.sendNotification(message, recording, index);
        });
        this.toastUndo = false;
        this.undoSignalID = null;
        this.undoAction = new _2.default.SimpleAction({ name: 'undo' });
        this.add_action(this.undoAction);
        const openMenuAction = new _2.default.SimpleAction({
            name: 'open-primary-menu',
            state: new _3.default.Variant('b', true),
        });
        openMenuAction.connect('activate', (action) => {
            var _b;
            const state = (_b = action.get_state()) === null || _b === void 0 ? void 0 : _b.get_boolean();
            action.state = new _3.default.Variant('b', !state);
        });
        this.add_action(openMenuAction);
        this._column.set_child(this.recordingListWidget);
        this.recorderWidget.connect('started', this.onRecorderStarted.bind(this));
        this.recorderWidget.connect('canceled', this.onRecorderCanceled.bind(this));
        this.recorderWidget.connect('stopped', this.onRecorderStopped.bind(this));
        this.insert_action_group('recorder', this.recorderWidget.actionsGroup);
        this._emptyPage.icon_name = `${pkg.name}-symbolic`;
    }
    vfunc_close_request() {
        this.recordingList.cancellable.cancel();
        if (this.itemsSignalId)
            this.recordingList.disconnect(this.itemsSignalId);
        for (let i = 0; i < this.recordingList.get_n_items(); i++) {
            const recording = this.recordingList.get_item(i);
            if (recording.pipeline)
                recording.pipeline.set_state(_5.default.State.NULL);
        }
        this.recorder.stop();
        return false;
    }
    onRecorderStarted() {
        this.player.stop();
        const activeRow = this.recordingListWidget.activeRow;
        if (activeRow && activeRow.editMode)
            activeRow.editMode = false;
        this.state = WindowState.Recorder;
    }
    onRecorderCanceled() {
        if (this.recordingList.get_n_items() === 0)
            this.state = WindowState.Empty;
        else
            this.state = WindowState.List;
    }
    onRecorderStopped(_widget, recording) {
        this.recordingList.insert(0, recording);
        const row = this.recordingListWidget.list.get_row_at_index(0);
        row.editMode = true;
        this.state = WindowState.List;
    }
    sendNotification(message, recording, index) {
        const toast = _1.default.Toast.new(message);
        toast.connect('dismissed', () => {
            if (!this.toastUndo)
                void recording.delete();
            this.toastUndo = false;
        });
        if (this.undoSignalID !== null)
            this.undoAction.disconnect(this.undoSignalID);
        this.undoSignalID = this.undoAction.connect('activate', () => {
            this.recordingList.insert(index, recording);
            this.toastUndo = true;
        });
        toast.set_action_name('win.undo');
        toast.set_button_label(_('Undo'));
        this._toastOverlay.add_toast(toast);
    }
    set state(state) {
        let visibleChild;
        let isHeaderVisible = true;
        switch (state) {
            case WindowState.Recorder:
                visibleChild = 'recorder';
                isHeaderVisible = false;
                break;
            case WindowState.List:
                visibleChild = 'recordings';
                break;
            case WindowState.Empty:
                visibleChild = 'empty';
                break;
        }
        this._mainStack.visible_child_name = visibleChild;
        this._headerRevealer.reveal_child = isHeaderVisible;
        this._state = state;
    }
    get state() {
        return this._state;
    }
}
exports.Window = Window;
_a = Window;
(() => {
    _4.default.registerClass({
        Template: 'resource:///org/gnome/SoundRecorder/ui/window.ui',
        InternalChildren: [
            'mainStack',
            'emptyPage',
            'column',
            'headerRevealer',
            'toastOverlay',
        ],
    }, _a);
})();
//# sourceMappingURL=window.js.map