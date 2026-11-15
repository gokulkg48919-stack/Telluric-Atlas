import * as THREE from 'three';

// Deterministic 3D hash & gradient-like value noise for seamless spherical mapping
function hash3(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);
  const fz = smoothstep(z - iz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  const nx00 = lerp(n000, n100, fx);
  const nx10 = lerp(n010, n110, fx);
  const nx01 = lerp(n001, n101, fx);
  const nx11 = lerp(n011, n111, fx);

  const nxy0 = lerp(nx00, nx10, fy);
  const nxy1 = lerp(nx01, nx11, fy);

  return lerp(nxy0, nxy1, fz);
}

function fbm(x: number, y: number, z: number, octaves: number): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amp * noise3D(x * freq, y * freq, z * freq);
    freq *= 2.07;
    amp *= 0.5;
  }
  return value;
}

interface CraterSeed {
  x: number;
  y: number;
  z: number;
  radius: number;
  depth: number;
  hasRays: boolean;
}

function buildCraterSeeds(count: number, seedOffset: number, minR: number, maxR: number): CraterSeed[] {
  const seeds: CraterSeed[] = [];
  for (let i = 0; i < count; i++) {
    const u = hash3(i + seedOffset, 1.37, 9.11);
    const v = hash3(i + seedOffset, 5.73, 2.41);
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const sinPhi = Math.sin(phi);
    const rMix = Math.pow(hash3(i + seedOffset, 8.21, 4.03), 2.2);
    seeds.push({
      x: sinPhi * Math.cos(theta),
      y: Math.cos(phi),
      z: sinPhi * Math.sin(theta),
      radius: lerp(minR, maxR, rMix),
      depth: lerp(0.25, 0.9, rMix),
      hasRays: i < 5,
    });
  }
  return seeds;
}

export interface PlanetaryTextureBundle {
  earthMap: THREE.DataTexture;
  marsMap: THREE.DataTexture;
  moonMap: THREE.DataTexture;
  dataMaskMap: THREE.DataTexture;
  dispose: () => void;
}

export function createPlanetaryTextures(
  width = 768,
  height = 384,
  maxAnisotropy = 4
): PlanetaryTextureBundle {
  const size = width * height * 4;
  const earthData = new Uint8Array(size);
  const marsData = new Uint8Array(size);
  const moonData = new Uint8Array(size);
  // R: Earth land elevation (>0.5 land, <=0.5 ocean), G: Mars elevation, B: Moon elevation, A: Earth cloud density
  const maskData = new Uint8Array(size);

  const marsCraters = buildCraterSeeds(38, 100, 0.04, 0.19);
  const moonCraters = buildCraterSeeds(95, 500, 0.03, 0.24);

  for (let py = 0; py < height; py++) {
    const v = (py + 0.5) / height;
    const lat = (0.5 - v) * Math.PI; // +PI/2 north pole, -PI/2 south pole
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    const absLat = Math.abs(sinLat);

    for (let px = 0; px < width; px++) {
      const u = (px + 0.5) / width;
      const lon = u * Math.PI * 2;
      const nx = cosLat * Math.cos(lon);
      const ny = sinLat;
      const nz = cosLat * Math.sin(lon);

      const idx = (py * width + px) * 4;

      // ---------------- EARTH ----------------
      const warpX = fbm(nx * 2.1 + 3.1, ny * 2.1 - 1.4, nz * 2.1 + 0.7, 4) - 0.5;
      const warpZ = fbm(nx * 2.1 - 2.3, ny * 2.1 + 2.8, nz * 2.1 - 1.9, 4) - 0.5;
      const continent = fbm(
        (nx + warpX * 0.48) * 2.1 + 1.2,
        (ny + warpX * 0.22) * 2.1 + 0.4,
        (nz + warpZ * 0.48) * 2.1 - 0.8,
        6
      );
      const detail = fbm(nx * 12.0 + 4.0, ny * 12.0 - 2.0, nz * 12.0 + 1.5, 5);
      const seaLevel = 0.502;
      const iceThreshold = clamp(0.845 - detail * 0.085, 0.72, 0.92);

      let er = 0;
      let eg = 0;
      let eb = 0;
      let earthElev = 0.2;

      if (absLat > iceThreshold) {
        // Polar ice caps with subtle glacial blue tint
        er = 232;
        eg = 242;
        eb = 252;
        earthElev = 0.72 + detail * 0.14;
      } else if (continent < seaLevel) {
        // Bathymetric oceans: abyssal navy -> turquoise continental shelf
        const depth = clamp((seaLevel - continent) / 0.26, 0, 1);
        const shelf = Math.pow(1 - depth, 3.2);
        const coastal = Math.pow(1 - depth, 9.0);
        er = Math.round(lerp(5, 18, shelf) + coastal * 14);
        eg = Math.round(lerp(20, 82, shelf) + coastal * 48);
        eb = Math.round(lerp(62, 148, shelf) + coastal * 32);
        earthElev = 0.16 + shelf * 0.26;
      } else {
        // Continental biomes with mountain ridges
        const alt = clamp((continent - seaLevel) / 0.28, 0, 1);
        const moisture = fbm(nx * 3.8 - 5.2, ny * 3.8 + 1.9, nz * 3.8 + 3.4, 4);
        const aridity = clamp((1 - absLat * 1.15) * 0.88 - moisture * 0.9 + 0.26, 0, 1);

        // Deep rainforest/temperate green -> savanna/desert ochre -> alpine rock -> snow
        let lr = lerp(24, 178, aridity);
        let lg = lerp(74, 144, aridity);
        let lb = lerp(38, 96, aridity);

        if (alt > 0.48) {
          const rockMix = clamp((alt - 0.48) / 0.3, 0, 1);
          lr = lerp(lr, 108, rockMix);
          lg = lerp(lg, 102, rockMix);
          lb = lerp(lb, 96, rockMix);
        }
        if (alt > 0.76) {
          const snowMix = clamp((alt - 0.76) / 0.2, 0, 1);
          lr = lerp(lr, 236, snowMix);
          lg = lerp(lg, 242, snowMix);
          lb = lerp(lb, 248, snowMix);
        }

        const micro = (detail - 0.5) * 34;
        er = Math.round(clamp(lr + micro, 0, 255));
        eg = Math.round(clamp(lg + micro, 0, 255));
        eb = Math.round(clamp(lb + micro, 0, 255));
        earthElev = clamp(0.54 + alt * 0.46, 0.52, 1.0);
      }

      earthData[idx] = er;
      earthData[idx + 1] = eg;
      earthData[idx + 2] = eb;
      earthData[idx + 3] = 255;

      // Realistic cyclonic & trade-wind Earth cloud bands
      const cloudWarp = fbm(nx * 2.5 + 1.1, ny * 2.5, nz * 2.5 - 2.2, 3) - 0.5;
      const cloudShear = Math.sin(ny * 7.5) * 0.32 + cloudWarp * 0.4;
      const c1 = fbm(
        (nx + cloudShear) * 3.6 + 7.1,
        ny * 4.4 - 3.2,
        (nz - cloudShear) * 3.6 + 2.5,
        6
      );
      const c2 = fbm(nx * 9.5 - 1.2, ny * 9.5 + 4.4, nz * 9.5 - 6.1, 4);
      const cloudVal = clamp((c1 * 0.74 + c2 * 0.26 - 0.465) * 2.75, 0, 1);

      // ---------------- MARS ----------------
      const marsTerrain = fbm(nx * 2.5 + 9.2, ny * 2.5 - 4.1, nz * 2.5 + 5.7, 6);
      const marsFine = fbm(nx * 14.0 - 2.4, ny * 14.0 + 3.1, nz * 14.0 - 1.1, 5);
      // Hemispheric crustal dichotomy: northern plains lower/smoother, southern highlands elevated
      const dichotomy = clamp((-ny + 0.12) * 0.48, 0, 0.36);

      // Valles Marineris: winding tectonic rift valley with tributary canyons
      const riftWarp = (fbm(nx * 5.0, ny * 5.0, nz * 5.0, 3) - 0.5) * 0.08;
      const canyonLat = Math.exp(-Math.pow((ny + 0.11 + riftWarp) * 18, 2));
      const canyonLon = Math.exp(-Math.pow((u - 0.48) * 9.5, 2));
      const canyonCut = canyonLat * canyonLon * 0.48;

      // Olympus Mons shield volcano & summit caldera
      const dOlympus = Math.hypot(nx - 0.24, ny - 0.31, nz - 0.92);
      const olympusShield = dOlympus < 0.22 ? Math.pow(1 - dOlympus / 0.22, 1.5) * 0.36 : 0;
      const olympusCaldera = dOlympus < 0.032 ? (1 - dOlympus / 0.032) * 0.16 : 0;

      let marsCraterDelta = 0;
      for (let c = 0; c < marsCraters.length; c++) {
        const cr = marsCraters[c];
        const dx = nx - cr.x;
        const dy = ny - cr.y;
        const dz = nz - cr.z;
        const dSq = dx * dx + dy * dy + dz * dz;
        const rSq = cr.radius * cr.radius;
        if (dSq < rSq * 2.1) {
          const d = Math.sqrt(dSq) / cr.radius;
          if (d < 0.8) {
            marsCraterDelta -= (1 - (d / 0.8) * (d / 0.8)) * cr.depth * 0.32;
          } else if (d < 1.35) {
            const rim = 1 - Math.abs(d - 1.0) / 0.35;
            marsCraterDelta += rim * cr.depth * 0.19;
          }
        }
      }

      const marsElev = clamp(
        0.38 +
          marsTerrain * 0.36 +
          dichotomy +
          (marsFine - 0.5) * 0.14 -
          canyonCut +
          olympusShield -
          olympusCaldera +
          marsCraterDelta,
        0.04,
        0.99
      );

      let mr = 0;
      let mg = 0;
      let mb = 0;

      // Spiral polar dry-ice / water-ice caps
      const spiralTrough = Math.sin(lon * 3.0 + absLat * 48.0) * 0.018;
      if (absLat + spiralTrough > clamp(0.908 - marsFine * 0.035, 0.86, 0.96)) {
        mr = 238;
        mg = 228;
        mb = 216;
      } else {
        // Hematite rust ochre vs dark basaltic albedo provinces (Syrtis Major / Acidalia)
        const darkBasalt = clamp((0.515 - marsTerrain) * 2.6, 0, 1);
        mr = lerp(202, 102, darkBasalt);
        mg = lerp(98, 52, darkBasalt);
        mb = lerp(56, 38, darkBasalt);

        // Fine bright wind-blown ochre dust
        const dust = clamp((marsFine - 0.46) * 2.0, 0, 1);
        mr = lerp(mr, 226, dust * 0.46);
        mg = lerp(mg, 138, dust * 0.46);
        mb = lerp(mb, 86, dust * 0.46);

        // Dark shadowed canyon walls & floor
        if (canyonCut > 0.06) {
          const cMix = clamp(canyonCut * 2.4, 0, 0.78);
          mr = lerp(mr, 64, cMix);
          mg = lerp(mg, 32, cMix);
          mb = lerp(mb, 26, cMix);
        }
      }

      marsData[idx] = Math.round(clamp(mr, 0, 255));
      marsData[idx + 1] = Math.round(clamp(mg, 0, 255));
      marsData[idx + 2] = Math.round(clamp(mb, 0, 255));
      marsData[idx + 3] = 255;

      // ---------------- MOON ----------------
      const moonMacro = fbm(nx * 2.2 - 6.4, ny * 2.2 + 2.1, nz * 2.2 - 3.9, 6);
      const moonRegolith = fbm(nx * 16.0 + 1.8, ny * 16.0 - 7.3, nz * 16.0 + 4.2, 5);

      // Realistic lunar Maria impact basins on near-side hemisphere
      const basinCenters: Array<[number, number, number, number]> = [
        [0.82, 0.42, 0.38, 0.42], // Mare Imbrium
        [0.91, 0.14, -0.38, 0.34], // Mare Serenitatis / Tranquillitatis
        [0.62, 0.08, 0.78, 0.52], // Oceanus Procellarum
        [0.74, 0.28, -0.61, 0.24], // Mare Crisium
        [0.86, -0.28, 0.42, 0.28], // Mare Nubium
      ];
      let basinFactor = 0;
      const basinWarp = (moonMacro - 0.5) * 0.18;
      for (let b = 0; b < basinCenters.length; b++) {
        const [bx, by, bz, br] = basinCenters[b];
        const dist = Math.hypot(nx - bx, ny - by, nz - bz) + basinWarp;
        if (dist < br) {
          basinFactor = Math.max(basinFactor, smoothstep(1 - dist / br));
        }
      }
      const mariaField = fbm(nx * 2.1 + 2.5, ny * 2.1 + 0.8, nz * 2.1 + 1.1, 4);
      const mariaMask = clamp(basinFactor * 0.88 + clamp((mariaField - 0.58) * 2.5, 0, 0.35), 0, 1);

      let moonCraterDelta = 0;
      let ejectaBright = 0;
      for (let c = 0; c < moonCraters.length; c++) {
        const cr = moonCraters[c];
        const dx = nx - cr.x;
        const dy = ny - cr.y;
        const dz = nz - cr.z;
        const dSq = dx * dx + dy * dy + dz * dz;
        const maxRange = cr.hasRays ? cr.radius * 4.2 : cr.radius * 1.5;
        if (dSq < maxRange * maxRange) {
          const d = Math.sqrt(dSq) / cr.radius;
          if (d < 0.78) {
            // Flat-ish crater floor + central rebound peak on large craters
            const bowl = 1 - Math.pow(d / 0.78, 2.6);
            const centralPeak = cr.radius > 0.12 && d < 0.18 ? (1 - d / 0.18) * 0.18 : 0;
            moonCraterDelta -= bowl * cr.depth * 0.38 - centralPeak;
          } else if (d < 1.3) {
            const rim = 1 - Math.abs(d - 0.96) / 0.34;
            moonCraterDelta += rim * cr.depth * 0.25;
            ejectaBright += rim * 0.24;
          } else if (cr.hasRays && d < 4.0) {
            const angle = Math.atan2(dz, dx);
            const rayPattern = Math.pow(Math.max(0, Math.sin(angle * 8 + c * 1.7)), 3.2);
            ejectaBright += rayPattern * (1 - (d - 1.3) / 2.7) * 0.38;
          }
        }
      }

      const moonElev = clamp(
        0.5 + (moonMacro - 0.5) * 0.34 - mariaMask * 0.22 + (moonRegolith - 0.5) * 0.16 + moonCraterDelta,
        0.03,
        0.99
      );

      // High-contrast Highlands anorthosite vs dark Basaltic Maria
      let lum = lerp(192, 62, mariaMask);
      lum += (moonRegolith - 0.5) * 38;
      lum += moonCraterDelta * 96;
      lum += ejectaBright * 82;
      lum = clamp(lum, 24, 240);

      moonData[idx] = Math.round(lum * 0.98);
      moonData[idx + 1] = Math.round(lum * 0.99);
      moonData[idx + 2] = Math.round(lum * 1.01);
      moonData[idx + 3] = 255;

      // Packed mask texture
      maskData[idx] = Math.round(clamp(earthElev, 0, 1) * 255);
      maskData[idx + 1] = Math.round(clamp(marsElev, 0, 1) * 255);
      maskData[idx + 2] = Math.round(clamp(moonElev, 0, 1) * 255);
      maskData[idx + 3] = Math.round(cloudVal * 255);
    }
  }

  const makeTex = (data: Uint8Array, colorSpace: THREE.ColorSpace) => {
    const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    tex.colorSpace = colorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = maxAnisotropy;
    tex.needsUpdate = true;
    return tex;
  };

  const earthMap = makeTex(earthData, THREE.SRGBColorSpace);
  const marsMap = makeTex(marsData, THREE.SRGBColorSpace);
  const moonMap = makeTex(moonData, THREE.SRGBColorSpace);
  const dataMaskMap = makeTex(maskData, THREE.NoColorSpace);

  return {
    earthMap,
    marsMap,
    moonMap,
    dataMaskMap,
    dispose: () => {
      earthMap.dispose();
      marsMap.dispose();
      moonMap.dispose();
      dataMaskMap.dispose();
    },
  };
}
