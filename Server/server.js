const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors');
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
const cookieParser = require('cookie-parser');
const connectToDb = require('./Config/db')
const authRoutes = require('./Routes/authRoutes')
const documentRoutes = require('./Routes/documentRoutes')


app.use(express.json())
app.use(cookieParser());
app.use('/api/auth', authRoutes)
app.use('/api', documentRoutes)

const port = process.env.PORT || 8000
const db = process.env.DB_URI

app.get('/', (req,res)=>{
    res.send('This is Home Route')
})

app.listen(port, (req,res)=>{
    console.log(`Server is running at http://localhost:${port}`)
    connectToDb(db)
})