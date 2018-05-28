#!/bin/bash
if [ ! -d "/home/pi/timers" ]; then
	mkdir /home/pi/timers
fi
for file in /home/pi/timers/*; do
	date=$(echo $file | cut -d '/' -f 5)
	device=$(cat $file | cut -d ':' -f 1)
	action=$(cat $file | cut -d ':' -f 2)
	type=$(cat $file | cut -d ':' -f 3)
	echo $date $action
	if [ $date -lt $(date +%s) ]; then
		COUNTER=0
		repeat=1
		[ "$type" == "energenie" ] || [ "$type" == "x10" ] || [ "$type" == "generic" ] || [ "$type" == "twelvevolt" ] && repeat=5
         	while [  $COUNTER -lt $repeat ]; do
			 	node /home/pi/Assistant/DoAction.js "$device" "$action"
			sleep 1
			let COUNTER=COUNTER+1
		done
		rm -f $file
	fi
done

