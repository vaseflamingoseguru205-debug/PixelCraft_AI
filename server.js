require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const User = require('./models/User');

const app = express();
app.set('trust proxy', 1); // Trust the Render proxy to fix HTTP/HTTPS mismatch
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  // Use new URL parser (handled by default in latest mongoose, but safe to include)
}).then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.error('MongoDB Error:', err));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key-pixelcraft',
  resave: false,
  saveUninitialized: false
}));

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

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id-to-prevent-crash',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
    callbackURL: "/auth/google/callback",
    proxy: true // Necessary for HTTPS on Render
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : 'no-email@provided.com',
          avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
        });
        console.log("New user registered:", user.email);
      } else {
        // Option to update last login / traffic logic can go here
        user.lastLogin = Date.now();
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      console.error("🔴 Google Auth Error (Check MongoDB connection!):", err.message);
      return done(err, null);
    }
  }
));

// --- API ROUTES ---

// Check if user is logged in (Frontend calls this to update UI)
app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
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
    // Successful authentication, redirect to home page.
    res.redirect('/');
  }
);

// Logout Route
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Middleware to Protect the /tools/ folder (Requires Sign-In to use tools)
app.use('/tools', (req, res, next) => {
  if (req.isAuthenticated()) {
    // Allow tool access
    return next();
  }
  // If not logged in and they try to visit a tool, redirect to home with a prompt
  res.redirect('/?login_required=true');
});

const nodemailer = require('nodemailer');

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if(!name || !email || !message) return res.status(400).json({ error: "Missing fields" });

  try {
    console.log(`📩 Preparing to send email from contact form (Name: ${name}, Email: ${email})`);
    
    // Explicitly configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'swapnil.biradar.cse@gmail.com',
        pass: process.env.EMAIL_PASS
      }
    });

    // Gmail requires 'from' to match the authenticated email to prevent spam blocking
    const mailOptions = {
      from: `"PixelCraft Contact" <${process.env.EMAIL_USER || 'swapnil.biradar.cse@gmail.com'}>`,
      replyTo: email,
      to: 'swapnil.biradar.cse@gmail.com',
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
  } catch(err) {
    console.error("🔴 Email Send Error (Check EMAIL_PASS App Password):", err.message);
    res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

// --- REAL AI AVATAR GENERATOR HANDLER ---
app.post('/api/generate-avatar', async (req, res) => {
  const { imageBase64, style } = req.body;
  if(!imageBase64 || !style) return res.status(400).json({ error: "Missing image or style" });

  try {
    console.log(`🤖 Generating AI Avatar via Pollinations.ai (${style})...`);

    // Style-specific prompts for best results
    let prompt = "";
    if(style === "Anime Style")         prompt = "Transform this photo into a beautiful anime character illustration, studio ghibli art style, highly detailed, vibrant colors, clean anime face features, masterpiece quality";
    else if(style === "3D Avatar")       prompt = "Transform this photo into a Pixar/Disney 3D animated character, ultra realistic 3D render, soft cinematic lighting, highly detailed, professional CGI quality";
    else if(style === "Cartoon Avatar")  prompt = "Transform this photo into a cartoon character illustration, flat bold colors, clean thick outlines, comic book art style, friendly and expressive";
    else if(style === "Sketch")          prompt = "Transform this photo into a realistic pencil sketch portrait, detailed cross-hatching, professional fine art drawing, black and white";
    else if(style === "Pixel Art")       prompt = "Transform this photo into retro 16-bit pixel art character sprite, crisp pixels, game art style, vibrant limited color palette";
    else                                 prompt = "Transform this photo into an anime illustration";

    // Pollinations.ai /v1/images/edits — accepts source image as base64 URL
    // This is completely free, no API key needed!
    const pollinationsRes = await fetch('https://gen.pollinations.ai/v1/images/edits', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image: imageBase64,   // base64 data URL accepted directly
        model: 'gptimage',    // best image editing model
        response_format: 'b64_json'
      })
    });

    console.log(`Pollinations Response Status: ${pollinationsRes.status}`);

    if(!pollinationsRes.ok) {
      const errorText = await pollinationsRes.text();
      console.error("Pollinations Error:", errorText.substring(0, 300));
      throw new Error(`Pollinations API error ${pollinationsRes.status}: ${errorText.substring(0,150)}`);
    }

    const data = await pollinationsRes.json();

    // Get the b64 result from the response
    const resultB64 = data?.data?.[0]?.b64_json || data?.b64_json;
    const resultUrl  = data?.data?.[0]?.url;
    
    if(resultB64) {
      const resultBase64 = `data:image/png;base64,${resultB64}`;
      console.log(`✅ Avatar generated successfully via Pollinations.ai!`);
      return res.json({ success: true, resultImage: resultBase64 });
    } else if(resultUrl) {
      // Fetch the URL and convert to base64
      const imgRes = await fetch(resultUrl);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const resultBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
      console.log(`✅ Avatar generated successfully via URL!`);
      return res.json({ success: true, resultImage: resultBase64 });
    } else {
      console.error("Unexpected response structure:", JSON.stringify(data).substring(0, 300));
      throw new Error("Could not extract image from Pollinations response.");
    }

  } catch(err) {
    console.error("🔴 AI Generation Error:", err.message);
    res.status(500).json({ error: "Generation failed", details: err.message });
  }
});

// Serve all static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
