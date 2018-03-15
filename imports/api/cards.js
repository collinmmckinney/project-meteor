import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import vision from '@google-cloud/vision';
import Translate from '@google-cloud/translate';

const visionClient = new vision.ImageAnnotatorClient({
    projectId: Meteor.settings.googleCloudProjectName,
    keyFilename: Meteor.settings.googleServiceAccountPath
});
const translateClient = new Translate({
    projectId: Meteor.settings.googleCloudProjectName,
    keyFilename: Meteor.settings.googleServiceAccountPath
});


const Cards = new Mongo.Collection('cards');

Meteor.methods({
    async addCard({ imageData }) {
        const results = await visionClient.textDetection({ image: { content: imageData } })
            .then(response => response)
            .catch(err => err);
        const { text } = results[0].fullTextAnnotation;
        const translation = await translateClient.translate(text, 'en')
            .then(response => response[0])
            .catch(err => err);

        return Cards.insert({ text, translation });
    }
});

export default Cards;
