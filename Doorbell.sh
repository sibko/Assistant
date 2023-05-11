#!/bin/bash


file=$(cat /music/Doorbell/index)
if [ ! -f /music/Doorbell/$file.mp3 ] ; then
	file=0
fi
hosts=("23" "101" "187" "189")
for host in ${hosts[@]}; do
	/usr/bin/curl http://192.168.0.$host:1967/api/play/ -d "file=/music/Doorbell/$file.mp3" &
done
echo "$((file + 1))"> /music/Doorbell/index
