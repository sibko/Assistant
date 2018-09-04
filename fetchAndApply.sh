#!/bin/bash

cd /home/pi/Assistant
git pull
echo "$(date) PULLED LATEST CHANGES" >> /home/pi/assLogs.log
cp ./assistant.service /etc/systemd/system/assistant.service
echo "copied"
systemctl daemon-reload
echo "reloaded"
service assistant restart
echo "restarted"
[ "$(hostname)" == "bedroomAssistant" ] && service DeviceList restart
