/// <reference types="gi-types/gi.js" />
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
export declare const RecordingsDir: Gio.FilePrototype;
export declare const CacheDir: Gio.FilePrototype;
export declare const Settings: Gio.Settings;
export declare class Application extends Adw.Application {
    private window?;
    constructor();
    private initAppMenu;
    vfunc_startup(): void;
    vfunc_activate(): void;
    private showAbout;
    private speechToTxt;
}
//# sourceMappingURL=application.d.ts.map