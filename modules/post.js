module.exports = function(){

  var job = new CronJob('* * 11 * * 1-5', function() {    
    // Check to see if we have three responses.
    collection = connectDatabase.then(function(db){
      return db.collection('users');
    })

    // See if we already have three responses; if we do, don't bother asking anyone for stuff
    collection.then(function(collection){
      return collection.count({ status: "response received, ready for posting" })
    }).then(function(count){
      if( count < 3)
        throw "not enough to publish!"
    }).then(function(){
      // Pull the responses
      return collection.then(function(collectionObj){
        return collectionObj.find({ status: "response received, ready for posting" }).toArray()
      })
    }).then(function(results){
      // Cycle through results and build message
      message = "Hello! Time for a look at some of the cool stuff Atlantickans are doing: \n\n";
      results.forEach(function(user){
        archiveUser = userlist._value.members.filter( function(archiveUser){ return archiveUser.name == user.username })[0]
        if(user.responses.length > 0){
          // Add to message string and reset status
          message += "— <@" + archiveUser.id + "> is " + user.responses[user.responses.length - 1].text + "\n"
          collection.then(function(collectionObj){
            console.log(user.username);
            return collectionObj.update({ username: user.username }, { $set: { status: "" }});
          }).catch(mistake);
        }
      });
      bot.postMessageToChannel("serendipity", message, { 'slackbot': false, icon_emoji: ':heart_eyes:' })    
    })
    .catch(mistake);
  });
}