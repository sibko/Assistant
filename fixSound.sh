#!/bin/bash
piasound="/home/pi/.asoundrc"
rootasound="/etc/asound.conf"
auxID=$(cat /proc/asound/modules | grep bcm2835 | cut -d ' ' -f 2)
if [[ "$(hostname)" == "frontRoomAssistant" || "$(hostname)" == "sittingRoomAssistant" ]]; then
        auxID=$(aplay -l | grep "USB Audio" | cut -d ' ' -f 2 | cut -d ':' -f 1)
        speaker=$auxID
fi
currentID=$(cat $rootasound | grep "pcm.speaker" -A 3| tail -n 1 | cut -d ':' -f 2 | cut -d '"' -f 1)
if [[ "$auxID" == "" ]]; then
        exit
fi
if [[ "$auxID,0" != "$currentID" ]] ; then
        sed "s/$currentID/999,0/g; s/$auxID,0/$currentID/g; s/999,0/$auxID,0/g" $rootasound -i
fi

currentID=$(cat $piasound | grep "pcm.speaker" -A 3| tail -n 1 | cut -d ':' -f 2 | cut -d '"' -f 1)
if [[ "$auxID" == "" ]]; then
        exit
fi
if [[ "$auxID,0" != "$currentID" ]] ; then
        sed "s/$currentID/999,0/g; s/$auxID,0/$currentID/g; s/999,0/$auxID,0/g" $piasound -i
fi

auxID=$(cat /proc/asound/modules | grep snd_usb_audio | cut -d ' ' -f 2| head -n 1)
if [[ "$speaker" != "" ]]; then

        auxID=$(cat /proc/asound/modules | grep snd_usb_audio | cut -d ' ' -f 2| grep -v "$speaker" | head -n 1)
fi

currentID=$(cat $piasound | grep "pcm.mic" -A 3| tail -n 1 | cut -d ':' -f 2 | cut -d '"' -f 1)
if [[ "$auxID" == "" ]]; then
        exit
fi
if [[ "$auxID,0" != "$currentID" ]] ; then
        sed "s/$currentID/999,0/g; s/$auxID,0/$currentID/g; s/999,0/$auxID,0/g" $piasound -i
fi

auxID=$(cat /proc/asound/modules | grep snd_usb_audio | cut -d ' ' -f 2| tail -n 1)
if [[ "$speaker" != "" ]]; then
        auxID=$(cat /proc/asound/modules | grep snd_usb_audio | cut -d ' ' -f 2| grep -v "$speaker" | head -n 1)
fi
currentID=$(cat $rootasound | grep "pcm.mumblemic" -A 3| tail -n 1 | cut -d ':' -f 2 | cut -d '"' -f 1)
if [[ "$auxID" == "" ]]; then
        exit
fi
if [[ "$auxID,0" != "$currentID" ]] ; then
        sed "s/$currentID/999,0/g; s/$auxID,0/$currentID/g; s/999,0/$auxID,0/g" $rootasound -i
fi

