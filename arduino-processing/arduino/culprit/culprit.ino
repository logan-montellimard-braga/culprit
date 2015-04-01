#include <LiquidCrystal.h>

#define BAUDRATE 9600
#define LOOP_DURATION 50
#define PUSH_BUTTON 7
#define screen_rs 12
#define screen_enable 11
#define screen_d4 5
#define screen_d5 4
#define screen_d6 3
#define screen_d7 2
#define DETECTOR_LEFT 10
#define DETECTOR_RIGHT 9
#define NIL 0

LiquidCrystal LCD(screen_rs,screen_enable,screen_d4,screen_d5,screen_d6,screen_d7);
boolean left;
boolean right;
int count;

void setup()
{
  Serial.begin(BAUDRATE);

  LCD.begin(16, 2);
  LCD.print("CULPRIT GO!");
}

void loop() {
  LCD.clear();
  count++;
  if (count > 15)
  {
    left = right = false;
    count = 0;
  }
  int dist_left = getDistanceInCm(DETECTOR_LEFT);
  int dist_right = getDistanceInCm(DETECTOR_RIGHT);

  if (!right && dist_left > 1 && dist_left < 80)
  {
    count = 0;
    left = true;
    right = false;
    Serial.println("in");
    LCD.print("Entree");
  }
  else if (!left && dist_right > 1 && dist_right < 80)
  {
    count = 0;
    right = true;
    left = false;
    Serial.println("out");
    LCD.print("Sortie");
  }
  delay(LOOP_DURATION);
}

long getDistanceInCm(const int pin)
{
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(2);
    digitalWrite(pin, HIGH);
    delayMicroseconds(5);
    digitalWrite(pin, LOW);
    pinMode(pin, INPUT);

    long duration = pulseIn(pin, HIGH);
    return duration / 29. / 2. ;
}
