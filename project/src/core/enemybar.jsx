import React, { useCallback, useEffect } from 'react';

function useEnemyBar(barCanvasRef, canvasContext, position, enemyHealth, lastMessage) {
    const drawHealthBar = useCallback((canvasContext, position, health = 100, lastMessage) => {
        if (!canvasContext) return; // Add guard clause
        canvasContext.clearRect(0, 0, barCanvasRef.current.width, barCanvasRef.current.height);
        const barWidth = 50;
        const barHeight = 5;
        let x_pix=200;
        let y_pix=50;
        const pix_bounds=400;
        if ((lastMessage!=null)&&(lastMessage.enemy_position != null)){
          x_pix = lastMessage.enemy_position[0];
          y_pix = lastMessage.enemy_position[1];
        }

        // normalize the position to the bounds
        let x=(2*x_pix/pix_bounds)-1;
        let y=(2*y_pix/pix_bounds)-1;

        // resize to the size of the canvas
        x=(barCanvasRef.current.width/2)*x/2.5+(barCanvasRef.current.width/2);
        y=(barCanvasRef.current.height/2)*y/2.5+(barCanvasRef.current.height/2);


        // x=x*barCanvasRef.current.width;
        // y=y*barCanvasRef.current.height;
        // Background (empty health bar)
        canvasContext.fillStyle = '#ff0000';
        canvasContext.fillRect(x-barWidth/2, y-barHeight/2, barWidth, barHeight);

        // Foreground (current health)
        const currentWidth = (health / 100) * barWidth;
        canvasContext.fillStyle = '#00ff00';
        canvasContext.fillRect(x-barWidth/2, y-barHeight/2, currentWidth, barHeight);

        // clear the canvas
        canvasContext.clearRect(0, 0, canvasContext.width, canvasContext.height);
    }, []);

    useEffect(() => {
        
        drawHealthBar(canvasContext, position, enemyHealth, lastMessage);
    }, [position, canvasContext, enemyHealth, lastMessage]);
}

export default useEnemyBar;
