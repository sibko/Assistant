#!/bin/bash
for host in "loungeAssistant" "bedroomAssistant" "kitchenAssistant" "diningAssistant" "sittingRoomAssistant"; do
	echo "updating $host"
	echo "sudo /home/pi/Assistant/fetchAndApply.sh" | ssh pi@$host.local
done
