#!/bin/bash
dir='/home/pi'
sunsetfile=/home/sibko/Assistant/sunriseSunset
if [ "$(hostname)" == "Microserver" ]; then
	dir='/home/sibko'
fi
if [ ! -d "$dir/timers" ]; then
	mkdir $dir/timers
fi
for file in $dir/timers/*; do
	date=$(echo $file | cut -d '/' -f 5)
	device=$(cat $file | cut -d ':' -f 1)
	action=$(cat $file | cut -d ':' -f 2)
	type=$(cat $file | cut -d ':' -f 3)
	echo $date $action
	if [ "${date:0:6}" == "sunset" ]; then
		days=$(cat $file | cut -d ':' -f 4)
		dayDone=$(cat $file | cut -d ':' -f 5)
		[[ "$dayDone" == "$(date +%u)" ]] && continue
		currentdate=$(date -d "$(date +%D)" +%s)
		sunset=$(cat $sunsetfile | jq ".z$currentdate.sunset" | cut -d '"' -f 2)
		if [ "$days" != "weekend" ] || {  [ "$(date +%u)" == "6" ] || [ "$(date +%u)" == "0" ]; } then
			if [ $(date +%s) -gt $sunset ]; then
				COUNTER=0
		                repeat=1
		                [ "$type" == "energenie" ] || [ "$type" == "x10" ] || [ "$type" == "generic" ] || [ "$type" == "twelvevolt" ] && repeat=5
		                while [  $COUNTER -lt $repeat ]; do
	                                node $dir/Assistant/DoAction.js "$device" "$action"
       					sleep 1
		                        let COUNTER=COUNTER+1
                		done
				echo "$(cat $file | cut -d ':' -f1,2,3,4):$(date +%u)" > $file
			fi		       
		fi	
	elif [ $date -lt $(date +%s) ]; then
		COUNTER=0
		repeat=1
		[ "$type" == "energenie" ] || [ "$type" == "x10" ] || [ "$type" == "generic" ] || [ "$type" == "twelvevolt" ] && repeat=5
         	while [  $COUNTER -lt $repeat ]; do
			 	node $dir/Assistant/DoAction.js "$device" "$action"
			sleep 1
			let COUNTER=COUNTER+1
		done
		rm -f $file
	fi
done

