'use strict';

/**
 *
 * An Alexa skill for the Amazon Echo that retrieves Muni predictions via the NextBus API.
 *
 * Copyright (c) 2016 Eric Lukoff
 *
 */

///// UNCOMMENT BELOW TO TEST LOCALLY /////

// const event = {
//   "session": {
//     "sessionId": "SessionId.bc94bb5e-7ae9-4a94-a585-e00560d4ae06",
//     "application": {
//       "applicationId": "amzn1.ask.skill.8c207920-8332-49b4-b30c-d7cf743fef1d"
//     },
//     "attributes": {},
//     "user": {
//       "userId": "amzn1.ask.account.AEQV72CZRYO2TWTL2EXUERIZ2LUKPJNONZFAILBTEBKQA5552BEXXQHHKUI4PDOVNF27CMOPPCQDOUZBKVSHJB5MI23GSCWP6K2P34W2FRRRKI3AURPBRTLIDB7FSRBLHL2KHT76KTNL6KON4H3RWIQKZFGJXB36HXRAIDSZYI75GCYKQHMFYDZBDIDM4MJBKDNMDKJIQU2H47A"
//     },
//     "new": true
//   },
//   "request": {
//     "type": "LaunchRequest",
//     "requestId": "EdwRequestId.74e99c0d-9e42-4d26-bea0-666d44908407",
//     "locale": "en-US",
//     "timestamp": "2016-12-11T05:13:05Z"
//   },
//   "version": "1.0"
// };

// const process = { "env": { "APPLICATION_ID": "amzn1.ask.skill.8c207920-8332-49b4-b30c-d7cf743fef1d" } };

// function callback(error, response) {
//     console.log("ERROR: " + error);
//     console.log("RESPONSE: " + JSON.stringify(response));
// };

///// UNCOMMENT ABOVE TO TEST LOCALLY /////
 
const request = require('request');
const queryStringBuilder = require('querystring');

const APPLICATION_ID = process.env.APPLICATION_ID;
const NEXTBUS_URL = 'http://webservices.nextbus.com/service/publicJSONFeed';

function buildSpeechletResponse(output, endSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output
        },
        shouldEndSession: endSession
    };
}

function endSessionResponse() {
    return {
        shouldEndSession: true
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes: sessionAttributes,
        response: speechletResponse,
    };
}

function getArrivalTime(route, stopId, callback) {
    
    const params = {
        "command": "predictions",
        "a": "sf-muni",
        "r": route,
        "s": stopId
    };
    
    let queryString = queryStringBuilder.stringify(params);
    const requestUrl = NEXTBUS_URL + '?' + queryString;
    
    request(requestUrl, function (error, response, body) {

        if (!error && response.statusCode == 200) {

            const parsedBody = JSON.parse(body);

            if (parsedBody.predictions == undefined) {
                callback(null, null);
                return;
            }

            if (parsedBody.predictions.direction) {

                let nextArrival,
                    terminusTitle,
                    nextArrivalInMinutes;

                if (parsedBody.predictions.direction.length == undefined) {
                    nextArrival = parsedBody.predictions.direction;
                } else {
                    nextArrival = parsedBody.predictions.direction[0];
                }

                terminusTitle = nextArrival.title;

                if (nextArrival.prediction.length == undefined) {
                    nextArrivalInMinutes = nextArrival.prediction.minutes;
                } else {
                    nextArrivalInMinutes = nextArrival.prediction[0].minutes;
                }

                callback(terminusTitle, nextArrivalInMinutes);
            } else {
                callback(null, null);
            }

        } else {
            console.log(`There was an error: ${error} (${response.statusCode})`);
        }
    });
}

function getRouteArrival(intent, callback) {
    
    const route = intent.slots.Route.value;
    const stopId = intent.slots.StopId.value;

    if (route == undefined || stopId == undefined || route == '?' || stopId == '?') {
        const errorResponse = "Please specify a route and stop ID.";
        callback(buildSpeechletResponse(errorResponse, true));
        return;
    }

    getArrivalTime(route, stopId, function(terminusTitle, arrivalMinutes) {

        let speechOutput;

        if (terminusTitle && arrivalMinutes) {

            let minutePlural = (arrivalMinutes == '1') ? 'minute' : 'minutes';

            speechOutput = `The next ${route} to ${terminusTitle} is arriving in ${arrivalMinutes} ${minutePlural}`;

        } else {
            speechOutput = `I'm not sure when the next ${route} is coming. It might not be running or the stop you specified might not be on the route.`;
        }

        callback(buildSpeechletResponse(speechOutput, true));
    });
}

function explainActionsIntent(intent, callback) {

    const instructions = "I can tell you when the next Muni train or bus is coming. Tell me the route and stop ID you're waiting for. The stop ID is usually found on the sign at the stop.";

    callback(buildSpeechletResponse(instructions, false));
}

function stopIntent(intent, callback) {

    const byeText = "Ok.";

    callback(endSessionResponse());
}

// --------------- Events -----------------------

function onLaunch(intentRequest, session, callback) {

    const welcomeResponse = "Welcome to SF Transit. I can tell you when the next arrival is coming for your bus or train. Try asking me by specifying the route and stop ID. For instance, 'when is the next n. coming for stop thirty-nine eleven.' Or ask for help by saying, 'Help.'";

    callback(buildSpeechletResponse(welcomeResponse, false));
}

function onIntent(intentRequest, session, callback) {

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    switch(intentName) {
        case 'SFTransit':
            getRouteArrival(intent, callback);
            break;
        case 'AMAZON.HelpIntent':
            explainActionsIntent(intent, callback);
            break;
        case 'AMAZON.StopIntent':
            stopIntent(intent, callback);
            break;
        case 'AMAZON.CancelIntent':
            stopIntent(intent, callback);
            break;
        default:
            throw new Error('Invalid intent');
            break;
    }
}

exports.handler = function(event, context, callback) {
    try {

        // Prevent someone else from configuring a skill that sends requests to this function.
        if (event.session.application.applicationId !== APPLICATION_ID) {
            callback('Invalid Application ID');
        }

        switch(event.request.type) {
            case "LaunchRequest":
                onLaunch(event.request, event.session, function(speechletResponse) {
                    callback(null, buildResponse(event.session, speechletResponse));
                });
                break;
            case "IntentRequest":
                onIntent(event.request, event.session, function(speechletResponse) {
                    callback(null, buildResponse(event.session, speechletResponse));
                });
                break;
            case "SessionEndedRequest":
                callback();
                break;
        }
    
        
    } catch (err) {
        callback(err);
    }
};
