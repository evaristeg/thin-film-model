var generateFilter = function(thicknessNm, contribRatio) {
  var front = contribRatio / (1. + contribRatio);
  var back = 1. / (1. + contribRatio);
  var wavelen;
  var samples = [];
  for (wavelen = 370; wavelen <= 760; wavelen += 2) {
    var phase = 4. * Math.PI * thicknessNm / wavelen;
    var x = back * Math.cos(phase) - front;
    var y = back * Math.sin(phase);
    samples.push([wavelen, x*x + y*y]);
  }
  return new PiecewiseLinearFunction(samples);
}

var paintInterference = function(canvasId, illuminant, ratio, start, end) {
  var canv = document.getElementById(canvasId);
  var ctx = canv.getContext("2d");
  ctx.rect(0, 0, canv.width, canv.height);

  var carr = [];
  var sqrtDist = Math.sqrt(end) - Math.sqrt(start);
  var i, j;
  var lo = 0, hi = 0;
  for (i = 0; i < canv.width; i++) {
    var d = Math.pow(Math.sqrt(start) + sqrtDist * (i + 0.5) / canv.width, 2);
    var filt = generateFilter(d, ratio);
    var c = cie1931observer.spectrumToXyz(illuminant.multiply(filt));
    c = colorspace.XYZ_to_srgb_linear_clamp(c);
    for (j = 0; j < 3; j++) {
      if (c[j] < lo) lo = c[j];
      if (c[j] > hi) hi = c[j];
    }
    carr.push(c);
  }
  for (i = 0; i < canv.width; i++) {
    var c = carr[i];
    for (j = 0; j < 3; j++) {
      c[j] = (c[j] - lo) / (hi - lo);
    }
    c = colorspace.srgb_linear_to_srgb(c);
    c = colorspace.hexify(c);
    ctx.fillStyle = c;
    ctx.fillRect(i, 0, 1, canv.height);
  }
  return [lo, hi];
}

