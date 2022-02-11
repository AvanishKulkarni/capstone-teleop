/*
  Teleop

  This creates a BLE peripheral with service that contains a
  characteristic to control up to 4 unique motors. 
  
  This is used to control a small RC robot which intakes paintballs from the ground.

  The circuit:
  - Redboard Artemis ATP
  - 2x L293D
  - 4x Drive Motors (slaved in pairs for each side)
  - 1x Intake Motor 

  You can connect to the robot by running the included index.html file.

*/

#include <ArduinoBLE.h>

/* 
  All UUIDs below are randomly generated. 
  Make sure that the UUID below matches the filters set in the bleMotor.js file.
*/
BLEService motorService("2dbb5f2c-da1a-4eed-acf5-eb37a0a1ab08");
BLELongCharacteristic motorCharacteristic("7e86a021-04b9-4168-ae80-863644769296", BLERead | BLEWrite);

/* 
  2901 is the default preallocated UUID for "Characteristic User Description"
  This is the only one (from my research) which allows you to set a custom descriptor
  Other preallocated UUIDs can be found at https://www.bluetooth.com/specifications/assigned-numbers/ 
*/
BLEDescriptor motorDescriptor("2901", "Encoded Motor Control");

// Motor Left
const int leftMotorPin1  = 12;
const int leftMotorPin2  = 13;

// Motor Right
const int rightMotorPin1  = 23;
const int rightMotorPin2  = 22;

// Motor Intake
const int intakeMotorPin1 = 18;
const int intakeMotorPin2 = 19;

void setup() {
  // Motor Setup
  pinMode(leftMotorPin1, OUTPUT);
  pinMode(leftMotorPin2, OUTPUT);

  pinMode(rightMotorPin1, OUTPUT);
  pinMode(rightMotorPin2, OUTPUT);

  pinMode(intakeMotorPin1, OUTPUT);
  pinMode(intakeMotorPin2, OUTPUT);

  // Begins serial output, make sure to set the 
  // baud rate to 9600 to see it in serial monitor
  Serial.begin(9600);
  while (!Serial);

  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");

    while (1);
  }

  /* 
    Sets advertised local name and service UUID
    These can (and are) used to filter in bleMotor.js 
    If you change the name/UUID, make sure to change the filter
  */
  BLE.setLocalName("BasedLED");
  BLE.setAdvertisedService(motorService);

  // 
  /*
    Adds the characteristic to the service
    Adds the descriptor to the characteristic
    Then adds the service to the BLE table
  */
  motorService.addCharacteristic(motorCharacteristic);
  motorCharacteristic.addDescriptor(motorDescriptor);
  BLE.addService(motorService);
  
  // start advertising
  BLE.advertise();

  Serial.println("BLE LED Peripheral");
}

void loop() {
  // listen for BLE peripherals to connect:
  BLEDevice central = BLE.central();

  // if a central is connected to peripheral:
  if (central) {
    Serial.print("Connected to central: ");
    // print the central's MAC address:
    Serial.println(central.address());

    // while the central is still connected to peripheral:
    while (central.connected()) {
      
      // If the characteristic is written to by another device
      if (motorCharacteristic.written()) {
        
        // Reads the value and stores it as a long (32 bytes)
        unsigned long encodedValue = motorCharacteristic.value();

        // Bitwise operations to read each 8 byte chunk per motor
        // Discards the first byte, since only need control of 3 motors
        byte LM = encodedValue >> 8;
        byte RM = encodedValue >> 16;
        byte IM = encodedValue >> 24; 

        Serial.print("LM fixed: ");
        int LMf = LM;
        int LMff = (LMf - 127)*2;
        Serial.println(LMff);
        
        Serial.print("RM fixed: ");
        int RMf = RM;
        int RMff = (RMf - 127)*2;
        Serial.println(RMff);
  
        


        /*
          How motor control values are encoded
            000 - 127 reverse
            128 - 255 forward

            0 full reverse
            63 half reverse
            
            128 none

            191 half forward
            255 full forward
          So you should just be able to subtract 128 and get values from -128 to 127 
        */
        
        // passes unshifted values to the functions
        forwardLeftMotor(LMff);
        forwardRightMotor(RMff);
        runIntake(IM);
        
      }
    }

    // when the central disconnects, print it out:
    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
}

// Runs left motor
void forwardLeftMotor(int speed) {

  if (speed > 0) {
    Serial.println("L forward");
    digitalWrite(leftMotorPin1, HIGH);
    digitalWrite(leftMotorPin2, LOW);
  } else if (speed < 0) {
    int speedr = speed * -1;
    Serial.println("L reverse");
    digitalWrite(leftMotorPin1, LOW);
    digitalWrite(leftMotorPin2, HIGH);
  } else {
    Serial.println("L stop");
    digitalWrite(leftMotorPin1, LOW);
    digitalWrite(leftMotorPin2, LOW);
  }
}

// Runs right motor
void forwardRightMotor(int speed) {
  
  if (speed > 0) {
    Serial.println("R forward");
    digitalWrite(rightMotorPin1, HIGH);
    digitalWrite(rightMotorPin2, LOW);
  } else if (speed < 0) {
    Serial.println("R reverse");
    int speedr = speed * -1;
    digitalWrite(rightMotorPin1, LOW);
    digitalWrite(rightMotorPin2, HIGH);
  } else {
    Serial.println("R stop");
    digitalWrite(rightMotorPin1, LOW);
    digitalWrite(rightMotorPin2, LOW);
  }
}

// Runs intake motor 
void runIntake(byte speed) {
  digitalWrite(intakeMotorPin1, HIGH);
  digitalWrite(intakeMotorPin2, LOW);
}
