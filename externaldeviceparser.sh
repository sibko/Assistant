#!/bin/bash
device=$1
action=$2
plug=$(jq -r .$device /home/pi/Assistant/devices.conf)
echo $plug
python /home/pi/Assistant/Transmit433.py $plug$action
