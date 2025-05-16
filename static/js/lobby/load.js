document.addEventListener('DOMContentLoaded', () => {//Ensure that DOM is fully loaded before modifying it
    //Remove fight code from local storage to prevent little shits
    localStorage.removeItem('fightCode');
    
    const wins_text = document.getElementById('WinsInfo');
    const lvl_text = document.getElementById('LvlInfo');
    const profile_text = document.querySelector('.profile-name');
    const profile_name = localStorage.getItem('username') || 'Guest';
    const needed_exp = localStorage.getItem("needed_exp") || 100;
    const current_exp = localStorage.getItem("current_exp") || 0;
    const level_bar_width = Math.round((current_exp / needed_exp) * 100);
    const level_bar = document.querySelector('.progress-fill');

    wins_text.innerText = `Wins: ${localStorage.getItem('wins') || 0}`;
    lvl_text.innerText = `Level: ${localStorage.getItem('level') || 1}`;
    profile_text.innerText = `Name: ${profile_name}`;
    level_bar.style.width = `${level_bar_width}%`;

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
        document.querySelector('.create-game-button').classList.add('dark');
        document.querySelector('.join-button').classList.add('dark');
        document.querySelector('.join-code').classList.add('dark');
        
    }
});