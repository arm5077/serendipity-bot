slackbot = require('slackbots'),
  Slack = require('slack-node');
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  request = require('request'),
  fs = require('fs'),
  MongoClient = require('mongodb').MongoClient,
  CronJob = require('cron').CronJob,
  moment = require('moment'),
  mistake = function(err){ console.log(err); throw err; };

var initialize = require('./modules/initialize'),
  pingPeople = require('./modules/ping'),
  parseResponse = require('./modules/parse'),
  postResponses = require('./modules/post');

// Install middleware to more easily read POST requests  
app.use( bodyParser.json() );  

// Set up Slack API library
slack = new Slack(process.env.SLACK_API_TOKEN);

// Initialize user list from folks who have agreed to participate
var usersJSON = require("./data/users");  
users = usersJSON.map(function(d){ return { username: d }})

// Prove to Slack that we're a real app
app.post('/getMessage', function(req, res){
  res.send(req.body.challenge)
});

// Get this thing rolling
app.listen(process.env.PORT || 3000, function(){
  console.log("listening!")
})

// Open connection to Slack
bot = new slackbot({
  token: process.env.SLACK_API_TOKEN || '',
  name: 'serendipity-bot'
});

// Get userlist
userlist = bot.getUsers();

// Once that connection is open...
bot.on('start', function(){

  // Let's connect to the MongoDB database
  connectDatabase = MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serendipity')    
  
  initialize();
  new CronJob('00 00 */1 * * *', initialize);
  pingPeople();  
  postResponses();
  
});

// Read incoming messages
bot.on('message', function(message){
  if(message.type == 'message' && !message.bot_id){
    parseResponse(message);    
  }
})
