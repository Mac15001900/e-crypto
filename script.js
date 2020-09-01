let myName = '';

const CHANNEL_ID = 'M0aA6Z7AxYWcGGt3';
const drone = new ScaleDrone(CHANNEL_ID, {
  data: { // Will be sent out as clientData via events
    name: getUsername(),
    color: getRandomColor(),
  },
});
const DOM = {
  membersCount: document.querySelector('.members-count'),
  membersList: document.querySelector('.members-list'),
  messages: document.querySelector('.messages-day'),
  input: document.querySelector('.message-form_main_input'),
  input2: document.querySelector('.message-form_secondary_input'),
  form: document.querySelector('.message-form'),
};

let members = [];


//Name & color generation
function getRandomName() {
  const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"];
  const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"];
  const name = adjs[Math.floor(Math.random() * adjs.length)] +
   "_" +
   nouns[Math.floor(Math.random() * nouns.length)];
  myName = name;
  return (name);
}

function getUsername() {
  var name = prompt("Enter your username","");
  while(!name){
    var name = prompt("Enter your username (it can't be empty)","");
  }
  myName = name;
  return(name);
}
 
function getRandomColor() {
 return '#' + Math.floor(Math.random() * 0.8 * 0xFFFFFF).toString(16);
}


//Handle displaying things
function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement('div');
  var content = name;
  if(name === myName) content += " (you)";
  el.appendChild(document.createTextNode(content));
  el.className = 'member';
  el.style.color = color;
  return el;
}
 
function updateMembersDOM() {
  DOM.membersCount.innerText = `${members.length} users in room:`;
  DOM.membersList.innerHTML = '';
  members.forEach(member =>
   DOM.membersList.appendChild(createMemberElement(member))
  );
}
 
function createMessageElement(text, member) {
  const el = document.createElement('div');
  el.appendChild(createMemberElement(member));
  el.appendChild(document.createTextNode(text));
  el.className = 'message';
  return el;
}
 
function addMessageToListDOM(text, member) {
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(createMessageElement(text, member));
  if (wasTop) {
   el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}

//Sending messages
DOM.form.addEventListener('submit', sendMessage);
 
function sendMessage() {
  const content = DOM.input.value;
  const recipient = DOM.input2.value;
  if (content === '') {
    return;
  }
  DOM.input.value = '';
  drone.publish({
    room: 'observable-room',
    message: {
      text: content,
      recipient: recipient
    },
  });
}

//Room connection
drone.on('open', error => {
	 if (error) {
	   return console.error(error);
	 }
	 console.log('Successfully connected to Scaledrone');
	 
	 const room = drone.subscribe('observable-room');
	 room.on('open', error => {
	   if (error) {
	     return console.error(error);
	   }
	   console.log('Successfully joined room');
	 });
	 
	 // List of currently online members, emitted once
	room.on('members', m => {
  	members = m;
  	updateMembersDOM(); 
	});
	 
	// User joined the room
	room.on('member_join', member => {
	  members.push(member);
	  updateMembersDOM();
	});
	 
	// User left the room
	room.on('member_leave', ({id}) => {
    const index = members.findIndex(member => member.id === id);
    members.splice(index, 1);
    updateMembersDOM(); 
	});

	room.on('data', (data, member) => {
	  if (member) {
      if(data.recipient !== '') {
        if(data.recipient === myName || member.clientData.name === myName) addMessageToListDOM(data.text, member);

      }
	    else addMessageToListDOM(data.text, member);
	  } else {
	    // Message is from server
	 }
});

});
