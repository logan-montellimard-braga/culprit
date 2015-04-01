import java.util.Date;

public class Alarm
{
  private int type;
  private long timestamp;
  private int arduino;
  
  public Alarm(String type, int arduino)
  { 
    this.type = typeToBool(type);
    this.arduino = arduino;
    
    Date d = new Date();
    this.timestamp = d.getTime();
  }
  
  public int getType()
  {
    return this.type;
  }
  
  public long getTimestamp()
  {
    return this.timestamp;
  }
  
  public int getArduino()
  {
    return this.arduino;
  }
  
  public void setType(String type)
  {
    this.type = typeToBool(type);
  }
    
  public void setTimestamp(long t)
  {
    this.timestamp = t;
  }
  
  public void setArduino(int a)
  {
    this.arduino = a;
  }
  
  public int typeToBool(String type)
  {
    int t = 0;
    if (type.equals("in"))
    {
      t = 0;
    }
    else if (type.equals("out"))
    {
      t = 1;
    }
    return t; 
  }
}
