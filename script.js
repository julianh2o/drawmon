// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);
// We listen to the resize event
window.addEventListener('resize', () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

let mdx=0,mdy=0;
let pixelScale = 3;
var drawWidth = 255*pixelScale;
var drawHeight = 255*pixelScale;

class App {
  activatePart(part) {
    this.activePart = part;
    this.monster.selectPart(part);
  }

  getActivePanel() {
      return _.find(this.monster.panels,{"name":this.activePart});
  }

  updateButtonStates() {
    $.each($(".partSelector button"),(index,value) => {
      let $el = $(value);
      let name = $el.attr("name");
      let part = _.find(this.monster.panels,{"name":name});

      var edited = part.drawing.lines.length;
      var active = this.activePart === name;

      $el.attr("class",`btn btn-sm btn${active?"":"-outline"}-${edited?"primary":"secondary"}`);
    });

    $("#showAll").toggleClass("d-none",!this.getActivePanel());
    $("#save").toggleClass("d-none",!!this.getActivePanel());

    if (!this.getActivePanel()) {
      var image = this.canvas.toDataURL("image/png");
      $("#save").attr("href",image);
      $("#save").attr("download","monster.png");
    }
  }

  constructor(canvas) {
    this.canvas = canvas;
    this.viewport = new Transform();
    this.activePart = null;

    setInterval(this.updateButtonStates.bind(this),500);

    $(".partSelector button").click(((e) => this.activatePart($(e.target).attr("name"))));
    $("#showAll").click((e) => this.activatePart(null));
    $("#undo").click((e) => this.getActivePanel().drawing.undo());
    $.each($(".colorSelect"),(index,el) => {
      let color = $(el).data("color");
      if (!$(el).attr("style")) $(el).css("color",color);
      $(el).click(() => this.getActivePanel().drawing.setColor(color));
    });

    this.monster = new MonsterTemplate(new Image("figure.png"));
    this.monster.parent = this.viewport;
    let def = {
      "head":[-50,-100,50,15],
      "arm_l":[-100,15,-30,120],
      "torso":[-30,15,30,120],
      "arm_r":[30,15,100,120],
      "legs":[-50,120,50,220],
    };

    for (let k of Object.keys(def)) {
      let v = def[k];
      this.monster.addPanel(new MonsterTemplatePanel(k,new Vector(v[0],v[1]),new Vector(v[2],v[3])));
    }

    this.activatePart("head");

    canvas.addEventListener("mousedown", function (e) {
      this.getActivePanel().drawing.startLine();
    }.bind(this), false);
    canvas.addEventListener("mouseup", function (e) {
      this.getActivePanel().drawing.stopLine();
      // // if (this.drawing.isDrawing()) this.drawing.addPoint(getMousePos(canvas, e));
      // let s = this.drawing.serialize();
      // console.log(s,s.length);
      // console.log(JSON.stringify(_.flatten(_.map(this.drawing.lines[0].points,(v) => [v.x,v.y]))));
    }.bind(this), false);
    canvas.addEventListener("mousemove", function (e) {
      let pos = getMousePos(canvas,e);
      // let monsterRelative = this.canvas.ctx.matrix.inverse().applyToPoint(pos.x,pos.y);
      if (this.getActivePanel().drawing.isDrawing()) this.getActivePanel().drawing.addPoint(pos);
    }.bind(this), false);
  }

  render(ctx) {
    ctx.resetTransform();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let center = new Vector(this.canvas.width / 2, this.canvas.height / 2);

    //Focus the viewport on the part in question
    this.viewport.transform.reset();
    let active = _.find(this.monster.panels,{"name":this.activePart});
    if (active) {

      let dim = Vector.subtract(active.bottomright,active.topleft);
      let partAspect = dim.x / dim.y;
      let canvasAspect = this.canvas.width / this.canvas.height;

      let scaleToWidth = this.canvas.width / dim.x;
      let scaleToHeight = this.canvas.height / dim.y;
      let scale = Math.min(scaleToWidth,scaleToHeight);

      this.viewport.transform.scaleU(scale*.95);
      let offset = active.getTransformCenteredOn(active.getCenter()).getAbsoluteTransform().inverse().applyToPoint(center.x,center.y)
      this.viewport.transform.translate(offset.x,offset.y);
    } else {
      this.viewport.transform.scaleU(2);
      active = _.find(this.monster.panels,{"name":"torso"});
      let offset = active.getTransformCenteredOn(active.getCenter()).getAbsoluteTransform().inverse().applyToPoint(center.x,center.y)
      this.viewport.transform.translate(offset.x,offset.y);
    }

    this.monster.render(ctx);

    // ctx.strokeStyle = "#222222";
    // ctx.lineWidth = 3;
    // ctx.beginPath();
    // ctx.rect(0, 0, 255*pixelScale, 255*pixelScale);
    // ctx.stroke();

    // ctx.save();
    // ctx.resetTransform();
    // ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    // drawAxis(ctx,20);
    // ctx.restore();
  }
}

$(document).ready(function() {
  let $canvas = $("canvas");
  let canvas = $canvas.get(0);
  resizeCanvas(canvas);
  let ctx = canvas.getContext("2d");

  let app = new App(canvas);

  // Set up touch events for mobile, et
  canvas.addEventListener("touchstart", function (e) {
    mousePos = getTouchPos(canvas, e);
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, false);
  canvas.addEventListener("touchend", function (e) {
    var mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
  }, false);
  canvas.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    e.preventDefault();
    canvas.dispatchEvent(mouseEvent);
  }, false);

  // Allow for animation
  (function drawLoop () {
    requestAnimFrame(drawLoop);
    app.render(ctx);
  })();
  // $("#debug").click(() => app.render(ctx));
  // setTimeout(() => app.render(ctx),500); //Delay for picture loading
});
