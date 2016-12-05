var slackbot = require('slackbots'),
  express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  request = require('request'),
  fs = require('fs'),
  MongoClient = require('mongodb').MongoClient,
  CronJob = require('cron').CronJob,
  moment = require('moment');
  
app.use( bodyParser.json() );  

// Initialize user list from folks who have agreed to participate
var usersJSON = require("./users.json");  
users = usersJSON.map(function(d){ return { username: d }})

// Prove to Slack that we're a real app
app.post('/getMessage', function(req, res){
  res.send(req.body.challenge)
});

// Get this thing rolling
app.listen(process.env.PORT || 3000, function(){
  console.log("listening!")
})

var bot = new slackbot({
  token: process.env.SLACK_API_TOKEN || '',
  name: 'serendipity-bot'
});

bot.on('start', function(){
  // Let's connect to the MongoDB database
  var connectDatabase = MongoClient.connect('mongodb://localhost:27017/serendipity')

  
  // Initialize data if it's not already initialized
  connectDatabase
  .then(function(db){
    return db.collection('users');
  })
  .then(function(collection){  
    // Initialize with default data if there's none already
    var initBulk = collection.initializeUnorderedBulkOp();
    users.forEach(function(user){
      initBulk.find({ username: user.username }).upsert().update({ $setOnInsert: {
        username: user.username,
        lastContacted: new Date(new Date("1988-05-02T00:00:00.000Z").toISOString()),
        status: null,
        response: [],
        leaveAlone: false,
        snoozed: new Date(new Date("1988-05-02T00:00:00.000Z").toISOString()),
        snoozes: []
      }})
    });
    initBulk.execute();
  })
  .catch(mistake);
  
  var collection = null;
  
  var job = new CronJob('*/5 * 11-20 * * 1-5', function() {     
    collection = connectDatabase.then(function(db){
      return db.collection('users');
    })
    
    // Grab candidates that aren't snoozed and haven't been updated for at least a week
    candidates = collection.then(function(collectionObj){
      collection = collectionObj
      return collection.find({
        leaveAlone: false,
        snoozed: { $lte: moment.utc().toDate() },
        lastContacted: { $lte: moment.utc().subtract(1, "week").toDate() }
      }).toArray()
    });
    
    candidates.then(function(candidates){
      var snoozers = candidates.filter(function(d){ return d.status == "checked again, waiting for response" })
      if( snoozers.length == 0 ) return
      var updateBulk = collection.initializeUnorderedBulkOp();
      snoozers.forEach(function(d){ 
        console.log("snoozer: " + d.username);
        d.snoozed = moment.utc().add(1, "week").toDate();
        d.snoozes.push(d.snoozed);
        updateBulk.find({ username: d.username }).update({ $set: { status: null, snoozed: d.snoozed, snoozes: d.snoozes }});
      })
      updateBulk.execute();
    }).then(function(){
      return candidates.then(function(candidates){
        var sluggards = candidates.filter(function(d){ return d.status == "touched base, waiting for response" })
        if( sluggards.length == 0) return;
        var updateBulk = collection.initializeUnorderedBulkOp();
        sluggards.forEach(function(d){
          console.log("sluggard: " + d.username);
          updateBulk.find({ username: d.username }).update({ $set: { status: "checked again, waiting for response" }});
        }) 
        updateBulk.execute()
      })
    }).then(function(){
      return candidates.then(function(candidates){
        var potentials = candidates.filter(function(d){ return d.status == null })
        if( potentials.length == 0) return;
        var index = Math.round(Math.random() * (potentials.length - 1));
        var person = potentials[index];
        console.log("bugging " + person.username)
        collection.update({ username: person.username }, { $set: { status: "touched base, waiting for response" }});
      })
    }).then(function(){
      console.log("done");
    })
    .catch(mistake);
  }, null, true, 'America/New_York');
  
     // Set up loop to query people, between 11 and 4, Monday to Friday
     // It runs every 10 minutes but doens't HAVE to ping anybody

  //var job = new CronJob('00 */10 11-16 * * 1-5', function() {         
})


function mistake(err){ console.log(err); throw err; }