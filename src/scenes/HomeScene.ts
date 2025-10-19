import Phaser from 'phaser';

interface GameButton {
    title: string;
    emoji: string;
    scene: string;
    description: string;
    available: boolean;
    color: number;
}

export default class HomeScene extends Phaser.Scene {
    private readonly games: GameButton[] = [
        {
            title: 'Alphabet Adventure',
            emoji: '🔤',
            scene: 'AlphabetAdventure',
            description: 'Learn and arrange letters A to Z',
            available: true,
            color: 0x3b82f6 // blue
        },
        {
            title: 'Number Adventure',
            emoji: '🔢',
            scene: 'NumberAdventure',
            description: 'Learn and arrange numbers 1 to 20',
            available: true,
            color: 0x10b981 // emerald
        }
    ];

    constructor() {
        super({ key: 'HomeScene' });
    }

    preload() {
        // Load all required assets
        this.load.image('confetti', 'assets/images/confetti.png');
        
        // Load audio assets
        this.load.audio('bgMusic', 'assets/audio/background.mp3');
        this.load.audio('hover', 'assets/audio/ding.mp3');
        this.load.audio('click', 'assets/audio/ding.mp3');
        this.load.audio('clap', 'assets/audio/clap.mp3');
    }

    create() {
        // Set background with gradient
        this.createBackground();

        // Add floating particles
        this.createParticles();

        // Add title with animation
        this.createTitle();

        // Create game grid
        this.createGameGrid();

        // Add footer text
        this.add.text(512, 550, '© 2025 83GameWorld - Made with ❤️ for Kids', {
            fontSize: '16px',
            color: '#6b7280',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.setupHistoryIntegration();
    }

    private setupHistoryIntegration() {
        // Listen for browser back/forward
        window.onpopstate = (event: PopStateEvent) => {
            const sceneKey = event.state?.scene || 'HomeScene';
            if (sceneKey !== this.scene.key) {
                this.scene.start(sceneKey);
            }
        };
        // Push initial state if not present
        if (!history.state || !history.state.scene) {
            history.replaceState({ scene: 'HomeScene' }, 'Home');
        }
    }

    private createBackground() {
        // Create gradient background
        const gradient = this.add.graphics();
        gradient.fillGradientStyle(0xf0f9ff, 0xf0f9ff, 0xe0f2fe, 0xe0f2fe, 1);
        gradient.fillRect(0, 0, 1024, 576);

        // Add some decorative shapes
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(0, 1024);
            const y = Phaser.Math.Between(0, 576);
            const size = Phaser.Math.Between(100, 200);
            const shape = this.add.graphics();
            shape.lineStyle(2, 0x93c5fd, 0.2);
            if (i % 2 === 0) {
                shape.strokeCircle(x, y, size);
            } else {
                shape.strokeRoundedRect(x, y, size, size, 20);
            }
        }
    }

    private createParticles() {
        const particles = this.add.particles(0, 0, 'confetti', {
            x: { min: 0, max: 1024 },
            y: { min: -50, max: 600 },
            scale: { start: 0.2, end: 0.1 },
            alpha: { start: 0.6, end: 0 },
            speed: 20,
            angle: { min: -60, max: 60 },
            rotate: { min: 0, max: 360 },
            lifespan: { min: 5000, max: 8000 },
            frequency: 500,
            gravityY: 10,
            tint: [0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b, 0xef4444]
        });
    }

    private createTitle() {
        // Responsive title size with larger fonts
        const isMobile = window.innerWidth < 600;
        const titleFontSize = isMobile ? '40px' : '48px';  // Increased font sizes
        const subtitleFontSize = isMobile ? '20px' : '24px';
        const titleY = isMobile ? 80 : 100;  // Moved down a bit
        const subtitleY = isMobile ? 130 : 160;
        const title = this.add.text(512, titleY, '83 Game World', {
            fontSize: titleFontSize,
            color: '#2563eb',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const subtitle = this.add.text(512, subtitleY, 'Educational Games for Kids', {
            fontSize: subtitleFontSize,
            color: '#4b5563'
        }).setOrigin(0.5);

        // Add gentle bounce animation
        this.tweens.add({
            targets: title,
            y: title.y - 8, // Slightly increased bounce
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // Add subtle scale animation for subtitle
        this.tweens.add({
            targets: subtitle,
            scaleX: 1.05, // Slightly increased scale effect
            scaleY: 1.05,
            duration: 2000,
            ease: 'Quad.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createGameGrid() {
        const width = this.scale.width;
        const height = this.scale.height;
        const isMobile = width < 768;
        
        // Adjust grid layout with larger cards
        const columns = isMobile ? 1 : 2;
        const rows = Math.ceil(this.games.length / columns);
        
        // Increased card sizes
        const cardWidth = isMobile ? Math.min(380, width - 40) : 400;  // Bigger cards
        const cardHeight = isMobile ? 200 : 220;  // Taller cards
        const horizontalGap = 60;  // Increased gap
        const verticalGap = 40;
        
        // Calculate total grid size
        const gridWidth = isMobile ? cardWidth : (cardWidth * columns + horizontalGap * (columns - 1));
        const gridHeight = cardHeight * rows + verticalGap * (rows - 1);
        
        // Center the entire grid and move it down a bit
        const startX = (width - gridWidth) / 2 + cardWidth / 2;
        const startY = Math.max(250, (height - gridHeight) / 2 + cardHeight / 2);  // Moved down more
        
        // Create cards
        this.games.forEach((game, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            
            const x = isMobile ? width / 2 : startX + col * (cardWidth + horizontalGap);
            const y = startY + row * (cardHeight + verticalGap);
            
            this.createGameCard(x, y, game, cardWidth, cardHeight);
        });
    }

    private createGameCard(x: number, y: number, game: GameButton, width: number, height: number) {
        const container = this.add.container(x, y);
        
        // Background with shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.1);
        shadow.fillRoundedRect(-width/2 + 4, -height/2 + 4, width, height, 16);
        
        // Card background
        const bg = this.add.graphics();
        bg.fillStyle(0xFFFFFF, 1);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 16);
        
        // Top accent bar
        const accent = this.add.graphics();
        accent.fillStyle(game.color, 1);
        accent.fillRoundedRect(-width/2, -height/2, width, 8, { tl: 16, tr: 16, bl: 0, br: 0 });
        
        // Emoji icon with larger size
        const emoji = this.add.text(0, -height/4, game.emoji, {
            fontSize: '64px',  // Bigger emoji
            align: 'center'
        }).setOrigin(0.5);
        
        // Title with larger font
        const title = this.add.text(0, 5, game.title, {
            fontSize: '28px',  // Bigger title
            color: '#1f2937',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        // Description with larger font
        const description = this.add.text(0, height/4, game.description, {
            fontSize: '20px',  // Bigger description
            color: '#6b7280',
            align: 'center',
            wordWrap: { width: width - 40 }
        }).setOrigin(0.5);
        
        container.add([shadow, bg, accent, emoji, title, description]);
        
        if (game.available) {
            container.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);
            
            // Hover effects
            container.on('pointerover', () => {
                bg.clear();
                bg.fillStyle(0xf3f4f6, 1);
                bg.fillRoundedRect(-width/2, -height/2, width, height, 16);
                title.setColor('#1d4ed8');
                
                this.tweens.add({
                    targets: container,
                    scaleX: 1.02,
                    scaleY: 1.02,
                    duration: 200,
                    ease: 'Quad.easeOut'
                });
            });
            
            container.on('pointerout', () => {
                bg.clear();
                bg.fillStyle(0xffffff, 1);
                bg.fillRoundedRect(-width/2, -height/2, width, height, 16);
                title.setColor('#1f2937');
                
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Quad.easeOut'
                });
            });
            
            container.on('pointerdown', () => {
                this.sound.play('click', { volume: 0.5 });
                history.pushState({ scene: game.scene }, game.title);
                this.scene.start(game.scene);
            });
        }
    }
}