// Acerola's code
function hslToRgb (h, s, l) {
  h %= 1
  let r, g, b

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) {
        t += 1
      }
      if (t > 1) {
        t -= 1
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t
      }
      if (t < 1 / 2) {
        return q
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6
      }
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ]
}

function hsvToRgb (h, s, v) {
  let r, g, b

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0:
      r = v; g = t; b = p
      break
    case 1:
      r = q; g = v; b = p
      break
    case 2:
      r = p; g = v; b = t
      break
    case 3:
      r = p; g = q; b = v
      break
    case 4:
      r = t; g = p; b = v
      break
    case 5:
      r = v; g = p; b = q
      break
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ]
}

function oklabToLinearSrgb (L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ]
}

function oklchToOklab (L, c, h) {
  return [L, c * Math.cos(h), c * Math.sin(h)]
}

// function setup () {
//   createCanvas(1024, 300)
//   noStroke()
// }

function Lerp (min, max, t) {
  return min + (max - min) * t
}

// function randomRange (min, max) {
//   return Math.random() * (max - min) + min
// }

function applyHueMode (hueOffset, HUE_MODE) {
  // These values represent fractions of the color wheel and use color theory
  // to create different color harmonies
  const hueModeFactors = {
    monochromatic: 0.0, // No hue change
    analogous: 0.25, // 1/4 of the color wheel (30 degrees)
    complementary: 0.33, // 1/3 of the color wheel (120 degrees)
    'triadic complementary': 0.66, // 2/3 of the color wheel (240 degrees)
    'tetradic complementary': 0.75 // 3/4 of the color wheel (270 degrees)
  }

  // TODO: Using an enum or constants the values of HUE_MODE would improve
  // type safety and potentially performance. It would also make the code
  // more resistant to typos in string literals.

  // Apply the appropriate factor based on the selected hue mode
  if (HUE_MODE in hueModeFactors) {
    hueOffset *= hueModeFactors[HUE_MODE]
  } else {
    throw new Error(`Invalid HUE_MODE: ${HUE_MODE}`)
  }

  // Add a small random variation to the hue offset for non-monochromatic
  // modes
  if (HUE_MODE !== 'monochromatic') {
    // FIXME: Move constant to the top of the file for easier tweaking
    const HUE_VARIATION_RANGE = 0.01
    hueOffset += (Math.random() * 2 - 1) * HUE_VARIATION_RANGE
  }

  return hueOffset
}

function generateHSL (HUE_MODE, settings) {
  const hslColors = []

  const { hueBase } = settings
  const hueContrast = Lerp(0.33, 1.0, settings.hueContrast)

  const saturationBase = Lerp(0.01, 0.5, settings.saturationBase)
  const saturationContrast = Lerp(
    0.1,
    1 - saturationBase,
    settings.saturationContrast
  )
  const saturationFixed = Lerp(0.1, 1.0, settings.fixed)

  const lightnessBase = Lerp(0.01, 0.5, settings.luminanceBase)
  const lightnessContrast = Lerp(
    0.1,
    1 - lightnessBase,
    settings.luminanceContrast
  )
  const lightnessFixed = Lerp(0.3, 0.85, settings.fixed)

  let { saturationConstant } = settings
  let lightnessConstant = !saturationConstant

  if (HUE_MODE === 'monochromatic') {
    saturationConstant = false
    lightnessConstant = false
  }

  for (let i = 0; i < settings.colorCount; ++i) {
    const linearIterator = i / (settings.colorCount - 1)

    let hueOffset = linearIterator * hueContrast

    hueOffset = applyHueMode(hueOffset, HUE_MODE)

    let saturation =
      saturationBase + linearIterator * saturationContrast
    let lightness = lightnessBase + linearIterator * lightnessContrast

    if (saturationConstant) {
      saturation = saturationFixed
    }
    if (lightnessConstant) {
      lightness = lightnessFixed
    }

    hslColors.push(
      hslToRgb(hueBase + hueOffset, saturation, lightness)
    )
  }

  return hslColors
}

function generateHSV (HUE_MODE, settings) {
  const hsvColors = []

  const { hueBase } = settings
  const hueContrast = Lerp(0.33, 1.0, settings.hueContrast)

  const saturationBase = Lerp(0.01, 0.5, settings.saturationBase)
  const saturationContrast = Lerp(
    0.1,
    1 - saturationBase,
    settings.saturationContrast
  )
  const saturationFixed = Lerp(0.1, 1.0, settings.fixed)

  const valueBase = Lerp(0.01, 0.5, settings.luminanceBase)
  const valueContrast = Lerp(
    0.1,
    1 - valueBase,
    settings.luminanceContrast
  )
  const valueFixed = Lerp(0.3, 1.0, settings.fixed)

  let { saturationConstant } = settings
  let valueConstant = !saturationConstant

  if (HUE_MODE === 'monochromatic') {
    saturationConstant = false
    valueConstant = false
  }

  for (let i = 0; i < settings.colorCount; ++i) {
    const linearIterator = i / (settings.colorCount - 1)

    let hueOffset = linearIterator * hueContrast

    hueOffset = applyHueMode(hueOffset, HUE_MODE)

    let saturation =
      saturationBase + linearIterator * saturationContrast
    let value = valueBase + linearIterator * valueContrast

    if (saturationConstant) {
      saturation = saturationFixed
    }
    if (valueConstant) {
      value = valueFixed
    }

    hsvColors.push(hsvToRgb(hueBase + hueOffset, saturation, value))
  }

  return hsvColors
}

function generateOKLCH (HUE_MODE, settings) {
  const oklchColors = []

  const hueBase = settings.hueBase * 2 * Math.PI
  const hueContrast = Lerp(0.33, 1.0, settings.hueContrast)

  const chromaBase = Lerp(0.01, 0.1, settings.saturationBase)
  const chromaContrast = Lerp(
    0.075,
    0.125 - chromaBase,
    settings.saturationContrast
  )
  const chromaFixed = Lerp(0.01, 0.125, settings.fixed)

  const lightnessBase = Lerp(0.3, 0.6, settings.luminanceBase)
  const lightnessContrast = Lerp(
    0.3,
    1.0 - lightnessBase,
    settings.luminanceContrast
  )
  const lightnessFixed = Lerp(0.6, 0.9, settings.fixed)

  let chromaConstant = settings.saturationConstant
  let lightnessConstant = !chromaConstant

  if (HUE_MODE === 'monochromatic') {
    chromaConstant = false
    lightnessConstant = false
  }

  for (let i = 0; i < settings.colorCount; ++i) {
    const linearIterator = i / (settings.colorCount - 1)

    let hueOffset =
      linearIterator * hueContrast * 2 * Math.PI + Math.PI / 4

    hueOffset = applyHueMode(hueOffset, HUE_MODE)

    let chroma = chromaBase + linearIterator * chromaContrast
    let lightness = lightnessBase + linearIterator * lightnessContrast

    if (chromaConstant) {
      chroma = chromaFixed
    }
    if (lightnessConstant) {
      lightness = lightnessFixed
    }

    const lab = oklchToOklab(lightness, chroma, hueBase + hueOffset)
    const rgb = oklabToLinearSrgb(lab[0], lab[1], lab[2])

    rgb[0] = Math.round(Math.max(0.0, Math.min(rgb[0], 1.0)) * 255)
    rgb[1] = Math.round(Math.max(0.0, Math.min(rgb[1], 1.0)) * 255)
    rgb[2] = Math.round(Math.max(0.0, Math.min(rgb[2], 1.0)) * 255)

    oklchColors.push(rgb)
  }

  return oklchColors
}

function PaletteSettings (COLOR_COUNT) {
  return {
    hueBase: Math.random(),
    hueContrast: Math.random(),
    saturationBase: Math.random(),
    saturationContrast: Math.random(),
    luminanceBase: Math.random(),
    luminanceContrast: Math.random(),
    fixed: Math.random(),
    saturationConstant: true,
    colorCount: COLOR_COUNT
  }
}

export function generatePalettes (HUE_MODE, COLOR_COUNT) {
  const paletteSettings = PaletteSettings(COLOR_COUNT)

  const hsl = generateHSL(HUE_MODE, paletteSettings)
  const hsv = generateHSV(HUE_MODE, paletteSettings)
  const lch = generateOKLCH(HUE_MODE, paletteSettings)

  return [hsl, hsv, lch]
}
