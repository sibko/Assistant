#!/bin/bash

cd /home/pi/Assistant
git pull
echo "$(date) PULLED LATEST CHANGES" >> /home/pi/assLogs.log
pkill -f __main
[ "$(hostname)" == "bedroomAssistant" ] && service DeviceList restart
