const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema( {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    confirmed: { type: Boolean, required: false},
    uniqueString: { type: String, required: false}
})

const model = mongoose.model('UserSchema', UserSchema);

module.exports = model;