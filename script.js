let myName = '';
let team = '';
let nextTeam = '';
let code = [];
let forceGuessMode = false;
let members = [];
let words = [];
//let gameState = {received = false, teams={}, codeDrawn=false, currentTeam=''};
let gameState = {'received': false, 'memberData':[]};
//let s = JSON.parse()

const NUMER_OF_WORDS = 4;
const wordPool = [wordBank.en_basic,wordBank.en_pokemon_types,wordBank.en_fantasy].flat();
const rerollWordPoll = [wordBank.en_basic].flat();
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const NO_TEAM_COLOR = "#AAAAAA";
const RED_TEAM_COLOR = "#F52020";
const BLUE_TEAM_COLOR = "#3030F0";

const CHANNEL_ID = '5WQg2mc3UkqAxomd';
const drone = new ScaleDrone(CHANNEL_ID, {
  data: { // Will be sent out as clientData via events
    name: getUsername(),
    color: "#000000",
  },
});
const DOM = {
  membersCount: document.querySelector('#members-count'),
  membersList: document.querySelector('#members-list'),
  messages: document.querySelector('#messages'),
  input: document.querySelector('#text-input'),
  form: document.querySelector('#form'),
  modeSwapButton: document.querySelector('#modeSwapButton'),
  codeButton: document.querySelector('#codeButton'),
  redButton: document.querySelector('#redButton'),
  blueButton: document.querySelector('#blueButton'),
  resetButton: document.querySelector('#resetButton'),
  descriptions: [document.querySelector('#decs1'), document.querySelector('#decs2'), document.querySelector('#decs3')],
  inputs: [document.querySelector('#text-input'), document.querySelector('#text-input2'), document.querySelector('#text-input3')],
};

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

//Utility functions

function init() {
  translate();
  updateDescriptions(true);
}

function getMember(input) {
  let id = input;
  if(typeof input === 'object') id = input.id;
  let res = members.find(m=>m.id === id);
  if(!res) console.error('Member with id '+ id +' not found.');
  return res;
}



//Handle displaying things
function createMemberElement(member) {
  const name = member.clientData.name;
  const el = document.createElement('div');
  var content = name;
  if(name === myName) content += " (" + s.you+ ")";
  el.appendChild(document.createTextNode(content));
  el.className = 'member';
  el.style.color = getTeamColor(member.team);
  return el;
}

function getTeamColor(team) {
  if(!team) return NO_TEAM_COLOR;
  else if(team === 'R') return RED_TEAM_COLOR;
  else if(team === 'B') return BLUE_TEAM_COLOR;
  else console.error('Invalid team: '+team);
}
 
function updateMembersDOM() {
  //DOM.membersCount.innerText = members.length+' '+s.player_count;
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
    addMessageToListDOM(s.your_code_is + ' ' + code);
    updateDescriptions(false);
    codeButton.text = s.reveal_code;
  } else{
    sendMessage('codeReveal', code);
    codeButton.text = s.draw_code;
    updateDescriptions(true);
    code = [];
    DOM.modeSwapButton.style.display = 'none';
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
  DOM.modeSwapButton.style.display = 'block';
  return(codeElements);
}

function updateDescriptions(guessMode) {
  if(guessMode){
    for (var i = 0; i < DOM.descriptions.length; i++) {
      DOM.descriptions[i].innerHTML = s.guess_for + ' ' + alphabet.substring(i,i+1);
      DOM.inputs[i].placeholder = s.enter_guess_here;
    }
  } else {
    let codeWords = code.map(x=>words[(x-1)]);
    for (var i = 0; i < DOM.descriptions.length; i++) {
      DOM.descriptions[i].innerHTML = s.hint_for + ' "' + words[code[i]-1][0].toUpperCase() + '":';
      DOM.inputs[i].placeholder = s.enter_hint_here;
    }
  }
}

//Switching between hint and guess mode
DOM.modeSwapButton.addEventListener("click",swapMode);

function swapMode() {
  forceGuessMode = !forceGuessMode;
  if(forceGuessMode){
    updateDescriptions(true);
    modeSwapButton.value = s.hint_mode;
  } else {
    updateDescriptions(false);
    modeSwapButton.value = s.guess_mode;
  }
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
    sendMessage('requestWords',newTeam);
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

//Starting a new game

resetButton.addEventListener("click", newGame);

function newGame() {
  if (confirm(s.confirm_reset)) {
    var newWordsRed = pickNoDuplicates(wordPool,NUMER_OF_WORDS*2);
    var newWordsBlue = newWordsRed.splice(0,NUMER_OF_WORDS);
    sendMessage('newGame', {'wordsRed':newWordsRed, 'wordsBlue':newWordsBlue});
  }
}

function receiveNewGame(newWords) {
  console.log(newWords);
  if(nextTeam !== team){
    team = nextTeam;
    sendMessage('teamSwitch', team);
  }
  if(code.length>0) {
    code = [];
    DOM.modeSwapButton.style.display = 'none';
    codeButton.text = s.draw_code;
    updateDescriptions(true);
    forceGuessMode = false;
  }
  words = [];
  if(team === 'R') words = newWords.wordsRed;
  if(team === 'B') words = newWords.wordsBlue;  

  updateWordsDisplay();
}

function updateWordsDisplay() {
  let wordsDisplay = s.secret_words + ': ';  
  for (var i = 0; i < words.length; i++) {
    wordsDisplay += (i+1).toString() + ':' + (words[i][0]).toUpperCase();
    if(i !== words.length-1) wordsDisplay += '  |  '
  }
  DOM.membersCount.innerText = wordsDisplay;
}

function pickNoDuplicates(list,amount,discard) {
  if(!discard) discard = [];
  res = [];
  var filteredList = list.filter(x=> !discard.includes(x));
  while(res.length < amount){
    var index = Math.floor(filteredList.length * Math.random());
    var nextElem = filteredList.splice(index,1);    
    res.push(nextElem);
  }
  return(res);
}

//Sending messages
DOM.form.addEventListener('submit', sendFormMessage);

function sendFormMessage() {
  if(code.length === 0 || forceGuessMode){
    sendMessage('guess', DOM.inputs.map(i=>i.value));
  } else {
    sendMessage('hint', DOM.inputs.map(i=>i.value));
    updateDescriptions(true);
    forceGuessMode = true;
  }

  DOM.inputs.forEach(i=>i.value='');  
}

function sendMessage(type, content) {
  /*if (content === '') {
    return;
  }*/
  
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
    addMessageToListDOM(s.joined_game, member); 
    if(gameState.received){
      gameState.memberData = members;
      sendMessage('welcome', gameState);  
    }    
	  updateMembersDOM();
	});
	 
	// User left the room
	room.on('member_leave', ({id}) => {
    addMessageToListDOM(s.left_game, getMember(id)); 
    const index = members.findIndex(member => member.id === id);
    members.splice(index, 1);
    updateMembersDOM(); 
	});

	room.on('data', (data, serverMember) => {
	  console.log(data);
    if (serverMember) {
      let member = getMember(serverMember);
      //console.log(member);
      switch(data.type){
        case 'general': //General message to be displayed to the user
          addMessageToListDOM(s.send_message+': '+data.content, member); 
          break;
        case 'hint': //Sent when a player offers a hint
          let hints = data.content;
          let res = s.sends_hint + ': ';
          for (var i = 0; i < hints.length; i++) {
            res+= alphabet.substring(i,i+1) + ': ' + hints[i];
            if(i<hints.length-1) res+= ' | ';
          }
          addMessageToListDOM(res, member); 
          break;
        case 'guess': //Sent when a player makes a guess
          addMessageToListDOM(s.sends_guess+': '+data.content, member); 
          break;
        case 'codeDrawn':
          addMessageToListDOM(s.draws_code+': '+data.content, member); 
        case 'codeReveal': //Sent when a secret code is revealed
          addMessageToListDOM(s.reveals_code+': '+data.content, member); 
          break;
        case 'newGame': //Sent when a new game is started
          addMessageToListDOM(s.started_new_game, member);
          receiveNewGame(data.content);
          break;
        case 'teamSwitch': //Sent when a player joins a team - *not* when they decide they'll switch next game
          member.team = data.content;
          if(data.content === 'R') addMessageToListDOM(s.joins_red, member); 
          else if(data.content === 'B') addMessageToListDOM(s.joins_blue, member);
          else alert('Invalid team switch to '+ data.content);          
          updateMembersDOM();
          break;
        case 'requestWords': //Sent when a player has just joined the game and picked a team to request that team's words
          if(data.content === team && words.length>0){
            sendMessage('welcomeWords', {'words':words,'team':team});
          }
          break;
        case 'welcomeWords': //Sent in response to requestWords; it delivers the words
          if(data.content.team === team && words.length === 0){
            words = data.content.words;
            updateWordsDisplay();
          }
          break;
        case 'welcome': //Sent whenever a new player joins the game, informing them of the game state
          if(!gameState.received){
            gameState = data.content;
            let memberData = gameState.memberData;
            for (var i = 0; i < memberData.length; i++) {
              getMember(memberData[i]).team = memberData[i].team;
            }
          }
          updateMembersDOM();
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

