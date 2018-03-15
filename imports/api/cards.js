import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import vision from '@google-cloud/vision';
import Translate from '@google-cloud/translate';

const visionClient = new vision.ImageAnnotatorClient({ projectId: 'plated-bee-197701', keyFilename: Meteor.settings.googleServiceAccountPath });


const Cards = new Mongo.Collection('cards');

Meteor.methods({
    async addCard({ imageData }) {
        const request = {
            image: { content: imageData }
        };

        const results = await visionClient.textDetection(request)
            .then(response => response)
            .catch(err => err);

        const parsedText = results[0].fullTextAnnotation.text;

        return parsedText;
    }
});

export default Cards;
