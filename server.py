from flask import *
from flask_socketio import *
import json
import os

template_path = os.path.abspath('public/')
app = Flask(__name__, template_folder=template_path)
app.config['SECRET_KEY'] = 'ohiofanumtaxrizzlerhio' #ohio sandwich
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16MB
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=16 * 1024 * 1024)


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/fight")
def fight():
    return render_template("fight.html")

@socketio.on('send_js_code')
def send_js(js_code, room=None, sid=None, isGlobal=False):
    if isGlobal:
        emit('execute_js', js_code, broadcast=True)
    elif room!=None:
        emit('execute_js', js_code, to=room)
    elif sid!=None:
        emit('execute_js', js_code, room=sid)
    else:
        print("unable to send js anywhere, code: ", js_code)


@socketio.on("OnConnectLobby")
def userConncted(username):
    send_js(f'''console.log("{username} has connected to the lobby");''', room=1) #Only displays in the lobby

@socketio.on("OnConnectFight")
def userConncted(data):
    roomCode = data["fightCode"]
    username = data["username"]
    isPlayer1 = data["isPlayer1"]
    with open("fights.json", "r") as f:
        fights = json.load(f)
        fightData = fights[roomCode]

    send_js(f'''console.log("{username} has connected to the Fight");handle_game_state({fightData}, "{isPlayer1}", "{username}")''', room=roomCode) #Only gets sent to player 1 to load player 2's data


@socketio.on("join")#Used for joining the lobby
def joinGame(data):
    try:
        gameRoom = data["joinGame"]
        join_room(gameRoom)
    except:
        send_js('''console.log("Invalid room number")''', sid=request.sid)

@socketio.on("joinFight")#Used for joining a fight
def joinFight(data):
    gameRoom = data["gameCode"]

    if len(gameRoom) != 5 or not gameRoom.isalnum():
        send_js('''console.log("Invalid room number")''', sid=request.sid)
        return

    isPlayer1 = True

    #Check if they are player 1 or 2
    with open("fights.json", "r") as f:
        fights = json.load(f)
    
    if gameRoom in fights:
        #Game exists, check if it has a player already present for resuability
        if fights[gameRoom]["player1"] == "None":
            #Player 1 is empty, assign them to player 1
            fights[gameRoom]["player1"] = {
                "name": data["username"],
                "data": [100, 100, gameRoom, [data["cursorInside"], data["cursorOutline"]]]
            }
        elif fights[gameRoom]["player2"] == "None":
            #Player 2 is empty, assign them to player 2
            fights[gameRoom]["player2"] = {
                "name": data["username"],
                "data": [100, 100, gameRoom, [data["cursorInside"], data["cursorOutline"]]]
            }
            isPlayer1 = False
        else:
            #Game is full, send error message
            send_js('''console.log("Game is full")''', sid=request.sid)
            return

        #Save the game state
        with open("fights.json", "w") as f:
            json.dump(fights, f)
    else:
        #Game doesn't exist, create it and assign player 1 to first person connecting
        fights[gameRoom] = {
            "player1": {
                "name": data["username"],
                "data": [0, 0, gameRoom, [data["cursorInside"], data["cursorOutline"]]]
            },
            "player2": "None"
        }

        with open("fights.json", "w") as f:
            json.dump(fights, f)
        
    send_js(f'''console.log("Joining fight {gameRoom}");localStorage.setItem("fightCode", {gameRoom});localStorage.setItem("player", "{isPlayer1}");window.location.href = "/fight"''', sid=request.sid)

@socketio.on("connectFight") #Used for connecting to a fight
def connectFight(data):
    gameRoom = data["fightCode"]
    username = data["username"]
    with open("fights.json", "r") as f:
        fights = json.load(f)

    if not gameRoom in fights:
        #Game doesn't exist, send error message
        send_js('''window.location.href="/"''', sid=request.sid)
        return
    
    join_room(gameRoom)

@socketio.on("updateGameState")
def updateGameState(data):
    gameRoom = data["fightCode"]
    gameData = data["GameData"]
    isPlayer1 = data["isPlayer1"]
    
    with open("fights.json", "r") as f:
        fights = json.load(f)
        if isPlayer1 == "True":
            fights[gameRoom]["player1"]["data"] = gameData
        elif isPlayer1 == "False":
            fights[gameRoom]["player2"]["data"] = gameData
        
    with open("fights.json", "w") as f:
        json.dump(fights, f)

#Handle movement
@socketio.on("updateSecondPosition")
def sendSecondPosToFirst(pos):
    socketio.emit("SecondPos", pos, room=pos[2])

@socketio.on("updateFirstPosition")
def sendFirstPosToSecond(pos):
    socketio.emit("FirstPos", pos, room=pos[2])

@socketio.on("attackPlayer")
def sendPlayerAttack(data):
    gameRoom = data["fightCode"]
    attackData = data["attackData"]
    attackData.append(data["isPlayer1"])

    #Now deadass we just send the attack to the other player, simple...
    socketio.emit("receiveAttack", attackData, room=gameRoom)

@socketio.on("UpdatePlayerHealth")
def updatePlayerHealth(data):
    gameRoom = data[0]
    playerDamaged = data[1]
    health = data[2]

    socketio.emit("updateHealth", [playerDamaged, health], room=gameRoom)

@socketio.on("fightEnd")
def removeFight(data):
    gameRoom = data["fightCode"]
    #Can just assume it exists if we are tryung to remove it
    with open("fights.json", "r") as f:
        fights = json.load(f)
    if gameRoom in fights:
        fights.remove(gameRoom)
        with open("public/fights.json", "w") as f:
            json.dump(fights, f)


if __name__ == "__main__":
    socketio.run(app, debug=True, port=80, host="0.0.0.0")