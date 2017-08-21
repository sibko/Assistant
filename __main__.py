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
        subprocess.call(["ogg123", "/home/pi/Downloads/r2d2_whisles002-notification_sound-1920809.ogg"])

    print(event)

    if (event.type == EventType.ON_CONVERSATION_TURN_FINISHED and
            event.args and not event.args['with_follow_on_turn']):
        print()

    if (event.type == EventType.ON_RECOGNIZING_SPEECH_FINISHED):
        print(event.args['text'])
        returned = event.args['text'].split()
        if (len(returned) > 4 and "".join(returned[:2]) == "canyou"):
            returned = returned[2:]
            print(returned)
        if (len(returned) > 1 and returned[0] == 'turn'):
            action = returned[1]
            object = "".join(returned[2:])
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
                'everything': 'energenieall_',
                'allthelights': ['energenieb_', 'energeniea_']
            }
            print(action)
            print(object)
            if (object in devices and (action == "on" or action == "off")):
                print(action)
                print(object)
                assistant.stop_conversation()
                device = devices[object]                
                house = "1"
                if (isinstance(device, list)):
                    for d in device:
                        subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", d + action ])
                else:
                    subprocess.call(["python", "/home/pi/Assistant/Transmit433.py", device + action ])
        if (len(returned) > 0 and (returned[0] == 'reboot' or returned[0] == 'restart')):            
            subprocess.call(["shutdown", "-r", "now"])
        if (len(returned) > 1 and ("".join(returned[:2]) == 'makea'or "".join(returned[:2]) == 'makethe' or returned[0] == 'make')):
            print(returned[2])
            r = requests.post("http://192.168.0.176", data={'colour': returned[2]})
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
