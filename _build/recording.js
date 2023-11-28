"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recording = void 0;
/* exported Recording */
const _1 = require("gi://Gio");
const _2 = require("gi://GLib");
const _3 = require("gi://GObject");
const _4 = require("gi://Gst");
const _5 = require("gi://GstPbutils");
const application_js_1 = require("./application.js");
const recorder_js_1 = require("./recorder.js");
function isNumArray(input) {
    return Array.isArray(input) && input.every((i) => typeof i === 'number');
}
class Recording extends _3.default.Object {
    constructor(file) {
        super();
        this._file = file;
        this._peaks = [];
        this.loadedPeaks = [];
        const info = file.query_info('time::created,time::modified,standard::content-type', 0, null);
        const contentType = info.get_attribute_string('standard::content-type');
        for (const profile of recorder_js_1.EncodingProfiles) {
            if (profile.contentType === contentType) {
                this._extension = profile.extension;
                break;
            }
        }
        const timeModified = info.get_attribute_uint64('time::modified');
        const timeCreated = info.get_attribute_uint64('time::created');
        this._timeModified = _2.default.DateTime.new_from_unix_local(timeModified);
        this._timeCreated = _2.default.DateTime.new_from_unix_local(timeCreated);
        const discoverer = new _5.default.Discoverer();
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
            this.waveformCache.replace_contents_async(contents, null, false, _1.default.FileCreateFlags.REPLACE_DESTINATION, null, null);
        }
    }
    // eslint-disable-next-line camelcase
    get peaks() {
        return this._peaks;
    }
    async delete() {
        await this._file.trash_async(_2.default.PRIORITY_HIGH, null);
        await this.waveformCache.trash_async(_2.default.PRIORITY_DEFAULT, null);
    }
    save(dest) {
        this.file.copy_async(dest, _1.default.FileCreateFlags.NONE, _2.default.PRIORITY_DEFAULT, null, 
        // @ts-expect-error TypeScript isn't reading async function params correctly
        null, (obj, res) => {
            if (obj.copy_finish(res))
                log('Exporting file: done');
        });
    }
    get waveformCache() {
        return application_js_1.CacheDir.get_child(`${this.name}_data`);
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
                        throw new _2.default.NumberParserError({
                            message: 'Failed to parse waveform',
                            code: _2.default.NumberParserError.INVALID,
                        });
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof _2.default.Error) {
                log(`Error reading waveform data file: ${error.message}`);
                if (error.matches(_1.default.IOErrorEnum, _1.default.IOErrorEnum.NOT_FOUND) ||
                    error.matches(_2.default.NumberParserError, _2.default.NumberParserError.INVALID)) {
                    this.emit('peaks-loading');
                    this.generatePeaks();
                }
            }
        }
    }
    generatePeaks() {
        this.pipeline = _4.default.parse_launch('uridecodebin name=uridecodebin ! audioconvert ! audio/x-raw,channels=1 ! level name=level ! fakesink name=faked');
        const uridecodebin = this.pipeline.get_by_name('uridecodebin');
        uridecodebin === null || uridecodebin === void 0 ? void 0 : uridecodebin.set_property('uri', this.uri);
        const fakesink = this.pipeline.get_by_name('faked');
        fakesink === null || fakesink === void 0 ? void 0 : fakesink.set_property('qos', false);
        fakesink === null || fakesink === void 0 ? void 0 : fakesink.set_property('sync', true);
        const bus = this.pipeline.get_bus();
        this.pipeline.set_state(_4.default.State.PLAYING);
        bus === null || bus === void 0 ? void 0 : bus.add_signal_watch();
        bus === null || bus === void 0 ? void 0 : bus.connect('message', (_bus, message) => {
            var _b;
            switch (message.type) {
                case _4.default.MessageType.ELEMENT: {
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
                case _4.default.MessageType.EOS:
                    this.peaks = this.loadedPeaks;
                    (_b = this.pipeline) === null || _b === void 0 ? void 0 : _b.set_state(_4.default.State.NULL);
                    this.pipeline = null;
                    break;
            }
        });
    }
}
exports.Recording = Recording;
_a = Recording;
(() => {
    _3.default.registerClass({
        Signals: {
            'peaks-updated': {},
            'peaks-loading': {},
        },
        Properties: {
            duration: _3.default.ParamSpec.int('duration', 'Recording Duration', 'Recording duration in nanoseconds', _3.default.ParamFlags.READWRITE |
                _3.default.ParamFlags.CONSTRUCT, 0, _2.default.MAXINT16, 0),
            name: _3.default.ParamSpec.string('name', 'Recording Name', 'Recording name in string', _3.default.ParamFlags.READWRITE |
                _3.default.ParamFlags.CONSTRUCT, ''),
        },
    }, _a);
})();
//# sourceMappingURL=recording.js.map