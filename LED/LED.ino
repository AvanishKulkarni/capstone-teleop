/*
  LED

  This example creates a BLE peripheral with service that contains a
  characteristic to control an LED.

  The circuit:
  - Arduino MKR WiFi 1010, Arduino Uno WiFi Rev2 board, Arduino Nano 33 IoT,
    Arduino Nano 33 BLE, or Arduino Nano 33 BLE Sense board.

  You can use a generic BLE central app, like LightBlue (iOS and Android) or
  nRF Connect (Android), to interact with the services and characteristics
  created in this sketch.

  This example code is in the public domain.
*/

#include <ArduinoBLE.h>

BLEService motorService("2dbb5f2c-da1a-4eed-acf5-eb37a0a1ab08"); // BLE Motor Service

// BLE LED Switch Characteristic - custom 128-bit UUID, read and writable by central
BLELongCharacteristic motorCharacteristic("7e86a021-04b9-4168-ae80-863644769296", BLERead | BLEWrite);


BLEDescriptor motorDescriptor("2901", "Encoded Motor Control");

const int ledPin = LED_BUILTIN; // pin to use for the LED

// Motor Left
const int leftMotorPin1  = 13;  // Pin 15 of L293
const int leftMotorPin2  = 12;  // Pin 10 of L293

// Motor Right - placeholder, change pins once attached
const int rightMotorPin1  = 28; // Pin  7 of L293
const int rightMotorPin2  = 27;  // Pin  2 of L293

// Motor Intake - placeholder, change pins once attached
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

  Serial.begin(9600);
  while (!Serial);

  // set LED pin to output mode
  pinMode(ledPin, OUTPUT);

  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");

    while (1);
  }

  // set advertised local name and service UUID:
  BLE.setLocalName("BasedLED");
  BLE.setAdvertisedService(motorService);

  // add the characteristic to the service
  motorService.addCharacteristic(motorCharacteristic);

  motorCharacteristic.addDescriptor(motorDescriptor);

  // add service
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
      // if the remote device wrote to the characteristic,
      // use the value to control the LED:
      if (motorCharacteristic.written()) {
        unsigned long encodedValue = motorCharacteristic.value();
        Serial.println(encodedValue);

        byte LM = encodedValue >> 8;
        byte RM = encodedValue >> 16;
        byte IM = encodedValue >> 24; 


        /*
          000 - 127 reverse
          128 - 255 forward
      
          0 min reverse
          63 half reverse
          127 full reverse
          
          128 min forward
          191 half forward
          255 full forward
        */
        

        forwardLeftMotor(LM);
        forwardRightMotor(RM);
        runIntake(IM);
        
      }
    }

    // when the central disconnects, print it out:
    Serial.print(F("Disconnected from central: "));
    Serial.println(central.address());
  }
}

// left motor
void forwardLeftMotor(byte speed) {

  byte shiftedSpeed = speed - 127;

  Serial.print("L Speed: ");
  Serial.println(shiftedSpeed);

  if (shiftedSpeed > 0) {
    analogWrite(leftMotorPin1, shiftedSpeed * 2);
    digitalWrite(leftMotorPin2, LOW);
  } else if (shiftedSpeed < 0) {
    digitalWrite(leftMotorPin1, LOW);
    analogWrite(leftMotorPin2, shiftedSpeed * -2);
  } else {
    digitalWrite(leftMotorPin1, LOW);
    digitalWrite(leftMotorPin2, LOW);
  }
}

// right motor
void forwardRightMotor(byte speed) {
  
  byte shiftedSpeed = speed - 127;

  Serial.print("R Speed: ");
  Serial.println(shiftedSpeed);
  
  if (shiftedSpeed > 0) {
    analogWrite(rightMotorPin1, shiftedSpeed * 2);
    digitalWrite(rightMotorPin2, LOW);
  } else if (shiftedSpeed < 0) {
    digitalWrite(rightMotorPin1, LOW);
    analogWrite(rightMotorPin2, shiftedSpeed * -2);
  } else {
    digitalWrite(rightMotorPin1, LOW);
    digitalWrite(rightMotorPin2, LOW);
  }

}

// intake motor 
void runIntake(byte speed) {
  analogWrite(intakeMotorPin1, speed);
  digitalWrite(intakeMotorPin2, LOW);
}
