#!/bin/bash
for orig in $(ls); do
        echo $orig
	echo ${orig:4}
	mv $orig ${orig:4}
done

