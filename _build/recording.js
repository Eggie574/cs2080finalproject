var _a;
/* exported Recording */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gst from 'gi://Gst';
import GstPbutils from 'gi://GstPbutils';
import { CacheDir } from './application.js';
import { EncodingProfiles } from './recorder.js';
function isNumArray(input) {
    return Array.isArray(input) && input.every((i) => typeof i === 'number');
}
export class Recording extends GObject.Object {
    constructor(file) {
        super();
        this._file = file;
        this._peaks = [];
        this.loadedPeaks = [];
        const info = file.query_info('time::created,time::modified,standard::content-type', 0, null);
        const contentType = info.get_attribute_string('standard::content-type');
        for (const profile of EncodingProfiles) {
            if (profile.contentType === contentType) {
                this._extension = profile.extension;
                break;
            }
        }
        const timeModified = info.get_attribute_uint64('time::modified');
        const timeCreated = info.get_attribute_uint64('time::created');
        this._timeModified = GLib.DateTime.new_from_unix_local(timeModified);
        this._timeCreated = GLib.DateTime.new_from_unix_local(timeCreated);
        const discoverer = new GstPbutils.Discoverer();
        discoverer.start();
        discoverer.connect('discovered', (_discoverer, audioInfo) => {
            this._duration = audioInfo.get_duration();
            this.notify('duration');
        });
        discoverer.discover_uri_async(this.uri);
    }
    //getting the name of the recording 
    get name() {
        return this._file.get_basename();
    }
    //setting the name of the recording
    set name(filename) {
        if (filename && filename !== this.name) {
            this._file = this._file.set_display_name(filename, null);
            this.notify('name');
        }
    }
    get extension() {
        return this._extension;
    }
    get timeModified() {
        return this._timeModified;
    }
    get timeCreated() {
        return this._timeCreated;
    }
    get duration() {
        if (this._duration)
            return this._duration;
        else
            return 0;
    }
    get file() {
        return this._file;
    }
    get uri() {
        return this._file.get_uri();
    }
    // eslint-disable-next-line camelcase
    set peaks(data) {
        if (data.length > 0) {
            this._peaks = data;
            this.emit('peaks-updated');
            const enc = new TextEncoder();
            const contents = enc.encode(JSON.stringify(data));
            this.waveformCache.replace_contents_async(contents, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null, null);
        }
    }
    // eslint-disable-next-line camelcase
    get peaks() {
        return this._peaks;
    }
    async delete() {
        await this._file.trash_async(GLib.PRIORITY_HIGH, null);
        await this.waveformCache.trash_async(GLib.PRIORITY_DEFAULT, null);
    }
    save(dest) {
        this.file.copy_async(dest, Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, null, 
        // @ts-expect-error TypeScript isn't reading async function params correctly
        null, (obj, res) => {
            if (obj.copy_finish(res))
                log('Exporting file: done');
        });
    }
    get waveformCache() {
        return CacheDir.get_child(`${this.name}_data`);
    }
    async loadPeaks() {
        try {
            const bytes = (await this.waveformCache.load_bytes_async(null))[0];
            const decoder = new TextDecoder('utf-8');
            if (bytes) {
                const data = bytes.get_data();
                if (data) {
                    const parsedJSON = JSON.parse(decoder.decode(data));
                    if (isNumArray(parsedJSON)) {
                        this._peaks = parsedJSON;
                        this.emit('peaks-updated');
                    }
                    else {
                        throw new GLib.NumberParserError({
                            message: 'Failed to parse waveform',
                            code: GLib.NumberParserError.INVALID,
                        });
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof GLib.Error) {
                log(`Error reading waveform data file: ${error.message}`);
                if (error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND) ||
                    error.matches(GLib.NumberParserError, GLib.NumberParserError.INVALID)) {
                    this.emit('peaks-loading');
                    this.generatePeaks();
                }
            }
        }
    }
    generatePeaks() {
        this.pipeline = Gst.parse_launch('uridecodebin name=uridecodebin ! audioconvert ! audio/x-raw,channels=1 ! level name=level ! fakesink name=faked');
        const uridecodebin = this.pipeline.get_by_name('uridecodebin');
        uridecodebin === null || uridecodebin === void 0 ? void 0 : uridecodebin.set_property('uri', this.uri);
        const fakesink = this.pipeline.get_by_name('faked');
        fakesink === null || fakesink === void 0 ? void 0 : fakesink.set_property('qos', false);
        fakesink === null || fakesink === void 0 ? void 0 : fakesink.set_property('sync', true);
        const bus = this.pipeline.get_bus();
        this.pipeline.set_state(Gst.State.PLAYING);
        bus === null || bus === void 0 ? void 0 : bus.add_signal_watch();
        bus === null || bus === void 0 ? void 0 : bus.connect('message', (_bus, message) => {
            var _b;
            switch (message.type) {
                case Gst.MessageType.ELEMENT: {
                    const s = message.get_structure();
                    if (s && s.has_name('level')) {
                        const peakVal = s.get_value('peak');
                        if (peakVal) {
                            const peak = peakVal.get_nth(0);
                            this.loadedPeaks.push(Math.pow(10, peak / 20));
                        }
                    }
                    break;
                }
                case Gst.MessageType.EOS:
                    this.peaks = this.loadedPeaks;
                    (_b = this.pipeline) === null || _b === void 0 ? void 0 : _b.set_state(Gst.State.NULL);
                    this.pipeline = null;
                    break;
            }
        });
    }
}
_a = Recording;
(() => {
    GObject.registerClass({
        Signals: {
            'peaks-updated': {},
            'peaks-loading': {},
        },
        Properties: {
            duration: GObject.ParamSpec.int('duration', 'Recording Duration', 'Recording duration in nanoseconds', GObject.ParamFlags.READWRITE |
                GObject.ParamFlags.CONSTRUCT, 0, GLib.MAXINT16, 0),
            name: GObject.ParamSpec.string('name', 'Recording Name', 'Recording name in string', GObject.ParamFlags.READWRITE |
                GObject.ParamFlags.CONSTRUCT, ''),
        },
    }, _a);
})();
