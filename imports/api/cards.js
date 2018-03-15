import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

const Cards = new Mongo.Collection('cards');

Meteor.methods({
    'Cards.add': ({ imageData }) => {
        const response = HTTP.call('POST', `https://vision.googleapis.com/v1/images:annotate?key=${Meteor.settings.googleVisionApiKey}`, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            data: {
                requests: [{
                    image: {
                        content: imageData
                    },
                    features: [{ type: 'TEXT_DETECTION' }]
                }]
            }
        });
        const parsedText = response.data.responses[0].fullTextAnnotation.text;
        return parsedText;
    },
});

export default Cards;
