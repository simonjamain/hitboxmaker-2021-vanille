import "phaser";

const CHICKEN_INTERVAL_MS = 1500;
const CHICKEN_SIZE = 100;
const CHICKEN_TARGET_Y = { max: 1080 - 300, min: CHICKEN_SIZE };
const CHICKEN_WING_FORCE = { x: 0.03, y: -0.2 };

var config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  backgroundColor: "#000000",
  physics: {
    default: "matter",
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

var game = new Phaser.Game(config);

function create() {
  this.rnd = Phaser.Math.RND;
  //debug
  this.matter.add.mouseSpring();

  this.chickenGroup = this.matter.world.nextGroup(true);

  this.chickens = [];
}

function update(time, delta) {
  //chicken generation
  if (Math.random() < delta / CHICKEN_INTERVAL_MS) {
    var targetY = Phaser.Math.Between(
      CHICKEN_TARGET_Y.min,
      CHICKEN_TARGET_Y.max
    );

    var chickenX = this.rnd.pick([-CHICKEN_SIZE, 1920 + CHICKEN_SIZE]);

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

    console.log(chicken._forceVector);

    this.chickens.push(chicken);
    console.log({ chicken });
    console.log("targetHeight", chicken._targetY);
  }

  this.chickens.forEach((chicken) => {
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
