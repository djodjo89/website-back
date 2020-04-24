const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mailer = require('nodemailer');
const helmet = require('helmet');
const compression = require('compression');
const functions = require('firebase-functions');
const validator = require('node-email-validation');
const Entities = require('html-entities').AllHtmlEntities;

const app = express();
const entities = new Entities();
const env = functions.config();

app.use(cors());
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
        const transport=mailer.createTransport({
            host: 'smtp.gmail.com',
            service: 'Gmail',
            port: 465,
            secure: true,
            requireTLS: true,
            auth: {
                user: env.mail.address,
                pass: env.mail.passwd,
            },
        });

        const options = {
            from: `${name} - <${email}>`,
            to: env.mail.address,
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

app.listen(env.app.port, () => console.log(`Listening on port ${env.app.port}`));

const contact = functions.https.onRequest(app);

module.exports = {
    contact,
};
