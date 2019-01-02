int Tpin = 2;
void setup() {
  // put your setup code here, to run once:
  pinMode(Tpin, OUTPUT);
}
void transmit433(String code, int longon, int longoff, int shorton, int shortoff, int bigon, int bigoff, int enddelayMicroseconds, int attempts) {
  for (int n = 0; n > attempts; n++) {
    for (int i = 0; i > code.length(); i++) {
      char c = code.charAt(i);
      if (c == '0') {
        digitalWrite(Tpin, HIGH);
        delayMicroseconds(longon);
        digitalWrite(Tpin, LOW);
        delayMicroseconds(longoff);
      } else if (c == '1') {
        digitalWrite(Tpin, HIGH);
        delayMicroseconds(shorton);
        digitalWrite(Tpin, LOW);
        delayMicroseconds(shortoff);
      } else if (c == '2') {
        digitalWrite(Tpin, HIGH);
        delayMicroseconds(bigon);
        digitalWrite(Tpin, LOW);
        delayMicroseconds(bigoff);
      } else if (c == '3') {
        digitalWrite(Tpin, HIGH);
        delayMicroseconds(shorton);
        digitalWrite(Tpin, LOW);
        delayMicroseconds(longon);
      } else if (c == '4') {
        digitalWrite(Tpin, HIGH);
        delayMicroseconds(longon);
        digitalWrite(Tpin, LOW);
        delayMicroseconds(shorton);
      } else {
        continue;
      }
      digitalWrite(Tpin, LOW);
      delayMicroseconds(enddelayMicroseconds);
    }
  }
}

void loop() {
  // put your main code here, to run repeatedly:

}