import time
import sys
import RPi.GPIO as GPIO
import subprocess
import socket
import ast
import json

def transmit_code(transmitPin, attempts, code, shortOnDelay, shortOffDelay, longOnDelay, longOffDelay, extendedDelay, bigOn, bigOff, endDelay):
    '''Transmit a chosen code string using the GPIO transmitter'''
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(transmitPin, GPIO.OUT)
    for t in range(attempts):
        for i in code:
            if i == '0':
                GPIO.output(transmitPin, 1)
                time.sleep(longOnDelay)
                GPIO.output(transmitPin, 0)
                time.sleep(longOffDelay)
            elif i == '1':                
                GPIO.output(transmitPin, 1)
                time.sleep(shortOnDelay)
                GPIO.output(transmitPin, 0)
                time.sleep(shortOffDelay)
            elif i == '2':
                GPIO.output(transmitPin, 1)
                time.sleep(bigOn)
                GPIO.output(transmitPin, 0)
                time.sleep(bigOff)
            elif i == '3':
                GPIO.output(transmitPin, 1)
                time.sleep(shortOnDelay)
                GPIO.output(transmitPin, 0)
                time.sleep(longOnDelay)
            elif i == '4':
                GPIO.output(transmitPin, 1)
                time.sleep(longOnDelay)
                GPIO.output(transmitPin, 0)
                time.sleep(shortOnDelay)
            else:
                continue        
        GPIO.output(transmitPin, 0)
        time.sleep(endDelay)
    GPIO.cleanup()

if __name__ == '__main__':
    configfile = open("/home/pi/Assistant/config.json", "r")
    config = json.load(configfile)
    transmitPin = config['plugs']['global']['transmitPin']    
    code = sys.argv[1]
    attempts = int(sys.argv[2])
    shortOnDelay = float(sys.argv[3])
    shortOffDelay = float(sys.argv[4])
    longOnDelay = float(sys.argv[5])
    longOffDelay = float(sys.argv[6])    
    bigOn = float(sys.argv[7])
    bigOff = float(sys.argv[8])
    extendedDelay = float(sys.argv[9])
    endDelay = float(sys.argv[10])
    transmit_code(transmitPin, attempts, code, shortOnDelay, shortOffDelay, longOnDelay, longOffDelay, extendedDelay, bigOn, bigOff, endDelay)
            

