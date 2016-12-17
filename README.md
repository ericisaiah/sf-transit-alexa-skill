# SF Transit

SF Transit is an Alexa skill for the Amazon Echo that provides [San Francisco Municipal Transportation Agency (SFMTA, a.k.a. Muni)](https://www.sfmta.com/) predictions. By providing the route and stop ID (found on poles, bus shelters, signs), Alexa will call the [Next Bus](https://www.nextbus.com/) API and return the next predicted arrival in minutes.

## Contribute

SFMTA provides the [documentation for NextBus's predictions API here](https://www.sfmta.com/getting-around/transit/schedules-trip-planners/accessing-nextmuni-vehicle-prediction-data).

Feel free to create a pull request and improve the skill. At some point I might try to add tests that correspond to Amazon's Alexa test documentation. If you're interested in doing that, even better.

### Run

To run the app locally, install the needed node packages:

    npm install

Then uncomment the lines indicated at the top:

    ///// UNCOMMENT BELOW TO TEST LOCALLY /////

Comment out the line:

    exports.handler = function(event, context, callback) {

As well as its closing brace, the very last `};`.

Then run the command:

    node index.js

## Notice

Not authorized, sponsored, or endorsed by the San Francisco Municipal Transportation Agency (SFMTA).