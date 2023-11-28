import Adw from 'gi://Adw';
import GstPlayer from 'gi://GstPlayer';
import Gtk from 'gi://Gtk?version=4.0';
import Gio from 'gi://Gio';
import { Row } from './row.js';
export declare class RecordingsListWidget extends Adw.Bin {
    private player;
    list: Gtk.ListBox;
    activeRow?: Row | null;
    activePlayingRow?: Row | null;
    constructor(model: Gio.ListModel, player: GstPlayer.Player);
    private rowActivated;
    private isolateAt;
}
//# sourceMappingURL=recordingListWidget.d.ts.map