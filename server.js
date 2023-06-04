const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Define the schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  password:{type:String, require: true},
  semester: { type: Number, required: false },
  branch: { type: String, required: true },
  userType: { type: String, enum: ['student', 'admin'], required: true }
});
const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  branch: { type: String, required: true },
  semester: { type: Number, required: false },
  userType: { type: String, enum: ['student', 'admin'], required: true }
});

const User = mongoose.model('User', userSchema);
const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
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

//Render the management page
app.get('/manage-users', async (req, res) => {
  const user = req.session.user;

  if (!user) {
    res.redirect('/');
    return;
  }
  if(user.userType != "admin"){
    res.redirect("/dashboard")
    return;
  }
  try {
    // Fetch the existing users from the database
    const existingUsers = await User.find();
    const pendingUsers = await PendingUser.find();
    // Render the manage.ejs file and pass the existingUsers array as a variable
    res.render('manage', { existingUsers, pendingUsers, currentUser: user.userId});
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
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
app.get('/view-notes', async (req, res)=>{
  res.redirect('/view-notes/1');
})
app.get('/view-notes/:semester', async (req, res) => {
  try {
    const user = req.session.user;
    const semester = req.params.semester;
    if (!user) {
      res.redirect('/');
      return;
    }
    if(user.userType === 'student' && semester != user.semester){
      res.redirect('/view-notes/'+ user.semester);
      return;
    }
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
    res.render('view-notes', {path:path, semester:semester, subjects: subjects, user : user});
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
//View Question papers
app.get('/view-questionpapers', async (req, res)=>{
  res.redirect('/view-questionpapers/1');
})
app.get('/view-questionpapers/:semester', async (req, res) => {
  const user = req.session.user;
  const semester = req.params.semester;
  if (!user) {
    res.redirect('/');
    return;
  }
  if(user.userType === 'student' && semester != user.semester){
    res.redirect('/view-questionpapers/'+ user.semester);
    return;
  }
  try {
    
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
    res.render('view-questionpapers', { path:path, semester: semester, subjects: subjects, user: user});
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
//View QuestionBank
app.get('/view-questionbank', async (req, res)=>{
  res.redirect('/view-questionbank/1');
})
app.get('/view-questionbank/:semester', async (req, res) => {
  const user = req.session.user;
  const semester = req.params.semester;

  if (!user) {
    res.redirect('/');
    return;
  }
  if(user.userType === 'student' && semester != user.semester){
    res.redirect('/view-questionbank/'+ user.semester);
    return;
  }

  
  try {
    const query = { semester: semester };
    const model = mongoose.model("QuestionBank");
    const data = await model.find(query);
    const subjects = {};
    data.forEach((qb) => {
      const subject = qb.subject;
      if (!subjects[subject]) {
        subjects[subject] = [];
      }
      subjects[subject].push(qb);
    });
    res.render('view-questionbank', { path: path, semester: semester, subjects: subjects, user: user});
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});
// Handle form submission

//Handle Login form submission
app.post('/login', (req, res) => {
  const { userId, password } = req.body;

  // Find the user with the given user ID
  User.findOne({ userId })
    .then((user) => {
      if (!user) {
        // If no user is found, redirect to the login page with an error message
        res.render('login.ejs', { msg: 'User ID not found in database!' });
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
              userId: user.userId,
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
              res.render('login.ejs', { msg: 'Invalid User Id or Password!' });
            }
          })
          .catch((error) => {
            // If there's an error, redirect to the login page with an error message
            res.render('login.ejs', { msg: 'Invalid User Id or Password!' });
          });
      }
    })
    .catch((error) => {
      // If there's an error, redirect to the login page with an error message
      res.render('login.ejs', { msg: 'Invalid User Id or Password!' });
    });
});

// Handle registration form submission
app.post('/register', (req, res) => {
  const { name, userId, password, branch, userType } = req.body;
  let semester;

  if (userType === 'admin') {
    if (userId.length !== 6) {
      return res.render('login.ejs', { msg: 'User ID for admin must be 6 digits long' });
    }
  } else if (userType === 'student') {
    if (!req.body.semester) {
      return res.render('login.ejs', { msg: 'Semester is required for student registration' });
    }
    semester = req.body.semester;
    if (userId.length !== 12) {
      return res.render('login.ejs', { msg: 'User ID for student must be 12 digits long' });
    }
  } else {
    return res.render('login.ejs', { msg: 'Invalid user type' });
  }

  // Check if user with the same user ID already exists in the pending users
  PendingUser.findOne({ userId })
    .then((pendingUser) => {
      if (pendingUser) {
        return res.render('login.ejs', { msg: 'User ID already pending for approval!' });
      }

      // Check if user with the same user ID already exists in the users collection
      User.findOne({ userId })
        .then((existingUser) => {
          if (existingUser) {
            return res.render('login.ejs', { msg: 'User with the same User ID already exists' });
          }

          // Create a new pending user document based on the user type
          let newPendingUser;
          if (userType === 'admin') {
            newPendingUser = new PendingUser({ name, userId, branch, userType });
          } else if (userType === 'student') {
            newPendingUser = new PendingUser({ name, userId, branch, userType, semester });
          }

          // Save the pending user to the database
          newPendingUser.save()
            .then(() => {
              res.render('login.ejs', { sucmsg: 'Registration Successful! Your account is pending approval.' });
            })
            .catch((error) => {
              res.render('register.ejs', { msg: 'Error registering user: ' + error.message });
            });
        })
        .catch((error) => {
          res.render('register.ejs', { msg: 'Error checking for existing user in users collection: ' + error.message });
        });
    })
    .catch((error) => {
      res.render('register.ejs', { msg: 'Error checking for existing user in pending users collection: ' + error.message });
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

//Remove Notes
app.post('/remove-note', async (req, res) => {
  const notesUrl = req.body.notesUrl;
  try {
    // Retrieve the note from the database using the notesUrl
    const note = await Note.findOne({ notesUrl: notesUrl });
    if (!note) {
      return res.status(404).send('Note not found');
    }

    // Delete the associated file
    const filePath = __dirname + note.notesUrl;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      }
    });

    // Remove the note from the database
    await note.deleteOne();

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Remove Question Bank
app.post('/remove-questionbank', async (req, res) => {
  const questionBankUrl = req.body.questionBankUrl;
  try {
    // Retrieve the question bank from the database using the questionBankUrl
    const questionBank = await QuestionBank.findOne({ questionBankUrl: questionBankUrl });
    if (!questionBank) {
      return res.status(404).send('Question bank not found');
    }

    // Delete the associated file
    const filePath = __dirname + questionBank.questionBankUrl;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      }
    });

    // Remove the question bank from the database
    await questionBank.deleteOne();

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Remove Question Paper
app.post('/remove-questionpaper', async (req, res) => {
  const questionPaperUrl = req.body.questionPaperUrl;
  try {
    // Retrieve the question paper from the database using the questionPaperUrl
    const questionPaper = await QuestionPaper.findOne({ questionPaperUrl: questionPaperUrl });
    if (!questionPaper) {
      return res.status(404).send('Question paper not found');
    }

    // Delete the associated file
    const filePath = __dirname + questionPaper.questionPaperUrl;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      }
    });

    // Remove the question paper from the database
    await questionPaper.deleteOne();

    res.redirect('back');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//Approve user registration request
app.post('/approve-user', async (req, res) => {
  const { userId } = req.body;

  try {
    // Retrieve the user details from the pendingUsers collection
    const pendingUser = await PendingUser.findOne({ userId }).exec();

    if (!pendingUser) {
      console.error('Pending user not found');
      return res.status(404).send('Pending user not found');
    }

    // Create a new user in the users collection
    let newUser;
    if (pendingUser.userType === 'student') {
      newUser = new User({
        name: pendingUser.name,
        userId: pendingUser.userId,
        userType: pendingUser.userType,
        branch: pendingUser.branch,
        semester: pendingUser.semester
      });
    } else {
      newUser = new User({
        name: pendingUser.name,
        userId: pendingUser.userId,
        userType: pendingUser.userType,
        branch: pendingUser.branch,
      });
    }

    await newUser.save();

    // Remove the user from the pendingUsers collection
    await PendingUser.deleteOne({ userId });
    const existingUsers = await User.find();
    const pendingUsers = await PendingUser.find();

    // Send a response indicating the successful approval
    res.redirect('/manage-users')
  } catch (err) {
    console.error('Error approving user:', err);
    res.redirect('/manage-users')
  }
});

// Reject User Registration request
app.post('/reject-user', async (req, res) => {
  const { userId } = req.body;

  try {
    // Find the pending user in the database
    const pendingUser = await PendingUser.findOne({ userId });
    if (!pendingUser) {
      return res.status(404).send('Pending user not found');
    }

    // Remove the pending user from the database
    await pendingUser.deleteOne();

    res.redirect('/manage-users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
//Remove Users
app.post('/remove-user', async (req, res) => {
  const userId = req.body.userId;
  try {
    // Find the user in the database
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Remove the user from the database
    await user.deleteOne();

    res.redirect('/manage-users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
