import Phaser from 'phaser';

export default class NumberAdventure extends Phaser.Scene {
    private numbers: Phaser.GameObjects.Text[] = [];
    private startTime?: number;
    private timeText?: Phaser.GameObjects.Text;
    private readonly TIME_LIMIT = 120; // 2 minutes in seconds
    private resetButton?: Phaser.GameObjects.Text;
    private instructionsText?: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'NumberAdventure' });
    }

    preload() {
        // Load the same assets as AlphabetAdventure
        this.load.image('confetti', 'assets/images/confetti.png');
        this.load.audio('ding', 'assets/audio/ding.mp3');
        this.load.audio('clap', 'assets/audio/clap.mp3');
        this.load.audio('error', 'assets/audio/error.mp3');
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#F0F4F8');

        // Add back button
        this.createBackButton();

        this.instructionsText = this.add.text(512, 80,
            '🎮 How to Play:\n' +
            '1. Drag and drop numbers to arrange 1 to 20\n' +
            '2. Complete within 2 minutes\n' +
            '3. Green numbers indicate correct position',
            {
                fontSize: '24px',
                color: '#333333',
                align: 'center',
                backgroundColor: '#ffffff',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5);

        // Timer text
        this.timeText = this.add.text(20, 20, 'Time: 2:00', {
            fontSize: '24px',
            color: '#000',
            backgroundColor: '#ffffff',
            padding: { x: 8, y: 4 },
            fontStyle: 'bold'
        });

        this.createResetButton();

        // Generate and shuffle numbers 1-20
        const numbers = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
        const shuffled = [...numbers].sort(() => Math.random() - 0.5);

        // Create draggable numbers
        shuffled.forEach((number, index) => {
            const row = Math.floor(index / 10);
            const col = index % 10;
            const x = 150 + col * 75;
            const y = 150 + row * 80;

            const text = this.add.text(x, y, number, {
                fontSize: '48px',
                color: '#000',
                backgroundColor: '#fff',
                padding: { x: 10, y: 10 }
            })
                .setInteractive({ draggable: true })
                .setData('originalPosition', { x, y })
                .setData('number', number);

            this.numbers.push(text);
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
                    this.checkNumberOrder();
                });
            } else {
                // Return to original position
                const originalPos = gameObject.getData('originalPosition');
                gameObject.setPosition(originalPos.x, originalPos.y);
            }

            gameObject.clearTint();
        });

        this.setupHistoryIntegration();
    }

    private findDropZone(draggedObject: Phaser.GameObjects.Text) {
        const draggedBounds = draggedObject.getBounds();
        for (const number of this.numbers) {
            if (number === draggedObject) continue;
            if (Phaser.Geom.Intersects.RectangleToRectangle(draggedBounds, number.getBounds())) {
                return number;
            }
        }
        return null;
    }

    private createResetButton() {
        this.resetButton = this.add.text(900, 20, '🔄', {
            fontSize: '20px',
            color: '#4a90e2',
            backgroundColor: '#ffffff',
            padding: { x: 8, y: 6 }
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
        // Reset timer
        this.startTime = undefined;
        if (this.timeText) {
            this.timeText.setText('Time: 2:00');
        }

        // Re-enable number interactions
        this.numbers.forEach(number => {
            number.setInteractive({ draggable: true });
            number.clearTint();
            number.setColor('#000');

            // Reset to original position
            const originalPos = number.getData('originalPosition');
            number.setPosition(originalPos.x, originalPos.y);
        });

        // Re-attach drag events
        this.input.off('drag');
        this.input.off('dragstart');
        this.input.off('dragend');

        this.setupDragEvents();

        // Resume scene
        this.scene.resume();
        this.sound.stopAll();
    }

    private setupDragEvents() {
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
                const targetPos = dropZone.getData('originalPosition');
                const currentPos = gameObject.getData('originalPosition');

                gameObject.setPosition(targetPos.x, targetPos.y);
                dropZone.setPosition(currentPos.x, currentPos.y);

                gameObject.setData('originalPosition', targetPos);
                dropZone.setData('originalPosition', currentPos);

                this.sound.play('ding');

                this.checkNumberOrder();
            } else {
                const originalPos = gameObject.getData('originalPosition');
                gameObject.setPosition(originalPos.x, originalPos.y);
            }
            gameObject.clearTint();
        });
    }

    private checkNumberOrder() {
        const sortedNumbers = [...this.numbers].sort((a, b) => {
            const aRow = Math.floor((a.y - 150) / 80);
            const bRow = Math.floor((b.y - 150) / 80);
            return aRow === bRow ? a.x - b.x : aRow - bRow;
        });

        const expectedSequence = Array.from({ length: 20 }, (_, i) => (i + 1).toString());
        let correctCount = 0;

        sortedNumbers.forEach((number, index) => {
            const isCorrect = number.getData('number') === expectedSequence[index];
            if (isCorrect) {
                number.setColor('#008000'); // Green for correct
                correctCount++;
            } else {
                number.setColor('#000'); // Reset incorrect to black
            }
        });

        if (correctCount === 20) {
            this.createCelebrationEffect();
            this.sound.play('clap');

            const finalTime = Math.floor((this.time.now - (this.startTime || 0)) / 1000);
            const minutes = Math.floor(finalTime / 60);
            const seconds = finalTime % 60;

            // Success message
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

            this.numbers.forEach(number => number.disableInteractive());
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

            // Create overlay group
            const overlay = this.add.group();

            // Add semi-transparent background
            const bgRect = this.add.rectangle(512, 288, 600, 300, 0x000000, 0.8)
                .setOrigin(0.5);
            overlay.add(bgRect);

            // Add Time's Up message
            const timeUpText = this.add.text(512, 238, 'Time\'s Up!', {
                fontSize: '64px',
                color: '#ff0000',
                align: 'center',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            overlay.add(timeUpText);

            // Add encouraging message
            const encourageText = this.add.text(512, 308, 'Keep practicing! You can do it!', {
                fontSize: '32px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            overlay.add(encourageText);

            // Add Try Again button
            const tryAgainButton = this.add.text(512, 378, '🔄 Try Again', {
                fontSize: '32px',
                color: '#ffffff',
                backgroundColor: '#4a90e2',
                padding: { x: 20, y: 10 }
            })
                .setInteractive({ useHandCursor: true })
                .setOrigin(0.5)
                .on('pointerdown', () => {
                    overlay.destroy(true);
                    this.resetGame();
                });
            overlay.add(tryAgainButton);

            // Disable number interactions
            this.numbers.forEach(number => number.disableInteractive());

            return;
        }

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        this.timeText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    private createBackButton() {
        const backButton = this.add.text(50, 20, '← Back', {
            fontSize: '20px',
            color: '#4a90e2',
            backgroundColor: '#ffffff',
            padding: { x: 8, y: 6 }
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Stop all sounds
                this.sound.stopAll();
                
                // Stop current scene
                this.scene.stop();
                
                // Start HomeScene fresh
                this.scene.start('HomeScene');
                
                // Update browser history
                history.pushState({ scene: 'HomeScene' }, 'Home');
            });
    }

    private setupHistoryIntegration() {
        window.onpopstate = (event: PopStateEvent) => {
            const sceneKey = event.state?.scene || 'HomeScene';
            if (sceneKey !== this.scene.key) {
                this.scene.start(sceneKey);
            }
        };
        if (!history.state || !history.state.scene) {
            history.replaceState({ scene: 'NumberAdventure' }, 'Number Adventure');
        }
    }
}