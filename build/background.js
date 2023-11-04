/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/


// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

const defaultCaptionRange = 60

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	// Fetch and parse the caption using the provided video ID or other details
	if (request.action === "fetchTranscript") {
		console.log(request.url)
		//Get transcript from url
		fetch(request.url)
			.then(response => response.text())
			.then(data => {
				sendResponse(data);
			})
			.catch(error => console.error('Error:', error));
		return true;
	}
	// Make an API call to GPT with the provided caption and question
	else if (request.action === "askGPT") {
		

		chrome.storage.local.get(request.vid, function (result) {
			console.log(result)
			const context = getTranscriptSegment(result[request.vid]['transcript'], request.timestamp, 240);
			console.log(context)
			saveMessage(request.vid, 'user', (`[${parseTime(request.timestamp)}]`) + request.question)
			askGpt(request.timestamp, context, request.question).then(res => {
				console.log(res);
				sendResponse(res)
			});
			return true;
		});
		return true;
	}
});

function getTranscriptSegment(transcriptDict, timestamp, range) {
	console.log(transcriptDict);
	let lowerBound = timestamp - range / 2;
	let upperBound = timestamp + range / 2;
	let segment = "";
	if (lowerBound < 0) {
		lowerBound = 0;
	}
	console.log(lowerBound);
	for (const [startTime, entry] of Object.entries(transcriptDict)) {
		const start = startTime;
		const end = start + parseFloat(entry.duration);
		console.log(start)
		if (end >= lowerBound || start <= upperBound) {
			segment += `${startTime}: ` + entry.text + "\n";
		}
	}
	return segment.trim();
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponce) {
		if (request.status === "Storage Updated") {
			chrome.storage.local.get('code', function (code) {
				// ... with code.code ...
			});

			sendResponce({ status: "Update Recieved" });
			return true;
		}
	}
);

async function askGpt(timestamp, transcript, question) {
	const model = "gpt-3.5-turbo-16k"
	const url = "https://api.openai.com/v1/chat/completions"
	const apiKey = 'Bearer [API_KEY]'
	const headers = {
		"Content-Type": "application/json",
		"Authorization": apiKey
	}
	const rolePrompt = `You are helping people to better comprehend YouTube videos by answering the questions on a video. 
	This is a segment of a transcript from the video. Note the number before the : are time stamp of the text. 
	The user asked this question at ${timestamp} seconds. \n\n ${transcript}`;

	const body = JSON.stringify({
		"model": model,
		"messages": [
			{
				"role": "system",
				"content": rolePrompt
			},
			{
				"role": "user",
				"content": question
			}]
	});

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: headers,
			body: body
		});
		console.log(response);
		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}

		const data = await response.json();
		console.log(data);
		const answer = data.choices[0].message.content.trim();
		chrome.storage.local.get('currentVideoId', function(result) {
			console.log(result);
			const currentVideoId = result['currentVideoId'];
			saveMessage(currentVideoId, 'gpt', answer)
		});
		
		return answer
	}
	catch (error) {
		console.error('There has been a problem with your fetch operation:', error);
	}
}

function saveMessage(vid, from, text) {

	// Get the current list of messages from storage
	chrome.storage.local.get(vid, (result) => {
		
		let messages = result[vid].messages || [];

		// Add the new message to the messages array
		messages.push({ sender: from, text: text });

		result[vid].messages = messages

		console.log(result)

		// Store the updated messages array back to storage
		chrome.storage.local.set(result, () => {
			console.log('Message stored successfully');
		});
	});
}

function parseTime(timestamp){
	const minute = parseInt(timestamp / 60);
	const seconds = parseInt(timestamp % 60);
	return `${minute}:${seconds}`
}
/******/ })()
;
//# sourceMappingURL=background.js.map