const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;
const { Note, QuestionPaper, QuestionBank, MockTest} = require('./models');

app.set("view engine", "ejs")
app.use(express.static('public'));
app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false
}));
app.use('/uploads', express.static(__dirname + '/uploads'));


// Use body-parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Define the schema for your collection
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  enrollmentNo: { type: String, required: true },
  password:{type:String, require: true},
  semester: { type: Number, required: true },
  branch: { type: String, required: true },
  userType: { type: String, enum: ['student', 'admin'], required: true }
});

// Create a model for your collection
const User = mongoose.model('User', userSchema);

// Connect to your MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/ela', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

//Render the login page
app.get('/', (req, res) => {
    res.render('login.ejs');
  });

app.get('/login', (req, res) => {
    res.render('login.ejs');
  });
  
// Render the registration form
app.get('/register', (req, res) => {
  res.render('register');
});

//Render the upload form
app.get('/upload', (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.redirect('/');
    return;
  }
  if(user.userType != "admin"){
    res.redirect("/dashboard")
    return;
  }
  res.render('upload');
});
//Render the dashboard
app.get('/dashboard', (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.redirect('/');
    return;
  }

  res.render('dashboard', { user });
});
//View
app.get('/view-notes/:semester', async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      res.redirect('/');
      return;
    }
    const semester = req.params.semester;
    const query = {semester: semester};
    const model = mongoose.model("Note");
    const data = await model.find(query);
    const subjects = {};
    data.forEach((note) => {
      const subject = note.subject;
      if (!subjects[subject]) {
        subjects[subject] = [];
      }
      subjects[subject].push(note);
    });
    res.render('view-notes', {path:path, semester:semester, subjects: subjects});
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
//View Question papers
app.get('/view-questionpapers/:semester', async (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.redirect('/');
    return;
  }
  try {
    const semester = req.params.semester;
    const query = { semester: semester};
    const model = mongoose.model("QuestionPaper");
    const data = await model.find(query).exec();

    const subjects = {};
    data.forEach((questionpaper) => {
      const subject = questionpaper.subject;
      if (!subjects[subject]) {
        subjects[subject] = [];
      }
      subjects[subject].push(questionpaper);
    });
    res.render('view-questionpapers', { path:path, semester: semester, subjects: subjects });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
//View QuestionBank
app.get('/view-questionbank/:semester', async (req, res) => {
  const user = req.session.user;
  if (!user) {
    res.redirect('/');
    return;
  }
  const semester = req.params.semester;
  try {
    const query = {semester: semester};
    const model = mongoose.model("QuestionBank")
    const data = await model.find(query);
    const subjects = {};
    data.forEach((qb) => {
      const subject = qb.subject;
      if (!subjects[subject]) {
        subjects[subject] = [];
      }
      subjects[subject].push(qb);
    });
    res.render('view-questionbank', {path:path, semester: semester, subjects: subjects});
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});
// Handle form submission

//Handle Login form submission
app.post('/login', (req, res) => {
  const { enrollmentNo, password } = req.body;

  // Find the user with the given enrollment number
  User.findOne({ enrollmentNo })
    .then((user) => {
      if (!user) {
        // If no user is found, redirect to the login page with an error message
        res.render('login.ejs', { msg: 'Enrollment no. not found in database!' });
      } else {
        // Compare the password with the hash stored in the database
        console.log(user.password)
              console.log(password)
        bcrypt.compare(password, user.password)
          .then((match) => {
            if (match) {
              console.log("matched")
              // Passwords match, store user details in session
              req.session.user = {
              name: user.name,
              enrollmentNo: user.enrollmentNo,
              semester: user.semester,
              branch: user.branch,
              userType: user.userType
            };
            console.log(req.session.user)
          // Redirect to dashboard
          req.session.save(() => {
            res.redirect('/dashboard');
          });
          
            } else {
              // If the password does not match, redirect to the login page with an error message
              res.render('login.ejs', { msg: 'Invalid Enrollment No. or Password!' });
            }
          })
          .catch((error) => {
            // If there's an error, redirect to the login page with an error message
            res.render('login.ejs', { msg: 'Invalid Enrollment No. or Password!' });
          });
      }
    })
    .catch((error) => {
      // If there's an error, redirect to the login page with an error message
      res.render('login.ejs', { msg: 'Invalid Enrollment No. or Password!' });
    });
});

// Handle registration form submission
app.post('/register', (req, res) => {
  // Get form data from request body
  const { name, enrollmentNo, password, semester, branch, userType } = req.body;

  // Check if user with the same enrollment number already exists
  User.findOne({ enrollmentNo })
    .then((user) => {
      if (user) {
        // If user already exists, redirect to error page with an error message
        res.render('login.ejs', { msg: 'Registration Failed! Enrollment No. already exists in database' });
      } else {
        // If user does not exist, create a new user document
        const newUser = new User({ name, enrollmentNo, password, semester, branch, userType });

        // Hash the password before saving to database
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            // Redirect to error page with an error message
            res.redirect('/error?msg=Registration Failed!:Error hashing password: ' + err.message);
          } else {
            newUser.password = hashedPassword;

            // Save the user document to the database
            newUser.save()
              .then(() => {
                // Redirect to success page with a success message
                res.render('login.ejs', { sucmsg: 'Registration Successful!' });
              })
              .catch((error) => {
                // Redirect to error page with an error message
                res.redirect('/error?msg=Registration Failed!:Error registering user: ' + error.message);
              });
          }
        });
      }
    })
    .catch((error) => {
      // Redirect to error page with an error message
      res.redirect('/error?msg=Registration Failed!:Error checking for existing user: ' + error.message);
    });
});

  
  // Handle success page
  app.get('/success', (req, res) => {
    // Get message query parameter
    const { msg } = req.query;
  
    // Render success page with message
    res.render('status', { msg });
  });
  
  // Handle error page
  app.get('/error', (req, res) => {
    // Get message query parameter
    const { msg } = req.query;
  
    // Render error page with message
    res.render('status', { msg });
  });

  app.get('/logout', (req, res) => {
    // destroy the session and redirect to the login page
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      res.redirect('/login');
    });
  });
  
// set up multer storage and file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.fileType;
    const uploadPath = path.join(__dirname, `uploads/${fileType}`);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

// set up multer upload object
const upload = multer({ storage: storage, fileFilter: fileFilter });

// set up route for file upload
app.post('/upload', upload.single('file'), (req, res, next) => {
  let fileType = req.body.fileType;
  if (!fileType) {
    fileType = req.file.originalname.endsWith('.pdf') ? 'question-paper' : 'notes';
  }
  const fileName = req.file.filename;
  const fileUrl = `/uploads/${fileType}/${fileName}`;
  function upload(data){
    data.save()
  .then(() => {
    res.render('upload.ejs', { msg: 'Successfully uploaded file and added to database!' });
  })
  .catch((err) => {
    console.error(err);
    res.render('upload.ejs', { msg: 'Error saving file to database' });
  });
  }
  if (fileType === 'notes') {
    const data = new Note({
      subject: req.body.subject,
      semester: req.body.semester,
      notesUrl: fileUrl
    });
    upload(data);
  } else if (fileType === 'question-paper') {
    const data = new QuestionPaper({
      subject: req.body.subject,
      semester: req.body.semester,
      year: req.body.year,
      questionPaperUrl: fileUrl
    });
    upload(data);
  } else if (fileType === 'question-bank') {
    const data = new QuestionBank({
      subject: req.body.subject,
      semester: req.body.semester,
      questionBankUrl: fileUrl
    });
    upload(data);
  } else if (fileType === 'mocktest') {
    const data = new MockTest({
      subject: req.body.subject,
      semester: req.body.semester,
      mockTestUrl: fileUrl
    });
    upload(data);
  }
});




// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
