document.addEventListener('DOMContentLoaded', () => {//Ensure that DOM is fully loaded before modifying it
    //Remove fight code from local storage to prevent little shits
    localStorage.removeItem('fightCode');

    //Setup darkmode
    const darkmode = localStorage.getItem('darkmode') || 'false';
    if (darkmode === 'true') {
        document.body.classList.add('dark');
        document.querySelector('.customization-panel').classList.add('dark');
        document.querySelector('.cursor-preview').classList.add('dark');
        document.querySelector('.profile-header').classList.add('dark');
        document.querySelector('.profile-stats').classList.add('dark');
        document.querySelector('.coins-section').classList.add('dark');
        document.querySelector('.cursor-icon').classList.add('dark');
        document.querySelector('.play-button').classList.add('dark');
        document.querySelector('.join-section').classList.add('dark');
        document.querySelector('.join-button').classList.add('dark');
        document.querySelector('.join-code').classList.add('dark');
    }
});

const joinButton = document.querySelector('.join-button');
joinButton.addEventListener('click', () => {
    const joinCode = document.querySelector('.join-code').value.trim();
    if (joinCode && joinCode.length == 5) {
        localStorage.setItem('fightCode', joinCode);
        window.location.href = '/fight';
    } else {
        alert('Please enter a valid fight code.');
    }
});