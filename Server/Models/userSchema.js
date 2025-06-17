const { Schema, model } = require('mongoose')

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email already exists'],
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ],
        lowercase: true
    },
    password: {
        type: String,
        minlength: [8, 'Password should be at least 8 characters']
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    }

},
    { timestamps: true }

)

const userModel = model('User', userSchema)
module.exports = userModel