#!/bin/bash
echo "$(date) STARTING UP ASSISTANT" >> /home/pi/assLogs.log
source /home/pi/env/bin/activate >> /home/pi/assLogs.log 2>&1
/home/pi/Assistant/__main__.py >> /home/pi/assLogs.log 2>&1
