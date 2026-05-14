from flask import Flask, request, render_template, jsonify, send_from_directory
from datetime import datetime
import os
import uuid

app = Flask(__name__)

messages = []
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def is_image(filename):
    return filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_messages')
def get_messages():
    return jsonify(messages)

@app.route('/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    if data and data.get('text'):
        messages.append({
            'user_id': data.get('user_id', ''),
            'name': data.get('name', 'Аноним'),
            'text': data['text'],
            'time': datetime.now().strftime('%H:%M:%S'),
            'filename': None,
            'is_image': False
        })
        if len(messages) > 100:
            messages.pop(0)
    return 'OK'

@app.route('/send_file', methods=['POST'])
def send_file():
    file = request.files['file']
    name = request.form.get('name', 'Аноним')
    user_id = request.form.get('user_id', '')
    
    if file.filename:
        unique = f"{uuid.uuid4().hex[:8]}_{file.filename}"
        file.save(os.path.join(UPLOAD_FOLDER, unique))
        messages.append({
            'user_id': user_id,
            'name': name,
            'text': '',
            'time': datetime.now().strftime('%H:%M:%S'),
            'filename': unique,
            'is_image': is_image(unique)
        })
        if len(messages) > 100:
            messages.pop(0)
    return 'OK'

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)