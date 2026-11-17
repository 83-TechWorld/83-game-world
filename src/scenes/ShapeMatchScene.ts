import Phaser from 'phaser';

interface Shape {
    sprite: Phaser.GameObjects.Sprite;
    name: string;
    isTarget?: boolean;
}

export default class ShapeMatchScene extends Phaser.Scene {
    private shapes: Shape[] = [];
    private currentShapeIndex: number = 0;
    private score: number = 0;
    private wrongAttempts: number = 0;
    private scoreText?: Phaser.GameObjects.Text;
    private messageText?: Phaser.GameObjects.Text;
    private alertIcon?: Phaser.GameObjects.Sprite;
    private readonly SHAPES = ['circle', 'square', 'triangle'];
    private readonly MAX_WRONG_ATTEMPTS = 2;

    constructor() {
        super({ key: 'ShapeMatchScene' });
    }

    preload() {
        // Load shape images
        this.load.image('circle', 'assets/images/shapes/circle.png');
        this.load.image('square', 'assets/images/shapes/square.png');
        this.load.image('triangle', 'assets/images/shapes/triangle.png');
        this.load.image('alert', 'assets/images/alert.png');
        
        // Load audio
        this.load.audio('ding', 'assets/audio/ding.mp3');
        this.load.audio('error', 'assets/audio/error.mp3');
        this.load.audio('clap', 'assets/audio/clap.mp3');
    }

    create() {
        // Set background
        this.cameras.main.setBackgroundColor('#F0F4F8');

        // Add title and instructions
        this.createTitle();
        this.createInstructions();
        
        // Create score display
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            color: '#000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        });

        // Create shapes
        this.createShapes();

        // Add keyboard controls
        this.setupControls();

        // Add back button
        this.createBackButton();

        // Setup message text for feedback
        this.messageText = this.add.text(512, 500, '', {
            fontSize: '28px',
            color: '#000',
            align: 'center',
            backgroundColor: '#ffffff',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5);

        // Create alert icon (hidden by default)
        this.alertIcon = this.add.sprite(512, 200, 'alert')
            .setScale(0.4)
            .setVisible(false);

        this.setupHistoryIntegration();
    }

    private createTitle() {
        const titleBg = this.add.rectangle(512, 40, 600, 60, 0xffffff)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x93c5fd);

        this.add.text(512, 40, '🎯 Shape Match Adventure', {
            fontSize: '32px',
            color: '#2563eb',
            fontStyle: 'bold',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
    }

    private createInstructions() {
        const instructions = [
            '🎮 How to Play:',
            '1. Use ← → arrows to select the matching shape',
            '2. Press ↓ to confirm your selection',
            '3. Match all shapes to win!'
        ];

        const instructionsBg = this.add.rectangle(512, 120, 700, 100, 0xffffff, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xe5e7eb);

        this.add.text(512, 120, instructions.join('\n'), {
            fontSize: '24px',
            color: '#333333',
            align: 'center',
            lineSpacing: 10,
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
    }

    private createShapes() {
        // Create target shape
        const targetShape = this.createShape(512, 280, this.SHAPES[0], true);
        
        // Create selectable shapes
        const shapes = this.shuffleShapes([...this.SHAPES]);
        shapes.forEach((shape, index) => {
            const x = 312 + (index * 200);
            this.createShape(x, 400, shape, false);
        });

        // Highlight the first shape as selected
        this.highlightShape(this.currentShapeIndex);
    }

    private createShape(x: number, y: number, shapeName: string, isTarget: boolean = false): Shape {
        const sprite = this.add.sprite(x, y, shapeName)
            .setScale(0.5);
        
        if (isTarget) {
            sprite.setTint(0x4a90e2);
            sprite.setScale(0.6);
        }

        const shape: Shape = {
            sprite,
            name: shapeName,
            isTarget
        };

        this.shapes.push(shape);
        return shape;
    }

    private shuffleShapes(shapes: string[]): string[] {
        for (let i = shapes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
        }
        return shapes;
    }

    private setupControls() {
        this.input.keyboard.on('keydown-LEFT', () => {
            this.moveSelection(-1);
        });

        this.input.keyboard.on('keydown-RIGHT', () => {
            this.moveSelection(1);
        });

        this.input.keyboard.on('keydown-DOWN', () => {
            this.checkSelection();
        });
    }

    private moveSelection(direction: number) {
        // Remove highlight from current shape
        const currentShape = this.shapes.find(s => !s.isTarget);
        if (currentShape) {
            currentShape.sprite.setTint(0xffffff);
        }

        // Update selection index
        const selectableShapes = this.shapes.filter(s => !s.isTarget);
        this.currentShapeIndex = (this.currentShapeIndex + direction + selectableShapes.length) % selectableShapes.length;

        // Highlight new selection
        this.highlightShape(this.currentShapeIndex);
    }

    private highlightShape(index: number) {
        const selectableShapes = this.shapes.filter(s => !s.isTarget);
        if (selectableShapes[index]) {
            selectableShapes[index].sprite.setTint(0x00ff00);
        }
    }

    private checkSelection() {
        const targetShape = this.shapes.find(s => s.isTarget);
        const selectedShape = this.shapes.filter(s => !s.isTarget)[this.currentShapeIndex];

        if (targetShape && selectedShape) {
            if (targetShape.name === selectedShape.name) {
                this.handleCorrectMatch();
            } else {
                this.handleWrongMatch();
            }
        }
    }

    private handleCorrectMatch() {
        this.score += 10;
        this.scoreText?.setText(`Score: ${this.score}`);
        this.sound.play('ding');
        
        // Show success message
        this.showMessage('✨ Great job! ✨', '#008000');
        
        // Reset wrong attempts
        this.wrongAttempts = 0;
        
        // Hide alert icon if visible
        if (this.alertIcon) {
            this.alertIcon.setVisible(false);
        }

        // Delay before setting up next round
        this.time.delayedCall(1000, () => {
            if (this.score >= 50) {
                this.showVictoryScreen();
            } else {
                this.setupNextRound();
            }
        });
    }

    private handleWrongMatch() {
        this.wrongAttempts++;
        this.sound.play('error');
        
        // Show error message
        this.showMessage('Try again! 💪', '#ff0000');
        
        if (this.wrongAttempts >= this.MAX_WRONG_ATTEMPTS) {
            // Show alert icon
            if (this.alertIcon) {
                this.alertIcon.setVisible(true)
                    .setAlpha(0);
                
                this.tweens.add({
                    targets: this.alertIcon,
                    alpha: 1,
                    duration: 300,
                    ease: 'Linear',
                    yoyo: true,
                    repeat: 2
                });
            }
        }
    }

    private showMessage(text: string, color: string) {
        if (this.messageText) {
            this.messageText.setText(text)
                .setColor(color)
                .setAlpha(0);
            
            this.tweens.add({
                targets: this.messageText,
                alpha: 1,
                duration: 300,
                ease: 'Linear'
            });
        }
    }

    private setupNextRound() {
        // Clear existing shapes
        this.shapes.forEach(shape => shape.sprite.destroy());
        this.shapes = [];
        
        // Reset message
        if (this.messageText) {
            this.messageText.setText('');
        }
        
        // Create new shapes
        this.createShapes();
    }

    private showVictoryScreen() {
        // Create overlay
        const overlay = this.add.rectangle(0, 0, 1024, 576, 0x000000, 0.7)
            .setOrigin(0);

        // Victory message
        this.add.text(512, 200, '🎉 Congratulations! 🎉', {
            fontSize: '48px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(512, 280, `You've mastered shape matching!\nFinal Score: ${this.score}`, {
            fontSize: '32px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Play again button
        const playAgainButton = this.add.text(512, 380, '🔄 Play Again', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#4a90e2',
            padding: { x: 20, y: 10 }
        })
            .setInteractive({ useHandCursor: true })
            .setOrigin(0.5)
            .on('pointerdown', () => {
                this.scene.restart();
            });

        // Add celebration effect
        this.createCelebrationEffect();
    }

    private createCelebrationEffect() {
        const particles = this.add.particles(0, 0, 'confetti', {
            x: { min: 0, max: this.scale.width },
            y: -10,
            quantity: 3,
            frequency: 50,
            lifespan: 4000,
            gravityY: 300,
            scale: { start: 0.3, end: 0.1 },
            alpha: { start: 1, end: 0 },
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
            angle: { min: -60, max: 60 },
            speed: { min: 200, max: 400 },
            rotate: { min: 0, max: 360 }
        });

        this.time.delayedCall(4000, () => {
            particles.destroy();
        });
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
                this.sound.stopAll();
                this.scene.stop();
                this.scene.start('HomeScene');
                
                if (history.state?.scene === 'ShapeMatchScene') {
                    history.back();
                } else {
                    history.pushState({ scene: 'HomeScene' }, 'Home');
                }
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
            history.replaceState({ scene: 'ShapeMatchScene' }, 'Shape Match');
        }
    }
}