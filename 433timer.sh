#!/bin/bash
echo $@
for action in $@; do
	echo $action
	python /home/pi/Assistant/Transmit433.py $action
done
