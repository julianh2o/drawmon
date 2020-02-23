class Drawing extends Transform {
  constructor(dimensions) {
    super();
    this.lines = [];
    this.dimensions = dimensions;
    this.currentLine = null;
    this.color = "#000";
    this.thickness = 4;
  }

  startLine() {
    this.currentLine = new PolyLine(this.color,this.thickness);
    this.lines.push(this.currentLine);
  }

  undo() {
    this.lines.pop();
  }

  setColor(color) {
    this.color = color;
  }

  setThickness(thickness) {
    this.thickness = thickness;
  }

  stopLine() {
    // this.currentLine.simplify(pixelScale,7,true);
    this.currentLine = null;
  }

  isDrawing() {
    return !! this.currentLine;
  }

  addPoint(absolute) {
    let rel = this.getAbsoluteTransform().inverse().applyToPoint(absolute.x,absolute.y);
    let v = new Vector(rel.x / (this.dimensions.x / 255),rel.y / (this.dimensions.y / 255));

    if (!this.currentLine) throw new Error("No active line, start a new line first!");
    this.currentLine.addPoint(v);

    // if (this.currentLine.points.length >= 255) {
    //   let thickness = this.currentLine.thickness;
    //   this.stopLine();
    //   this.startLine(thickness);
    //   this.addPoint(absolute)
    // }
  }

  getCount() {
    let count = 0;
    for (let l of this.lines) {
      count += l.points.length;
    }
    return count;
  }

  render(ctx) {
    ctx.save();
    this.getAbsoluteTransform().applyToContext(ctx);
    for (let l of this.lines) {
      ctx.save();
      ctx.scale(this.dimensions.x / 255, this.dimensions.y / 255);
      l.render(ctx);
      ctx.restore();
    }
    ctx.restore();
  }

  serialize() {
    let vals = [];
    for (let l of this.lines) {
      vals.push(l.serialize(pixelScale));
    }
    vals = _.flatten(vals);
    let byte_string = "";
    for (let b of vals) {
      if (b > 255) {
        console.log("error byte out of range: "+b);
      } else {
        byte_string += String.fromCharCode(b);
      }
    }
    return btoa(byte_string);
  }
}

class PolyLine {
  // thickness;
  // points;
  constructor(color, thickness, /*Vector[]*/points) {
    this.color = color;
    this.thickness = thickness;
    this.points = points || [];
  }

  addPoint(v) {
    this.points.push(v);
  }

  simplify(pixelScale,resolution,usePoints) {
    let points = [];
    let d = 0;
    let lv = null;
    for (let v of this.points) {
      v.x = Math.round(v.x / pixelScale) * pixelScale;
      v.y = Math.round(v.y / pixelScale) * pixelScale;
      if (v === this.points[0] || v === this.points[this.points.length - 1]) {
        points.push(v);
      } else if (usePoints) {
        d++;
        if (d >= resolution) {
          d = 0;
          points.push(v);
        }
      } else if (lv) {
        //Accumulate the length of the line
        d += Vector.subtract(lv,v).length();
        if (d > resolution) {
          points.push(v);
          d = 0;
        }
      }
      lv = v;
    }
    console.log(`Simplified line from ${this.points.length} points to ${points.length}`);
    this.points = points;
  }

  //Renders a line with curved sections
  renderCurved(ctx) {
    if (this.points.length < 3) return;
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    let i;
    for (i = 1; i < this.points.length - 2; i ++) {
      let xc = (this.points[i].x + this.points[i + 1].x) / 2;
      let yc = (this.points[i].y + this.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
    }
    // curve through the last two points
    ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, this.points[i+1].x,this.points[i+1].y);
    ctx.stroke();
  }

  renderStraight(ctx) {
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    for (let v of this.points) {
      if (v === this.points[0]) {
        ctx.moveTo(v.x,v.y);
      } else {
        ctx.lineTo(v.x, v.y);
      }
    }
    ctx.stroke();
  }

  render(ctx) {
    ctx.strokeStyle = this.color;
    this.renderStraight(ctx);
  }

  serialize(pixelScale) {
    var vals = [this.thickness,this.points.length];
    for (let v of this.points) {
      vals.push(v.x/pixelScale,v.y/pixelScale);
    }
    return vals;
  }
}


function resizeCanvas(canvas) {
  var rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  console.log("Canvas resized: ",rect.width,rect.height);
}


  //Polyfil for requestAnimFrame
  // Get a regular interval for drawing to the screen
  window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimaitonFrame ||
    function (callback) {
      window.setTimeout(callback, 1000/60);
    };
  })();

/**
 * https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(random() * 16)];
  }
  return color;
}

function drawAxis(ctx,sep) {
  let extent = 1000;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0,-extent);
  ctx.lineTo(0,extent);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-extent,0);
  ctx.lineTo(extent,0);
  ctx.stroke();

  for (let i = 0; i<extent; i+=sep) {
    // -x
    ctx.beginPath();
    ctx.moveTo(-i,5);
    ctx.lineTo(-i,-5);
    ctx.stroke();

    // +x
    ctx.beginPath();
    ctx.moveTo(i,5);
    ctx.lineTo(i,-5);
    ctx.stroke();

    // -y
    ctx.beginPath();
    ctx.moveTo(5,-i);
    ctx.lineTo(-5,-i);
    ctx.stroke();

    // -y
    ctx.beginPath();
    ctx.moveTo(5,i);
    ctx.lineTo(-5,i);
    ctx.stroke();
  }
}

function loadImage(path) {
  let $img = $("<img />",{"src":path});
  $img.hide();
  $(document.body).append($img);
  return new Promise(function(resolve,reject) {
    $img.on("load",function() {
      resolve($img.get(0));
    });
  });
}

class Image {
  constructor(path) {
    loadImage(path).then((img) => {
      this.img = img;
    });
  }
  render(ctx,x,y) {
    if (this.img) ctx.drawImage(this.img,x,y);
  }
}

function createCircle(r,segments) {
  let c = new PolyLine(2);
  segments = segments || 20;
  let d = 2*Math.PI / segments;
  for (let i=0; i<2*Math.PI; i+=d) {
    c.addPoint(new Vector(r*Math.sin(i),r*Math.cos(i)));
  }
  return c;
}

function createPoints(arr) {
  let p = new PolyLine(2);
  for (let i=0; i<arr.length; i+=2) {
    p.addPoint(new Vector(arr[i],arr[i+1]))
  }
  return p;
}

function translate(x,y,/*PolyLine*/l) {
  let offset = new Vector(x,y);
  return new PolyLine(l.thickness,_.map(l.points,(v) => Vector.add(v,offset)));
}

function reflect(x,y,alsoReverse,/*PolyLine*/l) {
  let nline = new PolyLine(l.thickness,_.map(l.points,(v) => {
    let vx = v.x;
    let vy = v.y;
    if (x !== undefined && x !== null) vx = -(vx - x) + x;
    if (y !== undefined && y !== null) vy = -(vy - y) + y;
    console.log(v.x,v.y,vx,vy);
    return new Vector(vx,vy);
  }));
  if (alsoReverse) nline.points = nline.points.reverse();
  return nline;
}

function join(/*PolyLine*/a,/*PolyLine*/b) {
  return new PolyLine(a.thickness,[...a.points,...b.points]);
}
