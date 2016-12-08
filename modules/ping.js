module.exports = function(){
  var collection = null;
  var job = new CronJob('0 */10 11-15 * * 1-5', function() {     
    collection = connectDatabase.then(function(db){
      return db.collection('users');
    })
  
    // See if we already have three responses; if we do, don't bother asking anyone for stuff
    collection.then(function(collectionObj){
      return collectionObj.count({ status: "response received, ready for posting" })
    }).then(function(count){

      // If we've got less than 3 of these fellas
      if( count < 3){
        // Grab candidates that aren't snoozed and haven't been updated for at least a week
        candidates = collection.then(function(collectionObj){
          collection = collectionObj
          return collection.find({
            leaveAlone: false,
            snoozed: { $lte: moment.utc().toDate() },
            lastContacted: { $lte: moment.utc().subtract(1, "week").toDate() }
          }).toArray()
        });
  
        // Turn the folks who are laggards into snoozers
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
        // Turn folks who haven't answered into laggards
        }).then(function(){
          return candidates.then(function(candidates){
            var sluggards = candidates.filter(function(d){ return d.status == "touched base, waiting for response" })
            if( sluggards.length == 0) return;
            var updateBulk = collection.initializeUnorderedBulkOp();
            sluggards.forEach(function(d){
              bot.postMessageToUser(d.username, ":wave: I'll ask one more time before leaving you alone: Any chance you want to share a cool thing you're working on this week?", { 'slackbot': false, icon_emoji: ':thinking_face:' })
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
            bot.postMessageToUser(person.username, "Hi! I'm SerendipityBot, created by <@U0EKQHS6L|andrewmcgill>. I ask random Atlantic people what they're working on this week that excites them, and share a brief digest every day in <#C2RC1STC2|serendipity>. It's a fun way to get an idea of the cool things your coworkers are doing.\n\nWant to partipate? If so, tell me something you're working on this week that you'd like to share, in the form of \"I am *building a rocket,*\" or \"I'm *writing about Capt. Jean-Luc Picard*.\"\n\nIf you don't want me to bug you right now, reply *\"snooze.\"* If you never want to hear from me again (:sob:), type *\"I hate you.\"*", { 'slackbot': false, icon_emoji: ':thinking_face:' })
            console.log("bugging " + person.username)
            collection.update({ username: person.username }, { $set: { status: "touched base, waiting for response" }});
          })
        }) 
      } else {
        console.log("Already have three responses!")
      }
    }).then(function(){
      console.log("done");
    })
    .catch(mistake);
  }, null, true, 'America/New_York');
}