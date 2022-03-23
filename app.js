const fs = require('fs')
const path = require('path')
const cors = require('cors')
const express = require('express')
const app = express()
const mongoose = require("mongoose")
const morgan = require("morgan")
const Quote = require('./models/quote')
const { response } = require('express')
require('dotenv').config()

const port = process.env.PORT || 3000
const interval = process.env.INTERVAL || 60
const cacheFilePath = path.join(__dirname, 'quote.cache')

let data = ''

if (process.env.ENVIRONMENT != "RPROXY") {
    app.use(morgan(':remote-addr  - :method  :response-time ms'))
}
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.set('view engine','ejs')

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
    let response = await Quote.find({})
    fs.writeFile(path, JSON.stringify(response), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(`${getDateString()} --> Set Cache - Successful`)
        loadCache(cacheFilePath)
        console.log(`${getDateString()} --> Load Cache - Successful`)
    });
}

const loadCache = async (cacheFilePath) => {
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
}

const handleCache = async () => {
    setTimeout(handleCache,interval*60*1000)
    if (!data) {
        loadCache(cacheFilePath)
    } else {
        console.log(`${getDateString()} --> Cached data exists`)
    }
}

handleCache()

app.get('/',(req,res) => {
    res.render('home')
})

app.get('/api',cors(),(req,res) => {
    if (data) {
        let {_id,__v,...main} = data[getRandomInt(data.length)]
        res.send(main)
    } else {
        res.send('500')
    }
})

app.post('/api',cors(),(req,res) => {
    Quote.create(req.body)
    .then((data,err) => {
        if(!err){
            res.send('Success')
            setCache(cacheFilePath)
              .then(() => {
                console.log(`${getDateString()} --> Added a new item to Cache`)
              })
              .catch(e => console.log('Error setting Cache'))
        }
        else {
            res.send('Error adding a quote')
        }
    })
})

app.listen(port,() => {
    console.log(`App is running on port ${port}`)
})