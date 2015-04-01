import processing.video.*;

public class BellRinger
{
  private Movie sound = null;
  
  public BellRinger(PApplet app)
  {
    sound = new Movie(app, "siren.wav");
  }
  
  public void launchSiren()
  {
    sound.loop();
    sound.play();
  }
  
  public void disableSiren()
  {
    sound.stop();
  }
}
