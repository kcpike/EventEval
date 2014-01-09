//I am limiting the list size to 100 events.
var EVENTSBOARD_SIZE = 100;

//Here's our Firebase reference for 1) events on display... 
var eventScore = new Firebase("https://eventeval.firebaseio.com/events");
//...and 2) archived events
var archiveRef = new Firebase("https://eventeval.firebaseio.com/archives");

//I had no idea what this supposed to do at first. Now I know it's creating a dictionary.
//Later on, it's going to tell us what's being added to the HTML
var htmlForEachEvent = {}

//This tells us how the new info will be appended in the HTML. I had to look up ".append" and ".val"
//Added "prevEvent" as part of testing the remove event feature. Works without it!
//This section got major help from Anant, Alex and Adam because I couldn't figure out how to
//make the buttons increase the scores. Initially the buttons were placeholders and score
//was inputted manually just like the Leaderboard example on Firebase.com.
//.attr() lets me add CSS around the buttons
function addEventToTable(newEvent, prevEvent) {
  var newEventRow = $("<tr/>").attr({'class':'row'});
  newEventRow.append($("<td/>").text(newEvent.val().name));
  var upvoteButton = $('<button/>', {
    text: "Yes!",
    click: function () { upvoteEvent(newEvent.name()); }
  }).attr({'class':'btn button button-flat-action'});
  var downvoteButton = $('<button/>', {
    text: "No!",
    click: function () { downvoteEvent(newEvent.name()); }
  }).attr({'class':'btn button button-flat-caution'});
  var archiveButton = $('<button/>', {
    text: "Archive",
    click: function () { archiveEvent(newEvent.name()); }
  }).attr({'class':'btn button button-flat-royal archive-btn'});

  newEventRow.append($("<td/>").text(newEvent.val().upvotes));
  newEventRow.append(upvoteButton);
  newEventRow.append($("<td/>").text(newEvent.val().downvotes));
  newEventRow.append(downvoteButton);
  newEventRow.append(archiveButton);

  console.log(newEvent.val().name + ": " + newEventRow.html());
  
  //This tells me what's being added in the HTML
  htmlForEachEvent[newEvent.name()] = newEventRow;

  // Insert the new score in the appropriate place in the table.
  //Should "newEvent" be what I'm calling here?
  if (prevEvent === null) {
    //Adds HTML to the table. Could remove the rest of the If statement and the app will work fine.
    $("#eventTable").append(newEventRow);
  }
  else {
    var lowerUpvoteScore = htmlForEachEvent[prevEvent];
    //Just adding this section got me an error becuase "before" is undefined. Remove if statement to restore app.
    lowerUpvoteScore.before(newEventRow);
  }

 }

// Arhive an event. Anant helped add this.
function archiveEvent(name) {
  var eventRef = eventScore.child(name);
  eventRef.once('value', function(snap) {
    eventRef.remove();
    archiveRef.child(name).set(snap.val());
  });
}

// Helper function to handle a score object being removed; just removes the corresponding table row.
function removeEvent(newEvent) {
  var removeEventRow = htmlForEachEvent[newEvent.name()];
  removeEventRow.remove();
  delete htmlForEachEvent[newEvent.name()];
}

//Updating one updates the other because of "eventScore". How do I separate? Solution: fixed
//addEventToTable function.
function upvoteEvent(name) {
  console.log("In the upvote function")
  var eventRef = eventScore.child(name);
  // Note, this does NOT reset priority
  eventRef.transaction(function(current_value) {
    var newValue = current_value;
    newValue.upvotes += 1;
    console.log("Updating upvotes to " + (newValue.upvotes));
    return {".priority": newValue.upvotes, ".value": newValue};
  }, function(error, committed, snapshot) {
    if (error) {
      alert('Did we commit the transaction? ' + committed);
      alert('The final value is: ' + snapshot.val());
    }
  });

}

 function downvoteEvent(name) {
  console.log("In the downvote function")

  var eventRef = eventScore.child(name + "/downvotes");
  // Note, this does NOT reset priority
  eventRef.transaction(function(current_value) {
    console.log("Updating downvotes to " + (current_value + 1));
    return current_value + 1;
  }, function(error, committed, snapshot) {
    if (
error) {
      alert('Did we commit the transaction? ' + committed);
      alert('The final value is: ' + snapshot.val());
    }
  });
}

//Viewing the last events. If I comment out ".limit(EVENTSBOARD_SIZE);" the limit will be removed! 
//How do I get this list in the reverse order?! I tried .reverse... And then once I added "prevEvent" 
//and "remove" stuff... the order worked fine! WTF. - Solved later with other code.
var eventListView = eventScore.limit(EVENTSBOARD_SIZE);

 //"When Firebase tells you a new item was added, do this". Works great. No need to comment out.
 eventListView.on('child_added', function(newEvent, prevEvent) {
    addEventToTable(newEvent, prevEvent);
 });

//New code up until the "enter key" section. Comment out if buggy. 
//"When firebase tells me an item has been modified, update it"
// Add a callback to handle when a score is removed
eventListView.on('child_removed', function (oldEvent) {
  removeEvent(oldEvent);
});

// Add a callback to handle when a score changes or moves positions.
var changedCallback = function (newEvent, prevEvent) {
  removeEvent(newEvent);
  addEventToTable(newEvent, prevEvent);
};
eventListView.on('child_moved', changedCallback);
eventListView.on('child_changed', changedCallback);


// When the user presses enter on eventName, add the event and its up/down votes
$("#eventName").keypress(function (e) {
  if (e.keyCode == 13) {
    console.log("Why won't you work?!")
    //I tried commenting the following two var out as well as removing the var newEventUpvotes and newEventDownvotes from the eventRef.setWithPriority. 
    //Also commented out the HTML for the input boxes. 
    var newEventUpvotes = 0;
    //Number($("#eventUpvotes").val());
    var newEventDownvotes = 0;
    //Number($("#eventDownvotes").val());
    
    var name = $("#eventName").val();

    // Reset values
    $("#eventName").val("");
    $("#eventUpvotes").val("0");
    $("#eventDownvotes").val("0");

    if (name.length === 0)
      return;

    var eventRef = eventScore.child(eventScore.push().name());
    
    // Use setWithPriority to put the name / votes in Firebase, and set the priority to be the score.
    eventRef.setWithPriority({ name:name, upvotes: newEventUpvotes, downvotes:newEventDownvotes }, newEventUpvotes);
  }
});

//Thanks to Sara for helping make the submit button work.
$("#submit-btn").click(function (e) {
    console.log("Why won't you work?!")
    //I tried commenting the following two var out as well as removing the var newEventUpvotes and newEventDownvotes from the eventRef.setWithPriority. 
    //Also commented out the HTML for the input boxes. 
    var newEventUpvotes = 0;
    //Number($("#eventUpvotes").val());
    var newEventDownvotes = 0;
    //Number($("#eventDownvotes").val());
    
    var name = $("#eventName").val();

    // Reset values
    $("#eventName").val("");
    $("#eventUpvotes").val("0");
    $("#eventDownvotes").val("0");

    if (name.length === 0)
      return;

    var eventRef = eventScore.child(eventScore.push().name());
    
    // Use setWithPriority to put the name / votes in Firebase, and set the priority to be the score.
    eventRef.setWithPriority({ name:name, upvotes: newEventUpvotes, downvotes:newEventDownvotes }, newEventUpvotes);
});

// setTimeout(function() {
 // upvoteEvent("Kaitlin");
//}, 1000);
//downvoteEvent("Kaitlin");
