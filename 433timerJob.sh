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
         	while [  $COUNTER -lt 5 ]; do
			 	if [ "$type" == "infrared" ]; then
					python /home/pi/Assistant/sendir.py $device $action
					break
				fi
				if [ "$type" == "energenie" ] || [ "$type" == "x10" ] || [ "$type" == "generic" ]; then
         			python /home/pi/Assistant/Transmit433.py $device$action
				fi
			sleep 1
			let COUNTER=COUNTER+1
		done
		rm -f $file
	fi
done

