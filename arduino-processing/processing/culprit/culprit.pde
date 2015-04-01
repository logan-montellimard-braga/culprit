import processing.serial.*;
import processing.video.*;
import java.util.Date;

final int BAUDRATE = 9600;
final int DELAY_BEFORE_ALARM = 10000;
final String IN_STR = "in";
final String OUT_STR = "out";
final String NORMAL_MESS = "AUCUNE DÉTECTION";
final String SEND_MESS = "DÉTECTION ENVOYÉE";
final String IN_MESS = "ENTRÉE DÉTÉCTÉE";
final String OUT_MESS = "SORTIE DÉTÉCTÉE";
final String API_ALARMS = "http://culprit.mmi-lepuy.fr/index.php/culprit/alarmsJSON/";
final String API_RECORDS = "http://culprit.mmi-lepuy.fr/index.php/culprit/recordsJSON/";
Serial myPort;
String val = "";
//BellRinger SIREN = null;
Alarm currentAlarm = null;
boolean shouldRing = true;
PImage img;
int timer = 0;
String mess = NORMAL_MESS;

void setup()
{
  //SIREN = new BellRinger(this);
  img = loadImage("background.png");
  display(img);
  textAlign(CENTER);
  rectMode(CENTER);
  textSize(28);
  String portName = Serial.list()[1];
  myPort = new Serial(this, portName, BAUDRATE);
}

void draw()
{  
  JSONObject alarmStatus = sendRequest(API_ALARMS + "last");
  int status = Integer.parseInt(alarmStatus.getString("status"));
  shouldRing = (status == 1 ? true : false);
  
  //if (!shouldRing) SIREN.disableSiren();
  display(img);
  text(mess, width / 2, height / 2 - 200);
  val = "";
  if (myPort.available() > 0)
  {
    val = myPort.readStringUntil('\n');
    myPort.clear();
  }
  if (val != null)
  {
    val = trim(val);
    if (val.equals(IN_STR))
    {
      inDetected();
    }
    else if (val.equals(OUT_STR))
    {
      outDetected();
    }
  }
  text(str(timer), width / 2, height / 2 + 280);
  fill(255);
  stroke(255);
  if (timer != 0) {
    rect(0, height / 2 + 200, (height + 190) * (1 - (timer / 10.0)), 5);
  } else {
    rect(0, 0, 0, 0);
  }
}


void inDetected()
{  
  if (shouldRing)
  { // alarme est activée ; on peut envoyer une alerte
    display(img);
    mess = IN_MESS;
    text(mess, width / 2, height / 2 - 200);
    currentAlarm = new Alarm("in", 1); // on crée un nouvel objet alarme, qu'on stocke dans l'objet actuel
    println("alarme activée - IN");
    thread("sendAlarm");
  }
}

void outDetected()
{
  if (shouldRing)
  { // alarme est activée ; on peut envoyer une alerte
    display(img);
    mess = OUT_MESS;
    text(mess, width / 2, height / 2 - 200);
    currentAlarm = new Alarm("out", 1); // on crée un nouvel objet alarme, qu'on stocke dans l'objet actuel
    println("alarme activée - OUT");
    thread("sendAlarm");
  }
}


void sendAlarm()
{
  //delay(DELAY_BEFORE_ALARM);
  int time = millis();
  int init = millis();
  while (time <= init + DELAY_BEFORE_ALARM)
  {
    timer = (init + DELAY_BEFORE_ALARM - time) / 1000;
    //println(str(init + wait - time));
    time = millis();
  }
  mess = SEND_MESS;
  if (shouldRing && (currentAlarm != null))
  {
    String query = "?type=" + currentAlarm.getType() + "&arduino=" + currentAlarm.getArduino() + "&archive=0";
    currentAlarm = null;
    try { sendRequest(API_RECORDS + "create" + query); } catch (Exception e) {}
    println("OKAY");
    //SIREN.launchSiren();
    delay(1000);
    mess = NORMAL_MESS;
    timer = 0;
  }
  
  currentAlarm = null;
}

JSONObject sendRequest(String url)
{
  JSONObject json;
  json = loadJSONObject(url);
  return json;
}

void display (PImage img)
{
  int w = img.width;
  int h = img.height;
  size(w, h);
  image(img, 0, 0, w, h);
}
