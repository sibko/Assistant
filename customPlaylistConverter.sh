#!/bin/bash

for file in $(ls /music/playlists/*.m3u); do
	echo $file
	sed -i 's/\\/\//g' $file
	sed -i 's/\/\/MICROSERVER\/RaidArray\/M/\/m/g' $file
done
