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
import ast
import pexpect
import logging

from google.assistant.library import Assistant
from google.assistant.library.event import EventType
from google.assistant.library.file_helpers import existing_file
from subprocess import PIPE

isplaying=False
mplayerexists=False

conffile = open("/home/pi/settings.conf", "r")
config = ast.literal_eval(conffile.read())
print(config)
logging.basicConfig(filename='/home/pi/assLogs.log', level=logging.DEBUG, format='%(asctime)s %(levelname)-8s %(message)s')
hasVideo=False
if ('hasVideo' in config and config['hasVideo'] == True):
    hasVideo=True

class mplayer():
    def __init__(self, mfile, playlist, shuffle, video):
        global mplayerexists
        if (mplayerexists and mplayerexists.isalive()):
             mplayerexists.terminate()
        command='mplayer -quiet -really-quiet '
        if video: command += '-fs '
        if playlist : command +='-playlist '
        command += '"' + mfile + '"'
        if (shuffle and playlist) : command +=' -shuffle'        
        logging.info(command)
        print(command)
        self.player=pexpect.spawn(command, timeout=None, maxread=None)
        self.playing=True
        mplayerexists = self.player

    def setVolume(self, volume):
        if (not self.player.isalive()):
            return
        volume=int(volume)
        print('Setting volume to ' + str(volume))        
        logging.info('setting volume to %s', str(volume))
        i=0
        while i<15:
            i+=1
            self.player.send("9999")
        i=0
        while i < volume:
            i+=3
            self.player.send("0")

    def moveVolume(self, direction):
        if (not self.player.isalive()):
            return
        print('moving volume ' + direction)
        logging.info('moving volume %s', direction)
        i=0
        while i < 10:
            if (direction == "up"):
                self.player.send('0')
            else:
                self.player.send('9')
            i+=1
    def skip(self):
        if (not self.player.isalive()):
            return
        self.player.sendline('\n')

    def stop(self):
        if (not self.player.isalive()):
            return
        self.player.terminate()
    def pause(self):
        if (not self.player.isalive() or not self.playing):
            return
        self.playing=False
        self.player.send('p')
    def resume(self):
        if (not self.player.isalive() or self.playing):
            return
        self.playing=True
        self.player.send('p')
    def isalive(self):
        return self.player.isalive()

def process_event(event, assistant):
    """Pretty prints events.

    Prints all events that occur with two spaces between each new
    conversation and a single space between turns of a conversation.

    Args:
        event(event.Event): The current event to process.
    """
    if event.type == EventType.ON_CONVERSATION_TURN_STARTED:
        print()
        logging.info('Convo started')
        global isplaying
        if (isplaying and isplaying.player.isalive()):
            isplaying.pause()
        subprocess.call(["ogg123", config['greeting']])

    print(event)

    if (event.type == EventType.ON_CONVERSATION_TURN_FINISHED and
            event.args and not event.args['with_follow_on_turn']):
        print()
        logging.info('Convo finished')

    if (event.type == EventType.ON_RECOGNIZING_SPEECH_FINISHED):
        global isplaying
        if (isplaying and isplaying.isalive()):
            isplaying.resume()
        devices = {
                'thelights': ['energenieb_', 'energeniea_'],
                'allthelights': ['energenieb_', 'energeniea_'],
                'tv': 'infrabedroomTV',
                'thetv': 'infrabedroomTV',
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
                'bedlights': 'x10b_',
                'thebedlights': 'x10b_',
                'thekitchenlights': 'a_',
                'thekitchenlight': 'a_',
                'kitchenlights': 'a_',
                'theledstrip': 'a_',
                'sittingroomlamp': 'b_',
                'thesittingroomlamp': 'b_',
                'sittingroomlamps': 'b_',
                'thesittingroomlamps': 'b_',
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
                'theloungetv': 'infraloungeTV',
		'loungetv': 'infraloungeTV',
		'sittingroomtv': 'infrasittingRoomTV',
		'thesittingroomtv': 'infrasittingRoomTV',
		'theblurayplayer': 'infrabluray',
		'blurayplayer': 'infrabluray',
		'bedroomtv': 'infrabedroomTV',
		'thebedroomtv': 'infrabedroomTV'
            }
        global config
        for depdevice in config['devices']:
            devices[depdevice] = config['devices'][depdevice]
        print(event.args['text'])
        logging.info('Received %s', event.args['text'])
        returned = event.args['text'].split()
        if (len(returned) > 4 and "".join(returned[:2]) == "canyou"):
            returned = returned[2:]
            print(returned)



#DIRECT TURN ON STUFF
        if (len(returned) > 1 and (returned[0].lower() == 'turn' or returned[0].lower() == 'dim' or returned[0].lower() == 'brighten' )):
            action = returned[1].lower()
            objects = ["".join(returned[2:]).lower()]
            if (returned[0].lower() == 'dim' or returned[0].lower() == 'brighten'):
                action = 'on'
                objects = ["".join(returned[1:]).lower()]
            print(action)
            logging.info(action)
            print(objects)
            logging.info(objects)
            print(returned[2:])
            for word in ['and', 'on'] :
                if (word in returned[2:]) :
                    print(word + ' is here')
                    wordindex = returned[2:].index(word) + 2
                    print(wordindex)
                    objects = ["".join(returned[2:wordindex]).lower()]
                    print(objects)
                    if (returned[0].lower() == 'dim' or returned[0].lower() == 'brighten'):
                        objects = ["".join(returned[1:wordindex]).lower()]
                    print(objects)
                    objects.append("".join(returned[wordindex+1:]).lower())
                    print(objects)
            for object in objects:
                if (object in devices and (action == "on" or action == "off" or action =="up" or action == "down")):
                    assistant.stop_conversation()
                    device = devices[object]                
                    house = "1"
                    if (isinstance(device, list)):
                        for d in device:
                            subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", d + action ])
                    elif ('infra' in device):
                        if (action=="up" and 'tv' in object):
                            action="volumeup"
                        if (action=="down" and 'tv' in object):
                            action="volumedown"
                        subprocess.call(["python", "/home/pi/Assistant/sendir.py", device[5:], action])
                    else:
                        subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", device + action ])
                    print(returned[0])
                    print(device)
                    if (returned[0] == 'dim' and 'x10' in device):
                        print('dimming')
                        time.sleep(0.05)
                        subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", 'x10dim' ])
                    if (returned[0] == 'brighten' and 'x10' in device):
                        time.sleep(0.05)
                        subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", 'x10bright' ])


#SYSTEM COMMANDS
        if (len(returned) > 0 and (returned[0].lower() == 'reboot' or returned[0].lower() == 'restart')):           
            logging.info('system restart')
            subprocess.call(["sudo", "shutdown", "-r", "now"])
        if (len(returned) > 0 and (returned[0].lower() == 'shutdown' or (len(returned) > 1 and returned[0].lower() + returned[1].lower() == 'shutdown'))):
            logging.info('system shutdown')
            subprocess.call(["sudo", "shutdown", "-h", "now"])


#LED COMMANDS
        if (len(returned) > 1 and ("".join(returned[:2]).lower() == 'createa' or returned[0].lower() == 'create')):
            print(returned[2:])
            logging.info('create a %s', returned[2:])
            try:
                r = requests.post("http://192.168.0.176", data={'colour': "".join(returned[2:]).lower()})
            except requests.exceptions.RequestException as e:
                print(e)
            assistant.stop_conversation()            



#INFRARED COMMANDS
        if (len(returned) > 1 and ("".join(returned[:2]).lower() == 'makethe' or returned[0].lower() == 'make')):
            action = returned[len(returned) -1].lower()
            device = "".join(returned[2:len(returned) -1]).lower()
            if device == 'tv' : device = 'thetv'
            logging.info('infra red command to %s - %s', device, action)
            print(action)
            print(device)
            if (device in devices):
                device = devices[device]
                subprocess.call(["python", "/home/pi/Assistant/sendir.py", device[5:], action])
                assistant.stop_conversation()
        if (len(returned) >3 and returned[0].lower() == 'press' and 'on' in returned):
            action="".join(returned[1:returned.index('on')]).lower()
            device="".join(returned[returned.index('on'):]).lower()
            if (device in devices):
	        device=devices[device]
                subprocess.call(["python", "/home/pi/Assistant/sendir.py", device[5:], action])
                assistant.stop_conversation()


#Media CONTROL
        if (len(returned) > 0 and returned[0] == 'skip'):
            assistant.stop_conversation()
            global isplaying
            isplaying.skip()
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
            logging.info(command)
            print('PLAYLIST lookup %s', command)
            results = subprocess.check_output(command)
            results = results.decode(sys.stdout.encoding).split("\n")
            logging.info(results)
            print('PLAYLIST lookup %s', results)
            for mfile in results:
                if ('m3u' in mfile or 'pls' in mfile or 'asx' in mfile):
                    global isplaying
                    if ('shuffle' in returned or 'Shuffle' in returned):
                        isplaying=mplayer(mfile, True, True, False)
                    else:
                        isplaying=mplayer(mfile, True, False, False)
                    break

        if (len(returned) > 1 and returned[0].lower() == 'play'):
            global hasVideo
            assistant.stop_conversation()
            path='/music'
            search = returned[1:]
            if (hasVideo and returned[1].lower() == 'video'):
                search = returned[2:]
                path = '/videos'
            logging.info('SONG lookup %s', search)
            print(search)
            command = []
            command.append("/usr/bin/find")
            command.append(path)
            command.append("-path")
            command.append("/music/trashbox")
            command.append("-prune")
            command.append("-o")
            command.append("-type")
            command.append("f")
            for word in search:
                if (word.lower() == "the" or word.lower() == "it" or word.lower() == "a" or word.lower() == 'by'):
                    continue
                if (word != returned[1]):
                    command.append("-a")
                command.append("-iwholename")
                command.append("*" + word + "*")
            command.append("-print")
            logging.info('SONG lookup %s', command)
            print(command)
            results = subprocess.check_output(command)
            results = results.decode(sys.stdout.encoding).split("\n")
            logging.info('SONG lookup %s', results)
            print(results)
            for mfile in results:
                if ('flac' in mfile or 'mp3' in mfile or 'wma' in mfile):
                    global isplaying
                    isplaying=mplayer(mfile, False, False, False)
                    break
                if ('wmv' in mfile or 'avi' in mfile or 'mkv' in mfile or 'mp4' in mfile):
                    global isplaying
                    isplaying=mplayer(mfile, False, False, True)
                    break
        if (len(returned) > 0 and (returned[0].lower() == 'end' or "".join(returned[:2]).lower() == 'stopmusic' or "".join(returned[:3]).lower() == 'stopthemusic')):
            logging.info('stop music')
            assistant.stop_conversation()
            global isplaying
            isplaying.stop()
        if (len(returned) > 1 and returned[0].lower() == 'volume'):
            logging.info('set volume %s', returned[1])
            subprocess.call(['amixer', 'sset', 'PCM,0', returned[1]])
        if (len(returned) > 1 and returned[0].lower() == 'music' and returned[1].lower() == 'volume'):
            assistant.stop_conversation()
            logging.info('music volume %s', returned[2])
            global isplaying
            if (returned[2] == 'up'):
                isplaying.moveVolume('up')
            elif (returned[2] == 'down'):
                isplaying.moveVolume('down')
            elif (isInt(returned[2])):
                isplaying.setVolume(returned[2])
        if (len(returned) > 0 and returned[0].lower() == 'pause'):
            assistant.stop_conversation()
            logging.info('pause')
            global isplaying
            isplaying.pause()
        if (len(returned) > 0 and returned[0].lower() == 'resume'):
            assistant.stop_conversation()
            logging.info('resume')
            global isplaying
            isplaying.resume()
def isInt(i):
    try:
        int(i)
        return True
    except ValueError:
        return False

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
