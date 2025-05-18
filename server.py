from flask import *
from flask_socketio import *
import json
import os
import mysql.connector
import bcrypt
import re

mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  password="FuckGhost44",
  database="users"
)



template_path = os.path.abspath('public/')
app = Flask(__name__, template_folder=template_path)
app.config['SECRET_KEY'] = 'ohiofanumtaxrizzlerhio' #ohio sandwich
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16MB
socketio = SocketIO(app, cors_allowed_origins="*", max_http_buffer_size=16 * 1024 * 1024)

@app.route("/")
def index():
    user_data = {
        "username": "Guest",
        "wins": 0,
        "losses": 0,
        "coins": 0,
        "level": 1,
        "id": 0,
        "exp_required": 100,
        "exp": 0
    }

    if "username" in session:
        print("Session username: ", session["username"])
        
        cursor = mydb.cursor()
        cursor.execute("SELECT id FROM login WHERE username = %s", (session["username"],))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            return render_template("index.html", userData=user_data)
        userId = result[0]
        cursor.execute("SELECT * FROM userdata WHERE id= %s", (userId,))
        result = cursor.fetchone()
        user_data = {
            "username": session["username"],
            "wins": result[0],
            "losses": result[1],
            "coins": result[2],
            "level": result[3],
            "id": result[4],
            "exp_required": result[5],
            "exp": result[6],
        }
        
        if user_data["exp"] >= user_data["exp_required"]:
            #Level up
            user_data["level"] += 1
            user_data["exp"] = 0
            user_data["exp_required"] = int(user_data["exp_required"] * 1.5)
            cursor.execute("UPDATE userdata SET level = %s, exp = %s, exp_required = %s WHERE id = %s", (user_data["level"], user_data["exp"], user_data["exp_required"], userId))
            mydb.commit()

        cursor.close()
        return render_template("index.html", userData=user_data)
    return render_template("index.html", userData=user_data)

@app.route("/fight")
def fight():
    return render_template("fight.html")

@app.route("/account")
def account():
    if "username" not in session:
        return render_template("account.html")
    return redirect("/")

@app.route("/login", methods=["POST"])
def login_post():
    username = request.form.get("username")
    password = request.form.get("password")
    
    if not username or not password:
        return jsonify({"success": False, "message": "Missing username or password."})
    
    cursor = mydb.cursor()
    cursor.execute("SELECT password FROM login WHERE username = %s", (username,))
    result = cursor.fetchone()
    
    if not result:
        return jsonify({"success": False, "message": "Username does not exist."})
    hashed = result[0]
    
    try:
        if bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8")):
            session["username"] = username
            session.permanent = True
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "Incorrect password."})
    except Exception as e:
        return jsonify({"success": False, "message": "Login error."})

@app.route("/logout")
def logout():
    session.pop("username", None)
    return redirect("/account")

@app.route("/register", methods=["POST"])
def register_post():
    email = request.form.get("email")
    username = request.form.get("username")
    password = request.form.get("password")
    confirm_password = request.form.get("confirm_password")
    
    if not email or not username or not password or not confirm_password:
        return jsonify({"success": False, "message": "All fields are required."})
    
    if password != confirm_password:
        return jsonify({"success": False, "message": "Passwords do not match."})
    
    if len(username) < 3 or len(username) > 15:
        return jsonify({"success": False, "message": "Username must be between 3 and 15 characters."})
    
    if len(password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters."})
    
    valid = re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email)
    
    if not valid:
        return jsonify({"success": False, "message": "Invalid email."})
    
    cursor = mydb.cursor()
    cursor.execute("SELECT * FROM login WHERE username = %s", (username,))
    
    if cursor.fetchone():
        return jsonify({"success": False, "message": "Username already taken."})
    
    cursor.execute("SELECT * FROM login WHERE email = %s", (email,))
    
    if cursor.fetchone():
        return jsonify({"success": False, "message": "Email already taken."})
    
    salt = bcrypt.gensalt()
    hashedpwd = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    try:
        cursor.execute("INSERT INTO login (username, password, email) VALUES (%s, %s, %s)", (username, hashedpwd, email))
        mydb.commit()
        cursor.execute("SELECT id FROM login WHERE username = %s", (username,))
        userId = cursor.fetchone()[0]
        # Insert initial userdata row, using userId from login table as the foreign key
        cursor.execute("INSERT INTO userdata (id, wins, losses, coins, level, exp_required, exp) VALUES (%s, %s, %s, %s, %s, %s, %s)", (userId, 0, 0, 0, 1, 100, 0))
        mydb.commit()
        session["username"] = username
        session.permanent = True
        cursor.close()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "message": "Registration failed."})

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

@app.route("/updateStats", methods=["POST"])
def updateUserStats():
    if "username" not in session:
        return #Just means user doesnt have an account
    
    cursor = mydb.cursor()
    username = str(session["username"])
    print(request.data.decode("utf-8"))
    request_data = json.loads(request.data.decode("utf-8"))
    outcome = request_data["outcome"] #false = loss, true = win

    print("Outcome: ", outcome)

    #Check if the user exists
    cursor.execute("SELECT username FROM login WHERE username = %s", (username,))
    result = cursor.fetchone()
    if not result:
        send_js('''console.log("Username does not exist")''', sid=request.sid)
        return
    
    #Garner the users id from the username
    cursor.execute("SELECT id FROM login WHERE username = %s", (username,))
    result = cursor.fetchone()
    userId = result[0]

    if outcome: # Win
        cursor.execute(
            "UPDATE userdata SET wins = wins + 1, exp = exp + 100 WHERE id = %s",
            (userId,)
        )
    else: # Loss
        cursor.execute(
            "UPDATE userdata SET exp = exp + 25, losses = losses + 1 WHERE id = %s",
            (userId,)
        )
        
    mydb.commit()
    cursor.close()
    return jsonify({"success": True})
if __name__ == "__main__":
    socketio.run(app, debug=True, port=80, host="0.0.0.0")