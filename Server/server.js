const express = require('express')
const app = express()
app.set('trust proxy', 1); // Trust Render load balancer for secure cookies
require('dotenv').config()
const cors = require('cors');
const allowedOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "";
app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));
const cookieParser = require('cookie-parser');
const connectToDb = require('./Config/db')
const authRoutes = require('./Routes/authRoutes')
const documentRoutes = require('./Routes/documentRoutes')

const aiRoutes = require('./Routes/aiRoutes')


app.use(express.json())
app.use(cookieParser());
app.use('/api/auth', authRoutes)
app.use('/api', documentRoutes)
app.use('/api/ai', aiRoutes)

const port = process.env.PORT || 8000
const db = process.env.DB_URI

app.get('/', (req,res)=>{
    res.send('This is Home Route')
})

app.listen(port, (req,res)=>{
    console.log(`Server is running at http://localhost:${port}`)
    connectToDb(db)
})