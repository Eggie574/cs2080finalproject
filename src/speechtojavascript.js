const { exec } = require('child_process');
const fs = require('fs');
const gi = require('node-gtk');
const path = require('path');

function speechConversion(name) {
    
    const recordingPath = path.join(__dirname, name);

    // Assuming 'SpeechToText.py' is the correct file name
    const pythonScriptPath = path.join(__dirname, 'speechtotext.py'); 

    // Command to run the Python script with the input text (wrapped in double quotes)
    const command = `python3 "${pythonScriptPath}" "${recordingPath}" `;

    // Execute the command
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        } 
   
    });

}

module.exports = speechConversion;

