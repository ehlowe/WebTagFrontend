import { useState, useCallback, useEffect, useRef } from "react";

import { captureAndSendFrame } from "../image";

// if reload is triggered handle logic
function reloadFunction(inReload, ammo, setAmmo, mag_size, playSound, setInReload, reload_time){
    if ( !inReload && ammo < mag_size){
        playSound('reload');

        if (ammo === mag_size){
            return;
        }
        setAmmo(0);
        setInReload(true);
        const interval = setTimeout(() => {
            setAmmo(mag_size);
            setInReload(false);
        }, reload_time*1000);
    
        return () => {
            clearTimeout(interval);
            setInReload(false);
        };
    }
}



function useFiringDetection(ammo, setAmmo, reload_time, mag_size, fireRate, playSound, health, sendMessage, videoRef){
    const [isPressed, setIsPressed] = useState(false);
    const [triggerPulled, setTriggerPulled] = useState(false);
    const [fireColor, setFireColor] = useState("gray");
    const [inReload, setInReload] = useState(false);
    const lastFiringTime = useRef(0);
    const shoot_audio_ref = useRef(0);

    function handlePressEnd(){
        setIsPressed(false);
        shootReleased(); 
    }
    function shootPressed(){
        setTriggerPulled(true);
        setFireColor("red");
    }
    function shootReleased(){
        setTriggerPulled(false);
        setFireColor("gray");
    }
    function shootSoundRotation(){
        if (shoot_audio_ref.current==0){
            playSound('shoot');
            shoot_audio_ref.current=1;
        }else if (shoot_audio_ref.current==1){
            playSound('shoot2');
            shoot_audio_ref.current=2;
        }else if (shoot_audio_ref.current==2){
            playSound('shoot3');
            shoot_audio_ref.current=3;
        }else if (shoot_audio_ref.current==3){
            playSound('shoot4');
            shoot_audio_ref.current=0;
        }
    }


    // handle fire button release
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isPressed) {
                handlePressEnd();
            }
        };
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchend', handleGlobalMouseUp);
    
        return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [isPressed, handlePressEnd]);

    // handle firing, ammo, firing sounds
    useEffect(() => {
        let shoot_check_interval = setInterval(() => {
            if (triggerPulled){
                if (Date.now() - lastFiringTime.current >= fireRate){
                    // sendImage();
                    // console.log("TIME: ", Date.now() - lastFiringTime.current);
                    lastFiringTime.current = Date.now();
                    if ((ammo > 0)&&(health>0)){
                        const newammo=ammo-1;
                        setAmmo(newammo);
                        // playSound('shoot');
                        shootSoundRotation(shoot_audio_ref);
    
                        captureAndSendFrame(videoRef.current, sendMessage);
                        if (newammo <= 0){
                            reloadFunction(inReload, ammo, setAmmo, mag_size, playSound, setInReload, reload_time);
                        }
                    } 
                }
            }
        }, 10);
        return () => {
            clearInterval(shoot_check_interval);
        }
    
    }, [triggerPulled, lastFiringTime, ammo, health]);


    useEffect(() => {
        const handleGlobalMouseUp = () => {
        if (isPressed) {
            handlePressEnd();
        }
        };
        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchend', handleGlobalMouseUp);
    
        return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, [isPressed, handlePressEnd]);

    return { isPressed, triggerPulled, fireColor, lastFiringTime, setIsPressed, shootPressed }

}











export default useFiringDetection;
export { reloadFunction };

