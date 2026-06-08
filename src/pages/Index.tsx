import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { authApi, postsApi, socialApi } from "@/lib/api";

// ---------- Types ----------
type Page = "feed" | "profile" | "messages" | "notifications" | "search" | "bookmarks" | "community";

interface User { id: number; name: string; handle: string; bio: string; avatar_url: string; followers?: number; following?: number; is_following?: boolean; email?: string; }
interface Post { id: number; text: string; tags: string[]; created_at: string; user: User; likes: number; liked: boolean; bookmarked: boolean; comments: number; }
interface Message { id: number; mine: boolean; text: string; created_at: string; }
interface Conversation { partner: User; last_msg: string; last_time: string; unread: number; }
interface Notification { id: number; type: string; text: string; read: boolean; created_at: string; actor: User | null; }
interface Community { id: number; name: string; description: string; members: number; joined: boolean; }

// ---------- Helpers ----------
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "сейчас";
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч`;
  return `${Math.floor(h / 24)}д`;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#1D9BF0", "#00BA7C", "#FF7A00", "#F4212E", "#794BC4"];
function getAvatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

// ---------- Auth Screen ----------
function AuthScreen({ onLogin }: { onLogin: (user: User, sid: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""); const [handle, setHandle] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const res = mode === "login"
        ? await authApi.login(email, password)
        : await authApi.register(name, email, password, handle);
      if (res.ok) {
        localStorage.setItem('session_id', res.data.session_id);
        onLogin(res.data.user, res.data.session_id);
      } else {
        setError(res.data.error || "Ошибка");
      }
    } catch { setError("Ошибка сети"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(204_100%_50%)] mb-4">
            <span className="text-2xl font-black text-white">✦</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Волна</h1>
          <p className="text-[hsl(0_0%_55%)] mt-1 text-sm">Умная социальная сеть</p>
        </div>
        <div className="bg-[hsl(0_0%_5%)] border border-[hsl(0_0%_15%)] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">{mode === "login" ? "Войти" : "Регистрация"}</h2>
          {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 rounded-xl px-3 py-2">{error}</p>}
          <div className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-sm text-[hsl(0_0%_55%)] mb-1.5 block">Имя</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя"
                    className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] h-11" />
                </div>
                <div>
                  <label className="text-sm text-[hsl(0_0%_55%)] mb-1.5 block">Никнейм</label>
                  <Input value={handle} onChange={e => setHandle(e.target.value)} placeholder="username"
                    className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] h-11" />
                </div>
              </>
            )}
            <div>
              <label className="text-sm text-[hsl(0_0%_55%)] mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] h-11" />
            </div>
            <div>
              <label className="text-sm text-[hsl(0_0%_55%)] mb-1.5 block">Пароль</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••••••"
                className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] h-11" />
            </div>
          </div>
          <Button onClick={submit} disabled={loading}
            className="w-full mt-6 h-11 bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] text-white font-semibold rounded-xl">
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Button>
        </div>
        <p className="text-center text-sm text-[hsl(0_0%_45%)] mt-6">
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <span className="text-[hsl(204_100%_50%)] cursor-pointer hover:underline font-medium"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ---------- Post Card ----------
function PostCard({ post, onLike, onBookmark }: { post: Post; onLike: (id: number) => void; onBookmark: (id: number) => void; }) {
  const u = post.user;
  return (
    <div className="border-b border-[hsl(0_0%_10%)] px-4 py-4 post-hover transition-colors cursor-pointer">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: getAvatarColor(u.id) }}>{getInitials(u.name)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-white text-sm">{u.name}</span>
            <span className="text-[hsl(0_0%_45%)] text-sm">@{u.handle}</span>
            <span className="text-[hsl(0_0%_35%)] text-xs">· {timeAgo(post.created_at)}</span>
          </div>
          <p className="text-[hsl(0_0%_88%)] text-sm leading-relaxed mb-3">{post.text}</p>
          {post.tags.length > 0 && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {post.tags.map(tag => <span key={tag} className="text-[hsl(204_100%_50%)] text-xs hover:underline cursor-pointer">#{tag}</span>)}
            </div>
          )}
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-[hsl(0_0%_45%)] hover:text-[hsl(204_100%_50%)] transition-colors">
              <Icon name="MessageCircle" size={16} /><span className="text-xs">{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 text-[hsl(0_0%_45%)] hover:text-[#00BA7C] transition-colors">
              <Icon name="Repeat2" size={16} />
            </button>
            <button onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 transition-colors ${post.liked ? "text-[#F4212E]" : "text-[hsl(0_0%_45%)] hover:text-[#F4212E]"}`}>
              <Icon name="Heart" size={16} /><span className="text-xs">{post.likes}</span>
            </button>
            <button onClick={() => onBookmark(post.id)} className="ml-auto"
              style={{ color: post.bookmarked ? "hsl(204 100% 50%)" : "hsl(0 0% 45%)" }}>
              <Icon name="Bookmark" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Feed Page ----------
function FeedPage({ currentUser }: { currentUser: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"for_you" | "following">("for_you");
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const res = await postsApi.feed(tab);
    if (res.ok) setPosts(res.data.posts || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLike = async (id: number) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
    await postsApi.like(id);
  };

  const handleBookmark = async (id: number) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
    await postsApi.bookmark(id);
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    const tags = [...newPost.matchAll(/#(\w+)/g)].map(m => m[1]);
    const res = await postsApi.create(newPost, tags);
    if (res.ok) { setPosts(prev => [res.data, ...prev]); setNewPost(""); }
    setPosting(false);
  };

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-[hsl(0_0%_12%)]">
        <div className="flex">
          {[{ key: "for_you", label: "Для вас" }, { key: "following", label: "Подписки" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as "for_you" | "following")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${tab === t.key ? "text-white" : "text-[hsl(0_0%_45%)] hover:text-white"}`}>
              {t.label}
              {tab === t.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[hsl(204_100%_50%)] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-[hsl(0_0%_12%)] flex gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{ background: getAvatarColor(currentUser.id) }}>{getInitials(currentUser.name)}</div>
        <div className="flex-1">
          <Textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Что происходит?"
            className="bg-transparent border-none resize-none text-white placeholder:text-[hsl(0_0%_35%)] text-base p-0 focus-visible:ring-0 min-h-[60px]" />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-3">
              <button className="text-[hsl(204_100%_50%)] hover:bg-[hsl(0_0%_12%)] p-1.5 rounded-lg transition-colors"><Icon name="Image" size={18} /></button>
              <button className="text-[hsl(204_100%_50%)] hover:bg-[hsl(0_0%_12%)] p-1.5 rounded-lg transition-colors"><Icon name="Smile" size={18} /></button>
            </div>
            <Button onClick={handlePost} disabled={!newPost.trim() || posting}
              className="bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] text-white font-semibold rounded-full px-5 h-9 text-sm disabled:opacity-30">
              {posting ? "..." : "Опубликовать"}
            </Button>
          </div>
        </div>
      </div>

      {tab === "for_you" && (
        <div className="mx-4 mt-4 mb-2 bg-[hsl(204_100%_50%/0.07)] border border-[hsl(204_100%_50%/0.18)] rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(204_100%_50%/0.18)] flex items-center justify-center flex-shrink-0">
            <Icon name="Sparkles" size={16} className="text-[hsl(204_100%_50%)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[hsl(204_100%_50%)]">Умные рекомендации</p>
            <p className="text-xs text-[hsl(0_0%_50%)]">Контент подобран на основе ваших интересов</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[hsl(0_0%_35%)]">
          <Icon name="Rss" size={32} className="mx-auto mb-3 opacity-40" />
          <p>{tab === "following" ? "Подпишитесь на кого-нибудь, чтобы видеть посты" : "Пока нет постов"}</p>
        </div>
      ) : posts.map(p => <PostCard key={p.id} post={p} onLike={handleLike} onBookmark={handleBookmark} />)}
    </div>
  );
}

// ---------- Profile Page ----------
function ProfilePage({ currentUser, targetUserId }: { currentUser: User; targetUserId?: number }) {
  const uid = targetUserId || currentUser.id;
  const isMe = uid === currentUser.id;
  const [profile, setProfile] = useState<User | null>(isMe ? currentUser : null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"posts" | "media" | "likes">("posts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [profRes, postsRes] = await Promise.all([
        socialApi.profile(uid),
        postsApi.userPosts(uid),
      ]);
      if (profRes.ok) setProfile(profRes.data);
      if (postsRes.ok) setPosts(postsRes.data.posts || []);
      setLoading(false);
    })();
  }, [uid]);

  const handleFollow = async () => {
    if (!profile) return;
    await socialApi.follow(profile.id);
    setProfile(p => p ? { ...p, is_following: true, followers: (p.followers || 0) + 1 } : p);
  };

  if (loading || !profile) return (
    <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin" /></div>
  );

  return (
    <div>
      <div className="h-36 bg-gradient-to-br from-[hsl(204_100%_28%)] via-[hsl(250_60%_20%)] to-[hsl(0_0%_8%)]" />
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-black flex items-center justify-center text-white font-bold text-2xl"
            style={{ background: getAvatarColor(profile.id) }}>{getInitials(profile.name)}</div>
          {!isMe && (
            <Button onClick={handleFollow}
              className={`rounded-full px-5 h-9 font-semibold text-sm ${profile.is_following ? "bg-transparent border border-[hsl(0_0%_30%)] text-white" : "bg-white text-black hover:bg-[hsl(0_0%_90%)]"}`}>
              {profile.is_following ? "Читаете" : "Читать"}
            </Button>
          )}
        </div>
        <h2 className="text-xl font-bold text-white">{profile.name}</h2>
        <p className="text-[hsl(0_0%_45%)] text-sm">@{profile.handle}</p>
        {profile.bio && <p className="text-[hsl(0_0%_80%)] text-sm mt-2">{profile.bio}</p>}
        <div className="flex gap-6 mt-3">
          <div><span className="font-bold text-white">{profile.following ?? 0}</span><span className="text-[hsl(0_0%_45%)] text-sm ml-1">подписок</span></div>
          <div><span className="font-bold text-white">{(profile.followers ?? 0).toLocaleString()}</span><span className="text-[hsl(0_0%_45%)] text-sm ml-1">читателей</span></div>
        </div>
      </div>
      <div className="flex border-b border-[hsl(0_0%_12%)]">
        {[{ key: "posts", label: "Посты" }, { key: "media", label: "Медиа" }, { key: "likes", label: "Нравится" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as "posts" | "media" | "likes")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${tab === t.key ? "text-white" : "text-[hsl(0_0%_45%)] hover:text-white"}`}>
            {t.label}
            {tab === t.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[hsl(204_100%_50%)] rounded-full" />}
          </button>
        ))}
      </div>
      {posts.map(p => <PostCard key={p.id} post={p} onLike={() => {}} onBookmark={() => {}} />)}
      {posts.length === 0 && !loading && (
        <div className="text-center py-16 text-[hsl(0_0%_35%)]"><Icon name="FileText" size={32} className="mx-auto mb-3 opacity-40" /><p>Нет постов</p></div>
      )}
    </div>
  );
}

// ---------- Messages Page ----------
function MessagesPage({ currentUser }: { currentUser: User }) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await socialApi.conversations();
      if (res.ok) setConvs(res.data.conversations || []);
      setLoading(false);
    })();
  }, []);

  const openChat = async (conv: Conversation) => {
    setActive(conv);
    const res = await socialApi.chat(conv.partner.id);
    if (res.ok) setMsgs(res.data.messages || []);
  };

  const sendMsg = async () => {
    if (!text.trim() || !active) return;
    const res = await socialApi.sendMessage(active.partner.id, text);
    if (res.ok) { setMsgs(prev => [...prev, res.data]); setText(""); }
  };

  if (active) return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      <div className="flex items-center gap-3 p-4 border-b border-[hsl(0_0%_12%)]">
        <button onClick={() => setActive(null)} className="text-[hsl(204_100%_50%)] mr-1"><Icon name="ArrowLeft" size={20} /></button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: getAvatarColor(active.partner.id) }}>{getInitials(active.partner.name)}</div>
        <div>
          <p className="font-semibold text-white text-sm">{active.partner.name}</p>
          <p className="text-[hsl(0_0%_45%)] text-xs">@{active.partner.handle}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm ${m.mine ? "bg-[hsl(204_100%_50%)] text-white rounded-br-sm" : "bg-[hsl(0_0%_12%)] text-white rounded-bl-sm"}`}>{m.text}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[hsl(0_0%_12%)] flex gap-3">
        <Input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Сообщение..."
          className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] rounded-full" />
        <Button onClick={sendMsg} className="bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] rounded-full w-10 h-10 p-0 flex-shrink-0">
          <Icon name="Send" size={16} />
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)]"><h2 className="text-xl font-bold text-white">Сообщения</h2></div>
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin" /></div>
      ) : convs.length === 0 ? (
        <div className="text-center py-16 text-[hsl(0_0%_35%)]"><Icon name="Mail" size={32} className="mx-auto mb-3 opacity-40" /><p>Нет сообщений</p></div>
      ) : convs.map((c, i) => (
        <div key={i} onClick={() => openChat(c)}
          className="flex items-center gap-3 px-4 py-3.5 post-hover transition-colors cursor-pointer border-b border-[hsl(0_0%_8%)]">
          <div className="relative">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: getAvatarColor(c.partner.id) }}>{getInitials(c.partner.name)}</div>
            {c.unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[hsl(204_100%_50%)] rounded-full text-xs text-white flex items-center justify-center font-bold">{c.unread}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`font-semibold text-sm ${c.unread ? "text-white" : "text-[hsl(0_0%_80%)]"}`}>{c.partner.name}</span>
              <span className="text-[hsl(0_0%_40%)] text-xs">{timeAgo(c.last_time)}</span>
            </div>
            <p className={`text-sm truncate mt-0.5 ${c.unread ? "text-[hsl(0_0%_80%)]" : "text-[hsl(0_0%_45%)]"}`}>{c.last_msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Notifications Page ----------
function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const iconMap: Record<string, string> = { like: "Heart", follow: "UserPlus", comment: "MessageCircle", repost: "Repeat2", new_post: "FileText", message: "Mail", recommend: "Sparkles" };
  const colorMap: Record<string, string> = { like: "#F4212E", follow: "#00BA7C", comment: "#1D9BF0", repost: "#00BA7C", new_post: "#1D9BF0", message: "#794BC4", recommend: "#1D9BF0" };

  useEffect(() => {
    (async () => {
      const res = await socialApi.notifications();
      if (res.ok) setNotifs(res.data.notifications || []);
      setLoading(false);
    })();
  }, []);

  const markAllRead = async () => {
    await socialApi.notificationsReadAll();
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)] flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Уведомления</h2>
        {notifs.some(n => !n.read) && (
          <button onClick={markAllRead} className="text-[hsl(204_100%_50%)] text-sm hover:underline">Прочитать все</button>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin" /></div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 text-[hsl(0_0%_35%)]"><Icon name="Bell" size={32} className="mx-auto mb-3 opacity-40" /><p>Нет уведомлений</p></div>
      ) : notifs.map(n => (
        <div key={n.id} className={`flex items-start gap-3 px-4 py-4 border-b border-[hsl(0_0%_8%)] post-hover transition-colors cursor-pointer ${!n.read ? "bg-[hsl(204_100%_50%/0.04)]" : ""}`}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: (colorMap[n.type] || "#1D9BF0") + "22" }}>
            <Icon name={iconMap[n.type] || "Bell"} size={18} style={{ color: colorMap[n.type] || "#1D9BF0" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[hsl(0_0%_85%)]">
              {n.actor && <span className="font-semibold text-white">{n.actor.name} </span>}
              {n.text}
            </p>
            <p className="text-xs text-[hsl(0_0%_40%)] mt-1">{timeAgo(n.created_at)}</p>
          </div>
          {!n.read && <div className="w-2 h-2 rounded-full bg-[hsl(204_100%_50%)] mt-1.5 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ---------- Search Page ----------
function SearchPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const TRENDING = ["#реакт", "#дизайн", "#фото", "#ии", "#продуктивность", "#разработка", "#маркетинг"];

  useEffect(() => {
    (async () => {
      const res = await socialApi.suggestions();
      if (res.ok) setSuggestions(res.data.users || []);
    })();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setUsers([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await socialApi.search(query);
      if (res.ok) setUsers(res.data.users || []);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const handleFollow = async (userId: number) => {
    await socialApi.follow(userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_following: true } : u));
    setSuggestions(prev => prev.map(u => u.id === userId ? { ...u, is_following: true } : u));
  };

  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)]">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(0_0%_40%)]" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск людей, постов, тегов..."
            className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] rounded-full pl-9" />
        </div>
      </div>
      {!query ? (
        <div className="p-4">
          <h3 className="text-white font-bold mb-4">Популярные теги</h3>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map(tag => (
              <button key={tag} onClick={() => setQuery(tag.slice(1))}
                className="px-4 py-2 bg-[hsl(0_0%_10%)] hover:bg-[hsl(204_100%_50%/0.1)] border border-[hsl(0_0%_16%)] rounded-full text-sm text-[hsl(204_100%_50%)] transition-colors">
                {tag}
              </button>
            ))}
          </div>
          {suggestions.length > 0 && (
            <>
              <h3 className="text-white font-bold mt-6 mb-4">Кого почитать</h3>
              {suggestions.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-3 border-b border-[hsl(0_0%_8%)]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: getAvatarColor(u.id) }}>{getInitials(u.name)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{u.name}</p>
                    <p className="text-[hsl(0_0%_45%)] text-xs">{u.bio}</p>
                  </div>
                  <Button onClick={() => handleFollow(u.id)}
                    className={`rounded-full px-4 h-8 text-xs font-semibold ${u.is_following ? "bg-transparent border border-[hsl(0_0%_30%)] text-white" : "bg-white text-black hover:bg-[hsl(0_0%_90%)]"}`}>
                    {u.is_following ? "Читаете" : "Читать"}
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-[hsl(0_0%_35%)]"><Icon name="SearchX" size={32} className="mx-auto mb-3 opacity-40" /><p>Ничего не найдено</p></div>
      ) : users.map(u => (
        <div key={u.id} className="flex items-center gap-3 px-4 py-3.5 post-hover transition-colors border-b border-[hsl(0_0%_8%)]">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: getAvatarColor(u.id) }}>{getInitials(u.name)}</div>
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">{u.name}</p>
            <p className="text-[hsl(0_0%_45%)] text-xs">@{u.handle} · {(u.followers || 0).toLocaleString()} читателей</p>
            <p className="text-[hsl(0_0%_55%)] text-xs mt-0.5">{u.bio}</p>
          </div>
          <Button onClick={() => handleFollow(u.id)}
            className={`rounded-full px-4 h-8 text-xs font-semibold flex-shrink-0 ${u.is_following ? "bg-transparent border border-[hsl(0_0%_30%)] text-white" : "bg-white text-black hover:bg-[hsl(0_0%_90%)]"}`}>
            {u.is_following ? "Читаете" : "Читать"}
          </Button>
        </div>
      ))}
    </div>
  );
}

// ---------- Bookmarks Page ----------
function BookmarksPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await postsApi.bookmarks();
      if (res.ok) setPosts(res.data.posts || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)] flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Закладки</h2>
        <Badge className="bg-[hsl(204_100%_50%/0.15)] text-[hsl(204_100%_50%)] border-none">{posts.length}</Badge>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-[hsl(0_0%_35%)]"><Icon name="Bookmark" size={40} className="mx-auto mb-3 opacity-30" /><p>Нет сохранённых постов</p></div>
      ) : posts.map(p => <PostCard key={p.id} post={p} onLike={() => {}} onBookmark={() => {}} />)}
    </div>
  );
}

// ---------- Community Page ----------
function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await socialApi.communities();
      if (res.ok) setCommunities(res.data.communities || []);
      setLoading(false);
    })();
  }, []);

  const toggle = async (c: Community) => {
    if (c.joined) {
      await socialApi.communityLeave(c.id);
      setCommunities(prev => prev.map(x => x.id === c.id ? { ...x, joined: false, members: x.members - 1 } : x));
    } else {
      await socialApi.communityJoin(c.id);
      setCommunities(prev => prev.map(x => x.id === c.id ? { ...x, joined: true, members: x.members + 1 } : x));
    }
  };

  const shown = tab === "all" ? communities : communities.filter(c => c.joined);

  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)]">
        <h2 className="text-xl font-bold text-white mb-3">Сообщества</h2>
        <div className="flex gap-2">
          {[{ key: "all", label: "Все" }, { key: "mine", label: "Мои" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as "all" | "mine")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab === t.key ? "bg-white text-black" : "bg-[hsl(0_0%_12%)] text-[hsl(0_0%_60%)] hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin" /></div>
        ) : shown.map(c => (
          <div key={c.id} className="bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_13%)] rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-white">{c.name}</h3>
                <p className="text-[hsl(0_0%_50%)] text-sm mt-0.5">{c.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Icon name="Users" size={13} className="text-[hsl(0_0%_40%)]" />
                  <span className="text-[hsl(0_0%_45%)] text-xs">{c.members.toLocaleString()} участников</span>
                </div>
              </div>
              <Button onClick={() => toggle(c)}
                className={`ml-4 rounded-full px-4 h-8 text-xs font-semibold ${c.joined ? "bg-transparent border border-[hsl(0_0%_30%)] text-white hover:border-red-500 hover:text-red-500" : "bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] text-white"}`}>
                {c.joined ? "Вступили" : "Вступить"}
              </Button>
            </div>
          </div>
        ))}
        {!loading && shown.length === 0 && (
          <div className="text-center py-16 text-[hsl(0_0%_35%)]"><Icon name="Users" size={32} className="mx-auto mb-3 opacity-30" /><p>Нет сообществ</p></div>
        )}
      </div>
    </div>
  );
}

// ---------- Right Sidebar ----------
function RightSidebar() {
  const [suggestions, setSuggestions] = useState<User[]>([]);

  useEffect(() => {
    (async () => {
      const res = await socialApi.suggestions();
      if (res.ok) setSuggestions(res.data.users || []);
    })();
  }, []);

  const handleFollow = async (userId: number) => {
    await socialApi.follow(userId);
    setSuggestions(prev => prev.map(u => u.id === userId ? { ...u, is_following: true } : u));
  };

  return (
    <div className="space-y-4">
      <div className="bg-[hsl(0_0%_5%)] rounded-2xl p-4 border border-[hsl(0_0%_12%)]">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Sparkles" size={16} className="text-[hsl(204_100%_50%)]" />
          <h3 className="font-bold text-white text-sm">Ваши интересы</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Дизайн", "Технологии", "ИИ", "Фотография", "Продуктивность"].map(tag => (
            <span key={tag} className="px-3 py-1 bg-[hsl(204_100%_50%/0.1)] text-[hsl(204_100%_50%)] rounded-full text-xs font-medium">{tag}</span>
          ))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-[hsl(0_0%_5%)] rounded-2xl p-4 border border-[hsl(0_0%_12%)]">
          <h3 className="font-bold text-white text-sm mb-3">Рекомендуем читать</h3>
          {suggestions.slice(0, 3).map(u => (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: getAvatarColor(u.id) }}>{getInitials(u.name)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-xs truncate">{u.name}</p>
                <p className="text-[hsl(0_0%_45%)] text-xs">@{u.handle}</p>
              </div>
              <Button onClick={() => handleFollow(u.id)}
                className={`rounded-full px-3 h-7 text-xs font-semibold flex-shrink-0 ${u.is_following ? "bg-transparent border border-[hsl(0_0%_30%)] text-white" : "bg-white text-black hover:bg-[hsl(0_0%_90%)]"}`}>
                {u.is_following ? "✓" : "+"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Sidebar ----------
const NAV_ITEMS: { key: Page; label: string; icon: string; }[] = [
  { key: "feed", label: "Лента", icon: "Home" },
  { key: "search", label: "Поиск", icon: "Search" },
  { key: "notifications", label: "Уведомления", icon: "Bell" },
  { key: "messages", label: "Сообщения", icon: "Mail" },
  { key: "bookmarks", label: "Закладки", icon: "Bookmark" },
  { key: "community", label: "Сообщества", icon: "Users" },
  { key: "profile", label: "Профиль", icon: "User" },
];

function Sidebar({ page, onNavigate, onLogout, currentUser, unread }: {
  page: Page; onNavigate: (p: Page) => void; onLogout: () => void; currentUser: User; unread: number;
}) {
  return (
    <div className="flex flex-col h-full py-4 px-3">
      <div className="flex items-center gap-2 px-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[hsl(204_100%_50%)] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-lg">✦</span>
        </div>
        <span className="text-xl font-black text-white tracking-tight hidden xl:block">Волна</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(item => (
          <button key={item.key} onClick={() => onNavigate(item.key)}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all text-left ${page === item.key ? "bg-[hsl(204_100%_50%/0.12)] text-[hsl(204_100%_50%)]" : "text-[hsl(0_0%_70%)] hover:bg-[hsl(0_0%_10%)] hover:text-white"}`}>
            <div className="relative flex-shrink-0">
              <Icon name={item.icon} size={22} />
              {item.key === "notifications" && unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[hsl(204_100%_50%)] rounded-full text-[9px] text-white flex items-center justify-center font-bold">{unread > 9 ? "9+" : unread}</span>
              )}
            </div>
            <span className="font-semibold hidden xl:block">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-4 pt-4 border-t border-[hsl(0_0%_12%)]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[hsl(0_0%_10%)] transition-colors cursor-pointer group">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: getAvatarColor(currentUser.id) }}>{getInitials(currentUser.name)}</div>
          <div className="flex-1 min-w-0 hidden xl:block">
            <p className="font-semibold text-white text-sm truncate">{currentUser.name}</p>
            <p className="text-[hsl(0_0%_45%)] text-xs">@{currentUser.handle}</p>
          </div>
          <button onClick={onLogout} className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(0_0%_45%)] hover:text-red-400 hidden xl:block">
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ page, onNavigate, unread }: { page: Page; onNavigate: (p: Page) => void; unread: number; }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-[hsl(0_0%_12%)] flex z-50 md:hidden">
      {NAV_ITEMS.slice(0, 5).map(item => (
        <button key={item.key} onClick={() => onNavigate(item.key)}
          className={`flex-1 flex flex-col items-center justify-center py-3 relative transition-colors ${page === item.key ? "text-[hsl(204_100%_50%)]" : "text-[hsl(0_0%_50%)]"}`}>
          <div className="relative">
            <Icon name={item.icon} size={22} />
            {item.key === "notifications" && unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(204_100%_50%)] rounded-full text-[9px] text-white flex items-center justify-center font-bold">{unread > 9 ? "9+" : unread}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ---------- Main ----------
export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("feed");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const sid = localStorage.getItem('session_id');
      if (sid) {
        const res = await authApi.me();
        if (res.ok) setCurrentUser(res.data);
        else localStorage.removeItem('session_id');
      }
      setLoading(false);
    })();
  }, []);

  // Периодически проверяем непрочитанные уведомления
  useEffect(() => {
    if (!currentUser) return;
    const check = async () => {
      const res = await socialApi.notifications();
      if (res.ok) setUnread(res.data.unread || 0);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = async () => {
    await authApi.logout();
    localStorage.removeItem('session_id');
    setCurrentUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[hsl(204_100%_50%)] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-black text-white">✦</span>
        </div>
        <div className="w-6 h-6 border-2 border-[hsl(204_100%_50%)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  const renderPage = () => {
    switch (page) {
      case "feed": return <FeedPage currentUser={currentUser} />;
      case "profile": return <ProfilePage currentUser={currentUser} />;
      case "messages": return <MessagesPage currentUser={currentUser} />;
      case "notifications": return <NotificationsPage />;
      case "search": return <SearchPage />;
      case "bookmarks": return <BookmarksPage />;
      case "community": return <CommunityPage />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto flex min-h-screen">
        <div className="hidden md:flex w-16 xl:w-64 flex-col border-r border-[hsl(0_0%_10%)] sticky top-0 h-screen overflow-y-auto">
          <Sidebar page={page} onNavigate={setPage} onLogout={handleLogout} currentUser={currentUser} unread={unread} />
        </div>
        <main className="flex-1 min-w-0 border-r border-[hsl(0_0%_10%)] pb-16 md:pb-0">
          {renderPage()}
        </main>
        <div className="hidden lg:block w-80 p-4 overflow-y-auto">
          <RightSidebar />
        </div>
      </div>
      <BottomNav page={page} onNavigate={setPage} unread={unread} />
    </div>
  );
}
