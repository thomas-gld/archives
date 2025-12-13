import express from 'express'
import 'dotenv/config'

const app = express()

app.set('view engine', "ejs")

app.get('/', (req, res) => {
    res.render('home')
})

const port = process.env.PORT
app.listen(port, function () {
    console.log(`Server listening on port ${port}`)
})