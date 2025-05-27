function showTab(tab) {
    document.getElementById('loginForm').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
}
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    fetch('/login', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // handle login response
        if (data.success) {
            // Redirect or update UI as needed
            localStorage.setItem("username", String(data.message))
            window.location.reload();
        } else {
            alert(data.message || "Login failed.");
            localStorage.setItem("username", "Guest")
        }
    })
    .catch((e) => {
        alert("An error occurred during login. " + e);
    });
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    if (formData.get('password') !== formData.get('confirm_password')) {
        alert("Passwords do not match!");
        return;
    }
    fetch('/register', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // handle registration response
        if (data.success) {
            // Redirect or update UI as needed
            localStorage.setItem("username", String(data.message));
            window.location.reload();
        } else {
            alert(data.message || "Registration failed.");
            localStorage.setItem("username", "Guest")
        }
    })
    .catch((e) => {
        alert("An error occurred during registration. " + e);
    });
});