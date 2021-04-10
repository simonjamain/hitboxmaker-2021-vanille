import 'phaser';
/**
 *
 * !!!OK!!! capter les inputs manette
 *
 * !!!OK!!! lancer un grappin dans une direction
 *
 * !!!OK!!! accrocher legrapin joueur-----(grappin)-----poule
 *
 * !!!OK!!! relacher grappin
 *
 * fullscreen
 *
 * mourrir joueur
 *
 * countdown depart
 *
 * !!!OK!!! ajout joueur 2/n
 *
 * afficher direction grapin
 * faire que les poules sa descend (ou que on monte)
 *
 * rembobiner / débobiner grappin
 *
 * pondre oeuf
 *
 * percuter oeuf
 *
 * frapper oeuf
 *
 * multijoueur online
 *
 * design
 *
 * nuages en parralaxe
 *
 * son
 *
 */

var config = {
  type: Phaser.WEBGL,
  width: 1920,
  height: 1080,
  input: {
    gamepad: true,
  },
  backgroundColor: '#000000',
  physics: {
    default: 'matter',
    matter: {
      gravity: {
        y: 0.8,
      },
      debug: true,
      debugBodyColor: 0xffffff,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

const CAMERA_SPEED = 0.05;

const CHICKEN_INTERVAL_MS = 1500;
const CHICKEN_SIZE = 100;
const CHICKEN_TARGET_Y = { max: config.height - 300, min: CHICKEN_SIZE };
const CHICKEN_WING_FORCE = { x: 0.03, y: -0.2 };

const PLAYER_WIDTH = 100;
const PLAYER_HEIGHT = 150;

const MAX_GRABBER_DISTANCE = 900;
const GRABBER_THROW_FORCE = 0.03;

const SPRING_INITIAL_GAP = 100;
const SPRING_ADJUSTMENT_SPEED = 250;
const SPRING_MAX_LENGTH = 700;
const SPRING_MIN_LENGTH = CHICKEN_SIZE / 2 + PLAYER_HEIGHT / 2;
const SPRING_STIFFNESS = 0.3;
const SPRING_HORIZONTAL_MOVE_FACTOR = 0.002;

const PAD_TRIGGER_THRESHOLD = 0.8;

var game: any = new Phaser.Game(config);
var rnd = Phaser.Math.RND;

function preload() {
  for (let i = 1; i <= 9; i++) {
    this.load.audio('cri_' + i, 'sound/cri_' + i + '.mp3');
  }
}

function create() {
  //debug
  this.text = this.add
    .text(32, 32)
    .setScrollFactor(0)
    .setFontSize(32)
    .setColor('#ffffff');
  createPlayers.call(this);

  //debug
  this.matter.add.mouseSpring();

  this.matter.world.setBounds(
    0,
    0,
    config.width,
    config.height,
    64,
    false,
    false,
    false,
    true
  );
  // set the horizontal dead zone to 1.5x game width (experimental)
  //this.cameras.main.setDeadzone(this.scale.width * 1.5);
  //this.matter.world.setBounds(0, -100 * config.height, config.width, config.height * 100);
  createChickens.call(this);
}

function update(time, delta) {
  this.text.setText([
    'ScrollX: ' + this.cameras.main.scrollX,
    'ScrollY: ' + this.cameras.main.scrollY,
    'MidX: ' + this.cameras.main.midPoint.x,
    'MidY: ' + this.cameras.main.midPoint.y,
  ]);
  if (Math.random() < delta / CHICKEN_INTERVAL_MS) {
    generateChicken.call(this);
  }

  updatePlayers.call(this, delta);
  updateChicken.call(this);

  if (time > 10000) {
    this.cameras.main.setPosition(
      0,
      this.cameras.main.y + delta * CAMERA_SPEED
    );
  }
}

function updatePlayers(delta) {
  this.players.forEach((player) => {
    var pad = player._pad;

    player._leftStick = new Phaser.Math.Vector2(
      pad.axes[0].getValue(),
      pad.axes[1].getValue()
    );

    let _rightStick = new Phaser.Math.Vector2(
      pad.axes[2].getValue(),
      pad.axes[3].getValue()
    );

    if (player._grabber) {
      if (pad.buttons[6].value < PAD_TRIGGER_THRESHOLD) {
        recallGrabber.call(this, player);
      }
    } else if (player._spring) {
      if (pad.buttons[6].value < PAD_TRIGGER_THRESHOLD) {
        release.call(this, player);
      } else {
        adjustSpringLength.call(this, player, delta);
        applyAirControl.call(this, player);
      }
    } else {
      if (pad.buttons[6].value > PAD_TRIGGER_THRESHOLD) {
        fire.call(this, player);
      }
    }

    checkGrabberDistance.call(this, player);
  });
}

function checkGrabberDistance(player) {
  if (
    player._grabber &&
    Phaser.Math.Distance.BetweenPoints(
      player.position,
      player._grabber.position
    ) > MAX_GRABBER_DISTANCE
  ) {
    this.matter.world.remove(player._grabber);
    delete player._grabber;
  }
}

function createPlayers() {
  this.players = [];
  this.input.gamepad.once('connected', (pad) => {
    this.input.gamepad.gamepads.forEach((pad, index) => {
      createPlayer.call(this, pad, index);
    });
  });
}

function createPlayer(pad, index) {
  const startingPositions = [0.15, 0.85, 0.4, 0.6];

  var player = this.matter.add.rectangle(
    config.width * startingPositions[index],
    this.cameras.main.y + 1080 - PLAYER_HEIGHT / 2,
    PLAYER_WIDTH,
    PLAYER_HEIGHT
  );
  player._pad = pad;

  this.cameras.main.startFollow(player.position); //todo : mouais
  this.players.push(player);
}

function fire(player) {
  player._grabber = this.matter.add.circle(
    player.position.x,
    player.position.y - PLAYER_HEIGHT / 2,
    10,
    {
      onCollideCallback: (collision) => {
        // Si l'élément visé est chicken
        if (collision.bodyA.label === 'chicken') {
          if (player._grabber) {
            this.matter.world.remove(player._grabber);
            delete player._grabber;
          }

          // si ce n'est pas le chicken déjà grabbé
          if (
            !player._spring ||
            player._spring.bodyB.id !== collision.bodyA.id
          ) {
            attachPlayerToChicken.call(this, player, collision.bodyA);
          }
        }
      },
    }
  );

  const grabberForce = player._leftStick
    .normalize()
    .multiply(
      new Phaser.Math.Vector2(GRABBER_THROW_FORCE, GRABBER_THROW_FORCE)
    );
  this.matter.applyForce(player._grabber, grabberForce);
}

function recallGrabber(player) {
  this.matter.world.remove(player._grabber);
  delete player._grabber;
}

function release(player) {
  this.matter.world.remove(player._spring);
  delete player._spring;
}

function adjustSpringLength(player, delta) {
  // ajuster la longueur du grab en fonction de player._leftStick.y (multiplié par un constante)
  player._spring.length = Phaser.Math.Clamp(
    player._spring.length +
      player._leftStick.y * ((SPRING_ADJUSTMENT_SPEED / 1000) * delta),
    SPRING_MIN_LENGTH,
    SPRING_MAX_LENGTH
  );
}

function applyAirControl(player) {
  // appliquer une force horizontale sur le player en fonction de player._leftStick.x (multiplié par un constante)
  this.matter.applyForce(
    player,
    new Phaser.Math.Vector2(
      player._leftStick.x * SPRING_HORIZONTAL_MOVE_FACTOR,
      0
    )
  );
}

function attachPlayerToChicken(player, chicken) {
  // Remove existing spring
  if (player._spring) {
    this.matter.world.remove(player._spring);
  }

  player._spring = this.matter.add.spring(
    player,
    chicken,
    Phaser.Math.Distance.BetweenPoints(player.position, chicken.position) -
      SPRING_INITIAL_GAP,
    SPRING_STIFFNESS
  );

  playChickenSound.call(this);
}

function playChickenSound() {
  // this.sound.play('cri1');
  // let sfx = this.sound.add('cri1');
  // sfx.play();
}

function createChickens() {
  this.chickenGroup = this.matter.world.nextGroup(true);
  this.chickens = [];
}

function generateChicken() {
  var targetY = Phaser.Math.Between(CHICKEN_TARGET_Y.min, CHICKEN_TARGET_Y.max);

  var chickenX = rnd.pick([-CHICKEN_SIZE, config.width + CHICKEN_SIZE]);

  var chicken = this.matter.add.circle(
    chickenX,
    targetY + 50 + this.cameras.main.y,
    CHICKEN_SIZE / 2,
    {
      collisionFilter: {
        group: this.chickenGroup,
      },
      label: 'chicken',
    }
  );

  chicken._targetY = targetY;
  chicken._forceVector = {
    x: CHICKEN_WING_FORCE.x * (chickenX < 0 ? 1 : -1),
    y: CHICKEN_WING_FORCE.y,
  };

  this.chickens.push(chicken);
}

function updateChicken() {
  this.chickens.forEach((chicken) => {
    //CHICKEN REMOVING
    if (
      (chicken.velocity.x > 0 &&
        chicken.position.x > config.width + CHICKEN_SIZE) ||
      (chicken.velocity.x < 0 && chicken.position.x < -CHICKEN_SIZE)
    ) {
      this.chickens = this.chickens.filter(
        (_chicken) => _chicken.id !== chicken.id
      );
      this.matter.world.remove(chicken);
    }

    //CHICKEN FLAPPING
    //si ça tombe
    if (chicken.velocity.y > 0) {
      //si c'est trop bas
      if (chicken.position.y > chicken._targetY) {
        // console.log("chicken.position.y", chicken.position.y);
        this.matter.applyForce(chicken, chicken._forceVector);
      }
    }
  });
}
