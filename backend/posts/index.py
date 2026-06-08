"""Создание, лента, лайки и закладки постов."""
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

def fmt_post(r):
    return {
        'id': r[0], 'text': r[1], 'tags': r[2] or [],
        'created_at': r[3].isoformat(),
        'user': {'id': r[4], 'name': r[5], 'handle': r[6], 'avatar_url': r[7] or ''},
        'likes': int(r[8]), 'liked': bool(r[9]), 'bookmarked': bool(r[10]), 'comments': int(r[11])
    }

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    params = event.get('queryStringParameters') or {}
    session_id = event.get('headers', {}).get('x-session-id', '')
    action = body.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        user_id = get_user_id(cur, session_id)

        if method == 'GET':
            act = params.get('action', 'feed')
            uid = user_id or 0

            if act == 'feed':
                mode = params.get('mode', 'for_you')
                limit = int(params.get('limit', 20))
                offset = int(params.get('offset', 0))
                if mode == 'following' and user_id:
                    cur.execute(
                        '''SELECT p.id, p.text, p.tags, p.created_at,
                                  u.id, u.name, u.handle, u.avatar_url,
                                  (SELECT COUNT(*) FROM likes WHERE post_id = p.id),
                                  (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = %s) > 0,
                                  (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = %s) > 0,
                                  0
                           FROM posts p JOIN users u ON p.user_id = u.id
                           WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = %s)
                           ORDER BY p.created_at DESC LIMIT %s OFFSET %s''',
                        (uid, uid, uid, limit, offset)
                    )
                else:
                    cur.execute(
                        '''SELECT p.id, p.text, p.tags, p.created_at,
                                  u.id, u.name, u.handle, u.avatar_url,
                                  (SELECT COUNT(*) FROM likes WHERE post_id = p.id),
                                  (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = %s) > 0,
                                  (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = %s) > 0,
                                  0
                           FROM posts p JOIN users u ON p.user_id = u.id
                           ORDER BY p.created_at DESC LIMIT %s OFFSET %s''',
                        (uid, uid, limit, offset)
                    )
                rows = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'posts': [fmt_post(r) for r in rows]})}

            if act == 'bookmarks':
                if not user_id:
                    return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
                cur.execute(
                    '''SELECT p.id, p.text, p.tags, p.created_at,
                              u.id, u.name, u.handle, u.avatar_url,
                              (SELECT COUNT(*) FROM likes WHERE post_id = p.id),
                              (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = %s) > 0,
                              true, 0
                       FROM bookmarks b JOIN posts p ON b.post_id = p.id JOIN users u ON p.user_id = u.id
                       WHERE b.user_id = %s ORDER BY b.created_at DESC''',
                    (user_id, user_id)
                )
                rows = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'posts': [fmt_post(r) for r in rows]})}

            if act == 'user_posts':
                uid_target = int(params.get('user_id', 0))
                cur.execute(
                    '''SELECT p.id, p.text, p.tags, p.created_at,
                              u.id, u.name, u.handle, u.avatar_url,
                              (SELECT COUNT(*) FROM likes WHERE post_id = p.id),
                              (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = %s) > 0,
                              (SELECT COUNT(*) FROM bookmarks WHERE post_id = p.id AND user_id = %s) > 0,
                              0
                       FROM posts p JOIN users u ON p.user_id = u.id
                       WHERE p.user_id = %s ORDER BY p.created_at DESC''',
                    (uid, uid, uid_target)
                )
                rows = cur.fetchall()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'posts': [fmt_post(r) for r in rows]})}

        if method == 'POST':
            if action == 'create':
                if not user_id:
                    return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
                text = body.get('text', '').strip()
                tags = body.get('tags', [])
                if not text:
                    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Пост не может быть пустым'})}
                cur.execute(
                    'INSERT INTO posts (user_id, text, tags) VALUES (%s, %s, %s) RETURNING id, created_at',
                    (user_id, text, tags)
                )
                pid, created_at = cur.fetchone()
                cur.execute('SELECT name, handle, avatar_url FROM users WHERE id = %s', (user_id,))
                u = cur.fetchone()
                cur.execute('SELECT follower_id FROM follows WHERE following_id = %s', (user_id,))
                for (fid,) in cur.fetchall():
                    cur.execute('INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES (%s, %s, %s, %s)',
                                (fid, user_id, 'new_post', pid))
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({
                    'id': pid, 'text': text, 'tags': tags, 'created_at': created_at.isoformat(),
                    'user': {'id': user_id, 'name': u[0], 'handle': u[1], 'avatar_url': u[2] or ''},
                    'likes': 0, 'liked': False, 'bookmarked': False, 'comments': 0
                })}

            if action == 'like':
                if not user_id:
                    return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
                post_id = body.get('post_id')
                cur.execute('SELECT 1 FROM likes WHERE user_id = %s AND post_id = %s', (user_id, post_id))
                if cur.fetchone():
                    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'liked': False})}
                cur.execute('INSERT INTO likes (user_id, post_id) VALUES (%s, %s)', (user_id, post_id))
                cur.execute('SELECT user_id FROM posts WHERE id = %s', (post_id,))
                author = cur.fetchone()
                if author and author[0] != user_id:
                    cur.execute('INSERT INTO notifications (user_id, actor_id, type, entity_id) VALUES (%s, %s, %s, %s)',
                                (author[0], user_id, 'like', post_id))
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'liked': True})}

            if action == 'bookmark':
                if not user_id:
                    return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}
                post_id = body.get('post_id')
                cur.execute('SELECT 1 FROM bookmarks WHERE user_id = %s AND post_id = %s', (user_id, post_id))
                if cur.fetchone():
                    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'bookmarked': False})}
                cur.execute('INSERT INTO bookmarks (user_id, post_id) VALUES (%s, %s)', (user_id, post_id))
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'bookmarked': True})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестный запрос'})}

    finally:
        cur.close()
        conn.close()
