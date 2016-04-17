/**
 * Phaser joystick plugin.
 * Usage: In your preloader function call the static method preloadAssets. It will handle the preload of the necessary
 * assets. Then in the Stage in which you want to use the joystick, in the create method, instantiate the class and add such
 * object to the Phaser plugin manager (eg: this.game.plugins.add( myPlugin ))
 * Use the cursor.up / cursor.down / cursor.left / cursor.right methods to check for inputs
 * Use the speed dictionary to retrieve the input speed (if you are going to use an analog joystick)
 */
/// <reference path="../phaser/phaser.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Gamepads;
(function (Gamepads) {
    (function (Sectors) {
        Sectors[Sectors["HALF_LEFT"] = 1] = "HALF_LEFT";
        Sectors[Sectors["HALF_TOP"] = 2] = "HALF_TOP";
        Sectors[Sectors["HALF_RIGHT"] = 3] = "HALF_RIGHT";
        Sectors[Sectors["HALF_BOTTOM"] = 4] = "HALF_BOTTOM";
        Sectors[Sectors["TOP_LEFT"] = 5] = "TOP_LEFT";
        Sectors[Sectors["TOP_RIGHT"] = 6] = "TOP_RIGHT";
        Sectors[Sectors["BOTTOM_RIGHT"] = 7] = "BOTTOM_RIGHT";
        Sectors[Sectors["BOTTOM_LEFT"] = 8] = "BOTTOM_LEFT";
        Sectors[Sectors["ALL"] = 9] = "ALL";
    })(Gamepads.Sectors || (Gamepads.Sectors = {}));
    var Sectors = Gamepads.Sectors;
    /**
     * @class Joystick
     * @extends Phaser.Plugin
     *
     * Implements a floating joystick for touch screen devices
     */
    var Joystick = (function (_super) {
        __extends(Joystick, _super);
        function Joystick(game, sector, gamepadMode) {
            if (gamepadMode === void 0) { gamepadMode = true; }
            _super.call(this, game, new PIXI.DisplayObject());
            this.imageGroup = [];
            this.doUpdate = false;
            this.gamepadMode = true;
            this.game = game;
            this.sector = sector;
            this.gamepadMode = gamepadMode;
            this.pointer = this.game.input.pointer1;
            //Setup the images
            this.imageGroup.push(this.game.add.sprite(0, 0, 'joystick_base'));
            this.imageGroup.push(this.game.add.sprite(0, 0, 'joystick_segment'));
            this.imageGroup.push(this.game.add.sprite(0, 0, 'joystick_knob'));
            this.imageGroup.forEach(function (e) {
                e.anchor.set(0.5);
                e.visible = false;
                e.fixedToCamera = true;
            });
            //Setup Default Settings
            this.settings = {
                maxDistanceInPixels: 60,
                singleDirection: false,
                float: true,
                analog: true,
                topSpeed: 200
            };
            //Setup Default State
            this.cursors = {
                up: false,
                down: false,
                left: false,
                right: false
            };
            this.speed = {
                x: 0,
                y: 0
            };
            this.inputEnable();
        }
        /**
         * @function inputEnable
         * enables the plugin actions
         */
        Joystick.prototype.inputEnable = function () {
            this.game.input.onDown.add(this.createStick, this);
            this.game.input.onUp.add(this.removeStick, this);
            this.active = true;
        };
        /**
         * @function inputDisable
         * disables the plugin actions
         */
        Joystick.prototype.inputDisable = function () {
            this.game.input.onDown.remove(this.createStick, this);
            this.game.input.onUp.remove(this.removeStick, this);
            this.active = false;
        };
        Joystick.prototype.inSector = function (pointer) {
            var half_bottom = pointer.position.y > this.game.height / 2;
            var half_top = pointer.position.y < this.game.height / 2;
            var half_right = pointer.position.x > this.game.width / 2;
            var half_left = pointer.position.x < this.game.width / 2;
            if (this.sector == Sectors.ALL)
                return true;
            if (this.sector == Sectors.HALF_LEFT && half_left)
                return true;
            if (this.sector == Sectors.HALF_RIGHT && half_right)
                return true;
            if (this.sector == Sectors.HALF_BOTTOM && half_bottom)
                return true;
            if (this.sector == Sectors.HALF_TOP && half_top)
                return true;
            if (this.sector == Sectors.TOP_LEFT && half_top && half_left)
                return true;
            if (this.sector == Sectors.TOP_RIGHT && half_top && half_right)
                return true;
            if (this.sector == Sectors.BOTTOM_RIGHT && half_bottom && half_right)
                return true;
            if (this.sector == Sectors.BOTTOM_LEFT && half_bottom && half_left)
                return true;
            return false;
        };
        /**
         * @function createStick
         * @param pointer
         *
         * visually creates the pad and starts accepting the inputs
         */
        Joystick.prototype.createStick = function (pointer) {
            //If this joystick is not in charge of monitoring the sector that was touched --> return
            if (!this.inSector(pointer))
                return;
            //Else update the pointer (it may be the first touch)
            this.pointer = pointer;
            this.imageGroup.forEach(function (e) {
                e.visible = true;
                e.bringToTop();
                e.cameraOffset.x = this.pointer.worldX;
                e.cameraOffset.y = this.pointer.worldY;
            }, this);
            //Allow updates on the stick while the screen is being touched
            this.doUpdate = true;
            //Start the Stick on the position that is being touched right now
            this.initialPoint = this.pointer.position.clone();
        };
        /**
         * @function removeStick
         * @param pointer
         *
         * Visually removes the stick and stops paying atention to input
         */
        Joystick.prototype.removeStick = function (pointer) {
            if (pointer.id != this.pointer.id)
                return;
            //Deny updates on the stick
            this.doUpdate = false;
            this.imageGroup.forEach(function (e) {
                e.visible = false;
            });
            this.cursors.up = false;
            this.cursors.down = false;
            this.cursors.left = false;
            this.cursors.right = false;
            this.speed.x = 0;
            this.speed.y = 0;
        };
        /**
         * @function receivingInput
         * @returns {boolean}
         *
         * Returns true if any of the joystick "contacts" is activated
         */
        Joystick.prototype.receivingInput = function () {
            return (this.cursors.up || this.cursors.down || this.cursors.left || this.cursors.right);
        };
        /**
         * @function preUpdate
         * Performs the preUpdate plugin actions
         */
        Joystick.prototype.preUpdate = function () {
            if (this.doUpdate) {
                this.setDirection();
            }
        };
        Joystick.prototype.setSingleDirection = function () {
            var d = this.initialPoint.distance(this.pointer.position);
            var maxDistanceInPixels = this.settings.maxDistanceInPixels;
            var deltaX = this.pointer.position.x - this.initialPoint.x;
            var deltaY = this.pointer.position.y - this.initialPoint.y;
            if (d < maxDistanceInPixels) {
                this.cursors.up = false;
                this.cursors.down = false;
                this.cursors.left = false;
                this.cursors.right = false;
                this.speed.x = 0;
                this.speed.y = 0;
                this.imageGroup.forEach(function (e, i) {
                    e.cameraOffset.x = this.initialPoint.x + (deltaX) * i / (this.imageGroup.length - 1);
                    e.cameraOffset.y = this.initialPoint.y + (deltaY) * i / (this.imageGroup.length - 1);
                }, this);
                return;
            }
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                deltaY = 0;
                this.pointer.position.y = this.initialPoint.y;
            }
            else {
                deltaX = 0;
                this.pointer.position.x = this.initialPoint.x;
            }
            var angle = this.initialPoint.angle(this.pointer.position);
            if (d > maxDistanceInPixels) {
                deltaX = Math.cos(angle) * maxDistanceInPixels;
                deltaY = Math.sin(angle) * maxDistanceInPixels;
                if (this.settings.float) {
                    this.initialPoint.x = this.pointer.x - deltaX;
                    this.initialPoint.y = this.pointer.y - deltaY;
                }
            }
            this.speed.x = Math.round(Math.cos(angle) * this.settings.topSpeed);
            this.speed.y = Math.round(Math.sin(angle) * this.settings.topSpeed);
            angle = angle * 180 / Math.PI;
            this.cursors.up = angle == -90;
            this.cursors.down = angle == 90;
            this.cursors.left = angle == 180;
            this.cursors.right = angle == 0;
            this.imageGroup.forEach(function (e, i) {
                e.cameraOffset.x = this.initialPoint.x + (deltaX) * i / (this.imageGroup.length - 1);
                e.cameraOffset.y = this.initialPoint.y + (deltaY) * i / (this.imageGroup.length - 1);
            }, this);
        };
        /**
         * @function setDirection
         * Main Plugin function. Performs the calculations and updates the sprite positions
         */
        Joystick.prototype.setDirection = function () {
            if (this.settings.singleDirection) {
                this.setSingleDirection();
                return;
            }
            var d = this.initialPoint.distance(this.pointer.position);
            var maxDistanceInPixels = this.settings.maxDistanceInPixels;
            var deltaX = this.pointer.position.x - this.initialPoint.x;
            var deltaY = this.pointer.position.y - this.initialPoint.y;
            if (!this.settings.analog) {
                if (d < maxDistanceInPixels) {
                    this.cursors.up = false;
                    this.cursors.down = false;
                    this.cursors.left = false;
                    this.cursors.right = false;
                    this.speed.x = 0;
                    this.speed.y = 0;
                    this.imageGroup.forEach(function (e, i) {
                        e.cameraOffset.x = this.initialPoint.x + (deltaX) * i / (this.imageGroup.length - 1);
                        e.cameraOffset.y = this.initialPoint.y + (deltaY) * i / (this.imageGroup.length - 1);
                    }, this);
                    return;
                }
            }
            var angle = this.initialPoint.angle(this.pointer.position);
            if (d > maxDistanceInPixels) {
                deltaX = Math.cos(angle) * maxDistanceInPixels;
                deltaY = Math.sin(angle) * maxDistanceInPixels;
                if (this.settings.float) {
                    this.initialPoint.x = this.pointer.x - deltaX;
                    this.initialPoint.y = this.pointer.y - deltaY;
                }
            }
            if (this.settings.analog) {
                this.speed.x = Math.round((deltaX / maxDistanceInPixels) * this.settings.topSpeed);
                this.speed.y = Math.round((deltaY / maxDistanceInPixels) * this.settings.topSpeed);
            }
            else {
                this.speed.x = Math.round(Math.cos(angle) * this.settings.topSpeed);
                this.speed.y = Math.round(Math.sin(angle) * this.settings.topSpeed);
            }
            this.cursors.up = (deltaY < 0);
            this.cursors.down = (deltaY > 0);
            this.cursors.left = (deltaX < 0);
            this.cursors.right = (deltaX > 0);
            this.imageGroup.forEach(function (e, i) {
                e.cameraOffset.x = this.initialPoint.x + (deltaX) * i / (this.imageGroup.length - 1);
                e.cameraOffset.y = this.initialPoint.y + (deltaY) * i / (this.imageGroup.length - 1);
            }, this);
        };
        /**
         * @function preloadAssets
         * @static
         * @param game {Phaser.Game} - An instance of the current Game object
         * @param assets_path {String} - A relative path to the assets directory
         *
         * Static class that preloads all the necesary assets for the joystick. Should be called on the game
         * preload method
         */
        Joystick.preloadAssets = function (game, assets_path) {
            game.load.image('joystick_base', assets_path + '/joystick_base.png');
            game.load.image('joystick_segment', assets_path + '/joystick_segment.png');
            game.load.image('joystick_knob', assets_path + '/joystick_knob.png');
        };
        return Joystick;
    })(Phaser.Plugin);
    Gamepads.Joystick = Joystick;
})(Gamepads || (Gamepads = {}));
/// <reference path="../phaser/phaser.d.ts"/>
var Gamepads;
(function (Gamepads) {
    var PieMask = (function (_super) {
        __extends(PieMask, _super);
        function PieMask(game, radius, x, y, rotation, sides) {
            if (radius === void 0) { radius = 50; }
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (rotation === void 0) { rotation = 0; }
            if (sides === void 0) { sides = 6; }
            _super.call(this, game, x / 2, y / 2);
            this.atRest = false;
            this.game = game;
            this.radius = radius;
            this.rotation = rotation;
            this.moveTo(this.x, this.y);
            if (sides < 3)
                this.sides = 3; // 3 sides minimum
            else
                this.sides = sides;
            this.game.add.existing(this);
        }
        PieMask.prototype.drawCircleAtSelf = function () {
            this.drawCircle(this.x, this.y, this.radius * 2);
        };
        PieMask.prototype.drawWithFill = function (pj, color, alpha) {
            if (color === void 0) { color = 0; }
            if (alpha === void 0) { alpha = 1; }
            this.clear();
            this.beginFill(color, alpha);
            this.draw(pj);
            this.endFill();
        };
        PieMask.prototype.lineToRadians = function (rads, radius) {
            this.lineTo(Math.cos(rads) * radius + this.x, Math.sin(rads) * radius + this.y);
        };
        PieMask.prototype.draw = function (pj) {
            // graphics should have its beginFill function already called by now
            this.moveTo(this.x, this.y);
            var radius = this.radius;
            // Increase the length of the radius to cover the whole target
            radius /= Math.cos(1 / this.sides * Math.PI);
            // Find how many sides we have to draw
            var sidesToDraw = Math.floor(pj * this.sides);
            for (var i = 0; i <= sidesToDraw; i++)
                this.lineToRadians((i / this.sides) * (Math.PI * 2) + this.rotation, radius);
            // Draw the last fractioned side
            if (pj * this.sides != sidesToDraw)
                this.lineToRadians(pj * (Math.PI * 2) + this.rotation, radius);
        };
        return PieMask;
    })(Phaser.Graphics);
    Gamepads.PieMask = PieMask;
})(Gamepads || (Gamepads = {}));
/// <reference path="../phaser/phaser.d.ts"/>
/// <reference path="Utils.ts"/>
var Gamepads;
(function (Gamepads) {
    (function (ButtonType) {
        ButtonType[ButtonType["SINGLE"] = 1] = "SINGLE";
        ButtonType[ButtonType["TURBO"] = 2] = "TURBO";
        ButtonType[ButtonType["DELAYED_TURBO"] = 3] = "DELAYED_TURBO";
        ButtonType[ButtonType["SINGLE_THEN_TURBO"] = 4] = "SINGLE_THEN_TURBO";
        ButtonType[ButtonType["CUSTOM"] = 5] = "CUSTOM";
    })(Gamepads.ButtonType || (Gamepads.ButtonType = {}));
    var ButtonType = Gamepads.ButtonType;
    var Button = (function (_super) {
        __extends(Button, _super);
        function Button(game, x, y, key, onPressedCallback, listenerContext, type, width, height) {
            if (type === void 0) { type = ButtonType.SINGLE_THEN_TURBO; }
            _super.call(this, game, new PIXI.DisplayObject());
            this.pressed = false;
            this.game = game;
            this.type = type;
            this.sprite = this.game.add.sprite(x, y, key);
            this.width = width || this.sprite.width;
            this.height = height || this.sprite.height;
            this.sprite.inputEnabled = true;
            this.cooldown = {
                enabled: false,
                seconds: 0,
                timer: 0
            };
            if (onPressedCallback == undefined) {
                this.onPressedCallback = this.empty;
            }
            else {
                this.onPressedCallback = onPressedCallback.bind(listenerContext);
            }
            this.sprite.events.onInputDown.add(this.pressButton, this);
            this.sprite.events.onInputUp.add(this.releaseButton, this);
            this.sprite.anchor.setTo(1, 1);
            this.active = true;
        }
        Button.prototype.empty = function () {
        };
        Button.prototype.enableCooldown = function (seconds) {
            this.cooldown.enabled = true;
            this.cooldown.seconds = seconds;
            this.cooldown.timer = this.game.time.time;
            var mask_x = this.sprite.x - (this.sprite.width / 2);
            var mask_y = this.sprite.y - (this.sprite.height / 2);
            var mask_radius = Math.max(this.sprite.width, this.sprite.height) / 2;
            this.sprite.mask = new Gamepads.PieMask(this.game, mask_radius, mask_x, mask_y);
        };
        Button.prototype.disableCooldown = function () {
            this.cooldown.enabled = false;
            this.sprite.mask.drawCircleAtSelf();
            this.sprite.mask.atRest = true;
        };
        Button.prototype.pressButton = function () {
            switch (this.type) {
                case ButtonType.SINGLE:
                    this.onPressedCallback();
                    break;
                case ButtonType.TURBO:
                    this.pressed = true;
                    break;
                case ButtonType.DELAYED_TURBO:
                    this.timerId = setTimeout(function () {
                        this.pressed = true;
                    }.bind(this), 300);
                    break;
                case ButtonType.SINGLE_THEN_TURBO:
                    this.onPressedCallback();
                    this.timerId = setTimeout(function () {
                        this.pressed = true;
                    }.bind(this), 300);
                    break;
                default:
                    this.pressed = true;
            }
        };
        Button.prototype.releaseButton = function () {
            this.pressed = false;
            clearTimeout(this.timerId);
        };
        Button.prototype.setOnPressedCallback = function (listener, listenerContext) {
            this.onPressedCallback = listener.bind(listenerContext);
        };
        Button.prototype.update = function () {
            if (this.cooldown.enabled) {
                var elapsed = this.game.time.elapsedSecondsSince(this.cooldown.timer);
                var cooldown = this.cooldown.seconds;
                if (elapsed > cooldown) {
                    if (this.pressed) {
                        this.cooldown.timer = this.game.time.time;
                        if (this.type != ButtonType.CUSTOM) {
                            this.onPressedCallback();
                        }
                    }
                    if (!this.sprite.mask.atRest) {
                        this.sprite.mask.drawCircleAtSelf();
                        this.sprite.mask.atRest = true;
                    }
                    return;
                }
                var pj = elapsed / cooldown;
                this.sprite.mask.drawWithFill(pj, 0xFFFFFF, 1);
                this.sprite.mask.atRest = false;
            }
            else {
                //If it is custom, we assume the programmer will check for the state in his own update,
                //we just set the state to pressed
                if (this.pressed) {
                    this.cooldown.timer = this.game.time.time;
                    if (this.type != ButtonType.CUSTOM) {
                        this.onPressedCallback();
                    }
                }
            }
        };
        return Button;
    })(Phaser.Plugin);
    Gamepads.Button = Button;
})(Gamepads || (Gamepads = {}));
/// <reference path="Button.ts"/>
var Gamepads;
(function (Gamepads) {
    (function (ButtonPadType) {
        ButtonPadType[ButtonPadType["ONE_FIXED"] = 1] = "ONE_FIXED";
        ButtonPadType[ButtonPadType["TWO_INLINE_X"] = 2] = "TWO_INLINE_X";
        ButtonPadType[ButtonPadType["TWO_INLINE_Y"] = 3] = "TWO_INLINE_Y";
        ButtonPadType[ButtonPadType["THREE_INLINE_X"] = 4] = "THREE_INLINE_X";
        ButtonPadType[ButtonPadType["THREE_INLINE_Y"] = 5] = "THREE_INLINE_Y";
        ButtonPadType[ButtonPadType["THREE_FAN"] = 6] = "THREE_FAN";
        ButtonPadType[ButtonPadType["FOUR_STACK"] = 7] = "FOUR_STACK";
        ButtonPadType[ButtonPadType["FOUR_INLINE_X"] = 8] = "FOUR_INLINE_X";
        ButtonPadType[ButtonPadType["FOUR_INLINE_Y"] = 9] = "FOUR_INLINE_Y";
        ButtonPadType[ButtonPadType["FOUR_FAN"] = 10] = "FOUR_FAN";
        ButtonPadType[ButtonPadType["FIVE_FAN"] = 11] = "FIVE_FAN";
    })(Gamepads.ButtonPadType || (Gamepads.ButtonPadType = {}));
    var ButtonPadType = Gamepads.ButtonPadType;
    var ButtonPad = (function (_super) {
        __extends(ButtonPad, _super);
        function ButtonPad(game, type, buttonSize) {
            _super.call(this, game, new PIXI.DisplayObject());
            this.padding = 10;
            this.game = game;
            this.type = type;
            this.buttonSize = buttonSize;
            switch (this.type) {
                case ButtonPadType.ONE_FIXED:
                    this.initOneFixed();
                    break;
                case ButtonPadType.TWO_INLINE_X:
                    this.initTwoInlineX();
                    break;
                case ButtonPadType.THREE_INLINE_X:
                    this.initThreeInlineX();
                    break;
                case ButtonPadType.FOUR_INLINE_X:
                    this.initFourInlineX();
                    break;
                case ButtonPadType.TWO_INLINE_Y:
                    this.initTwoInlineY();
                    break;
                case ButtonPadType.THREE_INLINE_Y:
                    this.initThreeInlineY();
                    break;
                case ButtonPadType.FOUR_INLINE_Y:
                    this.initFourInlineY();
                    break;
                case ButtonPadType.FOUR_STACK:
                    this.initFourStack();
                    break;
                case ButtonPadType.THREE_FAN:
                    this.initThreeFan();
                    break;
                case ButtonPadType.FOUR_FAN:
                    this.initFourFan();
                    break;
                case ButtonPadType.FIVE_FAN:
                    this.initFiveFan();
                    break;
            }
        }
        ButtonPad.prototype.initOneFixed = function () {
            var offsetX = this.game.width - this.padding;
            var offsetY = this.game.height - this.padding;
            this.button1 = new Gamepads.Button(this.game, offsetX, offsetY, 'button1');
            this.game.add.plugin(this.button1);
            return offsetX;
        };
        ButtonPad.prototype.initTwoInlineX = function () {
            var offsetX = this.initOneFixed();
            var offsetY = this.game.height - this.padding;
            offsetX = offsetX - this.buttonSize - this.padding;
            this.button2 = new Gamepads.Button(this.game, offsetX, offsetY, 'button2');
            this.game.add.plugin(this.button2);
            return offsetX;
        };
        ButtonPad.prototype.initThreeInlineX = function () {
            var offsetX = this.initTwoInlineX();
            var offsetY = this.game.height - this.padding;
            offsetX = offsetX - this.buttonSize - this.padding;
            this.button3 = new Gamepads.Button(this.game, offsetX, offsetY, 'button3');
            this.game.add.plugin(this.button3);
            return offsetX;
        };
        ButtonPad.prototype.initFourInlineX = function () {
            var offsetX = this.initThreeInlineX();
            var offsetY = this.game.height - this.padding;
            offsetX = offsetX - this.buttonSize - this.padding;
            this.button4 = new Gamepads.Button(this.game, offsetX, offsetY, 'button4');
            this.game.add.plugin(this.button4);
            return offsetX;
        };
        ButtonPad.prototype.initTwoInlineY = function () {
            var offsetX = this.game.width - this.padding;
            var offsetY = this.game.height - this.padding;
            this.button1 = new Gamepads.Button(this.game, offsetX, offsetY, 'button1');
            offsetY = offsetY - this.buttonSize - this.padding;
            this.button2 = new Gamepads.Button(this.game, offsetX, offsetY, 'button2');
            this.game.add.plugin(this.button1);
            this.game.add.plugin(this.button2);
            return offsetY;
        };
        ButtonPad.prototype.initThreeInlineY = function () {
            var offsetX = this.game.width - this.padding;
            var offsetY = this.initTwoInlineY();
            offsetY = offsetY - this.buttonSize - this.padding;
            this.button3 = new Gamepads.Button(this.game, offsetX, offsetY, 'button3');
            this.game.add.plugin(this.button3);
            return offsetY;
        };
        ButtonPad.prototype.initFourInlineY = function () {
            var offsetX = this.game.width - this.padding;
            var offsetY = this.initThreeInlineY();
            offsetY = offsetY - this.buttonSize - this.padding;
            this.button4 = new Gamepads.Button(this.game, offsetX, offsetY, 'button4');
            this.game.add.plugin(this.button4);
            return offsetY;
        };
        ButtonPad.prototype.initFourStack = function () {
            var offsetX = this.game.width - this.padding;
            var offsetY = this.game.height - this.padding;
            this.button1 = new Gamepads.Button(this.game, offsetX, offsetY, 'button1');
            offsetY = offsetY - this.buttonSize - this.padding;
            this.button2 = new Gamepads.Button(this.game, offsetX, offsetY, 'button2');
            var offsetX = offsetX - this.buttonSize - this.padding;
            var offsetY = this.game.height - this.padding;
            this.button3 = new Gamepads.Button(this.game, offsetX, offsetY, 'button3');
            offsetY = offsetY - this.buttonSize - this.padding;
            this.button4 = new Gamepads.Button(this.game, offsetX, offsetY, 'button4');
            this.game.add.plugin(this.button1);
            this.game.add.plugin(this.button2);
            this.game.add.plugin(this.button3);
            this.game.add.plugin(this.button4);
        };
        ButtonPad.prototype.toRadians = function (angle) {
            return angle * (Math.PI / 180);
        };
        ButtonPad.prototype.toDegrees = function (angle) {
            return angle * (180 / Math.PI);
        };
        ButtonPad.prototype.initThreeFan = function () {
            //Arc Center X,Y Coordinates
            var cx = this.game.width - 3 * this.padding;
            var cy = this.game.height - 3 * this.padding;
            var radius = this.buttonSize * 1.5;
            var angleStep = 100 / 2;
            var angle = 175;
            angle = this.toRadians(angle);
            angleStep = this.toRadians(angleStep);
            //Button 1
            var bx = cx + Math.cos(angle) * radius;
            var by = cy + Math.sin(angle) * radius;
            this.button1 = new Gamepads.Button(this.game, bx, by, 'button1');
            this.button1.sprite.scale.setTo(0.7);
            //Button 2
            bx = cx + Math.cos(angle + angleStep) * radius;
            by = cy + Math.sin(angle + angleStep) * radius;
            this.button2 = new Gamepads.Button(this.game, bx, by, 'button2');
            this.button2.sprite.scale.setTo(0.7);
            //Button 3
            bx = cx + Math.cos(angle + (angleStep * 2)) * radius;
            by = cy + Math.sin(angle + (angleStep * 2)) * radius;
            this.button3 = new Gamepads.Button(this.game, bx, by, 'button3');
            this.button3.sprite.scale.setTo(0.7);
            this.game.add.plugin(this.button1);
            this.game.add.plugin(this.button2);
            this.game.add.plugin(this.button3);
        };
        ButtonPad.prototype.initFourFan = function () {
            //Arc Center X,Y Coordinates
            var cx = this.game.width - 3 * this.padding;
            var cy = this.game.height - 3 * this.padding;
            var radius = this.buttonSize * 1.5;
            var angleStep = 100 / 2;
            var angle = 175;
            angle = this.toRadians(angle);
            angleStep = this.toRadians(angleStep);
            this.button1 = new Gamepads.Button(this.game, cx - this.padding, cy - this.padding, 'button1');
            this.button1.sprite.scale.setTo(1.2);
            //Button 2
            var bx = cx + Math.cos(angle) * radius;
            var by = cy + Math.sin(angle) * radius;
            this.button2 = new Gamepads.Button(this.game, bx, by, 'button2');
            this.button2.sprite.scale.setTo(0.7);
            //Button 3
            bx = cx + Math.cos(angle + angleStep) * radius;
            by = cy + Math.sin(angle + angleStep) * radius;
            this.button3 = new Gamepads.Button(this.game, bx, by, 'button3');
            this.button3.sprite.scale.setTo(0.7);
            //Button 4
            bx = cx + Math.cos(angle + (angleStep * 2)) * radius;
            by = cy + Math.sin(angle + (angleStep * 2)) * radius;
            this.button4 = new Gamepads.Button(this.game, bx, by, 'button4');
            this.button4.sprite.scale.setTo(0.7);
            this.game.add.plugin(this.button1);
            this.game.add.plugin(this.button2);
            this.game.add.plugin(this.button3);
            this.game.add.plugin(this.button4);
        };
        ButtonPad.prototype.initFiveFan = function () {
            //Arc Center X,Y Coordinates
            var cx = this.game.width - 3 * this.padding;
            var cy = this.game.height - 3 * this.padding;
            var radius = this.buttonSize * 1.5;
            var angleStep = 100 / 3;
            var angle = 175;
            angle = this.toRadians(angle);
            angleStep = this.toRadians(angleStep);
            this.button1 = new Gamepads.Button(this.game, cx, cy, 'button1');
            this.button1.sprite.scale.setTo(1.2);
            //Button 2
            var bx = cx + Math.cos(angle) * radius;
            var by = cy + Math.sin(angle) * radius;
            this.button2 = new Gamepads.Button(this.game, bx, by, 'button2');
            this.button2.sprite.scale.setTo(0.7);
            //Button 3
            bx = cx + Math.cos(angle + angleStep) * radius;
            by = cy + Math.sin(angle + angleStep) * radius;
            this.button3 = new Gamepads.Button(this.game, bx, by, 'button3');
            this.button3.sprite.scale.setTo(0.7);
            //Button 4
            bx = cx + Math.cos(angle + (angleStep * 2)) * radius;
            by = cy + Math.sin(angle + (angleStep * 2)) * radius;
            this.button4 = new Gamepads.Button(this.game, bx, by, 'button4');
            this.button4.sprite.scale.setTo(0.7);
            //Button 5
            bx = cx + Math.cos(angle + (angleStep * 3)) * radius;
            by = cy + Math.sin(angle + (angleStep * 3)) * radius;
            this.button5 = new Gamepads.Button(this.game, bx, by, 'button5');
            this.button5.sprite.scale.setTo(0.7);
            this.game.add.plugin(this.button1);
            this.game.add.plugin(this.button2);
            this.game.add.plugin(this.button3);
            this.game.add.plugin(this.button4);
            this.game.add.plugin(this.button5);
        };
        ButtonPad.preloadAssets = function (game, assets_path) {
            game.load.image('button1', assets_path + '/button1.png');
            game.load.image('button2', assets_path + '/button2.png');
            game.load.image('button3', assets_path + '/button3.png');
            game.load.image('button4', assets_path + '/button4.png');
            game.load.image('button5', assets_path + '/button5.png');
        };
        return ButtonPad;
    })(Phaser.Plugin);
    Gamepads.ButtonPad = ButtonPad;
})(Gamepads || (Gamepads = {}));
/// <reference path="../phaser/phaser.d.ts"/>
/// <reference path="Joystick.ts"/>
var Gamepads;
(function (Gamepads) {
    (function (TouchInputType) {
        TouchInputType[TouchInputType["TOUCH"] = 1] = "TOUCH";
        TouchInputType[TouchInputType["SWIPE"] = 2] = "SWIPE";
    })(Gamepads.TouchInputType || (Gamepads.TouchInputType = {}));
    var TouchInputType = Gamepads.TouchInputType;
    var TouchInput = (function (_super) {
        __extends(TouchInput, _super);
        function TouchInput(game, sector, type) {
            if (type === void 0) { type = TouchInputType.SWIPE; }
            _super.call(this, game, new PIXI.DisplayObject());
            this.screenPressed = false;
            this.swipeThreshold = 100;
            this.game = game;
            this.sector = sector;
            this.touchType = type;
            this.pointer = this.game.input.pointer1;
            this.swipeDownCallback = this.empty;
            this.swipeLeftCallback = this.empty;
            this.swipeRightCallback = this.empty;
            this.swipeUpCallback = this.empty;
            this.onTouchDownCallback = this.empty;
            this.onTouchReleaseCallback = this.empty;
            //Setup Default State
            this.swipe = {
                up: false,
                down: false,
                left: false,
                right: false
            };
            this.inputEnable();
        }
        TouchInput.prototype.inputEnable = function () {
            this.game.input.onDown.add(this.startGesture, this);
            this.game.input.onUp.add(this.endGesture, this);
            this.active = true;
        };
        TouchInput.prototype.inputDisable = function () {
            this.game.input.onDown.remove(this.startGesture, this);
            this.game.input.onUp.remove(this.endGesture, this);
            this.active = false;
        };
        TouchInput.prototype.inSector = function (pointer) {
            var half_bottom = pointer.position.y > this.game.height / 2;
            var half_top = pointer.position.y < this.game.height / 2;
            var half_right = pointer.position.x > this.game.width / 2;
            var half_left = pointer.position.x < this.game.width / 2;
            if (this.sector == Gamepads.Sectors.ALL)
                return true;
            if (this.sector == Gamepads.Sectors.HALF_LEFT && half_left)
                return true;
            if (this.sector == Gamepads.Sectors.HALF_RIGHT && half_right)
                return true;
            if (this.sector == Gamepads.Sectors.HALF_BOTTOM && half_bottom)
                return true;
            if (this.sector == Gamepads.Sectors.HALF_TOP && half_top)
                return true;
            if (this.sector == Gamepads.Sectors.TOP_LEFT && half_top && half_left)
                return true;
            if (this.sector == Gamepads.Sectors.TOP_RIGHT && half_top && half_right)
                return true;
            if (this.sector == Gamepads.Sectors.BOTTOM_RIGHT && half_bottom && half_right)
                return true;
            if (this.sector == Gamepads.Sectors.BOTTOM_LEFT && half_bottom && half_left)
                return true;
            return false;
        };
        TouchInput.prototype.startGesture = function (pointer) {
            //If this joystick is not in charge of monitoring the sector that was touched --> return
            if (!this.inSector(pointer))
                return;
            this.touchTimer = this.game.time.time;
            this.screenPressed = true;
            //Else update the pointer (it may be the first touch)
            this.pointer = pointer;
            //Start the Stick on the position that is being touched right now
            this.initialPoint = this.pointer.position.clone();
            if (this.touchType == TouchInputType.TOUCH) {
                this.onTouchDownCallback();
            }
        };
        /**
         * @function removeStick
         * @param pointer
         *
         * Visually removes the stick and stops paying atention to input
         */
        TouchInput.prototype.endGesture = function (pointer) {
            if (pointer.id != this.pointer.id)
                return;
            this.screenPressed = false;
            var elapsedTime = this.game.time.elapsedSecondsSince(this.touchTimer);
            if (this.touchType == TouchInputType.TOUCH) {
                this.onTouchReleaseCallback(elapsedTime);
                return;
            }
            var d = this.initialPoint.distance(this.pointer.position);
            if (d < this.swipeThreshold)
                return;
            var deltaX = this.pointer.position.x - this.initialPoint.x;
            var deltaY = this.pointer.position.y - this.initialPoint.y;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.pointer.position.y = this.initialPoint.y;
            }
            else {
                this.pointer.position.x = this.initialPoint.x;
            }
            var angle = this.initialPoint.angle(this.pointer.position);
            angle = angle * 180 / Math.PI;
            this.swipe.up = angle == -90;
            this.swipe.down = angle == 90;
            this.swipe.left = angle == 180;
            this.swipe.right = angle == 0;
            console.log(this.swipe);
            if (this.swipe.up)
                this.swipeUpCallback();
            if (this.swipe.down)
                this.swipeDownCallback();
            if (this.swipe.left)
                this.swipeLeftCallback();
            if (this.swipe.right)
                this.swipeRightCallback();
        };
        TouchInput.prototype.empty = function (par) {
        };
        /**
         * @function preloadAssets
         * @static
         * @param game {Phaser.Game} - An instance of the current Game object
         * @param assets_path {String} - A relative path to the assets directory
         *
         * Static class that preloads all the necesary assets for the joystick. Should be called on the game
         * preload method
         */
        TouchInput.preloadAssets = function (game, assets_path) {
            game.load.image('joystick_base', assets_path + '/joystick_base.png');
            game.load.image('joystick_segment', assets_path + '/joystick_segment.png');
            game.load.image('joystick_knob', assets_path + '/joystick_knob.png');
        };
        return TouchInput;
    })(Phaser.Plugin);
    Gamepads.TouchInput = TouchInput;
})(Gamepads || (Gamepads = {}));
/// <reference path="../phaser/phaser.d.ts"/>
/// <reference path="Joystick.ts"/>
/// <reference path="Button.ts"/>
/// <reference path="ButtonPad.ts"/>
/// <reference path="TouchInput.ts"/>
var Gamepads;
(function (Gamepads) {
    (function (GamepadType) {
        GamepadType[GamepadType["SINGLE_STICK"] = 1] = "SINGLE_STICK";
        GamepadType[GamepadType["DOUBLE_STICK"] = 2] = "DOUBLE_STICK";
        GamepadType[GamepadType["STICK_BUTTON"] = 3] = "STICK_BUTTON";
        GamepadType[GamepadType["CORNER_STICKS"] = 4] = "CORNER_STICKS";
        GamepadType[GamepadType["GESTURE_BUTTON"] = 5] = "GESTURE_BUTTON";
        GamepadType[GamepadType["GESTURE"] = 6] = "GESTURE";
    })(Gamepads.GamepadType || (Gamepads.GamepadType = {}));
    var GamepadType = Gamepads.GamepadType;
    var GamePad = (function (_super) {
        __extends(GamePad, _super);
        function GamePad(game, type, buttonPadType) {
            _super.call(this, game, new PIXI.DisplayObject());
            this.test = 0;
            this.game = game;
            switch (type) {
                case GamepadType.DOUBLE_STICK:
                    this.initDoublStick();
                    break;
                case GamepadType.SINGLE_STICK:
                    this.initSingleStick();
                    break;
                case GamepadType.STICK_BUTTON:
                    this.initStickButton(buttonPadType);
                    break;
                case GamepadType.CORNER_STICKS:
                    this.initCornerSticks();
                    break;
                case GamepadType.GESTURE_BUTTON:
                    this.initGestureButton(buttonPadType);
                    break;
                case GamepadType.GESTURE:
                    this.initGesture();
                    break;
            }
        }
        GamePad.prototype.initDoublStick = function () {
            this.stick1 = new Gamepads.Joystick(this.game, Gamepads.Sectors.HALF_LEFT);
            this.stick2 = new Gamepads.Joystick(this.game, Gamepads.Sectors.HALF_RIGHT);
            this.game.add.plugin(this.stick1, null);
            this.game.add.plugin(this.stick2, null);
        };
        GamePad.prototype.initCornerSticks = function () {
            //Add 2 extra pointers (2 by default + 2 Extra)
            this.game.input.addPointer();
            this.game.input.addPointer();
            this.stick1 = new Gamepads.Joystick(this.game, Gamepads.Sectors.BOTTOM_LEFT);
            this.stick2 = new Gamepads.Joystick(this.game, Gamepads.Sectors.TOP_LEFT);
            this.stick3 = new Gamepads.Joystick(this.game, Gamepads.Sectors.TOP_RIGHT);
            this.stick4 = new Gamepads.Joystick(this.game, Gamepads.Sectors.BOTTOM_RIGHT);
            this.game.add.plugin(this.stick1, null);
            this.game.add.plugin(this.stick2, null);
            this.game.add.plugin(this.stick3, null);
            this.game.add.plugin(this.stick4, null);
        };
        GamePad.prototype.initSingleStick = function () {
            this.stick1 = new Gamepads.Joystick(this.game, Gamepads.Sectors.ALL);
            this.game.add.plugin(this.stick1, null);
        };
        GamePad.prototype.initStickButton = function (buttonPadType) {
            this.stick1 = new Gamepads.Joystick(this.game, Gamepads.Sectors.HALF_LEFT);
            this.game.add.plugin(this.stick1, null);
            this.buttonPad = new Gamepads.ButtonPad(this.game, buttonPadType, 100);
        };
        GamePad.prototype.initGestureButton = function (buttonPadType) {
            this.touchInput = new Gamepads.TouchInput(this.game, Gamepads.Sectors.HALF_LEFT);
            this.buttonPad = new Gamepads.ButtonPad(this.game, buttonPadType, 100);
        };
        GamePad.prototype.initGesture = function () {
            this.touchInput = new Gamepads.TouchInput(this.game, Gamepads.Sectors.ALL);
        };
        GamePad.preloadAssets = function (game, assets_path) {
            Gamepads.Joystick.preloadAssets(game, assets_path);
            Gamepads.ButtonPad.preloadAssets(game, assets_path);
        };
        return GamePad;
    })(Phaser.Plugin);
    Gamepads.GamePad = GamePad;
})(Gamepads || (Gamepads = {}));
/// <reference path="phaser/phaser.d.ts"/>
/// <reference path="joypad/GamePad.ts"/>
var Sprite = Phaser.Sprite;
var ShooterGame = (function (_super) {
    __extends(ShooterGame, _super);
    //score = 0;
    function ShooterGame() {
        _super.call(this, 800, 480, Phaser.CANVAS, 'gameDiv');
        this.MONSTER_SPEED = 100;
        this.BULLET_SPEED = 800;
        this.FIRE_RATE = 200;
        this.TEXT_MARGIN = 50;
        this.nextFire = 0;
        this.state.add('main', mainState);
        this.state.start('main');
    }
    return ShooterGame;
})(Phaser.Game);
window.onload = function () {
    new ShooterGame();
};
var mainState = (function (_super) {
    __extends(mainState, _super);
    function mainState() {
        _super.apply(this, arguments);
    }
    mainState.prototype.preload = function () {
        _super.prototype.preload.call(this);
        this.load.image('bg', 'assets/bg.png');
        this.load.image('player', 'assets/survivor1_machine.png');
        this.load.image('bullet', 'assets/bulletBeigeSilver_outline.png');
        this.load.image('zombie1', 'assets/zoimbie1_hold.png');
        this.load.image('zombie2', 'assets/zombie2_hold.png');
        this.load.image('robot', 'assets/robot1_hold.png');
        this.load.image('explosion', 'assets/smokeWhite0.png');
        this.load.image('explosion2', 'assets/smokeWhite1.png');
        this.load.image('explosion3', 'assets/smokeWhite2.png');
        this.load.tilemap('tilemap', 'assets/tiles.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('tiles', 'assets/tilesheet_complete.png');
        this.load.image('joystick_base', 'assets/transparentDark05.png');
        this.load.image('joystick_segment', 'assets/transparentDark09.png');
        this.load.image('joystick_knob', 'assets/transparentDark49.png');
        this.physics.startSystem(Phaser.Physics.ARCADE);
        if (this.game.device.desktop) {
            this.game.cursors = this.input.keyboard.createCursorKeys();
        }
        else {
            this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
            this.scale.pageAlignHorizontally = true;
            this.scale.pageAlignVertically = true;
            this.scale.forceOrientation(true);
            this.scale.startFullScreen(false);
        }
    };
    mainState.prototype.create = function () {
        _super.prototype.create.call(this);
        this.createTilemap();
        this.createBackground();
        this.createWalls();
        this.createExplosions();
        this.createBullets();
        this.createPlayer();
        this.setupCamera();
        this.createMonsters();
        this.createTexts();
        if (!this.game.device.desktop) {
            this.createVirtualJoystick();
        }
    };
    mainState.prototype.createTexts = function () {
        var width = this.scale.bounds.width;
        var height = this.scale.bounds.height;
        this.game.scoreText = this.add.text(this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Score: ' + this.game.player.score, { font: "30px Arial", fill: "#ffffff" });
        this.game.scoreText.fixedToCamera = true;
        this.game.livesText = this.add.text(width - this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Lives: ' + this.game.player.health, { font: "30px Arial", fill: "#ffffff" });
        this.game.livesText.anchor.setTo(1, 0);
        this.game.livesText.fixedToCamera = true;
        this.game.stateText = this.add.text(width / 2, height / 2, '', { font: '84px Arial', fill: '#fff' });
        this.game.stateText.anchor.setTo(0.5, 0.5);
        this.game.stateText.visible = false;
        this.game.stateText.fixedToCamera = true;
    };
    ;
    mainState.prototype.createExplosions = function () {
        var _this = this;
        this.game.explosions = this.add.group();
        this.game.explosions.createMultiple(20, 'explosion');
        this.game.explosions.setAll('anchor.x', 0.5);
        this.game.explosions.setAll('anchor.y', 0.5);
        this.game.explosions.forEach(function (explosion) {
            explosion.loadTexture(_this.rnd.pick(['explosion', 'explosion2', 'explosion3']));
        }, this);
    };
    ;
    mainState.prototype.createWalls = function () {
        this.game.walls = this.game.tilemap.createLayer('walls');
        this.game.walls.x = this.world.centerX;
        this.game.walls.y = this.world.centerY;
        this.game.walls.resizeWorld();
        this.game.tilemap.setCollisionBetween(1, 195, true, 'walls');
    };
    ;
    mainState.prototype.createBackground = function () {
        this.game.background = this.game.tilemap.createLayer('background');
        this.game.background.x = this.world.centerX;
        this.game.background.y = this.world.centerY;
    };
    ;
    mainState.prototype.createTilemap = function () {
        this.game.tilemap = this.game.add.tilemap('tilemap');
        this.game.tilemap.addTilesetImage('tilesheet_complete', 'tiles');
    };
    ;
    mainState.prototype.createMonsters = function () {
        this.game.monsters = this.add.group();
        var factory = new MonsterFactory(this.game);
        for (var i = 0; i < 15; i++) {
            var monster = factory.generateMonster('zombie1');
            this.game.add.existing(monster);
            this.game.monsters.add(monster);
        }
        for (var i = 0; i < 15; i++) {
            var monster1 = factory.generateMonster('robot');
            this.game.add.existing(monster1);
            this.game.monsters.add(monster1);
        }
    };
    ;
    mainState.prototype.resetMonster = function (monster) {
        monster.rotation = this.physics.arcade.angleBetween(monster, this.game.player);
    };
    mainState.prototype.createBullets = function () {
        this.game.bullets = this.add.group();
        this.game.bullets.enableBody = true;
        this.game.bullets.physicsBodyType = Phaser.Physics.ARCADE;
        this.game.bullets.createMultiple(20, 'bullet');
        this.game.bullets.setAll('anchor.x', 0.5);
        this.game.bullets.setAll('anchor.y', 0.5);
        this.game.bullets.setAll('scale.x', 0.5);
        this.game.bullets.setAll('scale.y', 0.5);
        this.game.bullets.setAll('outOfBoundsKill', true);
        this.game.bullets.setAll('checkWorldBounds', true);
    };
    ;
    mainState.prototype.createVirtualJoystick = function () {
        this.game.gamepad = new Gamepads.GamePad(this.game, Gamepads.GamepadType.DOUBLE_STICK);
    };
    ;
    mainState.prototype.setupCamera = function () {
        this.camera.follow(this.game.player);
    };
    ;
    mainState.prototype.createPlayer = function () {
        var player = new Player(this.game, this.world.centerX, this.world.centerY, 'player', 0);
        this.game.player = this.add.existing(player);
    };
    ;
    mainState.prototype.update = function () {
        _super.prototype.update.call(this);
        this.movePlayer();
        this.moveMonsters();
        if (this.game.device.desktop) {
            this.rotatePlayerToPointer();
            this.fireWhenButtonClicked();
        }
        else {
            this.rotateWithRightStick();
            this.fireWithRightStick();
        }
        this.physics.arcade.collide(this.game.player, this.game.monsters, this.monsterTouchesPlayer, null, this);
        this.physics.arcade.collide(this.game.player, this.game.walls);
        this.physics.arcade.overlap(this.game.bullets, this.game.monsters, this.bulletHitMonster, null, this);
        this.physics.arcade.collide(this.game.bullets, this.game.walls, this.bulletHitWall, null, this);
        this.physics.arcade.collide(this.game.walls, this.game.monsters, this.resetMonster, null, this);
        this.physics.arcade.collide(this.game.monsters, this.game.monsters, this.resetMonster, null, this);
    };
    mainState.prototype.rotateWithRightStick = function () {
        var speed = this.game.gamepad.stick2.speed;
        if (Math.abs(speed.x) + Math.abs(speed.y) > 20) {
            var rotatePos = new Phaser.Point(this.game.player.x + speed.x, this.game.player.y + speed.y);
            this.game.player.rotation = this.physics.arcade.angleToXY(this.game.player, rotatePos.x, rotatePos.y);
            this.fire();
        }
    };
    mainState.prototype.fireWithRightStick = function () {
        //this.gamepad.stick2.
    };
    mainState.prototype.monsterTouchesPlayer = function (player, monster) {
        monster.kill();
        player.damage(1);
        this.game.livesText.setText("Lives: " + this.game.player.health);
        this.blink(player);
        if (player.health == 0) {
            this.game.stateText.text = " GAME OVER \n Click to restart";
            this.game.stateText.visible = true;
            //the "click to restart" handler
            this.input.onTap.addOnce(this.restart, this);
        }
    };
    mainState.prototype.restart = function () {
        this.game.state.restart();
    };
    mainState.prototype.bulletHitWall = function (bullet, walls) {
        this.explosion(bullet.x, bullet.y);
        bullet.kill();
    };
    mainState.prototype.bulletHitMonster = function (bullet, monster) {
        bullet.kill();
        monster.damage(1);
        this.explosion(bullet.x, bullet.y);
        if (monster.health > 0) {
            this.blink(monster);
        }
        else {
            this.game.player.score += 10;
            this.game.scoreText.setText("Score: " + this.game.player.score);
        }
    };
    mainState.prototype.blink = function (sprite) {
        var tween = this.add.tween(sprite)
            .to({ alpha: 0.5 }, 100, Phaser.Easing.Bounce.Out)
            .to({ alpha: 1.0 }, 100, Phaser.Easing.Bounce.Out);
        tween.repeat(3);
        tween.start();
    };
    mainState.prototype.moveMonsters = function () {
        this.game.monsters.forEach(this.advanceStraightAhead, this);
    };
    ;
    mainState.prototype.advanceStraightAhead = function (monster) {
        this.physics.arcade.velocityFromAngle(monster.angle, this.game.MONSTER_SPEED, monster.body.velocity);
    };
    mainState.prototype.fireWhenButtonClicked = function () {
        if (this.input.activePointer.isDown) {
            this.fire();
        }
    };
    ;
    mainState.prototype.rotatePlayerToPointer = function () {
        this.game.player.rotation = this.physics.arcade.angleToPointer(this.game.player, this.input.activePointer);
    };
    ;
    mainState.prototype.movePlayer = function () {
        var moveWithKeyboard = function () {
            if (this.game.cursors.left.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.A)) {
                this.game.player.body.acceleration.x = -this.game.player.PLAYER_ACCELERATION;
            }
            else if (this.game.cursors.right.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.D)) {
                this.game.player.body.acceleration.x = this.game.player.PLAYER_ACCELERATION;
            }
            else if (this.game.cursors.up.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.W)) {
                this.game.player.body.acceleration.y = -this.game.player.PLAYER_ACCELERATION;
            }
            else if (this.game.cursors.down.isDown ||
                this.input.keyboard.isDown(Phaser.Keyboard.S)) {
                this.game.player.body.acceleration.y = this.game.player.PLAYER_ACCELERATION;
            }
            else {
                this.game.player.body.acceleration.x = 0;
                this.game.player.body.acceleration.y = 0;
            }
        };
        var moveWithVirtualJoystick = function () {
            if (this.game.gamepad.stick1.cursors.left) {
                this.game.player.body.acceleration.x = -this.game.PLAYER_ACCELERATION;
            }
            if (this.game.gamepad.stick1.cursors.right) {
                this.game.player.body.acceleration.x = this.game.PLAYER_ACCELERATION;
            }
            else if (this.game.gamepad.stick1.cursors.up) {
                this.game.player.body.acceleration.y = -this.game.PLAYER_ACCELERATION;
            }
            else if (this.game.gamepad.stick1.cursors.down) {
                this.game.player.body.acceleration.y = this.game.PLAYER_ACCELERATION;
            }
            else {
                this.game.player.body.acceleration.x = 0;
                this.game.player.body.acceleration.y = 0;
            }
        };
        if (this.game.device.desktop) {
            moveWithKeyboard.call(this);
        }
        else {
            moveWithVirtualJoystick.call(this);
        }
    };
    ;
    mainState.prototype.fire = function () {
        if (this.time.now > this.game.nextFire) {
            var bullet = this.game.bullets.getFirstDead();
            if (bullet) {
                var length = this.game.player.width * 0.5 + 20;
                var x = this.game.player.x + (Math.cos(this.game.player.rotation) * length);
                var y = this.game.player.y + (Math.sin(this.game.player.rotation) * length);
                bullet.reset(x, y);
                this.explosion(x, y);
                bullet.angle = this.game.player.angle;
                var velocity = this.physics.arcade.velocityFromRotation(bullet.rotation, this.game.BULLET_SPEED);
                bullet.body.velocity.setTo(velocity.x, velocity.y);
                this.game.nextFire = this.time.now + this.game.FIRE_RATE;
            }
        }
    };
    mainState.prototype.explosion = function (x, y) {
        var explosion = this.game.explosions.getFirstDead();
        if (explosion) {
            explosion.reset(x - this.rnd.integerInRange(0, 5) + this.rnd.integerInRange(0, 5), y - this.rnd.integerInRange(0, 5) + this.rnd.integerInRange(0, 5));
            explosion.alpha = 0.6;
            explosion.angle = this.rnd.angle();
            explosion.scale.setTo(this.rnd.realInRange(0.5, 0.75));
            this.add.tween(explosion.scale).to({ x: 0, y: 0 }, 500).start();
            var tween = this.add.tween(explosion).to({ alpha: 0 }, 500);
            tween.onComplete.add(function () {
                explosion.kill();
            });
            tween.start();
        }
    };
    return mainState;
})(Phaser.State);
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(game, x, y, key, frame) {
        _super.call(this, game, x, y, key, frame);
        this.PLAYER_MAX_SPEED = 400;
        this.PLAYER_DRAG = 600;
        this.PLAYER_ACCELERATION = 500;
        this.game = game;
        //Posicion del player
        this.x = x;
        this.y = y;
        this.key = key;
        this.anchor.setTo(0.5, 0.5);
        this.game.physics.enable(this, Phaser.Physics.ARCADE); //Cargar fisicas
        this.body.collideWorldBounds = true; //Colisionar con el mundo
        this.body.maxVelocity.setTo(this.PLAYER_MAX_SPEED, this.PLAYER_MAX_SPEED); //Darle velocidad en los dos ejes
        this.body.drag.setTo(this.PLAYER_DRAG, this.PLAYER_DRAG); //Darle deslizamiento en los dos ejes
        //Vidas del player
        this.health = 3;
        this.score = 0;
        this.displayStats = new ScorePublisher(this);
    }
    Player.prototype.suscribe = function (displayStats) {
        this.displayStats = displayStats;
        console.log("en el subscribe:" + this.getScore());
    };
    Player.prototype.notify = function () {
        this.displayStats.updateStats(this.getScore());
    };
    Player.prototype.getScore = function () {
        return this.score;
    };
    return Player;
})(Phaser.Sprite);
var ScorePublisher = (function () {
    function ScorePublisher(player) {
        this.player = player;
        this.player.suscribe(this);
    }
    ScorePublisher.prototype.displayScore = function () {
        this.game.scoreText = this.game.add.text(this.game.TEXT_MARGIN, this.game.TEXT_MARGIN, 'Score: ' + this.score, {
            font: "30px Arial",
            fill: "#ffffff"
        });
    };
    ScorePublisher.prototype.updateStats = function (score) {
        this.score = score;
        this.displayScore();
    };
    return ScorePublisher;
})();
var Monster = (function (_super) {
    __extends(Monster, _super);
    function Monster(game, x, y, key, frame) {
        _super.call(this, game, x, y, key, frame);
        this.game = game;
        this.game.physics.enable(this, Phaser.Physics.ARCADE);
        this.body.enableBody = true;
        this.angle = game.rnd.angle();
    }
    Monster.prototype.update = function () {
        _super.prototype.update.call(this);
        this.game.physics.arcade.velocityFromAngle(this.angle, this.speed, this.body.velocity);
        this.events.onOutOfBounds.add(this.resetMonster, this);
    };
    Monster.prototype.resetMonster = function (monster) {
        monster.rotation = this.game.physics.arcade.angleBetween(monster, this.game.player);
    };
    return Monster;
})(Phaser.Sprite);
var MonsterSlow = (function (_super) {
    __extends(MonsterSlow, _super);
    function MonsterSlow(game, key) {
        _super.call(this, game, 150, 150, key, 0);
        this.anchor.setTo(0.5, 0.5);
        this.health = 4;
        this.speed = 100;
    }
    MonsterSlow.prototype.update = function () {
        _super.prototype.update.call(this);
    };
    return MonsterSlow;
})(Monster);
var MonsterFast = (function (_super) {
    __extends(MonsterFast, _super);
    function MonsterFast(game, key) {
        _super.call(this, game, 150, 150, key, 0);
        this.anchor.setTo(0.5, 0.5);
        this.angle = game.rnd.angle();
        this.health = 2;
        this.speed = 200;
    }
    MonsterFast.prototype.update = function () {
        _super.prototype.update.call(this);
    };
    return MonsterFast;
})(Monster);
var MonsterFactory = (function () {
    function MonsterFactory(game) {
        this.game = game;
    }
    MonsterFactory.prototype.generateMonster = function (key) {
        if (key == 'robot') {
            return new MonsterSlow(this.game, key);
        }
        else if (key == 'zombie1') {
            return new MonsterFast(this.game, key);
        }
    };
    return MonsterFactory;
})();
//# sourceMappingURL=main.js.map