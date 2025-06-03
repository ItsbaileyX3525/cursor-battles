if(localStorage.getItem("fightCode") == null){
    console.log("Attmepts were made")
}

const myHeart1 = document.getElementById('heartImage');
const myHeart2 = document.getElementById('heartImage2');
const myHeart3 = document.getElementById('heartImage3');
const enemyHeart1 = document.getElementById('altHeartImage');
const enemyHeart2 = document.getElementById('altHeartImage2');
const enemyHeart3 = document.getElementById('altHeartImage3');
let scaleX = window.innerWidth / 1920;
let scaleY = window.innerHeight / 1080;
let canAtk = true;

function spawnAttack(data){
    const attackPos = [data[0], data[1]];

    const body = document.querySelector('body');
    const square = document.createElement('div');
    square.classList.add("square");

    square.style.left = attackPos[0] * scale + 'px';
    square.style.top = attackPos[1] * scale + 'px';

    body.appendChild(square);
    setTimeout(() => {
        body.removeChild(square);
    }, 500); // Remove the square after .5 seconds
}

function toWorldCoords(x, y) {
    return {
        x: x / scaleX,
        y: y / scaleY
    };
}

function positionNametag(nametag, cursorEl) {
    nametag.style.left = (parseFloat(cursorEl.style.left) + cursorEl.width / 2 - nametag.offsetWidth / 2) + 'px';
    nametag.style.top = (parseFloat(cursorEl.style.top) - 10) + 'px';
}


document.addEventListener('mousemove', (event) => {
    scaleX = window.innerWidth / 1920;
    scaleY = window.innerHeight / 1080;

    const cursor1 = document.querySelector('#cursor1');
    const nametag1 = document.querySelector('#nametag1');
    const x = event.clientX-25;
    const y = event.clientY-25;
    cursor1.style.left = `${x}px`;
    cursor1.style.top = `${y}px`;
    socket.send(encodeMessage("moveMessage", toWorldCoords(x, y)));
    positionNametag(nametag1, cursor1);
});

document.addEventListener('click', (event) => {
    if(canAtk){
        canAtk = false;
        const body = document.querySelector('body');
        const square = document.createElement('div');
        square.classList.add("square");

        square.style.left = event.clientX-25 + 'px';
        square.style.top = event.clientY-25 + 'px';

        body.appendChild(square);
        setTimeout(() => {
            body.removeChild(square);
        }, 500); // Remove the square after .5 seconds
        setTimeout(() => {
            canAtk = true;
        }, 700); // Reset attack cooldown after .7 second
        socket.send(encodeMessage("attack", null));
    }
})