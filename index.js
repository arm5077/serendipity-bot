var RtmClient = require('@slack/client').RtmClient,
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser');
  
app.use( bodyParser.JSON() );

var token = process.env.SLACK_API_TOKEN || '';


app.post('/getMessage', function(req, res){
  console.log(req.body);
  res.send(req.body.challenge)
});

app.listen(process.env.PORT || 3000, function(){
  console.log("listening!")
})