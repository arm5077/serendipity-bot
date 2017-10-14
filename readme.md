# Serendipity Bot
A Slack bot that encourages chance encounters by asking people what they're passionate about and posting their responses in a daily digest.

## Requirements
* A server running Node (I use Heroku, and the instructions below focus on installing for Heroku)
* A MongoDB database (also obtained through Heroku)
* A Slack app with an accompanying API token
* A channel named "serendipity" on your organization's Slack

## Installation
1. **Clone or download this repository.**
2. **Start a new Heroku instance.** You can either do this through the Heroku GUI online, if you'd like, or follow the CLI directions here: https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-the-app. (You'll have to download the Heroku toolkit.)
3. **On your Heroku app's dashboard, add a mLab MongoDB add-on.** The "Sandbox" tier is free, and you shouldn't need more than that.
4. **In your Heroku app's settings, add a `SLACK_API_TOKEN` environmental variable.** You can get this from your Slack app's dashboard.
5. Restart your Heroku instance on the CLI with `heroku restart`.

