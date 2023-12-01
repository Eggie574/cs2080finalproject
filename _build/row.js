var _a;
/* exported Row */
import Gdk from 'gi://Gdk?version=4.0';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk?version=4.0';
import { displayDateTime, formatTime } from './utils.js';
import { WaveForm, WaveType } from './waveform.js';
//declare var require : any
//const speechConversion = require('./speechToJavascript.js');
export var RowState;
(function (RowState) {
    RowState[RowState["Playing"] = 0] = "Playing";
    RowState[RowState["Paused"] = 1] = "Paused";
})(RowState || (RowState = {}));
export class Row extends Gtk.ListBoxRow {
    constructor(recording) {
        super();
        this.recording = recording;
        this._expanded = false;
        this._editMode = false;
        this._state = RowState.Paused;
        this.waveform = new WaveForm({
            margin_top: 18,
            height_request: 60,
        }, WaveType.Player);
        this._waveformStack.add_named(this.waveform, 'wave');
        if (this.recording.peaks.length > 0) {
            this.waveform.peaks = this.recording.peaks;
            this._waveformStack.visible_child_name = 'wave';
        }
        else {
            void this.recording.loadPeaks();
        }
        if (recording.timeModified)
            this._date.label = displayDateTime(recording.timeModified);
        else
            this._date.label = displayDateTime(recording.timeCreated);
        recording.bind_property('name', this._name, 'label', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        recording.bind_property('name', this._entry, 'text', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        this.bind_property('expanded', this._revealer, 'reveal_child', GObject.BindingFlags.SYNC_CREATE | GObject.BindingFlags.DEFAULT);
        this.actionGroup = new Gio.SimpleActionGroup();
        const exportAction = new Gio.SimpleAction({ name: 'export' });
        exportAction.connect('activate', () => {
            const window = this.root;
            this.exportDialog = Gtk.FileChooserNative.new(_('Export Recording'), window, Gtk.FileChooserAction.SAVE, _('_Export'), _('_Cancel'));
            this.exportDialog.set_current_name(`${this.recording.name}.${this.recording.extension}`);
            this.exportDialog.connect('response', (_dialog, response) => {
                var _b, _c;
                if (response === Gtk.ResponseType.ACCEPT) {
                    const dest = (_b = this.exportDialog) === null || _b === void 0 ? void 0 : _b.get_file();
                    if (dest)
                        this.recording.save(dest);
                }
                (_c = this.exportDialog) === null || _c === void 0 ? void 0 : _c.destroy();
                this.exportDialog = null;
            });
            this.exportDialog.show();
        });
        this.actionGroup.add_action(exportAction);
        this.saveRenameAction = new Gio.SimpleAction({
            name: 'save',
            enabled: false,
        });
        this.saveRenameAction.connect('activate', this.onRenameRecording.bind(this));
        this.actionGroup.add_action(this.saveRenameAction);
        this.renameAction = new Gio.SimpleAction({
            name: 'rename',
            enabled: true,
        });
        this.renameAction.connect('activate', (action) => {
            this.editMode = true;
            action.enabled = false;
        });
        this.renameAction.bind_property('enabled', this.saveRenameAction, 'enabled', GObject.BindingFlags.INVERT_BOOLEAN);
        this.actionGroup.add_action(this.renameAction);
        this.pauseAction = new Gio.SimpleAction({
            name: 'pause',
            enabled: false,
        });
        this.pauseAction.connect('activate', () => {
            this.emit('pause');
            this.state = RowState.Paused;
        });
        this.actionGroup.add_action(this.pauseAction);
        this.playAction = new Gio.SimpleAction({ name: 'play', enabled: true });
        this.playAction.connect('activate', () => {
            this.emit('play', this.recording.uri);
            this.state = RowState.Playing;
        });
        this.actionGroup.add_action(this.playAction);
        const deleteAction = new Gio.SimpleAction({ name: 'delete' });
        deleteAction.connect('activate', () => {
            this.emit('deleted');
        });
        this.actionGroup.add_action(deleteAction);
        const seekBackAction = new Gio.SimpleAction({ name: 'seek-backward' });
        seekBackAction.connect('activate', () => {
            RowState;
        });
        this.actionGroup.add_action(seekBackAction);
        const seekForwardAction = new Gio.SimpleAction({
            name: 'seek-forward',
        });
        seekForwardAction.connect('activate', () => {
            this.emit('seek-forward');
        });
        this.actionGroup.add_action(seekForwardAction);
        this.insert_action_group('recording', this.actionGroup);
        this.waveform.connect('gesture-pressed', () => {
            this.pauseAction.activate(null);
        });
        this.keyController = Gtk.EventControllerKey.new();
        this.keyController.connect('key-pressed', (_controller, key) => {
            this._entry.remove_css_class('error');
            if (key === Gdk.KEY_Escape)
                this.editMode = false;
        });
        this._entry.add_controller(this.keyController);
        this._entry.connect('activate', () => {
            this.saveRenameAction.activate(null);
        });
        this.recording.connect('peaks-updated', (_recording) => {
            this._waveformStack.visible_child_name = 'wave';
            this.waveform.peaks = _recording.peaks;
        });
        this.recording.connect('peaks-loading', () => {
            this._waveformStack.visible_child_name = 'loading';
        });
        // Force LTR, we don't want forward/play/backward
        this._playbackControls.set_direction(Gtk.TextDirection.LTR);
        // Force LTR, we don't want reverse hh:mm::ss
        this._duration.set_direction(Gtk.TextDirection.LTR);
        this._duration.set_markup(formatTime(recording.duration));
        recording.connect('notify::duration', () => {
            this._duration.label = formatTime(recording.duration);
        });
    }
    onRenameRecording() {
        try {
            if (this._name.label !== this._entry.text)
                this.recording.name = this._entry.text;
            this.editMode = false;
            this.renameAction.enabled = true;
            this._entry.remove_css_class('error');
        }
        catch (e) {
            this._entry.add_css_class('error');
        }
    }
    set editMode(state) {
        this._mainStack.visible_child_name = state ? 'edit' : 'display';
        this._editMode = state;
        if (state) {
            if (!this.expanded)
                this.activate();
            this._entry.grab_focus();
            /* TODO: this._saveBtn.grab_default(); */
            this._rightStack.visible_child_name = 'save';
        }
        else {
            this._rightStack.visible_child_name = 'options';
            this.grab_focus();
        }
        for (const action of this.actionGroup.list_actions()) {
            if (action !== 'save') {
                const someAction = this.actionGroup.lookup(action);
                someAction.enabled = !state;
            }
        }
    }
    get editMode() {
        return this._editMode;
    }
    set expanded(state) {
        this._expanded = state;
        this.notify('expanded');
    }
    get expanded() {
        return this._expanded;
    }
    set state(rowState) {
        this._state = rowState;
        switch (rowState) {
            case RowState.Playing:
                this.playAction.enabled = false;
                this.pauseAction.enabled = true;
                this._playbackStack.visible_child_name = 'pause';
                this._pauseBtn.grab_focus();
                break;
            case RowState.Paused:
                this.playAction.enabled = true;
                this.pauseAction.enabled = false;
                this._playbackStack.visible_child_name = 'play';
                this._playBtn.grab_focus();
                break;
        }
    }
    get state() {
        return this._state;
    }
}
_a = Row;
(() => {
    GObject.registerClass({
        Template: 'resource:///org/gnome/SoundRecorder/ui/row.ui',
        InternalChildren: [
            'playbackStack',
            'mainStack',
            'waveformStack',
            'rightStack',
            'name',
            'entry',
            'date',
            'duration',
            'revealer',
            'playbackControls',
            'saveBtn',
            'playBtn',
            'pauseBtn',
        ],
        Signals: {
            play: { param_types: [GObject.TYPE_STRING] },
            pause: {},
            'seek-backward': {},
            'seek-forward': {},
            deleted: {},
        },
        Properties: {
            expanded: GObject.ParamSpec.boolean('expanded', 'Row active status', 'Row active status', GObject.ParamFlags.READWRITE |
                GObject.ParamFlags.CONSTRUCT, false),
        },
    }, _a);
})();
//# sourceMappingURL=row.js.map