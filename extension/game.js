(() => {
"use strict";
const SIZE=4,WIN_TILE=2048,STORAGE_KEY="mergefrenzy:v2",BEST_KEY="mergefrenzy:best";
const boardEl=document.querySelector("#board"),scoreEl=document.querySelector("#score"),bestEl=document.querySelector("#best"),movesEl=document.querySelector("#moves"),statusEl=document.querySelector("#status");
const overlayEl=document.querySelector("#overlay"),overlayTitle=document.querySelector("#overlayTitle"),overlayMessage=document.querySelector("#overlayMessage"),overlayButton=document.querySelector("#overlayButton");
let state=createInitialState(),history=[],touchStart=null;
function createEmptyBoard(){return Array.from({length:SIZE},()=>Array(SIZE).fill(0))}
function createInitialState(){const board=createEmptyBoard();addRandomTile(board);addRandomTile(board);return{board,score:0,moves:0,won:false,gameOver:false}}
function cloneState(v){return JSON.parse(JSON.stringify(v))}
function isValidBoard(board){return Array.isArray(board)&&board.length===SIZE&&board.every(row=>Array.isArray(row)&&row.length===SIZE&&row.every(v=>Number.isInteger(v)&&v>=0&&v<=131072&&(v===0||(v&(v-1))===0)))}
function isValidState(c){return c&&isValidBoard(c.board)&&Number.isFinite(c.score)&&c.score>=0&&Number.isInteger(c.moves)&&c.moves>=0&&typeof c.won==="boolean"&&typeof c.gameOver==="boolean"}
function getBestScore(){try{return Math.max(0,Number(localStorage.getItem(BEST_KEY))||0)}catch(_){return 0}}
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY),parsed=raw?JSON.parse(raw):null;if(isValidState(parsed))return parsed}catch(_){}return createInitialState()}
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));localStorage.setItem(BEST_KEY,String(Math.max(getBestScore(),state.score)))}catch(_){}}
function addRandomTile(board){const empty=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(board[r][c]===0)empty.push([r,c]);if(!empty.length)return false;const [r,c]=empty[Math.floor(Math.random()*empty.length)];board[r][c]=Math.random()<.9?2:4;return true}
function slideLine(line){const values=line.filter(Boolean),out=[],gained=0;let score=gained;for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){const merged=values[i]*2;out.push(merged);score+=merged;i++}else out.push(values[i])}while(out.length<SIZE)out.push(0);return{line:out,gained:score}}
function move(direction){
 if(state.gameOver)return false;
 const before=cloneState(state),next=createEmptyBoard();let gained=0;
 for(let i=0;i<SIZE;i++){
  let source=direction==="left"||direction==="right"?state.board[i].slice():state.board.map(row=>row[i]);
  if(direction==="right"||direction==="down")source.reverse();
  const result=slideLine(source);let line=result.line;gained+=result.gained;
  if(direction==="right"||direction==="down")line.reverse();
  for(let j=0;j<SIZE;j++){if(direction==="left"||direction==="right")next[i][j]=line[j];else next[j][i]=line[j]}
 }
 if(JSON.stringify(next)===JSON.stringify(state.board))return false;
 history.push(before);if(history.length>50)history.shift();
 state.board=next;state.score+=gained;state.moves++;addRandomTile(state.board);
 if(!state.won&&state.board.some(row=>row.includes(WIN_TILE))){state.won=true;setStatus("2048 reached. Keep going!")}
 else if(!hasMoves(state.board)){state.gameOver=true;showOverlay("Game over",`Final score: ${state.score.toLocaleString()}`)}
 else setStatus(gained?`+${gained.toLocaleString()} points`:"Good move.");
 saveState();render();return true
}
function hasMoves(board){for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){if(board[r][c]===0)return true;if(c+1<SIZE&&board[r][c]===board[r][c+1])return true;if(r+1<SIZE&&board[r][c]===board[r+1][c])return true}return false}
function undo(){const previous=history.pop();if(!previous){setStatus("Nothing to undo.");return}state=previous;hideOverlay();saveState();render();setStatus("Move undone.")}
function shuffle(){if(state.gameOver)return;const values=state.board.flat().filter(Boolean);if(values.length<2)return;history.push(cloneState(state));for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]]}let k=0;for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(state.board[r][c]!==0)state.board[r][c]=values[k++];state.moves++;saveState();render();setStatus("Board shuffled.")}
function newGame(){state=createInitialState();history=[];hideOverlay();saveState();render();setStatus("New game started.");boardEl.focus()}
function render(){boardEl.replaceChildren();for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){const value=state.board[r][c],tile=document.createElement("div");tile.className="tile";tile.dataset.value=String(value);tile.textContent=value?String(value):"";tile.setAttribute("aria-label",value?`Tile ${value}`:"Empty");boardEl.appendChild(tile)}scoreEl.textContent=state.score.toLocaleString();bestEl.textContent=Math.max(getBestScore(),state.score).toLocaleString();movesEl.textContent=String(state.moves)}
function setStatus(message){statusEl.textContent=message}
function showOverlay(title,message){overlayTitle.textContent=title;overlayMessage.textContent=message;overlayEl.classList.remove("hidden");overlayButton.focus()}
function hideOverlay(){overlayEl.classList.add("hidden")}
function handleKey(key){const m={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",a:"left",d:"right",w:"up",s:"down"};if(m[key]){move(m[key]);return true}return false}
document.addEventListener("keydown",e=>{if(handleKey(e.key)){e.preventDefault();boardEl.focus()}});
boardEl.addEventListener("touchstart",e=>{const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY}},{passive:true});
boardEl.addEventListener("touchend",e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;handleKey(Math.abs(dx)>Math.abs(dy)?(dx>0?"ArrowRight":"ArrowLeft"):(dy>0?"ArrowDown":"ArrowUp"))},{passive:true});
document.querySelectorAll("[data-direction]").forEach(b=>b.addEventListener("click",()=>move(b.dataset.direction)));
document.querySelector("#newGameButton").addEventListener("click",newGame);document.querySelector("#undoButton").addEventListener("click",undo);document.querySelector("#shuffleButton").addEventListener("click",shuffle);overlayButton.addEventListener("click",newGame);
state=loadState();if(state.gameOver)showOverlay("Game over",`Final score: ${state.score.toLocaleString()}`);render();
})();