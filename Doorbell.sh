#!/bin/bash


file=$(cat /mnt/bigfucker/Music/Doorbell/index)
if [ ! -f /mnt/bigfucker/Music/Doorbell/$file.mp3 ] ; then
	file=0
fi
hosts=("164" "165" "167" "155" "160")
for host in ${hosts[@]}; do
		/usr/bin/curl http://192.168.0.$host:1912/api/doorbell/ -d "file=$file.mp3" &
done

echo "$((file + 1))"> /mnt/bigfucker/Music/Doorbell/index
