module.exports = function(){

// Initialize data if it's not already there, using users.json file
// Pull users collection
connectDatabase.then(function(db){
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
      responses: [],
      leaveAlone: false,
      snoozed: new Date(new Date("1988-05-02T00:00:00.000Z").toISOString()),
      snoozes: []
    }})
  });
  initBulk.execute();
})
.catch(mistake);

}