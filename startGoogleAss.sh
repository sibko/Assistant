#!/bin/bash
source /home/pi/env/bin/activate >> /home/pi/assLogs 2>&1
/home/pi/Assistant/__main__.py >> /home/pi/assLogs 2>&1
