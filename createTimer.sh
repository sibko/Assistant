#!/bin/bash
if [ ! -d "/home/pi/timers" ]; then
        mkdir /home/pi/timers
fi
device=$1
action=$2
date=$3
type=$4
echo "$device:$action:$type" > /home/pi/timers/$date
