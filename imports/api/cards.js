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
    async addCardFromImage({ imageData }) {
        // Detect text:
        const visionResponse = await visionClient.textDetection({ image: { content: imageData } })
            .then(response => response)
            .catch((err) => {
                console.log(err);
                throw new Meteor.Error(500, 'Error 500', 'Google Vision error');
            });
        // If no text detected:
        if (!visionResponse[0].fullTextAnnotation) {
            console.log('No text found');
            throw new Meteor.Error(500, 'Error 500', 'No text found in image');
        }
        const term = visionResponse[0].fullTextAnnotation.text.replace(/\n|\r/g, '');

        // Translate text:
        const translationResponse = await translateClient.translate(term, 'en')
            .then(response => response)
            .catch((err) => {
                console.log(err);
                throw new Meteor.Error(500, 'Error 500', 'Google Translate error');
            });
        const translation = translationResponse[1].data.translations[0];
        const definition = translation.translatedText;
        const termLanguage = translation.detectedSourceLanguage;

        return Cards.insert({
            userId: Meteor.userId(),
            term,
            termLanguage,
            definition,
            definitionLanguage: 'en',
            createdAt: Date.now(),
            lastReviewedAt: null
        });
    },
    async deleteCard({ id }) {
        return Cards.remove({ _id: id });
    }
});

export default Cards;
