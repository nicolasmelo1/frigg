const mongoose = require('mongoose');
const { Credential: Parent } = require('@friggframework/module-plugin');
const schema = new mongoose.Schema({
    apiKey: {
        type: String,
        trim: true,
        unique: true,
        lhEncrypt: true,
    },
});

const Credential = Parent.discriminator('TerminusCredentials', schema);
module.exports = { Credential };
