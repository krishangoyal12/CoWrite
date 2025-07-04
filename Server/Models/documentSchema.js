const {Schema, model} = require('mongoose')

const documentSchema = new Schema({
    title:{
        type: String,
        default: 'Untitled Document'
    },
    content:{
        type: String,
        default: ''
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators:[{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {timestamps: true});

const documentModel = model('Document', documentSchema)
module.exports = documentModel