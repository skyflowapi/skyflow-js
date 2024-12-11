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
  }
} catch (err) {
  console.log(err);
}