import Phaser from 'phaser';
import { GAMES, GameEntry } from '../catalog';


export default class HomeScene extends Phaser.Scene {
    private readonly games: GameEntry[] = GAMES;

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
        this.add.text(512, 566, '© 2026 D-Games · Made with ❤️ · New games every week', {
            fontSize: '13px',
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
        const w = this.scale.width, h = this.scale.height;
        // Sky
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x7cc4ff, 0x7cc4ff, 0xeaf6ff, 0xeaf6ff, 1);
        sky.fillRect(0, 0, w, h);
        // Sun with glow
        const sun = this.add.graphics();
        for (let r = 120; r > 0; r -= 20) sun.fillStyle(0xfff3b0, 0.08).fillCircle(w - 130, 90, r);
        sun.fillStyle(0xffe066, 1).fillCircle(w - 130, 90, 44);
        this.tweens.add({ targets: sun, alpha: 0.8, duration: 2500, yoyo: true, repeat: -1 });
        // Clouds (drift slowly)
        for (let i = 0; i < 6; i++) {
            const c = this.add.graphics();
            const cx = Phaser.Math.Between(0, w), cy = Phaser.Math.Between(40, 220), sc = Phaser.Math.FloatBetween(0.6, 1.2);
            c.fillStyle(0xffffff, 0.9);
            c.fillCircle(0, 0, 28 * sc); c.fillCircle(30 * sc, -8 * sc, 22 * sc); c.fillCircle(-30 * sc, -4 * sc, 20 * sc); c.fillCircle(8 * sc, -18 * sc, 18 * sc);
            c.fillRect(-40 * sc, -2 * sc, 80 * sc, 28 * sc);
            c.setPosition(cx, cy);
            this.tweens.add({ targets: c, x: cx + w + 200, duration: Phaser.Math.Between(60000, 120000), repeat: -1,
                onRepeat: () => { c.x = -150; } });
        }
        // Rolling hills
        const hills = this.add.graphics();
        const drawHill = (color: number, baseY: number, amp: number, period: number, phase: number) => {
            hills.fillStyle(color, 1); hills.beginPath(); hills.moveTo(0, h);
            for (let x = 0; x <= w; x += 16) hills.lineTo(x, baseY + Math.sin(x / period + phase) * amp + Math.sin(x / (period * 0.37)) * amp * 0.4);
            hills.lineTo(w, h); hills.closePath(); hills.fillPath();
        };
        drawHill(0xa7e08a, h - 120, 26, 140, 1);
        drawHill(0x7ccd6a, h - 80, 20, 110, 3);
        drawHill(0x5ab84e, h - 40, 14, 90, 5);
        // Sparkles
        for (let i = 0; i < 18; i++) {
            const s = this.add.star(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h - 100), 4, 2, 6, 0xffffff, 0.8);
            this.tweens.add({ targets: s, alpha: 0.1, scale: 0.4, duration: Phaser.Math.Between(900, 2200), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) });
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
        const w = this.scale.width;
        const isMobile = window.innerWidth < 600;
        const titleY = isMobile ? 48 : 64, subtitleY = isMobile ? 100 : 122;
        const title = this.add.text(w / 2, titleY, '🎮 D-GAMES', {
            fontSize: isMobile ? '40px' : '58px',
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            color: '#ffffff', fontStyle: '900',
            stroke: '#1d4ed8', strokeThickness: 10,
            shadow: { color: '#0b3fa8', blur: 0, offsetX: 0, offsetY: 6, fill: true }
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, y: titleY - 6, duration: 1600, ease: 'Sine.inOut', yoyo: true, repeat: -1 });

        const games = this.games.filter(g => g.available).length;
        const subtitle = this.add.text(w / 2, subtitleY, `Play · Learn · Have fun!   ★ ${games} games and counting`, {
            fontSize: isMobile ? '16px' : '20px',
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            color: '#1e3a8a', fontStyle: 'bold',
            backgroundColor: '#ffffffcc', padding: { x: 18, y: 8 }
        }).setOrigin(0.5);
        this.tweens.add({ targets: subtitle, scale: 1.03, duration: 2000, ease: 'Quad.easeInOut', yoyo: true, repeat: -1 });
    }

    private createGameGrid() {
        const width = this.scale.width;
        const height = this.scale.height;
        const isMobile = width < 768;

        // Grid adapts to the catalog size: 3 columns up to 3 games, then 4.
        const columns = isMobile ? 1 : (this.games.length <= 3 ? 3 : 4);
        const rows = Math.ceil(this.games.length / columns);
        const horizontalGap = 24;
        const verticalGap = 20;
        const startY = 168;
        const cardWidth = isMobile ? Math.min(380, width - 40) : (columns === 3 ? 300 : 232);
        // Shrink rows to fit the canvas (the home page stays a single screen).
        const cardHeight = Math.max(120, Math.min(200, (height - startY - 40 - verticalGap * (rows - 1)) / rows));

        const gridWidth = isMobile ? cardWidth : (cardWidth * columns + horizontalGap * (columns - 1));
        const startX = (width - gridWidth) / 2 + cardWidth / 2;
        const firstY = startY + cardHeight / 2;

        this.games.forEach((game, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;
            const x = isMobile ? width / 2 : startX + col * (cardWidth + horizontalGap);
            const y = firstY + row * (cardHeight + verticalGap);
            this.createGameCard(x, y, game, cardWidth, cardHeight);
        });
    }

    private createGameCard(x: number, y: number, game: GameEntry, width: number, height: number) {
        const container = this.add.container(x, y);
        const k = Math.min(1, height / 200, width / 300);
        const tint = Phaser.Display.Color.ValueToColor(game.color);
        const pastel = Phaser.Display.Color.GetColor(
            Math.round(255 - (255 - tint.red) * 0.18), Math.round(255 - (255 - tint.green) * 0.18), Math.round(255 - (255 - tint.blue) * 0.18));

        const shadow = this.add.graphics();
        shadow.fillStyle(0x0b3fa8, 0.18).fillRoundedRect(-width / 2 + 5, -height / 2 + 7, width, height, 18);
        const bg = this.add.graphics();
        const paint = (hover: boolean) => {
            bg.clear();
            bg.fillStyle(hover ? 0xffffff : pastel, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 18);
            bg.lineStyle(hover ? 4 : 2, game.color, hover ? 1 : 0.5).strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
        };
        paint(false);

        // Emoji in a badge
        const badgeR = 30 * k;
        const badge = this.add.graphics();
        badge.fillStyle(0xffffff, 1).fillCircle(0, -height / 2 + badgeR + 12 * k, badgeR + 4);
        badge.lineStyle(3, game.color, 1).strokeCircle(0, -height / 2 + badgeR + 12 * k, badgeR + 4);
        const emoji = this.add.text(0, -height / 2 + badgeR + 12 * k, game.emoji, { fontSize: `${Math.round(38 * k)}px` }).setOrigin(0.5);

        const title = this.add.text(0, 6 * k, game.title, {
            fontSize: `${Math.round(21 * k)}px`, fontFamily: 'Segoe UI, system-ui, sans-serif',
            color: '#1f2937', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);
        const description = this.add.text(0, 30 * k, game.description, {
            fontSize: `${Math.round(13 * k)}px`, fontFamily: 'Segoe UI, system-ui, sans-serif',
            color: '#4b5563', align: 'center', wordWrap: { width: width - 30 }
        }).setOrigin(0.5, 0);

        // Chips: category + age
        const chipY = height / 2 - 16 * k;
        const cat = this.add.text(-6, chipY, game.category.toUpperCase(), {
            fontSize: `${Math.round(10 * k)}px`, fontFamily: 'Segoe UI, system-ui, sans-serif', color: '#ffffff', fontStyle: 'bold',
            backgroundColor: '#' + tint.color.toString(16).padStart(6, '0'), padding: { x: 7, y: 3 }
        }).setOrigin(1, 0.5);
        const age = this.add.text(6, chipY, game.ageRange ? `AGE ${game.ageRange}` : 'ALL AGES', {
            fontSize: `${Math.round(10 * k)}px`, fontFamily: 'Segoe UI, system-ui, sans-serif', color: '#374151', fontStyle: 'bold',
            backgroundColor: '#ffffff', padding: { x: 7, y: 3 }
        }).setOrigin(0, 0.5);

        container.add([shadow, bg, badge, emoji, title, description, cat, age]);

        if (game.isNew) {
            const ribbon = this.add.text(width / 2 - 8, -height / 2 + 8, 'NEW', {
                fontSize: `${Math.round(11 * k)}px`, fontFamily: 'Segoe UI, system-ui, sans-serif', color: '#ffffff', fontStyle: 'bold',
                backgroundColor: '#ef4444', padding: { x: 8, y: 3 }
            }).setOrigin(1, 0).setAngle(6);
            container.add(ribbon);
            this.tweens.add({ targets: ribbon, scale: 1.12, duration: 700, yoyo: true, repeat: -1 });
        }
        if (!game.available) {
            const soon = this.add.text(0, -8 * k, 'COMING SOON', { fontSize: `${Math.round(14 * k)}px`, color: '#6b7280', fontStyle: 'bold', backgroundColor: '#f3f4f6', padding: { x: 8, y: 4 } }).setOrigin(0.5);
            container.add(soon); container.setAlpha(0.75);
            return;
        }

        container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);
        container.on('pointerover', () => {
            paint(true); title.setColor('#1d4ed8');
            this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, y: y - 6, duration: 180, ease: 'Quad.easeOut' });
            this.safePlay('hover', 0.15);
        });
        container.on('pointerout', () => {
            paint(false); title.setColor('#1f2937');
            this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, y, duration: 180, ease: 'Quad.easeOut' });
        });
        container.on('pointerdown', () => {
            this.safePlay('click', 0.5);
            if (game.kind === 'url' && game.url) {
                window.location.href = game.url;   // standalone game under public/games/<slug>/
                return;
            }
            if (game.scene) {
                history.pushState({ scene: game.scene }, game.title);
                this.scene.start(game.scene);
            }
        });
    }

    /** Sound must never break navigation (missing/undecodable audio just stays silent). */
    private safePlay(key: string, volume: number) {
        try {
            if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
        } catch { /* ignore */ }
    }
}
