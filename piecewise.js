function clone(object) {
  function F(){}
  F.prototype = object;
  return new F();
}

// Function is 0 outside the x range of the sample points.
function PiecewiseLinearFunction(points) {
  this.points = points;
}

PiecewiseLinearFunction.prototype.integrate = function() {
  var sum = 0.;
  var i;
  for (i = 0; i < this.points.length - 1; i++) {
    var segment = (this.points[i+1][0] - this.points[i][0]) *
                  (this.points[i+1][1] + this.points[i][1]) / 2.;
    sum += segment;
  }
  return sum;
}

PiecewiseLinearFunction.prototype.scale = function(s) {
  var pts = [];
  var i;
  for (i = 0; i < this.points.length; i++) {
    pts.push([this.points[i][0], this.points[i][1] * s]);
  }
  return new PiecewiseLinearFunction(pts);
}

// other is a PiecewiseLinearFunction
PiecewiseLinearFunction.prototype.multiply = function(other) {
  var i = 0;
  var j = 0;
  // Walk iterators to start of domain of other function.
  while (i < this.points.length && this.points[i][0] < other.points[0][0]) {
    i++;
  }
  while (j < other.points.length && other.points[j][0] < this.points[0][0]) {
    j++;
  }
  // If domains do not overlap, return the 0 function.
  if (i == this.points.length || j == other.points.length) {
    return new PiecewiseLinearFunction([[0., 0.]]);
  }
  //var minX = Math.max(this.points[0][0], other.points[0][0]);
  //var maxX = Math.min(this.points[this.points.length - 1][0], other.points[other.points.length - 1][0]);
  //var x = minX - 1.;
  var fudge = 1.000001;
  // The x coordinates from samples of either function which lie in the domain
  // will be the x coordinates of the output samples.
  var outPts = [];
  //while (x * fudge < maxX) {
  while (i < this.points.length && j < other.points.length) {
    if (this.points[i][0] * fudge < other.points[j][0]) {
      var x = this.points[i][0];
      var yi = this.points[i][1];
      var a = (other.points[j][0] - x) / (other.points[j][0] - other.points[j-1][0]);
      var yj = other.points[j-1][1] * a + other.points[j][1] * (1. - a);
      outPts.push([x, yi * yj]);
      i++;
    }
    else if (other.points[j][0] * fudge < this.points[i][0]) {
      var x = other.points[j][0];
      var yj = other.points[j][1];
      var a = (this.points[i][0] - x) / (this.points[i][0] - this.points[i-1][0]);
      var yi = this.points[i-1][1] * a + this.points[i][1] * (1. - a);
      outPts.push([x, yi * yj]);
      j++;
    }
    else {
      var x = (this.points[i][0] + other.points[j][0]) / 2.;
      var y = this.points[i][1] * other.points[j][1];
      outPts.push([x, y]);
      i++;
      j++;
    }
  }
  return new PiecewiseLinearFunction(outPts);
}

function PeriodicPiecewiseLinearFunction(period, points) {
  this.points = points;
  this.period = period;
}

// plf is a PiecewiseLinearFunction
PeriodicPiecewiseLinearFunction.prototype.multiply = function(plf) {
  // Create a piecewise linear function of finite support by copying enough
  // periods of this function to cover the domain of plf. Multiply the
  // result with plf.
  var p = 0;
  while (plf.points[0][0] < this.points[0][0] + p * this.period) {
    p--;
  }
  while (this.points[0][0] + (p + 1) * this.period < plf.points[0][0]) {
    p++;
  }
  var pts = [];
  for (; this.points[0][0] + p * this.period < plf.points[plf.points.length - 1][0]; p++) {
    var i;
    for (i = 0; i < this.points.length; i++) {
      pts.push([this.points[i][0] + p * this.period, this.points[i][1]]);
    }
  }
  var repeated = new PiecewiseLinearFunction(pts);
  return plf.multiply(repeated);
}
