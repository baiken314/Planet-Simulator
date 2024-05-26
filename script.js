/*
* Mass simulator
* Author: Bradley Aiken
* Date: 17-08-19
*/

/******************************************
* WORD GENERATOR
******************************************/
const cons = ['b', 'p', 's', 'z', 't', 'd', 'k', 'g', 'ch', 'sh', 'j', 'f', 'w', 'y', 'ts', 'sk', 'ks', 'fr', 'n', 'm', 'h'];
const ycons = ['ty', 'sy', 'my', 'ny', 'ky', 'ry', 'ngy'];
const vowels = ['a', 'e', 'i', 'o', 'u'];
const diphs = ['ai', 'ia', 'aio', 'aie', 'ei', 'ie', 'io', 'oe', 'ou', 'ue', 'ua', 'uo', 'aoi'];
const endcons = ['n', 's', 't', 'd', 'k', 'g', 'm', 'r', 'l', 'p', 'b', 'f', 'v', 'z', 'sh', 'ch', 'j', 'ts', 'sk', 'ks', 'h', 'y', 'w'];

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

function getRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function makeSyllable(vowel) {
    var string = "";
    if (!vowel) {
        string += getRandom(cons.concat(ycons));
    }
    if (Math.random() < .8) {
        string += getRandom(vowels);
    } 
    else {
        string += getRandom(diphs);
    }
    if (Math.random() < .65) {
        string += getRandom(endcons);
    }
    return string;
}

function makeWord() {
    var string = "";
    var syllables = Math.floor(Math.random() * 3) + 1;
    if (syllables == 1 && Math.random() < .1) {
        syllables++;
    }
    while (Math.random() < .2) {
        syllables++;
    }
    for (var i = 0; i < syllables; i++) {
        if (i == 0 && Math.random() < .2) {
            string += makeSyllable(true);
        }
        else {
            string += makeSyllable(false);
        }
    }
    return string;
}

/******************************************
* INITILIZATION
******************************************/
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");

var mouseX = undefined;
var mouseY = undefined;
var xoff = 0;
var yoff = 0;

const GRAVITY = 1;

var balls = [];
var aim;
var aimfuture = 100;

// static functions
function init() {
	changeScreenSize();
}

function changeScreenSize() {
	canvas.width = innerWidth;
	canvas.height = innerHeight - document.getElementById("input-area").clientHeight;	
}

function makeBall() {
	var newDx = parseFloat(document.getElementById("x-velocity-textbox").value);
	var newDy = parseFloat(document.getElementById("y-velocity-textbox").value);
	var newMass = parseFloat(document.getElementById("mass-textbox").value);
	var isMovable = document.getElementById("movable-checkbox").checked;
	balls.push(new Ball(mouseX + xoff, mouseY + yoff, newDx, newDy, newMass, isMovable));
}

function findPath() {
	if (balls.length > 0) {
		var longestPath = 0;
		var longestX = 0;
		var longestY = 0;
		var longestDx = 0;
		var longestDy = 0;
		var pathLength, newX, newY, newDx, newDy, newMass, pathBall, inBounds, valid;
		for (var i = 0; i < 5000; i++) {
			pathLength = 0;
			newX = Math.floor(Math.random() * innerWidth) + xoff;
			newY = Math.floor(Math.random() * innerHeight) + yoff;
			newDx = Math.random() * 10 - 5;
			newDy = Math.random() * 10 - 5;
			newMass = parseFloat(document.getElementById("mass-textbox").value);
			pathBall = new Ball(newX, newY, newDx, newDy, newMass);
			inBounds = true;
			valid = true;

			while (inBounds && pathLength < 15000 && longestPath < 15000) {
				pathLength++;
				for (var j = 0; j < balls.length; j++) {
					pathBall.adjustVelocity(balls[j]);
				}
				pathBall.update();
				if (pathBall.x < 0 + xoff || pathBall.y < 0 + yoff || pathBall.x > innerWidth + xoff || pathBall.y > innerHeight - document.getElementById("input-area").clientHeight + yoff) {
					inBounds = false;
					valid = false;
					pathLength = 0;
				}
				for (var j = 0; j < balls.length; j++) {
					if (pathBall.collidesWith(balls[j]) && inBounds) {
						inBounds = false;
						break;
					}
				}
				if (pathLength > longestPath && valid && inBounds) {
					longestPath = pathLength;
					longestX = newX;
					longestY = newY;
					longestDx = newDx;
					longestDy = newDy;
				}
			}
		}

		document.getElementById("test-box").innerHTML = longestPath;
		if (longestPath > 0)
			balls.push(new Ball(longestX, longestY, longestDx, longestDy, parseFloat(document.getElementById("mass-textbox").value)));
	}
}


// classes
function Ball(x, y, dx, dy, mass, movable=true) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.mass = mass;
	this.movable = movable;
	this.isAim = false;
	this.name = makeWord().capitalize();
	this.radius = .3 * Math.pow(Math.log(this.mass), 2.5); //((mass/Math.PI)*(3/4))*(1/3);
	this.color = "hsl(" + Math.floor(Math.random() * 360) + ", " + (Math.floor(Math.random() * 40) + 35) + "%, " + (Math.floor(Math.random() * 40) + 35) + "%)";

	this.draw = function() {
		ctx.beginPath();
		ctx.arc(this.x - xoff, this.y - yoff, this.radius, 0, Math.PI*2);
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.fillStyle = "#f8f8f8";
		if (!this.isAim) {
			ctx.font = "11px monospace";
			ctx.textAlign = "center";
			ctx.fillText(this.name, this.x - xoff, this.y - yoff - this.radius - 5);
			if (this.mass >= 100) {
				ctx.fillText(this.mass, this.x - xoff, this.y - yoff + this.radius + 10);
			}
			ctx.textAlign = "left";
		}
		ctx.closePath();
	}

	this.update = function() {
		if (this.movable) {
			this.x += this.dx;
			this.y += this.dy;
		}
		this.radius = .3 * Math.pow(Math.log(this.mass), 2.5); //((mass/Math.PI)*(3/4))*(1/3);
		if (this.radius < 1) {
			this.radius = 1;
		}
		if (!this.isAim) {
			while (this.name.length > 10) {
				this.name = makeWord().capitalize();
			}
		}
	}

	this.getDistanceTo = function(other) {
		return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
	}

	this.getRadiansTo = function(other) {
		return Math.atan2(this.y - other.y, this.x - other.x);
	}

	this.getForceWith = function(other) {
		return (GRAVITY * this.mass * other.mass)/Math.pow(this.getDistanceTo(other), 2); 
	}

	this.collidesWith = function(other) {
		return this.getDistanceTo(other) < (this.radius + other.radius);
	}

	this.adjustVelocity = function(other) {
		this.dx += (this.getForceWith(other) * Math.cos(other.getRadiansTo(this)))/this.mass;
		this.dy += (this.getForceWith(other) * Math.sin(other.getRadiansTo(this)))/this.mass;
	}

}


/*******************************
* MAIN LOOP
*******************************/
init();
function main() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// handle velocity adjustments
	for (var first = 0; first < balls.length; first++) {
		for (var second = 0; second < balls.length; second++) {
			if (first != second) {
				balls[first].adjustVelocity(balls[second]);
			}
		}
	}

	// handle collisions
	for (var first = 0; first < balls.length; first++) {
		var p1 = balls[first];
		for (var second = 0; second < balls.length; second++) {
			var p2 = balls[second];
			if (first != second) {
				if (p1.collidesWith(p2) && p2.mass >= p1.mass) {
					p2.mass += p1.mass;
					p2.dx = ((2 * p1.mass)/(p1.mass + p2.mass)) * p1.dx - ((p1.mass - p2.mass)/(p1.mass + p2.mass)) * p2.dx;
					p2.dy = ((2 * p1.mass)/(p1.mass + p2.mass)) * p1.dy - ((p1.mass - p2.mass)/(p1.mass + p2.mass)) * p2.dy;
					balls.splice(first, 1);
				}
			}
		}
	}

	// handle camera view
	if (!document.activeElement.classList.contains("input-textbox")) {
		if (upPressed) {
			yoff -= 10;
		}
		if (downPressed) {
			yoff += 10;
		}
		if (leftPressed) {
			xoff -= 10;
		}
		if (rightPressed) {
			xoff += 10;
		}
	}

	// handle aim
	var newDx = parseFloat(document.getElementById("x-velocity-textbox").value);
	var newDy = parseFloat(document.getElementById("y-velocity-textbox").value);
	var newMass = parseFloat(document.getElementById("mass-textbox").value);
	aim = new Ball(mouseX + xoff, mouseY + yoff, newDx, newDy, newMass, true);
	aim.color = "#f8f8f8";
	aim.isAim = true;
	aimfuture = parseInt(document.getElementById("previews-textbox").value);
	aim.draw();

	var aimcollision = false;
	for (var t = 0; t < aimfuture; t++) {
		if (!aimcollision) {
			if (balls.length > 0) {
				for (var i = 0; i < balls.length; i++) {
					aim.adjustVelocity(balls[i]);
					if (aim.collidesWith(balls[i])) {
						aimcollision = true;
						break;
					}
				}
				aim.update();
				aim.draw();
			}
		}
	}

	// update and draw
	for (var i = 0; i < balls.length; i++) {
		balls[i].update();
		balls[i].draw();
	}

	// draw information
	ctx.font = "15px monospace";
	ctx.fillStyle = "#f8f8f8";
	ctx.fillText("X: " + xoff + " Y: " + yoff, 10, 20);
	ctx.fillText("Number of balls: " + balls.length, 9, 40);

	requestAnimationFrame(main);
}


/****************************************
* EVENT HANDLERS
*****************************************/
window.addEventListener("resize", function() {
	changeScreenSize();
});

document.addEventListener("mousemove", function(e) {
	mouseX = e.clientX;
	mouseY = e.clientY;
});


// handle inputs
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var rightPressed = false;
var leftPressed = false;
var downPressed = false;
var upPressed = false;
var zPressed = false;
var xPressed = false;

function keyDownHandler(e) {
    if (e.keyCode == 37) {
        leftPressed = true;
    }
    if (e.keyCode == 38) {
    	upPressed = true;
    }
    if (e.keyCode == 39) {
        rightPressed = true;
    }
    if (e.keyCode == 40) {
    	downPressed = true;
    }
    if (e.keyCode == 90) {
		zPressed = true;
	}
	if (e.keyCode == 88) {
		xPressed = true;
	}
}

function keyUpHandler(e) {
    if (e.keyCode == 37) {
        leftPressed = false;
    }
    if (e.keyCode == 38) {
    	upPressed = false;
    }
    if (e.keyCode == 39) {
        rightPressed = false;
    }
    if (e.keyCode == 40) {
    	downPressed = false;
    }
    if (e.keyCode == 90) {
		zPressed = false;
	} 
	if (e.keyCode == 88) {
		xPressed = false;
	}
}

main();