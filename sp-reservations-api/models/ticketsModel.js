const mongoose = require('mongoose');


const ticketsSchema = mongoose.Schema({
    email:{},

    matchNumber:{ 
        type: Number,
        required: [true, 'A ticket must have a matchnumber'],
    },
    category:{
        type: Number,
        required: [true, 'A ticket must have a category'],},
    quantity:{
        type: Number,
        required: [true, 'A ticket must have a quantity'],},
    price:{
        type: Number,
        required: [true, 'A ticket must have a price'],}
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
});


const Tickets = mongoose.model('Reserved Tickets', ticketsSchema);
module.exports = Tickets;