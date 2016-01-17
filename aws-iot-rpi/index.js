/*
 * Copyright 2010-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//node.js deps

//npm deps

//initialize cylon
var audioFileName = '';
var Cylon = require('cylon');
Cylon.robot({
  name: 'robosapien',
  connections: {
    audio: { adaptor: 'audio' }
  },
  commands: function() {
    return {
      doCommand: this.doCommand
    }
  },

  devices: {
    audio: { driver: 'audio' }
  },

  work: function(my) {
    my.audio.on('playing', function(song){
      console.log('Playing this command: "' + song + '"');
    });

	 setInterval(function() {
        	if (audioFileName != '')
        	{
			console.log('playing:' + audioFileName);
                	my.audio.play('./RoboSapien/' + audioFileName);
                	audioFileName = '';
        	}
  	 }, 500);
  },

  doCommand: function() {
        my.audio.play('./RoboSapien/' + audioFileName);
  }
});
Cylon.start();


//app deps
var awsIot = require('aws-iot-device-sdk');
const thingShadow = awsIot.thingShadow;
const isUndefined = require('./node_modules/aws-iot-device-sdk/common/lib/is-undefined');
//const cmdLineProcess   = require('./node_modules/aws-iot-device-sdk/examples/lib/cmdline');

//begin module


function processTest( ) {
var thingShadows = awsIot.thingShadow({
   keyPath: './certs/61a998293d-private.pem.key',
  certPath: './certs/61a998293d-certificate.pem.crt',
    caPath: './certs/rootCA.pem',
  clientId: 'pi',
    region: 'us-east-1'
});

//
// Track operations in here using clientTokens as indices.
//
var operationCallbacks = { };

var role='DEVICE';

var commandValues={ name: "" };

thingShadows
  .on('connect', function() {
    console.log('connected to things instance, registering thing name');

       //thingShadows.register( 'pi_1' );
   	thingShadows.register( 'pi_1', { ignoreDeltas: false,
                                              persistentSubscribe: true } );
   

    var opFunction = function() {
       var clientToken;
 
//
// The device gets the latest state from the thing shadow after connecting.
//
          clientToken = thingShadows.get('pi_1');
   
          operationCallbacks[clientToken] = { operation: 'get', cb: null };
          operationCallbacks[clientToken].cb =
             function( thingName, operation, statusType, stateObject ) { 

                console.log(role+':'+operation+' '+statusType+' on '+thingName+': '+
                            JSON.stringify(stateObject));
             };
    };
    opFunction();
    });
thingShadows 
  .on('close', function() {
    console.log('close');
    thingShadows.unregister( 'pi_1' );
  });
thingShadows 
  .on('reconnect', function() {
    console.log('reconnect');
    if (args.testMode === 1)
    {
       thingShadows.register( 'pi_1', { ignoreDeltas: true,
                                              persistentSubscribe: true } );
    }
    else
    {
       thingShadows.register( 'pi_1' );
    }
  });
thingShadows 
  .on('offline', function() {
    console.log('offline');
  });
thingShadows
  .on('error', function(error) {
    console.log('error', error);
  });
thingShadows
  .on('message', function(topic, payload) {
    console.log('message', topic, payload.toString());
  });
thingShadows
  .on('status', function(thingName, stat, clientToken, stateObject) {
      if (!isUndefined( operationCallbacks[clientToken] ))
      {
         setTimeout( function() {
         operationCallbacks[clientToken].cb( thingName, 
              operationCallbacks[clientToken].operation,
              stat,
              stateObject );

         delete operationCallbacks[clientToken];
         }, 2000 );
      }
      else
      {
         console.warn( 'status:unknown clientToken \''+clientToken+'\' on \''+
                       thingName+'\'' );
      }

  });
//
// Only the simulated device is interested in delta events.
//
   thingShadows
     .on('delta', function(thingName, stateObject) {
         console.log(role+':delta on '+thingName+': '+
                     JSON.stringify(stateObject));
         commandValues=stateObject.state;
 
	console.log("Command: " + commandValues.name);
	if (commandValues.name != "NONE")
	{
		doCommand(commandValues.name);
		opFunction("NONE");	
	}
     });


var doCommand = function(command) {
	
	switch (command) {
  	case "WALK":
	case "walk":
    		console.log(command);
   		audioFileName = '11_GO_FORWARD_0x86.mp3';
    		break;
	case "HIGH 5":
        case "high 5":
                console.log(command);
                audioFileName = '43_HIGH5_0xC4.mp3';
                break;
	case "WHISTLE":
        case "whistle":
                console.log(command);
                audioFileName = '48_WHISTLE_0xCA.mp3';
                break;
	case "DANCE":
	case "dance":
                console.log(command);
                audioFileName = '58_DANCE_0xD4.mp3';
                break;
	default:
    		console.log("Unknown Command:" + command);
}
  
};

  var opFunction = function(command) {
                    commandValues.name   = command;
                    commandState={state: { desired: commandValues }};
                    
                    var clientToken;
                     mobileAppOperation = 'update';
                     clientToken = thingShadows[mobileAppOperation]('pi_1',commandState);
                  
                    operationCallbacks[clientToken] = { operation: mobileAppOperation,
                                                        cb: null };
		     operationCallbacks[clientToken].cb =
                        function( thingName, operation, statusType, stateObject ) {

                            console.log(role+':'+operation+' '+statusType+' on '+thingName+': '+
                                        JSON.stringify(stateObject));
		}                    
	};

thingShadows
  .on('timeout', function(thingName, clientToken) {
      if (!isUndefined( operationCallbacks[clientToken] ))
      {
         operationCallbacks[clientToken].cb( thingName,
              operationCallbacks[clientToken].operation,
              'timeout',
              { } );
         delete operationCallbacks[clientToken];
      }
      else
      {
         console.warn( 'timeout:unknown clientToken \''+clientToken+'\' on \''+
                       thingName+'\'' );
      }
  });
}

//module.exports = cmdLineProcess;

if (require.main === module) {
    processTest();
  /*cmdLineProcess('connect to the AWS IoT service and demonstrate thing shadow APIs, test modes 1-2',
                 process.argv.slice(2), processTest );*/
}
