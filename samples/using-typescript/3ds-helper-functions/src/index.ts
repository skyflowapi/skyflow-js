
/*
  Copyright (c) 2025 Skyflow, Inc.
*/

import Skyflow from 'skyflow-js';

try {
  const actionButtons = document.getElementById("actionButtons") as HTMLElement;
  const getDetailsButton = document.getElementById("getBrowserDetails") as HTMLElement;
  
  if (getDetailsButton) {
    getDetailsButton.addEventListener("click", () => {
      const browserDetails = Skyflow.ThreeDS.getBrowserDetails();
      const detailsElement = document.getElementById("threeDSBrowserDetails");
      if (detailsElement) {
        detailsElement.innerHTML = JSON.stringify(browserDetails);
      }
    });

    const redirectButton = document.getElementById("redirectToChallenge");
    if (redirectButton) {
      redirectButton.addEventListener("click", () => {
        const challengeWindow = document.getElementById("challengeWindow") as HTMLElement;
        const challengeIFrame = Skyflow.ThreeDS.showChallenge(
          "<acs-url>",
          "<c-req>",
          "04",
          challengeWindow
        );

        challengeIFrame.addEventListener("load", function () {
          if (actionButtons.hidden) {
            challengeIFrame.hidden = true;
            actionButtons.hidden = false;
          } else {
            actionButtons.hidden = true;
          }
        });
      });
    }
  }
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  }
}
