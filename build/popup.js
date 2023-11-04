/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/popup.css":
/*!***********************!*\
  !*** ./src/popup.css ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _popup_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./popup.css */ "./src/popup.css");




// document.getElementById('toggleButton').addEventListener('click', function() {
//     // Get the current UI state from storage
//     chrome.storage.local.get(['isPopupUI', 'detachedWindowId'], function(result) {
//         const isPopupUI = result.isPopupUI !== false;  // Default to true if not set
//         const detachedWindowId = result.detachedWindowId;

//         if (isPopupUI) {
//             // Detach the popup UI by opening a new window
//             const popupUrl = chrome.runtime.getURL('popup.html');
//             chrome.windows.create({
//                 url: popupUrl,
//                 type: 'popup',
//                 width: 400,
//                 height: 600
//             }, function(window) {
//                 // Store the new window ID and update UI state
//                 chrome.storage.local.set({
//                     detachedWindowId: window.id,
//                     isPopupUI: false
//                 });
//             });
//             // Close the original popup window
//             window.close();
//         } else {
//             // Switch back to popup UI
//             if (detachedWindowId) {
//                 // Close the detached window
//                 chrome.windows.remove(detachedWindowId, function() {
//                     // Update UI state
//                     chrome.storage.local.set({ isPopupUI: true });
//                 });
//             }
//         }
//     });
// });


window.onload = function () {
    // chrome.storage.local.get('isPopupUI', function(result) {
    //     const isPopupUI = result.isPopupUI !== false;  // Default to true if not set
    //     if(isPopupUI){
    //         const buttonText = isPopupUI ? 'Toggle UI' : 'Close';
    //         document.getElementById('toggleButton').textContent = buttonText;
    //     }
    //     else{
    //         document.getElementById("toggleButton").style.display = "none";
    //     }
    // });
    chrome.storage.local.get('currentVideoId', (result) => {
        const curentVID = result.currentVideoId;
        chrome.storage.local.get(curentVID, (result) => {
		
            let messages = result[curentVID].messages || [];
    
            renderMessages(messages);
        });
        
    });
};

// actions after user send the question
document.getElementById('sendButton').addEventListener('click', function () {
    var conversationDiv = document.getElementById('conversation');
    var messageBody = document.querySelector('#conversation');

    // show the loading indicator
    document.getElementById('loadingIndicator').style.display = 'inline-block';

    // get the value of user's input and empty the input field
    var userInput = document.getElementById('userInput').value;
    document.getElementById('userInput').value = '';

    if (userInput != "") {

        //append the 
        conversationDiv.innerHTML +=
            `<div class="card user-message mb-2">
            <div class="card-body">
                <strong>You:</strong> ${userInput}
            </div>
            </div>`;
        messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                "action": "askGPT",
                "question": userInput
            }, function (response) {
                console.log(response);
                document.getElementById('loadingIndicator').style.display = 'none';
                conversationDiv.innerHTML +=
                    `<div class="card gpt-message mb-2">
                        <div class="card-body">
                            <strong>GPT:</strong> ${response}
                        </div>
                    </div>`;
                
                messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
            });
        });
    }
    else {
        // document.getElementById('response').innerText = "Please input a valid question";
    }
});

function saveMessage(sender, text) {
    // Create a message object
    const message = { sender, text };

    // Get the current list of messages from storage
    chrome.storage.local.get('messages', (result) => {
        let messages = result.messages || [];

        // Add the new message to the messages array
        messages.push(message);

        // Store the updated messages array back to storage
        chrome.storage.local.set({ messages }, () => {
            console.log('Message stored successfully');
        });
    });
}

function renderMessages(messages) {
    const conversationDiv = document.getElementById('conversation');
    let conversationHtml = '';

    messages.forEach(message => {
        const alignmentClass = message.sender === 'user' ? 'text-right' : 'text-left';
        const senderLabel = message.sender === 'user' ? 'You' : 'GPT';

        const messageHtml = `
          <div class="card mb-2">
              <div class="card-body ${alignmentClass}">
                  <strong>${senderLabel}:</strong> ${message.text}
              </div>
          </div>`;

        conversationHtml += messageHtml;
    });

    conversationDiv.innerHTML = conversationHtml;
}
})();

/******/ })()
;
//# sourceMappingURL=popup.js.map