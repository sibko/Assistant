#!/bin/bash

cd /home/pi/Assistant
git pull
echo "$(date) PULLED LATEST CHANGES" >> /home/pi/assLogs.log
cp -f ./serviceFiles/assistant.service /etc/systemd/system/assistant.service
cp -f ./serviceFiles/mplayerServer.service /etc/systemd/system/mplayerServer.service
echo "copied"
systemctl daemon-reload
echo "reloaded"
service assistant restart
service mplayerServer restart
echo "restarted"
