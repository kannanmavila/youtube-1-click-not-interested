// ==UserScript==
// @name         Youtube 1-Click Not-Interested
// @namespace    http://tampermonkey.net/
// @version      1.0
// @updateURL    https://raw.githubusercontent.com/kannanmavila/youtube-1-click-not-interested/main/script.js
// @downloadURL  https://raw.githubusercontent.com/kannanmavila/youtube-1-click-not-interested/main/script.js
// @description  This script provides links below every Youtube thumbnail to mark the video as not-interested or already-watched
// @author       You
// @match        https://www.youtube.com/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log('[Script: Youtube 1-Click Not-Interested] Started...')
    const CUE = '.ytd-rich-item-renderer'; // Script will be executed once CUE appears
    const CHECK_CUE_FREQUENCY = 2000; // how often to check for the cue
    const REPEAT_EVERY = 0; // how often to repeat doStuff; 0 for no repeat
    const CONCURRENCY_DELAY = 100;

    // Add necessary styling
    const styleSheet = document.createElement('style')
    styleSheet.type = 'text/css'
    styleSheet.innerText = `
        #metadata-line a {
            filter: brightness(85%);
        }
    `
    document.head.appendChild(styleSheet)

    // This function sets the visibility atribute of the popups
    function setPopupVisibility(visible) {
        const popup = document.getElementsByTagName('ytd-popup-container')[0]
        popup.style.visibility = (visible ? '' : 'hidden')
    }

    /* This function marks videos as i-dont-like or already-watched
     *
     * if iDontLike is set, the reason will be chosen accordingly. Otherwise,
     * reason will be chosen as 'I have already watched this video'.
     */
    function notInterested(videoBlock, iDontLike=false) {
        console.log('[Script: Youtube 1-Click Not-Interested] Processed:', videoBlock)
        // Set the popups to be invisible (this is temporary; we'll change it back later)
        setPopupVisibility(false)

        // Click the ellipsis to bring up the menu
        const menuEllipsis = videoBlock.getElementsByTagName('yt-icon-button')[0].getElementsByTagName('button')[0]
        menuEllipsis.click()

        // Wait a moment and click on 'Not Interested'
        setTimeout(() => {
            const menu = document.getElementsByTagName('ytd-menu-popup-renderer')[0]
            const notInterested = menu.getElementsByTagName('ytd-menu-service-item-renderer')[4]
            notInterested.click()

            // Wait a moment and select 'Tell Us Why'
            setTimeout(() => {
                const tellUsWhyButton = videoBlock.getElementsByTagName('ytd-button-renderer')[1]
                    .getElementsByTagName('button')[0]
                tellUsWhyButton.click()

                // Wait a moment and choose the appropriate reason
                setTimeout(() => {
                    const reasonPopup = document.getElementsByTagName('ytd-dismissal-follow-up-renderer')[0]
                    const reasonCheckboxes = reasonPopup.getElementsByTagName('tp-yt-paper-checkbox')
                    const iAlreadyWatchedCheckbox = reasonCheckboxes[0]
                    const iDontLikeCheckbox = reasonCheckboxes[1]
                    const submitButton = reasonPopup.getElementsByTagName('ytd-button-renderer')[1]

                    // Click the appropriate checkbox
                    iDontLike ? iDontLikeCheckbox.click() : iAlreadyWatchedCheckbox.click()

                    // Click Submit
                    //setTimeout(() => { // for testing/validation only; comment out otherwise
                        submitButton.click()
                    //}, 1000) // for testing/validation only; comment out otherwise

                    // Change the popups to visible again
                    setPopupVisibility(true)
                }, CONCURRENCY_DELAY)
            }, CONCURRENCY_DELAY)
        }, CONCURRENCY_DELAY)
    }

    // The actual stuff; this function adds the new elements to the page
    function doStuff() {
        console.log('[Script: Youtube 1-Click Not-Interested] invoked main function')

        // Find the blocks/thumbnails of videos
        let videoBlocks = [...document.getElementsByTagName('ytd-rich-item-renderer')]

        // For every thumbnail...
        videoBlocks.forEach(videoBlock => {
            // Find the line that says "X views, Y days ago"
            let metadataLine = videoBlock.querySelector('#metadata-line')

            // Sometimes, a block can be an ad. Skip them
            if (metadataLine) {
                // Create the new div
                const newDiv = document.createElement('div');
                newDiv.innerHTML = `
                    <div id="metadata-line" class="style-scope ytd-video-meta-block">
                        <a class="yt-simple-endpoint style-scope yt-formatted-string" href="javascript:void(0)">Don't Like This</a>
                        <span style="padding: 0px 5px 0px 5px;">•</span>
                        <a class="yt-simple-endpoint style-scope yt-formatted-string" href="javascript:void(0)">Already Watched</a>
                    </div>
`

                // Insert the new div just below the metadata line we found
                metadataLine.parentNode.insertBefore(newDiv, null)

                // Attach onClick functions to both the links and set iDontLike parameter accordingly
                newDiv.getElementsByTagName('a')[0].onclick = () => notInterested(videoBlock, true)
                newDiv.getElementsByTagName('a')[1].onclick = () => notInterested(videoBlock)
            }
        })
    }

    let waitTillLoad = setInterval(function() {
        if (document.querySelectorAll(CUE).length) {
            clearInterval(waitTillLoad);
            doStuff();
            if (REPEAT_EVERY) setInterval(doStuff, REPEAT_EVERY);
        }
    }, CHECK_CUE_FREQUENCY); // check periodically
})();
