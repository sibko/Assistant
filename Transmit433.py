import time
import sys
import RPi.GPIO as GPIO
import subprocess
import socket
import ast

a_on = '1000010111101111001100001'
a_off = '1000010111101111001100011'
b_on = '1000010111101111001100101'
b_off = '1000010111101111001100111'
c_on = '1000010111101111001101001'
c_off = '1000010111101111001101011'
d_on = '1000010111101111001110001'
d_off = '1000010111101111001110011'
e_on = '1000010111101101001110001'
e_off = '1000010111101101001110011'
all_on = '1000010111101111001111011'
all_off = '1000010111101111001111101'
waterfall_on = '1010101010001011001111111'
waterfall_off = '1010101010001011110011111'

energeniea_on = '1111111111111111111000001'
energeniea_off = '1111111111111111111000011'
energenieb_on = '1111111111111111111010001'
energenieb_off = '1111111111111111111010011'
energeniec_on = '1111111111111111111001001'
energeniec_off = '1111111111111111111001011'
energenied_on = '1111111111111111111011001'
energenied_off = '1111111111111111111011011'
energeniee_on = '1111111111111111110011001'
energeniee_off = '1111111111111111101011011'
energenief_on = '1111111111111111110000001'
energenief_off = '1111111111111111101000011'
energenieg_on = '1101111111111111111011001'
energenieg_off = '1101111111111111111011011'
energenieall_on = '1111111111111111111000101'
energenieall_off = '1111111111111111111000111'
energenieshorton_delay = 0.00024
energenieshortoff_delay = 0.00055
energenielongon_delay = 0.00072
energenielongoff_delay = 0.00012
energenieextended_delay = 0.00642

x10a_on = '1233222223223333322222222333333333'
x10a_off = '1233222223223333322322222332333333'
x10b_on = '1233222223223333322232222333233333'
x10b_off = '1233222223223333322332222332233333'
x10c_on = '1233222223223333322223222333323333'
x10c_off = '1233222223223333322323222332323333'
x10d_on = '1233222223223333322233222333223333'
x10d_off = '1233222223223333322333222332223333'
x10dim = '1233222223223333332233222233223333'
x10bright = '1233222223223333332223222233323333'
x10short_delay = 0.00055
x10long_delay = 0.00170
x10bigon = 0.00950
x10bigoff = 0.00500
x10extended_delay = 0.03085 - x10long_delay

short_delay = 0.00032
long_delay = 0.00090
extended_delay = 0.0096
waterfall_sdelay = 0.00035
waterfall_ldelay = 0.00115
waterfall_edelay = 0.01171
TRANSMIT_PIN = 24

def transmit_code(code, argument):
    '''Transmit a chosen code string using the GPIO transmitter'''
    sdelay=short_delay
    ldelay=long_delay
    edelay=extended_delay
    if 'waterfall' in argument:
        print('here')
        sdelay=waterfall_sdelay
        ldelay=waterfall_ldelay
        edelay=waterfall_edelay
    print(str(sdelay))
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(TRANSMIT_PIN, GPIO.OUT)
    NUM_ATTEMPTS = 10
    if ('x10dim' in argument or 'x10bright' in argument):
        NUM_ATTEMPTS=25
    for t in range(NUM_ATTEMPTS):
        if 'energenie' in argument:
            edelay=energenieextended_delay
            ldelay=energenieshortoff_delay
            for i in code:
                    if i == '1':
                        GPIO.output(TRANSMIT_PIN, 1)
                        time.sleep(energenieshorton_delay)
                        GPIO.output(TRANSMIT_PIN, 0)
                        time.sleep(energenieshortoff_delay)
                    elif i == '0':
                        GPIO.output(TRANSMIT_PIN, 1)
                        time.sleep(energenielongon_delay)
                        GPIO.output(TRANSMIT_PIN, 0)
                        time.sleep(energenielongoff_delay)
                    else:
                        continue
        elif 'x10' in argument:
            edelay=x10extended_delay
            ldelay=x10long_delay
            for i in code:
                if i == '1':
                    GPIO.output(TRANSMIT_PIN, 1)
                    time.sleep(x10bigon)
                    GPIO.output(TRANSMIT_PIN, 0)
                    time.sleep(x10bigoff)
                elif i == '2':
                    GPIO.output(TRANSMIT_PIN, 1)
                    time.sleep(x10short_delay)
                    GPIO.output(TRANSMIT_PIN, 0)
                    time.sleep(x10short_delay)
                elif i == '3':
                    GPIO.output(TRANSMIT_PIN, 1)
                    time.sleep(x10short_delay)
                    GPIO.output(TRANSMIT_PIN, 0)
                    time.sleep(x10long_delay)
                else:
                    continue
        else:
            for i in code:
                if i == '1':
                    GPIO.output(TRANSMIT_PIN, 1)                
                    time.sleep(sdelay)
                    GPIO.output(TRANSMIT_PIN, 0)
                    time.sleep(ldelay)
                elif i == '0':
                    GPIO.output(TRANSMIT_PIN, 1)
                    time.sleep(ldelay)
                    GPIO.output(TRANSMIT_PIN, 0)
                    time.sleep(sdelay)
                else:
                    continue
        GPIO.output(TRANSMIT_PIN, 0)
        time.sleep(edelay - ldelay)
    GPIO.cleanup()

if __name__ == '__main__':
    
    for argument in sys.argv[1:]:
        if ('x10' in argument and socket.gethostname() == 'bedroompi'):
            print("sending to other pi")
            subprocess.call(['/home/pi/sendelsewhere.sh', argument])
        try:
            exec('transmit_code(' + str(argument) + ', argument)')
        except:
            print("not found")
            devicesfile = open("/home/pi/Assistant/devices.conf", "r")
            devices = ast.literal_eval(devicesfile.read())
            print(devices)
            dev=argument.split('_')[0]
            print(dev)
            if ( dev in devices ):
                action=devices[dev] + argument.split("_")[1]
                exec('transmit_code(' + str(action) + ', argument)')
            

