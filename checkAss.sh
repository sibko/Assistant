#!/bin/bash
a=$(pgrep -f "python /home/pi/Assistant/__main" | wc -l)
[ "a$a" == "a0" ] && /home/pi/Assistant/startGoogleAss.sh &
[ $a -gt 1 ] && $(pkill -f __main) && /home/pi/Assistant/startGoogleAss.sh &
