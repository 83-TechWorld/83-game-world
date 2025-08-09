import Phaser from 'phaser'
import './style.css'
import MainScene from './scenes/MainScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'app',
  backgroundColor: '#f6f3f0',
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
}

window.addEventListener('load', () => {
  new Phaser.Game(config)
})