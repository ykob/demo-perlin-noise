(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.generatePerlinNoise = generatePerlinNoise;
exports.generateWhiteNoise = generateWhiteNoise;

function generatePerlinNoise(width, height, options) {
  options = options || {};
  var octaveCount = options.octaveCount || 4;
  var amplitude = options.amplitude || 0.1;
  var persistence = options.persistence || 0.2;
  var whiteNoise = generateWhiteNoise(width, height);

  var smoothNoiseList = new Array(octaveCount);
  var i;
  for (i = 0; i < octaveCount; ++i) {
    smoothNoiseList[i] = generateSmoothNoise(i);
  }
  var perlinNoise = new Array(width * height);
  var totalAmplitude = 0;
  // blend noise together
  for (i = octaveCount - 1; i >= 0; --i) {
    amplitude *= persistence;
    totalAmplitude += amplitude;

    for (var j = 0; j < perlinNoise.length; ++j) {
      perlinNoise[j] = perlinNoise[j] || 0;
      perlinNoise[j] += smoothNoiseList[i][j] * amplitude;
    }
  }
  // normalization
  for (i = 0; i < perlinNoise.length; ++i) {
      perlinNoise[i] /= totalAmplitude;
  }

  return perlinNoise;

  function generateSmoothNoise(octave) {
    var noise = new Array(width * height);
    var samplePeriod = Math.pow(2, octave);
    var sampleFrequency = 1 / samplePeriod;
    var noiseIndex = 0;
    for (var y = 0; y < height; ++y) {
      var sampleY0 = Math.floor(y / samplePeriod) * samplePeriod;
      var sampleY1 = (sampleY0 + samplePeriod) % height;
      var vertBlend = (y - sampleY0) * sampleFrequency;
      for (var x = 0; x < width; ++x) {
        var sampleX0 = Math.floor(x / samplePeriod) * samplePeriod;
        var sampleX1 = (sampleX0 + samplePeriod) % width;
        var horizBlend = (x - sampleX0) * sampleFrequency;

        // blend top two corners
        var top = interpolate(whiteNoise[sampleY0 * width + sampleX0], whiteNoise[sampleY1 * width + sampleX0], vertBlend);
        // blend bottom two corners
        var bottom = interpolate(whiteNoise[sampleY0 * width + sampleX1], whiteNoise[sampleY1 * width + sampleX1], vertBlend);
        // final blend
        noise[noiseIndex] = interpolate(top, bottom, horizBlend);
        noiseIndex += 1;
      }
    }
    return noise;
  }
}
function generateWhiteNoise(width, height) {
  var noise = new Array(width * height);
  for (var i = 0; i < noise.length; ++i) {
    noise[i] = Math.random();
  }
  return noise;
}
function interpolate(x0, x1, alpha) {
  return x0 * (1 - alpha) + alpha * x1;
}

},{}],2:[function(require,module,exports){
module.exports = function(object, eventType, callback){
  var timer;

  object.addEventListener(eventType, function(event) {
    clearTimeout(timer);
    timer = setTimeout(function(){
      callback(event);
    }, 500);
  }, false);
};

},{}],3:[function(require,module,exports){
var Vector2 = require('./vector2');

var exports = {
  friction: function(acceleration, mu, normal, mass) {
    var force = acceleration.clone();
    if (!normal) normal = 1;
    if (!mass) mass = 1;
    force.multiplyScalar(-1);
    force.normalize();
    force.multiplyScalar(mu);
    return force;
  },
  drag: function(acceleration, value) {
    var force = acceleration.clone();
    force.multiplyScalar(-1);
    force.normalize();
    force.multiplyScalar(acceleration.length() * value);
    return force;
  },
  hook: function(velocity, anchor, rest_length, k) {
    var force = velocity.clone().sub(anchor);
    var distance = force.length() - rest_length;
    force.normalize();
    force.multiplyScalar(-1 * k * distance);
    return force;
  }
};

module.exports = exports;

},{"./vector2":7}],4:[function(require,module,exports){
var Util = require('./util');
var Vector2 = require('./vector2');
var Force = require('./force');
var debounce = require('./debounce');
var Mover = require('./mover');
var Perlin = require('../../node_modules/perlin-noise');

var body_width  = document.body.clientWidth * 2;
var body_height = document.body.clientHeight * 2;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var last_time_xxx = Date.now();
var vector_touch_start = new Vector2();
var vector_touch_move = new Vector2();
var vector_touch_end = new Vector2();
var is_touched = false;

var init = function() {
  renderloop();
  setEvent();
  resizeCanvas();
  debounce(window, 'resize', function(event){
    resizeCanvas();
  });
};

var render = function() {
  ctx.clearRect(0, 0, body_width, body_height);
};

var renderloop = function() {
  var now = Date.now();
  
  requestAnimationFrame(renderloop);
  render();
  // if (now - last_time_xxx > 1000) {
  //   function_name();
  //   last_time_xxx = Date.now();
  // }
};

var resizeCanvas = function() {
  body_width  = document.body.clientWidth * 2;
  body_height = document.body.clientHeight * 2;

  canvas.width = body_width;
  canvas.height = body_height;
  canvas.style.width = body_width / 2 + 'px';
  canvas.style.height = body_height / 2 + 'px';
};

var setEvent = function () {
  var eventTouchStart = function(x, y) {
    vector_touch_start.set(x, y);
    is_touched = true;
  };
  
  var eventTouchMove = function(x, y) {
    vector_touch_move.set(x, y);
    if (is_touched) {
      
    }
  };
  
  var eventTouchEnd = function(x, y) {
    vector_touch_end.set(x, y);
    is_touched = false;
  };

  canvas.addEventListener('contextmenu', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('selectstart', function (event) {
    event.preventDefault();
  });

  canvas.addEventListener('mousedown', function (event) {
    event.preventDefault();
    eventTouchStart(event.clientX * 2, event.clientY * 2);
  });

  canvas.addEventListener('mousemove', function (event) {
    event.preventDefault();
    eventTouchMove(event.clientX * 2, event.clientY * 2);
  });

  canvas.addEventListener('mouseup', function (event) {
    event.preventDefault();
    eventTouchEnd();
  });

  canvas.addEventListener('touchstart', function (event) {
    event.preventDefault();
    eventTouchStart(event.touches[0].clientX * 2, event.touches[0].clientY * 2);
  });

  canvas.addEventListener('touchmove', function (event) {
    event.preventDefault();
    eventTouchMove(event.touches[0].clientX * 2, event.touches[0].clientY * 2);
  });

  canvas.addEventListener('touchend', function (event) {
    event.preventDefault();
    eventTouchEnd();
  });
};

init();

},{"../../node_modules/perlin-noise":1,"./debounce":2,"./force":3,"./mover":5,"./util":6,"./vector2":7}],5:[function(require,module,exports){
var Util = require('./util');
var Vector2 = require('./vector2');
var Force = require('./force');

var exports = function(){
  var Mover = function() {
    this.position = new Vector2();
    this.velocity = new Vector2();
    this.acceleration = new Vector2();
    this.anchor = new Vector2();
    this.radius = 0;
    this.mass = 1;
    this.direction = 0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 1;
    this.time = 0;
    this.is_active = false;
  };
  
  Mover.prototype = {
    init: function(vector, size) {
      this.radius = size;
      this.mass = this.radius / 100;
      this.position = vector.clone();
      this.velocity = vector.clone();
      this.anchor = vector.clone();
      this.acceleration.set(0, 0);
      this.a = 1;
      this.time = 0;
    },
    updatePosition: function() {
      this.position.copy(this.velocity);
    },
    updateVelocity: function() {
      this.velocity.add(this.acceleration);
      if (this.velocity.distanceTo(this.position) >= 1) {
        this.direct(this.velocity);
      }
    },
    applyForce: function(vector) {
      this.acceleration.add(vector);
    },
    applyFriction: function() {
      var friction = Force.friction(this.acceleration, 0.1);
      this.applyForce(friction);
    },
    applyDragForce: function(value) {
      var drag = Force.drag(this.acceleration, value);
      this.applyForce(drag);
    },
    hook: function(rest_length, k) {
      var force = Force.hook(this.velocity, this.anchor, rest_length, k);
      this.applyForce(force);
    },
    direct: function(vector) {
      var v = vector.clone().sub(this.position);
      this.direction = Math.atan2(v.y, v.x);
    },
    draw: function(context) {
      context.fillStyle = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';
      context.beginPath();
      context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI / 180, true);
      context.fill();
    },
    activate: function () {
      this.is_active = true;
    },
    inactivate: function () {
      this.is_active = false;
    }
  };
  
  return Mover;
};

module.exports = exports();

},{"./force":3,"./util":6,"./vector2":7}],6:[function(require,module,exports){
var exports = {
  getRandomInt: function(min, max){
    return Math.floor(Math.random() * (max - min)) + min;
  },
  getDegree: function(radian) {
    return radian / Math.PI * 180;
  },
  getRadian: function(degrees) {
    return degrees * Math.PI / 180;
  },
  getSpherical: function(rad1, rad2, r) {
    var x = Math.cos(rad1) * Math.cos(rad2) * r;
    var z = Math.cos(rad1) * Math.sin(rad2) * r;
    var y = Math.sin(rad1) * r;
    return [x, y, z];
  }
};

module.exports = exports;

},{}],7:[function(require,module,exports){
// 
// このVector2クラスは、three.jsのTHREE.Vector2クラスの計算式の一部を利用しています。
// https://github.com/mrdoob/three.js/blob/master/src/math/Vector2.js#L367
// 

var exports = function(){
  var Vector2 = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  };
  
  Vector2.prototype = {
    set: function (x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    clone: function () {
      return new Vector2(this.x, this.y);
    },
    copy: function (v) {
      this.x = v.x;
      this.y = v.y;
      return this;
    },
    add: function (v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    },
    addScalar: function (s) {
      this.x += s;
      this.y += s;
      return this;
    },
    sub: function (v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    },
    subScalar: function (s) {
      this.x -= s;
      this.y -= s;
      return this;
    },
    multiply: function (v) {
      this.x *= v.x;
      this.y *= v.y;
      return this;
    },
    multiplyScalar: function (s) {
      this.x *= s;
      this.y *= s;
      return this;
    },
    divide: function (v) {
      this.x /= v.x;
      this.y /= v.y;
      return this;
    },
    divideScalar: function (s) {
      if (this.x !== 0 && s !== 0) this.x /= s;
      if (this.y !== 0 && s !== 0) this.y /= s;
      return this;
    },
    min: function (v) {
      if (this.x < v.x) this.x = v.x;
      if (this.y < v.y) this.y = v.y;
      return this;
    },
    max: function (v) {
      if (this.x > v.x) this.x = v.x;
      if (this.y > v.y) this.y = v.y;
      return this;
    },
    clamp: function (v_min, v_max) {
      if (this.x < v_min.x) {
        this.x = v_min.x;
      } else if (this.x > v_max.x) {
        this.x = v_max.x;
      }
      if (this.y < v_min.y) {
        this.y = v_min.y;
      } else if (this.y > v_max.y) {
        this.y = v_max.y;
      }
      return this;
    },
    clampScalar: function () {
      var min, max;
      return function clampScalar(minVal, maxVal) {
        if (min === undefined) {
          min = new Vector2();
          max = new Vector2();
        }
        min.set(minVal, minVal);
        max.set(maxVal, maxVal);
        return this.clamp(min, max);
      };
    }(),
    floor: function () {
      this.x = Math.floor(this.x);
      this.y = Math.floor(this.y);
      return this;
    },
    ceil: function () {
      this.x = Math.ceil(this.x);
      this.y = Math.ceil(this.y);
      return this;
    },
    round: function () {
      this.x = Math.round(this.x);
      this.y = Math.round(this.y);
      return this;
    },
    roundToZero: function () {
      this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
      this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);
      return this;
    },
    negate: function () {
      this.x = - this.x;
      this.y = - this.y;
      return this;
    },
    dot: function (v) {
      return this.x * v.x + this.y * v.y;
    },
    lengthSq: function () {
      return this.x * this.x + this.y * this.y;
    },
    length: function () {
      return Math.sqrt(this.lengthSq());
    },
    lengthManhattan: function() {
      return Math.abs(this.x) + Math.abs(this.y);
    },
    normalize: function () {
      return this.divideScalar(this.length());
    },
    distanceTo: function (v) {
      var dx = this.x - v.x;
      var dy = this.y - v.y;
      return Math.sqrt(dx * dx + dy * dy);
    },
    distanceToSquared: function (v) {
      var dx = this.x - v.x, dy = this.y - v.y;
      return dx * dx + dy * dy;
    },
    setLength: function (l) {
      var oldLength = this.length();
      if (oldLength !== 0 && l !== oldLength) {
        this.multScalar(l / oldLength);
      }
      return this;
    },
    lerp: function (v, alpha) {
      this.x += (v.x - this.x) * alpha;
      this.y += (v.y - this.y) * alpha;
      return this;
    },
    lerpVectors: function (v1, v2, alpha) {
      this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);
      return this;
    },
    equals: function (v) {
      return ((v.x === this.x) && (v.y === this.y));
    },
    fromArray: function (array, offset) {
      if (offset === undefined) offset = 0;
      this.x = array[ offset ];
      this.y = array[ offset + 1 ];
      return this;
    },
    toArray: function (array, offset) {
      if (array === undefined) array = [];
      if (offset === undefined) offset = 0;
      array[ offset ] = this.x;
      array[ offset + 1 ] = this.y;
      return array;
    },
    fromAttribute: function (attribute, index, offset) {
      if (offset === undefined) offset = 0;
      index = index * attribute.itemSize + offset;
      this.x = attribute.array[ index ];
      this.y = attribute.array[ index + 1 ];
      return this;
    }
  }

  return Vector2;
};

module.exports = exports();

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGVybGluLW5vaXNlL2luZGV4LmpzIiwic3JjL2pzL2RlYm91bmNlLmpzIiwic3JjL2pzL2ZvcmNlLmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvbW92ZXIuanMiLCJzcmMvanMvdXRpbC5qcyIsInNyYy9qcy92ZWN0b3IyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZXhwb3J0cy5nZW5lcmF0ZVBlcmxpbk5vaXNlID0gZ2VuZXJhdGVQZXJsaW5Ob2lzZTtcbmV4cG9ydHMuZ2VuZXJhdGVXaGl0ZU5vaXNlID0gZ2VuZXJhdGVXaGl0ZU5vaXNlO1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVBlcmxpbk5vaXNlKHdpZHRoLCBoZWlnaHQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBvY3RhdmVDb3VudCA9IG9wdGlvbnMub2N0YXZlQ291bnQgfHwgNDtcbiAgdmFyIGFtcGxpdHVkZSA9IG9wdGlvbnMuYW1wbGl0dWRlIHx8IDAuMTtcbiAgdmFyIHBlcnNpc3RlbmNlID0gb3B0aW9ucy5wZXJzaXN0ZW5jZSB8fCAwLjI7XG4gIHZhciB3aGl0ZU5vaXNlID0gZ2VuZXJhdGVXaGl0ZU5vaXNlKHdpZHRoLCBoZWlnaHQpO1xuXG4gIHZhciBzbW9vdGhOb2lzZUxpc3QgPSBuZXcgQXJyYXkob2N0YXZlQ291bnQpO1xuICB2YXIgaTtcbiAgZm9yIChpID0gMDsgaSA8IG9jdGF2ZUNvdW50OyArK2kpIHtcbiAgICBzbW9vdGhOb2lzZUxpc3RbaV0gPSBnZW5lcmF0ZVNtb290aE5vaXNlKGkpO1xuICB9XG4gIHZhciBwZXJsaW5Ob2lzZSA9IG5ldyBBcnJheSh3aWR0aCAqIGhlaWdodCk7XG4gIHZhciB0b3RhbEFtcGxpdHVkZSA9IDA7XG4gIC8vIGJsZW5kIG5vaXNlIHRvZ2V0aGVyXG4gIGZvciAoaSA9IG9jdGF2ZUNvdW50IC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBhbXBsaXR1ZGUgKj0gcGVyc2lzdGVuY2U7XG4gICAgdG90YWxBbXBsaXR1ZGUgKz0gYW1wbGl0dWRlO1xuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBwZXJsaW5Ob2lzZS5sZW5ndGg7ICsraikge1xuICAgICAgcGVybGluTm9pc2Vbal0gPSBwZXJsaW5Ob2lzZVtqXSB8fCAwO1xuICAgICAgcGVybGluTm9pc2Vbal0gKz0gc21vb3RoTm9pc2VMaXN0W2ldW2pdICogYW1wbGl0dWRlO1xuICAgIH1cbiAgfVxuICAvLyBub3JtYWxpemF0aW9uXG4gIGZvciAoaSA9IDA7IGkgPCBwZXJsaW5Ob2lzZS5sZW5ndGg7ICsraSkge1xuICAgICAgcGVybGluTm9pc2VbaV0gLz0gdG90YWxBbXBsaXR1ZGU7XG4gIH1cblxuICByZXR1cm4gcGVybGluTm9pc2U7XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVTbW9vdGhOb2lzZShvY3RhdmUpIHtcbiAgICB2YXIgbm9pc2UgPSBuZXcgQXJyYXkod2lkdGggKiBoZWlnaHQpO1xuICAgIHZhciBzYW1wbGVQZXJpb2QgPSBNYXRoLnBvdygyLCBvY3RhdmUpO1xuICAgIHZhciBzYW1wbGVGcmVxdWVuY3kgPSAxIC8gc2FtcGxlUGVyaW9kO1xuICAgIHZhciBub2lzZUluZGV4ID0gMDtcbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8IGhlaWdodDsgKyt5KSB7XG4gICAgICB2YXIgc2FtcGxlWTAgPSBNYXRoLmZsb29yKHkgLyBzYW1wbGVQZXJpb2QpICogc2FtcGxlUGVyaW9kO1xuICAgICAgdmFyIHNhbXBsZVkxID0gKHNhbXBsZVkwICsgc2FtcGxlUGVyaW9kKSAlIGhlaWdodDtcbiAgICAgIHZhciB2ZXJ0QmxlbmQgPSAoeSAtIHNhbXBsZVkwKSAqIHNhbXBsZUZyZXF1ZW5jeTtcbiAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgd2lkdGg7ICsreCkge1xuICAgICAgICB2YXIgc2FtcGxlWDAgPSBNYXRoLmZsb29yKHggLyBzYW1wbGVQZXJpb2QpICogc2FtcGxlUGVyaW9kO1xuICAgICAgICB2YXIgc2FtcGxlWDEgPSAoc2FtcGxlWDAgKyBzYW1wbGVQZXJpb2QpICUgd2lkdGg7XG4gICAgICAgIHZhciBob3JpekJsZW5kID0gKHggLSBzYW1wbGVYMCkgKiBzYW1wbGVGcmVxdWVuY3k7XG5cbiAgICAgICAgLy8gYmxlbmQgdG9wIHR3byBjb3JuZXJzXG4gICAgICAgIHZhciB0b3AgPSBpbnRlcnBvbGF0ZSh3aGl0ZU5vaXNlW3NhbXBsZVkwICogd2lkdGggKyBzYW1wbGVYMF0sIHdoaXRlTm9pc2Vbc2FtcGxlWTEgKiB3aWR0aCArIHNhbXBsZVgwXSwgdmVydEJsZW5kKTtcbiAgICAgICAgLy8gYmxlbmQgYm90dG9tIHR3byBjb3JuZXJzXG4gICAgICAgIHZhciBib3R0b20gPSBpbnRlcnBvbGF0ZSh3aGl0ZU5vaXNlW3NhbXBsZVkwICogd2lkdGggKyBzYW1wbGVYMV0sIHdoaXRlTm9pc2Vbc2FtcGxlWTEgKiB3aWR0aCArIHNhbXBsZVgxXSwgdmVydEJsZW5kKTtcbiAgICAgICAgLy8gZmluYWwgYmxlbmRcbiAgICAgICAgbm9pc2Vbbm9pc2VJbmRleF0gPSBpbnRlcnBvbGF0ZSh0b3AsIGJvdHRvbSwgaG9yaXpCbGVuZCk7XG4gICAgICAgIG5vaXNlSW5kZXggKz0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5vaXNlO1xuICB9XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVdoaXRlTm9pc2Uod2lkdGgsIGhlaWdodCkge1xuICB2YXIgbm9pc2UgPSBuZXcgQXJyYXkod2lkdGggKiBoZWlnaHQpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vaXNlLmxlbmd0aDsgKytpKSB7XG4gICAgbm9pc2VbaV0gPSBNYXRoLnJhbmRvbSgpO1xuICB9XG4gIHJldHVybiBub2lzZTtcbn1cbmZ1bmN0aW9uIGludGVycG9sYXRlKHgwLCB4MSwgYWxwaGEpIHtcbiAgcmV0dXJuIHgwICogKDEgLSBhbHBoYSkgKyBhbHBoYSAqIHgxO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmplY3QsIGV2ZW50VHlwZSwgY2FsbGJhY2spe1xyXG4gIHZhciB0aW1lcjtcclxuXHJcbiAgb2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBjYWxsYmFjayhldmVudCk7XHJcbiAgICB9LCA1MDApO1xyXG4gIH0sIGZhbHNlKTtcclxufTtcclxuIiwidmFyIFZlY3RvcjIgPSByZXF1aXJlKCcuL3ZlY3RvcjInKTtcclxuXHJcbnZhciBleHBvcnRzID0ge1xyXG4gIGZyaWN0aW9uOiBmdW5jdGlvbihhY2NlbGVyYXRpb24sIG11LCBub3JtYWwsIG1hc3MpIHtcclxuICAgIHZhciBmb3JjZSA9IGFjY2VsZXJhdGlvbi5jbG9uZSgpO1xyXG4gICAgaWYgKCFub3JtYWwpIG5vcm1hbCA9IDE7XHJcbiAgICBpZiAoIW1hc3MpIG1hc3MgPSAxO1xyXG4gICAgZm9yY2UubXVsdGlwbHlTY2FsYXIoLTEpO1xyXG4gICAgZm9yY2Uubm9ybWFsaXplKCk7XHJcbiAgICBmb3JjZS5tdWx0aXBseVNjYWxhcihtdSk7XHJcbiAgICByZXR1cm4gZm9yY2U7XHJcbiAgfSxcclxuICBkcmFnOiBmdW5jdGlvbihhY2NlbGVyYXRpb24sIHZhbHVlKSB7XHJcbiAgICB2YXIgZm9yY2UgPSBhY2NlbGVyYXRpb24uY2xvbmUoKTtcclxuICAgIGZvcmNlLm11bHRpcGx5U2NhbGFyKC0xKTtcclxuICAgIGZvcmNlLm5vcm1hbGl6ZSgpO1xyXG4gICAgZm9yY2UubXVsdGlwbHlTY2FsYXIoYWNjZWxlcmF0aW9uLmxlbmd0aCgpICogdmFsdWUpO1xyXG4gICAgcmV0dXJuIGZvcmNlO1xyXG4gIH0sXHJcbiAgaG9vazogZnVuY3Rpb24odmVsb2NpdHksIGFuY2hvciwgcmVzdF9sZW5ndGgsIGspIHtcclxuICAgIHZhciBmb3JjZSA9IHZlbG9jaXR5LmNsb25lKCkuc3ViKGFuY2hvcik7XHJcbiAgICB2YXIgZGlzdGFuY2UgPSBmb3JjZS5sZW5ndGgoKSAtIHJlc3RfbGVuZ3RoO1xyXG4gICAgZm9yY2Uubm9ybWFsaXplKCk7XHJcbiAgICBmb3JjZS5tdWx0aXBseVNjYWxhcigtMSAqIGsgKiBkaXN0YW5jZSk7XHJcbiAgICByZXR1cm4gZm9yY2U7XHJcbiAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzO1xyXG4iLCJ2YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xyXG52YXIgVmVjdG9yMiA9IHJlcXVpcmUoJy4vdmVjdG9yMicpO1xyXG52YXIgRm9yY2UgPSByZXF1aXJlKCcuL2ZvcmNlJyk7XHJcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJy4vZGVib3VuY2UnKTtcclxudmFyIE1vdmVyID0gcmVxdWlyZSgnLi9tb3ZlcicpO1xyXG52YXIgUGVybGluID0gcmVxdWlyZSgnLi4vLi4vbm9kZV9tb2R1bGVzL3Blcmxpbi1ub2lzZScpO1xyXG5cclxudmFyIGJvZHlfd2lkdGggID0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCAqIDI7XHJcbnZhciBib2R5X2hlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0ICogMjtcclxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcclxudmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG52YXIgbGFzdF90aW1lX3h4eCA9IERhdGUubm93KCk7XHJcbnZhciB2ZWN0b3JfdG91Y2hfc3RhcnQgPSBuZXcgVmVjdG9yMigpO1xyXG52YXIgdmVjdG9yX3RvdWNoX21vdmUgPSBuZXcgVmVjdG9yMigpO1xyXG52YXIgdmVjdG9yX3RvdWNoX2VuZCA9IG5ldyBWZWN0b3IyKCk7XHJcbnZhciBpc190b3VjaGVkID0gZmFsc2U7XHJcblxyXG52YXIgaW5pdCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJlbmRlcmxvb3AoKTtcclxuICBzZXRFdmVudCgpO1xyXG4gIHJlc2l6ZUNhbnZhcygpO1xyXG4gIGRlYm91bmNlKHdpbmRvdywgJ3Jlc2l6ZScsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgIHJlc2l6ZUNhbnZhcygpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxudmFyIHJlbmRlciA9IGZ1bmN0aW9uKCkge1xyXG4gIGN0eC5jbGVhclJlY3QoMCwgMCwgYm9keV93aWR0aCwgYm9keV9oZWlnaHQpO1xyXG59O1xyXG5cclxudmFyIHJlbmRlcmxvb3AgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcclxuICBcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVybG9vcCk7XHJcbiAgcmVuZGVyKCk7XHJcbiAgLy8gaWYgKG5vdyAtIGxhc3RfdGltZV94eHggPiAxMDAwKSB7XHJcbiAgLy8gICBmdW5jdGlvbl9uYW1lKCk7XHJcbiAgLy8gICBsYXN0X3RpbWVfeHh4ID0gRGF0ZS5ub3coKTtcclxuICAvLyB9XHJcbn07XHJcblxyXG52YXIgcmVzaXplQ2FudmFzID0gZnVuY3Rpb24oKSB7XHJcbiAgYm9keV93aWR0aCAgPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoICogMjtcclxuICBib2R5X2hlaWdodCA9IGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0ICogMjtcclxuXHJcbiAgY2FudmFzLndpZHRoID0gYm9keV93aWR0aDtcclxuICBjYW52YXMuaGVpZ2h0ID0gYm9keV9oZWlnaHQ7XHJcbiAgY2FudmFzLnN0eWxlLndpZHRoID0gYm9keV93aWR0aCAvIDIgKyAncHgnO1xyXG4gIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBib2R5X2hlaWdodCAvIDIgKyAncHgnO1xyXG59O1xyXG5cclxudmFyIHNldEV2ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciBldmVudFRvdWNoU3RhcnQgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2ZWN0b3JfdG91Y2hfc3RhcnQuc2V0KHgsIHkpO1xyXG4gICAgaXNfdG91Y2hlZCA9IHRydWU7XHJcbiAgfTtcclxuICBcclxuICB2YXIgZXZlbnRUb3VjaE1vdmUgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2ZWN0b3JfdG91Y2hfbW92ZS5zZXQoeCwgeSk7XHJcbiAgICBpZiAoaXNfdG91Y2hlZCkge1xyXG4gICAgICBcclxuICAgIH1cclxuICB9O1xyXG4gIFxyXG4gIHZhciBldmVudFRvdWNoRW5kID0gZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmVjdG9yX3RvdWNoX2VuZC5zZXQoeCwgeSk7XHJcbiAgICBpc190b3VjaGVkID0gZmFsc2U7XHJcbiAgfTtcclxuXHJcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIH0pO1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignc2VsZWN0c3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBldmVudFRvdWNoU3RhcnQoZXZlbnQuY2xpZW50WCAqIDIsIGV2ZW50LmNsaWVudFkgKiAyKTtcclxuICB9KTtcclxuXHJcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGV2ZW50VG91Y2hNb3ZlKGV2ZW50LmNsaWVudFggKiAyLCBldmVudC5jbGllbnRZICogMik7XHJcbiAgfSk7XHJcblxyXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgZXZlbnRUb3VjaEVuZCgpO1xyXG4gIH0pO1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGV2ZW50VG91Y2hTdGFydChldmVudC50b3VjaGVzWzBdLmNsaWVudFggKiAyLCBldmVudC50b3VjaGVzWzBdLmNsaWVudFkgKiAyKTtcclxuICB9KTtcclxuXHJcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGV2ZW50VG91Y2hNb3ZlKGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WCAqIDIsIGV2ZW50LnRvdWNoZXNbMF0uY2xpZW50WSAqIDIpO1xyXG4gIH0pO1xyXG5cclxuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBldmVudFRvdWNoRW5kKCk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5pbml0KCk7XHJcbiIsInZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XHJcbnZhciBWZWN0b3IyID0gcmVxdWlyZSgnLi92ZWN0b3IyJyk7XHJcbnZhciBGb3JjZSA9IHJlcXVpcmUoJy4vZm9yY2UnKTtcclxuXHJcbnZhciBleHBvcnRzID0gZnVuY3Rpb24oKXtcclxuICB2YXIgTW92ZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjdG9yMigpO1xyXG4gICAgdGhpcy52ZWxvY2l0eSA9IG5ldyBWZWN0b3IyKCk7XHJcbiAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IG5ldyBWZWN0b3IyKCk7XHJcbiAgICB0aGlzLmFuY2hvciA9IG5ldyBWZWN0b3IyKCk7XHJcbiAgICB0aGlzLnJhZGl1cyA9IDA7XHJcbiAgICB0aGlzLm1hc3MgPSAxO1xyXG4gICAgdGhpcy5kaXJlY3Rpb24gPSAwO1xyXG4gICAgdGhpcy5yID0gMDtcclxuICAgIHRoaXMuZyA9IDA7XHJcbiAgICB0aGlzLmIgPSAwO1xyXG4gICAgdGhpcy5hID0gMTtcclxuICAgIHRoaXMudGltZSA9IDA7XHJcbiAgICB0aGlzLmlzX2FjdGl2ZSA9IGZhbHNlO1xyXG4gIH07XHJcbiAgXHJcbiAgTW92ZXIucHJvdG90eXBlID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24odmVjdG9yLCBzaXplKSB7XHJcbiAgICAgIHRoaXMucmFkaXVzID0gc2l6ZTtcclxuICAgICAgdGhpcy5tYXNzID0gdGhpcy5yYWRpdXMgLyAxMDA7XHJcbiAgICAgIHRoaXMucG9zaXRpb24gPSB2ZWN0b3IuY2xvbmUoKTtcclxuICAgICAgdGhpcy52ZWxvY2l0eSA9IHZlY3Rvci5jbG9uZSgpO1xyXG4gICAgICB0aGlzLmFuY2hvciA9IHZlY3Rvci5jbG9uZSgpO1xyXG4gICAgICB0aGlzLmFjY2VsZXJhdGlvbi5zZXQoMCwgMCk7XHJcbiAgICAgIHRoaXMuYSA9IDE7XHJcbiAgICAgIHRoaXMudGltZSA9IDA7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlUG9zaXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnBvc2l0aW9uLmNvcHkodGhpcy52ZWxvY2l0eSk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlVmVsb2NpdHk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnZlbG9jaXR5LmFkZCh0aGlzLmFjY2VsZXJhdGlvbik7XHJcbiAgICAgIGlmICh0aGlzLnZlbG9jaXR5LmRpc3RhbmNlVG8odGhpcy5wb3NpdGlvbikgPj0gMSkge1xyXG4gICAgICAgIHRoaXMuZGlyZWN0KHRoaXMudmVsb2NpdHkpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYXBwbHlGb3JjZTogZnVuY3Rpb24odmVjdG9yKSB7XHJcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uLmFkZCh2ZWN0b3IpO1xyXG4gICAgfSxcclxuICAgIGFwcGx5RnJpY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgZnJpY3Rpb24gPSBGb3JjZS5mcmljdGlvbih0aGlzLmFjY2VsZXJhdGlvbiwgMC4xKTtcclxuICAgICAgdGhpcy5hcHBseUZvcmNlKGZyaWN0aW9uKTtcclxuICAgIH0sXHJcbiAgICBhcHBseURyYWdGb3JjZTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgdmFyIGRyYWcgPSBGb3JjZS5kcmFnKHRoaXMuYWNjZWxlcmF0aW9uLCB2YWx1ZSk7XHJcbiAgICAgIHRoaXMuYXBwbHlGb3JjZShkcmFnKTtcclxuICAgIH0sXHJcbiAgICBob29rOiBmdW5jdGlvbihyZXN0X2xlbmd0aCwgaykge1xyXG4gICAgICB2YXIgZm9yY2UgPSBGb3JjZS5ob29rKHRoaXMudmVsb2NpdHksIHRoaXMuYW5jaG9yLCByZXN0X2xlbmd0aCwgayk7XHJcbiAgICAgIHRoaXMuYXBwbHlGb3JjZShmb3JjZSk7XHJcbiAgICB9LFxyXG4gICAgZGlyZWN0OiBmdW5jdGlvbih2ZWN0b3IpIHtcclxuICAgICAgdmFyIHYgPSB2ZWN0b3IuY2xvbmUoKS5zdWIodGhpcy5wb3NpdGlvbik7XHJcbiAgICAgIHRoaXMuZGlyZWN0aW9uID0gTWF0aC5hdGFuMih2LnksIHYueCk7XHJcbiAgICB9LFxyXG4gICAgZHJhdzogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKCcgKyB0aGlzLnIgKyAnLCcgKyB0aGlzLmcgKyAnLCcgKyB0aGlzLmIgKyAnLCcgKyB0aGlzLmEgKyAnKSc7XHJcbiAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XHJcbiAgICAgIGNvbnRleHQuYXJjKHRoaXMucG9zaXRpb24ueCwgdGhpcy5wb3NpdGlvbi55LCB0aGlzLnJhZGl1cywgMCwgTWF0aC5QSSAvIDE4MCwgdHJ1ZSk7XHJcbiAgICAgIGNvbnRleHQuZmlsbCgpO1xyXG4gICAgfSxcclxuICAgIGFjdGl2YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMuaXNfYWN0aXZlID0gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBpbmFjdGl2YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHRoaXMuaXNfYWN0aXZlID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfTtcclxuICBcclxuICByZXR1cm4gTW92ZXI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMoKTtcclxuIiwidmFyIGV4cG9ydHMgPSB7XHJcbiAgZ2V0UmFuZG9tSW50OiBmdW5jdGlvbihtaW4sIG1heCl7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluO1xyXG4gIH0sXHJcbiAgZ2V0RGVncmVlOiBmdW5jdGlvbihyYWRpYW4pIHtcclxuICAgIHJldHVybiByYWRpYW4gLyBNYXRoLlBJICogMTgwO1xyXG4gIH0sXHJcbiAgZ2V0UmFkaWFuOiBmdW5jdGlvbihkZWdyZWVzKSB7XHJcbiAgICByZXR1cm4gZGVncmVlcyAqIE1hdGguUEkgLyAxODA7XHJcbiAgfSxcclxuICBnZXRTcGhlcmljYWw6IGZ1bmN0aW9uKHJhZDEsIHJhZDIsIHIpIHtcclxuICAgIHZhciB4ID0gTWF0aC5jb3MocmFkMSkgKiBNYXRoLmNvcyhyYWQyKSAqIHI7XHJcbiAgICB2YXIgeiA9IE1hdGguY29zKHJhZDEpICogTWF0aC5zaW4ocmFkMikgKiByO1xyXG4gICAgdmFyIHkgPSBNYXRoLnNpbihyYWQxKSAqIHI7XHJcbiAgICByZXR1cm4gW3gsIHksIHpdO1xyXG4gIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cztcclxuIiwiLy8gXHJcbi8vIOOBk+OBrlZlY3RvcjLjgq/jg6njgrnjga/jgIF0aHJlZS5qc+OBrlRIUkVFLlZlY3RvcjLjgq/jg6njgrnjga7oqIjnrpflvI/jga7kuIDpg6jjgpLliKnnlKjjgZfjgabjgYTjgb7jgZnjgIJcclxuLy8gaHR0cHM6Ly9naXRodWIuY29tL21yZG9vYi90aHJlZS5qcy9ibG9iL21hc3Rlci9zcmMvbWF0aC9WZWN0b3IyLmpzI0wzNjdcclxuLy8gXHJcblxyXG52YXIgZXhwb3J0cyA9IGZ1bmN0aW9uKCl7XHJcbiAgdmFyIFZlY3RvcjIgPSBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB0aGlzLnggPSB4IHx8IDA7XHJcbiAgICB0aGlzLnkgPSB5IHx8IDA7XHJcbiAgfTtcclxuICBcclxuICBWZWN0b3IyLnByb3RvdHlwZSA9IHtcclxuICAgIHNldDogZnVuY3Rpb24gKHgsIHkpIHtcclxuICAgICAgdGhpcy54ID0geDtcclxuICAgICAgdGhpcy55ID0geTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKHRoaXMueCwgdGhpcy55KTtcclxuICAgIH0sXHJcbiAgICBjb3B5OiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggPSB2Lng7XHJcbiAgICAgIHRoaXMueSA9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgYWRkOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggKz0gdi54O1xyXG4gICAgICB0aGlzLnkgKz0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBhZGRTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHRoaXMueCArPSBzO1xyXG4gICAgICB0aGlzLnkgKz0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgc3ViOiBmdW5jdGlvbiAodikge1xyXG4gICAgICB0aGlzLnggLT0gdi54O1xyXG4gICAgICB0aGlzLnkgLT0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBzdWJTY2FsYXI6IGZ1bmN0aW9uIChzKSB7XHJcbiAgICAgIHRoaXMueCAtPSBzO1xyXG4gICAgICB0aGlzLnkgLT0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgbXVsdGlwbHk6IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIHRoaXMueCAqPSB2Lng7XHJcbiAgICAgIHRoaXMueSAqPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIG11bHRpcGx5U2NhbGFyOiBmdW5jdGlvbiAocykge1xyXG4gICAgICB0aGlzLnggKj0gcztcclxuICAgICAgdGhpcy55ICo9IHM7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGRpdmlkZTogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgdGhpcy54IC89IHYueDtcclxuICAgICAgdGhpcy55IC89IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgZGl2aWRlU2NhbGFyOiBmdW5jdGlvbiAocykge1xyXG4gICAgICBpZiAodGhpcy54ICE9PSAwICYmIHMgIT09IDApIHRoaXMueCAvPSBzO1xyXG4gICAgICBpZiAodGhpcy55ICE9PSAwICYmIHMgIT09IDApIHRoaXMueSAvPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBtaW46IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIGlmICh0aGlzLnggPCB2LngpIHRoaXMueCA9IHYueDtcclxuICAgICAgaWYgKHRoaXMueSA8IHYueSkgdGhpcy55ID0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBtYXg6IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIGlmICh0aGlzLnggPiB2LngpIHRoaXMueCA9IHYueDtcclxuICAgICAgaWYgKHRoaXMueSA+IHYueSkgdGhpcy55ID0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBjbGFtcDogZnVuY3Rpb24gKHZfbWluLCB2X21heCkge1xyXG4gICAgICBpZiAodGhpcy54IDwgdl9taW4ueCkge1xyXG4gICAgICAgIHRoaXMueCA9IHZfbWluLng7XHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy54ID4gdl9tYXgueCkge1xyXG4gICAgICAgIHRoaXMueCA9IHZfbWF4Lng7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMueSA8IHZfbWluLnkpIHtcclxuICAgICAgICB0aGlzLnkgPSB2X21pbi55O1xyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMueSA+IHZfbWF4LnkpIHtcclxuICAgICAgICB0aGlzLnkgPSB2X21heC55O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGNsYW1wU2NhbGFyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBtaW4sIG1heDtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNsYW1wU2NhbGFyKG1pblZhbCwgbWF4VmFsKSB7XHJcbiAgICAgICAgaWYgKG1pbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBtaW4gPSBuZXcgVmVjdG9yMigpO1xyXG4gICAgICAgICAgbWF4ID0gbmV3IFZlY3RvcjIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbWluLnNldChtaW5WYWwsIG1pblZhbCk7XHJcbiAgICAgICAgbWF4LnNldChtYXhWYWwsIG1heFZhbCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xhbXAobWluLCBtYXgpO1xyXG4gICAgICB9O1xyXG4gICAgfSgpLFxyXG4gICAgZmxvb3I6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gTWF0aC5mbG9vcih0aGlzLngpO1xyXG4gICAgICB0aGlzLnkgPSBNYXRoLmZsb29yKHRoaXMueSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGNlaWw6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gTWF0aC5jZWlsKHRoaXMueCk7XHJcbiAgICAgIHRoaXMueSA9IE1hdGguY2VpbCh0aGlzLnkpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICByb3VuZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLnggPSBNYXRoLnJvdW5kKHRoaXMueCk7XHJcbiAgICAgIHRoaXMueSA9IE1hdGgucm91bmQodGhpcy55KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgcm91bmRUb1plcm86IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gKHRoaXMueCA8IDApID8gTWF0aC5jZWlsKHRoaXMueCkgOiBNYXRoLmZsb29yKHRoaXMueCk7XHJcbiAgICAgIHRoaXMueSA9ICh0aGlzLnkgPCAwKSA/IE1hdGguY2VpbCh0aGlzLnkpIDogTWF0aC5mbG9vcih0aGlzLnkpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBuZWdhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgdGhpcy54ID0gLSB0aGlzLng7XHJcbiAgICAgIHRoaXMueSA9IC0gdGhpcy55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBkb3Q6IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2Lnk7XHJcbiAgICB9LFxyXG4gICAgbGVuZ3RoU3E6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcclxuICAgIH0sXHJcbiAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmxlbmd0aFNxKCkpO1xyXG4gICAgfSxcclxuICAgIGxlbmd0aE1hbmhhdHRhbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBNYXRoLmFicyh0aGlzLngpICsgTWF0aC5hYnModGhpcy55KTtcclxuICAgIH0sXHJcbiAgICBub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGl2aWRlU2NhbGFyKHRoaXMubGVuZ3RoKCkpO1xyXG4gICAgfSxcclxuICAgIGRpc3RhbmNlVG86IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgIHZhciBkeCA9IHRoaXMueCAtIHYueDtcclxuICAgICAgdmFyIGR5ID0gdGhpcy55IC0gdi55O1xyXG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcclxuICAgIH0sXHJcbiAgICBkaXN0YW5jZVRvU3F1YXJlZDogZnVuY3Rpb24gKHYpIHtcclxuICAgICAgdmFyIGR4ID0gdGhpcy54IC0gdi54LCBkeSA9IHRoaXMueSAtIHYueTtcclxuICAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xyXG4gICAgfSxcclxuICAgIHNldExlbmd0aDogZnVuY3Rpb24gKGwpIHtcclxuICAgICAgdmFyIG9sZExlbmd0aCA9IHRoaXMubGVuZ3RoKCk7XHJcbiAgICAgIGlmIChvbGRMZW5ndGggIT09IDAgJiYgbCAhPT0gb2xkTGVuZ3RoKSB7XHJcbiAgICAgICAgdGhpcy5tdWx0U2NhbGFyKGwgLyBvbGRMZW5ndGgpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGxlcnA6IGZ1bmN0aW9uICh2LCBhbHBoYSkge1xyXG4gICAgICB0aGlzLnggKz0gKHYueCAtIHRoaXMueCkgKiBhbHBoYTtcclxuICAgICAgdGhpcy55ICs9ICh2LnkgLSB0aGlzLnkpICogYWxwaGE7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGxlcnBWZWN0b3JzOiBmdW5jdGlvbiAodjEsIHYyLCBhbHBoYSkge1xyXG4gICAgICB0aGlzLnN1YlZlY3RvcnModjIsIHYxKS5tdWx0aXBseVNjYWxhcihhbHBoYSkuYWRkKHYxKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgZXF1YWxzOiBmdW5jdGlvbiAodikge1xyXG4gICAgICByZXR1cm4gKCh2LnggPT09IHRoaXMueCkgJiYgKHYueSA9PT0gdGhpcy55KSk7XHJcbiAgICB9LFxyXG4gICAgZnJvbUFycmF5OiBmdW5jdGlvbiAoYXJyYXksIG9mZnNldCkge1xyXG4gICAgICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIG9mZnNldCA9IDA7XHJcbiAgICAgIHRoaXMueCA9IGFycmF5WyBvZmZzZXQgXTtcclxuICAgICAgdGhpcy55ID0gYXJyYXlbIG9mZnNldCArIDEgXTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24gKGFycmF5LCBvZmZzZXQpIHtcclxuICAgICAgaWYgKGFycmF5ID09PSB1bmRlZmluZWQpIGFycmF5ID0gW107XHJcbiAgICAgIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkgb2Zmc2V0ID0gMDtcclxuICAgICAgYXJyYXlbIG9mZnNldCBdID0gdGhpcy54O1xyXG4gICAgICBhcnJheVsgb2Zmc2V0ICsgMSBdID0gdGhpcy55O1xyXG4gICAgICByZXR1cm4gYXJyYXk7XHJcbiAgICB9LFxyXG4gICAgZnJvbUF0dHJpYnV0ZTogZnVuY3Rpb24gKGF0dHJpYnV0ZSwgaW5kZXgsIG9mZnNldCkge1xyXG4gICAgICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIG9mZnNldCA9IDA7XHJcbiAgICAgIGluZGV4ID0gaW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemUgKyBvZmZzZXQ7XHJcbiAgICAgIHRoaXMueCA9IGF0dHJpYnV0ZS5hcnJheVsgaW5kZXggXTtcclxuICAgICAgdGhpcy55ID0gYXR0cmlidXRlLmFycmF5WyBpbmRleCArIDEgXTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gVmVjdG9yMjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cygpO1xyXG4iXX0=
