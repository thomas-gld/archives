import express from 'express'
import 'dotenv/config'
import prisma from './prisma.js'

const app = express()

const db = await prisma.User.findMany()
console.log(db)

app.set('view engine', "ejs")

app.use('/asset', express.static('asset'))


app.get('/', (req, res) => {
    res.render('home')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

const port = process.env.PORT
app.listen(port, function () {
    console.log(`Server listening on port ${port}`)
})