class Transform {
  constructor(parent) {
    this.parent = parent || null;
    this.transform = new Matrix();
  }

  applyTransform(transform) {
    this.transform = this.transform.concat(transform);
  }

  getTransformCenteredOn(x,y) {
    if (y === undefined) {
      y = x.y;
      x = x.x;
    }

    let m = new Transform(this);
    m.transform.translate(x,y);
    return m;
  }

  getAbsoluteTransform() {
    let transforms = [];
    let o = this;
    while (o && o.transform) {
      transforms.push(o.transform);
      o = o.parent;
    }

    let transform = new Matrix();
    for (let t of transforms.reverse()) {
      transform = transform.concat(t);
    }
    return transform;
  }
}
