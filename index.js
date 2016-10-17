var RtmClient = require('@slack/client').RtmClient,
  express = require('express'),
  app = express();

var token = process.env.SLACK_API_TOKEN || '';


app.get('/getMessage', function(req, res){
  console.log("blooooo");
  res.send("Nailed it!")
});
