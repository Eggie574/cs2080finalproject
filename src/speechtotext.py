#For this feature to work you will need a few things
#1. Install whisperai
#2. Install ffmpeg
#3. Install nodejs

import whisper
import os
import sys

def speechConverter(audio) :

    model = whisper.load_model("base")
    results = model.transcribe(audio)

    os.chdir('/home/chadmar/Desktop')

    with open("ubuntuTestAudio.txt", "w") as file:          #will change the name later
        file.write(results["text"])
        print("The file is located in", os.getcwd())

    return results

# Running the speechConverter text
if __name__ == "__main__":

    if len(sys.argv) != 2:
        print('Usage: python3 script.py <input_text>')  #Error message
        sys.exit(1)

    audio = sys.argv[1]
    speechConverter(audio)
