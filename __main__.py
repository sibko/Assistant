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
sys.path.append('/home/pi/env/lib/python3.5/site-packages')
sys.path.append('/home/pi/.local/lib/python2.7/site-packages/')
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
import socket
import string

from google.assistant.library import Assistant
from google.assistant.library.event import EventType
from google.assistant.library.file_helpers import existing_file

import zerorpc

c = zerorpc.Client()
c.connect("tcp://127.0.0.1:4242")
print("start")
global isplaying
isplaying=False
mplayerexists=False

conffile = open("/home/pi/Assistant/config.json", "r")
config = json.load(conffile)
localConfig = config["assistants"][socket.gethostname()]
devices = config["devices"]
for localDevice in localConfig['devices']:
            for localDeviceName in localConfig['devices'][localDevice]:
                for dev in devices:
                    if (dev['name'] == localDeviceName):
                        dev['aliases'].append(localDevice)


logging.basicConfig(filename='/home/pi/assLogs.log', level=logging.DEBUG, format='%(asctime)s %(levelname)-8s %(message)s')
hasVideo=False
if ('hasVideo' in config and config['hasVideo'] == True):
    hasVideo=True
log=open("/home/pi/assLogs.log", "a")
logging.info(devices)
class mplayer():
    def play(self, mfile):
        print(c.play(mfile))
    def setVolume(self, volume):
        print(c.setvolume(volume))
    def moveVolume(self, direction):
        print(c.volume(direction))
    def skip(self):
        print(c.skip())
    def stop(self):
        print(c.stop())
    def pause(self, assistant):
        print(c.pause(assistant))
    def resume(self, assistant):
        print(c.pause(assistant))
    def shuffle(self, mfile):
        print(c.shuffle(mfile))
    def isalive(self):
        alive = c.isalive()
        print("alive: ")
        print(alive)
        return alive

def getDevice(dev):
    logging.info(dev)
    print("finding " + dev)
    for device in devices:
        if (device['name'].replace(" ", "").lower() == dev.replace(" ", "").lower()):
            return device
        for alias in device['aliases']:
            if (alias.replace(" ", "").lower() == dev.replace(" ", "").lower()):
                return device
    print('DEVICE NOT FOUND ' + dev)
    return ""

def doAction(device, action):
    logging.info('DOACTION')
    logging.info(device)
    logging.info(action)
    print('device: ' + device + ' ACTION: ' + action)
    subprocess.call(["node", "/home/pi/Assistant/DoAction.js", device, action], stdout=log, stderr=subprocess.STDOUT)



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
        if (isplaying and isplaying.isalive()):
            isplaying.pause(True)
        playMessage(localConfig['greeting'])

    print(event)

    if (event.type == EventType.ON_CONVERSATION_TURN_FINISHED and
            event.args and not event.args['with_follow_on_turn']):
        print()
        logging.info('Convo finished')
    if (event.type == EventType.ON_ALERT_STARTED):
        if (isplaying and isplaying.isalive()):
            isplaying.pause(True)
    if (event.type == EventType.ON_ALERT_FINISHED):
        if (isplaying and isplaying.isalive()):
            isplaying.resume(True)
    if (event.type == EventType.ON_RECOGNIZING_SPEECH_FINISHED):
        if (isplaying and isplaying.isalive()):
            isplaying.resume(True)
        global devices
        global config
        global log
        
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
            #x10 bright/dim doesnt specify device, just uses the last device the controller operated so turn it on first
            if (returned[0].lower() == 'dim' or returned[0].lower() == 'brighten'):
                 action = returned[0].lower()
                 objects = ["".join(returned[1:]).lower()]
            if (action=='brighten'):
                 action = 'bright'
            print(action)
            logging.info(action)
            print(objects)
            logging.info(objects)
            print(returned[2:])
            
            #create array of devices if and (sometimes heard as on) exists
            for word in ['and', 'on'] :
                if (word in returned[2:]) :
                    wordindex = returned[2:].index(word) + 2
                    objects = ["".join(returned[2:wordindex]).lower()]
                    if (returned[0].lower() == 'dim' or returned[0].lower() == 'brighten'):
                        objects = ["".join(returned[1:wordindex]).lower()]
                    objects.append("".join(returned[wordindex+1:]).lower())
                    print(objects)
            for object in objects:
                device = getDevice(object)
                if (device != "" and (action == "on" or action == "off" or action =="up" or action == "down" or action == "dim" or action == "bright")):
                    assistant.stop_conversation()
                    if (device['type'] == 'infrared'):
                        if (action=="up" and 'tv' in object):
                            action="volumeup"
                        if (action=="down" and 'tv' in object):
                            action="volumedown"
                        doAction(device['name'], action)
                    #everything else
                    else:
                        doAction(device['name'], action)
                    
                    #handle x10 dimming now we've set the controller to use that device   
                    #if (returned[0] == 'dim' and device['type'] == 'x10'):
                    #    print('dimming')
                    #    time.sleep(0.05)
                    #    doAction(device['name'], 'dim')
                    #if (returned[0] == 'brighten' and device['type'] == 'x10'):
                    #    time.sleep(0.05)
                    #    doAction(device['name'], 'bright')


#SYSTEM COMMANDS
        if (len(returned) > 0 and (returned[0].lower() == 'reboot' or returned[0].lower() == 'restart')):                
            assistant.stop_conversation()
            logging.info('system restart')
            subprocess.call(["sudo", "shutdown", "-r", "now"])
        if (len(returned) > 0 and (returned[0].lower() == 'shutdown' or (len(returned) > 1 and returned[0].lower() + returned[1].lower() == 'shutdown'))):
            assistant.stop_conversation()
            logging.info('system shutdown')
            subprocess.call(["sudo", "shutdown", "-h", "now"])
        

#LED COMMANDS
        if (len(returned) > 1 and ("".join(returned[:2]).lower() == 'createa' or returned[0].lower() == 'create')):
            assistant.stop_conversation()
            logging.info('create a %s', returned[2:])
            if ("".join(returned).lower() == "createacinema"):
                print('creating a cinema')
                logging.info('creating a cinema')
                doAction('theceiling', 'on')
                time.sleep(0.50)
                doAction('theloungelights', 'off')
                doAction('thefridge', 'off')
                createTimer('thefridge', 'on', int(str(time.time()).split('.')[0]) + 7200)
                time.sleep(4.00)
            try:
                r = requests.post("http://192.168.0.176", data={'colour': "".join(returned[2:]).lower()})
            except requests.exceptions.RequestException as e:
                print(e)


#CAT COMMANDS
        if (len(returned) > 1 and returned[0] == 'where'):
            assistant.stop_conversation()
            if ("".join(returned[:2]).lower() == 'whereis'):
                cat = returned[len(returned) -1].lower()     
                try:
                    subprocess.call(["node", "/home/pi/Assistant/DoAction.js", "catflap", cat],stdout=log, stderr=subprocess.STDOUT)
                except subprocess.CalledProcessError as e:
                    logging.info("error with catflap process")    
            elif ("".join(returned[:4]).lower() == 'wherearethecats'):
                try:
                    subprocess.call(["node", "/home/pi/Assistant/DoAction.js", "catflap", "all"],stdout=log, stderr=subprocess.STDOUT)
                except subprocess.CalledProcessError as e:
                    logging.info("error with catflap process")

#INFRARED COMMANDS
        if (len(returned) > 1 and ("".join(returned[:2]).lower() == 'makethe' or returned[0].lower() == 'make')):
            action = returned[len(returned) -1].lower()
            device = "".join(returned[2:len(returned) -1]).lower()
            if device == 'tv' : device = 'thetv'
            logging.info('infra red command to %s - %s', device, action)
            print(action)
            print(device)
            device = getDevice(device)
            if (device != ""):            
                doAction(device['name'], action)
                assistant.stop_conversation()
        actions = [ 'volume', 'source', 'hdmi', 'mute', 'exit', 'return', 'enter']
        if (len(returned) >3 and ( returned[0].lower() in actions or returned[0].lower() in [ 'press', 'push', 'mash', 'set', 'hit' ]) and 'on' in returned):
            action=returned[1:returned.index('on')]
            if (returned[0].lower() in actions):
                action=returned[0:returned.index('on')]
            i=0
            then=0
            while ('then' in action):
                now=action.index('then')
                action[i] = "".join(action[then:now]).lower()
                then = now
                del action[then]
                i+=1
            if (not 'then' in action):
                action[i] = "".join(action[then:]).lower()
                i+=1
            action=action[0:i]
            device="".join(returned[returned.index('on')+1:]).lower()
            times=1
            if (returned[len(returned)-1] == 'times'):
                if(isInt(returned[len(returned)-2])):
                    device="".join(returned[returned.index('on')+1:len(returned)-2]).lower()
                    if (returned[len(returned)-2].lower() == 'two'): 
                        times=2
                    elif (returned[len(returned)-2].lower() == 'three'):
                        times=3
                    elif (returned[len(returned)-2].lower() == 'four'):
                        times=4
                    elif (returned[len(returned)-2].lower() == 'five'):
                        times=5
                    else:
                        times=int(returned[len(returned)-2])
            print(action)
            print(device)
            device = getDevice(device)            
            if (device != ""):
                assistant.stop_conversation()
                for act in action:
                    n=0
                    while(n < times):
                        logging.info('SENDIR %s %s', device['name'], act)
                        doAction(device['name'], act)
                        n+=1
        if (len(returned) > 1 and ("".join(returned).lower() == 'changethecolorlight')):
            assistant.stop_conversation()
            doAction('colorlight', 'flash')
#Cat Control 
        print(returned)
        if (len(returned) > 0 and (((returned[0].lower() == 'fetch' or returned[0].lower() == 'best' or returned[0].lower() == 'bring' or returned[0].lower() == 'batch' ) and returned[1].lower() == 'charlie') or (len(returned) == 1 and returned[0].lower() == 'charlie'))):
            assistant.stop_conversation()
            playMessage('/home/pi/Whistle.m4a')

#Media CONTROL
        if (len(returned) > 0 and returned[0] == 'skip'):
            assistant.stop_conversation()
            isplaying.skip()
        if (len(returned) > 2 and ("".join(returned[:2]).lower() == 'startplaylist' or "".join(returned[:2]).lower() == 'stopplaylist' or "".join(returned[:3]).lower() == 'startplaylist' or "".join(returned[:2]).lower() == 'startthrillist' or "".join(returned[:2]).lower() == 'stopthrillist' or "".join(returned[:1]).lower() == 'setlist'  or "".join(returned[:3]).lower() == 'startthelist' or "".join(returned[:3]).lower() == 'stopthelist')):
            assistant.stop_conversation()
            locatecommand=[]
            locatecommand.append("locate")
            locatecommand.append("-i")
            locatecommand.append("/music/*" + returned[2] + "*")
            logging.info(locatecommand)
            results=[]
            try:
                results=subprocess.check_output(locatecommand)
                results=results.decode(sys.stdout.encoding).split("\n")
            except subprocess.CalledProcessError as e:
                logging.info("nothing found")
            logging.info(results)
            print('PLAYLIST lookup %s', results)
            shuffle=False
            print("".join(returned[len(returned)-1:]).lower())
            if ('shuffle' == "".join(returned[len(returned)-1:]).lower()):
                print('got shuffle')
                shuffle=True
                returned = returned[:len(returned)-1]
                print(returned)
            for mfile in results:
                gotamatch=False
                for word in returned[2:]:
                    if (word.lower() in mfile.lower()):
                        gotamatch=True
                    else:
                        gotamatch=False
                        break
                if (gotamatch and ('m3u' == mfile[len(mfile)-3:] or 'pls' == mfile[len(mfile)-3:] or 'asx' == mfile[len(mfile)-3:])): 
                    if (shuffle == True):
                        isplaying=mplayer()
                        isplaying.shuffle(mfile)
                    else:
                        isplaying=mplayer()
                        isplaying.play(mfile)
                    break

        if (len(returned) > 1 and returned[0].lower() == 'play'):
            assistant.stop_conversation()
            path='/music/'
            search = returned[1:]
            if (hasVideo and returned[1].lower() == 'video'):
                search = returned[2:]
                path = '/videos/'
            logging.info('SONG lookup %s', search)
            print(search)
            locatecommand=[]
            locatecommand.append("locate")
            locatecommand.append("-i")
            locatecommand.append(path + "*" + returned[1] + "*")
            logging.info(locatecommand)
            print(locatecommand)
            results=[]
            try:
                results = subprocess.check_output(locatecommand)
                results = results.decode(sys.stdout.encoding).split("\n")
            except subprocess.CalledProcessError as e:
                logging.info("nothing found")
            logging.info('SONG lookup %s', results)
            print(results)

            for mfile in results:
                gotamatch=False
                for word in returned[1:]:
                    if (word.lower() in mfile.lower()):
                        gotamatch=True
                    else:
                        gotamatch=False
                        break
                if (gotamatch):
                    if ('flac' == mfile[len(mfile)-4:] or 'mp3' == mfile[len(mfile)-3:] or 'wma' == mfile[len(mfile)-3:] or 'm4a' == mfile[len(mfile)-3:]):

                        isplaying=mplayer()
                        isplaying.play(mfile)
                        break
                    if ('wmv' == mfile[len(mfile)-3:] or 'avi' == mfile[len(mfile)-3:] or 'mkv' == mfile[len(mfile)-3:] or 'mp4' == mfile[len(mfile)-3:]):
                        isplaying=mplayer()
                        isplaying.play(mfile)
                        break

        if (len(returned) > 0 and (returned[0].lower() == 'end' or "".join(returned[:2]).lower() == 'stopmusic' or "".join(returned[:3]).lower() == 'stopthemusic')):
            logging.info('stop music')
            assistant.stop_conversation()
            isplaying.stop()
        if (len(returned) > 1 and returned[0].lower() == 'volume'):
            assistant.stop_conversation()
            logging.info('set volume %s', returned[1])
            subprocess.call(['amixer', 'sset', 'PCM,0', returned[1]])
        if (len(returned) > 1 and returned[0].lower() == 'music' and returned[1].lower() == 'volume'):
            assistant.stop_conversation()
            logging.info('music volume %s', returned[2])
            if (returned[2] == 'up'):
                isplaying.moveVolume('up')
            elif (returned[2] == 'down'):
                isplaying.moveVolume('down')
            elif (isInt(returned[2])):
                isplaying.setVolume(returned[2])
        if (len(returned) > 0 and returned[0].lower() == 'pause'):
            assistant.stop_conversation()
            logging.info('pause')
            isplaying.pause(False)
        if (len(returned) > 0 and returned[0].lower() == 'resume'):
            assistant.stop_conversation()
            logging.info('resume')
            isplaying.resume(False)

def createTimer(device, action, date):
    subprocess.call(["/home/pi/Assistant/createTimer.sh", device, action, str(date), "x10" ], stdout=log, stderr=subprocess.STDOUT)

def playMessage(afile):
    print(afile[len(afile)-4:])
    if (afile[len(afile)-4:] == '.mp3'):
        subprocess.call(["mplayer", '-quiet', '-really-quiet', afile],stdout=log, stderr=subprocess.STDOUT)
    elif (afile[len(afile)-4:] == '.ogg'):
        subprocess.call(["ogg123", afile],stdout=log, stderr=subprocess.STDOUT)
    else:
        subprocess.call(["mplayer", afile],stdout=log, stderr=subprocess.STDOUT)

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
        credentials = google.oauth2.credentials.Credentials(token=None,**json.load(f))
        global config
    with Assistant(credentials, localConfig['device_id']) as assistant:
        for event in assistant.start():
            process_event(event, assistant)


if __name__ == '__main__':
    main()
#!/usr/bin/env python

# Copyright (C) 2017 Google Inc.
