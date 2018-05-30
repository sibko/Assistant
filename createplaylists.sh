#!/bin/bash


find "/music/" -type d -print0 | while IFS= read -r -d $'\0' line; do
	echo $line
	[[ $(ls "$line" | grep "m3u") || "$line" == "." ]] && continue
	echo "no m3u"
	album=$(echo $line | grep -Eo '[^/]+/?$' | cut -d / -f1 )
	echo $album
	find "$line" -maxdepth 1 -type f -iname "*.mp3" -print0 | sort | while IFS= read -r -d $'\0' file; do
		echo $file
		echo $file | sed 's#.*/##'# >> "$line/$album.m3u"
	done
	find "$line" -maxdepth 1 -type f -iname "*.flac" -print0 | sort | while IFS= read -r -d $'\0' file; do
	        echo $file
	        echo $file | sed 's#.*/##'# >> "$line/$album.m3u"
        done
done

