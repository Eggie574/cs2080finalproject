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
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gst from 'gi://Gst';
import GstPlayer from 'gi://GstPlayer';
import { Recorder } from './recorder.js';
import { RecordingList } from './recordingList.js';
import { RecordingsListWidget } from './recordingListWidget.js';
import { RecorderWidget } from './recorderWidget.js';
var WindowState;
(function (WindowState) {
    WindowState[WindowState["Empty"] = 0] = "Empty";
    WindowState[WindowState["List"] = 1] = "List";
    WindowState[WindowState["Recorder"] = 2] = "Recorder";
})(WindowState || (WindowState = {}));
export class Window extends Adw.ApplicationWindow {
    constructor(params) {
        super(params);
        this.iconName = pkg.name;
        this._state = WindowState.Empty;
        this.recorder = new Recorder();
        this.recorderWidget = new RecorderWidget(this.recorder);
        this._mainStack.add_named(this.recorderWidget, 'recorder');
        const dispatcher = GstPlayer.PlayerGMainContextSignalDispatcher.new(null);
        this.player = GstPlayer.Player.new(null, dispatcher);
        this.player.connect('end-of-stream', () => this.player.stop());
        this.recordingList = new RecordingList();
        this.itemsSignalId = this.recordingList.connect('items-changed', () => {
            if (this.state !== WindowState.Recorder) {
                if (this.recordingList.get_n_items() === 0)
                    this.state = WindowState.Empty;
                else
                    this.state = WindowState.List;
            }
        });
        this.recordingListWidget = new RecordingsListWidget(this.recordingList, this.player);
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
        this.undoAction = new Gio.SimpleAction({ name: 'undo' });
        this.add_action(this.undoAction);
        const openMenuAction = new Gio.SimpleAction({
            name: 'open-primary-menu',
            state: new GLib.Variant('b', true),
        });
        openMenuAction.connect('activate', (action) => {
            var _b;
            const state = (_b = action.get_state()) === null || _b === void 0 ? void 0 : _b.get_boolean();
            action.state = new GLib.Variant('b', !state);
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
                recording.pipeline.set_state(Gst.State.NULL);
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
        const toast = Adw.Toast.new(message);
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
_a = Window;
(() => {
    GObject.registerClass({
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
