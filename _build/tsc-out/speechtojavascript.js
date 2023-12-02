"use strict";
const { exec } = require('child_process');
const fs = require('fs');
const gi = require('node-gtk');
const path = require('path');
const Gio = gi.require('Gio', '2.0'); //will worry about this later
function speechConversion(mainPath) {
    //const recordingPath = mainPath + '/' + name
    // Assuming 'SpeechToText.py' is the correct file name
    const pythonScriptPath = path.join(__dirname, 'speechToText.py');
    // Command to run the Python script with the input text (wrapped in double quotes)
    const command = `python3 "${pythonScriptPath}" "${mainPath}" `;
    // Execute the command
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
    });
}
module.exports = speechConversion;
//# sourceMappingURL=speechtojavascript.js.map