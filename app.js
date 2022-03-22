const express = require('express')
const app = express()
const mongoose = require("mongoose")
const morgan = require("morgan")
const Quote = require('./models/quote')
require('dotenv').config()

const port = process.env.PORT || 3000

app.use(morgan(':remote-addr  - :method  :response-time ms'))
app.use(express.urlencoded({extended:true}))

mongoose.connect(process.env.DB_URI,{useNewUrlParser:true,useUnifiedTopology:true},(err,stat) => {
    if (!err) console.log('DB Connection Established')
    else console.log('Error establishing DB Connection')
})

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

app.get('/', async (req,res) => {
    data = await Quote.find({})
    if (data) {
        let {...instance} = data[getRandomInt(data.length)]
        let {_id,__v,...content} = instance._doc
        res.send(content)
    } else {
        res.send('500')
    }
})

app.post('/',(req,res) => {
    Quote.create(req.body)
    .then((data,err) => {
        if(!err){
            res.send('Success')
        }
        else {
            res.send('Error adding a quote')
        }
    })
})

app.listen(port,() => {
    console.log(`App is running on port ${port}`)
})