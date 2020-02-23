var randomSeed = 1;
function seed(n) {
  randomSeed = n;
}
function random() {
    var x = Math.sin(randomSeed++) * 10000;
    return x - Math.floor(x);
}

  // Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
  var rect = canvasDom.getBoundingClientRect();
  return new Vector(touchEvent.touches[0].clientX - rect.left,touchEvent.touches[0].clientY - rect.top);
}

// Get the position of the mouse relative to the canvas
function getMousePos(canvasDom, mouseEvent) {
  var rect = canvasDom.getBoundingClientRect();
  return new Vector(mouseEvent.clientX - rect.left, mouseEvent.clientY - rect.top);
}
