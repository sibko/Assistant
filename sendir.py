import sys
import requests
import json
import subprocess

bedroomHost = "http://192.168.0.193"
kitchenHost = ""
loungeHost = ""
sittingRoomHost = ""

bedroomTV = {
    'host': bedroomHost,
    'on': "[{'type':'samsung','data':'E0E040BF','length':32,'repeat':1,'rdelay':800}]",
    'source': "[{'type':'samsung','data':'E0E0807F','length':32,'repeat':1,'rdelay':800}]",
    'mute': "[{'type':'samsung','data':'E0E0F00F','length':32,'repeat':1,'rdelay':800}]",
    'volumeup': "[{'type':'samsung','data':'E0E0E01F','length':32,'repeat':6,'rdelay':800}]",
    'volumedown': "[{'type':'samsung','data':'E0E0D02F','length':32,'repeat':6,'rdelay':800}]",
    'tools': "[{'type':'samsung','data':'E0E0D22D','length':32,'repeat':1,'rdelay':800}]",
    'up': "[{'type':'samsung','data':'E0E006F9','length':32,'repeat':1,'rdelay':800}]",
    'left': "[{'type':'samsung','data':'E0E0A659','length':32,'repeat':1,'rdelay':800}]",
    'right': "[{'type':'samsung','data':'E0E046B9','length':32,'repeat':1,'rdelay':800}]",
    'down': "[{'type':'samsung','data':'E0E08679','length':32,'repeat':1,'rdelay':800}]",
    'enter': "[{'type':'samsung','data':'E0E016E9','length':32,'repeat':1,'rdelay':800}]",
    'return': "[{'type':'samsung','data':'E0E01AE5','length':32,'repeat':1,'rdelay':800}]",
    'exit': "[{'type':'samsung','data':'E0E0B44B','length':32,'repeat':1,'rdelay':800}]"
}

aircon = {
    'host': bedroomHost,
    'on': "[{'data':[1300,450, 1250,450, 450,1300, 1250,450, 1250,450, 450,1300, 400,1350, 400,1350, 400,1350, 400,1350, 400,1350, 1250,7250, 1200,500, 1250,450, 400,1350, 1250,450, 1250,450, 400,1350, 400,1350, 400], 'type':'raw', 'khz':38, 'repeat':2}]",
    'up': "[{'data':[400,1350, 400,1350, 1200,500, 400,1350, 400,8100, 1250,500, 1250,500, 400,1350, 1200,500, 1250,500, 400,1350, 400,1350, 400,1350, 400,1350, 1200,500, 400,1350, 400,8100, 1200,550, 1200,550, 350,1400, 1200,550, 1200,550, 350,1400, 350,1400, 350,1400, 350,1400, 1200,550, 350,1400, 350,8100, 1200,550, 1200,550, 300,1400, 1150,550, 1150,600, 300,1450, 250,1450, 250,1500, 250,1500, 1100,700, 200,1550, 150], 'type':'raw', 'khz':38}]",
    'sleep': "[{'data':[1250,450, 1250,450, 400,1350, 400,1350, 400,1350, 1250,450, 400,1350, 400,1350, 400,8050, 1250,500, 1200,500, 400,1350, 1200,500, 1200,500, 400,1350, 400,1350, 400,1350, 1200,500, 400,1350, 400,1350, 400,8100, 1200,500, 1200,500, 400,1350, 1200,500, 1200,500, 400,1350, 400,1350, 400,1400, 1200,550, 350,1400, 350,1400, 350,8100, 1200,550, 1200,550, 350,1400, 1200,550, 1200,550, 350,1400, 350,1400, 350,1400, 1200,550, 350,1400, 300,1400, 300,8200, 1100,650, 1100,700, 200,1600, 950], 'type':'raw', 'khz':38}]",
    'evaporate': "[{'data':[450,1300, 450,8050, 1300,450, 1250,450, 450,1300, 1250,450, 1250,500, 400,1300, 400,1350, 1250,500, 400,1350, 400,1350, 400,1350, 400,8050, 1250,500, 1250,500, 400,1350, 1250,500, 1250,500, 400,1350, 400,1350, 1250,500, 400,1350, 400,1400, 350,1400, 350,8100, 1200,550, 1200,550, 350,1400, 1200,550, 1200,550, 350,1400, 350,1400, 1150,550, 350,1400, 300,1400, 300,1400, 300,8150, 1150,550, 1150,550, 300,1450, 1150,600, 1150,600, 300,1450, 250,1500, 1100,700, 200], 'type':'raw', 'khz':38}]",
    'rotate': "[{'data':[1350,450, 1300,400, 450,1300, 1300,450, 1250,500, 1300,400, 500,1250, 450,1300, 400,1300, 1250,450, 1250,450, 500,7950, 1350,450, 1300,450, 450,1250, 1350,450, 1300,450, 1300,450, 450,1250, 450,1300, 450,1250, 1300,450, 1300,450, 450,7950, 1350,450, 450], 'type':'raw', 'khz':38}]",
    'ion': "[{'data':[1200,500, 1200,500, 400,1400, 1200,550, 1200,550, 1200,550, 350,1400, 350,1400, 350,1400, 350,1400, 1200,550, 1200,7250, 1200,550, 1200,550, 350,1400, 1200,550, 1150,550, 1150,550, 300,1400, 300,1450, 300,1450, 250,1500, 1100,650, 1100], 'type':'raw', 'khz':38}]"
}

soundbar = {
    'host': bedroomHost,
    'on': "[{'data':[9100,4550, 550,650, 550,600, 600,600, 550,650, 550,600, 550,1750, 550,600, 600,600, 550,1750, 600,1750, 550,1750, 550,1750, 600,1750, 550,600, 600,1750, 550,1750, 550,650, 550,600, 550,1750, 550,1750, 550,650, 550,600, 600,600, 550,650, 550,1750, 550,1750, 600,600, 550,650, 550,1750, 550,1750, 600,1750, 550,1750, 550], 'type':'raw', 'khz':38}]",
    'bluetooth': "[{'data':[9100,4550, 550,650, 550,600, 600,600, 550,650, 550,600, 550,1750, 550,600, 600,600, 550,1750, 600,1750, 550,1750, 550,1750, 600,1750, 550,600, 600,1750, 550,1750, 550,1750, 550,1750, 550,1750, 550,1750, 550,600, 550,650, 550,600, 600,600, 550,650, 550,600, 600,600, 550,650, 550,1750, 550,1750, 600,1750, 550,1750, 550], 'type':'raw', 'khz':38}]",
    'line': "[{'data':'4FB50AF', 'type':'NEC', 'length':32}]",
    'aux' : "[{'data':[9150,4500, 550,650, 600,550, 550,600, 600,600, 550,600, 550,1750, 550,600, 550,600, 550,1750, 550,1750, 550,1750, 550,1750, 650,1700, 550,600, 550,1750, 550,1750, 600,600, 550,1750, 550,1750, 550,600, 550,1750, 600,550, 600,600, 550,600, 550,1750, 550,600, 550,600, 600,1700, 550,600, 550,1750, 550,1750, 550,1700, 600], 'type':'raw', 'khz':38}]"
}

bluray = {
    'host': loungeHost,
    'on': "[{data:[4500,4500,550,1750,550,1800,500,650,550,600,550,650,550,550,550,1800,500,700,550,1700,550,1800,550,550,550,600,550,1750,500,650,550,1750,550,600,550,1800,550,550,550,650,500,650,600,600,550,600,550,550,550,650,550,600,550,1750,550,1700,550,1750,550,1800,550,1700,550,1800,550,1700,550],type:raw,khz:38}]",
    'source': "[{'data':[4450,4600, 550,1750, 550,1750, 600,550, 500,650, 500,650, 550,600, 550,1750, 550,600, 550,1750, 500,1800, 550,600, 550,600, 600,1700, 550,600, 550,1750, 550,600, 550,1750, 550,600, 550,600, 550,600, 550,1750, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,1750, 550,1750, 550,600, 550,1750, 550,1750, 550,1750, 550], 'type':'raw', 'khz':38}]",
    'mute': "[{'data':[4500,4550, 550,1750, 550,1750, 550,600, 550,600, 550,600, 600,550, 550,1750, 550,600, 550,1750, 550,1750, 550,600, 550,600, 600,1700, 550,600, 550,1750, 550,600, 550,600, 550,600, 600,1700, 550,1750, 550,1750, 550,600, 550,600, 600,550, 600,1700, 550,1750, 550,600, 550,600, 550,600, 550,1750, 600,1700, 550,1750, 550], 'type':'raw', 'khz':38}]",
    'volumeup': "[{'data':[4450,4550, 600,1750, 550,1700, 600,550, 600,550, 600,550, 600,550, 600,1700, 600,550, 600,1700, 600,1750, 550,550, 600,550, 600,1700, 550,600, 600,1700, 600,550, 600,1700, 600,1700, 600,550, 600,550, 600,1700, 600,1700, 600,550, 600,550, 600,550, 600,550, 600,1700, 600,1700, 600,550, 600,550, 600,1700, 550,1750, 600], 'type':'raw', 'khz':38,'repeat':6}]",
    'volumedown': "[{'data':[4500,4550, 550,1750, 550,1750, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,600, 550,1750, 550,1750, 550,600, 550,600, 550,1750, 550,600, 550,1750, 550,600, 550,1750, 550,1750, 550,600, 550,1750, 550,1750, 550,1750, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,600, 550,600, 550,600, 550,1750, 550,1750, 550], 'type':'raw', 'khz':38, 'repeat':6}]",
    'up': "[{'data':[4450,4600, 600,1750, 500,1800, 500,700, 550,600, 550,600, 500,700, 550,1750, 500,650, 500,1800, 550,1750, 500,700, 550,600, 500,1800, 500,700, 500,1800, 500,700, 500,1800, 550,600, 500,1800, 500,1800, 500,700, 500,700, 550,600, 500,650, 500,700, 500,1800, 500,700, 500,700, 550,1750, 500,1800, 500,1800, 550,1750, 550], 'type':'raw', 'khz':38}]",
    'left': "[{'data':[4500,4500, 550,1800, 500,1800, 550,650, 550,600, 550,600, 550,600, 550,1700, 600,600, 550,1750, 550,1750, 550,600, 550,600, 500,1800, 550,600, 500,1800, 550,600, 550,1750, 500,650, 550,1750, 500,650, 550,600, 550,1750, 550,600, 550,600, 550,600, 500,1800, 550,600, 550,1750, 550,1750, 550,600, 550,1700, 550,1800, 500], 'type':'raw', 'khz':38}]",
    'right': "[{'data':[4550,4550, 500,1800, 550,1750, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,600, 500,1800, 550,1750, 550,550, 500,650, 550,1750, 550,600, 550,1750, 500,650, 550,1750, 550,550, 600,1750, 550,1700, 600,1750, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,600, 550,550, 600,600, 550,1750, 550,1750, 500,1800, 550], 'type':'raw', 'khz':38}]",
    'down': "[{'data':[4500,4550, 550,1750, 550,1750, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,600, 550,1750, 550,1750, 550,650, 500,600, 550,1750, 550,600, 550,1750, 550,600, 550,1750, 550,600, 550,1750, 550,600, 550,1750, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,600, 550,1750, 550,600, 550,1750, 550,1750, 550,1750, 550], 'type':'raw', 'khz':38}]",
    'enter': "[{'data':[4450,4550, 550,1750, 550,1800, 500,650, 500,650, 550,650, 550,650, 550,1750, 550,650, 550,1750, 550,1750, 550,650, 550,650, 550,1750, 550,650, 550,1750, 550,650, 550,1750, 550,650, 550,1750, 550,650, 550,650, 550,650, 550,650, 550,650, 550,650, 550,1750, 550,650, 550,1750, 550,1750, 600,1700, 550,1750, 600,1700, 600], 'type':'raw', 'khz':38}]",
    'home': "[{'data':[4500,4550, 550,1750, 550,1750, 550,600, 550,600, 550,600, 600,550, 550,1750, 550,600, 550,1750, 550,1750, 550,600, 550,600, 600,1700, 550,600, 550,1750, 550,600, 550,600, 550,600, 600,1700, 550,1750, 550,1750, 550,600, 550,600, 600,550, 600,1700, 550,1750, 550,600, 550,600, 550,600, 550,1750, 600,1700, 550,1750, 550], 'type':'raw', 'khz':38}]",
    'back': "[{'data':[4500,4550, 550,1750, 550,1750, 550,600, 550,600, 550,600, 600,550, 550,1750, 550,600, 550,1750, 550,1750, 550,600, 550,600, 600,1700, 550,600, 550,1750, 550,600, 550,600, 550,600, 600,1700, 550,1750, 550,1750, 550,600, 550,600, 600,550, 600,1700, 550,1750, 550,600, 550,600, 550,600, 550,1750, 600,1700, 550,1750, 550], 'type':'raw', 'khz':38}]"
}

loungeTV = {
   'host': loungeHost,
   'on': "[{data:[2700,950,400,950,400,500,400,500,1350,1400,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,500,400,900,400,500,400],type:raw,khz:38}]",
   'source': "[{data:[2700,900,400,950,400,500,400,500,450,900,950,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,450,400,500,400,900,400,500,400,500,450],type:raw,khz:38}]",
   'mute': "[{data:[2700,900,400,950,400,500,400,500,1350,1350,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,500,400,900,900],type:raw,khz:38}]",
   'volumeup': "[{data:[2700,900,450,950,450,500,400,500,400,950,950,500,400,500,450,450,400,500,400,500,400,500,400,500,400,500,400,500,450,500,400,500,900,900,400,500,400,500,400,500,400],type:raw,khz:38}]",
   'volumedown': "[{data:[2700,900,400,950,400,500,450,450,1350,1350,400,500,450,450,450,450,450,450,400,500,400,500,400,500,400,500,400,500,400,500,900,900,400,500,400,500,900],type:raw,khz:38}]",
   'up': "[{data:[2700,900,450,900,450,450,450,500,450,900,1000,500,450,450,450,500,400,500,450,500,450,500,450,450,450,500,450,500,900,900,900,500,450,850,450,500,400,500,450],type:raw,khz:38}]",
   'left': "[{data:[2650,950,400,950,450,500,450,500,450,900,1000,500,450,500,400,500,450,500,450,500,450,450,450,450,450,450,450,500,900,900,900,500,450,850,900,950,450],type:raw,khz:38}]",
   'right': "[{data:[2700,900,400,950,400,500,400,500,400,950,950,500,450,450,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,950,900,500,400,900,900,500,400],type:raw,khz:38}]",
   'down': "[{data:[2700,900,450,900,450,450,450,500,1350,1350,450,450,450,450,450,450,450,450,450,500,400,500,450,500,450,450,900,950,900,450,450,850,450,450,900],type:raw,khz:38}]",
   'enter': "",
   'back': "[{data:[2650,950,450,950,400,500,400,500,1350,1350,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,850,950,900,950,400],type:raw,khz:38}]",
   'home': "[{data:[2650,950,400,950,400,500,400,500,1350,1400,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,850,950,900,950,900,950,400,500,400],type:raw,khz:38}]",
   'play': "[{data:[2650,950,400,950,400,500,400,500,400,950,950,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,950,850,500,400,950,400,500,400],type:raw,khz:38}]",
   'pause': "[{data:[2700,900,400,950,400,500,400,500,1350,1350,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,450,400,900,400,500,400,500,400,500,400],type:raw,khz:38}]",
   'forward': "[{data:[2700,900,450,900,450,450,450,500,450,900,1000,500,450,500,400,500,400,500,450,500,450,450,450,500,450,450,450,500,450,450,900,950,850,950,450,500,450,500,450],type:raw,khz:38}]",
   'reverse': "[{data:[2650,950,400,950,400,500,400,500,1350,1350,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,950,900,900,900,500,400],type:raw,khz:38}]",
   'stop': "[{data:[2700,900,400,950,400,500,400,500,400,950,950,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,400,500,900,500,400,900,400,500,400,500,900],type:raw,khz:38}]"
}

sittingRoomTV = {
   'host': sittingRoomHost,
   'on': "",
   'source': "[{'data':[8950,4550, 550,650, 550,650, 550,650, 550,650, 550,650, 550,650, 550,1750, 600,600, 550,1750, 550,1750, 550,1750, 550,1750, 550,1750, 550,1750, 550,650, 550,1750, 550,650, 600,600, 500,1750, 550,650, 550,1750, 550,650, 550,650, 550,650, 600,1700, 550,1750, 550,650, 550,1750, 550,650, 550,1750, 600,1650, 550,1750, 550], 'type':'raw', 'khz':38}]",
   'mute': "[{'data':[9000,4450, 600,600, 600,600, 600,600, 600,550, 600,550, 600,550, 600,1650, 600,550, 600,1650, 550,1700, 550,1700, 550,1700, 550,1700, 550,1700, 550,600, 550,1700, 550,600, 550,600, 550,600, 550,650, 550,1700, 550,650, 550,600, 550,600, 550,1700, 550,1700, 600,1700, 600,1700, 600,600, 600,1700, 600,1700, 600,1700, 600], 'type':'raw', 'khz':38}]",
   'volumeup': "",
   'volumedown': "[{'data':[8950,4550, 550,650, 550,650, 550,650, 550,650, 550,650, 550,650, 500,1750, 500,650, 550,1750, 550,1750, 550,1750, 550,1750, 550,1750, 550,1750, 550,650, 550,1750, 550,650, 550,1750, 500,1750, 500,1750, 550,1750, 550,650, 500,650, 500,650, 500,1750, 500,650, 500,650, 500,650, 500,650, 500,1750, 500,1750, 500,1750, 500], 'type':'raw', 'khz':38}]",
   'tools': "",
   'up': "[{'data':[9000,4450, 600,600, 600,600, 550,650, 550,650, 550,600, 550,650, 550,1750, 600,600, 550,1750, 550,1750, 550,1750, 550,1800, 550,1700, 550,1750, 550,600, 550,1750, 600,1700, 550,650, 550,650, 550,1750, 550,1700, 550,650, 550,650, 550,600, 550,650, 550,1750, 550,1700, 550,650, 550,650, 550,1750, 550,1750, 550,1750, 550], 'type':'raw', 'khz':38}]",
   'left': "",
   'right': "",
   'down': "[{'data':[9050,4450, 600,600, 500,650, 600,550, 600,550, 600,550, 600,550, 600,1650, 600,550, 600,1700, 550,1700, 600,1700, 600,1650, 600,1700, 600,1650, 600,550, 600,1650, 600,1650, 600,550, 600,1700, 600,1650, 600,1650, 600,600, 600,600, 600,550, 600,600, 600,1650, 600,550, 600,550, 600,550, 600,1650, 600,1700, 600,1650, 600], 'type':'raw', 'khz':38}]",
   'enter': "[{'data':[8950,4550, 550,650, 550,650, 550,650, 550,650, 550,650, 550,650, 550,1750, 550,650, 550,1750, 550,1750, 550,1750, 550,1700, 550,1700, 550,1750, 550,650, 550,1750, 550,1700, 550,650, 550,650, 550,650, 600,600, 550,1750, 550,650, 550,650, 550,650, 550,1750, 550,1750, 550,1700, 550,1700, 550,650, 550,1750, 550,1750, 500], 'type':'raw', 'khz':38}]",
   'back': "[{'data':[8950,4550, 550,600, 550,600, 550,600, 550,600, 550,600, 550,600, 550,1750, 550,600, 550,1700, 550,1750, 550,1750, 550,1750, 550,1750, 550,1750, 550,650, 550,1750, 550,650, 550,650, 550,1750, 550,650, 550,650, 550,1750, 550,1750, 550,650, 550,1750, 550,1750, 550,650, 550,1750, 550,1750, 550,650, 550,600, 550,1750, 500], 'type':'raw', 'khz':38}]"
}


def sendRequest(device, action):
    subprocess.call(["wget", device['host'] + "/json?simple=1&plain=" + device[action], "-O-"])
device = sys.argv[1]
action = sys.argv[2]
if (action == 'sauce'): action = 'source'
print(device + action)
if (action == 'off'):
    action='on'
devicemap = {
    'bedroomTV': bedroomTV,
    'aircon': aircon,
    'soundbar': soundbar
}


sendRequest(devicemap[device], action)
