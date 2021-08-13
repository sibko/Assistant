#!/bin/bash
auxID=$(cat /proc/asound/modules | grep bcm2835 | cut -d ' ' -f 2)
currentID=$(cat /etc/asound.conf | grep "pcm.speaker" -A 3| tail -n 1 | cut -d ':' -f 2 | cut -d '"' -f 1)
if [[ "$auxID" == "" ]]; then 
	exit
fi
if [[ "$auxID,0" != "$currentID" ]] ; then
	sed "s/$currentID/111,0/g; s/$auxID,0/$currentID/g; s/111,0/$auxID,0/g" /etc/asound.conf -i
fi
