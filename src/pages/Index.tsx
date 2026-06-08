import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ---------- Types ----------
type Page = "feed" | "profile" | "messages" | "notifications" | "search" | "bookmarks" | "community";
type AuthPage = "login" | "register";

// ---------- Mock Data ----------
const MOCK_USERS = [
  { id: 1, name: "Анна Смирнова", handle: "@anna_sm", bio: "Дизайнер · Москва 🏙️", followers: 4820, following: 312 },
  { id: 2, name: "Максим Петров", handle: "@m_petrov", bio: "Разработчик · Питер", followers: 2100, following: 150 },
  { id: 3, name: "Лера Козлова", handle: "@lera_k", bio: "Фотограф · Казань 📷", followers: 9300, following: 420 },
  { id: 4, name: "Дима Волков", handle: "@dimaV", bio: "Маркетолог · Новосибирск", followers: 1500, following: 200 },
];

const MOCK_POSTS = [
  {
    id: 1, userId: 2, time: "2ч", text: "Запустил новый проект на React. Тёмная тема — must have в 2026 🌙",
    likes: 84, comments: 12, reposts: 5, bookmarked: false, liked: false,
    tags: ["разработка", "react"],
  },
  {
    id: 2, userId: 3, time: "4ч", text: "Снял серию уличных фотографий ночью. Ничего не сравнится с жизнью большого города после полуночи ✨",
    likes: 221, comments: 34, reposts: 19, bookmarked: true, liked: true,
    tags: ["фото", "город"],
  },
  {
    id: 3, userId: 1, time: "6ч", text: "Когда дизайн и разработка работают в унисон — рождаются шедевры. Делитесь своими проектами!",
    likes: 156, comments: 28, reposts: 11, bookmarked: false, liked: false,
    tags: ["дизайн", "вдохновение"],
  },
  {
    id: 4, userId: 4, time: "8ч", text: "ИИ-рекомендации в соцсетях — это не магия, это математика. Алгоритмы учатся на каждом вашем действии 🤖",
    likes: 312, comments: 67, reposts: 45, bookmarked: false, liked: false,
    tags: ["ии", "технологии"],
  },
  {
    id: 5, userId: 2, time: "1д", text: "Полезный совет: выключайте уведомления на 2 часа в день. Продуктивность вырастет в 3 раза. Проверено на себе.",
    likes: 540, comments: 89, reposts: 72, bookmarked: true, liked: false,
    tags: ["продуктивность"],
  },
];

const MOCK_MESSAGES = [
  { id: 1, userId: 3, lastMsg: "Отличные фотки! Как ты это снял?", time: "12:43", unread: 2 },
  { id: 2, userId: 1, lastMsg: "Посмотри мой новый проект 👀", time: "вчера", unread: 0 },
  { id: 3, userId: 4, lastMsg: "Давай созвонимся на этой неделе", time: "пн", unread: 0 },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "like", userId: 3, text: "лайкнула ваш пост", time: "5м", read: false },
  { id: 2, type: "follow", userId: 4, text: "начал читать вас", time: "1ч", read: false },
  { id: 3, type: "comment", userId: 1, text: 'прокомментировала: "Отличная идея!"', time: "3ч", read: true },
  { id: 4, type: "repost", userId: 2, text: "сделал репост вашего поста", time: "вчера", read: true },
  { id: 5, type: "recommend", userId: 0, text: "Алгоритм подобрал для вас 5 новых авторов", time: "вчера", read: true },
];

const COMMUNITIES = [
  { id: 1, name: "Дизайнеры России", members: 12400, desc: "Обсуждаем UI/UX, делимся кейсами", joined: true },
  { id: 2, name: "Разработка на React", members: 8700, desc: "Всё о React, TypeScript, фронтенде", joined: false },
  { id: 3, name: "Фотографы", members: 21000, desc: "Фото, техника, локации, вдохновение", joined: true },
  { id: 4, name: "Маркетинг 2026", members: 5600, desc: "Тренды, кейсы, стратегии продвижения", joined: false },
];

// ---------- Helpers ----------
function getUser(id: number) {
  return MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#1D9BF0", "#00BA7C", "#FF7A00", "#F4212E", "#794BC4"];
function getAvatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

// ---------- Auth Screen ----------
function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<AuthPage>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

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
          <h2 className="text-xl font-bold text-white mb-6">
            {mode === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
          </h2>
          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm text-[hsl(0_0%_55%)] mb-1.5 block">Имя</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя"
                  className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] focus:border-[hsl(204_100%_50%)] h-11" />
              </div>
            )}
            <div>
              <label className="text-sm text-[hsl(0_0%_55%)] mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] focus:border-[hsl(204_100%_50%)] h-11" />
            </div>
            <div>
              <label className="text-sm text-[hsl(0_0%_55%)] mb-1.5 block">Пароль</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] focus:border-[hsl(204_100%_50%)] h-11" />
            </div>
          </div>
          <Button onClick={onLogin}
            className="w-full mt-6 h-11 bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </Button>
          {mode === "login" && (
            <p className="text-center text-sm text-[hsl(0_0%_45%)] mt-4 cursor-pointer hover:text-[hsl(204_100%_50%)] transition-colors">
              Забыли пароль?
            </p>
          )}
        </div>

        <p className="text-center text-sm text-[hsl(0_0%_45%)] mt-6">
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <span className="text-[hsl(204_100%_50%)] cursor-pointer hover:underline font-medium"
            onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </span>
        </p>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1 bg-transparent border-[hsl(0_0%_18%)] text-white hover:bg-[hsl(0_0%_10%)] h-11 rounded-xl">
            <span className="mr-2">🔵</span> VK
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent border-[hsl(0_0%_18%)] text-white hover:bg-[hsl(0_0%_10%)] h-11 rounded-xl">
            <span className="mr-2">📱</span> Телефон
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Post Card ----------
function PostCard({ post, onLike, onBookmark }: {
  post: typeof MOCK_POSTS[0];
  onLike: (id: number) => void;
  onBookmark: (id: number) => void;
}) {
  const user = getUser(post.userId);
  return (
    <div className="border-b border-[hsl(0_0%_10%)] px-4 py-4 post-hover transition-colors cursor-pointer">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: getAvatarColor(post.userId) }}>
          {getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-white text-sm">{user.name}</span>
            <span className="text-[hsl(0_0%_45%)] text-sm">{user.handle}</span>
            <span className="text-[hsl(0_0%_35%)] text-xs">· {post.time}</span>
          </div>
          <p className="text-[hsl(0_0%_88%)] text-sm leading-relaxed mb-3">{post.text}</p>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {post.tags.map(tag => (
              <span key={tag} className="text-[hsl(204_100%_50%)] text-xs hover:underline cursor-pointer">#{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-[hsl(0_0%_45%)] hover:text-[hsl(204_100%_50%)] transition-colors">
              <Icon name="MessageCircle" size={16} />
              <span className="text-xs">{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 text-[hsl(0_0%_45%)] hover:text-[#00BA7C] transition-colors">
              <Icon name="Repeat2" size={16} />
              <span className="text-xs">{post.reposts}</span>
            </button>
            <button onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 transition-colors ${post.liked ? "text-[#F4212E]" : "text-[hsl(0_0%_45%)] hover:text-[#F4212E]"}`}>
              <Icon name="Heart" size={16} />
              <span className="text-xs">{post.liked ? post.likes + 1 : post.likes}</span>
            </button>
            <button onClick={() => onBookmark(post.id)}
              className={`flex items-center gap-1.5 transition-colors ml-auto ${post.bookmarked ? "text-[hsl(204_100%_50%)]" : "text-[hsl(0_0%_45%)] hover:text-[hsl(204_100%_50%)]"}`}>
              <Icon name="Bookmark" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Feed Page ----------
function FeedPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");
  const [tab, setTab] = useState<"for-you" | "following">("for-you");

  const handleLike = (id: number) => setPosts(p => p.map(post => post.id === id ? { ...post, liked: !post.liked } : post));
  const handleBookmark = (id: number) => setPosts(p => p.map(post => post.id === id ? { ...post, bookmarked: !post.bookmarked } : post));

  return (
    <div>
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-[hsl(0_0%_12%)]">
        <div className="flex">
          {[{ key: "for-you", label: "Для вас" }, { key: "following", label: "Подписки" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as "for-you" | "following")}
              className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${tab === t.key ? "text-white" : "text-[hsl(0_0%_45%)] hover:text-white"}`}>
              {t.label}
              {tab === t.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[hsl(204_100%_50%)] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-[hsl(0_0%_12%)] flex gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{ background: getAvatarColor(0) }}>Я</div>
        <div className="flex-1">
          <Textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Что происходит?"
            className="bg-transparent border-none resize-none text-white placeholder:text-[hsl(0_0%_35%)] text-base p-0 focus-visible:ring-0 min-h-[60px]" />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-3">
              <button className="text-[hsl(204_100%_50%)] hover:bg-[hsl(0_0%_12%)] p-1.5 rounded-lg transition-colors">
                <Icon name="Image" size={18} />
              </button>
              <button className="text-[hsl(204_100%_50%)] hover:bg-[hsl(0_0%_12%)] p-1.5 rounded-lg transition-colors">
                <Icon name="Smile" size={18} />
              </button>
            </div>
            <Button disabled={!newPost.trim()}
              className="bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] text-white font-semibold rounded-full px-5 h-9 text-sm disabled:opacity-30">
              Опубликовать
            </Button>
          </div>
        </div>
      </div>

      {tab === "for-you" && (
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

      {posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} onBookmark={handleBookmark} />)}
    </div>
  );
}

// ---------- Profile Page ----------
function ProfilePage() {
  const user = MOCK_USERS[0];
  const userPosts = MOCK_POSTS.filter(p => p.userId === user.id);
  const [tab, setTab] = useState<"posts" | "media" | "likes">("posts");
  const [followed, setFollowed] = useState(false);

  return (
    <div>
      <div className="h-36 bg-gradient-to-br from-[hsl(204_100%_28%)] via-[hsl(250_60%_20%)] to-[hsl(0_0%_8%)]" />
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="w-20 h-20 rounded-full border-4 border-black flex items-center justify-center text-white font-bold text-2xl"
            style={{ background: getAvatarColor(user.id) }}>
            {getInitials(user.name)}
          </div>
          <Button onClick={() => setFollowed(!followed)}
            className={`rounded-full px-5 h-9 font-semibold text-sm transition-all ${
              followed ? "bg-transparent border border-[hsl(0_0%_30%)] text-white hover:border-red-500 hover:text-red-500"
                : "bg-white text-black hover:bg-[hsl(0_0%_90%)]"
            }`}>
            {followed ? "Читаете" : "Читать"}
          </Button>
        </div>
        <h2 className="text-xl font-bold text-white">{user.name}</h2>
        <p className="text-[hsl(0_0%_45%)] text-sm">{user.handle}</p>
        <p className="text-[hsl(0_0%_80%)] text-sm mt-2">{user.bio}</p>
        <div className="flex gap-6 mt-3">
          <div><span className="font-bold text-white">{user.following}</span><span className="text-[hsl(0_0%_45%)] text-sm ml-1">подписок</span></div>
          <div><span className="font-bold text-white">{user.followers.toLocaleString()}</span><span className="text-[hsl(0_0%_45%)] text-sm ml-1">читателей</span></div>
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
      {userPosts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} onBookmark={() => {}} />)}
    </div>
  );
}

// ---------- Messages Page ----------
function MessagesPage() {
  const [active, setActive] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { text: "Привет! Как дела?", mine: false },
    { text: "Отлично, работаю над проектом 🚀", mine: true },
    { text: "Расскажи подробнее!", mine: false },
  ]);

  if (active !== null) {
    const conv = MOCK_MESSAGES.find(m => m.id === active)!;
    const user = getUser(conv.userId);
    return (
      <div className="flex flex-col h-[calc(100vh-60px)]">
        <div className="flex items-center gap-3 p-4 border-b border-[hsl(0_0%_12%)]">
          <button onClick={() => setActive(null)} className="text-[hsl(204_100%_50%)] mr-1">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: getAvatarColor(conv.userId) }}>{getInitials(user.name)}</div>
          <div>
            <p className="font-semibold text-white text-sm">{user.name}</p>
            <p className="text-[hsl(0_0%_45%)] text-xs">{user.handle}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {chatMsgs.map((m, i) => (
            <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm ${m.mine ? "bg-[hsl(204_100%_50%)] text-white rounded-br-sm" : "bg-[hsl(0_0%_12%)] text-white rounded-bl-sm"}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[hsl(0_0%_12%)] flex gap-3">
          <Input value={msg} onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && msg.trim()) { setChatMsgs(prev => [...prev, { text: msg, mine: true }]); setMsg(""); } }}
            placeholder="Сообщение..."
            className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] rounded-full" />
          <Button onClick={() => { if (msg.trim()) { setChatMsgs(prev => [...prev, { text: msg, mine: true }]); setMsg(""); } }}
            className="bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] rounded-full w-10 h-10 p-0 flex-shrink-0">
            <Icon name="Send" size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)]">
        <h2 className="text-xl font-bold text-white">Сообщения</h2>
      </div>
      <div className="p-4">
        <Input placeholder="Поиск в сообщениях..."
          className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] text-white placeholder:text-[hsl(0_0%_35%)] rounded-full" />
      </div>
      {MOCK_MESSAGES.map(conv => {
        const user = getUser(conv.userId);
        return (
          <div key={conv.id} onClick={() => setActive(conv.id)}
            className="flex items-center gap-3 px-4 py-3.5 post-hover transition-colors cursor-pointer border-b border-[hsl(0_0%_8%)]">
            <div className="relative">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: getAvatarColor(conv.userId) }}>{getInitials(user.name)}</div>
              {conv.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[hsl(204_100%_50%)] rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${conv.unread ? "text-white" : "text-[hsl(0_0%_80%)]"}`}>{user.name}</span>
                <span className="text-[hsl(0_0%_40%)] text-xs">{conv.time}</span>
              </div>
              <p className={`text-sm truncate mt-0.5 ${conv.unread ? "text-[hsl(0_0%_80%)]" : "text-[hsl(0_0%_45%)]"}`}>{conv.lastMsg}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Notifications Page ----------
function NotificationsPage() {
  const iconMap: Record<string, string> = { like: "Heart", follow: "UserPlus", comment: "MessageCircle", repost: "Repeat2", recommend: "Sparkles" };
  const colorMap: Record<string, string> = { like: "#F4212E", follow: "#00BA7C", comment: "#1D9BF0", repost: "#00BA7C", recommend: "#1D9BF0" };

  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)]">
        <h2 className="text-xl font-bold text-white">Уведомления</h2>
      </div>
      {MOCK_NOTIFICATIONS.map(notif => {
        const user = notif.userId > 0 ? getUser(notif.userId) : null;
        return (
          <div key={notif.id}
            className={`flex items-start gap-3 px-4 py-4 border-b border-[hsl(0_0%_8%)] post-hover transition-colors cursor-pointer ${!notif.read ? "bg-[hsl(204_100%_50%/0.04)]" : ""}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: colorMap[notif.type] + "22" }}>
              <Icon name={iconMap[notif.type]} size={18} style={{ color: colorMap[notif.type] }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-[hsl(0_0%_85%)]">
                {user && <span className="font-semibold text-white">{user.name} </span>}
                {notif.text}
              </p>
              <p className="text-xs text-[hsl(0_0%_40%)] mt-1">{notif.time}</p>
            </div>
            {!notif.read && <div className="w-2 h-2 rounded-full bg-[hsl(204_100%_50%)] mt-1.5 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Search Page ----------
function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"users" | "posts" | "tags">("users");
  const TRENDING = ["#реакт", "#дизайн", "#фото", "#ии", "#продуктивность", "#разработка", "#маркетинг", "#москва"];

  const filteredUsers = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) || u.handle.toLowerCase().includes(query.toLowerCase())
  );

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
          <h3 className="text-white font-bold mt-6 mb-4">Кого почитать</h3>
          {MOCK_USERS.slice(0, 3).map(user => (
            <div key={user.id} className="flex items-center gap-3 py-3 border-b border-[hsl(0_0%_8%)]">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: getAvatarColor(user.id) }}>{getInitials(user.name)}</div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{user.name}</p>
                <p className="text-[hsl(0_0%_45%)] text-xs">{user.bio}</p>
              </div>
              <Button className="bg-white text-black hover:bg-[hsl(0_0%_90%)] rounded-full px-4 h-8 text-xs font-semibold">
                Читать
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex border-b border-[hsl(0_0%_12%)]">
            {[{ key: "users", label: "Люди" }, { key: "posts", label: "Посты" }, { key: "tags", label: "Теги" }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as "users" | "posts" | "tags")}
                className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${tab === t.key ? "text-white" : "text-[hsl(0_0%_45%)] hover:text-white"}`}>
                {t.label}
                {tab === t.key && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[hsl(204_100%_50%)] rounded-full" />}
              </button>
            ))}
          </div>
          {filteredUsers.map(user => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3.5 post-hover transition-colors border-b border-[hsl(0_0%_8%)]">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold"
                style={{ background: getAvatarColor(user.id) }}>{getInitials(user.name)}</div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{user.name}</p>
                <p className="text-[hsl(0_0%_45%)] text-xs">{user.handle} · {user.followers.toLocaleString()} читателей</p>
                <p className="text-[hsl(0_0%_55%)] text-xs mt-0.5">{user.bio}</p>
              </div>
              <Button className="bg-white text-black hover:bg-[hsl(0_0%_90%)] rounded-full px-4 h-8 text-xs font-semibold flex-shrink-0">
                Читать
              </Button>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-16 text-[hsl(0_0%_35%)]">
              <Icon name="SearchX" size={32} className="mx-auto mb-3 opacity-40" />
              <p>Ничего не найдено</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Bookmarks Page ----------
function BookmarksPage() {
  const bookmarked = MOCK_POSTS.filter(p => p.bookmarked);
  return (
    <div>
      <div className="p-4 border-b border-[hsl(0_0%_12%)] flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Закладки</h2>
        <Badge className="bg-[hsl(204_100%_50%/0.15)] text-[hsl(204_100%_50%)] border-none">{bookmarked.length}</Badge>
      </div>
      {bookmarked.length === 0 ? (
        <div className="text-center py-20 text-[hsl(0_0%_35%)]">
          <Icon name="Bookmark" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Нет сохранённых постов</p>
        </div>
      ) : bookmarked.map(post => <PostCard key={post.id} post={post} onLike={() => {}} onBookmark={() => {}} />)}
    </div>
  );
}

// ---------- Community Page ----------
function CommunityPage() {
  const [communities, setCommunities] = useState(COMMUNITIES);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const toggle = (id: number) => setCommunities(c => c.map(com => com.id === id ? { ...com, joined: !com.joined } : com));
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
        {shown.map(com => (
          <div key={com.id} className="bg-[hsl(0_0%_6%)] border border-[hsl(0_0%_13%)] rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-white">{com.name}</h3>
                <p className="text-[hsl(0_0%_50%)] text-sm mt-0.5">{com.desc}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Icon name="Users" size={13} className="text-[hsl(0_0%_40%)]" />
                  <span className="text-[hsl(0_0%_45%)] text-xs">{com.members.toLocaleString()} участников</span>
                </div>
              </div>
              <Button onClick={() => toggle(com.id)}
                className={`ml-4 rounded-full px-4 h-8 text-xs font-semibold transition-all ${
                  com.joined ? "bg-transparent border border-[hsl(0_0%_30%)] text-white hover:border-red-500 hover:text-red-500"
                    : "bg-[hsl(204_100%_50%)] hover:bg-[hsl(204_100%_45%)] text-white"
                }`}>
                {com.joined ? "Вступили" : "Вступить"}
              </Button>
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <div className="text-center py-16 text-[hsl(0_0%_35%)]">
            <Icon name="Users" size={32} className="mx-auto mb-3 opacity-30" />
            <p>Вы пока не вступили в сообщества</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Sidebar ----------
const NAV_ITEMS: { key: Page; label: string; icon: string; badge?: number }[] = [
  { key: "feed", label: "Лента", icon: "Home" },
  { key: "search", label: "Поиск", icon: "Search" },
  { key: "notifications", label: "Уведомления", icon: "Bell", badge: 2 },
  { key: "messages", label: "Сообщения", icon: "Mail", badge: 3 },
  { key: "bookmarks", label: "Закладки", icon: "Bookmark" },
  { key: "community", label: "Сообщества", icon: "Users" },
  { key: "profile", label: "Профиль", icon: "User" },
];

function Sidebar({ page, onNavigate, onLogout }: { page: Page; onNavigate: (p: Page) => void; onLogout: () => void }) {
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
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all text-left ${
              page === item.key ? "bg-[hsl(204_100%_50%/0.12)] text-[hsl(204_100%_50%)]"
                : "text-[hsl(0_0%_70%)] hover:bg-[hsl(0_0%_10%)] hover:text-white"
            }`}>
            <div className="relative flex-shrink-0">
              <Icon name={item.icon} size={22} />
              {item.badge && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[hsl(204_100%_50%)] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="font-semibold hidden xl:block">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-4 pt-4 border-t border-[hsl(0_0%_12%)]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[hsl(0_0%_10%)] transition-colors cursor-pointer group">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: getAvatarColor(0) }}>Я</div>
          <div className="flex-1 min-w-0 hidden xl:block">
            <p className="font-semibold text-white text-sm">Мой профиль</p>
            <p className="text-[hsl(0_0%_45%)] text-xs">@me</p>
          </div>
          <button onClick={onLogout} className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(0_0%_45%)] hover:text-red-400 hidden xl:block">
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Mobile Bottom Nav ----------
function BottomNav({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-[hsl(0_0%_12%)] flex z-50 md:hidden">
      {NAV_ITEMS.slice(0, 5).map(item => (
        <button key={item.key} onClick={() => onNavigate(item.key)}
          className={`flex-1 flex flex-col items-center justify-center py-3 relative transition-colors ${page === item.key ? "text-[hsl(204_100%_50%)]" : "text-[hsl(0_0%_50%)]"}`}>
          <div className="relative">
            <Icon name={item.icon} size={22} />
            {item.badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(204_100%_50%)] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {item.badge}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ---------- Main ----------
export default function Index() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState<Page>("feed");

  if (!authed) return <AuthScreen onLogin={() => setAuthed(true)} />;

  const renderPage = () => {
    switch (page) {
      case "feed": return <FeedPage />;
      case "profile": return <ProfilePage />;
      case "messages": return <MessagesPage />;
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
          <Sidebar page={page} onNavigate={setPage} onLogout={() => setAuthed(false)} />
        </div>
        <main className="flex-1 min-w-0 border-r border-[hsl(0_0%_10%)] pb-16 md:pb-0">
          {renderPage()}
        </main>
        <div className="hidden lg:block w-80 p-4 space-y-4 overflow-y-auto">
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
          <div className="bg-[hsl(0_0%_5%)] rounded-2xl p-4 border border-[hsl(0_0%_12%)]">
            <h3 className="font-bold text-white text-sm mb-3">Популярное</h3>
            {["#реакт", "#дизайн2026", "#ии", "#фото"].map((tag, i) => (
              <div key={tag} className="flex items-center justify-between py-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div>
                  <p className="text-[hsl(0_0%_40%)] text-xs">{i + 1} · Тренды</p>
                  <p className="text-white font-semibold text-sm">{tag}</p>
                </div>
                <Icon name="TrendingUp" size={14} className="text-[hsl(0_0%_40%)]" />
              </div>
            ))}
          </div>
          <div className="bg-[hsl(0_0%_5%)] rounded-2xl p-4 border border-[hsl(0_0%_12%)]">
            <h3 className="font-bold text-white text-sm mb-3">Рекомендуем читать</h3>
            {MOCK_USERS.slice(1, 4).map(user => (
              <div key={user.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: getAvatarColor(user.id) }}>{getInitials(user.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-xs truncate">{user.name}</p>
                  <p className="text-[hsl(0_0%_45%)] text-xs">{user.handle}</p>
                </div>
                <Button className="bg-white text-black hover:bg-[hsl(0_0%_90%)] rounded-full px-3 h-7 text-xs font-semibold flex-shrink-0">+</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav page={page} onNavigate={setPage} />
    </div>
  );
}