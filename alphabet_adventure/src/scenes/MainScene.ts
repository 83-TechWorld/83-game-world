import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {

  private letters: Phaser.GameObjects.Text[] = [];
  private startTime?: number;
  private timeText?: Phaser.GameObjects.Text;
  private readonly TIME_LIMIT = 180; // 3 minutes in seconds
  private resetButton?: Phaser.GameObjects.Text;
  private instructionsText?: Phaser.GameObjects.Text;


  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Confetti as small colored paper image
    this.load.image('confetti', 'assets/images/confetti.png');

    // Audio
    this.load.audio('ding', 'assets/audio/ding.mp3');
    this.load.audio('clap', 'assets/audio/clap.mp3');
    this.load.audio('error', 'assets/audio/error.mp3');
  }

  create() {
    // Background
    this.cameras.main.setBackgroundColor('#F0F4F8');

    this.instructionsText = this.add.text(512, 80,
      '🎮 How to Play:\n' +
      '1. Drag and drop letters to arrange A to Z\n' +
      '2. Complete within 3 minutes\n' +
      '3. Green letters indicate correct position',
      {
        fontSize: '24px',
        color: '#333333',
        align: 'center',
        backgroundColor: '#ffffff',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5);

    // Timer text
    this.timeText = this.add.text(20, 20, 'Time: 3:00', {
      fontSize: '24px',  // Reduced from 32px
      color: '#000',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 4 },
      fontStyle: 'bold'
    });

    this.createResetButton();

    // Generate and shuffle alphabet
    const alphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5);

    // Create draggable letters
    shuffled.forEach((letter, index) => {
      const row = Math.floor(index / 13);
      const col = index % 13;
      const x = 100 + col * 65;
      const y = 150 + row * 80;

      const text = this.add.text(x, y, letter, {
        fontSize: '48px',
        color: '#000',
        backgroundColor: '#fff',
        padding: { x: 10, y: 10 }
      })
        .setInteractive({ draggable: true })
        .setData('originalPosition', { x, y })
        .setData('letter', letter);

      this.letters.push(text);
    });

    // Drag events
    this.input.on('dragstart', (_: any, gameObject: Phaser.GameObjects.Text) => {
      if (!this.startTime) {
        this.startTime = this.time.now;
        this.updateTimer();
      }
      gameObject.setTint(0x00ff00);
    });

    this.input.on('drag', (_: any, gameObject: Phaser.GameObjects.Text, dragX: number, dragY: number) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on('dragend', (_: any, gameObject: Phaser.GameObjects.Text) => {
      const dropZone = this.findDropZone(gameObject);

      if (dropZone) {
        // Swap positions
        const targetPos = dropZone.getData('originalPosition');
        const currentPos = gameObject.getData('originalPosition');

        gameObject.setPosition(targetPos.x, targetPos.y);
        dropZone.setPosition(currentPos.x, currentPos.y);

        gameObject.setData('originalPosition', targetPos);
        dropZone.setData('originalPosition', currentPos);

        this.sound.play('ding');

        // Check order
        this.time.delayedCall(100, () => {
          this.checkAlphabetOrder();
        });
      } else {
        // Return to original position
        const originalPos = gameObject.getData('originalPosition');
        gameObject.setPosition(originalPos.x, originalPos.y);
      }

      gameObject.clearTint();
    });
  }

  private findDropZone(draggedObject: Phaser.GameObjects.Text) {
    const draggedBounds = draggedObject.getBounds();
    for (const letter of this.letters) {
      if (letter === draggedObject) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(draggedBounds, letter.getBounds())) {
        return letter;
      }
    }
    return null;
  }

  private createResetButton() {
    this.resetButton = this.add.text(900, 20, '🔄', {
      fontSize: '20px',
      color: '#4a90e2',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 6 },
      // borderRadius: 4 // Removed as it is not a valid TextStyle property
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.resetGame())
      .setOrigin(1, 0)
      .setShadow(0, 2, 'rgba(0,0,0,0.2)', 2);

    // Add hover effect
    this.resetButton
      .on('pointerover', () => {
        this.resetButton?.setStyle({ color: '#2563eb' });
        this.resetButton?.setScale(1.1);
      })
      .on('pointerout', () => {
        this.resetButton?.setStyle({ color: '#4a90e2' });
        this.resetButton?.setScale(1);
      });
  }
  private resetGame() {
    this.sound.stopAll();
    this.sound.stopAll();
    this.scene.restart();
  }

  private checkAlphabetOrder() {
    const sortedLetters = [...this.letters].sort((a, b) => {
      const aRow = Math.floor((a.y - 150) / 80);
      const bRow = Math.floor((b.y - 150) / 80);
      return aRow === bRow ? a.x - b.x : aRow - bRow;
    });

    const expectedSequence = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    let correctCount = 0;

    sortedLetters.forEach((letter, index) => {
      const isCorrect = letter.getData('letter') === expectedSequence[index];
      if (isCorrect) {
        letter.setColor('#008000'); // Green for correct
        correctCount++;
      } else {
        letter.setColor('#000'); // Reset incorrect to black
      }
    });

    if (correctCount === 26) {
      this.createCelebrationEffect();
      this.sound.play('clap');

      const finalTime = Math.floor((this.time.now - (this.startTime || 0)) / 1000);
      const minutes = Math.floor(finalTime / 60);
      const seconds = finalTime % 60;

      // Moved message down
      this.add.text(400, 400, '🎉 Congratulations! 🎉', {
        fontSize: '48px',
        color: '#000',
        align: 'center'
      }).setOrigin(0.5);

      this.add.text(400, 460, `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
        fontSize: '28px',
        color: '#000',
        align: 'center'
      }).setOrigin(0.5);

      this.letters.forEach(letter => letter.disableInteractive());
      this.input.off('drag');
      this.input.off('dragstart');
      this.input.off('dragend');
    }
  }

  private createCelebrationEffect() {
    const particles = this.add.particles(0, 0, 'confetti', {
      x: { min: 0, max: this.scale.width },
      y: 0,
      lifespan: 3000,
      speedY: { min: 100, max: 200 },
      speedX: { min: -50, max: 50 },
      scale: { start: 0.5, end: 0.1 },
      quantity: 5,
      alpha: { start: 1, end: 0 },
      frequency: 100
    });

    // Listen for destroy event
    this.game.events.on('destroy', () => {
      particles.destroy();
    });

    this.time.delayedCall(4000, () => {
      particles.destroy();
    });
  }
  update() {
    if (this.startTime) {
      this.updateTimer();
    }
  }

  private updateTimer() {
    if (!this.startTime || !this.timeText) return;

    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    const remaining = this.TIME_LIMIT - elapsed;

    if (remaining <= 0) {
      this.sound.play('error');

      // Add semi-transparent background
      const bgRect = this.add.rectangle(512, 288, 600, 300, 0x000000, 0.8)
        .setOrigin(0.5);

      // Add Time's Up message
      this.add.text(512, 238, 'Time\'s Up!', {
        fontSize: '64px',
        color: '#ff0000',
        align: 'center',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Add encouraging message
      this.add.text(512, 308, 'Keep practicing! You can do it!', {
        fontSize: '32px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);

      // Add Try Again button
      const tryAgainButton = this.add.text(512, 378, '🔄 Try Again', {
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#4a90e2',
        padding: { x: 20, y: 10 }
      })
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5)
        .on('pointerdown', () => this.resetGame());

      this.scene.pause();
      return;
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    this.timeText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
  }
}
