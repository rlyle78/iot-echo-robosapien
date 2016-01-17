
// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.


var awsIot = require('aws-iot-device-sdk');
const thingShadow = awsIot.thingShadow;
const isUndefined = require('./node_modules/aws-iot-device-sdk/common/lib/is-undefined');
/*var thingShadows = awsIot.thingShadow({
            keyPath: './bd939bebb5-private.pem.key',
            certPath: './bd939bebb5-certificate.pem.crt',
                caPath: './rootCA.pem',
            clientId: 'macbook',
                region: 'us-east-1'
            });
            
 */
 
 var myPrivateKey = new Buffer('-----BEGIN RSA PRIVATE KEY-----\n' +
'-----END RSA PRIVATE KEY-----');



var myClientCert = new Buffer('-----BEGIN CERTIFICATE-----\n' +
'-----END CERTIFICATE-----');

var myCaCert = new Buffer('-----BEGIN CERTIFICATE-----\n' +
'-----END CERTIFICATE-----');

var thingOptions = {
            privateKey: myPrivateKey,
            clientCert: myClientCert,
            caCert: myCaCert,
            clientId: 'macbook',
                region: 'us-east-1'
            };
       
var operationCallbacks = { };
var commandValues={ name: "" };
var mobileAppOperation='update';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
        }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("MyCommandIntent" === intentName) {
        setCommandSession(intent, session, callback);
    } else if ("WhatsYourNameIntent" === intentName) {
        getNameFromSession(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome I'm RoboSapien. " +
        "Please tell me what to do. I can Dance, Walk, Whistle, and High Five";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me what to do by saying, " +
        "Do a Dance";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


function setCommandSession(intent, session, callback) {
    var cardTitle = intent.name;
    var commandSlot = intent.slots.Command;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (commandSlot) {
        var lastCommand = commandSlot.value;
        sessionAttributes = createCommandAttributes(lastCommand);
        speechOutput = "OK";
        repromptText = "Please tell me what to do next";
        
        var speechletResponse = buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession);
        sendCommandToAmazonIOT(sessionAttributes, speechletResponse, callback);
        
        
        /*callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
*/
    } else {
        speechOutput = "I'm not sure what that command is. Please try again";
        repromptText = "I'm not sure what that command is. You can tell what to do next";
        callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

    }

   // callback(sessionAttributes,
   //      buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function sendCommandToAmazonIOT(sessionAttributes, speechletResponse, callback)
{
    var thingShadows = awsIot.thingShadow(thingOptions);          
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
        
    thingShadows 
        .on('connect', function() {
            console.log('connected to things instance, registering thing name');
            thingShadows.register( 'pi_1' );
                                              
            var commandState = { };
             var opFunction = function() {
                    commandValues.name   = sessionAttributes.lastCommand;
                    commandState={state: { desired: commandValues }};
                    
                    var clientToken;
                     mobileAppOperation = 'update';
                     clientToken = thingShadows[mobileAppOperation]('pi_1',commandState);
                  
                    operationCallbacks[clientToken] = { operation: mobileAppOperation,
                                                        cb: null };
                    operationCallbacks[clientToken].cb = callback(sessionAttributes,speechletResponse);
                       /* function( thingName, operation, statusType, stateObject ) {

                            console.log(role+':'+operation+' '+statusType+' on '+thingName+': '+
                                        JSON.stringify(stateObject));
            //
            // If this operation was rejected, force a 'get' as the next operation; it is
            // probably a version conflict, and it can be resolved by simply getting the
            // latest thing shadow.
            //
                            if (statusType !== 'accepted')
                            {
                                mobileAppOperation = 'get';
                            }                            
                                //callback(sessionAttributes,speechletResponse);
                            
                            opFunction();
                        };*/
                    };
                opFunction();
        });
        
}

function createCommandAttributes(lastCommand) {
    return {
        lastCommand: lastCommand
    };
}

/*function getColorFromSession(intent, session, callback) {
    var favoriteColor;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (session.attributes) {
        favoriteColor = session.attributes.favoriteColor;
    }

    if (favoriteColor) {
        speechOutput = "Your favorite color is " + favoriteColor + ". Goodbye.";
        shouldEndSession = true;
    } else {
        speechOutput = "I'm not sure what your favorite color is, you can say, my favorite color " +
            " is red";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}*/
function getNameFromSession(intent, session, callback) {
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    
    speechOutput = "I am RoboSapien, I can Dance, Walk, Whistle, and do a High Five";
     callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
};
