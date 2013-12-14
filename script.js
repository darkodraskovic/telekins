// INITIALIZE ENGINE
var Q = window.Q = Quintus({ development: true })
	.include("Sprites, Scenes, Input, Anim, 2D, UI, Touch")
	.setup({ maximize: "touch", width: 640, height: 480 })
	.controls()
	.touch();

// Q.input.keyboardControls();
// Q.input.joypadControls();

// INIT VARS
Q.gravityY = 0;
Q.gravityX = 0;

// INIT CONSTS
var SPRITE_NONE = 0;
var SPRITE_PLAYER = 1;
var SPRITE_TILE = 2;
var SPRITE_ENEMY = 4;
var SPRITE_BULLET = 8;

var cCollisionPolygon = [[-12, -18], [12, -18], [-12, 28], [12, 28]];
var bulletCollisionPolygon = [[-2, -5], [-2, 5], [2, -5], [2, 5]];

// LOAD ASSETS / CREATE SHEETS / STAGE SCENE
Q.load("interior-Furniture.png, interior-Walls-Beige.png, level1.tmx, agentWalk.png, muzzleflashes-Shots.png, armor2Walk.png", function() {
    Q.sheet("background",
	    "interior-Furniture.png",
	    {
		tilew: 32,  
		tileh: 32,  
		sx: 0,  
		sy: 0  
	    });

    Q.sheet("collision",
	    "interior-Walls-Beige.png",
	    {
		tilew: 32,  
		tileh: 32,  
		sx: 0,  
		sy: 0  
	    });

    Q.sheet("agentWalk",
	    "agentWalk.png",
	    {
		tilew: 64,  
		tileh: 64,  
		sx: 0,  
		sy: 0  
	    });

    Q.sheet("bullets",
            "muzzleflashes-Shots.png",
            {
		tilew: 32,  
		tileh: 32,  
		sx: 0,  
		sy: 0  
            });

    Q.sheet("androWalk",
	    "armor2Walk.png",
	    {
		tilew: 64,
		tileh: 64,
		sx: 0,
		sy: 0
	    }
	   );

    Q.animations('walk', {
	walk_up: { frames: [1, 2, 3, 4, 5, 6, 7, 8], rate: 1/7}, 
	walk_left: { frames: [10, 11, 12, 13, 14, 15, 16, 17], rate:1/7 },
	walk_down: { frames: [19, 20, 21, 22, 23, 24, 25, 26], rate:1/7 },
	walk_right: { frames: [28, 29, 30, 31, 32, 33, 34, 35], rate:1/7 },
	stand_up: { frames: [0], rate: 1/5 },
	stand_left: { frames: [9], rate: 1/5 },
	stand_down: { frames: [18], rate: 1/5 },
	stand_right: { frames: [27], rate: 1/5 }

    });

    Q.animations('redBullet', {
	fly_up: { frames: [24], rate: 1/5}, 
	fly_left: { frames: [19], rate:1/5 },
	fly_down: { frames: [24], rate:1/5 },
	fly_right: { frames: [19], rate:1/15 }	    
    });

    
    Q.stageScene("level1");

});


// define SCENES
Q.scene("level1",function(stage) {
    stage.insert(new Q.TileLayer({ dataAsset: 'level1.tmx', sheet: 'background', layerIndex:0, type: Q.SPRITE_NONE }));
    stage.collisionLayer(new Q.TileLayer({ dataAsset: 'level1.tmx', sheet: 'background', layerIndex:1 , type: SPRITE_TILE}));
    
    var player = stage.insert(new Q.Player({x: 160, y: 112}));
    var enemy1 = stage.insert(new Q.Enemy({x: 160, y: 192}));
    
    stage.add("viewport").follow(player);

});

// SPRITES
Q.Sprite.extend("Player",{
    init: function(p) {
	this._super(p, {    		   
	    sheet: "androWalk",
	    sprite: "walk",
	    type: Q.SPRITE_DEFAULT, 
      	    collisionMask: SPRITE_TILE | SPRITE_ENEMY,
	    hitPoints: 10,
	    damage: 5,
	    x: 96,
	    y: 96,
	    points: cCollisionPolygon
    	});
	
	this.add("2d, animation");
	this.add("playerMovement, playerAnimator");
	this.add("pistol");
	Q.input.on("fire", this, "shoot");
	Q.input.on("action", this, "refillAmmo");
	//   this.on("hit",this,"collision");
    },
    
    // collision: function(col) {
    //     // .. do anything custom you need to do ..
    
    //     // Move the sprite away from the collision
    //     this.p.x -= col.separate[0];
    //     this.p.y -= col.separate[1];
    // },
    
    step: function(dt) {
        // Tell the stage to run collisions on this sprite
	// this.stage.collide(this);
	// console.log(this.has("pistol"));
	this.animate();

    }
});

var STAND = 0;
var LEFT = 1;
var RIGHT = 2;
var UP = 3;
var DOWN = 4;

Q.component("playerMovement", {
    defaults: {speed: 100,
	       movingLeft: false, movingRight: false, movingUp: false, movingDown: false,
	       facing: "right"},

    added: function() {
	var p = this.entity.p;
	Q._defaults(p, this.defaults);
	this.entity.on("step", this, "step");
    },

    step: function(dt) {
	var p = this.entity.p;

	// determine the MOVING DIR and the FACING DIR
	if (Q.inputs["up"] && !Q.inputs["down"]) {
	    p.facing = "up";
	    p.movingUp = true;
	} else if (Q.inputs["down"] && !Q.inputs["up"]) {
	    p.facing = "down";
	    p.movingDown = true;
	} else p.movingUp = p.movingDown = false;

	if (Q.inputs["left"] && !Q.inputs["right"]) {
	    p.facing = "left";
	    p.movingLeft = true;
	}
	else if (Q.inputs["right"] && !Q.inputs["left"]) {
	    p.facing = "right";
	    p.movingRight = true;
	} else p.movingLeft = p.movingRight = false;


	// set the SPEED on the basis of the movingDir; Quintus figures out the position
	if (p.movingLeft) p.vx = -p.speed;
	else if (p.movingRight) p.vx = p.speed;
	else p.vx = 0;
	if (p.movingUp) p.vy = -p.speed;
	else if (p.movingDown) p.vy = p.speed;
	else p.vy = 0;
	

    }
});

Q.component("playerAnimator", {
    extend : {
	// set the ANIMATION
	animate: function() {
	    if (!(this.p.movingLeft || this.p.movingRight || this.p.movingUp || this.p.movingDown)) {
		switch(this.p.facing) {
		case "left":
		    this.play("stand_left");
		    break;
		case "right":
		    this.play("stand_right");
		    break;
		case "up":
		    this.play("stand_up");
		    break;
		case "down":
		    this.play("stand_down");
		    break;
		}
	    } else {
		switch(this.p.facing) {
		case "left":
		    this.play("walk_left");
		    break;
		case "right":
		    this.play("walk_right");
		    break;
		case "up":
		    this.play("walk_up");
		    break;
		case "down":
		    this.play("walk_down");
		    break;
		}

	    }
	}
    }	
});


Q.Sprite.extend("Bullet",{
    init: function(p) {
	this._super(p, {    		   
            sheet: "bullets",
	    frame: 19,
	    type: SPRITE_BULLET, 
      	    collisionMask: SPRITE_ENEMY,
            damage: 5,
	    speed: 300,
	    points: bulletCollisionPolygon
    	});

	this.add("2d, animation");

    }
}); 


Q.component("pistol", {
    defaults: {ammo: 10},
    
    added: function() {
	var p = this.entity.p;
	Q._defaults(p, this.defaults);
    },
    
    extend: {
	shoot: function() {
	    console.log("You hold your gun and...");
	    if (this.p.ammo > 0) {
		this.p.ammo--;
		var bullet = new Q.Bullet({x: this.p.x, y: this.p.y});
		var angle = Math.floor(Math.atan2(-this.p.vy, this.p.vx) * 180 / Math.PI);
		if (this.p.vx || this.p.vy) {
		    switch(angle) {
		    case 0: 
			bullet.p.vx = bullet.p.speed;
			bullet.p.angle = -90;
			break;		    
		    case 45: bullet.p.vx = bullet.p.speed;
			bullet.p.vy = -bullet.p.speed;
			bullet.p.angle = angle;
			break;
		    case 90:
			bullet.p.vy = -bullet.p.speed;
			break;
		    case 135:
			bullet.p.vx = -bullet.p.speed;
			bullet.p.vy = -bullet.p.speed;
			bullet.p.angle = angle;
			break;
		    case -180:
			bullet.p.vx = -bullet.p.speed;
			bullet.p.angle = 90;
			break;			

		    case -135:
			bullet.p.vx = -bullet.p.speed;
			bullet.p.vy = bullet.p.speed;
			bullet.p.angle = 225;
			break;			
		    case -45:
			bullet.p.vy = bullet.p.speed;
			bullet.p.vx = bullet.p.speed;
			bullet.p.angle = 315;
			break;
		    case -90:
			bullet.p.vy = bullet.p.speed;
			break;
			
		    }
		} else {
		    switch(this.p.facing) {
		    case "left": bullet.p.vx = -bullet.p.speed;
			bullet.p.angle = 90;
			break;	   
			
		    case "right": bullet.p.vx = bullet.p.speed;
			bullet.p.angle = -90;
			break;
			
		    case "up": bullet.p.vy = -bullet.p.speed;
			break;	   

		    case "down": bullet.p.vy = bullet.p.speed;
			break;	   
			
		    default:
			break;
		    }
		}
		this.stage.insert(bullet);
		console.log("Bang!");
	    } else {
		console.log("...You're out of ammo...");
	    }
	    
	},

	refillAmmo: function() {
	    this.p.ammo = 10;
	}

    }
});

// enemy sprite
Q.Sprite.extend("Enemy", {
    init: function(p) {
	this._super(p, {
	    sheet: "agentWalk",
	    sprite: "walk",
//	    frame: 18,
	    type: SPRITE_ENEMY,
	    collisionMask: SPRITE_TILE | SPRITE_PLAYER,
	    points: cCollisionPolygon
	});

	this.add("2d, animation");
	this.add("enemyMovement, enemyCollision, enemyAnimator");
	this.on("hit", this, "collide");
    },


    step: function(dt) {
	this.animate();
    }

});


// enemy movement
Q.component("enemyMovement", {
    defaults : {speed: 100, 
		movLR: STAND, movUD: STAND, 
		facing: RIGHT 
	       },

    added: function() {
	var p = this.entity.p;
	Q._defaults(p, this.defaults);
	this.entity.on("step", this, "step");
    },

    step: function(dt) {
	var p = this.entity.p;

	this.randomWalk();
	console.log(p.facing);

	// set the SPEED on the basis of the movingDir; Quintus figures out the position
	if (p.movLR == LEFT) p.vx = -p.speed;
	else if (p.movLR == RIGHT) p.vx = p.speed;
	else p.vx = 0;

	if (p.movUD == UP) p.vy = -p.speed;
	else if (p.movUD == DOWN) p.vy = p.speed;
	else p.vy = 0;


    },

    randomWalk: function() {
	var p = this.entity.p;
	switch(Math.ceil(Math.random() * 312)) {
	case 1:
	    if(p.movLR == LEFT) {p.facing = RIGHT; p.movLR = RIGHT;}
	    else if (p.movLR == RIGHT) {p.facing = LEFT; p.movLR = LEFT;};
	    break;
	case 2:
	    if(p.movUD == UP) {p.facing = DOWN; p.movUD = DOWN;}
	    else if (p.movUD == DOWN) {p.facing = UP; p.movUD = UP;}
	    break;

	case 3: p.movLR = STAND;
	    if (p.movUD == UP)
		p.facing = UP;
	    else if (p.movUD == DOWN)
		p.facing = DOWN;
	    break;
	case 4: p.movUD = STAND;
	    if (p.movLR == LEFT)
		p.facing = LEFT;
	    else if (p.movLR == RIGHT)
		p.facing = RIGHT;
	    break;

	case 5: p.facing = LEFT; p.movLR = LEFT; break;
	case 6: p.facing = RIGHT; p.movLR = RIGHT; break;
	case 7: p.facing = UP; p.movUD = UP; break;
	case 8: p.facing = DOWN; p.movUD = DOWN; break;

	default: break;
	}
    }
    
});

Q.component("enemyAnimator", {
    extend: {
	animate: function() {
	    if (this.p.movLR == STAND && this.p.movUD == STAND) {
		switch(this.p.facing)  {
		case LEFT: this.play("stand_left");
		    break;
		case RIGHT: this.play("stand_right");
		    break;
		case UP: this.play("stand_up");
		    break;
		case DOWN: this.play("stand_down");
		    break;
		}
	    } else {
		if (this.p.movLR == LEFT) this.play("walk_left");
		else if (this.p.movLR == RIGHT) this.play("walk_right");
		else if (this.p.movUD == UP) this.play("walk_up");
		else if (this.p.movUD == DOWN) this.play("walk_down");
	    }	    
	}
    }
});

Q.component("enemyCollision", {
    extend: {
	collide: function(col) {
	    if (col.obj.isA("Bullet")) {
		console.log("Bullet hit");
		col.obj.destroy();
	    }
	    if (col.obj.p.type == SPRITE_TILE | SPRITE_PLAYER) {
		console.log("Tile hit");
		if (col.normalX) {
		    if (this.p.movLR == LEFT) {
			this.p.facing = RIGHT;
			this.p.movLR = RIGHT; 
		    }
		    else {
			this.p.facing = LEFT;
			this.p.movLR = LEFT;
		    }
		}
		if (col.normalY) {
		    if (this.p.movUD == UP) {
			this.p.facing = DOWN;
			this.p.movUD = DOWN;
		    }
		    else {
			this.p.facing = UP;
			this.p.movUD = UP;
		    }
		}
	    }
	}	
    }
});









