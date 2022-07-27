const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./model/user');

const PORT = process.env.PORT || 3000;
const app = express();

const JWT_SECRET = 'tiyguhija.!.kosda@uysdjikosdauy#!@#!@#fhijsdfuys@hdjfseoirishv';

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

   try {
      const response = await User.create({
         email,
         username,
         password
      });
   } catch(error) {
      if (error.code === 11000) {
         if (error.keyValue.username == null) { // email already exists
            return res.json({ status: 'error', error: 'Email already exists'} );
         } else { // username already exists
            return res.json({ status: 'error', error: 'Username already exists'} );
         }
      }
      throw error;
   }

   res.json({ status: 'ok' });

});

app.listen(PORT, () => {
   console.log(`Listening on http://localhost:${PORT}`);
});