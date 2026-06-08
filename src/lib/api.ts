const URLS = {
  auth: 'https://functions.poehali.dev/65a23f4c-5547-4b6c-84c7-d6a7ee9cf214',
  posts: 'https://functions.poehali.dev/0a868f38-0199-4eee-b514-93b230b98746',
  social: 'https://functions.poehali.dev/e5d6cf86-0950-4d7e-8b90-a2179fc353d3',
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

async function req(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSession(),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: res.status, data: { error: text } };
  }
}

function post(base: string, body: object) {
  return req(base, { method: 'POST', body: JSON.stringify(body) });
}

function get(base: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return req(qs ? `${base}?${qs}` : base);
}

// ── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string, handle: string) =>
    post(URLS.auth, { action: 'register', name, email, password, handle }),

  login: (email: string, password: string) =>
    post(URLS.auth, { action: 'login', email, password }),

  logout: () => post(URLS.auth, { action: 'logout' }),

  me: () => get(URLS.auth),
};

// ── POSTS ─────────────────────────────────────────────────────
export const postsApi = {
  feed: (mode: 'for_you' | 'following' = 'for_you', offset = 0) =>
    get(URLS.posts, { action: 'feed', mode, limit: '20', offset: String(offset) }),

  bookmarks: () =>
    get(URLS.posts, { action: 'bookmarks' }),

  userPosts: (userId: number) =>
    get(URLS.posts, { action: 'user_posts', user_id: String(userId) }),

  create: (text: string, tags: string[]) =>
    post(URLS.posts, { action: 'create', text, tags }),

  like: (postId: number) =>
    post(URLS.posts, { action: 'like', post_id: postId }),

  bookmark: (postId: number) =>
    post(URLS.posts, { action: 'bookmark', post_id: postId }),
};

// ── SOCIAL ────────────────────────────────────────────────────
export const socialApi = {
  search: (q: string) =>
    get(URLS.social, { action: 'users_search', q }),

  suggestions: () =>
    get(URLS.social, { action: 'users_suggestions' }),

  profile: (userId: number) =>
    post(URLS.social, { action: 'user_profile', user_id: userId }),

  follow: (userId: number) =>
    post(URLS.social, { action: 'follow', user_id: userId }),

  updateProfile: (name: string, bio: string) =>
    post(URLS.social, { action: 'update_profile', name, bio }),

  conversations: () =>
    post(URLS.social, { action: 'conversations' }),

  chat: (partnerId: number) =>
    post(URLS.social, { action: 'chat', partner_id: partnerId }),

  sendMessage: (toUserId: number, text: string) =>
    post(URLS.social, { action: 'send_message', to_user_id: toUserId, text }),

  notifications: () =>
    post(URLS.social, { action: 'notifications' }),

  notificationsReadAll: () =>
    post(URLS.social, { action: 'notifications_read_all' }),

  communities: () =>
    get(URLS.social, { action: 'communities' }),

  communityJoin: (communityId: number) =>
    post(URLS.social, { action: 'community_join', community_id: communityId }),

  communityLeave: (communityId: number) =>
    post(URLS.social, { action: 'community_leave', community_id: communityId }),
};
