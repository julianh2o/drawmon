class MonsterTemplate extends Transform {
  constructor(image) {
    super();
    this.image = image;
    this.panels = [];
    this.activePart = null;
  }

  addPanel(panel) {
    panel.parent = this;
    this.panels.push(panel);
    return this;
  }

  selectPart(part) {
    this.activePart = part;
    for (let p of this.panels) {
      if (part === null) {
        //Show all
        p.active = false;
        p.showDrawing = true;

      } else {
        p.active = p.name === part;
        p.showDrawing = p.name === part;
      }
    }
  }

  render(ctx) {
    ctx.save();
    this.getAbsoluteTransform().applyToContext(ctx);

    seed(1);
    if (this.activePart) {
      ctx.globalAlpha = 0.4;
      this.image.render(ctx,-96,-35);
      ctx.globalAlpha = 1.0;
    }
    for (let p of this.panels) {
      p.render(ctx);
    }

    ctx.restore();
  }
}

class MonsterTemplatePanel extends Transform {
  constructor(name,topleft,bottomright) {
    super();
    this.name = name;
    this.topleft = topleft;
    this.bottomright = bottomright;
    this.active = false;

    this.drawing = new Drawing(this.getDimensions());
    this.drawing.transform.translate(this.topleft.x,this.topleft.y);
    this.drawing.parent = this;
  }

  getDimensions() {
    return Vector.subtract(this.bottomright,this.topleft);
  }

  getCenter() {
    return Vector.add(this.bottomright,this.topleft).divide(2);
  }

  render(ctx) {
    let dim = this.getDimensions();
    ctx.save();
    // ctx.strokeStyle = getRandomColor();
    // ctx.lineWidth = 1;
    // ctx.beginPath()
    // ctx.rect(this.topleft.x,this.topleft.y,dim.x,dim.y);
    // ctx.stroke();

    //We cover it with a semi-opaque cover
    if (this.active) {
      ctx.fillStyle = "rgba(0,0,0, 0.5)";
      let padding = 100;
      //Top shading
      ctx.fillRect(this.topleft.x-padding,this.topleft.y-padding,padding,padding);
      ctx.fillRect(this.topleft.x,this.topleft.y-padding,dim.x,padding);
      ctx.fillRect(this.bottomright.x,this.topleft.y-padding,padding,padding);

      //Sides
      ctx.fillRect(this.topleft.x-padding,this.topleft.y,padding,dim.y);
      ctx.fillRect(this.bottomright.x,this.topleft.y,padding,dim.y);

      //Bottom shading
      ctx.fillRect(this.topleft.x-padding,this.bottomright.y,padding,padding);
      ctx.fillRect(this.topleft.x,this.bottomright.y,dim.x,padding);
      ctx.fillRect(this.bottomright.x,this.bottomright.y,padding,padding);
    }

    if (this.showDrawing) this.drawing.render(ctx);

    // let c = Vector.add(this.bottomright,this.topleft).divide(2);
    // ctx.translate(c.x,c.y);
    // ctx.beginPath();
    // ctx.moveTo(0,-5)
    // ctx.lineTo(0,5);
    // ctx.stroke();
    // ctx.beginPath();
    // ctx.moveTo(-5,0)
    // ctx.lineTo(5,0);
    // ctx.stroke();
    ctx.restore();
  }
}
