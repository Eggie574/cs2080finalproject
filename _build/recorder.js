"use strict";
/* exported EncodingProfiles Recorder */
/*
 * Copyright 2013 Meg Ford
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, see <http://www.gnu.org/licenses/>.
 *
 *  Author: Meg Ford <megford@gnome.org>
 *
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recorder = exports.EncodingProfiles = void 0;
const _1 = require("gi://GLib");
const _2 = require("gi://GObject");
const _3 = require("gi://Gst");
const _4 = require("gi://GstPbutils");
const application_js_1 = require("./application.js");
const recording_js_1 = require("./recording.js");
// All supported encoding profiles.
exports.EncodingProfiles = [
    {
        name: 'VORBIS',
        containerCaps: 'application/ogg;audio/ogg;video/ogg',
        audioCaps: 'audio/x-vorbis',
        contentType: 'audio/x-vorbis+ogg',
        extension: 'ogg',
    },
    {
        name: 'OPUS',
        containerCaps: 'application/ogg',
        audioCaps: 'audio/x-opus',
        contentType: 'audio/x-opus+ogg',
        extension: 'opus',
    },
    {
        name: 'FLAC',
        containerCaps: 'audio/x-flac',
        audioCaps: 'audio/x-flac',
        contentType: 'audio/flac',
        extension: 'flac',
    },
    {
        name: 'MP3',
        containerCaps: 'application/x-id3',
        audioCaps: 'audio/mpeg,mpegversion=(int)1,layer=(int)3',
        contentType: 'audio/mpeg',
        extension: 'mp3',
    },
    {
        name: 'M4A',
        containerCaps: 'video/quicktime,variant=(string)iso',
        audioCaps: 'audio/mpeg,mpegversion=(int)4',
        contentType: 'video/mp4',
        extension: 'm4a',
    },
];
const AudioChannels = [
    { name: 'stereo', channels: 2 },
    { name: 'mono', channels: 1 },
];
class Recorder extends _2.default.Object {
    constructor() {
        super();
        this.peaks = [];
        let srcElement;
        let audioConvert;
        const caps = _3.default.Caps.from_string('audio/x-raw');
        this.pipeline = new _3.default.Pipeline({ name: 'pipe' });
        const elements = [
            ['pulsesrc', 'srcElement'],
            ['audioconvert', 'audioConvert'],
            ['level', 'level'],
            ['encodebin', 'ebin'],
            ['filesink', 'filesink'],
        ].map(([fac, name]) => {
            const element = _3.default.ElementFactory.make(fac, name);
            if (!element)
                throw new Error('Not all elements could be created.');
            this.pipeline.add(element);
            return element;
        });
        [srcElement, audioConvert, this.level, this.ebin, this.filesink] =
            elements;
        srcElement.link(audioConvert);
        audioConvert.link_filtered(this.level, caps);
    }
    start() {
        let index = 1;
        do {
            /* Translators: ""Recording %d"" is the default name assigned to a file created
            by the application (for example, "Recording 1"). */
            this.file = application_js_1.RecordingsDir.get_child_for_display_name(_('Recording %d').format(index++));
        } while (this.file.query_exists(null));
        this.recordBus = this.pipeline.get_bus();
        this.recordBus.add_signal_watch();
        this.handlerId = this.recordBus.connect('message', (_, message) => {
            if (message)
                this.onMessageReceived(message);
        });
        if (this.ebin && this.level && this.filesink) {
            this.ebin.set_property('profile', this.getProfile());
            this.filesink.set_property('location', this.file.get_path());
            this.level.link(this.ebin);
            this.ebin.link(this.filesink);
        }
        this.state = _3.default.State.PLAYING;
        this.timeout = _1.default.timeout_add(_1.default.PRIORITY_DEFAULT, 100, () => {
            const pos = this.pipeline.query_position(_3.default.Format.TIME)[1];
            if (pos > 0)
                this.duration = pos;
            return true;
        });
    }
    pause() {
        this.state = _3.default.State.PAUSED;
    }
    resume() {
        if (this.state === _3.default.State.PAUSED)
            this.state = _3.default.State.PLAYING;
    }
    stop() {
        this.state = _3.default.State.NULL;
        this.duration = 0;
        if (this.timeout) {
            _1.default.source_remove(this.timeout);
            this.timeout = null;
        }
        if (this.recordBus && this.handlerId) {
            this.recordBus.remove_watch();
            this.recordBus.disconnect(this.handlerId);
            this.recordBus = null;
            this.handlerId = null;
        }
        if (this.file &&
            this.file.query_exists(null) &&
            this.peaks.length > 0) {
            const recording = new recording_js_1.Recording(this.file);
            recording.peaks = this.peaks.slice();
            this.peaks.length = 0;
            return recording;
        }
        return undefined;
    }
    onMessageReceived(message) {
        switch (message.type) {
            case _3.default.MessageType.ELEMENT: {
                if (_4.default.is_missing_plugin_message(message)) {
                    const detail = _4.default.missing_plugin_message_get_installer_detail(message);
                    const description = _4.default.missing_plugin_message_get_description(message);
                    log(`Detail: ${detail}\nDescription: ${description}`);
                    break;
                }
                const s = message.get_structure();
                if (s && s.has_name('level')) {
                    const peakVal = s.get_value('peak');
                    if (peakVal)
                        this.current_peak = peakVal.get_nth(0);
                }
                break;
            }
            case _3.default.MessageType.EOS:
                this.stop();
                break;
            case _3.default.MessageType.WARNING: {
                const warning = message.parse_warning()[0];
                if (warning) {
                    log(warning.toString());
                }
                break;
            }
            case _3.default.MessageType.ERROR:
                log(message.parse_error().toString());
                break;
        }
    }
    getChannel() {
        const channelIndex = application_js_1.Settings.get_enum('audio-channel');
        return AudioChannels[channelIndex].channels;
    }
    getProfile() {
        const profileIndex = application_js_1.Settings.get_enum('audio-profile');
        const profile = exports.EncodingProfiles[profileIndex];
        const audioCaps = _3.default.Caps.from_string(profile.audioCaps);
        audioCaps === null || audioCaps === void 0 ? void 0 : audioCaps.set_value('channels', this.getChannel());
        if (audioCaps) {
            const encodingProfile = _4.default.EncodingAudioProfile.new(audioCaps, null, null, 1);
            const containerCaps = _3.default.Caps.from_string(profile.containerCaps);
            if (containerCaps) {
                const containerProfile = _4.default.EncodingContainerProfile.new('record', null, containerCaps, null);
                containerProfile.add_profile(encodingProfile);
                return containerProfile;
            }
        }
        return undefined;
    }
    get duration() {
        return this._duration;
    }
    set duration(val) {
        this._duration = val;
        this.notify('duration');
    }
    // eslint-disable-next-line camelcase
    get current_peak() {
        return this._current_peak;
    }
    // eslint-disable-next-line camelcase
    set current_peak(peak) {
        if (this.peaks) {
            if (peak > 0)
                peak = 0;
            this._current_peak = Math.pow(10, peak / 20);
            this.peaks.push(this._current_peak);
            this.notify('current-peak');
        }
    }
    get state() {
        return this.pipeState;
    }
    set state(s) {
        this.pipeState = s;
        if (this.pipeState) {
            const ret = this.pipeline.set_state(this.pipeState);
            if (ret === _3.default.StateChangeReturn.FAILURE)
                log('Unable to update the recorder pipeline state');
        }
    }
}
exports.Recorder = Recorder;
_a = Recorder;
(() => {
    _2.default.registerClass({
        Properties: {
            duration: _2.default.ParamSpec.int('duration', 'Recording Duration', 'Recording duration in nanoseconds', _2.default.ParamFlags.READWRITE |
                _2.default.ParamFlags.CONSTRUCT, 0, _1.default.MAXINT16, 0),
            'current-peak': _2.default.ParamSpec.float('current-peak', 'Waveform current peak', 'Waveform current peak in float [0, 1]', _2.default.ParamFlags.READWRITE |
                _2.default.ParamFlags.CONSTRUCT, 0.0, 1.0, 0.0),
        },
    }, _a);
})();
//# sourceMappingURL=recorder.js.map