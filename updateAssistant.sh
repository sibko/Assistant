#!/bin/bash

python -m pip install --upgrade google-assistant-library
python -m pip install --upgrade google-assistant-sdk[samples]
python -m pip install --upgrade google-auth-oauthlib[tool]
google-oauthlib-tool --scope https://www.googleapis.com/auth/assistant-sdk-prototype           --save --headless --client-secrets /home/pi/credentials.json
