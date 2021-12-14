import http from 'https';
import { APIGatewayEvent, ScheduledEvent } from 'aws-lambda';

import { sendSQSMessage } from './uitls';

export const handler = async (event: ScheduledEvent) => {
	try {
		const [quoteRes] = (await httprequest()) as QuoteResponse;

		const quote = {
			quote: quoteRes.q,
			author: quoteRes.a,
		};

		sendSQSMessage(process.env.quoteQueueURL!, { message: quote });
	} catch (e) {
		sendSQSMessage(process.env.quoteQueueURL!, { message: 'Error fetching quote' });
	}
	return true;
};

function httprequest() {
	return new Promise((resolve, reject) => {
		const options = {
			host: 'zenquotes.io',
			path: '/api/random',
			port: 443,
			method: 'GET',
		};
		const req = http.request(options, (res) => {
			if ((res.statusCode && res.statusCode < 200) || (res.statusCode && res.statusCode >= 300)) {
				return reject(new Error('statusCode=' + res.statusCode));
			}
			var body: any[] = [];
			res.on('data', function (chunk) {
				body.push(chunk);
			});
			res.on('end', function () {
				try {
					body = JSON.parse(Buffer.concat(body).toString());
				} catch (e) {
					reject(e);
				}
				resolve(body);
			});
		});
		req.on('error', (e) => {
			reject(e.message);
		});
		// send the request
		req.end();
	});
}

type QuoteResponse = [{ q: string; a: string }];
