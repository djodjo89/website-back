const express = require('express');
const bodyParser = require('body-parser');
const mailer = require('nodemailer');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const validator = require("node-email-validation");
const Entities = require('html-entities').AllHtmlEntities;

const app = express();
const entities = new Entities();
dotenv.config();

app.use(bodyParser.json());
app.use(helmet());
app.use(compression());

app.post('/contact', (req, res) => {
    const isString = variable => typeof variable === 'string';
    const message = {};
    const encodeBody = _ => Object.entries(req.body)
        .filter(entry => isString(entry[0]) && isString(entry[0]))
        .map(entry => entry.map(entities.encode))
        .forEach(entry => message[entry[0]] = entry[1]);
    encodeBody();
    const {
        name,
        email,
        subject,
        content
    } =  message;
    console.log(message);
    const correctEmail = validator.is_email_valid(email);
    const emptySubject = subject === '';

    if (correctEmail && !emptySubject) {
        console.log(process.env.TO_ADDRESS);
        console.log(process.env.EMAIL_PASSWD);
        const transport = mailer.createTransport({
            host: 'smtp.gmail.com',
            service: 'Gmail',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: process.env.TO_ADDRESS,
                pass: process.env.EMAIL_PASSWD,
            },
        });

        const options = {
            from: `${name} - <${email}>`,
            to: process.env.TO_ADDRESS,
            subject: `${subject}`,
            text: content,
        };

        transport.sendMail(options, error =>
            error
                ? res.json(`Email could not be sent due to error ${error}`)
                : res.json('Email has been sent successfully')
        );
    } else if (!correctEmail) {
        res.json(422, `Email address ${email} is incorrect`);
    } else if (emptySubject) {
        res.json(422, 'Error, subject is empty');
    }
});

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`));
