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
            lastReviewedAt: null,
            lastAnsweredCorrectlyAt: null,
            lastAnsweredIncorrectlyAt: null,
            correctAnswers: 0,
            incorrectAnswers: 0,
            level: 0
        });
    },
    async deleteCard({ id }) {
        return Cards.remove({ _id: id });
    },
    async reviewCard({ id }) {
        return Cards.update({ _id: id }, {
            $set: { lastReviewedAt: Date.now() }
        });
    },
    async levelUpCard({ id }) {
        const card = Cards.findOne({ _id: id });
        if (card.level < 7) {
            return Cards.update({ _id: id }, {
                $inc: { level: 1 }
            });
        }
        return 0;
    },
    async levelDownCard({ id }) {
        const card = Cards.findOne({ _id: id });
        if (card.level > 0) {
            return Cards.update({ _id: id }, {
                $inc: { level: -1 }
            });
        }
        return 0;
    },
});

export default Cards;
