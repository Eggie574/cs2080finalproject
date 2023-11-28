"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecorderWidget = void 0;
/* exported RecorderState RecorderWidget */
const _1 = require("gi://Adw");
const _2 = require("gi://Gio");
const _3 = require("gi://GObject");
const _4 = require("gi://Gtk?version=4.0");
const utils_js_1 = require("./utils.js");
const waveform_js_1 = require("./waveform.js");
var RecorderState;
(function (RecorderState) {
    RecorderState[RecorderState["Recording"] = 0] = "Recording";
    RecorderState[RecorderState["Paused"] = 1] = "Paused";
    RecorderState[RecorderState["Stopped"] = 2] = "Stopped";
})(RecorderState || (RecorderState = {}));
class RecorderWidget extends _4.default.Box {
    constructor(recorder) {
        super();
        this.recorder = recorder;
        this.waveform = new waveform_js_1.WaveForm({
            vexpand: true,
            valign: _4.default.Align.FILL,
        }, waveform_js_1.WaveType.Recorder);
        this._recorderBox.prepend(this.waveform);
        this.recorder.bind_property('current-peak', this.waveform, 'peak', _3.default.BindingFlags.SYNC_CREATE | _3.default.BindingFlags.DEFAULT);
        this.recorder.connect('notify::duration', (_recorder) => {
            this._recorderTime.set_markup((0, utils_js_1.formatTime)(_recorder.duration));
        });
        const actions = [
            { name: 'start', callback: this.onStart.bind(this), enabled: true },
            {
                name: 'pause',
                callback: this.onPause.bind(this),
                enabled: false,
            },
            { name: 'stop', callback: this.onStop.bind(this), enabled: false },
            {
                name: 'resume',
                callback: this.onResume.bind(this),
                enabled: false,
            },
            {
                name: 'cancel',
                callback: this.onCancel.bind(this),
                enabled: false,
            },
        ];
        this.actionsGroup = new _2.default.SimpleActionGroup();
        for (const { name, callback, enabled } of actions) {
            const action = new _2.default.SimpleAction({ name, enabled });
            action.connect('activate', callback);
            this.actionsGroup.add_action(action);
        }
        const cancelAction = this.actionsGroup.lookup('cancel');
        const startAction = this.actionsGroup.lookup('start');
        startAction.bind_property('enabled', cancelAction, 'enabled', _3.default.BindingFlags.INVERT_BOOLEAN);
    }
    onPause() {
        this._playbackStack.visible_child_name = 'recorder-start';
        this.state = RecorderState.Paused;
        this.recorder.pause();
        this.emit('paused');
    }
    onResume() {
        this._playbackStack.visible_child_name = 'recorder-pause';
        this.state = RecorderState.Recording;
        this.recorder.resume();
        this.emit('resumed');
    }
    onStart() {
        this._playbackStack.visible_child_name = 'recorder-pause';
        this.state = RecorderState.Recording;
        this.recorder.start();
        this.emit('started');
    }
    onCancel() {
        this.onPause();
        const dialog = new _1.default.MessageDialog({
            heading: _('Delete Recording?'),
            body: _('This recording will not be saved.'),
            transient_for: this.root,
        });
        dialog.add_response('close', _('_Resume'));
        dialog.add_response('delete', _('_Delete'));
        dialog.set_response_appearance('delete', _1.default.ResponseAppearance.DESTRUCTIVE);
        dialog.set_default_response('close');
        dialog.connect('response::delete', () => {
            const recording = this.recorder.stop();
            this.state = RecorderState.Stopped;
            if (recording) {
                void recording.delete();
            }
            this.waveform.destroy();
            this.emit('canceled');
        });
        dialog.connect('response::close', this.onResume.bind(this));
        dialog.present();
    }
    onStop() {
        this.state = RecorderState.Stopped;
        const recording = this.recorder.stop();
        this.waveform.destroy();
        this.emit('stopped', recording);
    }
    set state(recorderState) {
        const pauseAction = this.actionsGroup.lookup('pause');
        const resumeAction = this.actionsGroup.lookup('resume');
        const startAction = this.actionsGroup.lookup('start');
        const stopAction = this.actionsGroup.lookup('stop');
        switch (recorderState) {
            case RecorderState.Paused:
                pauseAction.enabled = false;
                resumeAction.enabled = true;
                this._resumeBtn.grab_focus();
                this._recorderTime.add_css_class('paused');
                break;
            case RecorderState.Recording:
                startAction.enabled = false;
                stopAction.enabled = true;
                resumeAction.enabled = false;
                pauseAction.enabled = true;
                this._pauseBtn.grab_focus();
                this._recorderTime.remove_css_class('paused');
                break;
            case RecorderState.Stopped:
                startAction.enabled = true;
                stopAction.enabled = false;
                pauseAction.enabled = false;
                resumeAction.enabled = false;
                break;
        }
    }
}
exports.RecorderWidget = RecorderWidget;
_a = RecorderWidget;
(() => {
    _3.default.registerClass({
        Template: 'resource:///org/gnome/SoundRecorder/ui/recorder.ui',
        InternalChildren: [
            'recorderBox',
            'playbackStack',
            'recorderTime',
            'pauseBtn',
            'resumeBtn',
        ],
        Signals: {
            canceled: {},
            paused: {},
            resumed: {},
            started: {},
            stopped: { param_types: [_3.default.TYPE_OBJECT] },
        },
    }, _a);
})();
//# sourceMappingURL=recorderWidget.js.map