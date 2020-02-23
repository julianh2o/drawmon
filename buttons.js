const BUTTON_HEIGHT = 30;
const BUTTON_PADDING = 5;
class Button extends Transform {
  constructor(text,f) {
    super();
    this.text = text;
    this.f = f;
  }

  addListeners(canvas) {
    canvas.addEventListener("mousedown", function (e) {
      let pos = getMousePos(canvas,e);
      if (this.isHit(pos)) {
        this.buttonDown = true;
      }
    }.bind(this), false);

    canvas.addEventListener("mouseup", function (e) {
      let pos = getMousePos(canvas,e);
      if (this.buttonDown && this.isHit(pos)) {
        this.f();
      }
      this.buttonDown = false;
    }.bind(this), false);

    canvas.addEventListener("mousemove", function (e) {
      let pos = getMousePos(canvas,e);
      this.buttonOver = this.isHit(pos);
    }.bind(this), false);
  }

  isHit(pos) {
    let tpoint = this.getAbsoluteTransform().inverse().applyToPoint(pos.x,pos.y);
    if (tpoint.x < 0 || tpoint.x > this.buttonWidth) return false;
    if (tpoint.y < 0 || tpoint.y > BUTTON_HEIGHT) return false;

    return true;
  }

  render(ctx) {
    ctx.save();
    this.getAbsoluteTransform().applyToContext(ctx);

    let buttonHighlight = this.buttonOver && this.buttonDown;
    ctx.font = '900 24px serif';
    let metrics = ctx.measureText(this.text);

    ctx.strokeStyle = "#00f";
    ctx.fillStyle = "#00f";
    ctx.lineWidth = 1;
    this.buttonWidth = metrics.width + 2*BUTTON_PADDING;
    roundRect(ctx, 0, 0, this.buttonWidth, BUTTON_HEIGHT, 10, buttonHighlight, true);

    ctx.fillStyle = buttonHighlight ? "#fff" : "#000";
    ctx.fillText(this.text, BUTTON_PADDING, BUTTON_PADDING + metrics.actualBoundingBoxAscent);

    ctx.restore();
  }
}

class ButtonPanel extends Transform {
  constructor() {
    super();
    this.buttons = [];
  }

  addListeners(canvas) {
    for (let button of this.buttons) {
      button.addListeners(canvas);
    }
  }

  addButton(text,f) {
    let button = new Button(text,f)
    button.parent = this;
    this.buttons.push(button);
  }

  render(ctx) {
    for (let button of this.buttons) {
      button.render(ctx);
    }
  }
}
