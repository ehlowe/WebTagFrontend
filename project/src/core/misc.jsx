

function getHealthColor(health, maxHealth) {
    health = Math.max(0, Math.min(health, maxHealth));
    const healthPercentage = (health / maxHealth)**1.5;
    const hue = healthPercentage * 120;
    const saturation = 100 - (healthPercentage * 20);
    const lightness = 40 + (healthPercentage * 20);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }


function drawCrosshair(canvas) {
    // const canvas = crosshairRef.current;
    if (canvas) {
        const context = canvas.getContext('2d');
        const { width, height } = canvas;
        console.log("WIDTH HEIGHT: ", width, height);

        context.clearRect(0, 0, width, height);
        context.strokeStyle = 'red';
        context.lineWidth = 1;
        const crosshairSizeW = 20;
        const crosshairSizeH = crosshairSizeW*height/width

        context.beginPath();
        context.moveTo((width/2-crosshairSizeW), (height / 2));
        context.lineTo((width/2+crosshairSizeW), height / 2);
        context.stroke();

        // context.lineWidth = context.lineWidth*width/height
        context.beginPath();
        context.moveTo(width / 2, (height/2-crosshairSizeH));
        context.lineTo(width / 2, (height/2+crosshairSizeH));
        context.stroke();
    }
};

async function setupCamera(videoRef, sel_id) {
    // const constraints = {
    //     video: {
    //       facingMode: 'environment',
    //       deviceId: sel_id,
    //       // height: { min: 960, max: 1500}
    //     }
    //   };

    const constraints = {
      video: {
        facingMode: 'environment',
        // deviceId: sel_id,
        // height: { min: 1000, max: 2500, ideal: 2000 },
        height: { min: 900, max: 1600, ideal: 1000 },


        // set aspect ratio to 1:1
        aspectRatio: { ideal: 1 }
      }
    };

    // if (videoRef.current.srcObject) {
    //   videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    // }
    // constraints.video.facingMode = constraints.video.facingMode === 'environment' ? 'user' : 'environment';

    try {
      let stream;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: 'environment'} });
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
      } else if (navigator.getUserMedia) {
        stream = await new Promise((resolve, reject) => {
          navigator.getUserMedia({ video: {facingMode: 'environment'} }, resolve, reject);
        });
      } else {
        throw new Error('getUserMedia is not supported in this browser');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera setup error:', err);
    }
  }


export { getHealthColor, drawCrosshair, setupCamera };