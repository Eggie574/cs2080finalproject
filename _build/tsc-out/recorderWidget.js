var _a;
/* exported RecorderState RecorderWidget */
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';
import { formatTime } from './utils.js';
import { WaveForm, WaveType } from './waveform.js';
var RecorderState;
(function (RecorderState) {
    RecorderState[RecorderState["Recording"] = 0] = "Recording";
    RecorderState[RecorderState["Paused"] = 1] = "Paused";
    RecorderState[RecorderState["Stopped"] = 2] = "Stopped";
})(RecorderState || (RecorderState = {}));
export class RecorderWidget extends Gtk.Box {
    constructor(recorder) {
        super();
        this.recorder = recorder;
        this.waveform = new WaveForm({
            vexpand: true,
            valign: Gtk.Align.FILL,
        }, WaveType.Recorder);
        this._recorderBox.prepend(this.waveform);
        this.recorder.bind_property('current-peak', this.waveform, 'peak', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        this.recorder.connect('notify::duration', (_recorder) => {
            this._recorderTime.set_markup(formatTime(_recorder.duration));
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
        this.actionsGroup = new Gio.SimpleActionGroup();
        for (const { name, callback, enabled } of actions) {
            const action = new Gio.SimpleAction({ name, enabled });
            action.connect('activate', callback);
            this.actionsGroup.add_action(action);
        }
        const cancelAction = this.actionsGroup.lookup('cancel');
        const startAction = this.actionsGroup.lookup('start');
        startAction.bind_property('enabled', cancelAction, 'enabled', GObject.BindingFlags.INVERT_BOOLEAN);
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
        const dialog = new Adw.MessageDialog({
            heading: _('Delete Recording?'),
            body: _('This recording will not be saved.'),
            transient_for: this.root,
        });
        dialog.add_response('close', _('_Resume'));
        dialog.add_response('delete', _('_Delete'));
        dialog.set_response_appearance('delete', Adw.ResponseAppearance.DESTRUCTIVE);
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
_a = RecorderWidget;
(() => {
    GObject.registerClass({
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
            stopped: { param_types: [GObject.TYPE_OBJECT] },
        },
    }, _a);
})();
