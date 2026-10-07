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
    }],
    isPublic: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

documentSchema.index({ owner: 1, updatedAt: -1 });
documentSchema.index({ collaborators: 1, updatedAt: -1 });

const documentModel = model('Document', documentSchema)
module.exports = documentModel