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
                
                if (req.path === '/admin.html') {
                    return next(); // Let admin.html load
                }

                const untilStr = req.user.banUntil ? req.user.banUntil.toLocaleString() : 'Permanent';
                const reason = req.user.banReason || 'Violation of Guidelines';

                return res.send(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head><title>Account Suspended</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { background-color: #050b14; color: #ef4444; font-family: 'Outfit', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; background-image: radial-gradient(circle at center, rgba(239,68,68,0.1) 0%, transparent 70%); }
                        .box { background: rgba(20,20,30,0.8); border: 1px solid #ef4444; padding: 40px; border-radius: 16px; box-shadow: 0 0 40px rgba(239,68,68,0.2); max-width: 500px; width: 90%; }
                        h1 { font-size: 32px; margin-top: 0; text-transform: uppercase; letter-spacing: 2px; }
                        p { color: #e2e8f0; line-height: 1.6; font-size: 16px; margin-bottom: 25px; }
                        .details { background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; text-align: left; }
                        .details span { display: block; margin-bottom: 8px; font-size: 14px; }
                        .details b { color: #ef4444; }
                        .btn { background: transparent; border: 1px solid #94a3b8; color: #94a3b8; padding: 10px 20px; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; transition: 0.3s; }
                        .btn:hover { background: #94a3b8; color: #000; }
                    </style>
                    </head>
                    <body>
                        <div class="box">
                            <h1>🚨 ACCESS REVOKED</h1>
                            <p>Your connection to PixelCraft AI has been suspended due to suspicious activity or a violation of our terms.</p>
                            <div class="details">
                                <span><b>REASON:</b> ${reason}</span>
                                <span><b>EXPIRES:</b> ${untilStr}</span>
                            </div>
                            <br>
                            <a href="/auth/google" class="btn">Check Status / Switch Account</a>
                        </div>
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

// Admin Panel Route
app.post('/api/admin/users', async (req, res) => {
  const { password } = req.body;
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'PxlCrft_Admin_8x9vZapL2qWkmN5jR_cF1yT').replace(/["']/g, "").trim();
  
  if (!password || password.trim() !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized access. Incorrect password.' });
  }
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
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
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

// Route to start Google Auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

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

// Middleware to Protect the /tools/ folder (Requires Sign-In to use tools)
/*
app.use('/tools', (req, res, next) => {
  if (req.isAuthenticated()) {
    // Allow tool access
    return next();
  }
  // If not logged in and they try to visit a tool, redirect directly to Google Sign-In
  // We store the original URL in session to return them back after login
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/google');
});
*/

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
const adminTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 4000, // 4 seconds max
    greetingTimeout: 4000,
    socketTimeout: 4000
});

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
app.post('/api/admin/ban', async (req, res) => {
  const { password, userId, isBanned, durationStr, reason } = req.body;
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'PxlCrft_Admin_8x9vZapL2qWkmN5jR_cF1yT').replace(/["']/g, "").trim();
  
  if (!password || password.trim() !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized access.' });
  }
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
        
        // Send Ban Email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const untilDate = (durationStr === 'permanent' || !durationStr) ? 'Permanent' : user.banUntil.toLocaleDateString();
            const dur = durationStr ? durationStr.toUpperCase() : 'PERMANENT';
            const mailOptions = {
                from: `"PixelCraft Security" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: '🚨 URGENT: Your Account Has Been Suspended',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ef4444; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; letter-spacing: 1px;">ACCOUNT SUSPENDED</h2>
                    </div>
                    <div style="padding: 30px; background-color: #111; color: #fff;">
                        <p>Dear ${user.name},</p>
                        <p>This is an automated notification from PixelCraft AI Security Systems.</p>
                        <p>Your account access has been revoked due to a violation of our Terms of Service.</p>
                        <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Reason:</strong> ${user.banReason}</p>
                            <p style="margin: 10px 0 0 0;"><strong>Ban Duration:</strong> ${dur}</p>
                            <p style="margin: 10px 0 0 0;"><strong>Expiration:</strong> ${untilDate}</p>
                        </div>
                        <p>Any further attempts to bypass this suspension may result in a permanent hardware and IP ban.</p>
                        <p style="margin-top: 30px; font-size: 12px; color: #888;">PixelCraft AI Automated Enforcement Agent</p>
                    </div>
                </div>`
            };
            try {
                const sendPromise = adminTransporter.sendMail(mailOptions);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
                await Promise.race([sendPromise, timeoutPromise]);
                emailStatus = 'Success';
            } catch(e) {
                if (e.message === 'Timeout') {
                    emailStatus = 'Sent in background (SMTP is slow)';
                } else {
                    emailStatus = 'Error: ' + e.message;
                    console.error("Email send failed:", e);
                }
            }
        } else {
            emailStatus = 'EMAIL_USER or EMAIL_PASS not set in environment';
        }
    } else {
        user.banUntil = null;
        user.banReason = '';
        await user.save();
    }
    res.json({ success: true, emailStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

// Admin Route to Send Warning Email
app.post('/api/admin/warn', async (req, res) => {
  const { password, userId, reason } = req.body;
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'PxlCrft_Admin_8x9vZapL2qWkmN5jR_cF1yT').replace(/["']/g, "").trim();
  
  if (!password || password.trim() !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized access.' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({error: 'User not found'});

    let emailStatus = 'Not Attempted';
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
            from: `"PixelCraft Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '⚠️ WARNING: Suspicious Activity Detected',
            html: `
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
            </div>`
        };
        try {
            const sendPromise = adminTransporter.sendMail(mailOptions);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
            await Promise.race([sendPromise, timeoutPromise]);
            emailStatus = 'Success';
        } catch(e) {
            if (e.message === 'Timeout') {
                emailStatus = 'Sent in background (SMTP is slow)';
            } else {
                emailStatus = 'Error: ' + e.message;
                console.error("Email send failed:", e);
            }
        }
    } else {
        emailStatus = 'EMAIL_USER or EMAIL_PASS not set in environment';
    }
    
    res.json({ success: true, emailStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send warning' });
  }
});


// Serve all static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
