import mysql from 'mysql2/promise';
import uWS from 'uWebSockets.js';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import signature from 'cookie-signature';
const saltRounds = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConnection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cursor_fight',
});


/*try{
    const [results, fields] = await dbConnection.query(
        'SELECT * FROM userdata WHERE id = ?',
        [3]
    )
} catch (error) {
    console.error('Error executing query:', error);
}*/

const clients = new Set();
const sessionStore = new Map();
const rooms = new Map();

const secret = crypto.randomBytes(64).toString('hex');
const cookieName = 'session_id';

let nextID = 1;

function checkCollision(a, b) {
    return !(
        ((a.y + a.height) < (b.y)) ||
        (a.y > (b.y + b.height)) ||
        ((a.x + a.width) < b.x) ||
        (a.x > (b.x + b.width))
    );
}

function generateSessionID() {
	return crypto.randomBytes(16).toString('hex');
}

function setSessionCookie(res, sessionData) {
    const sessionID = generateSessionID();
    const signedSessionID = signature.sign(sessionID, secret);
    sessionStore.set(sessionID, sessionData);
    return sessionID;
}


function getSessionIDFromCookie(cookieHeader) {
    if (!cookieHeader) return null;
    
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
            cookies[key] = value;
        }
    });
    
    if (!cookies[cookieName]) return null;
    
    const signed = cookies[cookieName];
    if (!signed.startsWith("s:")) return null;
    
    const sessionID = signature.unsign(signed.slice(2), secret);
    return sessionID || null;
}

function getSession(req){
	const cookie = req.getHeader('cookie');
	const sessionID = getSessionIDFromCookie(cookie);
	if(!sessionID) return null;
	return sessionStore.get(sessionID);
}

function encodeMessage(type, message) {
	return JSON.stringify({ type: type, message: message });
}

async function logoutUser(ws, username){
	if(!username || username == "Guest" || username == undefined || username == null){ 
		//Means they dont have an account
		ws.send(encodeMessage("logoutMessage", {
			message: "You tried to logout without being logged in.",
			type: "error" //Used to just reload the page so it updates
		}))
		return;
	}

	const [userID] = await dbConnection.execute(
		'SELECT id FROM login WHERE username = ?',
		[username]
	);
	if(userID.length === 0){
		console.error("User not found:", username);
		return;
	}

	const sessionID = Array.from(sessionStore.keys()).find(key => sessionStore.get(key) === username);
	if(sessionID){
		sessionStore.delete(sessionID);
		ws.send(encodeMessage("logoutMessage", {
			message: "You have been logged out successfully.",
			type: "success"
		}));
	}
}

async function retrieveUserData(ws, username){
	const [userID] = await dbConnection.execute(
		'SELECT id FROM login WHERE username = ?',
		[username]
	);

	if(userID.length === 0){
		console.error("User not found:", username);
		return null;
	}

	const results = await dbConnection.execute(
		'SELECT * FROM userdata WHERE id = ?',
		[parseInt(userID[0].id, 10)]
	)

	if(results.length > 0){
		ws.send(encodeMessage("accountDataMessage", {
			id: userID[0].id,
			wins: results[0][0].wins,
			losses: results[0][0].losses,
			coins: results[0][0].coins,
			exp: results[0][0].exp,
			exp_required: results[0][0].exp_required,
			level: results[0][0].level,
			username: username
		}))
	}
	
}

function checkWin(room){
	if(!room || !room.playerData || room.playerData.size < 2) return;

	const player1 = room.playerData.get("player1");
	const player2 = room.playerData.get("player2");

	if(player1.health <= 0){
		player2.points += 1;
		player1.health = 3;
		player2.health = 3;
		player1.lastAtk = Date.now();
		player2.lastAtk = Date.now();
		player1.invincible = false;
		player2.invincible = false;
		player1.canAtk = true;
		player2.canAtk = true;

		if(player2.points >= 3){
			//PLAYER 2 WON THE GAME!!!
			player2.ws.send(encodeMessage("roundMessage", {type: "game", id: "YOU"}));
			player1.ws.send(encodeMessage("roundMessage", {type: "game", id: "not you"}));
			rooms.delete(room.playerData.get("player1").ws.userData.roomCode);
			player1.ws.close(100, "Game Over - You Lost!");
			player2.ws.close(100, "Game Over - You Won!");
			return;
		}
		player2.ws.send(encodeMessage("roundMessage", {type: "round", id: "YOU"}));
		player1.ws.send(encodeMessage("roundMessage", {type: "round", id: "not you"}));
		return;
	}

	if(player2.health <= 0){
		player1.points += 1;
		player1.health = 3;
		player2.health = 3;
		player1.lastAtk = Date.now();
		player2.lastAtk = Date.now();
		player1.invincible = false;
		player2.invincible = false;
		player1.canAtk = true;
		player2.canAtk = true;
		
		if(player1.points >= 3){
			//PLAYER 1 WON THE GAME!!!
			player2.ws.send(encodeMessage("roundMessage", {type: "game", id: "not you"}));
			player1.ws.send(encodeMessage("roundMessage", {type: "game", id: "YOU"}));
			rooms.delete(room.playerData.get("player1").ws.userData.roomCode);			
			player1.ws.close(100, "Game Over - You Won!");
			player2.ws.close(100, "Game Over - You Lost!");
			return;
		}

		player1.ws.send(encodeMessage("roundMessage", {type: "round", id: "YOU"}));
		player2.ws.send(encodeMessage("roundMessage", {type: "round", id: "not you"}));
		return;
	}
}

uWS.App()
	.get('/', (res, req) => {
		const html = fs.readFileSync(path.join(__dirname, 'index.html'));
		res.writeHeader('Content-Type', 'text/html');
		res.end(html);
	})
	.get('/account', (res, req) => {
		const html = fs.readFileSync(path.join(__dirname, 'account.html'));
		res.writeHeader('Content-Type', 'text/html');
		res.end(html);
	})
	.get('/fight', (res, req) => {
		const html = fs.readFileSync(path.join(__dirname, 'fight.html'));
		res.writeHeader('Content-Type', 'text/html');
		res.end(html);
	})
.get('/public/*', (res, req) => {
	const urlPath = req.getUrl().replace('/public/', '');
	const filePath = path.join(__dirname, 'public', urlPath);

	// Check if file exists
	if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
		const ext = path.extname(filePath);
		const mimeTypes = {
			'.js': 'application/javascript',
			'.css': 'text/css',
			'.png': 'image/png',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.svg': 'image/svg+xml',
			'.json': 'application/json'
		};

		res.writeHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
		res.end(fs.readFileSync(filePath));
	} else {
		res.writeStatus('404 Not Found').end('File not found');
	}
}).any('/*', (res, req) => {
	const html = fs.readFileSync(path.join(__dirname, '404.html'))
	res.writeStatus('404 Not Found')
	res.writeHeader('Content-Type', 'text/html');
	res.end(html)
})

	.ws('/*', {
		open: (ws) => {
        
            ws.userData = { //Store user id for later use
                id: nextID++,
				closed: false
            };
            clients.add(ws); //Add to global chat (normally just the lobby)
		
        },
		message: (ws, message, isBinary) => {
            const id = ws.userData.id;
			const data = JSON.parse(Buffer.from(message).toString());
			if(data.type == "gimmeSomeMothfuckinID"){
				if(data.sessionID){
					if(sessionStore.has(data.sessionID)){
					//Called if they are logged in.
					const sessionData = sessionStore.get(data.sessionID);
					ws.userData.username = sessionData;
					(async () => {
						try {
							await retrieveUserData(ws, ws.userData.username);
						} catch (error) {
							console.error("Error retrieving user data:", error);
							ws.send(encodeMessage("accountDataMessage", {
								type: "error"
							}));
						}
					})();
				}else{
					ws.send(encodeMessage("accountDataMessage", {
						type: "error"
					}))
				}
			}else{
					ws.userData.username = "Guest"
				}
				ws.send(encodeMessage("assignID", {id: id, username: ws.userData.username}));
			}
			if(data.type == "joinFight"){
				ws.userData.roomCode = data.message.roomCode;
				if(data.message.sessionID !== null){//If null they have no account so doesnt matter
					if(!data.message.sessionID || !sessionStore.has(data.message.sessionData)){
						ws.send(encodeMessage("FightJoinFail", {//Update soon
							message: "Your session has expired, please login again.",
							type: "error"
						}))
					}
				}
				if(!data.message.roomCode || data.message.roomCode.length !== 5){
					ws.send(encodeMessage("FightJoinFail", {
						message: "Invalid room code",
						type: "error"
					}));
					return;
				}

				if(!rooms.has(data.message.roomCode)){
					rooms.set(data.message.roomCode, {
						playerData: new Map()
					})
				}else{
					const room = rooms.get(data.message.roomCode);

					if(room.playerData.has("player1")){
						const p1 = room.playerData.get("player1")
						if(!p1){
							return;
						}
						if(p1.ws.userData.closed || p1.ws.userData.closed == undefined){
							room.playerData.delete("player1")
						}}
					if(room.playerData.has("player2")){
						const p2 = room.playerData.get("player2")
						if(!p2){
							return;
						}
						if(p2.ws.userData.closed || p2.ws.userData.closed == undefined){
							room.playerData.delete("player2")
						}
					}
				}
				const room = rooms.get(data.message.roomCode);

				//Room already exists
				if(room.playerData.size >= 2){
					ws.send(encodeMessage("FightJoinFail", {
						message: "Room is full",
						type: "error"
					}));
					return;
				}else if(room.playerData.size == 1){

					if(room.playerData.has("player1")){
						//Add new player as player 2
						room.playerData.set("player2", {
							ws: ws,
							x: 0,
							y: 0,
							username: ws.userData.username,
							cursor: [data.message.cursorColour[0], data.message.cursorColour[1]],
							health: 3,
							canAtk: true,
							lastAtk: Date.now(),
							invincible: false,
							points: 0,
						})
						//send player 1 data to player 2
						const p1Data = {
							x: room.playerData.get('player1').x,
							y: room.playerData.get('player1').y,
							username: room.playerData.get('player1').username,
							cursor: room.playerData.get('player1').cursor,
							health: room.playerData.get('player1').health,
							canAtk: room.playerData.get('player1').canAtk,
							lastAtk: room.playerData.get('player1').lastAtk,
							invincible: room.playerData.get('player1').invincible,
							points: room.playerData.get('player1').points
						};
						const p2Data = {
							x: room.playerData.get('player2').x,
							y: room.playerData.get('player2').y,
							username: room.playerData.get('player2').username,
							cursor: room.playerData.get('player2').cursor,
							health: room.playerData.get('player2').health,
							canAtk: room.playerData.get('player2').canAtk,
							lastAtk: room.playerData.get('player2').lastAtk,
							invincible: room.playerData.get('player2').invincible,
							points: room.playerData.get('player2').points
						};
						ws.send(encodeMessage("fightJoinMessage", {
							playerData: p1Data
						}))
						const p1 = room.playerData.get("player1")

						//send player 2 data to player 1
						p1.ws.send(encodeMessage("fightJoinMessage", {
							playerData: p2Data
						}))
					}else{
						ws.send(encodeMessage("FightJoinFail", {
							message: "Error joining room",
							type: "error"
						}));
						room.playerData.delete("player1");
						room.playerData.delete("player2");
					}
				}else if(room.playerData.size == 0){
					//Add new player as player 1
					room.playerData.set("player1", {
						ws: ws,
						x: 0,
						y: 0,
						username: ws.userData.username,
						cursor: [data.message.cursorColour[0], data.message.cursorColour[1]],
						health: 3,
						canAtk: true,
						lastAtk: Date.now(),
						invincible: false,
						points: 0,
					})
				}
			}
			if(data.type == "logout"){
				logoutUser(ws, ws.userData.username);
			}
			if(data.type == "attack"){
				if(!ws.userData.roomCode || !rooms.has(ws.userData.roomCode)){
					ws.send(encodeMessage("FightJoinFail", {
						message: "You are not in a room",
						type: "error"
					}));
					return;
				}
				const room = rooms.get(ws.userData.roomCode);
				if(!room.playerData.has("player1") && !room.playerData.has("player2")){
					ws.send(encodeMessage("FightJoinFail", {
						message: "Player 2 not found yet",
						type: "error"
					}));
					return;
				}
				if(room.playerData.has("player1") && room.playerData.get("player1").ws === ws){
					//Player 1 attacking, send to player 2
					if(Date.now() - room.playerData.get("player1").lastAtk < 700){
						return;
					}

					if(room.playerData.has("player2")){
						if(room.playerData.get("player2").invincible && Date.now() - room.playerData.get("player2").invincible < 1500){
							return;
						}
						
						room.playerData.get("player2").ws.send(encodeMessage("attackMessage", {
							x: room.playerData.get("player1").x,
							y: room.playerData.get("player1").y,
						}))
						room.playerData.get("player1").lastAtk = Date.now();
						if(room.playerData.get("player2").invincible){
							return;
						}
						const collided = checkCollision({x: room.playerData.get('player2').x,y: room.playerData.get('player2').y,width: 64,height: 64,},{x: room.playerData.get('player1').x,y: room.playerData.get('player1').y,width: 80,height: 80,})
						if(collided){
							room.playerData.get("player2").invincible = Date.now();
							room.playerData.get("player2").health -= 1
							//Ensure users are connected
							if(room.playerData.get("player2").ws.closed === false && room.playerData.get("player1").ws.closed === false){
								room.playerData.get("player2").ws.send(encodeMessage("healthMessage", {
									type: "youWereHit",
									health: room.playerData.get("player2").health
								}))
								room.playerData.get("player1").ws.send(encodeMessage("healthMessage", {
									type: "enemyWasHit",
									health: room.playerData.get("player2").health
								}))
								checkWin(room);
							}
						}
					}

				}else if(room.playerData.has("player2") && room.playerData.get("player2").ws === ws){
					//Player 2 attacking, send to player 1
					if(Date.now() - room.playerData.get("player2").lastAtk < 700){
						return;
					}

					if(room.playerData.has("player1")){
						room.playerData.get("player1").ws.send(encodeMessage("attackMessage", {
							x: room.playerData.get("player2").x,
							y: room.playerData.get("player2").y,
						}))
						if(room.playerData.get("player1").invincible && Date.now() - room.playerData.get("player1").invincible < 1500){
							return;
						}
						room.playerData.get("player2").lastAtk = Date.now();
						const collided = checkCollision({x: room.playerData.get('player1').x,y: room.playerData.get('player1').y,width: 64,height: 64,},{x: room.playerData.get('player2').x,y: room.playerData.get('player2').y,width: 80,height: 80,})
						if(collided){
							if(room.playerData.get("player2").ws.closed === false && room.playerData.get("player1").ws.closed === false){
								room.playerData.get("player1").invincible = Date.now();
								room.playerData.get("player1").health -= 1
								room.playerData.get("player1").ws.send(encodeMessage("healthMessage", {
									type: "youWereHit",
									health: room.playerData.get("player1").health
								}))
								room.playerData.get("player2").ws.send(encodeMessage("healthMessage", {
									type: "enemyWasHit",
									health: room.playerData.get("player1").health
								}))
								checkWin(room);
							}
						}}
					}
				}
			if(data.type == "moveMessage"){
				if(!ws.userData.roomCode || !rooms.has(ws.userData.roomCode)){
					ws.send(encodeMessage("FightJoinFail", {
						message: "You are not in a room",
						type: "error"
					}));
					return;
				}
				const room = rooms.get(ws.userData.roomCode);
				if(!room.playerData.has("player1") && !room.playerData.has("player2")){
					ws.send(encodeMessage("FightJoinFail", {
						message: "You are not in a room",
						type: "error"
					}));
					return;
				}
				if(data.message.x > 1890){
					data.message.x = 1890;
				}
				if(data.message.y > 1050){
					data.message.y = 1050;
				}
				if(data.message.x < 0){
					data.message.x = 0;
				}
				if(data.message.y < 0){
					data.message.y = 0;
				}
				const dataMessage = {
					x: data.message.x,
					y: data.message.y,
				}

				if(room.playerData.get("player1").ws === ws){
					//Player 1 moving, send to player 2
					room.playerData.get("player1").x = data.message.x;
					room.playerData.get("player1").y = data.message.y;
					if(!room.playerData.has("player2")){
						return;
					}
					room.playerData.get("player2").ws.send(encodeMessage("moveMessage", dataMessage));
				}else{
					//Player 2 moving, send to player 1
					room.playerData.get("player2").x = data.message.x;
					room.playerData.get("player2").y = data.message.y;
					room.playerData.get("player1").ws.send(encodeMessage("moveMessage", dataMessage));
				}
			}
			if(data.type == "register"){
				(async () => {	
					try {
						//check if password is longer than 6 chars
						if (data.message.password.length < 6) {
							ws.send(encodeMessage("accountMessage", {
								message: "Password must be at least 6 characters long",
								type: "error"
							}));
							return;
						}

						//check if email is valid
						const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
						if (!regex.test(data.message.email)) {
							ws.send(encodeMessage("accountMessage", {
								message: "Invalid email format",
								type: "error"
							}));
							return;
						}

						if(data.message.username.length < 3 || data.message.username.length > 20){
							ws.send(encodeMessage("accountMessage", {
								message: "Username must be between 3 and 20 characters",
								type: "error"
							}));
							return;
						}

						const hashedPassword = await bcrypt.hash(data.message.password, saltRounds);
						data.message.password = hashedPassword;

						//check if username or email already exists
						const [existingUser] = await dbConnection.execute(
							'SELECT * FROM login WHERE username = ? OR email = ?',
							[data.message.username, data.message.email]
						);

						if (existingUser.length > 0) {
							ws.send(encodeMessage("accountMessage", {
								message: "Username or email already exists",
								type: "error"
							}));
							return;
						}

						await dbConnection.execute(
							'INSERT INTO login (username, password, email) VALUES (?, ?, ?)',
							[data.message.username, data.message.password, data.message.email]
						);

						const userID = await dbConnection.execute(
							'SELECT id FROM login WHERE username = ?',
							[data.message.username]
						)

						await dbConnection.execute(
							'INSERT INTO userdata (id, wins, losses, coins, level, exp_required, exp) VALUES (?, ?, ?, ?, ?, ?, ?)',
							[userID[0][0].id, 0, 0, 0, 1, 100, 0]
						);
						const sessionID = generateSessionID();
						sessionStore.set(sessionID, data.message.username);
						ws.send(encodeMessage("accountMessage", {
							message: {response: "Account created successfully!", username: data.message.username, sessionID: sessionID},
							type: "success"
						}));
					} catch (error) {
						console.error("Account creation error:", error); // optional but useful
						ws.send(encodeMessage("accountMessage", {
							message: "Error creating account",
							type: "error"
						}));
					}
				})();
			}else if(data.type == "login"){
				(async () => {
					try {
						const [user] = await dbConnection.execute(
							'SELECT * FROM login WHERE username = ?',
							[data.message.username]
						);

						if (user.length === 0) {
							console.error("User not found:", data.message.username);
							ws.send(encodeMessage("accountMessage", {
								message: "Username or password is incorrect",
								type: "error"
							}));
							return;
						}

						const isPasswordValid = await bcrypt.compare(data.message.password, user[0].password);
						if (!isPasswordValid) {
							console.error("Invalid password for user");
							ws.send(encodeMessage("accountMessage", {
								message: "Username or password is incorrect",
								type: "error"
							}));
							return;
						}
						const sessionID = generateSessionID();
						sessionStore.set(sessionID, data.message.username);
						ws.send(encodeMessage("accountMessage", {
							message: {response: "Login successful!", username: data.message.username, sessionID: sessionID},
							type: "success"
						}));
					} catch (error) {
						console.error("Login error:", error);
						ws.send(encodeMessage("accountMessage", {
							message: "Error logging in",
							type: "error"
						}));
					}
				})()
			}
		},
		close: (ws) => {
			console.log(`Client ${ws.userData.id} disconnected`);
			ws.userData.closed = true;
			clients.delete(ws);
			if(ws.userData.roomCode && rooms.has(ws.userData.roomCode)) {
				const room = rooms.get(ws.userData.roomCode);
				if(room.playerData.has("player1")){
					const player1 = room.playerData.get("player1");
					if(player1.ws === ws) {
						room.playerData.delete("player1");
						ws.userData.roomCode = null;
					}else{
						player1.ws.send(encodeMessage("clientDisconnect", null));
					}
				}
				if(room.playerData.has("player2")){
					const player2 = room.playerData.get("player2");
					if(player2.ws === ws) {
						room.playerData.delete("player2");
						ws.userData.roomCode = null;
					}else{
						player2.ws.send(encodeMessage("clientDisconnect", null));
					}
				}
				if(room.playerData.size === 0) {
					rooms.delete(ws.userData.roomCode);
				}
			}
            return;
		}
	})

	.listen(80, (token) => {
		if (token) {
			console.log('Listening on http://localhost');
		} else {
			console.log('Failed to listen');
		}
	});
