
const MY_BLUETOOTH_NAME = 'BasedLED';
const MOTOR_SERVICE = "2dbb5f2c-da1a-4eed-acf5-eb37a0a1ab08";
const MOTOR_CHARACTERISTIC = "7e86a021-04b9-4168-ae80-863644769296";

let motorCharacteristic;
let myDevice;

/*

window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad connected at index: " +  
    e.gamepad.index +
    " buttons: " + e.gamepad.buttons.length + " axes: " + e.gamepad.axes.length
  );
});

window.addEventListener("gamepaddisconnected", function(e) {
  console.log("Gamepad disconnected from index %d: %s",
    e.gamepad.index, e.gamepad.id
  );
});

var gamepads = {};
function gamepadHandler(event, connecting) {
  var gamepad = event.gamepad;

  if (connecting) {
    gamepads[gamepad.index] = gamepad;
  } else {
    delete gamepads[gamepad.index];
  }
}

window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);

*/


function connect(){
navigator.bluetooth.requestDevice({
    filters:
      [
        { name: MY_BLUETOOTH_NAME },
        { services: [MOTOR_SERVICE]}
      ]
  })
    .then(device => {
      myDevice = device;

      return device.gatt.connect();
    })
    .then(server => server.getPrimaryService(MOTOR_SERVICE))
    .then(service => service.getCharacteristic(MOTOR_CHARACTERISTIC))
    .then(characteristic => {
      motorCharacteristic = characteristic;
	    console.log(motorCharacteristic);
    })
    .catch(error => {
      console.error(error);
    });
}

// disconnect function:
function disconnect() {
  if (myDevice) {
    // disconnect:
    myDevice.gatt.disconnect();
  }
}

function drive(leftMotor, rightMotor, intakeMotor) {
  // checks gamepad input
  // for (let index = 0; index < gamepads[0].axes.length; index++) {
  //   console.log(gamepads[0].axes[index]);
    
  // }
  
  try {
    
    /* 
    Single Uint32 (4 bytes)
    Structure: [255] [left motor] [right motor] [intake]
    
    i.e.
    255 255 000 255 
    drives left and intake motors at speed 255

    */

    // creates an array for 4 Uint8 (1 byte)
    // this ensures that data sent will always be 4 bytes
    var encoded = new Uint8Array([0xFF, leftMotor, rightMotor, intakeMotor]);

    
    
    // checks if intake boolean is true, if it is sets intake to on
    if (intakeOn) {
      encoded[3] = 0xFF;
    } else {
      encoded[3] = 0x00;
    }

    

    // bitwise operators to stack each byte into a 4 byte var
    var uint32 = new Uint32Array([encoded[0] | encoded[1] << 8 | encoded[2] << 16 | encoded[3] << 24]);

    console.log("L: " + encoded[1] + "\tR:" + encoded[2] + "\tI: " + encoded[3]);
    
    // colors
    if (leftMotor > 200 || rightMotor > 200) {
      document.getElementById("forward").style.background = 'blue';
      document.getElementById("left").style.background = 'blue';
      document.getElementById("right").style.background = 'blue';
    } else if (leftMotor == 000 && rightMotor == 000) {
      document.getElementById("forward").style.background = 'green';
      document.getElementById("left").style.background = 'green';
      document.getElementById("right").style.background = 'green';
    } else {
      document.getElementById("forward").style.background = 'lightblue';
      document.getElementById("left").style.background = 'lightblue';
      document.getElementById("right").style.background = 'lightblue';
    }

    
    // sends the 4 byte var as an array of Uint32 with only one Uint32
    try {
      return motorCharacteristic.writeValue(Uint32Array.of(uint32));
    } catch (error) {
      console.error("There is no arduino connected!");
    }

  } catch (error) {
    console.warn("No connection to Arduino");
  }
  
}

var intakeOn = false;

function turnIntakeOn() {
  if (!intakeOn) {
    intakeOn = true; console.log("Intake on");
    document.getElementById("intakeOn").style.background = 'red';
    document.getElementById("intakeOff").style.background = 'green';
  } else {
    console.log("Intake is already running");
  }
  
}

function turnIntakeOff() {
  if (intakeOn) {
    intakeOn = false; console.log("Intake off");
    document.getElementById("intakeOff").style.background = 'red';
    document.getElementById("intakeOn").style.background = 'green';
  } else {
    console.log("Intake is already off");
  }
  
}

