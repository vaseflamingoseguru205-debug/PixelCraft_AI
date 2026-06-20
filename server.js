require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS to bypass ISP block on SRV records
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const User = require('./models/User');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const app = express();
app.set('trust proxy', 1); // Trust the Render proxy to fix HTTP/HTTPS mismatch
const PORT = process.env.PORT || 8080;

// Connect to MongoDB (Will log error locally if DNS blocked, but won't crash)
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000 // Don't hang forever
}).then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.error('MongoDB Connection warning (Safe to ignore locally):', err.message));

const MongoStore = require('connect-mongo').default || require('connect-mongo').MongoStore;

const sessionConfig = {
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 Years persistent login
    secure: process.env.NODE_ENV === 'production', // true for HTTPS in production
    httpOnly: true
  }
};

// Only use MongoDB for sessions if we are in production or explicitly asked to
// This prevents 'querySrv ECONNREFUSED' crashes locally on restrictive ISPs.
if (process.env.RENDER || process.env.NODE_ENV === 'production') {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  });
} else {
  console.log("Using Local Memory Session Store");
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serialize & Deserialize User for sessions
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// GLOBAL BAN ENFORCEMENT MIDDLEWARE
app.use(async (req, res, next) => {
    if (req.isAuthenticated() && req.user) {
        if (req.user.isBanned) {
            // Check if temporary ban has expired
            if (req.user.banUntil && req.user.banUntil <= Date.now()) {
                try {
                    req.user.isBanned = false;
                    req.user.banUntil = null;
                    req.user.banReason = '';
                    await req.user.save();
                    return next();
                } catch(e) { console.error("Error auto-unbanning:", e); }
            } else {
                // User is still banned. Block them!
                if (req.path.startsWith('/api/admin/')) {
                    return next(); // Don't block admin routes just in case
                }
                
                // Allow static assets so the page doesn't look completely broken, but block HTML and APIs
                if (req.path.endsWith('.css') || req.path.endsWith('.js') || req.path.endsWith('.png') || req.path.endsWith('.svg') || req.path.endsWith('.ico')) {
                    return next();
                }

                if (req.path.startsWith('/api/')) {
                    return res.status(403).json({ error: "Your account is suspended." });
                }
                
                if (req.path === '/admin.html' || 
                    req.path === '/terms-conditions.html' || 
                    req.path === '/privacy-policy.html' || 
                    req.path === '/contact-us.html' || 
                    req.path === '/disclaimer.html') {
                    return next(); 
                }

                const untilStr = req.user.banUntil ? req.user.banUntil.toLocaleString() : 'Permanent';
                const reason = req.user.banReason || 'Violation of Guidelines';
                return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Account Paused — PixelCraft AI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: #09090b;
            color: #e4e4e7;
            font-family: 'Outfit', sans-serif;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background-image: radial-gradient(circle at center, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
        }
        .container { width: 100%; max-width: 440px; padding: 20px; }
        
        .card {
            background: rgba(24, 24, 27, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 32px 28px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .icon-box {
            width: 64px; height: 64px;
            margin: 0 auto 16px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
            border-radius: 18px;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px;
            border: 1px solid rgba(168, 85, 247, 0.3);
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
        }

        h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 8px; letter-spacing: 0.5px; }
        p { font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 24px; }

        .details {
            background: rgba(0,0,0,0.3);
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: left;
            border: 1px solid rgba(255,255,255,0.04);
        }
        .detail-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 6px 0;
            font-size: 13px;
        }
        .detail-item:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.03); }
        .detail-label { color: #71717a; font-weight: 500; }
        .detail-value { color: #e4e4e7; font-weight: 600; text-align: right; max-width: 65%; word-break: break-all; }
        .highlight { color: #a855f7; }

        /* Compact Timer */
        .timer-box {
            display: ${req.user.banUntil && req.user.banUntil > Date.now() ? 'flex' : 'none'};
            align-items: center; justify-content: space-between;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 24px;
        }
        .timer-text { font-size: 12px; color: #a1a1aa; text-align: left; line-height: 1.3; }
        .timer-clock { font-size: 18px; font-weight: 700; color: #818cf8; font-variant-numeric: tabular-nums; }

        /* Interactive Button */
        .btn {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: #fff;
            border: none;
            padding: 14px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25);
        }
        .btn::after {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(rgba(255,255,255,0.2), transparent);
            opacity: 0; transition: opacity 0.3s;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(99, 102, 241, 0.35); }
        .btn:hover::after { opacity: 1; }
        .btn:active { transform: translateY(1px) scale(0.98); }
        .btn.clicked { background: #10b981; pointer-events: none; }

        .links {
            margin-top: 20px;
            display: flex; justify-content: center; gap: 16px;
        }
        .links a {
            color: #71717a; font-size: 12px; text-decoration: none; transition: color 0.2s;
        }
        .links a:hover { color: #e4e4e7; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="icon-box">🛡️</div>
            <h1>Account Paused</h1>
            <p>Your access has been temporarily restricted due to policy enforcement. Don't worry, you can appeal this.</p>
            
            <div class="details">
                <div class="detail-item">
                    <span class="detail-label">Account</span>
                    <span class="detail-value">${req.user.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Reason</span>
                    <span class="detail-value">${reason}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value highlight">${req.user.banUntil && req.user.banUntil > Date.now() ? 'Temp Hold' : 'Indefinite Hold'}</span>
                </div>
            </div>

            <div class="timer-box">
                <div class="timer-text">Auto-restores in<br>Wait or appeal below</div>
                <div class="timer-clock" id="countdown">--:--:--</div>
            </div>

            <a href="mailto:support.pixelcraft205@gmail.com?subject=Account%20Appeal" class="btn" id="appealBtn" onclick="this.innerHTML='<span>Opening Mail Client... ✨</span>'; setTimeout(() => { this.innerHTML='<span>Request Appeal Review</span><svg width=\\'18\\' height=\\'18\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z\\'/></svg>'; }, 4000);">
                <span>Request Appeal Review</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </a>

            <div class="links">
                <a href="/terms-conditions.html" target="_blank">Terms</a>
                <a href="/privacy-policy.html" target="_blank">Privacy</a>
                <a href="/contact-us.html" target="_blank">Support</a>
            </div>
        </div>
    </div>

    <script>

        // Countdown Timer Logic
        const banUntil = ${req.user.banUntil ? new Date(req.user.banUntil).getTime() : 0};
        if (banUntil > Date.now()) {
            function updateCountdown() {
                const now = Date.now();
                const diff = banUntil - now;
                if (diff <= 0) {
                    document.getElementById('countdown').textContent = 'Ready!';
                    setTimeout(() => window.location.reload(), 2000);
                    return;
                }
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                
                let str = '';
                if (d > 0) { str = d + 'd ' + String(h).padStart(2,'0') + 'h'; }
                else { str = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0'); }
                
                document.getElementById('countdown').textContent = str;
            }
            updateCountdown();
            setInterval(updateCountdown, 1000);
        }
    </script>
</body>
</html>
                `);
            }
        }
    }
    next();
});

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id-to-prevent-crash',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
  callbackURL: "/auth/google/callback",
  proxy: true, // Necessary for HTTPS on Render
  passReqToCallback: true
},
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Parse User-Agent
      const ua = req.headers['user-agent'] || '';
      let deviceType = 'Desktop';
      if (/mobile/i.test(ua)) deviceType = 'Mobile';
      if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'Tablet';
      
      let os = 'Unknown';
      if (/windows/i.test(ua)) os = 'Windows';
      else if (/mac/i.test(ua)) os = 'MacOS';
      else if (/linux/i.test(ua)) os = 'Linux';
      else if (/android/i.test(ua)) os = 'Android';
      else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

      let browser = 'Unknown';
      if (/chrome|crios|crmo/i.test(ua)) browser = 'Chrome';
      else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
      else if (/safari/i.test(ua)) browser = 'Safari';
      else if (/opr\//i.test(ua)) browser = 'Opera';
      else if (/edg/i.test(ua)) browser = 'Edge';

      // Parse IP
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
      if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();

      // Find or create user
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : 'no-email@provided.com',
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
        });
        console.log("New user registered:", user.email);
      }
      
      // Update tracking data on every login
      user.lastLogin = Date.now();
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLoginIp = ip;
      user.deviceType = deviceType;
      user.os = os;
      user.browser = browser;

      let sessionLocation = { country: 'Unknown', city: 'Unknown', isp: 'Unknown' };

      // Async fetch location
      if (ip && ip !== 'Unknown' && ip !== '::1' && ip !== '127.0.0.1') {
        try {
            const locRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`);
            const locData = await locRes.json();
            if (locData.status === 'success') {
                user.country = locData.country || 'Unknown';
                user.city = locData.city || 'Unknown';
                user.isp = locData.isp || 'Unknown';
                sessionLocation = { country: user.country, city: user.city, isp: user.isp };
            }
        } catch (e) {
            console.error("IP Lookup failed:", e.message);
        }
      } else if (ip === '::1' || ip === '127.0.0.1') {
          user.country = 'Localhost';
          user.city = 'Local';
          user.isp = 'Local Network';
          sessionLocation = { country: 'Localhost', city: 'Local', isp: 'Local Network' };
      }

      // Add to login history
      user.loginHistory.push({
          loginAt: Date.now(),
          ip: ip,
          deviceType: deviceType,
          os: os,
          browser: browser,
          city: sessionLocation.city,
          country: sessionLocation.country,
          isp: sessionLocation.isp
      });

      await user.save();
      return done(null, user);
    } catch (err) {
      console.error("🔴 Google Auth Error (Check MongoDB connection!):", err.message);
      return done(err, null);
    }
  }
));

// --- API ROUTES ---

// Admin Authorization Middleware (2-Step Verification)
const requireAdminAuth = (req, res, next) => {
  // Try to get password from body (POST) or headers (GET)
  const password = req.body.password || req.headers['x-admin-password'];
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'PxlCrft_Admin_8x9vZapL2qWkmN5jR_cF1yT').replace(/["']/g, "").trim();

  // Check Access Key only
  if (!password || password.trim() !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized access. Incorrect Access Key.' });
  }


  next();
};

// --- ADVANCED DEPLOYMENT CENTER ENDPOINTS ---

// 1. Get Project Files
app.get('/api/admin/files', requireAdminAuth, (req, res) => {
  try {
    const publicDir = path.join(__dirname, 'public');
    const rootDir = __dirname;
    
    // Read root files (like server.js) and public directory
    const getFiles = (dir, prefix = '') => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          // Exclude node_modules, .git, etc.
          if (!file.startsWith('.') && file !== 'node_modules' && file !== 'models' && file !== 'scratch_imgly') {
             results = results.concat(getFiles(filePath, prefix + file + '/'));
          }
        } else {
          // Allow editing .html, .css, .js, .json
          if (file.match(/\.(html|css|js|json)$/)) {
            results.push({ name: file, path: prefix + file, fullPath: filePath });
          }
        }
      });
      return results;
    };

    const publicFiles = getFiles(publicDir, 'public/');
    const rootFiles = getFiles(rootDir, '').filter(f => !f.path.startsWith('public/')); // Exclude duplicates
    
    res.json({ files: [...rootFiles, ...publicFiles] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read directory' });
  }
});

// 2. Read specific file content
app.get('/api/admin/file/read', requireAdminAuth, (req, res) => {
  try {
    const targetPath = req.query.path;
    if (!targetPath || targetPath.includes('..')) return res.status(400).json({ error: 'Invalid path' });
    
    const absolutePath = path.join(__dirname, targetPath);
    if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'File not found' });

    const content = fs.readFileSync(absolutePath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// 3. Deploy/Save file content with Rollback support
app.post('/api/admin/file/deploy', requireAdminAuth, (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath || filePath.includes('..')) return res.status(400).json({ error: 'Invalid path' });
    if (typeof content !== 'string') return res.status(400).json({ error: 'Invalid content' });

    const absolutePath = path.join(__dirname, filePath);
    if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'File not found' });

    // Create Backup (Rollback Support)
    const backupPath = absolutePath + '.bak';
    fs.copyFileSync(absolutePath, backupPath);

    // Write new content
    fs.writeFileSync(absolutePath, content, 'utf8');

    res.json({ success: true, message: 'File deployed successfully! Backup created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deploy file' });
  }
});

// Admin Panel Route
app.post('/api/admin/users', requireAdminAuth, async (req, res) => {

  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Check if user is logged in (Frontend calls this to update UI)
app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user, requireLoginForTools: appSettings.requireLoginForTools });
  } else {
    res.json({ authenticated: false, requireLoginForTools: appSettings.requireLoginForTools });
  }
});

// Telemetry endpoint to track tool usage and active time
app.post('/api/user/track', async (req, res) => {
  if (req.isAuthenticated()) {
    const { toolName, durationSeconds } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (user && durationSeconds) {
        user.totalTimeSpentSeconds += durationSeconds;
        if (toolName && toolName !== 'Home') {
          user.toolUsageHistory.push({ toolName, durationSeconds });
          user.toolsUsedCount += 1;
        }
        await user.save();
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('Tracking Error:', err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(401);
  }
});

// Session Behavior Tracking (Scroll Depth + Engagement Type)
app.post('/api/user/track-behavior', async (req, res) => {
  if (req.isAuthenticated()) {
    const { scrollDepthPercent, toolsOpenedCount, timeOnSiteSeconds } = req.body;
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        let engagementType = 'No Interaction';
        if (toolsOpenedCount >= 3 && scrollDepthPercent >= 60) {
          engagementType = 'Deep User';
        } else if (toolsOpenedCount >= 1) {
          engagementType = 'Tool Used';
        } else if (scrollDepthPercent >= 20) {
          engagementType = 'Scroll Only';
        }
        
        user.sessionBehaviors.push({
          sessionAt: Date.now(),
          scrollDepthPercent: Math.round(scrollDepthPercent),
          engagementType,
          toolsOpenedCount: toolsOpenedCount || 0,
          timeOnSiteSeconds: timeOnSiteSeconds || 0
        });
        
        // Keep only last 50 session behaviors to avoid data bloat
        if (user.sessionBehaviors.length > 50) {
          user.sessionBehaviors = user.sessionBehaviors.slice(-50);
        }
        
        await user.save();
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('Behavior Tracking Error:', err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200); // Silently ignore for guests
  }
});

// Route to start Google Auth
app.get('/auth/google', (req, res, next) => {
  const options = { scope: ['profile', 'email'] };
  if (req.query.prompt === 'select_account') {
    options.prompt = 'select_account';
  }
  if (req.query.returnTo) {
    req.session.returnTo = req.query.returnTo;
  }
  passport.authenticate('google', options)(req, res, next);
});

// Switch Account Route - Clears current session first, then forces Google account chooser
app.get('/auth/switch-account', (req, res, next) => {
  // Step 1: Logout from passport
  req.logout((err) => {
    if (err) { return next(err); }
    // Step 2: Destroy the server session completely
    req.session.destroy(() => {
      // Step 3: Clear session cookie from browser
      res.clearCookie('connect.sid');
      // Step 4: Redirect to Google auth with prompt=select_account
      // Now session is gone, so Google will show the full account chooser list
      res.redirect('/auth/google?prompt=select_account');
    });
  });
});

// Callback after Google Authorization
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?error=login_failed' }),
  (req, res) => {
    // Successful authentication, redirect back to intended tool OR home page.
    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  }
);

// Logout Route
app.get('/logout', async (req, res, next) => {
  if (req.isAuthenticated()) {
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        user.lastLogout = Date.now();
        user.logoutCount += 1;
        await user.save();
      }
    } catch (err) {
      console.error('Logout tracking error:', err);
    }
  }
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Technical Evolution Report Routes
app.get('/website-evolution-report.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'website-evolution-report.html'));
});
app.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'website-evolution-report.html'));
});

// AI Generation Route (Used for 3D AI QR and other tools)
app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  
  if (!process.env.HF_API_KEY) {
    return res.status(500).json({ error: "HF_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API Error: ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    res.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (err) {
    console.error("AI Generation Error:", err.message);
    res.status(500).json({ error: "Failed to generate AI image" });
  }
});

let appSettings = { requireLoginForTools: true };
try {
  appSettings = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json')));
} catch(e) {}

// API to get settings
app.get('/api/admin/settings', requireAdminAuth, (req, res) => {
  res.json(appSettings);
});

// API to update settings
app.post('/api/admin/settings', requireAdminAuth, (req, res) => {
  if (req.body.requireLoginForTools !== undefined) {
    appSettings.requireLoginForTools = req.body.requireLoginForTools;
    fs.writeFileSync(path.join(__dirname, 'settings.json'), JSON.stringify(appSettings));
  }
  res.json({ success: true, settings: appSettings });
});

// Middleware to Protect the /tools/ folder (Requires Sign-In to use tools)
app.use('/tools', (req, res, next) => {
  if (!appSettings.requireLoginForTools) {
    return next();
  }
  if (req.isAuthenticated()) {
    // Allow tool access
    return next();
  }
  // If not logged in and they try to visit a tool, redirect directly to Google Sign-In
  req.session.returnTo = '/tools' + req.url;
  res.redirect('/auth/google');
});

// AI Audio/SFX Generation Route (Using Hugging Face AudioLDM2)
app.post('/api/generate-sfx', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  
  if (!process.env.HF_API_KEY) {
    return res.status(500).json({ error: "HF_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/cvssp/audioldm2",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      // Handle model loading error gracefully
      if (response.status === 503) {
        return res.status(503).json({ error: "Model is currently loading on Hugging Face. Please try again in 30 seconds." });
      }
      throw new Error(`HF API Error: ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    res.json({ audio: `data:audio/wav;base64,${base64}` });
  } catch (err) {
    console.error("AI SFX Generation Error:", err.message);
    res.status(500).json({ error: "Failed to generate AI sound effect" });
  }
});

// AI Text Generation for Fan Engage Manager
app.post('/api/generate-comment', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });
  
  if (!process.env.HF_API_KEY) {
    return res.status(500).json({ error: "HF_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ 
          inputs: prompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false
          }
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API Error: ${errorText}`);
    }
    
    const data = await response.json();
    let generatedText = data[0]?.generated_text || "Could not generate response.";
    
    res.json({ text: generatedText });
  } catch (err) {
    console.error("AI Comment Generation Error:", err.message);
    res.status(500).json({ error: "Failed to generate AI comment" });
  }
});


const nodemailer = require('nodemailer');

app.post('/api/contact', async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: "Missing fields" });

  // ✅ Verify reCAPTCHA token with Google
  if (!recaptchaToken) {
    return res.status(400).json({ error: "reCAPTCHA verification required. Please complete the checkbox." });
  }
  try {
    const verifyRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      console.warn("❌ reCAPTCHA verification failed:", verifyData['error-codes']);
      return res.status(400).json({ error: "reCAPTCHA failed. Please try again." });
    }
    console.log("✅ reCAPTCHA verified successfully");
  } catch (captchaErr) {
    console.error("🔴 reCAPTCHA check error:", captchaErr.message);
    return res.status(500).json({ error: "Failed to verify reCAPTCHA. Try again later." });
  }

  try {
    console.log(`📩 Preparing to send email from contact form (Name: ${name}, Email: ${email})`);

    // Explicitly configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Gmail requires 'from' to match the authenticated email to prevent spam blocking
    const mailOptions = {
      from: `"PixelCraft Contact" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_USER, // Sends the contact message to the website owner's email
      subject: `New Message from PixelCraft Website: ${name}`,
      text: `Someone just sent a message from your website contact form!
      
Name: ${name}
Email: ${email}

Message: 
${message}
`
    };

    // Attempt to send email
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (err) {
    console.error("🔴 Email Send Error (Check EMAIL_PASS App Password):", err.message);
    res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

// ===== PHISHING SCANNER ENDPOINT =====
app.post('/api/scan-link', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    let target = url;
    if (!target.startsWith('http')) target = 'http://' + target;
    const parsed = new URL(target);
    const domain = parsed.hostname.toLowerCase();
    
    // Advanced Military-Grade Heuristics
    // Advanced Military-Grade Heuristics
    const heuristics = {
      homograph: /[а-яА-Я\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/.test(domain) || domain.includes('xn--') || /[^\x00-\x7F]/.test(domain),
      deepSubdomains: domain.split('.').length > 3,
      typosquatting: /(?:faceb00k|g00gle|app1e|paypa1|micr0s0ft|netf1ix|amaz0n|b1nance|c0inbase)/i.test(domain) || (domain.replace(/[01345@]/g, c => ({'0':'o','1':'l','3':'e','4':'a','5':'s','@':'a'})[c] || c).match(/(facebook|google|apple|paypal|microsoft|netflix|amazon|binance|coinbase)/) && !/(facebook|google|apple|paypal|microsoft|netflix|amazon|binance|coinbase)/i.test(domain)),
      suspiciousPath: /login|verify|update|secure|banking|account|billing|auth|recover|password|admin|wallet|crypto/i.test(parsed.pathname) || parsed.pathname.length > 50,
      isShortener: /bit\.ly|t\.co|goo\.gl|tinyurl|is\.gd|ow\.ly|buff\.ly|bit\.do|shorturl\.at|cutt\.ly|shorte\.st|adf\.ly/i.test(domain),
      hasIpAddress: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain),
      isSuspiciousTLD: /\.(xyz|top|club|loan|win|vip|online|stream|download|click|link|tk|ml|ga|cf|gq)$/i.test(domain)
    };

    let finalUrl = target;
    if (heuristics.isShortener) {
      try {
        const r = await fetch(target, { redirect: 'follow', method: 'HEAD', timeout: 3000 });
        finalUrl = r.url;
      } catch(e) {}
    }

    let riskScore = 0;
    if (heuristics.homograph) riskScore += 50;
    if (heuristics.deepSubdomains) riskScore += 30;
    if (heuristics.typosquatting) riskScore += 60;
    if (heuristics.suspiciousPath) riskScore += 30;
    if (heuristics.isShortener) riskScore += 25;
    if (heuristics.hasIpAddress) riskScore += 70;
    if (heuristics.isSuspiciousTLD) riskScore += 40;

    const threatKeywords = ['phish', 'secure', 'login', 'update', 'verify', 'account', 'free', 'bonus', 'gift', 'claim'];
    const threatDbMatch = riskScore > 50 || threatKeywords.some(kw => domain.includes(kw));
    if (threatDbMatch) riskScore += 45;

    // Additional check for IP
    if (heuristics.hasIpAddress && heuristics.suspiciousPath) {
       riskScore += 50; 
    }

    riskScore = Math.min(100, riskScore);

    // --- AI REASONING BRAIN ---
    let aiAnalysis = null;
    if (process.env.HF_API_KEY) {
      try {
        const prompt = `<|system|>
You are an elite cybersecurity AI. Analyze this URL for phishing threats.
URL: ${finalUrl}
Base Heuristic Score: ${riskScore} (100 is max danger)

Important: Genuine sites like "amazon.co.jp", "google.co.in", or "microsoft.com" might trigger basic alerts due to subdomains. If the domain is exactly a well-known genuine brand (like amazon.co.jp), it is SAFE (score 0). Fakes look like "amazon-update.com" or "amz0n.com".

Output ONLY valid JSON in this exact format, with no extra text:
{"overrideRiskScore": <number 0-100>, "reasoning": "<short explanation>"}
</s>
<|user|>
Analyze the URL and output the JSON.
</s>
<|assistant|>
{`;

        const aiResponse = await fetch(
          "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
          {
            headers: {
              Authorization: `Bearer ${process.env.HF_API_KEY}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ 
              inputs: prompt,
              parameters: {
                max_new_tokens: 100,
                temperature: 0.1,
                top_p: 0.9,
                return_full_text: false
              }
            }),
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          let rawText = aiData[0]?.generated_text || "";
          rawText = "{" + rawText; // re-add the bracket
          const jsonMatch = rawText.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            const parsedAI = JSON.parse(jsonMatch[0]);
            aiAnalysis = parsedAI;
            riskScore = parsedAI.overrideRiskScore; // AI decides final score
          }
        }
      } catch (e) {
        console.error("AI Brain error:", e.message);
      }
    }

    res.json({
      originalUrl: url,
      finalUrl,
      heuristics,
      threatDbMatch,
      riskScore,
      aiAnalysis
    });
  } catch (err) {
    res.status(400).json({ error: "Invalid URL format" });
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const formData = new globalThis.FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error("Catbox upload failed");
    const url = await response.text();
    
    res.json({ success: true, url: url.trim() });
  } catch (err) {
    console.error("PDF Upload Error:", err.message);
    res.status(500).json({ error: "Failed to upload file to catbox" });
  }
});

// Serve all static files (HTML, CSS, JS) from the 'public' folder
/* --- GLOBAL AUTHENTICATION WALL (COMMENTED FOR ADSENSE APPROVAL) ---
app.use((req, res, next) => {
  const allowedPaths = [
    '/login.html',
    '/about-us.html',
    '/contact-us.html',
    '/privacy-policy.html',
    '/terms-conditions.html',
    '/cookies-policy.html',
    '/disclaimer.html'
  ];
  
  if (req.isAuthenticated() || allowedPaths.includes(req.path)) {
    return next();
  }

  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return next();
  }

  const ext = path.extname(req.path).toLowerCase();
  const allowedExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.json'];
  if (allowedExtensions.includes(ext)) {
    return next();
  }

  // Store requested URL to redirect back after login
  req.session.returnTo = req.originalUrl;
  res.redirect('/login.html');
});
*/
// Nodemailer setup removed (Using Apps Script Webhook instead)

// Endpoint to verify if an email is registered (used for strict email validation)
app.post('/api/verify-registered-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ exists: false });
        
        // Find user by email in MongoDB (exact match)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            if (user.isBanned) {
                // Check if temporary ban has expired
                if (user.banUntil && user.banUntil <= Date.now()) {
                    user.isBanned = false;
                    user.banUntil = null;
                    user.banReason = '';
                    await user.save();
                    return res.json({ exists: true });
                }
                return res.json({ exists: false, banned: true }); // Treat as not existing if banned, to trigger access denied
            }
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        console.error("Error verifying email:", err);
        res.json({ exists: false });
    }
});

// Admin Route to Ban/Unban users
app.post('/api/admin/ban', requireAdminAuth, async (req, res) => {
  const { userId, isBanned, durationStr, reason } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({error: 'User not found'});

    user.isBanned = isBanned;
    let emailStatus = 'Not Attempted';
    
    if (isBanned) {
        user.banReason = reason || 'Violation of Terms of Service';
        if (durationStr === '1day') user.banUntil = new Date(Date.now() + 24*60*60*1000);
        else if (durationStr === '5days') user.banUntil = new Date(Date.now() + 5*24*60*60*1000);
        else if (durationStr === '10days') user.banUntil = new Date(Date.now() + 10*24*60*60*1000);
        else if (durationStr === '1month') user.banUntil = new Date(Date.now() + 30*24*60*60*1000);
        else user.banUntil = new Date(Date.now() + 100*365*24*60*60*1000); // permanent
        
        await user.save();
        
        // Send Ban Email using Google Apps Script Webhook
        const untilDate = (durationStr === 'permanent' || !durationStr) ? 'Permanent' : user.banUntil.toLocaleDateString();
        const dur = durationStr ? durationStr.toUpperCase() : 'PERMANENT';
        const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ef4444; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #7f1d1d, #ef4444); color: white; padding: 30px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">🛡️</div>
                <h2 style="margin: 0; letter-spacing: 1px; font-size: 24px;">ACCOUNT SUSPENDED</h2>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.85;">Action taken by Automated Security System</p>
            </div>
            <div style="padding: 35px; background-color: #0f0f12; color: #fff;">
                <p style="font-size: 18px; font-weight: bold; color: #f87171;">Dear ${user.name},</p>
                <p style="color: #cbd5e1; line-height: 1.7;">This is an automated notification. Your account access has been revoked due to a violation of our policies.</p>
                
                <div style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #ef4444;">Reason:</strong> <span style="color: #fecaca;">${user.banReason}</span></p>
                    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #ef4444;">Duration:</strong> <span style="color: #fecaca;">${dur}</span></p>
                    <p style="margin: 0; font-size: 14px;"><strong style="color: #ef4444;">Expiration:</strong> <span style="color: #fecaca;">${untilDate}</span></p>
                </div>
                
                <p style="color: #94a3b8; line-height: 1.7; font-size: 14px;">If you believe this action was taken in error, you may submit an appeal for review.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="mailto:support.pixelcraft205@gmail.com?subject=Account%20Appeal" style="background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                        ✉️ Submit Appeal
                    </a>
                </div>
                
                <p style="color: #64748b; text-align: center; font-size: 13px;">
                    <a href="https://pixelcraft-ai-94y5.onrender.com/terms-conditions.html" style="color: #ef4444; text-decoration: none;">Terms & Conditions</a> | 
                    <a href="https://pixelcraft-ai-94y5.onrender.com/privacy-policy.html" style="color: #ef4444; text-decoration: none;">Privacy Policy</a>
                </p>
                
                <p style="margin-top: 30px; font-size: 12px; color: #475569; border-top: 1px solid #2a1111; padding-top: 15px; text-align: center;">PixelCraft AI Security — Ref: ${Date.now()}-${Math.floor(Math.random()*1000)}</p>
            </div>
        </div>`;

        try {
            const sendPromise = fetch('https://script.google.com/macros/s/AKfycbzoAyBCCB3XS153lCTFmbuV83GrrjuxLJbaq4pMcgtEln7Db02lr2ayvKIB-Ejjbw5W/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pass: "PixelCraft_Secret_Key_9988",
                    to: user.email,
                    subject: '🚨 URGENT: Your Account Has Been Suspended',
                    html: htmlBody
                })
            }).then(r => r.json());
            
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000));
            const result = await Promise.race([sendPromise, timeoutPromise]);
            
            if (result && result.success) {
                emailStatus = 'Success';
            } else {
                emailStatus = 'Error: ' + (result ? result.error : 'Unknown App Script Error');
            }
        } catch(e) {
            if (e.message === 'Timeout') {
                emailStatus = 'Sent in background (SMTP is slow)';
            } else {
                emailStatus = 'Error: ' + e.message;
                console.error("Email send failed:", e);
            }
        }
    } else {
        // RESTORE ACCOUNT - Send a satisfying welcome back email
        user.isBanned = false;
        user.banUntil = null;
        user.banReason = '';
        await user.save();
        
        const restoreHtmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #10b981; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #064e3b, #10b981); color: white; padding: 30px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                <h2 style="margin: 0; letter-spacing: 1px; font-size: 24px;">ACCOUNT RESTORED</h2>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.85;">Your access to PixelCraft AI has been reinstated</p>
            </div>
            <div style="padding: 35px; background-color: #0f1f1a; color: #fff;">
                <p style="font-size: 18px; font-weight: bold; color: #10b981;">Welcome back, ${user.name}! 🎉</p>
                <p style="color: #cbd5e1; line-height: 1.7;">We're glad to let you know that after a review, your PixelCraft AI account has been fully restored and all restrictions have been lifted.</p>
                
                <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #10b981;">✓ Status:</strong> <span style="color: #d1fae5;">Account Fully Active</span></p>
                    <p style="margin: 0 0 8px 0; font-size: 14px;"><strong style="color: #10b981;">✓ Access:</strong> <span style="color: #d1fae5;">All AI Tools Unlocked</span></p>
                    <p style="margin: 0; font-size: 14px;"><strong style="color: #10b981;">✓ Date:</strong> <span style="color: #d1fae5;">${new Date().toLocaleString()}</span></p>
                </div>
                
                <p style="color: #94a3b8; line-height: 1.7; font-size: 14px;">We trust that you will continue to use our platform responsibly and in accordance with our <a href="https://pixelcraft-ai-94y5.onrender.com/terms-conditions.html" style="color: #10b981;">Terms of Service</a>. Our community thrives when everyone plays by the rules.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://pixelcraft-ai-94y5.onrender.com/" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 35px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                        🚀 Go to PixelCraft AI
                    </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #475569; border-top: 1px solid #1e3a2f; padding-top: 15px; text-align: center;">PixelCraft AI Security — Ref: ${Date.now()}-${Math.floor(Math.random()*1000)}</p>
            </div>
        </div>`;
        
        try {
            const sendPromise = fetch('https://script.google.com/macros/s/AKfycbzoAyBCCB3XS153lCTFmbuV83GrrjuxLJbaq4pMcgtEln7Db02lr2ayvKIB-Ejjbw5W/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pass: "PixelCraft_Secret_Key_9988",
                    to: user.email,
                    subject: '✅ Great News! Your PixelCraft AI Account Has Been Restored',
                    html: restoreHtmlBody
                })
            }).then(r => r.json());
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000));
            const result = await Promise.race([sendPromise, timeoutPromise]);
            if (result && result.success) {
                emailStatus = 'Restore Email Sent Successfully';
            } else {
                emailStatus = 'Restore Email Error: ' + (result ? result.error : 'Unknown');
            }
        } catch(e) {
            emailStatus = e.message === 'Timeout' ? 'Restore Email Sent (background)' : 'Restore Email Error: ' + e.message;
        }
    }
    res.json({ success: true, emailStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

// Admin Route to Send Warning Email
app.post('/api/admin/warn', requireAdminAuth, async (req, res) => {
  const { userId, reason } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({error: 'User not found'});

    let emailStatus = 'Not Attempted';
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f59e0b; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; letter-spacing: 1px;">OFFICIAL WARNING</h2>
        </div>
        <div style="padding: 30px; background-color: #111; color: #fff;">
            <p>Dear ${user.name},</p>
            <p>This is an automated warning from PixelCraft AI Security Systems.</p>
            <p>We have detected activity on your account that violates our guidelines.</p>
            <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Warning Reason:</strong> ${reason}</p>
            </div>
            <p>Please stop this activity immediately. Repeated violations will result in an automatic account suspension.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #888;">PixelCraft AI Automated Enforcement Agent</p>
        </div>
    </div>`;

    try {
        const sendPromise = fetch('https://script.google.com/macros/s/AKfycbzoAyBCCB3XS153lCTFmbuV83GrrjuxLJbaq4pMcgtEln7Db02lr2ayvKIB-Ejjbw5W/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pass: "PixelCraft_Secret_Key_9988",
                to: user.email,
                subject: '⚠️ WARNING: Suspicious Activity Detected',
                html: htmlBody
            })
        }).then(r => r.json());
        
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000));
        const result = await Promise.race([sendPromise, timeoutPromise]);
        
        if (result && result.success) {
            emailStatus = 'Success';
        } else {
            emailStatus = 'Error: ' + (result ? result.error : 'Unknown App Script Error');
        }
    } catch(e) {
        if (e.message === 'Timeout') {
            emailStatus = 'Sent in background (SMTP is slow)';
        } else {
            emailStatus = 'Error: ' + e.message;
            console.error("Email send failed:", e);
        }
    }
    
    res.json({ success: true, emailStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send warning' });
  }
});

// Delete User Route
app.post('/api/admin/delete-user', requireAdminAuth, async (req, res) => {
  const { userId } = req.body;
  
  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({error: 'User not found'});
    res.json({ success: true, message: 'User permanently deleted from database' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// Protect the tools directory
app.use('/tools', (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login.html');
  }
  next();
});

// Serve all static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
