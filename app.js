const fs = require('fs')
const path = require('path')
const cors = require('cors')
const express = require('express')
const app = express()
const mongoose = require("mongoose")
const morgan = require("morgan")
const Quote = require('./models/quote')
require('dotenv').config()

const port = process.env.PORT || 3000
const interval = process.env.INTERVAL || 60
const cacheFilePath = path.join(__dirname, 'quote.cache')

let data = ''
let queue = 0

app.use(morgan(':remote-addr  - :method  :response-time ms'))
app.use(express.urlencoded({extended:true}))

mongoose.connect(process.env.DB_URI,{useNewUrlParser:true,useUnifiedTopology:true},(err,stat) => {
    if (!err) console.log('DB Connection Established')
    else console.log('Error establishing DB Connection')
})

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getDateString(){
    const date = new Date()
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} ${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`
}

const setCache = async (path) => {
    data = await Quote.find({})
    fs.writeFile(path, JSON.stringify(data), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(`${getDateString()} --> Set Cache - Successful`)
    });
}

const handleCache = async () => {
    setTimeout(handleCache,interval*60*1000)
    if (!data || queue != 0) {
        if (fs.existsSync(cacheFilePath)){
            fs.readFile(cacheFilePath, {encoding: 'utf-8'}, function(err,raw){
                if (!err) {
                    console.log(`${getDateString()} --> Cache HIT - local file`)
                    data = JSON.parse(raw)
                } else {
                    console.log(`${getDateString()} --> Error reading from local cache`);
                }
            })
        } else {
            console.log(`${getDateString()} --> Cache Miss - DB Query`)
            setCache(cacheFilePath)
        }
        if (queue != 0){
            console.log(`${getDateString()} --> Adding ${queue} new item/s to Cache`)
            setCache(cacheFilePath)
            queue = 0
        }
    } else {
        console.log(`${getDateString()} --> Cached data exists`)
    }
}

handleCache()

app.get('/',cors(),(req,res) => {
    if (data) {
        let {_id,__v,...main} = data[getRandomInt(data.length)]
        res.send(main)
    } else {
        res.send('500')
    }
})

app.post('/',cors(),(req,res) => {
    Quote.create(req.body)
    .then((data,err) => {
        if(!err){
            res.send('Success')
            q += 1
        }
        else {
            res.send('Error adding a quote')
        }
    })
})

app.listen(port,() => {
    console.log(`App is running on port ${port}`)
})