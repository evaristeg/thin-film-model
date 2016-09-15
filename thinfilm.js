var fresnelPhasors = function(cosI, cosT, ior1, ior2) {
  var denomS = ior1 * cosI + ior2 * cosT;
  var denomP = ior1 * cosT + ior2 * cosI;
  var rs = (ior1 * cosI - ior2 * cosT) / denomS;
  var ts = rs + 1.;
  var rp = (ior2 * cosI - ior1 * cosT) / denomP;
  var tp = (2. * ior1 * cosI) / denomP;
  return { rs:rs, ts:ts, rp:rp, tp:tp };
}

var generateFilter = function(thicknessNm, angle, iorFilm, iorBack, ws, wp) {
  // ray A = ambient (ior 1.0), B = inside film, C = exited back surface
  var sinA = Math.sin(Math.PI * angle / 180.);
  var sinB = sinA / iorFilm;
  var sinC = sinA / iorBack;
  var cosA = Math.sqrt(1. - sinA * sinA);
  var cosB = Math.sqrt(1. - sinB * sinB);
  var cosC = Math.sqrt(1. - sinC * sinC);

  var ph0 = fresnelPhasors(cosA, cosB, 1.0, iorFilm);
  var ph1 = fresnelPhasors(cosB, cosC, iorFilm, iorBack);
  var ph2 = fresnelPhasors(cosB, cosA, iorFilm, 1.0);

  var wavelen;
  var samples = [];
  for (wavelen = 370; wavelen <= 760; wavelen += 2) {
    var phase = 4. * Math.PI * thicknessNm / (wavelen * cosB);
    // tr is the phase shift phasor for a round trip transit through the film
    var tr = new Complex({re: Math.cos(phase), im: Math.sin(phase)});
    // Total reflection = sum of amplitude phasors for all paths:
    // r_0 + \sum_{i=0}^\infty t_0*r_1*tr*(r_2*r_1*tr)^i*t_2
    // = r_0 + (t_0*t_2*r_1*tr) / (1-r_1*r_2*tr)
    var sSum = tr.mul(ph0.ts * ph2.ts * ph1.rs).div(tr.mul(ph1.rs * ph2.rs).neg().add(1.)).add(ph0.rs)
    var pSum = tr.mul(ph0.tp * ph2.tp * ph1.rp).div(tr.mul(ph1.rp * ph2.rp).neg().add(1.)).add(ph0.rp)
    var sPow = sSum.mul(sSum.conjugate());
    var pPow = pSum.mul(pSum.conjugate());
    samples.push([wavelen, ws * sPow + wp * pPow]);
  }
  return new PiecewiseLinearFunction(samples);
}

var paintInterference = function(canvasId, illuminant, start, end, angle, iorFilm, iorBack, ws, wp) {
  var canv = document.getElementById(canvasId);
  var ctx = canv.getContext("2d");
  ctx.rect(0, 0, canv.width, canv.height);

  var carr = [];
  var sqrtDist = Math.sqrt(end) - Math.sqrt(start);
  var i, j;
  var lo = 0, hi = 0, maxFiltPeak = 0, maxSpecPeak = 0;
  for (i = 0; i < canv.width; i++) {
    var d = Math.pow(Math.sqrt(start) + sqrtDist * (i + 0.5) / canv.width, 2);
    var filt = generateFilter(d, angle, iorFilm, iorBack, ws, wp);
    var peak = filt.max();
    if (peak > maxFiltPeak) {
      maxFiltPeak = peak;
    }
    var spectrum = illuminant.multiply(filt);
    var peak = spectrum.max();
    if (peak > maxSpecPeak) {
      maxSpecPeak = peak;
    }
    var c = cie1931observer.spectrumToXyz(spectrum);
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
  return {
    rgbLo: lo,
    rgbHi: hi,
    reflectanceHi: maxFiltPeak,
    reflectedHi: maxSpecPeak
  };
}

