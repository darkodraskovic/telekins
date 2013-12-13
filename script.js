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
	
	this.add("2d, playerControls, animation");
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

    }
});

Q.component("playerControls", {
    defaults: {speed: 100, direction: "right"},

    added: function() {
	var p = this.entity.p;
	Q._defaults(p, this.defaults);
	this.entity.on("step", this, "step");
    },

    step: function(dt) {
	var p = this.entity.p;

	// calculate MOVEMENT
	if (!(Q.inputs["left"] || Q.inputs["right"])) {
	    p.vx = 0;
	} else {
	    if (Q.inputs["left"]) {
		p.direction = "left";
		p.vx = -p.speed;
	    }
	    else if (Q.inputs["right"]) {
		p.direction = "right";
		p.vx = p.speed;
	    }

	}
	if (!(Q.inputs["up"] || Q.inputs["down"])) {
	    p.vy = 0;
	} else {
	    if (Q.inputs["up"]) {
		p.direction = "up";
		p.vy = -p.speed;
	    }
	    else if (Q.inputs["down"]) {
		p.direction = "down";
		p.vy = p.speed;
	    }
	}

	// set ANIMATION
	if (p.vx == 0 && p.vy == 0) {
	    if (p.direction == "right")
		this.entity.play("stand_right");
	    if (p.direction == "left")
		this.entity.play("stand_left");
	    if (p.direction == "down")
		this.entity.play("stand_down");
	    if (p.direction == "up")
		this.entity.play("stand_up");
	} else {
	    if (p.direction == "right")
		this.entity.play("walk_right");
	    if (p.direction == "left")
		this.entity.play("walk_left");
	    if (p.direction == "down")
		this.entity.play("walk_down");
	    if (p.direction == "up")
		this.entity.play("walk_up");
	}

    }
});

Q.Sprite.extend("Bullet",{
    init: function(p) {
	this._super(p, {    		   
//            sprite: "redBullet",
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
		    switch(this.p.direction) {
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

	this.add("2d, animation, enemyMovement, aiBounce");
	this.on("hit", this, "collision");
    },

    collision: function(col) {
	if (col.obj.isA("Bullet")) {
	    console.log("Hit");
	    col.obj.destroy();
	}
    }

});

// enemy movement
Q.component("enemyMovement", {
    defaults : {speed: 100, minSpeed: 20, direction: "right"},

    added: function() {
	var p = this.entity.p;
	Q._defaults(p, this.defaults);
	p.vx = Math.ceil(Math.random() * p.speed + p.minSpeed);
	p.vy = Math.ceil(Math.random() * p.speed + p.minSpeed);
	this.entity.on("step", this, "step");
    },

    step: function(dt) {
	var p = this.entity.p;
	var e = this.entity;

	this.randomWalk();

	// calculate DIRECTION
	if (p.vx > 0) {
	    p.direction = "right";
	} else if (p.vx < 0){
	    p.direction = "left";
	} else if (p.vy < 0){
	    p.direction = "up";
	} else if (p.vy > 0){
	    p.direction = "down";
	}
	
	// set ANIMATION
	if (p.vx == 0 && p.vy == 0) {
	    if (p.direction == "right")
		this.entity.play("stand_right");
	    if (p.direction == "left")
		this.entity.play("stand_left");
	    if (p.direction == "down")
		this.entity.play("stand_down");
	    if (p.direction == "up")
		this.entity.play("stand_up");
	} else {
	    if (p.direction == "right")
		this.entity.play("walk_right");
	    if (p.direction == "left")
		this.entity.play("walk_left");
	    if (p.direction == "down")
		this.entity.play("walk_down");
	    if (p.direction == "up")
		this.entity.play("walk_up");
	}

    },

    randomWalk: function() {
	var p = this.entity.p;
	switch(Math.ceil(Math.random() * 312)) {
	case 1: p.vx = -p.vx; break;
	case 2: p.vy = -p.vy; break;
	case 3: p.vx = 0; break;
	case 4: p.vy = 0; break;
	case 5: p.vx = Math.ceil(Math.random() * p.speed + p.minSpeed); break;
	case 6: p.vy = Math.ceil(Math.random() * p.speed + p.minSpeed); break;
	case 7: p.vx = -Math.ceil(Math.random() * p.speed + p.minSpeed); break;
	case 8: p.vy = -Math.ceil(Math.random() * p.speed + p.minSpeed); break;
	default: break;
	}
    }
    
});











