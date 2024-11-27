import { stopCam, setupCamera } from "./image";

function handleVisibilityChange(videoRef, cameras, prevVisibility) {
    console.log(document.visibilityState)

    // if the state is hiiden navigate to the /re-enter page
    if (document.visibilityState === 'hidden') {
      window.location.href = "/re-enter";
    }

    // maybe remove the below content
    if (document.visibilityState === prevVisibility.current) {
      return;
    }

    if (document.visibilityState !='visible'){
      console.log("STOPPING CAMERA");
      stopCam();
    } else if (document.visibilityState === 'visible') {
      // getCameras();
      console.log('Page visible - refreshing', document.hidden);
      setupCamera(videoRef, cameras[0].deviceId);
    }
  } 


export { handleVisibilityChange };
