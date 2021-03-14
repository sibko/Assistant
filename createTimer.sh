#!/bin/bash
dir='/home/pi'
if [ "$(hostname)" == "Microserver" ]; then
	dir='/home/sibko'
fi
if [ ! -d "$dir/timers" ]; then
        mkdir $dir/timers
fi
device=$1
action=$2
date=$3
type=$4
dayspreset=$5
timepreset=$6
days=$7
time=$8

while [ -f "$dir/timers/$timepreset$date" ]; do
	date=$((date + 1))
done
echo "$device:$action:$type:$dayspreset:8:$days:$time" > $dir/timers/$timepreset$date
