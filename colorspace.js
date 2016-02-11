var colorspace = {};

colorspace.XYZ_to_xyY = function(xyz) {
  var tot = xyz[0] + xyz[1] + xyz[2];
  if (tot == 0) { return [0,0,0]; }
  return [xyz[0] / tot, xyz[1] / tot, xyz[1]];
}

colorspace.xyY_to_XYZ = function(xyy) {
  return [xyy[2] * xyy[0] / xyy[1], xyy[2], xyy[2] * (1. - xyy[0] - xyy[1]) / xyy[1]];
}

colorspace.XYZ_to_srgb_linear = function(xyz) {
  return [
       3.2406 * xyz[0] - 1.5372 * xyz[1] - 0.4986 * xyz[2],
      -0.9689 * xyz[0] + 1.8758 * xyz[1] + 0.0415 * xyz[2],
       0.0557 * xyz[0] - 0.2040 * xyz[1] + 1.0570 * xyz[2]
    ];
}

colorspace.XYZ_to_CIE_RGB = function(xyz) {
  return [
       0.41847   * xyz[0] - 0.15866   * xyz[1] - 0.082835 * xyz[2],
      -0.091169  * xyz[0] + 0.25243   * xyz[1] + 0.015708 * xyz[2],
       0.0009209 * xyz[0] - 0.0025498 * xyz[1] + 0.17860  * xyz[2]
    ];
}

colorspace.CIE_RGB_to_XYZ = function(rgb) {
  return [
      (0.49    * rgb[0] + 0.31    * rgb[1] + 0.20    * rgb[2]) / 0.17697,
      (0.17697 * rgb[0] + 0.81240 * rgb[1] + 0.01063 * rgb[2]) / 0.17697,
      (0.0     * rgb[0] + 0.01    * rgb[1] + 0.99    * rgb[2]) / 0.17697
    ];
}

colorspace.srgb_linear_to_srgb = function(linear) {
  var srgb = [0., 0., 0.];
  var i;
  for (i = 0; i < 3; i++) {
    if (linear[i] <= 0.0031308) {
      srgb[i] = 12.92 * linear[i];
    }
    else {
      srgb[i] = 1.055 * Math.pow(linear[i], 1. / 2.4) - 0.055;
    }
  }
  return srgb;
}

colorspace.hexify = function(triple) {
  var str = '#';
  var i;
  for (i = 0; i < 3; i++) {
    if (triple[i] < 0. || triple[i] > 1.) {
      throw "Value outside of allowed range [0,1]";
    }
    str += ("0" + (Math.round(triple[i] * 255).toString(16))).slice(-2);
  }
  return str;
}

colorspace.xyY_desaturate = function(xyy, sat) {
  var white = [0.3333, 0.3333];
  return [xyy[0] * sat + white[0] * (1. - sat),
          xyy[1] * sat + white[1] * (1. - sat),
          xyy[2]];
}

colorspace.xyY_clamp_to_srgb_gamut = function(xyy) {
  var primaries = [[0.64, 0.33, 0.2126], [0.30, 0.60, 0.7152], [0.15, 0.06, 0.0722]];
  //var white = [0.3127, 0.3290, 1.0]; // D65
  var white = [0.3333, 0.3333, 1.0]; // flat
  // compute chromaticity in barycentric coordinates
  var tmp = [xyy[0] - primaries[2][0], xyy[1] - primaries[2][1]];
  var baryChr = [2.409639 * tmp[0] - 0.669344 * tmp[1], -1.204819 * tmp[0] + 2.186524 * tmp[1], 0.];
  baryChr[2] = 1. - baryChr[0] - baryChr[1];
  var baryWhite = [0.211995, 0.392151, 0.395854];
  // clamp chromaticity to sRGB gamut
  var adjustment = 0.;
  var i;
  for (i = 0; i < 3; i++) {
    var a = 0.;
    if (baryChr[i] < 0.01) {
      a = (0.01 - baryChr[i]) / (baryWhite[i] - baryChr[i]);
    }
    else if (baryChr[i] > 0.99) {
      a = (0.99 - baryChr[i]) / (baryWhite[i] - baryChr[i]);
    }
    if (a > adjustment) {
      adjustment = a;
    }
  }
  var clampedBary = [0.,0.,0.];
  for (i = 0; i < 3; i++) {
    clampedBary[i] = baryChr[i] + adjustment * (baryWhite[i] - baryChr[i]);
  }
  return [clampedBary[0] * primaries[0][0] + clampedBary[1] * primaries[1][0] + clampedBary[2] * primaries[2][0],
          clampedBary[0] * primaries[0][1] + clampedBary[1] * primaries[1][1] + clampedBary[2] * primaries[2][1],
          xyy[2]];
}

colorspace.XYZ_to_srgb_linear_clamp = function(xyz) {
  var c = colorspace.XYZ_to_xyY(xyz);
  c = colorspace.xyY_clamp_to_srgb_gamut(c);
  c = colorspace.xyY_to_XYZ(c);
  c = colorspace.XYZ_to_srgb_linear(c);
  return c;
}

