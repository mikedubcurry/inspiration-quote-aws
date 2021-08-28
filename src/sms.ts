import AWS from 'aws-sdk';
import twilio from 'twilio';
import { SQSEvent, SQSRecord } from 'aws-lambda';

export const handler = async (event: SQSEvent) => {
	const region = 'us-east-1';
	const secretName: string = 'twilio_auth';

	var decodedBinarySecret: any;
	const client = new AWS.SecretsManager({
		region,
	});

	let secret: any = await new Promise((resolve, reject) => {
		client.getSecretValue({ SecretId: secretName }, function (err, data) {
			if (err) {
				console.log(err);
				reject();
			} else {
				if ('SecretString' in data) {
					try {
						decodedBinarySecret = JSON.parse(data.SecretString!);
					} catch (e) {
						console.log(e);
					}
					resolve(decodedBinarySecret);
				}
			}
		});
	});
	const twilioClient = twilio(decodedBinarySecret.TWILIO_ACCOUNT_SID, decodedBinarySecret.TWILIO_AUTH_TOKEN);
	try {
		const [quoteRecord] = event.Records.map((rec) => {
			return JSON.parse(rec.body);
		});
		const quote: Quote = quoteRecord.message;
		let smsMessage = await twilioClient.messages.create({
			body: `${quote.quote} - ${quote.author}`,
			from: '+16304071626',
			to: '+15184195294',
		});
	} catch (e) {
		console.log(e);
	}
};

type Quote = {
	quote: string;
	author: string;
};
