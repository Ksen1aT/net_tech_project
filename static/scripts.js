let userId = localStorage.getItem('user_id');
if (!userId) {
    userId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
    localStorage.setItem('user_id', userId);
}

let userName = localStorage.getItem('name') || '';

document.getElementById('username').value = userName;

document.getElementById('username').onchange = () => {
    userName = document.getElementById('username').value;
    localStorage.setItem('name', userName);
};

let selected = null;

document.getElementById('fileInput').onchange = (e) => {
    selected = e.target.files[0];
    if (selected) {
        alert('Файл выбран: ' + selected.name + '. Нажмите "Отправить"');
    }
};

let lastMessages = [];

async function load() {
    try {
        let res = await fetch('/get_messages');
        let msgs = await res.json();
        let container = document.getElementById('messages');

        if (!msgs.length) {
            if (lastMessages.length !== 0) {
                container.innerHTML = '<div class="status">Нет сообщений</div>';
            }
            lastMessages = msgs;
            return;
        }

        let changed = false;
        if (msgs.length !== lastMessages.length) {
            changed = true;
        } else {
            for (let i = 0; i < msgs.length; i++) {
                if (msgs[i].filename !== lastMessages[i].filename ||
                    msgs[i].text !== lastMessages[i].text ||
                    msgs[i].name !== lastMessages[i].name) {
                    changed = true;
                    break;
                }
            }
        }

        if (!changed) {
            return;
        }

        container.innerHTML = msgs.map(m => {
            let own = (userId && m.user_id === userId);
            let file = '';

            if (m.filename) {
                if (m.is_image) {
                    file = '<img src="/uploads/' + m.filename + '" class="preview" onclick="openModal(\'/uploads/' + m.filename + '\')">';
                } else {
                    file = '<div><a href="/uploads/' + m.filename + '" download>' + m.filename + '</a></div>';
                }
            }

            return '<div class="msg ' + (own ? 'own' : 'other') + '">' +
                '<div class="name">' + escape(m.name || 'Аноним') + '</div>' +
                '<div class="text">' + escape(m.text || '') + '</div>' +
                file +
                '<div class="time">' + m.time + '</div>' +
            '</div>';
        }).join('');

        container.scrollTop = container.scrollHeight;
        lastMessages = msgs;
    } catch(e) {
        console.error(e);
    }
}
async function sendMsg() {
    let name = document.getElementById('username').value.trim() || 'Гость';
    let text = document.getElementById('msgInput').value.trim();

    if (!text) return;

    await fetch('/send_message', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: userId, name: name, text: text})
    });

    document.getElementById('msgInput').value = '';
    load();
}

async function sendFile() {
    if (!selected) {
        alert('Сначала выберите файл');
        return;
    }

    let name = document.getElementById('username').value.trim() || 'Гость';
    let fd = new FormData();
    fd.append('file', selected);
    fd.append('name', name);
    fd.append('user_id', userId);

    let response = await fetch('/send_file', {
        method: 'POST',
        body: fd
    });

    if (response.ok) {
        alert('Файл отправлен');
        selected = null;
        document.getElementById('fileInput').value = '';
        load();
    } else {
        alert('Ошибка при отправке');
    }
}

function escape(t) {
    let d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

function openModal(src) {
    let modal = document.getElementById('modal');
    modal.style.display = 'block';
    document.getElementById('modalImg').src = src;
}

document.querySelector('.close').onclick = () => {
    document.getElementById('modal').style.display = 'none';
};

window.onclick = (e) => {
    if (e.target == document.getElementById('modal')) {
        document.getElementById('modal').style.display = 'none';
    }
};

document.getElementById('msgInput').onkeypress = (e) => {
    if (e.key === 'Enter') sendMsg();
};

load();
setInterval(load, 2000);