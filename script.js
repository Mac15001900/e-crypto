const RS = {
  NO_GAME: 0, //There is no game going on
  START: 1,  //Start of a subround, nothing happened yet
  HINT_GIVEN: 2, //A hint has just been given (instantly skips to ENEMY_GUESSED if round 1)
  ENEMY_GUESSED: 3, //The enemy team made a guess 
  ALLY_GUESSED: 4, //The allied team has made a guess, waiting for the code reveal (this doesn't last long)
  ROUND_END: 5 //Code was revealed, processing the end of the subround (this also doesn't last long)
};

//Team and player tracking
let myName = '';
let members = [];
let team = '';
let nextTeam = ''; //Team we'll switch to next game

//Hint giver variables
let isHintGiver = false; //True between giving out a hint and releaving the code.
let code = [];
let forceGuessMode = false; //UI variable
let guesses = {'R':[],'B':[]};

//Team variables
let words = [];
let rerollsLeft= 0;

//Other
let rulesShown = false;

//gameState block:
let gs = {'received': false, 'memberData':[], 'round':0, 'startingTeam':'','currentTeam':'','roundState':RS.NO_GAME,'hintGiver':{},'tokens':{},'hintHistory':{}};

//Game settings
const NUMER_OF_WORDS = 4;
const REROLLS_PER_GAME = 2;
const NUMBER_OF_ROUNDS = 8;
const TOKENS_NEEDED = 2;
const ROOM_NAME = 'observable-room';
const wordPool = [wordBank.en_basic,wordBank.en_pokemon_types,wordBank.en_fantasy].flat();
const rerollWordPool = [wordBank.en_basic].flat();
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

//UI settings
const NO_TEAM_COLOR = "#AAAAAA";
const RED_TEAM_COLOR = "#F52020";
const BLUE_TEAM_COLOR = "#3030F0";
const RED_BACKGROUND = "#ed143d6b";
const BLUE_BACKGROUND = '#00bfff5c';//'#469ae4';//"#00bfff5c"; #56affd

//Network settings
const CHANNEL_ID = '5WQg2mc3UkqAxomd';
const drone = new ScaleDrone(CHANNEL_ID, {
  data: { // Will be sent out as clientData via events
    name: getUsername(),
    color: "#000000",
  },
});

const DOM = {
  secretWordsDisplay: document.querySelector('#secretWordsDisplay'),
  membersList: document.querySelector('#members-list'),
  messages: document.querySelector('#messages'),
  input: document.querySelector('#text-input'),
  form: document.querySelector('#form'),
  modeSwapButton: document.querySelector('#modeSwapButton'),
  codeButton: document.querySelector('#codeButton'),
  redButton: document.querySelector('#redButton'),
  blueButton: document.querySelector('#blueButton'),
  rerollButton: document.querySelector('#rerollButton'),
  resetButton: document.querySelector('#resetButton'),
  descriptions: [document.querySelector('#decs1'), document.querySelector('#decs2'), document.querySelector('#decs3')],
  inputs: [document.querySelector('#text-input'), document.querySelector('#text-input2'), document.querySelector('#text-input3')],
  hintTable: document.querySelector('#hintTable'),
};

//Name & color generation
function getRandomName() {
  const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient"];
  const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill"];
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
  resetGameState();
  //TODO remove this test
  hintTable.rows[1].cells[6].innerHTML = 'Line one\nLine two\nOne really long line with a lot of text in it that could cause layout problems';
}

function getMember(input) {
  let id = input;
  if(typeof input === 'object') id = input.id;
  let res = members.find(m=>m.id === id);
  if(!res) console.error('Member with id '+ id +' not found.');
  return res;
}

function otherTeam(team) {
  if(team === 'R') return 'B';
  else if(team === 'B') return 'R';
  else console.error('Invalid team '+ team);
}

function repeat(n, ...fs) {
  for (var i = 0; i < fs.length; i++) {
    for (var j = 0; j < n; j++) {
      fs[i]();
    }  
  }
  
}



//Handle displaying things
function createMemberElement(member) {
  const name = member.clientData.name;
  const el = document.createElement('div');
  var content = name;
  if(name === myName) content += " (" + s.you+ ")";
  if(member.team) content  += createVisualTokens(member.team);
  el.appendChild(document.createTextNode(content));
  el.className = 'member';
  el.style.color = getTeamColor(member.team);
  return el;
}

function createVisualTokens(team) {
  var res = '';
  var tokens = gs.tokens[team];
  if(!tokens) return '';
  for (var i = 0; i < tokens.good; i++) {
    res += s.intercept_icon
  }
  if(res) res+=' ';
  for (var i = 0; i < tokens.bad; i++) {
    res += s.failure_icon
  }
  if(res) res = ' '+res;
  return res;
}

function getTeamColor(team) {
  if(!team) return NO_TEAM_COLOR;
  else if(team === 'R') return RED_TEAM_COLOR;
  else if(team === 'B') return BLUE_TEAM_COLOR;
  else console.error('Invalid team: '+team);
}
 
function updateMembersDOM() {
  //DOM.secretWordsDisplay.innerText = members.length+' '+s.player_count;
  DOM.membersList.innerHTML = '';
  members.sort(compareMembers).forEach(member =>
    DOM.membersList.appendChild(createMemberElement(member)));
}

function compareMembers(m1,m2) {
  if(!m1.team){
    if(m2.team) return 1;
    else return 0;
  } else{
    return m1.team.localeCompare(m2.team);
  }
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
  if(text.includes('\n')){
    let messages = text.split('\n');
    for (var i = 0; i < messages.length; i++) {
      addMessageToListDOM(messages[i], member);
    }
    return;
  }
  const el = document.createElement('div');
  if(member) el.appendChild(createMemberElement(member));
  el.appendChild(document.createTextNode(text));
  el.className = 'message';
  
  addElementToListDOM(el);
}

//Getting codes
codeButton.addEventListener("click", function () {
  if(code.length === 0){
    sendMessage('codeDrawn');
    randomiseCode();
    addMessageToListDOM(s.your_code_is + ' ' + code);
    updateDescriptions(false);
    codeButton.text = s.reveal_code;
    if(!rulesShown){
      addMessageToListDOM(s.hint_rules);
      rulesShown = true;
    }
  } else{
    alert(s.already_have_code+'\n'+code);
    /*sendMessage('codeReveal', {'code':code}); //TODO get rid of this
    codeButton.text = s.draw_code;
    updateDescriptions(true);
    code = [];
    DOM.modeSwapButton.style.display = 'none';*/
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
      DOM.descriptions[i].innerHTML = s.hint_for + ' "' + words[code[i]-1] + '":';
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
    DOM.redButton.innerHTML = s.switch_to_R;
    DOM.blueButton.innerHTML = s.switch_to_B;
    updateTeamStyle(team);
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
}

function updateTeamStyle(team) {
  if(team === 'R') {
    secretWordsDisplay.style.backgroundColor = RED_BACKGROUND;
  }
  else if(team=='B') {
    secretWordsDisplay.style.backgroundColor = BLUE_BACKGROUND;
    //document.body.style.backgroundColor = BLUE_BACKGROUND;
  }
  else alert('Invalid team '+team);
}

//Rerolling words

DOM.rerollButton.addEventListener("click",askAboutReroll);

function askAboutReroll() {
  let ans = prompt(s.ask_for_reroll);
  if(ans && rerollsLeft>0){
    let number = Math.floor(Number(ans));
    if(isNaN(number)) alert(s.enter_a_number);
    else if(number>NUMER_OF_WORDS || number<1){
      alert(s.number_must_be_between+' '+1+' '+s.between_and+' '+NUMER_OF_WORDS);
    } else{
      reroll(number);
    }
  }else if(rerollsLeft<=0){
    alert(s.reroll_used_by_teammate);
  }
}

function reroll(word) {
  let newWord = rerollWordPool[Math.floor(Math.random()*rerollWordPool.length)].toUpperCase();
  sendMessage('rerollUsed',{'wordNumber':word, 'newWord':newWord, 'team':team});
}


//Starting a new game

resetButton.addEventListener("click", newGame);

function newGame() {
  if (confirm(s.confirm_reset)) {
    var newWordsRed = pickNoDuplicates(wordPool,NUMER_OF_WORDS*2).map(s=>s.toUpperCase());
    var newWordsBlue = newWordsRed.splice(0,NUMER_OF_WORDS);
    var newStartingTeam = Math.random()<0.5 ? 'R' : 'B';
    sendMessage('newGame', {'wordsRed':newWordsRed, 'wordsBlue':newWordsBlue, 'startingTeam':newStartingTeam});
  }
}

function receiveNewGame(data) {
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
  if(team === 'R') {
    words = data.wordsRed;
    secretWordsDisplay.style.backgroundColor = RED_BACKGROUND;
  }
  if(team === 'B')  {
     words = data.wordsBlue;
     secretWordsDisplay.style.backgroundColor = BLUE_BACKGROUND;
  }
  

  if(team){
    rerollsLeft = REROLLS_PER_GAME;
    updateRerollButton();  
  }  

  addMessageToListDOM(s['starts_'+data.startingTeam]);
  resetGameState(data.startingTeam);
  gs.received = true;
  gs.roundState = RS.START;

  updateWordsDisplay();
  updateMembersDOM();
  updateHintTable();
}

function resetGameState(startingTeam) {
  if(!startingTeam) startingTeam = '';
  gs.round = 1;
  gs.startingTeam = startingTeam;
  gs.currentTeam  = startingTeam;
  gs.roundState = RS.NO_GAME;
  gs.tokens = {R:{good:0,bad:0}, B:{good:0,bad:0}};
  gs.hintHistory = {last:[],R:[],B:[]};
  repeat(NUMER_OF_WORDS, ()=>gs.hintHistory.R.push([]), ()=>gs.hintHistory.B.push([]));
}

function updateWordsDisplay() {
  let wordsDisplay = '';
  if(team){
    wordsDisplay += s.secret_words + ': ';  
    for (var i = 0; i < words.length; i++) {
      wordsDisplay += (i+1).toString() + ':' + words[i];
      if(i !== words.length-1) wordsDisplay += '  |  ';
    }  
  } else 
  
  //Add game status:
  wordsDisplay += '\n\n'+ s.status+': ';
  if([0,4,5].includes(gs.roundState)) wordsDisplay+= s['status_'+gs.roundState];
  else wordsDisplay+= s['status_'+gs.roundState+'_'+gs.currentTeam];

  wordsDisplay += '\n'+s.round+': '+gs.round+'/'+NUMBER_OF_ROUNDS;

  DOM.secretWordsDisplay.innerText = wordsDisplay;
}

function updateRerollButton(){
  if(rerollsLeft > 0){
    DOM.rerollButton.style.display = 'block';
    DOM.rerollButton.text = s.reroll+' ('+rerollsLeft+')';
  } else{
    DOM.rerollButton.style.display = 'none';
  }
  
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
  return(res.flat());
}

//Round progression

function nextState() {
  addMessageToListDOM('Incrementing state: '+gs.roundState);
  if(gs.roundState === RS.NO_GAME) return;
  gs.roundState++;

  if(gs.round === 1 && gs.roundState === RS.HINT_GIVEN) {
    gs.roundState++;  //Enemy team doesn't guess in round 1
  }

  if(gs.roundState === RS.HINT_GIVEN){
    if(gs.currentTeam === team) addMessageToListDOM(s.enemy_time_to_guess_ally);
    else addMessageToListDOM(s.your_time_to_guess_enemy);
  }

  if(gs.roundState === RS.ENEMY_GUESSED){
    if(gs.currentTeam === team) addMessageToListDOM(s.your_time_to_guess_ally);
    else addMessageToListDOM(s.enemy_time_to_guess_enemy);
  }

  if(gs.roundState === RS.ROUND_END){
    gs.currentTeam = otherTeam(gs.currentTeam);
    gs.roundState = RS.START;
    if(gs.startingTeam === gs.currentTeam){
      gs.round++;
      addMessageToListDOM(s.round_start1+' '+gs.round+' '+s.round_start2);
      gs.startingTeam = otherTeam(gs.startingTeam);
      gs.currentTeam = gs.startingTeam;
      forceGuessMode = false;
      if(gs.round > NUMBER_OF_ROUNDS) endGame('');
    }
  }

  updateWordsDisplay();
  addMessageToListDOM('New state: '+gs.roundState);
}

//Guess processing

function processGuesses(code) {
  var currentTeam = gs.currentTeam;
  var opponents = otherTeam(currentTeam); 
  if(gs.round > 1 && guesses[opponents].toString() === code.toString()) {
    gs.tokens[opponents].good++;
    addMessageToListDOM(s['gains_intercept_'+opponents]+': '+s.intercept_icon);
  }
  if(guesses[currentTeam].toString() !== code.toString()) {
    gs.tokens[currentTeam].bad++;  
    addMessageToListDOM(s['gains_failure_'+currentTeam]+': '+s.failure_icon);
  }
  updateMembersDOM();
  var hints = gs.hintHistory.last;
  console.log(hints);
  console.log(code);
  for (var i = 0; i < code.length; i++) {
    addHintToTable(hints[i],currentTeam,code[i]-1);
    gs.hintHistory[currentTeam][code[i]-1].push(hints[i]);
  }
}

function addHintToTable(hint,team,wordPos) {
  var cell = hintTable.rows[1].cells[wordPos+(team==='R'? 0:4)]
  if(!cell.innerHTML) cell.innerHTML = hint;
  else cell.innerHTML = cell.innerHTML+'\n\n'+hint;  
}

function updateHintTable(team) {
  if(!team){
    updateHintTable('R');
    updateHintTable('B');
  }else{
    const offset = team==='R' ? 0 : 4;
    for (var i = 0; i < NUMER_OF_WORDS; i++) {
      var cell = hintTable.rows[1].cells[i+offset];
      cell.innerHTML = '';
      for (var j = 0; j < gs.hintHistory[team][i].length; j++) {
        console.log('Updating cell '+(i+offset)+' with '+gs.hintHistory[team][i][j]);
        addHintToTable(gs.hintHistory[team][i][j], team, i);
      }
    }  
  }  
}



//Ending the game
function endGame(winningTeam) {
  gs.roundState = RS.NO_GAME;
  if(winningTeam) addMessageToListDOM(s['game_end_'+winningTeam]);
  else {
    var pointDifference = (gs.tokens.R.good - gs.tokens.R.bad) - (gs.tokens.B.good - gs.tokens.B.bad);
    if(pointDifference === 0) addMessageToListDOM(s.game_end_tie); //TODO further tiebreaker  
    else if(pointDifference > 0) endGame('R');
    else if(pointDifference < 0) endGame('B');    
  }
}

function checkForTokenVictory() {
  var blueWin = false;
  var redWin = false;
  if(gs.tokens.R.good >= TOKENS_NEEDED) redWin  = true;
  if(gs.tokens.R.bad >= TOKENS_NEEDED)  blueWin = true;
  if(gs.tokens.B.good >= TOKENS_NEEDED) blueWin = true;
  if(gs.tokens.B.bad >= TOKENS_NEEDED)  redWin  = true;

  if(redWin && blueWin) endGame('');
  else if(redWin) endGame('R');
  else if(blueWin) endGame('B');
}

//Sending messages
DOM.form.addEventListener('submit', sendFormMessage);

function sendFormMessage() {
  if(code.length === 0 || forceGuessMode){ //Sending a guess
    if((gs.roundState === RS.ENEMY_GUESSED && gs.currentTeam === team)
      || (gs.roundState === RS.HINT_GIVEN && gs.currentTeam !== team && gs.round>1)){
        sendMessage('guess', DOM.inputs.map(i=>i.value).map(x=>isNaN(x) ? words.findIndex(y=>wordsEqual(x,y)) : x));
    }else{
      alert(s.not_your_turn);
    }
    
  } else { //Sending a hint
    if(gs.roundState === RS.START && gs.currentTeam === team){
      sendMessage('hint', DOM.inputs.map(i=>i.value));
      updateDescriptions(true);
      forceGuessMode = true;
      isHintGiver = true;
    }else{
      alert(s.not_your_turn);
    }    
  }

  DOM.inputs.forEach(i=>i.value='');  
}

function wordsEqual(word1, word2) {
  return word1.toString().toUpperCase() === word2.toString().toUpperCase();
}

function sendMessage(type, content) {
  drone.publish({
    room: ROOM_NAME,
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
      gs.received = true;
    }
  	updateMembersDOM(); 
	});
	 
	// User joined the room
	room.on('member_join', member => {
	  members.push(member);
    addMessageToListDOM(s.joined_game, member); 
    if(gs.received){
      gs.memberData = members;
      sendMessage('welcome', gs);  
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
          gs.hintGiver = member;
          gs.hintHistory.last = data.content;

          gs.roundState = RS.START; //Reset progress from previous hint if present
          nextState();
          break;
        case 'guess': //Sent when a player makes a guess
          addMessageToListDOM(s.sends_guess+': '+data.content, member); //TODO make sure it's valid
          guesses[member.team] = data.content;
          nextState();
          if(isHintGiver && gs.roundState == RS.ALLY_GUESSED){
            isHintGiver = false;            
            sendMessage('codeReveal', {'code':code});
            codeButton.text = s.draw_code; //TODO remove this phase of the button
            updateDescriptions(true);
            code = [];
            DOM.modeSwapButton.style.display = 'none';            
          }
          break;
        case 'codeDrawn':
          addMessageToListDOM(s.draws_code, member); 
          if(member.team === team && rerollsLeft>0){
            rerollsLeft = 0;
            addMessageToListDOM(s.rerolls_gone);
            updateRerollButton();
          }
          break;
        case 'codeReveal': //Sent when a secret code is revealed
          addMessageToListDOM(s.reveals_code+': '+data.content.code, member); 
          processGuesses(data.content.code);
          checkForTokenVictory();
          nextState();
          break;
        case 'newGame': //Sent when a new game is started
          addMessageToListDOM(s.started_new_game, member);
          receiveNewGame(data.content);
          break;
        case 'teamSwitch': //Sent when a player joins a team - *not* when they decide they'll switch next game
          member.team = data.content;
          addMessageToListDOM(s['joins_'+data.content], member);
          updateMembersDOM();
          break;
        case 'rerollUsed': //sendMessage('rerollUsed',{'wordNumber':word, 'newWord':newWord, 'team':team});
          if(data.content.team === team && rerollsLeft>0){
            rerollsLeft -= 1;
            addMessageToListDOM(s.rerolls_from+' '+words[data.content.wordNumber-1].toUpperCase()+' '+s.rerolls_to+' '+data.content.newWord.toUpperCase(), member);
            words[data.content.wordNumber-1] = data.content.newWord;            
            updateWordsDisplay();
            updateRerollButton();
          } else if(data.content.team === team){
            addMessageToListDOM(s.reroll_failed, member);
          }
          break;
        case 'requestWords': //Sent when a player has just joined the game and picked a team to request that team's words
          if(data.content === team && words.length>0){
            sendMessage('welcomeWords', {'words':words,'team':team, 'rerolls':rerollsLeft});
          }
          break;
        case 'welcomeWords': //Sent in response to requestWords; it delivers the words and amount of rerolls
          if(data.content.team === team && words.length === 0){
            words = data.content.words;
            updateWordsDisplay();

            rerollsLeft = data.content.rerolls;
            updateRerollButton();
          }
          break;
        case 'welcome': //Sent whenever a new player joins the game, informing them of the game state
          if(!gs.received){
            gs = data.content;
            let memberData = gs.memberData;
            for (var i = 0; i < memberData.length; i++) {
              getMember(memberData[i]).team = memberData[i].team;
            }
            updateRerollButton();
            updateHintTable();
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