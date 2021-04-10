import 'phaser';
/**
 *
 * capter les inputs manette
 *
 * afficher direction grapin
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
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
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

var game = new Phaser.Game(config);
var rnd = Phaser.Math.RND;

function create() {
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

  createPlayers.call(this);
  createChickens.call(this);
}

function update(time, delta) {
  if (Math.random() < delta / CHICKEN_INTERVAL_MS) {
    generateChicken.call(this);
  }

  updateChicken.call(this);
}

function createPlayers() {
  this.matter.add.rectangle(
    300,
    config.height - PLAYER_HEIGHT / 2,
    PLAYER_WIDTH,
    PLAYER_HEIGHT
  );
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
