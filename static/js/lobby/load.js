document.addEventListener('DOMContentLoaded', () => {//Ensure that DOM is fully loaded before modifying it
    //Remove fight code from local storage to prevent little shits
    localStorage.removeItem('fightCode');
    
    const current_exp = document.getElementById('current-exp').innerHTML;
    const exp_required = document.getElementById('exp-required').innerHTML;
    const username = document.getElementById('username').innerHTML;
    const level_bar = document.querySelector('.progress-fill');

    if(localStorage.getItem('username') === null || localStorage.getItem('username') === undefined || localStorage.getItem('username') === "") {
        localStorage.setItem('username', username);
    }

    const exp_progress = parseInt(current_exp, 10) / parseInt(exp_required, 10) * 100;

    level_bar.style.width = `${exp_progress}%`;

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