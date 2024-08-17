import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import session from 'express-session';
import mongoose from 'mongoose';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from './models/User.js';
import Post from './models/Post.js'; // Import the Post model
import flash from 'connect-flash';

const app = express();
const port = 3000;

// Connect to MongoDB
const mongoDB = "mongodb://localhost:27017/yourDatabaseName"; // Replace 'yourDatabaseName' with your desired database name
mongoose
  .connect(mongoDB)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware setup
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(flash());

// Session setup
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Authentication check middleware
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Routes
app.get("/", isLoggedIn, async (req, res) => {
  const posts = await Post.find().exec();
  res.render("home", { posts });
});

app.get("/curated", isLoggedIn, async (req, res) => {
  const posts = await Post.find().exec();
  res.render("curated", { posts });
});

app.get("/contact", isLoggedIn, (req, res) => {
  res.render("contact");
});

// Login route
app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Register route
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  User.register(new User({ username: username }), password, (err) => {
    if (err) {
      return res.status(400).send(err);
    }
    res.redirect("/login");
  });
});

// Logout route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

// Post routes
app.get("/view/:id", isLoggedIn, async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) {
    console.log(`Invalid ID format in /view/:id route: ${id}`);
    return res.status(400).send('Invalid ID format');
  }
  const post = await Post.findById(id).exec();
  if (post) {
    res.render("view", {
      postId: id,
      title: post.title,
      content: post.content,
    });
  } else {
    res.status(404).send("Post not found");
  }
});

app.post("/delete", isLoggedIn, async (req, res) => {
  const id = req.body.postId;
  if (!isValidObjectId(id)) {
    console.log(`Invalid ID format in /delete route: ${id}`);
    return res.status(400).send('Invalid ID format');
  }
  await Post.findByIdAndDelete(id);
  res.redirect("/");
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) {
    console.log(`Invalid ID format in /edit/:id route: ${id}`);
    return res.status(400).send('Invalid ID format');
  }
  const post = await Post.findById(id).exec();
  if (post) {
    res.render("edit", {
      postId: id,
      title: post.title,
      content: post.content,
    });
  } else {
    res.status(404).send("Post not found");
  }
});

app.post("/create-or-update", isLoggedIn, async (req, res) => {
  const postId = req.body.postId;
  const title = req.body.title;
  const content = req.body.content;

  // Check if postId is provided to determine if it's an edit or create action
  if (postId) {
    // Update action
    if (!isValidObjectId(postId)) {
      console.log(`Invalid ID format in /create-or-update route: ${postId}`);
      return res.status(400).send('Invalid ID format');
    }
    await Post.findByIdAndUpdate(postId, { title, content });
  } else {
    // Create action
    const post = new Post({ title, content });
    await post.save();
  }

  res.redirect("/");
}); 

app.post("/update", isLoggedIn, async (req, res) => {
  const id = req.body.index;
  if (!isValidObjectId(id)) {
    console.log(`Invalid ID format in /update route: ${id}`);
    return res.status(400).send('Invalid ID format');
  }
  const title = req.body.title;
  const content = req.body.content;
  await Post.findByIdAndUpdate(id, { title, content });
  res.redirect("/");
});

app.get("/create", isLoggedIn, (req, res) => {
  res.render("create", { postId: "", title: "", content: "" }); // Provide default values for postId, title, and content
});

app.post("/save", isLoggedIn, async (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({ title, content });
  await post.save();
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
