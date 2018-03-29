#!/bin/bash

cd /home/pi/Assistant
git pull
cp -f __main__.py /home/pi/env/lib/python3.5/site-packages/google/assistant/
pkill goog
