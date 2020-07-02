// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"typing.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transformation = exports.Rectangle = exports.Basis = exports.Vector = void 0;

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  scale(alpha) {
    return new Vector(this.x * alpha, this.y * alpha);
  }

  add(vector) {
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  subtract(vector) {
    return new Vector(this.x - vector.x, this.y - vector.y);
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  round() {
    return new Vector(Math.round(this.x), Math.round(this.y));
  }

}

exports.Vector = Vector;

class Basis {
  constructor(v, w) {
    this.v = v;
    this.w = w;
  }
  /**
   * Return coefficients when expressing 2D vector as weighted sum of basis vectors.
   * From:
   * https://math.stackexchange.com/questions/148199/equation-for-non-orthogonal-projection-of-a-point-onto-two-vectors-representing
   * alpha = (z-component of w cross z) / (z-component of w cross v)
   * beta = (z-component of v cross z) / (z-component of v cross w)
   * @param z Arbitrary 2D vector
   */


  toCoefficients(z) {
    let alpha = (this.w.x * z.y - this.w.y * z.x) / (this.w.x * this.v.y - this.w.y * this.v.x);
    let beta = (this.v.x * z.y - this.v.y * z.x) / (this.v.x * this.w.y - this.v.y * this.w.x);
    return new Vector(alpha, beta);
  }
  /**
   * Return weighted sum of basis vectors
   * @param z weights / coefficients (often integer)
   */


  fromCoefficients(z) {
    return this.v.scale(z.x).add(this.w.scale(z.y));
  }

  scale(t) {
    return new Basis(this.v.scale(t), this.w.scale(t));
  }

}

exports.Basis = Basis;

class Rectangle {
  constructor(topLeft, bottomRight) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
  }

  corners() {
    return [this.topLeft, new Vector(this.topLeft.x, this.bottomRight.y), this.bottomRight, new Vector(this.bottomRight.x, this.topLeft.y)];
  }

  center() {
    return new Vector((this.topLeft.x + this.bottomRight.x) / 2, (this.topLeft.y + this.bottomRight.y) / 2);
  }

  translate(v) {
    return new Rectangle(this.topLeft.add(v), this.bottomRight.add(v));
  }

  transform(transformation) {
    return new Rectangle(transformation.transform(this.topLeft), transformation.transform(this.bottomRight));
  }
  /**
   * Return true if another rectangle overlaps with this one.
   * @param r Another rectangle
   */


  overlaps(r) {
    let overlapsX = this.topLeft.x <= r.bottomRight.x && r.topLeft.x <= this.bottomRight.x;
    let overlapsY = this.topLeft.y <= r.bottomRight.y && r.topLeft.y <= this.bottomRight.y;
    return overlapsX && overlapsY;
  }

  width() {
    return this.bottomRight.x - this.topLeft.x;
  }

  height() {
    return this.bottomRight.y - this.topLeft.y;
  }

}

exports.Rectangle = Rectangle;

class Transformation {
  constructor(translation, scaling) {
    this.translation = translation;
    this.scaling = scaling;
  }

  transform(v) {
    return v.scale(this.scaling).add(this.translation);
  }

}

exports.Transformation = Transformation;
},{}],"covering.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateCovering = void 0;

const typing_1 = require("./typing");
/**
 * Return coefficients in basis for all vectors by which to shift boundingBox to cover canvas.
 */


function generateCovering(boundingBox, basis, canvas) {
  function translatedBoundingBoxOverlapsCanvas(coefficients) {
    return boundingBox.translate(basis.fromCoefficients(coefficients)).overlaps(canvas);
  }

  const origin = new typing_1.Vector(0, 0);
  const leftMost = searchLeft(origin, translatedBoundingBoxOverlapsCanvas);
  const rightMost = searchRight(origin, translatedBoundingBoxOverlapsCanvas);
  const centerRange = new HorizontalRange(leftMost, rightMost);
  let coefficients = [...centerRange];

  for (const horizontalRange of createSearchVertical(centerRange, translatedBoundingBoxOverlapsCanvas, true)) {
    coefficients = coefficients.concat([...horizontalRange]);
  }

  for (const horizontalRange of createSearchVertical(centerRange, translatedBoundingBoxOverlapsCanvas, false)) {
    coefficients = coefficients.concat([...horizontalRange]);
  }

  return coefficients;
}

exports.generateCovering = generateCovering;

function searchHorizontal(initial, valid) {
  let ascending = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  let v = initial.copy();
  const dx = ascending ? 1 : -1;
  v.x += dx;

  while (valid(v)) {
    v.x += dx;
  }

  return new typing_1.Vector(v.x - dx, v.y);
}

const searchLeft = (initial, valid) => searchHorizontal(initial, valid, false);

const searchRight = (initial, valid) => searchHorizontal(initial, valid, true);

class HorizontalRange {
  constructor(left, right) {
    if (left.y !== right.y) {
      throw new Error("y values should be equal (".concat(left.y, " != ").concat(right.y, ")"));
    }

    if (left.x > right.x) {
      throw new Error("vectors should be ordered by x coordinate (".concat(left.x, " > ").concat(right.x, ")"));
    }

    this.left = left;
    this.right = right;
  }

  *[Symbol.iterator]() {
    for (let x = this.left.x; x <= this.right.x; x++) {
      yield new typing_1.Vector(x, this.left.y);
    }
  }

}

function* createSearchVertical(initial, valid) {
  let ascending = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  function searchVertical(current) {
    const y = current.left.y + (ascending ? 1 : -1);
    const left = new typing_1.Vector(current.left.x, y);
    const right = new typing_1.Vector(current.right.x, y);
    let leftMost = searchLeft(left, valid);
    let rightMost = searchRight(right, valid);

    while (!valid(leftMost) && leftMost.x < rightMost.x) {
      leftMost.x++;
    }

    while (!valid(rightMost) && leftMost.x < rightMost.x) {
      rightMost.x--;
    }

    if (valid(leftMost)) {
      return new HorizontalRange(leftMost, rightMost);
    } else {
      return null;
    }
  }

  let horizontalRange = searchVertical(initial);

  while (horizontalRange !== null) {
    yield horizontalRange;
    horizontalRange = searchVertical(horizontalRange);
  }
}
},{"./typing":"typing.ts"}],"drawing.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.drawBackground = exports.joinDrawables = exports.withModifyTransformation = exports.withFill = exports.createTiling = void 0;

const typing_1 = require("./typing");

const covering_1 = require("./covering");
/**
 * Unit repeated across a 2D grid.
 */


function createTiling(unitOriginal, basisOriginal, canvas) {
  return (ctx, transformation) => {
    let unit = transformUnit(unitOriginal, transformation);
    let basis = basisOriginal.scale(transformation.scaling); // Translate unit by vector in span of basis to move bounding box close to canvas center.

    let difference = canvas.center().subtract(unit.boundingBox.center());
    const roundedDifference = basis.fromCoefficients(basis.toCoefficients(difference).round());
    unit = transformUnit(unit, new typing_1.Transformation(roundedDifference, 1));
    let debug = false;

    if (debug) {
      drawRectangle(ctx, unit.boundingBox);
    }

    for (const coefficients of covering_1.generateCovering(unit.boundingBox, basis, canvas)) {
      const t = basis.fromCoefficients(coefficients);
      transformDraw(unit.draw, new typing_1.Transformation(t, 1))(ctx);
    }
  };
}

exports.createTiling = createTiling;

function withFill(draw, fillStyle) {
  return (ctx, transformation) => {
    ctx.beginPath();
    draw(ctx, transformation);

    if (fillStyle) {
      ctx.fillStyle = fillStyle;
    }

    ctx.fill();
  };
}

exports.withFill = withFill;

function withModifyTransformation(draw, modifyTransformation) {
  return (ctx, transformation) => draw(ctx, modifyTransformation(transformation));
}

exports.withModifyTransformation = withModifyTransformation;

function joinDrawables(drawables) {
  return (ctx, transformation) => {
    for (const drawable of drawables) {
      drawable(ctx, transformation);
    }
  };
}

exports.joinDrawables = joinDrawables;

function drawBackground(canvas) {
  return (ctx, _) => {
    ctx.fillStyle = "white";
    ctx.fillRect(canvas.topLeft.x, canvas.topLeft.y, canvas.width(), canvas.height());
  };
}

exports.drawBackground = drawBackground;

function transformDraw(draw, transformation) {
  return function (ctx) {
    ctx.save();
    ctx.translate(transformation.translation.x, transformation.translation.y);
    ctx.scale(transformation.scaling, transformation.scaling);
    draw(ctx);
    ctx.restore();
  };
}

function transformUnit(unit, transformation) {
  return {
    draw: transformDraw(unit.draw, transformation),
    boundingBox: unit.boundingBox.transform(transformation)
  };
}

function drawRectangle(ctx, rectangle) {
  let lineWidth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;
  let strokeStyle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "blue";
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.rect(rectangle.topLeft.x, rectangle.topLeft.y, rectangle.width(), rectangle.height());
  ctx.stroke();
}
},{"./typing":"typing.ts","./covering":"covering.ts"}],"littlebird.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLittleBirdPattern = void 0;

const typing_1 = require("./typing");

const drawing_1 = require("./drawing");

const sqrt3 = Math.sqrt(3);

function createLittleBirdPattern(canvas) {
  const colours = {
    "black": "black",
    "orange": "rgb(176, 93, 37)",
    "green": "rgb(35, 98, 45)",
    "blue": "rgb(81, 122, 184)"
  };
  const colour_order = ["black", "orange", "green", "blue"];
  const starTilingReference = drawing_1.createTiling(littleBirdStar, new typing_1.Basis(new typing_1.Vector(0, 12), new typing_1.Vector(2 * sqrt3, 0)), canvas);
  const wingTilingReference = drawing_1.createTiling(littleBirdWing, new typing_1.Basis(new typing_1.Vector(-sqrt3, 3), new typing_1.Vector(8 * sqrt3, 0)), canvas);
  let tilings = [];

  for (let i = 0; i < 4; i++) {
    let starTiling = drawing_1.withFill(starTilingReference, colours[colour_order[i]]);
    starTiling = drawing_1.withModifyTransformation(starTiling, t => new typing_1.Transformation(new typing_1.Vector(t.translation.x + i * sqrt3 * t.scaling, t.translation.y + 3 * i * t.scaling), t.scaling));
    tilings.push(starTiling);
    let wingTiling = drawing_1.withFill(wingTilingReference, colours[colour_order[i]]);
    wingTiling = drawing_1.withModifyTransformation(wingTiling, t => new typing_1.Transformation(new typing_1.Vector(t.translation.x + i * 2 * sqrt3 * t.scaling, t.translation.y), t.scaling));
    tilings.push(wingTiling);
  }

  return drawing_1.joinDrawables([drawing_1.drawBackground(canvas), ...tilings]);
}

exports.createLittleBirdPattern = createLittleBirdPattern;
const littleBirdStar = {
  draw: function draw(ctx) {
    let r = sqrt3 - 1;
    ctx.moveTo(r, 0);
    ctx.save();

    for (let i = 0; i < 6; i++) {
      ctx.lineTo(r, 0);
      ctx.lineTo(0.5 * r, 0.25 * r);
      ctx.rotate(Math.PI / 3);
    }

    ctx.lineTo(r, 0);
    ctx.restore();
  },
  boundingBox: new typing_1.Rectangle(new typing_1.Vector(-1, -1), new typing_1.Vector(1, 1))
};
const littleBirdWing = {
  draw: function draw(ctx) {
    const r = sqrt3 - 1;
    ctx.save();
    ctx.translate(0, 2);

    for (let i = 0; i < 3; i++) {
      ctx.moveTo(0.5 * r, r * sqrt3 / 2);
      ctx.arc(0.5 * sqrt3, 1.5, 1, 4 * Math.PI / 3, 3 * Math.PI / 2);
      ctx.arc(sqrt3 / 2, -0.5, 1, Math.PI / 2, 11 / 6 * Math.PI, true);
      ctx.arc(sqrt3 / 2, -1.5, 1, Math.PI / 6, 2 / 3 * Math.PI);
      ctx.lineTo(r, 0);
      ctx.lineTo(0.5 * r, r * sqrt3 / 2);
      ctx.rotate(2 / 3 * Math.PI);
    }

    ctx.restore();
  },
  boundingBox: function () {
    let r = 3 * sqrt3 / 2;
    return new typing_1.Rectangle(new typing_1.Vector(-r, -r + 2), new typing_1.Vector(r, r + 2));
  }()
};
},{"./typing":"typing.ts","./drawing":"drawing.ts"}],"main.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const typing_1 = require("./typing");

const littlebird_1 = require("./littlebird");

const canvas = document.querySelector('canvas');

if (canvas != null) {
  const ctx = canvas.getContext('2d');

  if (ctx != null) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const canvasRectangle = new typing_1.Rectangle(new typing_1.Vector(0, 0), new typing_1.Vector(canvas.width, canvas.height));
    let pattern = littlebird_1.createLittleBirdPattern(canvasRectangle);
    let transformation = new typing_1.Transformation(new typing_1.Vector(600, 400), 40);
    pattern(ctx, transformation);
    addEventListenersKeyboard(document, ctx, pattern, transformation, canvasRectangle.center());
    addEventListenersMouse(document, ctx, pattern, transformation);
  }
}

function addEventListenersKeyboard(document, ctx, pattern, transformation, canvasCenter) {
  document.addEventListener('keydown', event => {
    let shiftSpeed = 10;

    switch (event.code) {
      case 'Minus':
        zoom(transformation, canvasCenter, 0.98);
        break;

      case 'Equal':
        zoom(transformation, canvasCenter, 1.02);
        break;

      case 'ArrowRight':
        transformation.translation.x += shiftSpeed;
        break;

      case 'ArrowLeft':
        transformation.translation.x -= shiftSpeed;
        break;

      case 'ArrowUp':
        transformation.translation.y -= shiftSpeed;
        break;

      case 'ArrowDown':
        transformation.translation.y += shiftSpeed;
        break;
    }

    pattern(ctx, transformation);
  }, false);
}

function addEventListenersMouse(document, ctx, pattern, transformation) {
  let mouseX = 0;
  let mouseY = 0;
  let mouseDown = false;
  document.addEventListener('mousedown', e => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
    mouseDown = true;
  });
  document.addEventListener('mousemove', e => {
    if (mouseDown) {
      transformation.translation.x += e.offsetX - mouseX;
      transformation.translation.y += e.offsetY - mouseY;
      pattern(ctx, transformation);
      mouseX = e.offsetX;
      mouseY = e.offsetY;
    }
  });
  document.addEventListener('mouseup', e => {
    if (mouseDown) {
      transformation.translation.x += e.offsetX - mouseX;
      transformation.translation.y += e.offsetY - mouseY;
      pattern(ctx, transformation);
      mouseDown = false;
    }
  });
  document.addEventListener('wheel', e => {
    if (e.deltaY === 0) {
      return;
    }

    let factor = e.deltaY > 0 ? 0.98 : 1.02;
    zoom(transformation, new typing_1.Vector(e.offsetX, e.offsetY), factor);
    pattern(ctx, transformation);
  });
}

function zoom(transformation, center, ratio) {
  transformation.scaling *= ratio;
  transformation.translation = transformation.translation.scale(ratio).subtract(center.scale(ratio - 1));
}
},{"./typing":"typing.ts","./littlebird":"littlebird.ts"}],"../../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "38405" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","main.ts"], null)
//# sourceMappingURL=/main.c39d6dcf.js.map