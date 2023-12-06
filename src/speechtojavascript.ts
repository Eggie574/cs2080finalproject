// @ts-ignore
import GLib from 'gi://GLib';

let cmd = 'python3'

try {
    const scriptPath = '/home/chadmar/Documents/GitHub Repo Linux/cs2080finalproject/src/speechtotext.py';
    const audioFilePath = '/home/chadmar/Documents/GitHub Repo Linux/cs2080finalproject/src/Debugger.mp3';

    GLib.spawn_command_line_async(`${cmd} "${scriptPath}"  "${audioFilePath}"`);

} catch (error) {
    //console.error('Script is unable to run:');
}

