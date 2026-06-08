"""Регистрация, вход, выход и проверка сессии пользователей."""
import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    session_id = event.get('headers', {}).get('x-session-id', '')
    action = body.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET — проверка сессии /me
        if method == 'GET':
            if not session_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            cur.execute(
                '''SELECT u.id, u.name, u.handle, u.email, u.bio, u.avatar_url
                   FROM sessions s JOIN users u ON s.user_id = u.id
                   WHERE s.id = %s AND s.expires_at > NOW()''',
                (session_id,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Сессия истекла'})}
            uid, name, handle, email, bio, avatar_url = row
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'id': uid, 'name': name, 'handle': handle, 'email': email, 'bio': bio or '', 'avatar_url': avatar_url or ''}
            )}

        if method == 'POST':
            # action=register
            if action == 'register':
                name = body.get('name', '').strip()
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                handle = body.get('handle', '').strip().lstrip('@')
                if not all([name, email, password, handle]):
                    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполните все поля'})}
                cur.execute('SELECT id FROM users WHERE email = %s OR handle = %s', (email, handle))
                if cur.fetchone():
                    return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Email или никнейм уже занят'})}
                pw_hash = hash_password(password)
                cur.execute(
                    'INSERT INTO users (name, handle, email, password_hash) VALUES (%s, %s, %s, %s) RETURNING id',
                    (name, handle, email, pw_hash)
                )
                user_id = cur.fetchone()[0]
                sid = secrets.token_hex(32)
                cur.execute('INSERT INTO sessions (id, user_id) VALUES (%s, %s)', (sid, user_id))
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'session_id': sid,
                    'user': {'id': user_id, 'name': name, 'handle': handle, 'email': email, 'bio': '', 'avatar_url': ''}
                })}

            # action=login
            if action == 'login':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                if not email or not password:
                    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите email и пароль'})}
                pw_hash = hash_password(password)
                cur.execute(
                    'SELECT id, name, handle, email, bio, avatar_url FROM users WHERE email = %s AND password_hash = %s',
                    (email, pw_hash)
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверный email или пароль'})}
                user_id, name, handle, em, bio, avatar_url = row
                sid = secrets.token_hex(32)
                cur.execute('INSERT INTO sessions (id, user_id) VALUES (%s, %s)', (sid, user_id))
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'session_id': sid,
                    'user': {'id': user_id, 'name': name, 'handle': handle, 'email': em, 'bio': bio or '', 'avatar_url': avatar_url or ''}
                })}

            # action=logout
            if action == 'logout':
                if session_id:
                    cur.execute('UPDATE sessions SET expires_at = NOW() WHERE id = %s', (session_id,))
                    conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестный запрос'})}

    finally:
        cur.close()
        conn.close()
