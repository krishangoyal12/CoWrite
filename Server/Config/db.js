const {connect} = require('mongoose')

const connectToDb = async(url)=>{
    try {
        await connect(url)
        console.log('Connected successfully to Database')
    } catch (error) {
        console.error('Error in connecting to Database', error)
    }
}

module.exports = connectToDb