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

  const hfToken = process.env.HF_API_KEY;
  if(!hfToken || hfToken.trim() === '') {
    return res.status(501).json({ 
      error: "API_KEY_MISSING",
      message: "Hey Admin! To generate genuine AI Avatars, you must add HF_API_KEY to your .env file."
    });
  }

  try {
    console.log(`🤖 Generating AI Avatar via Hugging Face API (${style})...`);
    
    // Convert base64 to binary buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a robust prompt based on the style
    let prompt = "";
    if(style === "Anime Style") prompt = "Make them look like a highly detailed, beautiful anime character, masterpiece, studio ghibli style";
    else if(style === "3D Avatar") prompt = "Turn them into a highly detailed Pixar 3D animated character, 3D render, octane render, beautiful lighting";
    else if(style === "Cartoon Avatar") prompt = "Turn them into a western comic book cartoon character, flat colors, clean lines";
    else if(style === "Sketch") prompt = "Turn them into a detailed pencil sketch drawing, shading, artistic";
    else if(style === "Pixel Art") prompt = "Turn them into a retro 16-bit pixel art character, crisp pixels";
    else prompt = "Turn them into an anime character";

    // For Instruct-Pix2Pix, we specify the instructions in the headers or custom body.
    // However, Hugging Face standard inference for image-to-image takes image binary in body 
    // and prompt in headers or json. A generic HuggingFace image-to-image call:
    
    // We will use standard fetch for stability base or instruct-pix2pix
    // Instruct-pix2pix uses text as "inputs" and image as "image" in json OR
    // standard huggingface image-to-image pipeline: 
    // We send a POST request with the file buffer, but we need to pass the "prompt" somehow if using a model that accepts it.
    // Instead of HF which is tricky with Img2Img via raw HTTP, let's provide a robust structured response
    // if HF fails or is building. We will mock the output or return an API instruction if the model is loading.

    // Using a more reliable open endpoint style if HF is too complex, but HF is best for free.
    // We will use the free HuggingFace endpoints. To pass prompt and image:
    const FormData = require('form-data');
    const form = new FormData();
    form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
    form.append('prompt', prompt);

    const fResponse = await fetch('https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${hfToken}`,
        ...form.getHeaders()
      },
      body: form
    });

    if(!fResponse.ok) {
        const errorText = await fResponse.text();
        console.error("HF API Error:", errorText);
        
        // If Model is loading, HF returns 503
        if (fResponse.status === 503) {
           return res.status(503).json({ error: "Model is currently loading. Please wait 30 seconds and try again." });
        }
        throw new Error(`External API Error: ${fResponse.status} ${fResponse.statusText}. Please verify your HF_API_KEY inside .env`);
    }

    const arrayBuffer = await fResponse.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    const resultBase64 = `data:image/jpeg;base64,${resultBuffer.toString('base64')}`;

    res.json({ success: true, resultImage: resultBase64 });
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
