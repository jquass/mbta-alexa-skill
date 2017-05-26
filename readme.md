# MBTA Alexa Skill
This skill is designed to be used in conjunction with the MBTA Alexa API project: [https://github.com/jquass/mbta-alexa-api]()

That API needs to be setup before this will function.

For help on how to use Alexa, see: [Getting started with Alexa](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/getting-started-guide).

## Requirements
- npm [Get npm](https://www.npmjs.com/get-npm)

## How to upload
- Copy .env.example to .env and fill out the required fields.
- Run `npm run deploy` to install the npm packages and zip the files into bundle.zip.
- Upload bundle.zip to you Lambda function.
- Configure your Alexa skill using the sample_utterances and intent_schema provided.
