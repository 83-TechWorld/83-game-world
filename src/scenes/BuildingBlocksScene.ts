import Phaser from 'phaser';

interface Block {
    sprite: Phaser.GameObjects.Sprite;
    type: string;
    color: number;
    size: { width: number; height: number };
    isTemplate?: boolean;
}

export default class BuildingBlocksScene extends Phaser.Scene {
    private blockTemplates: Block[] = [];
    private placedBlocks: Block[] = [];
    private score: number = 0;
    private scoreText: Phaser.GameObjects.Text | null = null;
    private currentDragBlock: Phaser.GameObjects.Sprite | null = null;

    private readonly COLORS = [
        0xff0000,  // Red
        0x00ff00,  // Green
        0x0000ff,  // Blue
        0xffff00,  // Yellow
        0xff00ff   // Magenta
    ];

    private readonly SIZES = [
        { width: 80, height: 80 },     // Large square
        { width: 120, height: 60 },    // Wide rectangle
        { width: 60, height: 60 }      // Small square
    ];

    constructor() {
        super({ key: 'BuildingBlocksScene' });
    }

    preload() {
        this.load.image('block', 'assets/images/block.png');
        this.load.audio('ding', 'assets/audio/ding.mp3');
        this.load.audio('error', 'assets/audio/error.mp3');
        this.load.audio('clap', 'assets/audio/clap.mp3');
    }

    create() {
        // Create background
        this.add.rectangle(0, 0, 1024, 576, 0xf0f0f0).setOrigin(0);
        
        // Add title and instructions
        this.add.text(512, 30, 'Building Blocks Adventure', {
            fontSize: '32px',
            color: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(512, 70, 'Drag colored blocks to create your masterpiece!', {
            fontSize: '20px',
            color: '#666',
            backgroundColor: '#ffffff',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        // Create block palette area background
        this.add.rectangle(20, 120, 320, 400, 0xffffff)
            .setOrigin(0)
            .setStrokeStyle(2, 0x000000);

        this.add.text(180, 140, 'Block Palette', {
            fontSize: '24px',
            color: '#000',
            backgroundColor: '#f0f0f0',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);
        
        // Create block palette
        this.createBlockPalette();
        
        // Create building area
        this.createBuildingArea();
        
        // Add score display
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            color: '#000',
            backgroundColor: '#fff',
            padding: { x: 10, y: 5 }
        });

        // Add back button with improved styling
        const backButton = this.add.text(20, 540, '← Back', {
            fontSize: '20px',
            color: '#4a90e2',
            backgroundColor: '#ffffff',
            padding: { x: 12, y: 8 }
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Stop all sounds
                this.sound.stopAll();
                
                // Stop current scene and start HomeScene
                this.scene.stop();
                this.scene.start('HomeScene');
                
                // Update browser history
                if (history.state?.scene === 'BuildingBlocksScene') {
                    history.back();
                } else {
                    history.pushState({ scene: 'HomeScene' }, 'Home');
                }
            });

        // Setup input events
        this.setupInputEvents();
    }

    private createBlockPalette() {
        const startX = 60;  // Adjusted starting position
        const startY = 180; // Adjusted starting position
        const spacing = { x: 100, y: 120 }; // Increased spacing

        this.SIZES.forEach((size, sizeIndex) => {
            this.COLORS.forEach((color, colorIndex) => {
                const x = startX + (colorIndex % 3 * spacing.x);
                const y = startY + (Math.floor(colorIndex / 3) * spacing.y) + (sizeIndex * spacing.y);

                // Create block sprite
                const block = this.add.sprite(x, y, 'block')
                    .setTint(color)
                    .setScale(size.width / 100, size.height / 100)
                    .setInteractive({ draggable: true })
                    .setData('isTemplate', true);

                // Store block data
                const blockData: Block = {
                    sprite: block,
                    type: `block_${sizeIndex}_${colorIndex}`,
                    color: color,
                    size: size,
                    isTemplate: true
                };

                block.setData('blockData', blockData);
                this.blockTemplates.push(blockData);
            });
        });
    }

    private createBuildingArea() {
        // Add building area title
        this.add.text(650, 140, 'Building Area', {
            fontSize: '24px',
            color: '#000',
            backgroundColor: '#f0f0f0',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        // Create building area with grid
        const buildingArea = this.add.rectangle(380, 120, 600, 400, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setOrigin(0);

        // Add grid
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xdddddd, 0.5);

        // Vertical lines
        for (let x = 380; x <= 980; x += 30) {  // Increased grid size to 30px
            graphics.moveTo(x, 120);
            graphics.lineTo(x, 520);
        }

        // Horizontal lines
        for (let y = 120; y <= 520; y += 30) {  // Increased grid size to 30px
            graphics.moveTo(380, y);
            graphics.lineTo(980, y);
        }

        graphics.strokePath();
    }

    private setupInputEvents() {
        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
            const isTemplate = gameObject.getData('isTemplate');
            
            if (isTemplate) {
                // Create new block from template
                const templateData = gameObject.getData('blockData') as Block;
                const newBlock = this.add.sprite(gameObject.x, gameObject.y, 'block')
                    .setTint(templateData.color)
                    .setScale(templateData.size.width / 100, templateData.size.height / 100)
                    .setInteractive({ draggable: true });

                const blockData: Block = {
                    ...templateData,
                    sprite: newBlock,
                    isTemplate: false
                };

                newBlock.setData('blockData', blockData);
                this.currentDragBlock = newBlock;
            } else {
                this.currentDragBlock = gameObject;
            }

            if (this.currentDragBlock) {
                this.currentDragBlock.setDepth(1);
                this.currentDragBlock.setAlpha(0.8);
            }
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite, dragX: number, dragY: number) => {
            if (this.currentDragBlock) {
                this.currentDragBlock.x = dragX;
                this.currentDragBlock.y = dragY;

                // Show placement preview
                if (this.isInBuildingArea(dragX, dragY)) {
                    const snappedPos = this.getSnappedPosition(dragX, dragY);
                    this.currentDragBlock.setPosition(snappedPos.x, snappedPos.y);
                }
            }
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
            if (this.currentDragBlock) {
                const blockData = this.currentDragBlock.getData('blockData') as Block;
                
                if (this.isInBuildingArea(this.currentDragBlock.x, this.currentDragBlock.y)) {
                    const snappedPos = this.getSnappedPosition(this.currentDragBlock.x, this.currentDragBlock.y);
                    this.currentDragBlock.setPosition(snappedPos.x, snappedPos.y);
                    this.currentDragBlock.setAlpha(1);
                    this.currentDragBlock.setDepth(0);
                    
                    if (!blockData.isTemplate) {
                        this.placedBlocks.push(blockData);
                        this.updateScore(10);
                        this.sound.play('ding');
                        this.checkBuildingProgress();
                    }
                } else {
                    // Remove block if dropped outside building area
                    if (!blockData.isTemplate) {
                        this.currentDragBlock.destroy();
                    }
                }

                this.currentDragBlock = null;
            }
        });
    }

    private isInBuildingArea(x: number, y: number): boolean {
        return x >= 380 && x <= 980 && y >= 120 && y <= 520;  // Updated coordinates
    }

    private getSnappedPosition(x: number, y: number) {
        return {
            x: Math.round((x - 380) / 30) * 30 + 380,  // Updated for new grid size
            y: Math.round((y - 120) / 30) * 30 + 120   // Updated for new grid size
        };
    }

    private updateScore(points: number) {
        this.score += points;
        if (this.scoreText) {
            this.scoreText.setText(`Score: ${this.score}`);
        }
    }

    private checkBuildingProgress() {
        // Check completion when enough blocks are placed
        if (this.placedBlocks.length >= 10) {
            this.sound.play('clap');
            this.showCompletionMessage();
        }
    }

    private showCompletionMessage() {
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(0, 0, 1024, 576, 0x000000, 0.5)
            .setOrigin(0)
            .setDepth(10);

        // Calculate stars based on block count and arrangement
        const stars = Math.min(5, Math.ceil(this.placedBlocks.length / 3));
        
        // Show completion message with better styling
        const messageBox = this.add.rectangle(512, 288, 400, 200, 0xffffff)
            .setDepth(11);

        const messageText = this.add.text(512, 248,
            `Amazing Building!\nYou earned ${stars} stars!\nScore: ${this.score}`, {
            fontSize: '32px',
            color: '#000',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(12);

        // Add stars with improved arrangement
        const starSpacing = 50;
        const startX = 512 - ((stars - 1) * starSpacing) / 2;
        
        for (let i = 0; i < stars; i++) {
            // Create star glow effect
            const glow = this.add.star(startX + (i * starSpacing), 328, 5, 22, 32, 0xffffcc, 0.5)
                .setDepth(11);
            
            // Create main star
            const star = this.add.star(startX + (i * starSpacing), 328, 5, 20, 30, 0xFFFF00)
                .setDepth(12);

            // Add star animation
            this.tweens.add({
                targets: [star, glow],
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 200
            });
        }

        // Add play again button
        const playAgainButton = this.add.text(512, 388, 'Play Again', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#4a90e2',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(12)
            .on('pointerdown', () => {
                this.scene.restart();
            });

        // Add confetti effect
        this.createConfettiEffect();
    }

    private createConfettiEffect() {
        const particles = this.add.particles(0, 0, 'block', {
            x: { min: 0, max: this.scale.width },
            y: -10,
            quantity: 3,
            frequency: 50,
            lifespan: 4000,
            gravityY: 300,
            scale: { start: 0.3, end: 0.1 },
            alpha: { start: 1, end: 0 },
            tint: [...this.COLORS, 0xffffff, 0x00ffff],  // Added more colors
            angle: { min: -60, max: 60 },
            speed: { min: 200, max: 400 },
            rotate: { min: 0, max: 360 }
        }).setDepth(13);

        // Stop particles after 4 seconds
        this.time.delayedCall(4000, () => {
            particles.destroy();
        });
    }
}