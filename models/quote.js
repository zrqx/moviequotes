const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const quoteSchema = new Schema({
    quote : {
        type : String,
        required : true
    },
    movie : {
        type : String,
        required : true
    },
    character : {
        type : String,
        required : true
    }
})
module.exports = mongoose.model('quote', quoteSchema)