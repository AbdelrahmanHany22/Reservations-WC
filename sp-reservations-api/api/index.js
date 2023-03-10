require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4 } = require('uuid');
const db = require('../connectors/postgres');
const { sendKafkaMessage } = require('../connectors/kafka');
const { validateTicketReservationDto } = require('../validation/reservation');
const messagesType = require('../constants/messages');
const { startKafkaProducer } = require('../connectors/kafka');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const AppError = require("../utils/appError");
const Tickets = require('../models/ticketsModel');
const { default: mongoose } = require('mongoose');
const axios = require('axios').default;



//security dependencies
const morgan = require('morgan');
const helmet = require('helmet');
const xss = require('xss-clean');

app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
app.use(xss());

// limiting api calls to avoid DDOS
const limiter = rateLimit({
    max: 100,
    windowMS: 60 * 60 * 1000,
    message: 'Too many requests from this IP.'
});
app.use(limiter);

// Config setup to parse JSON payloads from HTTP POST request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


var ip ="";
var count = 0;

// HTTP endpoint to test health performance of service
app.get('/api/v1/health', async (req, res) => {
return res.send('Service Health');
});

// HTTP endpoint to create new user
app.post('/api/v1/reservation', async (req, res, next) => {

try{await axios.get('https://security-wc.vercel.app/api/v1/security/')
.then(res=>{
    ip=res.data.data.guestIP
    count = res.data.data.count
})}catch(e){
    console.log("failed to get ip")
    return next(new AppError(e,401))
}

if(count>=20){
    return res.status(400).send("You're Banned from using the services");
}


try {
    // validate payload before proceeding with reservations
    const validationError = validateTicketReservationDto(req.body);
    if (validationError) {
    return res.status(403).send(validationError.message);
    }
        
    if(req.body.tickets.category === 1 && req.body.tickets.price != 75){
        return res.status(403).send("There is an error in the category... wrong price!");
    }

    if(req.body.tickets.category === 2 && req.body.tickets.price != 125){
        return res.status(403).send("There is an error in the category... wrong price!");
    }

    if(req.body.tickets.category === 3 && req.body.tickets.price != 195){
        return res.status(403).send("There is an error in the category... wrong price!");
    }

    // Send message indicating ticket is pending checkout
    // so shop consumers can process message and call
    // sp-shop-api to decrement available ticket count
    await sendKafkaMessage(messagesType.TICKET_PENDING, {
    meta: { action: messagesType.TICKET_PENDING},
    body: { 
        matchNumber: req.body.matchNumber,
        tickets: req.body.tickets,
    }
    });

// Perform Stripe Payment Flow
try {
const token = await stripe.tokens.create({
card: {
    number: req.body.card.number,
    exp_month: req.body.card.expirationMonth,
    exp_year: req.body.card.expirationYear,
    cvc: req.body.card.cvc,
},
});
await stripe.charges.create({
amount: req.body.tickets.quantity * req.body.tickets.price,
currency: 'usd',
source: token.id,
description: 'FIFA World Cup Ticket Reservation',
});
await sendKafkaMessage(messagesType.TICKET_RESERVED, {
meta: { action: messagesType.TICKET_RESERVED },
body: {
    matchNumber: req.body.matchNumber,
    tickets: req.body.tickets,
}
});
} catch (stripeError) {
// Send cancellation message indicating ticket sale failed
await sendKafkaMessage(messagesType.TICKET_CANCELLED, {
meta: { action: messagesType.TICKET_CANCELLED },
body: {
    matchNumber: req.body.matchNumber,
    tickets: req.body.tickets,
}
});
await axios.patch('https://security-wc.vercel.app/api/v1/security/increment',{ipAdd: ip})
return res.status(400).send(`could not process payment: ${stripeError.message}`);
}

    //addingpending ticket to a db
    const doc =await Tickets.create({
    email: req.body.email,
    matchNumber: req.body.matchNumber,
    category: req.body.tickets.category,
    quantity: req.body.tickets.quantity,
    price: req.body.tickets.price,
    });

/////////////////////////////////////////////////////////////////////////////////////
    // Return success response to client
    return res.json({
    message: 'done',
    doc,
    });
} catch (e) {
    return res.status(400).send(e.message);
}
});

app.post('/api/v1/tickets/reserved', async (req, res) => {
        const email = req.body.email;
        const doc = await Tickets.find({email:email})
      
              
        if (!doc || doc.length <=0) {
            res.status(400).json({
                status:'failed',
                data:"No tickets bought with this email from this website."
            })
            return;
        }
        
        res.status(200).json({
            status: 'success',
            data: doc           
        })
    })
//   app
// If request doesn't match any of the above routes then return 404
app.use((req, res, next) => {
  return res.status(404).send();
});

// Create HTTP Server and Listen for Requests
app.listen(5005, async (req, res) => {
  // Start Kafka Producer
  await startKafkaProducer();
});


const uri = process.env.DATABASE_STRING;

mongoose.connect(uri)

const connection = mongoose.connection;

connection.once('open',() => {
    console.log('mongodb database connection successful')
})