import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'agri_dev_secret_key';
const ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24;

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// ==================== IN-MEMORY DATA STORES (MOCKED FROM SQLITE) ====================
let nextUserId = 1;
const users = [];

let nextScheduleId = 3;
const schedules = [
  {
    id: 1,
    name: 'نعناع البلكونة البلدي',
    interval_days: 2,
    moisture_level: 75.0,
    last_watered: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    owner_id: null
  },
  {
    id: 2,
    name: 'ريحان إيطالي عطري',
    interval_days: 1,
    moisture_level: 60.0,
    last_watered: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    owner_id: null
  }
];

let nextPostId = 3;
const communityPosts = [
  {
    id: 1,
    content: 'أول حصاد لي من الطماطم الكرزية من بلكونة الشقة! تمت الزراعة باستخدام خلطة بيتموس وبيرلايت.',
    likes: 14,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    owner_id: null,
    author_name: 'م. كريم عبدالفتاح',
    category: 'عرض حصاد',
    image_url: null
  },
  {
    id: 2,
    content: 'نصيحة سريعة: قص أطراف النعناع بانتظام يساعد على زيادة التفرعات وكثافة الأوراق.',
    likes: 9,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    owner_id: null,
    author_name: 'سارة محمود',
    category: 'تجارب زراعية',
    image_url: null
  }
];

// ==================== AUTH HELPERS & ROUTES ====================
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ detail: 'تعذر التحقق من اعتمادات الحساب' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.email === payload.sub);
    if (!user) {
      return res.status(401).json({ detail: 'تعذر التحقق من اعتمادات الحساب' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ detail: 'تعذر التحقق من اعتمادات الحساب' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    message: 'مرحباً بك في خادم منصة الزراعة الرقمية الذكية (Digital Agriculture API)'
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) {
    return res.status(400).json({ detail: 'يرجى إدخال جميع البيانات المطلوبة' });
  }
  const existing = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: 'البريد الإلكتروني مسجل بالفعل' });
  }
  const hashed_password = await bcrypt.hash(String(password), 10);
  const newUser = {
    id: nextUserId++,
    email: String(email),
    name: String(name),
    hashed_password,
    is_active: true,
    created_at: new Date().toISOString()
  };
  users.push(newUser);
  return res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    is_active: newUser.is_active,
    created_at: newUser.created_at
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !(await bcrypt.compare(String(password || ''), user.hashed_password))) {
    return res.status(400).json({ detail: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }
  const access_token = jwt.sign({ sub: user.email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE_SECONDS
  });
  return res.json({ access_token, token_type: 'bearer' });
});

app.post('/api/auth/token', async (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.email.toLowerCase() === String(username || '').toLowerCase());
  if (!user || !(await bcrypt.compare(String(password || ''), user.hashed_password))) {
    return res.status(400).json({ detail: 'خطأ في اسم المستخدم أو كلمة المرور' });
  }
  const access_token = jwt.sign({ sub: user.email }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRE_SECONDS
  });
  return res.json({ access_token, token_type: 'bearer' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { id, email, name, is_active, created_at } = req.user;
  return res.json({ id, email, name, is_active, created_at });
});

// ==================== SCHEDULE ROUTES ====================
app.get('/api/schedule', (_req, res) => {
  res.json(schedules);
});

app.post('/api/schedule', (req, res) => {
  const { name, interval_days } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ detail: 'يرجى إدخال اسم النبتة' });
  }
  const newPlant = {
    id: nextScheduleId++,
    name: String(name).trim(),
    interval_days: Number(interval_days) || 2,
    moisture_level: 80.0,
    last_watered: new Date().toISOString(),
    owner_id: null
  };
  schedules.push(newPlant);
  return res.status(201).json(newPlant);
});

app.put('/api/schedule/:plantId/water', (req, res) => {
  const plantId = Number(req.params.plantId);
  const plant = schedules.find((p) => p.id === plantId);
  if (!plant) {
    return res.status(404).json({ detail: 'النبتة غير موجودة' });
  }
  plant.last_watered = new Date().toISOString();
  plant.moisture_level = 100.0;
  return res.json(plant);
});

// ==================== COMMUNITY ROUTES ====================
app.get('/api/community/posts', (_req, res) => {
  const sorted = [...communityPosts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json(sorted);
});

app.post('/api/community/posts', (req, res) => {
  const { content, author_name, category, image_url } = req.body || {};
  if (!content && !image_url) {
    return res.status(400).json({ detail: 'يرجى إدخال محتوى المنشور' });
  }
  const newPost = {
    id: nextPostId++,
    content: String(content || ''),
    likes: 0,
    created_at: new Date().toISOString(),
    owner_id: null,
    author_name: author_name || 'عضو جديد',
    category: category || 'تجارب زراعية',
    image_url: image_url || null
  };
  communityPosts.unshift(newPost);
  return res.status(201).json(newPost);
});

app.post('/api/community/posts/:postId/like', (req, res) => {
  const postId = Number(req.params.postId);
  const post = communityPosts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ detail: 'المنشور غير موجود' });
  }
  post.likes += 1;
  return res.json(post);
});

// ==================== PLANT DOCTOR ROUTES ====================
app.post('/api/doctor/analyze', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file || !file.mimetype || !file.mimetype.startsWith('image/')) {
    return res.status(400).json({ detail: 'يرجى رفع ملف صورة صالح' });
  }

  return res.json({
    filename: file.originalname,
    confidence: 0.96,
    disease_name: 'البقع الفطرية السوداء (Black Spot)',
    symptoms:
      'بقع دائرية بنية داكنة مع اصفرار حول أطراف الورقة بسبب الرطوبة العالية وتجمع المياه.',
    treatment: [
      'قص الأوراق المصابة بشدة والتخلص منها فوراً.',
      'رش النبات بمبيد فطري نحاسي مرتين أسبوعياً.',
      'تجنب ري الأوراق مباشرة والري في الصباح الباكر فقط.'
    ]
  });
});

// ==================== STATIC PAGE ROUTES ====================
app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/community', '/community.html'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'community.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Digital Agriculture server listening on http://0.0.0.0:${PORT}`);
});
