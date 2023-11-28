"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingsListWidget = void 0;
/* exported RecordingsListWidget */
const _1 = require("gi://Adw");
const _2 = require("gi://GObject");
const _3 = require("gi://Gst");
const _4 = require("gi://GstPlayer");
const _5 = require("gi://Gtk?version=4.0");
const row_js_1 = require("./row.js");
class RecordingsListWidget extends _1.default.Bin {
    constructor(model, player) {
        super();
        this.list = _5.default.ListBox.new();
        this.list.valign = _5.default.Align.START;
        this.list.margin_start = 8;
        this.list.margin_end = 8;
        this.list.margin_top = 12;
        this.list.margin_bottom = 12;
        this.list.activate_on_single_click = true;
        this.list.add_css_class('boxed-list');
        this.set_child(this.list);
        this.player = player;
        this.player.connect('state-changed', (_player, state) => {
            if (state === _4.default.PlayerState.STOPPED &&
                this.activePlayingRow) {
                this.activePlayingRow.state = row_js_1.RowState.Paused;
                this.activePlayingRow.waveform.position = 0.0;
            }
            else if (state === _4.default.PlayerState.PLAYING) {
                if (this.activePlayingRow)
                    this.activePlayingRow.state = row_js_1.RowState.Playing;
            }
        });
        this.player.connect('position-updated', (_player, pos) => {
            if (this.activePlayingRow) {
                const duration = this.activePlayingRow.recording.duration;
                this.activePlayingRow.waveform.position = pos / duration;
            }
        });
        this.list.bind_model(model, (item) => {
            const recording = item;
            const row = new row_js_1.Row(recording);
            row.waveform.connect('gesture-pressed', () => {
                if (!this.activePlayingRow || this.activePlayingRow !== row) {
                    if (this.activePlayingRow)
                        this.activePlayingRow.waveform.position = 0.0;
                    this.activePlayingRow = row;
                    this.player.set_uri(recording.uri);
                }
            });
            row.waveform.connect('position-changed', (_wave, position) => {
                this.player.seek(position * row.recording.duration);
            });
            row.connect('play', (_row) => {
                if (this.activePlayingRow) {
                    if (this.activePlayingRow !== _row) {
                        this.activePlayingRow.state = row_js_1.RowState.Paused;
                        this.activePlayingRow.waveform.position = 0.0;
                        this.player.set_uri(recording.uri);
                    }
                }
                else {
                    this.player.set_uri(recording.uri);
                }
                this.activePlayingRow = _row;
                this.player.play();
            });
            row.connect('pause', () => {
                this.player.pause();
            });
            row.connect('seek-backward', (row) => {
                let position = this.player.position - 10 * _3.default.SECOND;
                position =
                    position < 0 || position > row.recording.duration
                        ? 0
                        : position;
                this.player.seek(position);
            });
            row.connect('seek-forward', (_row) => {
                let position = this.player.position + 10 * _3.default.SECOND;
                position =
                    position < 0 || position > _row.recording.duration
                        ? 0
                        : position;
                this.player.seek(position);
            });
            row.connect('deleted', () => {
                if (row === this.activeRow)
                    this.activeRow = null;
                if (row === this.activePlayingRow) {
                    this.activePlayingRow = null;
                    this.player.stop();
                }
                const index = row.get_index();
                this.isolateAt(index, false);
                this.emit('row-deleted', row.recording, index);
            });
            return row;
        });
        this.list.connect('row-activated', this.rowActivated.bind(this));
    }
    rowActivated(_list, row) {
        if ((row.editMode && row.expanded) ||
            (this.activeRow &&
                this.activeRow.editMode &&
                this.activeRow.expanded))
            return;
        if (this.activeRow && this.activeRow !== row) {
            this.activeRow.expanded = false;
            this.isolateAt(this.activeRow.get_index(), false);
        }
        row.expanded = !row.expanded;
        this.isolateAt(row.get_index(), row.expanded);
        this.activeRow = row;
    }
    isolateAt(index, expanded) {
        const before = this.list.get_row_at_index(index - 1);
        const current = this.list.get_row_at_index(index);
        const after = this.list.get_row_at_index(index + 1);
        if (expanded) {
            if (current)
                current.add_css_class('expanded');
            if (before)
                before.add_css_class('expanded-before');
            if (after)
                after.add_css_class('expanded-after');
        }
        else {
            if (current)
                current.remove_css_class('expanded');
            if (before)
                before.remove_css_class('expanded-before');
            if (after)
                after.remove_css_class('expanded-after');
        }
    }
}
exports.RecordingsListWidget = RecordingsListWidget;
_a = RecordingsListWidget;
(() => {
    _2.default.registerClass({
        Signals: {
            'row-deleted': {
                param_types: [_2.default.TYPE_OBJECT, _2.default.TYPE_INT],
            },
        },
    }, _a);
})();
//# sourceMappingURL=recordingListWidget.js.map