"use strict";
/* exported Application RecordingsDir CacheDir Settings */
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
exports.Application = exports.Settings = exports.CacheDir = exports.RecordingsDir = void 0;
const _1 = require("gi://Adw");
const _2 = require("gi://Gio");
const _3 = require("gi://GLib");
const _4 = require("gi://GObject");
const _5 = require("gi://Gst");
const _6 = require("gi://Gtk?version=4.0");
exports.RecordingsDir = _2.default.file_new_for_path(_3.default.build_filenamev([_3.default.get_user_data_dir(), pkg.name]));
exports.CacheDir = _2.default.file_new_for_path(_3.default.build_filenamev([_3.default.get_user_cache_dir(), pkg.name]));
exports.Settings = new _2.default.Settings({ schema: pkg.name });
const window_js_1 = require("./window.js");
class Application extends _1.default.Application {
    constructor() {
        super({
            application_id: pkg.name,
            resource_base_path: '/org/gnome/SoundRecorder/',
        });
        _3.default.set_application_name(_('Sound Recorder'));
        _3.default.setenv('PULSE_PROP_media.role', 'production', true);
        _3.default.setenv('PULSE_PROP_application.icon_name', pkg.name, true);
        this.add_main_option('version', 'v'.charCodeAt(0), _3.default.OptionFlags.NONE, _3.default.OptionArg.NONE, 'Print version information and exit', null);
        this.connect('handle-local-options', (_, options) => {
            if (options.contains('version')) {
                print(pkg.version);
                /* quit the invoked process after printing the version number
                 * leaving the running instance unaffected
                 */
                return 0;
            }
            return -1;
        });
        _2.default._promisify(_2.default.File.prototype, 'trash_async', 'trash_finish');
        _2.default._promisify(_2.default.File.prototype, 'load_bytes_async', 'load_bytes_finish');
        _2.default._promisify(_2.default.File.prototype, 'enumerate_children_async', 'enumerate_children_finish');
        _2.default._promisify(_2.default.FileEnumerator.prototype, 'next_files_async', 'next_files_finish');
    }
    //add speech to text feature here
    initAppMenu() {
        const profileAction = exports.Settings.create_action('audio-profile');
        this.add_action(profileAction);
        const channelAction = exports.Settings.create_action('audio-channel');
        this.add_action(channelAction);
        //My speech to text button added ~ need to work on this some more
        const speechText = new _2.default.SimpleAction({ name: 'audio-to-text' });
        speechText.connect('activate', this.speechToTxt.bind(this));
        this.add_action(speechText);
        const aboutAction = new _2.default.SimpleAction({ name: 'about' });
        aboutAction.connect('activate', this.showAbout.bind(this));
        this.add_action(aboutAction);
        const quitAction = new _2.default.SimpleAction({ name: 'quit' });
        quitAction.connect('activate', () => {
            if (this.window) {
                this.window.close();
            }
        });
        this.add_action(quitAction);
        this.set_accels_for_action('app.quit', ['<Primary>q']);
        this.set_accels_for_action('win.open-primary-menu', ['F10']);
        this.set_accels_for_action('win.show-help-overlay', [
            '<Primary>question',
        ]);
        this.set_accels_for_action('recorder.start', ['<Primary>r']);
        this.set_accels_for_action('recorder.pause', ['space']);
        this.set_accels_for_action('recorder.resume', ['space']);
        this.set_accels_for_action('recorder.cancel', ['Delete']);
        this.set_accels_for_action('recorder.stop', ['s']);
        /* TODO: Fix recording.* keybindings */
        this.set_accels_for_action('recording.play', ['space']);
        this.set_accels_for_action('recording.pause', ['space']);
        this.set_accels_for_action('recording.seek-backward', ['b']);
        this.set_accels_for_action('recording.seek-forward', ['n']);
        this.set_accels_for_action('recording.rename', ['F2']);
        this.set_accels_for_action('recording.delete', ['Delete']);
        this.set_accels_for_action('recording.export', ['<Primary>s']);
    }
    vfunc_startup() {
        super.vfunc_startup();
        log('Sound Recorder (%s)'.format(pkg.name));
        log('Version: %s'.format(pkg.version));
        _5.default.init(null);
        try {
            exports.CacheDir.make_directory_with_parents(null);
            exports.RecordingsDir.make_directory_with_parents(null);
        }
        catch (e) {
            if (e instanceof _3.default.Error) {
                if (!e.matches(_2.default.IOErrorEnum, _2.default.IOErrorEnum.EXISTS))
                    console.error(`Failed to create directory: ${e.message}`);
            }
        }
        this.initAppMenu();
    }
    vfunc_activate() {
        if (!this.window) {
            this.window = new window_js_1.Window({ application: this });
            if (pkg.name.endsWith('Devel'))
                this.window.add_css_class('devel');
        }
        this.window.present();
    }
    showAbout() {
        let appName = _3.default.get_application_name();
        if (!appName)
            appName = _('Sound Recorder');
        const aboutDialog = new _1.default.AboutWindow({
            artists: [
                'Reda Lazri <the.red.shortcut@gmail.com>',
                'Garrett LeSage <garrettl@gmail.com>',
                'Hylke Bons <hylkebons@gmail.com>',
                'Sam Hewitt <hewittsamuel@gmail.com>',
            ],
            developers: [
                'Meg Ford <megford@gnome.org>',
                'Bilal Elmoussaoui <bil.elmoussaoui@gmail.com>',
                'Felipe Borges <felipeborges@gnome.org>',
                'Kavan Mevada <kavanmevada@gmail.com>',
                'Christopher Davis <christopherdavis@gnome.org>',
            ],
            /* Translators: Replace "translator-credits" with your names, one name per line */
            translator_credits: _('translator-credits'),
            application_name: appName,
            comments: _('A Sound Recording Application for GNOME'),
            license_type: _6.default.License.GPL_2_0,
            application_icon: pkg.name,
            version: pkg.version,
            website: 'https://wiki.gnome.org/Apps/SoundRecorder',
            copyright: 'Copyright 2013-2019 Meg Ford\nCopyright 2019-2020 Bilal Elmoussaoui &amp; Felipe Borges',
            modal: true,
            transient_for: this.window,
        });
        aboutDialog.show();
    }
    speechToTxt() {
        const window = new _6.default.Window({
            title: "Audio Transcription",
            default_height: 425,
            default_width: 600
        });
        window.show();
    }
}
exports.Application = Application;
_a = Application;
(() => {
    _4.default.registerClass(_a);
})();
//# sourceMappingURL=application.js.map