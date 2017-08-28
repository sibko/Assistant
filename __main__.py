#!/usr/bin/env python

# Copyright (C) 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from __future__ import print_function
import sys
import argparse
import os.path
import json
import subprocess
import requests
import time
import google.oauth2.credentials

from google.assistant.library import Assistant
from google.assistant.library.event import EventType
from google.assistant.library.file_helpers import existing_file
from subprocess import PIPE
playingmusic=""
def process_event(event, assistant):
    """Pretty prints events.

    Prints all events that occur with two spaces between each new
    conversation and a single space between turns of a conversation.

    Args:
        event(event.Event): The current event to process.
    """
    if event.type == EventType.ON_CONVERSATION_TURN_STARTED:
        print()
        subprocess.call(["ogg123", "/home/pi/hail.ogg"])

    print(event)

    if (event.type == EventType.ON_CONVERSATION_TURN_FINISHED and
            event.args and not event.args['with_follow_on_turn']):
        print()

    if (event.type == EventType.ON_RECOGNIZING_SPEECH_FINISHED):
        devices = {
                'thelights': ['energenieb_', 'energeniea_'],
                'allthelights': ['energenieb_', 'energeniea_'],
                'TV': 'infrabedroomTV',
                'theTV': 'infrabedroomTV',
                'everything': ['energenieall_','x10a_', 'x10b_', 'x10c_', 'x10d_', 'all_'],  
                'thelamps': 'energenieb_',
                'thelamp': 'energenieb_',
                'thealarms': 'energenieb_',
                'thealarm': 'energenieb_',
                'alarm': 'energenieb_',
                'alarm': 'energenieb_',
                'myalarm': 'energenieb_',
                'myalarms': 'energenieb_',
                'thecontroller': 'energenied_',
                'thecontrollers': 'energenied_',
                'thecontrol':'energenied_',
                'thecontrols':'energenied_',
                'theconsoles': 'energeniec_',
                'theconsole': 'energeniec_',
                'theceiling': 'energeniea_',
                'bedroomlights': 'x10a_',
                'thebedroomlights': 'x10a_',
                'bedroomlight': 'x10a_',
                'thebedroomlight': 'x10a_',
                'bedlight': 'x10b_',
                'thebedlight': 'x10b_',
                'thekitchenlights': 'a_',
                'thekitchenlight': 'a_',
                'kitchenlights': 'a_',
                'theLEDstrip': 'a_',
                'thewaterfall': 'waterfall_',
                'waterfall': 'waterfall_',
                'soundbar': 'infrasoundbar',
                'thesoundbar': 'infrasoundbar',
                'aircon': 'infraaircon',
                'theaircon': 'infraaircon',
                'theicon': 'infraaircon',
                'icon': 'infraaircon',
                'theacon': 'infraaircon',
                'acon': 'infraaircon',
                'iPhone': 'infraaircon',
                'theiPhone': 'infraaircon'
            }
        print(event.args['text'])
        returned = event.args['text'].split()
        if (len(returned) > 4 and "".join(returned[:2]) == "canyou"):
            returned = returned[2:]
            print(returned)



#DIRECT TURN ON STUFF
        if (len(returned) > 1 and (returned[0] == 'turn' or returned[0] == 'dim' or returned[0] == 'brighten' )):
            action = returned[1].lower()
            object = "".join(returned[2:])
            if (returned[0] == 'dim' or returned[0] == 'brighten'):
                action = 'on'
                object = "".join(returned[1:])
            print(action)
            print(object)
            if (object in devices and (action == "on" or action == "off" or action =="up" or action == "down")):
                print(action)
                print(object)
                assistant.stop_conversation()
                device = devices[object]                
                house = "1"
                if (isinstance(device, list)):
                    for d in device:
                        subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", d + action ])
                elif ('infra' in device):
                    if (action=="up" and 'TV' in object):
                        action="volumeup"
                    if (action=="down" and 'TV' in object):
                        action="volumedown"
                    subprocess.call(["python", "/home/pi/Assistant/sendir.py", device[5:], action])
                else:
                    subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", device + action ])
                if (returned[0] == 'dim' and 'x10' in device):
                    time.sleep(0.05)
                    subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", 'x10dim' ])
                if (returned[0] == 'brighten' and 'x10' in device):
                    time.sleep(0.05)
                    subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", 'x10bright' ])


#SYSTEM COMMANDS
        if (len(returned) > 0 and (returned[0].lower() == 'reboot' or returned[0].lower() == 'restart')):            
            subprocess.call(["sudo", "shutdown", "-r", "now"])
        if (len(returned) > 0 and (returned[0].lower() == 'shutdown' or (len(returned) > 1 and returned[0].lower() + returned[1].lower() == 'shutdown'))):
            subprocess.call(["sudo", "shutdown", "-h", "now"])


#LED COMMANDS
        if (len(returned) > 1 and ("".join(returned[:2]).lower() == 'createa' or returned[0].lower() == 'create')):
            print(returned[2])
            try:
                r = requests.post("http://192.168.0.176", data={'colour': returned[2]})
            except requests.exceptions.RequestException as e:
                print(e)
            assistant.stop_conversation()            



#INFRARED COMMANDS
        if (len(returned) > 1 and ("".join(returned[:2]).lower() == 'makethe' or returned[0].lower() == 'make')):
            action = returned[len(returned) -1].lower()
            device = "".join(returned[2:len(returned) -1])
            print(action)
            print(device)
            if (device in devices):
                device = devices[device]
                subprocess.call(["python", "/home/pi/Assistant/sendir.py", device[5:], action])
                assistant.stop_conversation()



#MUSIC CONTROL
        #mplayer -playlist 00-little_big_town-a_place_to_land_\(deluxe\)-2008.m3u -shuffle
        if (len(returned) > 0 and returned[0] == 'skip'):
            assistant.stop_conversation()
            global playingmusic
            #playingmusic.communicate(input=b'\n')
            playingmusic.stdin.write(b'\n')
            #playingmusic.stdin.close()
        if (len(returned) > 2 and ("".join(returned[:2]).lower() == 'startplaylist' or "".join(returned[:2]).lower() == 'stopplaylist' or "".join(returned[:3]).lower() == 'startplaylist')):
            assistant.stop_conversation()
            command=[]
            command.append("/usr/bin/find")
            command.append("/music")
            command.append("-path")
            command.append("/music/trashbox")
            command.append("-prune")
            command.append("-o")
            command.append("-type")
            command.append("f")
            for word in returned:
                if (word == returned[0] or word.lower() == "start" or word.lower() == "play" or word.lower() == "list" or word.lower() == 'playlist' or word.lower() == 'shuffle'):
                    continue
                if (word != returned[1]):
                    command.append("-a")
                command.append("-iwholename")
                command.append("*" + word + "*")
            command.append("-print")
            print(command)
            results = subprocess.check_output(command)
            results = results.decode(sys.stdout.encoding).split("\n")
            print(results)
            for mfile in results:
                if ('m3u' in mfile or 'pls' in mfile or 'asx' in mfile):
                    global playingmusic
                    if ('shuffle' in returned or 'Shuffle' in returned):
                        playingmusic=subprocess.Popen(['mplayer', '-playlist', mfile, '-shuffle'], stdin=PIPE)
                    else:
                        playingmusic=subprocess.Popen(['mplayer', '-playlist', mfile], stdin=PIPE)
                    break

        if (len(returned) > 2 and returned[0].lower() == 'play'):
            assistant.stop_conversation()
            search = returned[1:]
            print(search)
            command = []
            command.append("/usr/bin/find")
            command.append("/music")
            command.append("-path")
            command.append("/music/trashbox")
            command.append("-prune")
            command.append("-o")
            command.append("-type")
            command.append("f")
            for word in returned:
                if (word == returned[0] or word.lower() == "the" or word.lower() == "it" or word.lower() == "a" or word.lower() == 'by'):
                    continue
                if (word != returned[1]):
                    command.append("-a")
                command.append("-iwholename")
                command.append("*" + word + "*")
            command.append("-print")
            print(command)
            results = subprocess.check_output(command)
            results = results.decode(sys.stdout.encoding).split("\n")
            print(results)
            for mfile in results:
                if ('flac' in mfile or 'mp3' in mfile):
                    global playingmusic
                    playingmusic=subprocess.Popen(['mplayer', mfile])
                    break
        if (len(returned) > 0 and (returned[0] == 'end' or "".join(returned[:2]).lower() == 'stopmusic' or "".join(returned[:3]).lower() == 'stopthemusic')):
            global playingmusic
            playingmusic.terminate()
        if (len(returned) > 0 and returned[0] == 'volume'):
            subprocess.call(['amixer', 'sset', 'PCM,0', returned[1]])


def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument('--credentials', type=existing_file,
                        metavar='OAUTH2_CREDENTIALS_FILE',
                        default=os.path.join(
                            os.path.expanduser('~/.config'),
                            'google-oauthlib-tool',
                            'credentials.json'
                        ),
                        help='Path to store and read OAuth2 credentials')
    args = parser.parse_args()
    with open(args.credentials, 'r') as f:
        credentials = google.oauth2.credentials.Credentials(token=None,
                                                            **json.load(f))

    with Assistant(credentials) as assistant:
        for event in assistant.start():
            process_event(event, assistant)


if __name__ == '__main__':
    main()
