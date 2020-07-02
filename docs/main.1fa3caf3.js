parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"SMPM":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.Transformation=exports.Rectangle=exports.Basis=exports.Vector=void 0;class t{constructor(t,s){this.x=t,this.y=s}scale(s){return new t(this.x*s,this.y*s)}add(s){return new t(this.x+s.x,this.y+s.y)}subtract(s){return new t(this.x-s.x,this.y-s.y)}copy(){return new t(this.x,this.y)}dot(t){return this.x*t.x+this.y*t.y}norm(){return Math.sqrt(this.x*this.x+this.y*this.y)}round(){return new t(Math.round(this.x),Math.round(this.y))}}exports.Vector=t;class s{constructor(t,s){this.v=t,this.w=s}toCoefficients(s){let i=(this.w.x*s.y-this.w.y*s.x)/(this.w.x*this.v.y-this.w.y*this.v.x),e=(this.v.x*s.y-this.v.y*s.x)/(this.v.x*this.w.y-this.v.y*this.w.x);return new t(i,e)}fromCoefficients(t){return this.v.scale(t.x).add(this.w.scale(t.y))}scale(t){return new s(this.v.scale(t),this.w.scale(t))}}exports.Basis=s;class i{constructor(t,s){this.topLeft=t,this.bottomRight=s}corners(){return[this.topLeft,new t(this.topLeft.x,this.bottomRight.y),this.bottomRight,new t(this.bottomRight.x,this.topLeft.y)]}center(){return new t((this.topLeft.x+this.bottomRight.x)/2,(this.topLeft.y+this.bottomRight.y)/2)}translate(t){return new i(this.topLeft.add(t),this.bottomRight.add(t))}transform(t){return new i(t.transform(this.topLeft),t.transform(this.bottomRight))}overlaps(t){let s=this.topLeft.x<=t.bottomRight.x&&t.topLeft.x<=this.bottomRight.x,i=this.topLeft.y<=t.bottomRight.y&&t.topLeft.y<=this.bottomRight.y;return s&&i}width(){return this.bottomRight.x-this.topLeft.x}height(){return this.bottomRight.y-this.topLeft.y}}exports.Rectangle=i;class e{constructor(t,s){this.translation=t,this.scaling=s}transform(t){return t.scale(this.scaling).add(this.translation)}}exports.Transformation=e;
},{}],"xQ2u":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.generateCovering=void 0;const t=require("./typing");function e(e,o,l){function s(t){return e.translate(o.fromCoefficients(t)).overlaps(l)}const f=new t.Vector(0,0),x=r(f,s),u=n(f,s),a=new c(x,u);let y=[...a];for(const t of i(a,s,!0))y=y.concat([...t]);for(const t of i(a,s,!1))y=y.concat([...t]);return y}function o(e,o){let r=!(arguments.length>2&&void 0!==arguments[2])||arguments[2],n=e.copy();const c=r?1:-1;for(n.x+=c;o(n);)n.x+=c;return new t.Vector(n.x-c,n.y)}exports.generateCovering=e;const r=(t,e)=>o(t,e,!1),n=(t,e)=>o(t,e,!0);class c{constructor(t,e){if(t.y!==e.y)throw new Error("y values should be equal (".concat(t.y," != ").concat(e.y,")"));if(t.x>e.x)throw new Error("vectors should be ordered by x coordinate (".concat(t.x," > ").concat(e.x,")"));this.left=t,this.right=e}*[Symbol.iterator](){for(let e=this.left.x;e<=this.right.x;e++)yield new t.Vector(e,this.left.y)}}function*i(e,o){let i=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];function l(e){const l=e.left.y+(i?1:-1),s=new t.Vector(e.left.x,l),f=new t.Vector(e.right.x,l);let x=r(s,o),u=n(f,o);for(;!o(x)&&x.x<u.x;)x.x++;for(;!o(u)&&x.x<u.x;)u.x--;return o(x)?new c(x,u):null}let s=l(e);for(;null!==s;)yield s,s=l(s)}
},{"./typing":"SMPM"}],"RBS5":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.drawBackground=exports.joinDrawables=exports.withModifyTransformation=exports.withFill=exports.createTiling=void 0;const t=require("./typing"),e=require("./covering");function n(n,o,r){return(i,s)=>{let l=f(n,s),c=o.scale(s.scaling),u=r.center().subtract(l.boundingBox.center());const d=c.fromCoefficients(c.toCoefficients(u).round());l=f(l,new t.Transformation(d,1));for(const n of e.generateCovering(l.boundingBox,c,r)){const e=c.fromCoefficients(n);a(l.draw,new t.Transformation(e,1))(i)}}}function o(t,e){return(n,o)=>{n.beginPath(),t(n,o),e&&(n.fillStyle=e),n.fill()}}function r(t,e){return(n,o)=>t(n,e(o))}function i(t){return(e,n)=>{for(const o of t)o(e,n)}}function s(t){return(e,n)=>{e.fillStyle="white",e.fillRect(t.topLeft.x,t.topLeft.y,t.width(),t.height())}}function a(t,e){return function(n){n.save(),n.translate(e.translation.x,e.translation.y),n.scale(e.scaling,e.scaling),t(n),n.restore()}}function f(t,e){return{draw:a(t.draw,e),boundingBox:t.boundingBox.transform(e)}}function l(t,e){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:5,o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"blue";t.lineWidth=n,t.strokeStyle=o,t.rect(e.topLeft.x,e.topLeft.y,e.width(),e.height()),t.stroke()}exports.createTiling=n,exports.withFill=o,exports.withModifyTransformation=r,exports.joinDrawables=i,exports.drawBackground=s;
},{"./typing":"SMPM","./covering":"xQ2u"}],"hrqD":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.createLittleBirdPattern=void 0;const e=require("./typing"),t=require("./drawing"),n=Math.sqrt(3);function r(r){const i={black:"black",orange:"rgb(176, 93, 37)",green:"rgb(35, 98, 45)",blue:"rgb(81, 122, 184)"},l=["black","orange","green","blue"],c=t.createTiling(a,new e.Basis(new e.Vector(0,12),new e.Vector(2*n,0)),r),s=t.createTiling(o,new e.Basis(new e.Vector(-n,3),new e.Vector(8*n,0)),r);let w=[];for(let a=0;a<4;a++){let r=t.withFill(c,i[l[a]]);r=t.withModifyTransformation(r,t=>new e.Transformation(new e.Vector(t.translation.x+a*n*t.scaling,t.translation.y+3*a*t.scaling),t.scaling)),w.push(r);let o=t.withFill(s,i[l[a]]);o=t.withModifyTransformation(o,t=>new e.Transformation(new e.Vector(t.translation.x+2*a*n*t.scaling,t.translation.y),t.scaling)),w.push(o)}return t.joinDrawables([t.drawBackground(r),...w])}exports.createLittleBirdPattern=r;const a={draw:function(e){let t=n-1;e.moveTo(t,0),e.save();for(let n=0;n<6;n++)e.lineTo(t,0),e.lineTo(.5*t,.25*t),e.rotate(Math.PI/3);e.lineTo(t,0),e.restore()},boundingBox:new e.Rectangle(new e.Vector(-1,-1),new e.Vector(1,1))},o={draw:function(e){const t=n-1;e.save(),e.translate(0,2);for(let r=0;r<3;r++)e.moveTo(.5*t,t*n/2),e.arc(.5*n,1.5,1,4*Math.PI/3,3*Math.PI/2),e.arc(n/2,-.5,1,Math.PI/2,11/6*Math.PI,!0),e.arc(n/2,-1.5,1,Math.PI/6,2/3*Math.PI),e.lineTo(t,0),e.lineTo(.5*t,t*n/2),e.rotate(2/3*Math.PI);e.restore()},boundingBox:function(){let t=3*n/2;return new e.Rectangle(new e.Vector(-t,2-t),new e.Vector(t,t+2))}()};
},{"./typing":"SMPM","./drawing":"RBS5"}],"ZCfc":[function(require,module,exports) {
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});const e=require("./typing"),t=require("./littlebird"),n=document.querySelector("canvas");if(null!=n){const a=n.getContext("2d");if(null!=a){n.width=window.innerWidth,n.height=window.innerHeight;const i=new e.Rectangle(new e.Vector(0,0),new e.Vector(n.width,n.height));let s=t.createLittleBirdPattern(i),c=new e.Transformation(new e.Vector(600,400),40);s(a,c),r(document,a,s,c,i.center()),o(document,a,s,c)}}function r(e,t,n,r,o){e.addEventListener("keydown",e=>{switch(e.code){case"Minus":a(r,o,.98);break;case"Equal":a(r,o,1.02);break;case"ArrowRight":r.translation.x+=10;break;case"ArrowLeft":r.translation.x-=10;break;case"ArrowUp":r.translation.y-=10;break;case"ArrowDown":r.translation.y+=10}n(t,r)},!1)}function o(t,n,r,o){let i=0,s=0,c=!1;t.addEventListener("pointerdown",e=>{i=e.offsetX,s=e.offsetY,c=!0}),t.addEventListener("pointermove",e=>{c&&(o.translation.x+=e.offsetX-i,o.translation.y+=e.offsetY-s,r(n,o),i=e.offsetX,s=e.offsetY)}),t.addEventListener("pointerup",e=>{c&&(o.translation.x+=e.offsetX-i,o.translation.y+=e.offsetY-s,r(n,o),c=!1)}),t.addEventListener("wheel",t=>{if(0===t.deltaY)return;let i=t.deltaY>0?.98:1.02;a(o,new e.Vector(t.offsetX,t.offsetY),i),r(n,o)})}function a(e,t,n){e.scaling*=n,e.translation=e.translation.scale(n).subtract(t.scale(n-1))}
},{"./typing":"SMPM","./littlebird":"hrqD"}]},{},["ZCfc"], null)
//# sourceMappingURL=main.1fa3caf3.js.map