module.exports = function(){
// Add/subtract users based on folks in #serendipity channel
  console.log("Checking for new users!");

  // Grab list of all members
  slack.api("users.list", { "presence": 0 }, function(err, data){
    var members = data.members;
    console.log(members);
    slack.api("channels.list", { "exclude_archived": 1 }, function(err, channels){
      if(err) throw err;
      var serendipityMembers= channels.channels.filter(function(d){ return d.name == "serendipity"})[0].members;

      // Pull users collection
      connectDatabase.then(function(db){
        return db.collection('users');
      })
      .then(function(collection){  	
        console.log(collection)
        // Initialize with default data if there's none already
        var initBulk = collection.initializeUnorderedBulkOp();
        serendipityMembers.forEach(function(member){
          member = members.filter(function(d){ return d.id == member })[0];
          initBulk.find({ id: member.id }).upsert().update({ $setOnInsert: {
            id: member.id,
            username: member.name,
            lastContacted: new Date(new Date("1988-05-02T00:00:00.000Z").toISOString()),
            status: null,
            responses: [],
            leaveAlone: false,
            snoozed: new Date(new Date("1988-05-02T00:00:00.000Z").toISOString()),
            snoozes: []
          }})
        });
        initBulk.execute();
    
        collection.remove( { id: { $nin: serendipityMembers } })
    
      })
      .catch(mistake);
    });
  });
}