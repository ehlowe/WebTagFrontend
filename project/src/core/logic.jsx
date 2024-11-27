
import { useEffect } from 'react';


function getHealthColor(health, maxHealth) {
  health = Math.max(0, Math.min(health, maxHealth));
  if (health <= 0) {
    // purple color for dead
    return 'hsl(300, 100%, 30%)';
  }

  const healthPercentage = (health / maxHealth)**1.5;
  const hue = healthPercentage * 120;
  const saturation = 100 - (healthPercentage * 20);
  const lightness = 40 + (healthPercentage * 20);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function useHealthEffect(lastMessage, health, setHealth, prevHealth, enemyHealth, setEnemyHealth, prevEnemyHealth, setHealthColor, playSound, setAmmo, mag_size, setLobbyId, setLobbyCount, setK, setD, setLatencyNum, lastFiringTime) {
  // if health changes handle logic
  useEffect(() => {
    if (lastMessage == null){
        return;
    }
    let health = lastMessage.health;
    let enemyHealth = lastMessage.enemy_health;
    let lobbyCount = lastMessage.lobby_count;
    let lobbyId = lastMessage.lobby_id;
    if (lobbyCount != null){
      setLobbyCount(lobbyCount);
    }
    if (lobbyId != null){
      setLobbyId(lobbyId);
    }

    if ((health !=null)&&(enemyHealth !=null)){
        setHealth(health);
        setEnemyHealth(enemyHealth);

        setHealthColor(getHealthColor(health, 100));
        // handleHealthUpdate
        const hithealthdata = handleHealthUpdate(health, prevHealth, enemyHealth, prevEnemyHealth);

        // console.log()
        if (hithealthdata.hit){
            console.log("HIT");
            playSound('hit');
            setLatencyNum((Date.now() - lastFiringTime.current));
        }
        if (hithealthdata.kill==true){
            console.log("KILL");
            setK(prev => prev + 1);
            playSound('kill');
        }
        if (hithealthdata.death){
            playSound('dead');
            setD(prev => prev + 1);
            setAmmo(mag_size);
        }
    }
    prevEnemyHealth.current = enemyHealth;
    prevHealth.current = health;

  }, [lastMessage, prevHealth, prevEnemyHealth]);

}

function handleHealthUpdate(health, prevHealth, enemyHealth, prevEnemyHealth) {

  const data={}
  if (prevEnemyHealth.current > enemyHealth){
    if (enemyHealth <=0 ){
      // death
      data.kill=true;
    }else{
      // hit
      data.hit=true;
    }
  }

  if ((health <= 0) && (prevHealth.current > health)){
    data.death=true;
  }
  // console.log("DATA: ", data);

  return data;
}

export { useHealthEffect, handleHealthUpdate };