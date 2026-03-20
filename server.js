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

const MongoStore = require('connect-mongo');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-key-pixelcraft',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions' // Default is 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 Years persistent login
    secure: process.env.NODE_ENV === 'production', // true for HTTPS in production
    httpOnly: true
  }
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
    // Successful authentication, redirect back to intended tool OR home page.
    const redirectTo = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectTo);
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
  // If not logged in and they try to visit a tool, redirect directly to Google Sign-In
  // We store the original URL in session to return them back after login
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/google');
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

// Serve all static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
