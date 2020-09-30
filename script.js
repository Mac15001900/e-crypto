let myName = '';
let team = '';
let nextTeam = '';
let code = [];
let members = [];
//let gameState = {received = false, teams={}, codeDrawn=false, currentTeam=''};
let gameState = {'received': false};
//let s = JSON.parse()

const NUMER_OF_WORDS = 4;
const words = ["Lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","Porttitor","rhoncus","dolor","purus","non","enim","praesent","elementum","Adipiscing","enim","eu","turpis","egestas","pretium","aenean","pharetra","Odio","pellentesque","diam","volutpat","commodo","Varius","duis","at","consectetur","lorem","Sit","amet","est","placerat","in","egestas","Amet","mauris","commodo","quis","imperdiet","massa","tincidunt","nunc","pulvinar","sapien","Velit","scelerisque","in","dictum","non","consectetur","a","erat","nam","at"];


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
  descriptions: [document.querySelector('#decs1'), document.querySelector('#decs2'), document.querySelector('#decs3')],
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
  //var name = prompt(s.enter_username,"");
  var name = getRandomName();
  while(!name){
    var name = prompt(s.enter_username_non_empty,"");
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

function init() {
  translate();
  updateDescriptions();
}


//Handle displaying things
function createMemberElement(member) {
  const { name, color } = member.clientData;
  const el = document.createElement('div');
  var content = name;
  if(name === myName) content += " " + s.you;
  el.appendChild(document.createTextNode(content));
  el.className = 'member';
  el.style.color = color;
  return el;
}
 
function updateMembersDOM() {
  DOM.membersCount.innerText = members.length+' '+s.player_count;
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
    addMessageToListDOM(s.your_code_is + ' ' + code + "--");
    codeButton.text = s.reveal_code;
  } else{
    sendMessage('code', code);
    codeButton.text = s.draw_code;
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
  if(!team) {
    team = newTeam;
    nextTeam = newTeam;
    sendMessage('teamSwitch',newTeam);
  }
  else {
    nextTeam = newTeam;
    alert(s.switch_after_game);
  }
  nextTeam = newTeam;
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

function updateDescriptions(codeWords) {
  if(!codeWords){
    DOM.descriptions[0].innerHTML = s.guess_for + ' A';
    DOM.descriptions[1].innerHTML = s.guess_for + ' B';
    DOM.descriptions[2].innerHTML = s.guess_for + ' C';
  } else {
    DOM.descriptions[0].innerHTML = s.hint_for + ' ' + codeWords[0];
    DOM.descriptions[1].innerHTML = s.hint_for + ' ' + codeWords[1];
    DOM.descriptions[2].innerHTML = s.hint_for + ' ' + codeWords[2];
  }
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

//Translate HTML elements
function translate() {
  var allDom = document.getElementsByTagName("*");
    for(var i =0; i < allDom.length; i++){
      var elem = allDom[i]; 
      var key = elem.innerHTML;
      if (elem.innerHTML.substring(0,2) === "s.") {
        elem.innerHTML = s[elem.innerHTML.substring(2)];
      } else if (elem.value && elem.value.substring(0,2) === "s.") {
        elem.value = s[elem.value.substring(2)];
      } else if (elem.placeholder && elem.placeholder.substring(0,2) === "s.") {
        elem.placeholder = s[elem.placeholder.substring(2)];
      } 
    }
}

init();

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
      //First to enter the room; initialise the game (TODO?)
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
	  console.log(data);
    if (member) {
      switch(data.type){
        case 'general':
          addMessageToListDOM(data.content, member); 
          break;
        case 'hint':
          addMessageToListDOM(data.content, member); 
          break;
        case 'code':
          addMessageToListDOM(data.content, member); 
          break;
        case 'teamSwitch':
          if(data.content === 'R') addMessageToListDOM(s.joins_red, member); 
          else if(data.content === 'B') addMessageToListDOM(s.joins_blue, member); 
          else alert('Invalid team switch to '+ data.content);          
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
	    addMessageToListDOM('Server: '+data.content); 
	 }
});

});


/*
//Load a file, from https://www.codeproject.com/Tips/1165561/How-to-create-a-multilingual-application-using-Jav
function loadFile(path) {
  var fileHandle = new XMLHttpRequest();
  var res;
  //load content data 
  fileHandle.open("GET", path, false);
  fileHandle.onreadystatechange = function () {
    if(fileHandle.readyState === 4){
      if(fileHandle.status === 200 || fileHandle.status == 0) {
        res = fileHandle.responseText;        
      }
    }
  }
  fileHandle.send();
  return(res);
}

console.log(loadFile('en-strings.json'));*/

