const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('./model/user');
const PORT = process.env.PORT || 3000;
const app = express();

const JWT_SECRET = 'tiyguhija.!.kosda@uysdjikosdauy#!@#!@#fhijsdfuys@hdjfseoirishv';

const { config } = require('dotenv');

config();


mongoose.connect('mongodb://localhost:27017/login-app-db')

app.use(bodyParser.json());
app.use(express.static("static"));

app.engine("html", require("ejs").renderFile);

app.get('/', function(req, res) {
   res.render("index.html");
});

app.get('/register', function(req, res) {
   res.render('register.html');
});

app.get('/profile', function(req, res) {
    res.render('profile.html');
});

app.get('/login', function(req, res) {
   res.render('login.html');
});

app.get('/verify/:uniqueString', async(req, res) => {
    const { uniqueString } = req.params;

    const user = await User.findOne({ uniqueString: uniqueString });

    if (user) {
        user.confirmed = true;
        await user.save();
        res.end("<h1> Email Successfully verified!</h1><br><br><br> " +
            " <button onclick='makeRedirect()'> Click here to go back to login page! </button>" +
            " <script> function makeRedirect() {" +
            " window.location.href = 'http://localhost:3000/login'" +
            "}</script>")
    } else {
        res.json('User not found');
    }
});

function randString() { //generating unique string for each user
    const len = 10;
    let randStr = '';
    for (let i = 0; i < len; ++i) {
        const ch = Math.floor((Math.random()) * 10) + 1;
        randStr += ch;
    }
    return randStr;
}

const sendEmail = (email, uniqueString) => {
    var Transport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    var mailOptions;
    const url = `http://localhost:3000/verify/${uniqueString}`;
    let sender = "Transport CO"
    mailOptions = {
        from: sender,
        to: email,
        subject: "Email confirmation",
        html: `Please click this email to confirm your email: <a href="${url}">${url}</a>`
    };

    Transport.sendMail(mailOptions, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("message sent!");
        }
    })
}

app.post('/api/change-password', async (req, res) => {
      const { token, newpassword: plainTextPassword } = req.body;

      if (!plainTextPassword || typeof plainTextPassword !== 'string') {
         return res.json({ status: 'error', error: 'Invalid password'});
      }

      if (plainTextPassword.length < 8) {
         return res.json({ status: 'error', error: 'Password length should be at least 8 characters'});
      }

      try {
         const user = jwt.verify(token, JWT_SECRET);
         const _id = user.id;
         const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

         await User.updateOne(
             { _id },
             {
                $set: { password: hashedPassword }
             }
         )

         res.json({ status: 'ok' });
      } catch (error) {
         res.json({ status: 'error', error: '))'});
      }
});

app.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      const user = await User.findOne({ username }).lean();

      if (user.confirmed === false) {
        return res.json({ status: 'error', error: 'Please confirm your Email!' });
      }

      if (!user) {
         return res.json({ status: 'error', error: 'Invalid username/password'});
      }

      if (await bcrypt.compare(password, user.password)) {
         const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);

         return res.json({ status: 'ok', login_token: token,  login_username: username});
      }

      res.json({ status: 'error', error: 'Invalid username/password'});
});

app.post('/api/register', async (req, res) => {
   const { email, username, password: plainTextPassword } = req.body;

   if (!email || typeof email !== 'string') {
      return res.json({ status: 'error', error: 'Invalid email' });
   }

   if (!username || typeof username !== 'string') {
      return res.json({ status: 'error', error: 'Invalid username'});
   }

   if (!plainTextPassword || typeof plainTextPassword !== 'string') {
      return res.json({ status: 'error', error: 'Invalid password'});
   }

   if (plainTextPassword.length < 8) {
      return res.json({ status: 'error', error: 'Password length should be at least 8 characters'});
   }

   const password = await bcrypt.hash(plainTextPassword, 10);
   const confirmed = false;
   const uniqueString = randString();

   try {
      const response = await User.create({
          email,
          username,
          password,
          confirmed,
          uniqueString
      });
   } catch(error) {
      if (error.code === 11000) {
         if (error.keyValue.username == null) { // email already exists
             return res.json({ status: 'error', error: 'Email already exists'})
         } else { // username already exists
            return res.json({ status: 'error', error: 'Username already exists'} );
         }
      }
      throw error;
   }

   sendEmail(email, uniqueString);
   res.json({ status: 'ok' });
});

app.listen(PORT, () => {
   console.log(`Listening on http://localhost:${PORT}`);
});