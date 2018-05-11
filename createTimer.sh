#!/bin/bash
if [ ! -d "/home/pi/timers" ]; then
        mkdir /home/pi/timers
fi
device=$1
date=$2
echo $device > /home/pi/timers/$date
