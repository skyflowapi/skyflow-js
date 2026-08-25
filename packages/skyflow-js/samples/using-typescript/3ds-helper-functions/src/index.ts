
/*
  Copyright (c) 2025 Skyflow, Inc.
*/

import Skyflow, { ThreeDSBrowserDetails } from 'skyflow-js';

try {
  const actionButtons = document.getElementById("actionButtons") as HTMLButtonElement;
  const getDetailsButton = document.getElementById("getBrowserDetails") as HTMLButtonElement;
  
  if (getDetailsButton) {
    getDetailsButton.addEventListener("click", () => {
      const browserDetails: ThreeDSBrowserDetails = Skyflow.ThreeDS.getBrowserDetails();
      const detailsElement = document.getElementById("threeDSBrowserDetails") as HTMLElement;
      if (detailsElement) {
        detailsElement.innerHTML = JSON.stringify(browserDetails);
      }
    });

    const redirectButton = document.getElementById("redirectToChallenge") as HTMLButtonElement;
    if (redirectButton) {
      redirectButton.addEventListener("click", () => {
        const challengeWindow = document.getElementById("challengeWindow") as HTMLElement;
        const challengeIFrame: HTMLIFrameElement = Skyflow.ThreeDS.showChallenge(
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
} catch (err: unknown) {
  console.error(err);
}
