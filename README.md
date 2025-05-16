# Cursor Battles

Cursor Battles is a real-time multiplayer web game built with Flask and Flask-SocketIO. Players can join a lobby, create or join fights, and battle each other using custom cursors. The game state is synchronized between players using WebSockets.

## Features
- Real-time multiplayer battles
- Lobby and fight rooms
- Customizable cursors
- Game state persistence with JSON
- Simple web-based UI

## Todo

- Add working health bars
- Handle position updates better
- Add a way to end the game
- Add dark mode toggle
- Create quickplay
- More

## Project Structure
```
server.py            # Main Flask server with SocketIO
fights.json          # Stores ongoing fight data
public/
  index.html         # Lobby page
  fight.html         # Fight room page
static/
  css/               # Stylesheets
  cursors/           # Cursor SVGs
  js/
    lobby/           # Lobby scripts
    fight/           # Fight scripts
```

## Getting Started

### Prerequisites
- Python 3.x
- pip

### Installation
1. Install dependencies:
   ```sh
   pip install flask flask-socketio
   ```
2. (Optional) If using eventlet or gevent for production, install them as well.

### Running the Server
1. Make sure you are in the project directory.
2. Run the server:
   ```sh
   python server.py
   ```
3. Open your browser and go to `http://localhost/`.

## License
This project is for educational purposes.
