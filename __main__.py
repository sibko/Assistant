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
                'everything': ['energenieall_','x10a_', 'x10b_', 'x10c_', 'x10d_', 'all_'],
                'allthelights': ['energenieb_', 'energeniea_'],
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
                'TV': 'infrabedroomTV',
                'theTV': 'infrabedroomTV',
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
        if (len(returned) > 1 and (returned[0] == 'turn' or returned[0] == 'dim' or returned[0] == 'brighten' )):
            action = returned[1]
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
        if (len(returned) > 0 and (returned[0] == 'reboot' or returned[0] == 'restart')):            
            subprocess.call(["shutdown", "-r", "now"])
        if (len(returned) > 0 and (returned[0] == 'shutdown' or (len(returned) > 1 and returned[0] + returned[1] == 'shutdown'))):
            subprocess.call(["shutdown", "-h", "now"])
        if (len(returned) > 1 and ("".join(returned[:2]) == 'createa' or returned[0] == 'create')):
            print(returned[2])
            try:
                r = requests.post("http://192.168.0.176", data={'colour': returned[2]})
            except requests.exceptions.RequestException as e:
                print(e)
            assistant.stop_conversation()            
        if (len(returned) > 1 and ("".join(returned[:2]) == 'makethe' or returned[0] == 'make')):
            action = returned[len(returned) -1]
            device = "".join(returned[2:len(returned) -1])
            print(action)
            print(device)
            if (device in devices):
                device = devices[device]
                subprocess.call(["python", "/home/pi/Assistant/sendir.py", device[5:], action])
                assistant.stop_conversation()
        
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
