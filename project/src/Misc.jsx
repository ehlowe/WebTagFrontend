

const drawCrosshair = (canvas) => {
    // const canvas = crosshairRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      const { width, height } = canvas;

      context.clearRect(0, 0, width, height);
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      const crosshairSize = 20;

      context.beginPath();
      context.moveTo((width/2-crosshairSize), (height / 2));
      context.lineTo((width/2+crosshairSize), height / 2);
      context.stroke();

      context.beginPath();
      context.moveTo(width / 2, (height/2-crosshairSize));
      context.lineTo(width / 2, (height/2+crosshairSize));
      context.stroke();
    }
  };

export default drawCrosshair;