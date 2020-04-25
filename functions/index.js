const cors = require('cors')({ origin: true });
const mailer = require('nodemailer');
const functions = require('firebase-functions');
const { google } = require('googleapis');
const admin = require('firebase-admin');
const validator = require('node-email-validation');
const Entities = require('html-entities').AllHtmlEntities;

admin.initializeApp();
const OAuth2 = google.auth.OAuth2;
const entities = new Entities();
const env = functions.config();

const oauth2Client = new OAuth2(
    env.oauth.client.id,
    env.oauth.client.secret,
    env.oauth.playground.url,
);

oauth2Client.setCredentials({
    refresh_token: env.oauth.token.refresh,
});
const accessToken = oauth2Client.getAccessToken();

const transport=mailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: env.user.email,
        clientId: env.oauth.client.id,
        clientSecret: env.oauth.client.secret,
        refreshToken: env.oauth.token.refresh,
        accessToken: accessToken,
    },
});

exports.contact = functions.https.onRequest((req, res) => {
    cors(req, res, () => {
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

        console.log('Message', message);

        const correctEmail = validator.is_email_valid(email);
        const emptySubject = subject === '';

        if (correctEmail && !emptySubject) {
            const options = {
                from: `${name} - <${email}>`,
                to: env.user.email,
                subject: `${subject}`,
                text: content,
            };

            transport.sendMail(options, error =>
                error
                    ? res.json(`Email could not be sent due to error ${error}`)
                    : res.json('Email has been sent successfully')
            );
        } else if (!correctEmail) {
            res.json(`Email address ${email} is incorrect`);
        } else if (emptySubject) {
            res.json('Error, subject is empty');
        }
    });
});
