#!/bin/bash

cd /home/pi/Assistant
git pull
pkill -f __main
[ "$(hostname)" == "bedroomAssistant" ] && service DeviceList restart
