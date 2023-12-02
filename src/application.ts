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

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gst from 'gi://Gst';
import Gtk from 'gi://Gtk?version=4.0';

//declaring speech to text conversion code
declare var require : any;
const speechConversion = require('./speechtojavascript.js');

export const RecordingsDir = Gio.file_new_for_path(
    GLib.build_filenamev([GLib.get_user_data_dir(), pkg.name])
);
export const CacheDir = Gio.file_new_for_path(
    GLib.build_filenamev([GLib.get_user_cache_dir(), pkg.name])
);
export const Settings = new Gio.Settings({ schema: pkg.name });

import { Window } from './window.js';
import { CenterBox, FileChooser } from 'gi-types/gtk4.js';

export class Application extends Adw.Application {
    private window?: Window;

    static {
        GObject.registerClass(this);
    }

    constructor() {
        super({
            application_id: pkg.name,
            resource_base_path: '/org/gnome/SoundRecorder/',
        });
        GLib.set_application_name(_('Sound Recorder'));
        GLib.setenv('PULSE_PROP_media.role', 'production', true);
        GLib.setenv('PULSE_PROP_application.icon_name', pkg.name, true);

        this.add_main_option(
            'version',
            'v'.charCodeAt(0),
            GLib.OptionFlags.NONE,
            GLib.OptionArg.NONE,
            'Print version information and exit',
            null
        );

        this.connect('handle-local-options', (_, options: GLib.VariantDict) => {
            if (options.contains('version')) {
                print(pkg.version);
                /* quit the invoked process after printing the version number
                 * leaving the running instance unaffected
                 */
                return 0;
            }
            return -1;
        });

        Gio._promisify(Gio.File.prototype, 'trash_async', 'trash_finish');
        Gio._promisify(
            Gio.File.prototype,
            'load_bytes_async',
            'load_bytes_finish'
        );
        Gio._promisify(
            Gio.File.prototype,
            'enumerate_children_async',
            'enumerate_children_finish'
        );
        Gio._promisify(
            Gio.FileEnumerator.prototype,
            'next_files_async',
            'next_files_finish'
        );
    }

    //add speech to text feature here
    private initAppMenu(): void {
        const profileAction = Settings.create_action('audio-profile');
        this.add_action(profileAction);

        const channelAction = Settings.create_action('audio-channel');
        this.add_action(channelAction);

        //My speech to text button added ~ need to work on this some more
        const speechText = new Gio.SimpleAction({name: 'audio-to-text'});
        speechText.connect('activate', this.speechToTxt.bind(this));
        this.add_action(speechText);


        const aboutAction = new Gio.SimpleAction({ name: 'about' });
        aboutAction.connect('activate', this.showAbout.bind(this));
        this.add_action(aboutAction);

        const quitAction = new Gio.SimpleAction({ name: 'quit' });
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

    public vfunc_startup(): void {
        super.vfunc_startup();
        log('Sound Recorder (%s)'.format(pkg.name));
        log('Version: %s'.format(pkg.version));

        Gst.init(null);

        try {
            CacheDir.make_directory_with_parents(null);
            RecordingsDir.make_directory_with_parents(null);
        } catch (e: unknown) {
            if (e instanceof GLib.Error) {
                if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                    console.error(`Failed to create directory: ${e.message}`);
            }
        }
        this.initAppMenu();
    }

    public vfunc_activate(): void {
        if (!this.window) {
            this.window = new Window({ application: this });
            if (pkg.name.endsWith('Devel')) this.window.add_css_class('devel');
        }
        this.window.present();
    }

    private showAbout(): void {
        let appName = GLib.get_application_name();
        if (!appName) appName = _('Sound Recorder');

        const aboutDialog = new Adw.AboutWindow({
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
            license_type: Gtk.License.GPL_2_0,
            application_icon: pkg.name,
            version: pkg.version,
            website: 'https://wiki.gnome.org/Apps/SoundRecorder',
            copyright:
                'Copyright 2013-2019 Meg Ford\nCopyright 2019-2020 Bilal Elmoussaoui &amp; Felipe Borges',
            modal: true,
            transient_for: this.window,
        });
        aboutDialog.show();
    }

    private speechToTxt() {

        let selectedAudioFile = Gio.File;
    
        // Button for opening a file to be transcribed
        const handleImportAction = () => {
        
            const audioFile = new Gtk.FileChooserDialog({
            
                title: 'Choose File',
                action: Gtk.FileChooserAction.OPEN,
                buttons: [
                    { label: 'Cancel', response: Gtk.ResponseType.CANCEL },
                    { label: 'Accept', response: Gtk.ResponseType.ACCEPT }
                ]
                
            });
            
            audioFile.connect('response', (_: Gtk.Dialog, response: number) => {
            
                if (response === Gtk.ResponseType.ACCEPT) {
                    const selectedAudioFile = audioFile.get_file();
                }
                audioFile.destroy();
                
            });
            
        };
        
        //Button for doing the transcribe feature
        const handleTranscribeAction = () => {
        
            if (selectedAudioFile) {
              
              speechConversion(selectedAudioFile)
              
            }
            
        };
    
        const window = new Gtk.Window({
        
            title: "Audio Transcription",
            default_height: 425,
            default_width: 600
            
        });
    
        const box = new Gtk.Box({
        
            orientation: Gtk.Orientation.HORIZONTAL,
            margin_top: 80,
            margin_bottom: 250,
            spacing: 15
            
        });
        
        //Button import Button label
        const importButton = new Gtk.Button({
        
            label: "Import Files"
            
        });
        importButton.set_size_request(500, 7);
        importButton.connect('activate', handleImportAction);
        
        //Transcribe button label
        const transcribeButton = new Gtk.Button({
            label: "Transcribe"
        });
        transcribeButton.set_size_request(75, 5);
        transcribeButton.connect('activate', handleTranscribeAction);
        
        //action for importing audio file
        const importAudioAction = new Gio.SimpleAction({ name: 'import' });
        importAudioAction.connect('activate', handleImportAction);
        this.add_action(importAudioAction);
        
        //action for transcribing file
        const transcribeAudioAction = new Gio.SimpleAction({ name: 'transcribe' });
        transcribeAudioAction.connect('activate', handleTranscribeAction);
        this.add_action(transcribeAudioAction);
    
        box.append(transcribeButton);
        box.append(importButton);
        window.set_child(box);
    
        window.show();

    }

}