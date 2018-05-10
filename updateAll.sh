#!/bin/bash
for host in "loungeAssistant" "bedroomAssistant" "kitchenAssistant" "sittingRoomAssistant"; do
	echo "sudo /home/pi/Assistant/fetchAndApply.sh" | ssh pi@$host
done
