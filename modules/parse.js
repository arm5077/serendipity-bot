module.exports = function(message){ 
  // Connect to database
  connectDatabase.then(function(db){
    return db.collection('users');
  }).then(function(collection){
    // Get user object;
    user = userlist._value.members.filter( function(user){ return user.id == message.user })[0]
  
    // First, let Andrew know that someone has told the bot something
    if( user.name != "andrewmcgill")
      bot.postMessageToUser("andrewmcgill", user.name + " just said: \"" + message.text + "\"", { 'slackbot': false, icon_emoji: ':thinking_face:' })

    // Are they uttering the dreaded kill word?
    if( message.text.toLowerCase().indexOf("i hate you") != -1 ){
      console.log("Permanently snoozing " + user.name)
      collection.update({ username: user.name }, { $set: { leaveAlone: true }})
      bot.postMessageToUser(user.name, "Aw, OK. I won't bother you again.", { 'slackbot': false, icon_emoji: ':sob:' })
    }
    // Are they snoozing us?
    else if( message.text.toLowerCase().indexOf("snooze") == 0 ){
      console.log("Temporarily snoozing " + user.name)
      collection.update({ username: user.name }, { 
        $set: { snoozed: moment.utc().add(2, "week").toDate() },
        $push: { snoozes: moment.utc().add(2, "week").toDate() }});
      bot.postMessageToUser(user.name, "OK, I won't bug you for at least a week.", { 'slackbot': false, icon_emoji: ':sleeping:' })
    }
    // Did they make a mistake and are correcting it?
    else if( message.text.toLowerCase().indexOf("oops") == 0){
  
      collection.findOne({ username: user.name}).then(function(archiveUser){
        if( archiveUser.status == "response received, ready for posting"){
          console.log(user.name + " made a boo-boo!")
          collection.update({ username: user.name }, { 
            $pop: { responses: 1 },
            $set: { status: "" }
          });
          bot.postMessageToUser(user.name, "OK, I forgot what you just told me. Want to tell me what you're most excited to work on this week?", { 'slackbot': false, icon_emoji: ':thinking_face:' })
        } else {
          bot.postMessageToUser(user.name, "Oops? You haven't told me anything, though!", { 'slackbot': false, icon_emoji: ':thinking_face:' })
        }
      }).catch(mistake);
    }
    // Not any of these? They must be writing an actual thing!!
    else {
      // Check if they included the "I am" prompt
      if( message.text.toLowerCase().indexOf("i am ") == 0 )
        message.text = message.text.substring("i am ".length);
      else if( message.text.toLowerCase().indexOf("i'm ") == 0)
        message.text = message.text.substring("i'm ".length)
      else if( message.text.toLowerCase().indexOf("i’m ") == 0)
        message.text = message.text.substring("i’m ".length)
  
      collection.update({ username: user.name }, { 
        $set: { status: "response received, ready for posting", lastContacted: moment.utc().toDate(), snooze: moment.utc().toDate() },
        $push: { responses: { date: moment.utc().toDate(), text: message.text }}
      });
      bot.postMessageToUser(user.name, "Cool! I'll share later that you're \"" + message.text + "\" ... if this isn't right, reply with \"oops!\"", { 'slackbot': false, icon_emoji: ':heart_eyes:' })    
  
    }
  }).catch(mistake);
}