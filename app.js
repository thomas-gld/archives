import express from 'express'
import 'dotenv/config'
import prisma from './prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { randomObjectFromTab } from './utils.mjs'

// --------------------------------------------

const app = express()
const db_user = await prisma.User.findMany()
console.log(db_user)
const db_quotes = await prisma.Quote.findMany()
console.log(db_quotes)
const saltRounds = 5

// ----------------------------------------

app.set('view engine', "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/asset', express.static('asset'))

// ------------------------------------------

app.get('/', async (req, res) => {
    const quotes = await prisma.Quote.findMany()
    const quote = randomObjectFromTab(quotes)

    if (!quote) {
        res.render('home', {quoteText: "", author: "", postedBy: "", book: "", score: 0, id: 0})
        return
    }

    const book = quote.book || ""
    const quoteText = quote.quote_text || ""
    const author = quote.author || ""
    const postedBy = quote.posted_by || ""
    const score = quote.score || 0
    const id = quote.id

    res.render('home', {quoteText, author, postedBy, book, score, id})
})

app.get('/login', (req, res) => {
    res.render('login', {error_message : "", message : ""})
})

app.get('/register', (req, res) => {
    res.render('register', {error_message : ""})
})

app.get('/user_page', (req, res) => {
    res.render('user_page', {user_name : ""})
})

// ----------------------------------------------

app.post('/login_verify', async(req, res) => {
    const name = req.body.name
    const password = req.body.password

    const user = await prisma.User.findUnique({
        where : {name}
        }
    )

    const pass = await bcrypt.compare(password, user.password)

    // Unknown in db
    if (!user) {
        res.render('login', {error_message : "Nom d'utilisateur inconnu", message: ""})
    }
    // Known in db
    else {
        // Wrong password
        if (pass === false)
            res.render('login', {error_message : "Mot de passe incorrect", message: ""})
        // Correct password - Login SUCCES
        else {
            const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET)
            res.cookie('user_session', token, { maxAge : 3600 * 1000})
            res.render('user_page', {user_name : user.name})
        }
    }
})

app.post('/register_verify', async(req, res) => {
    const name = req.body.name
    const password = await bcrypt.hash(req.body.password, saltRounds)

    const user = await prisma.User.findUnique({
        where : {name}
        },
    )

    if (user) {
        res.render('register', {error_message : "Nom indisponible"})
    }
    else {
        await prisma.User.create({
            data: {
                name : name,
                password : password
            },
        })

        res.render('login', ({message : "Compte créé avec succes", error_message : ""}))
        }

    
})

app.post('/verify_post', async(req, res) => {
    const token = req.cookies['user_session']
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const quote = req.body.quote
    const author = req.body.author
    const book = req.body.book
    const posted_by = payload.name

    try {
        await prisma.Quote.create({
            data: {
                quote_text: quote,
                author: author,
                book: book,
                posted_by: posted_by,
                score : 0
            }
        })

        res.redirect('/user_page')
    }
    catch(err) {
        console.log("Erreur dans verify_post:", err)
        res.render('login', {error_message: "ERREUR", message: ""})
    }
})


app.post('/quote_up', async(req, res) => {
    const id = Number(req.body.id)
    const quote = await prisma.Quote.findUnique({
        where : {
            id
        }
    })
    let score = quote.score
    score ++

    await prisma.Quote.update({
        where : {
            id 
        },
        data: { 
            score 
        },
})
    
    res.redirect('/')
})

app.post('/quote_down', async(req, res) => {
    const id = Number(req.body.id)
    const quote = await prisma.Quote.findUnique({
        where : {
            id
        }
    })
    let score = quote.score
    score --

    await prisma.Quote.update({
        where : {
            id 
        },
        data: { 
            score 
        },
})
    
    res.redirect('/')
})


const port = process.env.PORT
app.listen(port, function () {
    console.log(`Server listening on port ${port}`)
})