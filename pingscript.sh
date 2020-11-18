ips=("192.168.0.2" "192.168.0.4" "192.168.0.180" "192.168.0.71")
for ip in ${ips[@]}; do
#	echo $ip
	ping -c 3 $ip;
done;
