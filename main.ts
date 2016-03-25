/// <reference path="phaser/phaser.d.ts"/>
/// <reference path="joypad/GamePad.ts"/>

class mainState extends Phaser.State {
    private player:Phaser.Sprite;
    private cursors:Phaser.CursorKeys;
    private bullets:Phaser.Group;
    private tilemap:Phaser.Tilemap;
    private monsters:Phaser.Group;

    private PLAYER_ACCELERATION = 500;
    private PLAYER_MAX_SPEED = 300; // pixels/second
    private PLAYER_DRAG = 600;

    private FIRE_RATE = 150;
    private nextFire = 0;


    preload():void {
        super.preload();

        this.load.image('bg', 'assets/bg.png');
        this.load.image('player', 'assets/player.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('monster', 'assets/monster.png');

        this.game.load.tilemap('tilemap', 'assets/tiles.json', null, Phaser.Tilemap.TILED_JSON);

        this.physics.startSystem(Phaser.Physics.ARCADE);

        this.cursors = this.input.keyboard.createCursorKeys();

        if (!this.game.device.desktop) {
            this.load.image('joystick_base', 'assets/transparentDark05.png');
            this.load.image('joystick_segment', 'assets/transparentDark09.png');
            this.load.image('joystick_knob', 'assets/transparentDark49.png');
        }
    }

    create():void {
        super.create();

        this.createWorld();
        this.createTiledBackground();
        this.createBullets();
        this.createPlayer();
        this.setupCamera();
        this.createVirtualJoystick();
        this.createMonsters();
    }

    private createMonsters() {
        this.monsters = this.add.group();
        this.monsters.enableBody = true;
        this.monsters.physicsBodyType = Phaser.Physics.ARCADE;

        this.tilemap = this.game.add.tilemap('tilemap');

        this.tilemap.createFromObjects('monsters', 37, 'monster', 0, true, false, this.monsters);

        this.monsters.setAll('anchor.x', 0.5);
        this.monsters.setAll('anchor.y', 0.5);
        this.monsters.setAll('health', 5);
        this.monsters.forEach(this.setRandomAngle, this);
        this.monsters.setAll('checkWorldBounds', true);
        this.monsters.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', this.resetMonster, this);
    };

    private setRandomAngle(monster:Phaser.Sprite) {
        monster.angle = this.rnd.angle();
    }

    private resetMonster(monster:Phaser.Sprite) {
        monster.rotation = this.physics.arcade.angleBetween(
            monster,
            this.player
        );
    }

    private createBullets() {
        this.bullets = this.add.group();
        this.bullets.enableBody = true;
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.bullets.createMultiple(20, 'bullet');

        this.bullets.setAll('anchor.x', 0.5);
        this.bullets.setAll('anchor.y', 0.5);

        this.bullets.setAll('outOfBoundsKill', true);
        this.bullets.setAll('checkWorldBounds', true);
    };

    private createVirtualJoystick() {
        if (!this.game.device.desktop) {
            var g = new Gamepads.GamePad(this.game, Gamepads.GamepadType.DOUBLE_STICK);
        }
    };

    private setupCamera() {
        this.camera.follow(this.player);
    };

    private createPlayer() {
        this.player = this.add.sprite(this.world.centerX, this.world.centerY, 'player');
        this.player.anchor.setTo(0.5, 0.5);
        this.physics.enable(this.player, Phaser.Physics.ARCADE);

        this.player.body.maxVelocity.setTo(this.PLAYER_MAX_SPEED, this.PLAYER_MAX_SPEED); // x, y
        this.player.body.collideWorldBounds = true;
        this.player.body.drag.setTo(this.PLAYER_DRAG, this.PLAYER_DRAG); // x, y
    };

    private createTiledBackground() {
        this.add.tileSprite(0, 0, this.world.width, this.world.height, 'bg');
    };

    private createWorld() {
        this.world.setBounds(0, 0, 2000, 2000);
    };

    update():void {
        super.update();
        this.movePlayer();
        this.rotatePlayerToPointer();
        this.fireWhenButtonClicked();
        this.moveMonsters();

        this.physics.arcade.overlap(this.bullets, this.monsters, this.bulletHitMonster, null, this);
    }

    private bulletHitMonster(bullet:Phaser.Sprite, monster:Phaser.Sprite) {
        bullet.kill();
        monster.damage(1);
        if (monster.health == 0) {
            monster.kill();
        }
    }

    private moveMonsters() {
        this.monsters.forEach(this.advanceStraightAhead, this)
    };

    private advanceStraightAhead(monster:Phaser.Sprite) {
        this.physics.arcade.velocityFromAngle(monster.angle, 100, monster.body.velocity);
    }

    private fireWhenButtonClicked() {
        if (this.input.activePointer.isDown) {
            this.fire();
        }
    };

    private rotatePlayerToPointer() {
        this.player.rotation = this.physics.arcade.angleToPointer(
            this.player,
            this.input.activePointer
        );
    };

    private movePlayer() {
        if (this.cursors.left.isDown) {
            this.player.body.acceleration.x = -this.PLAYER_ACCELERATION;
        } else if (this.cursors.right.isDown) {
            this.player.body.acceleration.x = this.PLAYER_ACCELERATION;
        } else if (this.cursors.up.isDown) {
            this.player.body.acceleration.y = -this.PLAYER_ACCELERATION;
        } else if (this.cursors.down.isDown) {
            this.player.body.acceleration.y = this.PLAYER_ACCELERATION;
        } else {
            this.player.body.acceleration.x = 0;
            this.player.body.acceleration.y = 0;
        }
    };

    fire():void {
        if (this.time.now > this.nextFire) {
            var bullet = this.bullets.getFirstDead();
            if (bullet) {
                var length = this.player.width * 0.5;
                var x = this.player.x + (Math.cos(this.player.rotation) * length);
                var y = this.player.y + (Math.sin(this.player.rotation) * length);

                bullet.reset(x, y);

                bullet.angle = this.player.angle;
                bullet.rotation = this.physics.arcade.moveToPointer(bullet, 800);

                this.nextFire = this.time.now + this.FIRE_RATE;
            }
        }
    }
}

class ShooterGame extends Phaser.Game {
    constructor() {
        super(1024, 600, Phaser.AUTO, 'gameDiv');
        this.state.add('main', mainState);
        this.state.start('main');
    }
}

window.onload = () => {
    var game = new ShooterGame();
};
