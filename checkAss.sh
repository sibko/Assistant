#!/bin/bash
a=$(pgrep goog | wc -l)
[ "a$a" == "a0" ] && /home/pi/Assistant/startGoogleAss.sh &
[ $a -gt 1 ] && $(pkill goog) && /home/pi/Assistant/startGoogleAss.sh &
