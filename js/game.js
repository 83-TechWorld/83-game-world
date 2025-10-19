const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#87ceeb',
    scene: {
        preload,
        create,
        update
    }
};

let letterIndex = 0;
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let letterText;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('bg', 'assets/images/background.png');
}

function create() {
    this.add.image(400, 300, 'bg');
    letterText = this.add.text(400, 300, letters[letterIndex], { fontSize: '128px', fill: '#000' }).setOrigin(0.5);
    this.input.keyboard.on('keydown-RIGHT', () => changeLetter(1), this);
    this.input.keyboard.on('keydown-LEFT', () => changeLetter(-1), this);
}

function update() {}

function changeLetter(direction) {
    letterIndex = (letterIndex + direction + letters.length) % letters.length;
    letterText.setText(letters[letterIndex]);
}
