'use strict';

const { ExpressJS, GoogleCloudFunction, Webhook } = require('jovo-framework');
const { app } = require('./app.js');

// ------------------------------------------------------------------
// HOST CONFIGURATION
// ------------------------------------------------------------------

// ExpressJS (Jovo Webhook)
if (process.argv.indexOf('--webhook') > -1) {
  const port = process.env.JOVO_PORT || 3000;
  Webhook.jovoApp = app;

  Webhook.listen(port, () => {
    console.info(`Local server listening on port ${port}.`);
  });

  Webhook.post('/webhook', async (req, res) => {
    await app.handle(new ExpressJS(req, res));
  });
}

exports.handler = async (req, res) => {
  await app.handle(new GoogleCloudFunction(req, res));
};