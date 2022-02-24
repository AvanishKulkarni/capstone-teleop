
const MY_BLUETOOTH_NAME = 'BasedLED';
const MOTOR_SERVICE = "2dbb5f2c-da1a-4eed-acf5-eb37a0a1ab08";
const MOTOR_CHARACTERISTIC = "7e86a021-04b9-4168-ae80-863644769296";

let motorCharacteristic;
let myDevice;

var INTAKE_SPEED = 255 // 0 - 255

document.addEventListener('keydown', function (event) {
  if (event.defaultPrevented) {
    return;
  }

  switch (event.code) {
    case "KeyW":
      // W key
      console.log("W");
      drive(0xFE, 0xFE, 000);
      break;
    case "KeyS":
      // S key
      console.log("S");
      drive(0x00, 0x00, 000);
      break;
    case "KeyA":
      // A key
      console.log("A");
      drive(0x00, 0xFE, 0x00);
      break;
    case "KeyD":
      // D key
      console.log("D");
      drive(0xFE, 0x00, 0x00);
      break;
    case "Space":
      // Spacebar
      console.log("Space");
      toggleIntake();
      break;
    default:
      break;
  }

  event.preventDefault();
}, true);

document.addEventListener('keyup', function (event) {
  if (event.defaultPrevented) {
    return;
  }

  switch (event.code) {
    case "KeyW":
      // W key
      console.log("no W");
      drive(0x7F, 0x7F, 000);
      break;
    case "KeyS":
      // S key
      console.log("no S");
      drive(0x7F, 0x7F, 000);
      break;
    case "KeyA":
      // A key
      console.log("no A");
      drive(0x7F, 0x7F, 000);
      break;
    case "KeyD":
      // D key
      console.log("no D");
      drive(0x7F, 0x7F, 000);
      break;
    default:
      break;
  }

  event.preventDefault();
}, true);




// window.addEventListener("gamepadconnected", function(e) {
//   console.log("Gamepad connected at index: " +  
//     e.gamepad.index + " buttons: " + e.gamepad.buttons.length + " axes: " + e.gamepad.axes.length
//   );
// });

// window.addEventListener("gamepaddisconnected", function(e) {
//   console.log("Gamepad disconnected",
//     e.gamepad.index, e.gamepad.id
//   );
// });

// var gamepads = {};
// var interval;
// function gamepadHandler(event, connecting) {
//   var gamepad = event.gamepad;

//   if (connecting) {
//     gamepads[gamepad.index] = gamepad;
//   } else {
//     delete gamepads[gamepad.index];
//   }
// }

// window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
// window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);

// var interval;

// if (gamepads[0]) {
//   interval = setInterval(pollGamepad(), 1000);
// } else {
//   clearInterval(interval);
// }

// function pollGamepad() {
//   console.log(gamepads[0]);
//   console.log("gamepadsssss");
// }




/*
  Not sure how this works, copied from the LED control example files
  I just changed the filters for the name, the UUIDs, and the service names
  Make sure that the UUIDs and names match the ones defined in Teleop.ino
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

    // creates an array for 4 Uint8 (1 byte, 4 total)
    // this ensures that data sent will always be 4 bytes
    var encoded = new Uint8Array([0xFF, leftMotor, rightMotor, intakeMotor]);

    
    
    // checks if intake boolean is true, if it is sets intake to on
    if (intakeOn) {
      encoded[3] = INTAKE_SPEED; // aka 255
    } else {
      encoded[3] = 0x00; // aka 0
    }

    

    // bitwise operators to stack each byte into a 4 byte var
    var uint32 = new Uint32Array([encoded[0] | encoded[1] << 8 | encoded[2] << 16 | encoded[3] << 24]);

    console.log("L: " + 2*(encoded[1] - 127) + "\tR:" + 2*(encoded[2] - 127) + "\tI: " + encoded[3]);

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

/*
  weird way to run intake so it doesnt interrupt drive motors
  otherwise need to call drive() to run intake, which is not ideal
*/

var intakeOn = false;

// just turns intake on 
function turnIntakeOn() {
  if (!intakeOn) {
    intakeOn = true; console.log("Intake on");
    document.getElementById("intakeOn").style.background = 'red';
    document.getElementById("intakeOff").style.background = 'green';
  } else {
    console.log("Intake is already running");
  }
  
}

function toggleIntake() {
  if (!intakeOn) {
    intakeOn = true; console.log("Intake on");
    document.getElementById("intakeOn").style.background = 'red';
    document.getElementById("intakeOff").style.background = 'green';
  } else {
    intakeOn = false; console.log("Intake off");
    document.getElementById("intakeOff").style.background = 'red';
    document.getElementById("intakeOn").style.background = 'green';
  }
}

// and turns it off
function turnIntakeOff() {
  if (intakeOn) {
    intakeOn = false; console.log("Intake off");
    document.getElementById("intakeOff").style.background = 'red';
    document.getElementById("intakeOn").style.background = 'green';
  } else {
    console.log("Intake is already off");
  }
  
}

