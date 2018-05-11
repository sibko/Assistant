#!/bin/bash
if [ ! -d "/home/pi/timers" ]; then
	mkdir /home/pi/timers
fi
for file in /home/pi/timers/*; do
	date=$(echo $file | cut -d '/' -f 5)
	action=$(cat $file)
	echo $date $action
	if [ $date -lt $(date +%s) ]; then
		COUNTER=0
         	while [  $COUNTER -lt 5 ]; do
         		python /home/pi/Assistant/Transmit433.py $action
			sleep 1
			let COUNTER=COUNTER+1
		done
		rm -f $file
	fi
done

