
function checkUser() {
    const username = localStorage.getItem('username');
    alert(username);
}

function signout() {
    window.localStorage.clear();
    window.location.replace('http://localhost:3000/');
}

const form = document.getElementById('reg-form');
form.addEventListener('submit', registerUser);

async function registerUser(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;

    const result = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            newpassword: password,
            token: localStorage.getItem('token')
        })
    }).then((res) => res.json())

    if (result.status === 'ok') {
        alert('Success');
    } else {
        alert(result.error);
    }
}