import Phaser from 'phaser'
import './style.css'
import HomeScene from './scenes/HomeScene'
import AlphabetAdventure from './scenes/AlphaAdventure'
import NumberAdventure from './scenes/NumberAdventure'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'app',
  backgroundColor: '#f6f3f0',
  scene: [
    HomeScene,
    AlphabetAdventure,
    NumberAdventure,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 576,
    min: {
      width: 800,
      height: 450
    },
    max: {
      width: 1600,
      height: 900
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  dom: {
    createContainer: true
  },
  autoRound: false
}

window.addEventListener('load', () => {
  new Phaser.Game(config)
})