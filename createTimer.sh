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
days=$5
time=$6
while [ -f "$dir/timers/$time$date" ]; do
	date=$((date + 1))
done
echo "$device:$action:$type:$days:7" > $dir/timers/$time$date
