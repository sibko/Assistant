#!/bin/bash
hosts=$(cat /home/sibko/Assistant/config.json | jq '.devices'  | jq '.[] | select(.name | contains("Assistant")) | select(.type | contains("rPI")) | .ip' | tr -d \" )
for host in $hosts; do
	echo "updating $host"
	echo "sudo /home/pi/Assistant/fetchAndApply.sh" | ssh pi@$host
done
