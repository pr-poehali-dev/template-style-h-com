"""Пользователи, сообщения, уведомления, сообщества, подписки."""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user_id(cur, session_id: str):
    if not session_id:
        return None
    cur.execute('SELECT user_id FROM sessions WHERE id = %s AND expires_at > NOW()', (session_id,))
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    params = event.get('queryStringParameters') or {}
    session_id = event.get('headers', {}).get('x-session-id', '')
    action = body.get('action', '') or params.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        user_id = get_user_id(cur, session_id)

        # ── USERS ─────────────────────────────────────────────
        if action == 'users_search':
            q = params.get('q', body.get('q', '')).strip()
            if not q:
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': []})}
            cur.execute(
                '''SELECT u.id, u.name, u.handle, u.bio, u.avatar_url,
                          (SELECT COUNT(*) FROM follows WHERE following_id = u.id),
                          (SELECT COUNT(*) FROM follows WHERE follower_id = %s AND following_id = u.id) > 0
                   FROM users u WHERE u.name ILIKE %s OR u.handle ILIKE %s LIMIT 20''',
                (user_id or 0, f'%{q}%', f'%{q}%')
            )
            rows = cur.fetchall()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': [
                {'id': r[0], 'name': r[1], 'handle': r[2], 'bio': r[3] or '',
                 'avatar_url': r[4] or '', 'followers': int(r[5]), 'is_following': bool(r[6])}
                for r in rows
            ]})}

        if action == 'users_suggestions':
            cur.execute(
                '''SELECT u.id, u.name, u.handle, u.bio, u.avatar_url,
                          (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as flw,
                          (SELECT COUNT(*) FROM follows WHERE follower_id = %s AND following_id = u.id) > 0
                   FROM users u WHERE u.id != %s
                   ORDER BY flw DESC LIMIT 5''',
                (user_id or 0, user_id or 0)
            )
            rows = cur.fetchall()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': [
                {'id': r[0], 'name': r[1], 'handle': r[2], 'bio': r[3] or '',
                 'avatar_url': r[4] or '', 'followers': int(r[5]), 'is_following': bool(r[6])}
                for r in rows
            ]})}

        if action == 'user_profile':
            target_id = int(body.get('user_id', params.get('user_id', 0)))
            cur.execute(
                '''SELECT u.id, u.name, u.handle, u.bio, u.avatar_url,
                          (SELECT COUNT(*) FROM follows WHERE following_id = u.id),
                          (SELECT COUNT(*) FROM follows WHERE follower_id = u.id),
                          (SELECT COUNT(*) FROM follows WHERE follower_id = %s AND following_id = u.id) > 0
                   FROM users u WHERE u.id = %s''',
                (user_id or 0, target_id)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Не найден'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                'id': row[0], 'name': row[1], 'handle': row[2], 'bio': row[3] or '',
                'avatar_url': row[4] or '', 'followers': int(row[5]),
                'following': int(row[6]), 'is_following': bool(row[7])
            })}

        if action == 'follow':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            target_id = body.get('user_id')
            cur.execute('SELECT 1 FROM follows WHERE follower_id = %s AND following_id = %s', (user_id, target_id))
            if not cur.fetchone():
                cur.execute('INSERT INTO follows (follower_id, following_id) VALUES (%s, %s)', (user_id, target_id))
                cur.execute('INSERT INTO notifications (user_id, actor_id, type) VALUES (%s, %s, %s)',
                            (target_id, user_id, 'follow'))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'following': True})}

        if action == 'update_profile':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            name = body.get('name', '').strip()
            bio = body.get('bio', '').strip()
            if name:
                cur.execute('UPDATE users SET name = %s, bio = %s WHERE id = %s', (name, bio, user_id))
                conn.commit()
            cur.execute('SELECT id, name, handle, bio, avatar_url FROM users WHERE id = %s', (user_id,))
            row = cur.fetchone()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'id': row[0], 'name': row[1], 'handle': row[2], 'bio': row[3] or '', 'avatar_url': row[4] or ''}
            )}

        # ── MESSAGES ──────────────────────────────────────────
        if action == 'conversations':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            cur.execute(
                '''SELECT DISTINCT ON (partner_id) partner_id,
                          u.name, u.handle, u.avatar_url, last_msg, last_time,
                          (SELECT COUNT(*) FROM messages m2
                           WHERE m2.to_user_id = %s AND m2.from_user_id = partner_id AND m2.read = FALSE)
                   FROM (
                     SELECT CASE WHEN from_user_id = %s THEN to_user_id ELSE from_user_id END as partner_id,
                            text as last_msg, created_at as last_time
                     FROM messages WHERE from_user_id = %s OR to_user_id = %s
                     ORDER BY created_at DESC
                   ) sub JOIN users u ON u.id = partner_id
                   ORDER BY partner_id, last_time DESC''',
                (user_id, user_id, user_id, user_id)
            )
            rows = cur.fetchall()
            convs = [{'partner': {'id': r[0], 'name': r[1], 'handle': r[2], 'avatar_url': r[3] or ''},
                      'last_msg': r[4], 'last_time': r[5].isoformat(), 'unread': int(r[6])} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'conversations': convs})}

        if action == 'chat':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            partner_id = int(body.get('partner_id', params.get('partner_id', 0)))
            cur.execute(
                '''SELECT id, from_user_id, text, created_at FROM messages
                   WHERE (from_user_id = %s AND to_user_id = %s)
                      OR (from_user_id = %s AND to_user_id = %s)
                   ORDER BY created_at ASC''',
                (user_id, partner_id, partner_id, user_id)
            )
            rows = cur.fetchall()
            msgs = [{'id': r[0], 'mine': r[1] == user_id, 'text': r[2], 'created_at': r[3].isoformat()} for r in rows]
            cur.execute('UPDATE messages SET read = TRUE WHERE from_user_id = %s AND to_user_id = %s AND read = FALSE',
                        (partner_id, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'messages': msgs})}

        if action == 'send_message':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            to_id = body.get('to_user_id')
            text = body.get('text', '').strip()
            if not text or not to_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет текста'})}
            cur.execute('INSERT INTO messages (from_user_id, to_user_id, text) VALUES (%s, %s, %s) RETURNING id, created_at',
                        (user_id, to_id, text))
            mid, created_at = cur.fetchone()
            cur.execute('INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES (%s, %s, %s, %s)',
                        (to_id, user_id, 'message', mid))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(
                {'id': mid, 'mine': True, 'text': text, 'created_at': created_at.isoformat()}
            )}

        # ── NOTIFICATIONS ─────────────────────────────────────
        if action == 'notifications':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            cur.execute(
                '''SELECT n.id, n.type, n.entity_id, n.read, n.created_at,
                          u.id, u.name, u.handle, u.avatar_url
                   FROM notifications n LEFT JOIN users u ON n.actor_id = u.id
                   WHERE n.user_id = %s ORDER BY n.created_at DESC LIMIT 50''',
                (user_id,)
            )
            rows = cur.fetchall()
            texts = {'like': 'лайкнул(а) ваш пост', 'follow': 'начал(а) читать вас',
                     'new_post': 'опубликовал(а) пост', 'message': 'написал(а) вам',
                     'comment': 'прокомментировал(а)', 'repost': 'сделал(а) репост'}
            notifs = [{'id': r[0], 'type': r[1], 'entity_id': r[2], 'read': bool(r[3]),
                       'created_at': r[4].isoformat(), 'text': texts.get(r[1], r[1]),
                       'actor': {'id': r[5], 'name': r[6], 'handle': r[7], 'avatar_url': r[8] or ''} if r[5] else None}
                      for r in rows]
            cur.execute('SELECT COUNT(*) FROM notifications WHERE user_id = %s AND read = FALSE', (user_id,))
            unread = cur.fetchone()[0]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'notifications': notifs, 'unread': int(unread)})}

        if action == 'notifications_read_all':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            cur.execute('UPDATE notifications SET read = TRUE WHERE user_id = %s', (user_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # ── COMMUNITIES ───────────────────────────────────────
        if action == 'communities':
            cur.execute(
                '''SELECT c.id, c.name, c.description,
                          (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as members,
                          (SELECT COUNT(*) FROM community_members WHERE community_id = c.id AND user_id = %s) > 0
                   FROM communities c ORDER BY members DESC''',
                (user_id or 0,)
            )
            rows = cur.fetchall()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'communities': [
                {'id': r[0], 'name': r[1], 'description': r[2], 'members': int(r[3]), 'joined': bool(r[4])}
                for r in rows
            ]})}

        if action == 'community_join':
            if not user_id:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
            cid = body.get('community_id')
            cur.execute('SELECT 1 FROM community_members WHERE community_id = %s AND user_id = %s', (cid, user_id))
            if not cur.fetchone():
                cur.execute('INSERT INTO community_members (community_id, user_id) VALUES (%s, %s)', (cid, user_id))
                conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'joined': True})}

        if action == 'community_leave':
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'joined': False})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестный action'})}

    finally:
        cur.close()
        conn.close()
