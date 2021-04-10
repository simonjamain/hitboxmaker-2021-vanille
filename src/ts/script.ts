import 'phaser';
/**
 *
 * capter les inputs manette
 *
 * lancer un grappin dans une direction
 *
 * accrocher legrapin joueur-----(grappin)-----poule
 *
 * relacher grappin
 *
 * mourrir joueur
 *
 * countdown depart
 *
 * ajout joueur 2/n
 *
 * afficher direction grapin
 * faire que les poules sa descend
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
    create,
    update,
  },
};

const CHICKEN_INTERVAL_MS = 1500;
const CHICKEN_SIZE = 100;
const CHICKEN_TARGET_Y = { max: config.height - 300, min: CHICKEN_SIZE };
const CHICKEN_WING_FORCE = { x: 0.03, y: -0.2 };

const PLAYER_WIDTH = 100;
const PLAYER_HEIGHT = 150;

const MAX_GRABBER_DISTANCE = 700;

var game = new Phaser.Game(config);
var rnd = Phaser.Math.RND;

function create() {
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

  createChickens.call(this);
}

function update(time, delta) {
  if (Math.random() < delta / CHICKEN_INTERVAL_MS) {
    generateChicken.call(this);
  }

  updatePlayers.call(this);
  updateChicken.call(this);
}

function updatePlayers() {
  this.players.forEach((player) => {
    var pad = player._pad;

    let leftStick = { x: pad.axes[0].getValue(), y: pad.axes[1].getValue() };

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
    console.log(pad);
    createPlayer.call(this, pad);
  });
}

function createPlayer(pad) {
  var player = this.matter.add.rectangle(
    300,
    config.height - PLAYER_HEIGHT / 2,
    PLAYER_WIDTH,
    PLAYER_HEIGHT
  );
  player._pad = pad;

  this.players.push(player);
  console.log(player);
  setInterval(() => fire.call(this, player), 1000);
}

function fire(player) {
  if (!player._grabber) {
    player._grabber = this.matter.add.circle(
      player.position.x,
      player.position.y - PLAYER_HEIGHT / 2,
      10,
      {
        onCollideCallback: (collision) => {
          console.log(collision);
        },
      }
    );

    this.matter.applyForce(player._grabber, { x: 0.03, y: -0.03 });
  }
}

function attachPlayerToChicken(player, chicken) {
  player._isAttached = true;
  this.matter.add.spring(player, chicken, 300, 0.2);
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
    targetY + 50,
    CHICKEN_SIZE / 2,
    {
      collisionFilter: {
        group: this.chickenGroup,
      },
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
