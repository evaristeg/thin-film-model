var generateFilter = function(thicknessNm, contribRatio) {
  var front = contribRatio / (1. + contribRatio);
  var back = 1. / (1. + contribRatio);
  var wavelen;
  var samples = [];
  //samples.push([378, 0.]);
  for (wavelen = 370; wavelen <= 760; wavelen += 2) {
    // c = 2.99792e5 nm*THz
    var phase = 4. * Math.PI * thicknessNm / wavelen;
    var x = back * Math.cos(phase) - front;
    var y = back * Math.sin(phase);
    samples.push([wavelen, Math.sqrt(x*x + y*y)]);
  }
  //samples.push([752, 0.]);
  return new PiecewiseLinearFunction(samples);
}

var paintInterference = function(canvasId, illuminant, ratio, start, end) {
  var canv = document.getElementById(canvasId);
  var ctx = canv.getContext("2d");
  ctx.rect(0, 0, canv.width, canv.height);

  var carr = [];
  //var logDist = Math.log(end / start);
  //var invDist = 1 / end - 1 / start;
  var sqrtDist = Math.sqrt(end) - Math.sqrt(start);
  var i, j;
  var lo = 0, hi = 0;
  for (i = 0; i < canv.width; i++) {
    //var d = start * Math.exp(logDist * i / steps);
    //var d = 1 / (1 / start + invDist * i / steps);
    var d = Math.pow(Math.sqrt(start) + sqrtDist * (i + 0.5) / canv.width, 2);
    //var d = start + (end - start) * i / steps;
    var filt = generateFilter(d, ratio);
    var c = cie1931observer.spectrumToXyz(illuminant.multiply(filt));
    c = colorspace.XYZ_to_xyY(c);
    //c = colorspace.xyY_desaturate(c, 0.5);
    c = colorspace.xyY_clamp_to_srgb_gamut(c);
    //c[2] /= 1.2;
    c = colorspace.xyY_to_XYZ(c);
    c = colorspace.XYZ_to_srgb_linear(c);
    for (j = 0; j < 3; j++) {
      if (c[j] < lo) lo = c[j];
      if (c[j] > hi) hi = c[j];
    }
    carr.push(c);
  }
  //var grad = ctx.createLinearGradient(0, 0, canv.width, 0);
  for (i = 0; i < canv.width; i++) {
    var c = carr[i];
    for (j = 0; j < 3; j++) {
      c[j] = (c[j] - lo) / (hi - lo);
    }
    c = colorspace.srgb_linear_to_srgb(c);
    c = colorspace.hexify(c);
    //grad.addColorStop(i / (carr.length - 1), c);
    ctx.fillStyle = c;
    ctx.fillRect(i, 0, 1, canv.height);
  }
  //ctx.fillStyle = grad;
  //ctx.fill();
  return [lo, hi];
}

