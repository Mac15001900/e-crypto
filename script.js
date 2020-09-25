let myName = '';
let team = '';
let code = [];
let members = [];
let switchingDisabled = false;
//let gameState = {received = false, teams={}, codeDrawn=false, currentTeam=''};
let gameState = {'received': false};

const NUMER_OF_WORDS = 4;

const CHANNEL_ID = '5WQg2mc3UkqAxomd';
const drone = new ScaleDrone(CHANNEL_ID, {
  data: { // Will be sent out as clientData via events
    name: getUsername(),
    color: "#0x000000",
  },
});
const DOM = {
  membersCount: document.querySelector('#members-count'),
  membersList: document.querySelector('#members-list'),
  messages: document.querySelector('#messages'),
  input: document.querySelector('#text-input'),
  form: document.querySelector('#form'),
  codeButton: document.querySelector('#codeButton'),
  redButton: document.querySelector('#redButton'),
  blueButton: document.querySelector('#blueButton'),
  resetButton: document.querySelector('#resetButton'),
};


//Test
DOM.input.disabled = false;

//Name & color generation
function getRandomName() {
  const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"];
  const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"];
  const name = adjs[Math.floor(Math.random() * adjs.length)] +
   "_" + nouns[Math.floor(Math.random() * nouns.length)];
  myName = name;
  return (name);
}

function getUsername() {
  //var name = prompt("Enter your username","");
  name = getRandomName();
  while(!name){
    var name = prompt("Enter your username (it can't be empty)","");
  }
  myName = name;
  return(name);
}
 
function getRandomColor() {
 return '#' + Math.floor(Math.random() * 0.8 * 0xFFFFFF).toString(16);
}

function pickTeam(members) {
  var reds = 0, blues = 0;
  for (var i = 0; i < members.length; i++) {
    let memberTeam = members[i].clientData.team;
    gameState.teams[members[i].clientData.name] = memberTeam;
    if(memberTeam === 'red'){
      reds++
    }else if(memberTeam === 'blue'){
      blues++
    }    
  }
  if(reds<=blues){
    return('red');
  }else{
    return('blue');
  }
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
 
function addElementToListDOM(element) {
  const el = DOM.messages;
  const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
  el.appendChild(element);
  if (wasTop) {
   el.scrollTop = el.scrollHeight - el.clientHeight;
  }
}
 
function addMessageToListDOM(text, member) {
  const el = document.createElement('div');
  if(member) el.appendChild(createMemberElement(member));
  el.appendChild(document.createTextNode(text));
  el.className = 'message';
  
  addElementToListDOM(el);
}

//Getting codes
codeButton.addEventListener("click", function () {
  if(code.length === 0){
    randomiseCode();
    addMessageToListDOM('--Kod to: '+code+"--");
    codeButton.text = 'Ujawnij kod';
  } else{
    sendMessage('code', code);
    codeButton.text = 'Dobierz kod';
    code = [];
  }
  
})

function randomiseCode() {
  let codeElements = [];
  let elementsLeft = [1,2,3,4];
  while(codeElements.length < NUMER_OF_WORDS - 1){
    let index = Math.floor(Math.random() * elementsLeft.length);
    codeElements.push(elementsLeft[index]);
    elementsLeft.splice(index,1);
  }
  code = codeElements;
  return(codeElements);
}

//Switching team
redButton.addEventListener("click", function () {
  switchToTeam('R');
})

blueButton.addEventListener("click", function () {
  switchToTeam('B');
})

function switchToTeam(newTeam) {
  team = newTeam;
  codeButton.style.display = 'block';
  resetButton.style.display = 'block';
  let newButton;
  if(newTeam === 'R'){
    redButton.style.display  = 'none';
    newButton = blueButton;
  } else if(newTeam === 'B'){
    blueButton.style.display  = 'none';
    newButton = redButton;
  }else{
    alert('Invalid team '+newTeam);
    return;
  }
  newButton.style.display = 'block';
  //newButton.disabled = true;
  //setTimeout(function(){newButton.disabled = false;}, 5000)

}


//Sending messages
DOM.form.addEventListener('submit', sendFormMessage);

function sendFormMessage() {
  const content = DOM.input.value;
  DOM.input.value = '';
  if(code.length > 0){
    sendMessage('hint',content)  
  } else {
    sendMessage('general',content)
  }
  
}

function sendMessage(type, content) {
  if (content === '') {
    return;
  }
  
  drone.publish({
    room: 'observable-room',
    message: {
      type: type,
      content: content
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
    if(members.length === 1) {
      //First to enter the room; initialise the game
      team = 'red';
      gameState.teams[myName] = 'red';
      gameState.currentTeam = Math.random()<0.5 ? 'red' : 'blue';
      gameState.received = true;
    }
  	updateMembersDOM(); 
	});
	 
	// User joined the room
	room.on('member_join', member => {
	  members.push(member);
    if(gameState.received){
      sendMessage('welcome', gameState);  
    }    
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
      switch(data.type){
        case 'general':
          addMessageToListDOM(data.content, member); 
          console.log(data);
          break;
        case 'hint':
          addMessageToListDOM(data.content, member); 
          console.log(data);
          break;
        case 'code':
          addMessageToListDOM(data.content, member); 
          console.log(data);
          break;
        case 'teamsUpdate': 
          teams = data.content; //TODO update teams display
          break;
        case 'welcome':
          if(!gameState.received){
            gameState = data.content;
          }
          break;
        default: alert('Unkown message type received: '+data.type)

      }

	  } else {
	    // Message is from server
	 }
});

});
