require('dotenv').config();

var Alexa = require('alexa-sdk');
var request = require('request');

var mbtaApiHost = process.env.MBTA_API_HOST;
var predictionPath = 'api/v1/predictions';

exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('PredictionIntent');
    },

    'PredictionIntent': function () {
        console.log('PredictionIntent');

        var self = this;
        var intent = this.event.request.intent;

        var stop = intent.slots.Stop.value;
        if (typeof(stop) === 'undefined' || stop.length === 0) {
            restart(self);
        } else {
            stop = stop.toLowerCase();
        }
        console.log('stop', stop);

        var filter = intent.slots.Filter.value;
        if (typeof(filter) === 'undefined' || filter.length === 0) {
            filter = null;
        } else {
            filter = filter.toLowerCase();
        }
        console.log('filter', filter);

        var url = mbtaApiHost + predictionPath;
        console.log('url', url);

        request.post(
            {
                url: url,
                form: {
                    stop: stop,
                    filter: filter
                }
            },
            function (err, httpResponse, body) {
                if (err) {
                    console.error('error posting form: ', err);
                    restart(self);
                }

                if (httpResponse.statusCode !== 202) {
                    console.error('Status code is not 202: ', body);
                    restart(self);
                }

                var predictions = JSON.parse(body);
                console.log('predictions', predictions);

                if (typeof(predictions.error) !== 'undefined') {
                    restart(self);
                }

                var prediction = parsePredictions(predictions);
                self.emit(':tell', prediction);
            }
        );
    },

    'AMAZON.HelpIntent': function () {
        console.log('AMAZON.HelpIntent');
        var rePrompt = "What can I help you with?";
        var speechOutput = "You can ask, when does the next west bound train arrive at boston college, or, you can say exit.";
        this.emit(':ask', speechOutput, rePrompt);
    },

    'AMAZON.CancelIntent': function () {
        console.log('AMAZON.CancelIntent');
        this.emit(':tell', 'Goodbye.');
    },

    'AMAZON.StopIntent': function () {
        console.log('AMAZON.StopIntent');
        this.emit(':tell', 'Goodbye.');
    },

    'Unhandled': function () {
        console.log('Unhandled');
        this.emit('AMAZON.HelpIntent');
    }
};

var restart = function (self) {
    console.log('restarting, self: ', self);
    console.log('intent: ', this.event.request.intent);
    var rePrompt = "You can ask, when does the next west bound train arrive at boston college, or, you can say exit.";
    var speechOutput = "I didn't find that stop, please try again.";
    self.emit(':ask', speechOutput, rePrompt);
};


function parsePredictions(predictions) {
    var px = 0;
    var response = '';
    var emptyResponse = '';
    while (typeof(predictions[px]) !== 'undefined') {
        var stop = predictions[px];
        console.log('stop', stop);
        if (typeof(stop.mode) !== 'undefined') {
            var rx = 0;
            while (typeof(stop.mode[0].route[rx]) !== 'undefined') {
                var route = stop.mode[0].route[rx];
                console.log('route', route);
                var timeDue;
                var pre_away = route.direction[0].trip[0].pre_away;
                if (pre_away >= 60) {
                    var minutes = Math.round(pre_away / 60);
                    var seconds = pre_away % 60;
                    timeDue = minutes + ' minutes and ' + seconds + ' seconds.';
                } else {
                    timeDue = pre_away + ' seconds.';
                }

                var routeName = route.direction[0].direction_name + ' ' + route.route_name;
                response = response + 'The next ' + routeName + ' is due in ' + timeDue + ' ';
                rx++;
            }
        } else {
            if (emptyResponse.length === 0) {
                emptyResponse = emptyResponse + ' ' + predictions[px].stop_name + ' ';
            } else {
                emptyResponse = emptyResponse + ' or ' + predictions[px].stop_name + ' ';
            }
        }

        px++;
    }

    if (response.length === 0) {
        response = 'There are no trains due at' + emptyResponse;
    }

    return response;
}