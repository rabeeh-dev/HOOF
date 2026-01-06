require('dotenv').config()
const express = require('express')
const app = express()
const session = require('express-session')
const connectDB = require('./config/db')
const PORT = process.env.PORT || 3000

connectDB()

app.get('/',(req,res)=>{
    res.send("Server is running")
})



app.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`)
})