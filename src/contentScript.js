'use strict';

//Get video transcript on first entering watching page
if (window.location.pathname.startsWith('/watch')) {
    let urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    chrome.storage.local.set({
        currentVideoId: videoId
    })
    chrome.storage.local.get(videoId, function(result) {
        if (result[videoId] !== undefined) {
            console.log('video data existed');
        } else {
            parseCaption();
        }
    });
}

// Detect video change, when there is a video change, try parse the new transcript
// NOT WORKING, parse must happen after refreshign the page
const targetNode = document.body;
const config = { childList: true, subtree: true }; 
const callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // Check if the video has changed, e.g. by checking the video URL or title
            if (document.location.href !== previousHref) {
                console.log('tttttttest')
                previousHref = document.location.href;
                window.location.reload();
            }
        }
    }
};
let previousHref = document.location.href;
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

//Listener on incoming question.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    //Get the current on-screen timestamp to narrow down 
    const currentTime = document.getElementsByClassName('video-stream')[0].currentTime;
    let urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    chrome.runtime.sendMessage({
        "action": "askGPT",
        'vid': videoId,
        "timestamp": currentTime,
        "question": request.question
    }, function(response) {
        sendResponse(response);
    });
    return true;
});

// Get the transcript of the current youtube video and storage the caption dict in storage
function parseCaption(){
    //Get the current video ID
    if (window.location.pathname.startsWith('/watch')) {
        let urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');

        let scripts = Array.from(document.querySelectorAll('script'));
        // Find the script containing ytInitialPlayerResponse
        let targetScript = scripts.find(script => script.textContent.includes('ytInitialPlayerResponse'));
        console.log(targetScript);
        if (targetScript) {
            
            let match = targetScript.textContent.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
            console.log(match)
            if (match && match[1]) {
                let ytData = JSON.parse(match[1]);
                var subsUrl = ytData.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;
                console.log(subsUrl);
            }
        }

        chrome.runtime.sendMessage({
            "action": "fetchTranscript",
            "url": subsUrl
        }, function(response) {
            console.log(response)
            let xml = new DOMParser().parseFromString(response,"text/xml");
            let data = parseXML(xml);
            addToStorage(videoId, data)
            return true
        });

        return false;
    }
}

function parseXML(xml){
    let items = xml.getElementsByTagName("text");
    let textJSON = {};
    for(let i = 0; i < items.length; i++) {
        let start = items[i].getAttribute("start");
        let duration = items[i].getAttribute("dur");
        let text = items[i].textContent;
        let tempJson = {
            duration: duration,
            text: text
        };
        textJSON[start] = tempJson;
    }
    let json = {
        messages: [],
        transcript: textJSON
    }
    return json;
}

function addToStorage(key, val){
    let obj = {};
    obj[key] = val;

    chrome.storage.local.set( obj, function() {
      if(chrome.runtime.lastError) {
        console.error(
          "Error setting " + key + " to " + JSON.stringify(val) +
          ": " + chrome.runtime.lastError.message
        );
      }
      chrome.runtime.sendMessage({status: "Storage Updated"}, function (responce) {
          console.log(responce);
      })
    });
}