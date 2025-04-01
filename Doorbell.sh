#!/bin/bash


file=$(cat /music/Doorbell/index)
if [ ! -f /music/Doorbell/$file.mp3 ] ; then
	file=0
fi
hosts=("23" "156" "157" "155" "160")
for host in ${hosts[@]}; do
		/usr/bin/curl http://192.168.0.$host:1912/api/doorbell/ -d "file=$file.mp3" &
done

echo "$((file + 1))"> /music/Doorbell/index
