// Function is 0 outside the x range of the samples.  Samples
// should be ordered.
function PiecewiseLinearFunction(samples) {
  this.samples = samples;
}

PiecewiseLinearFunction.prototype.integrate = function() {
  var sum = 0.;
  var i;
  for (i = 0; i < this.samples.length - 1; i++) {
    var segment = (this.samples[i+1][0] - this.samples[i][0]) *
                  (this.samples[i+1][1] + this.samples[i][1]) / 2.;
    sum += segment;
  }
  return sum;
}

PiecewiseLinearFunction.prototype.min = function() {
  var min = this.samples[0][1];
  var i;
  for (i = 1; i < this.samples.length; i++) {
    if (this.samples[i][1] < min)
      min = this.samples[i][1];
  }
  return min;
}

PiecewiseLinearFunction.prototype.max = function() {
  var max = this.samples[0][1];
  var i;
  for (i = 1; i < this.samples.length; i++) {
    if (this.samples[i][1] > max)
      max = this.samples[i][1];
  }
  return max;
}

PiecewiseLinearFunction.prototype.scale = function(s) {
  var pts = [];
  var i;
  for (i = 0; i < this.samples.length; i++) {
    pts.push([this.samples[i][0], this.samples[i][1] * s]);
  }
  return new PiecewiseLinearFunction(pts);
}

// other is also a PiecewiseLinearFunction
PiecewiseLinearFunction.prototype.multiply = function(other) {
  var i = 0;
  var j = 0;
  // Walk iterators to start of domain of other function.
  while (i < this.samples.length && this.samples[i][0] < other.samples[0][0]) {
    i++;
  }
  while (j < other.samples.length && other.samples[j][0] < this.samples[0][0]) {
    j++;
  }
  // If domains do not overlap, return the 0 function.
  if (i == this.samples.length || j == other.samples.length) {
    return new PiecewiseLinearFunction([[0., 0.]]);
  }
  var fudge = 1.000001;
  // The x coordinates from samples of either function which lie in the domain
  // will be the x coordinates of the output samples.
  var outPts = [];
  while (i < this.samples.length && j < other.samples.length) {
    if (this.samples[i][0] * fudge < other.samples[j][0]) {
      var x = this.samples[i][0];
      var yi = this.samples[i][1];
      var a = (other.samples[j][0] - x) / (other.samples[j][0] - other.samples[j-1][0]);
      var yj = other.samples[j-1][1] * a + other.samples[j][1] * (1. - a);
      outPts.push([x, yi * yj]);
      i++;
    }
    else if (other.samples[j][0] * fudge < this.samples[i][0]) {
      var x = other.samples[j][0];
      var yj = other.samples[j][1];
      var a = (this.samples[i][0] - x) / (this.samples[i][0] - this.samples[i-1][0]);
      var yi = this.samples[i-1][1] * a + this.samples[i][1] * (1. - a);
      outPts.push([x, yi * yj]);
      j++;
    }
    else {
      var x = (this.samples[i][0] + other.samples[j][0]) / 2.;
      var y = this.samples[i][1] * other.samples[j][1];
      outPts.push([x, y]);
      i++;
      j++;
    }
  }
  return new PiecewiseLinearFunction(outPts);
}
