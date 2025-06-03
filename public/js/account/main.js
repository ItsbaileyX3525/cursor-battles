function showTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
}
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    socket.send(encodeMessage('login', {
            username: formData.get('username'),
            password: formData.get('password')
            }
        )
    )}
);
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    socket.send(encodeMessage('register', {
            username: formData.get('username'),
            password: password,
            email: formData.get('email')
        }
    ))
});