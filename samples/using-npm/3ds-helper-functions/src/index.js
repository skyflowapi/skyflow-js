/*
  Copyright (c) 2022 Skyflow, Inc.
*/

import Skyflow from 'skyflow-js';

try {
  // getBrowserDetails for 3DS.
  const getDetailsButton = document.getElementById("getBrowserDetails");
  if (getDetailsButton) {
    getDetailsButton.addEventListener("click", () => {
      const browserDetails = Skyflow.ThreeDS.getBroswerDetails();
      document.getElementById("threeDSBrowserDetails").innerHTML =
        JSON.stringify(browserDetails);
    });
    //showChallenge for 3DS
    const redirectButton = document.getElementById("redirectToChallenge");
    if (redirectButton) {
      redirectButton.addEventListener("click", () => {
        const challengeWindow = document.getElementById("challengeWindow");
        const challengeIFrame = Skyflow.ThreeDS.showChallenege(
          "<acs-url>",
          "<c-req>",
          "04",
          challengeWindow
        );
        challengeIFrame.addEventListener("load", function () {
          if(actionButtons.hidden){
            challengeIFrame.hidden = true
            actionButtons.hidden = false
          } else{
            actionButtons.hidden = true
          }
        });
      });
    }
  }
} catch (err) {
  console.log(err);
}