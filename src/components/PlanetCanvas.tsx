import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import earthAlbedoUrl from '../assets/images/earth_albedo_map_1794659743596.jpg';
import earthCloudsUrl from '../assets/images/earth_clouds_map_1794659745493.jpg';
import marsTerrainUrl from '../assets/images/mars_terrain_raw_1794659774314.jpg';
import moonAlbedoUrl from '../assets/images/moon_albedo_map_1794659744985.jpg';
import neptuneAlbedoUrl from '../assets/images/neptune_albedo_map_1794742639341.jpg';
import saturnAlbedoUrl from '../assets/images/saturn_albedo_map_1794742637606.jpg';
import uranusAlbedoUrl from '../assets/images/uranus_albedo_map_1794742637752.jpg';
import { PlanetId, PLANETS } from '../data/planets';

export interface MeteorTransitState {
  id: number;
  direction: 'left' | 'right';
  targetPlanet: PlanetId;
  startedAt: number;
  durationMs: number;
}

interface PlanetCanvasProps {
  activePlanet: PlanetId;
  pageMode?: 'home' | 'connect';
  meteorTransit: MeteorTransitState | null;
  onSwipeGesture: (direction: 'left' | 'right') => void;
}

interface PlanetPhysicalProfile {
  weightsA: [number, number, number]; // earth, mars, moon
  weightsB: [number, number, number]; // saturn, uranus, neptune
  oblateY: number;
  baseScale: number;
  viewPitch: number;
  spinRate: number;
}

const PLANET_PHYSICAL: Record<PlanetId, PlanetPhysicalProfile> = {
  earth: {
    weightsA: [1, 0, 0],
    weightsB: [0, 0, 0],
    oblateY: 0.9967,
    baseScale: 1.0,
    viewPitch: 0.08,
    spinRate: 0.14,
  },
  mars: {
    weightsA: [0, 1, 0],
    weightsB: [0, 0, 0],
    oblateY: 0.9941,
    baseScale: 1.0,
    viewPitch: 0.08,
    spinRate: 0.14,
  },
  moon: {
    weightsA: [0, 0, 1],
    weightsB: [0, 0, 0],
    oblateY: 1.0,
    baseScale: 1.0,
    viewPitch: 0.06,
    spinRate: 0.1,
  },
  saturn: {
    weightsA: [0, 0, 0],
    weightsB: [1, 0, 0],
    oblateY: 0.902,
    baseScale: 0.49,
    viewPitch: 0.24,
    spinRate: 0.28,
  },
  uranus: {
    weightsA: [0, 0, 0],
    weightsB: [0, 1, 0],
    oblateY: 0.977,
    baseScale: 0.56,
    viewPitch: 0.14,
    spinRate: 0.24,
  },
  neptune: {
    weightsA: [0, 0, 0],
    weightsB: [0, 0, 1],
    oblateY: 0.983,
    baseScale: 1.0,
    viewPitch: 0.1,
    spinRate: 0.26,
  },
};

const PLANET_RADIUS = 1.72;

// Pre-allocated math helpers (zero GC inside animation loop)
const _targetWeightsA = new THREE.Vector3();
const _targetWeightsB = new THREE.Vector3();
const _tiltUp = new THREE.Vector3(0, 1, 0);
const _sunDir = new THREE.Vector3(0.76, 0.25, 0.6).normalize();

export function PlanetCanvas({
  activePlanet,
  pageMode = 'home',
  meteorTransit,
  onSwipeGesture,
}: PlanetCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const activePlanetRef = useRef<PlanetId>(activePlanet);
  const pageModeRef = useRef<'home' | 'connect'>(pageMode);
  const meteorTransitRef = useRef<MeteorTransitState | null>(meteorTransit);
  const onSwipeRef = useRef(onSwipeGesture);

  useEffect(() => {
    activePlanetRef.current = activePlanet;
  }, [activePlanet]);

  useEffect(() => {
    pageModeRef.current = pageMode;
  }, [pageMode]);

  useEffect(() => {
    meteorTransitRef.current = meteorTransit;
  }, [meteorTransit]);

  useEffect(() => {
    onSwipeRef.current = onSwipeGesture;
  }, [onSwipeGesture]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL detection via GPU renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Renderer with ACESFilmic & SRGB pipeline
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.05, 6.2);

    // 4. Load High-Resolution Local Photographic Maps
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const loader = new THREE.TextureLoader();

    const loadPlanetTex = (url: string, repeatMirror = false) => {
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = repeatMirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
      tex.wrapT = repeatMirror ? THREE.MirroredRepeatWrapping : THREE.ClampToEdgeWrapping;
      tex.anisotropy = maxAnisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    };

    const earthTex = loadPlanetTex(earthAlbedoUrl, false);
    const marsTex = loadPlanetTex(marsTerrainUrl, true);
    const moonTex = loadPlanetTex(moonAlbedoUrl, false);
    const cloudsTex = loadPlanetTex(earthCloudsUrl, false);
    const saturnTex = loadPlanetTex(saturnAlbedoUrl, false);
    const uranusTex = loadPlanetTex(uranusAlbedoUrl, false);
    const neptuneTex = loadPlanetTex(neptuneAlbedoUrl, false);

    // 5. Realistic Planetary Assembly (Surface + Clouds + Atmosphere + Ring System)
    const computeResponsiveScale = (
      planetId: PlanetId,
      mode: 'home' | 'connect',
      aspect: number
    ): number => {
      const halfH = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const availH = halfH * 0.96;
      const availW = halfH * aspect * 0.96;

      if (mode === 'home') {
        const fit = Math.min(1.0, availW / 1.76, availH / 1.76);
        return Math.max(0.7, fit);
      }

      if (planetId === 'saturn') {
        return THREE.MathUtils.clamp(Math.min(availW / 3.45, availH / 1.92), 0.48, 0.88);
      }
      if (planetId === 'uranus') {
        return THREE.MathUtils.clamp(Math.min(availW / 1.84, availH / 2.66), 0.52, 0.72);
      }
      // Neptune (scaled dynamically up to fill screen cleanly)
      return THREE.MathUtils.clamp(Math.min(availW / 1.66, availH / 1.66), 0.72, 1.12);
    };

    const initialPhys = PLANET_PHYSICAL[activePlanetRef.current];

    const planetRoot = new THREE.Group();
    const initialScale = computeResponsiveScale(
      activePlanetRef.current,
      pageModeRef.current,
      camera.aspect
    );
    planetRoot.scale.setScalar(initialScale);
    planetRoot.rotation.x = initialPhys.viewPitch;
    scene.add(planetRoot);

    const tiltGroup = new THREE.Group();
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(PLANETS[activePlanetRef.current].axialTiltDeg);
    planetRoot.add(tiltGroup);

    // Part 1: Ultra-Realistic Photographic Planetary Surface Sphere
    const surfaceGeo = new THREE.SphereGeometry(PLANET_RADIUS, 112, 72);
    const surfaceMat = new THREE.ShaderMaterial({
      uniforms: {
        uEarthMap: { value: earthTex },
        uMarsMap: { value: marsTex },
        uMoonMap: { value: moonTex },
        uCloudsMap: { value: cloudsTex },
        uSaturnMap: { value: saturnTex },
        uUranusMap: { value: uranusTex },
        uNeptuneMap: { value: neptuneTex },
        uWeightsA: {
          value: new THREE.Vector3(
            initialPhys.weightsA[0],
            initialPhys.weightsA[1],
            initialPhys.weightsA[2]
          ),
        },
        uWeightsB: {
          value: new THREE.Vector3(
            initialPhys.weightsB[0],
            initialPhys.weightsB[1],
            initialPhys.weightsB[2]
          ),
        },
        uSunDir: { value: _sunDir.clone() },
        uTiltUp: { value: new THREE.Vector3(0, 1, 0) },
        uPlanetScale: { value: initialScale },
        uCloudOffset: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        varying vec3 vLocalPos;

        void main() {
          vUv = uv;
          vLocalPos = normalize(position);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPosition.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);

          vec3 upRef = abs(vWorldNormal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
          vTangent = normalize(cross(upRef, vWorldNormal));
          vBitangent = normalize(cross(vWorldNormal, vTangent));

          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uEarthMap;
        uniform sampler2D uMarsMap;
        uniform sampler2D uMoonMap;
        uniform sampler2D uCloudsMap;
        uniform sampler2D uSaturnMap;
        uniform sampler2D uUranusMap;
        uniform sampler2D uNeptuneMap;
        uniform vec3 uWeightsA; // x: Earth, y: Mars, z: Moon
        uniform vec3 uWeightsB; // x: Saturn, y: Uranus, z: Neptune
        uniform vec3 uSunDir;
        uniform vec3 uTiltUp;
        uniform float uPlanetScale;
        uniform float uCloudOffset;

        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        varying vec3 vLocalPos;

        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
          float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
          float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
          float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
          float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
          float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
          float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
          float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
          return mix(
            mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
            mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
            u.z
          );
        }

        // Seamless horizontal-wrap sampler for equirectangular maps (heals u=0/1 seam smoothly)
        vec3 sampleSeamFree(sampler2D tex, vec2 uv) {
          vec3 c1 = texture2D(tex, uv).rgb;
          float seamEdge = min(uv.x, 1.0 - uv.x);
          float blend = smoothstep(0.045, 0.0, seamEdge);
          if (blend <= 0.001) return c1;
          vec3 c2 = texture2D(tex, vec2(1.0 - uv.x, uv.y)).rgb;
          return mix(c1, c2, blend * 0.5);
        }

        // Seamless 3D triplanar sampler for Mars terrain (zero UV seams, zero polar distortion)
        vec3 sampleMarsTriplanar(vec3 p) {
          vec3 w = pow(abs(p), vec3(4.0));
          w /= (w.x + w.y + w.z);
          vec2 uvX = p.zy * 0.55 + vec2(0.5);
          vec2 uvY = p.xz * 0.55 + vec2(0.5);
          vec2 uvZ = p.xy * 0.55 + vec2(0.5);
          vec3 colX = texture2D(uMarsMap, uvX).rgb;
          vec3 colY = texture2D(uMarsMap, uvY).rgb;
          vec3 colZ = texture2D(uMarsMap, uvZ).rgb;
          vec3 base = colX * w.x + colY * w.y + colZ * w.z;

          float macroVar = noise3(p * 2.6 + vec3(1.4, -0.8, 2.2));
          vec3 rustTint = mix(vec3(0.86, 0.44, 0.25), vec3(1.12, 0.72, 0.48), macroVar);
          base *= rustTint;

          float polarNoise = noise3(p * 12.0) * 0.05;
          float polarCap = smoothstep(0.885, 0.945, abs(p.y) + polarNoise);
          base = mix(base, vec3(0.92, 0.89, 0.85), polarCap);
          return base;
        }

        float luma(vec3 c) {
          return dot(c, vec3(0.299, 0.587, 0.114));
        }

        // Optical density of Saturn's ring zones at normalized radius rNorm = R / R_planet
        float saturnRingOpticalDepth(float rNorm) {
          if (rNorm < 1.245 || rNorm > 2.318) return 0.0;
          float cRing = smoothstep(1.245, 1.27, rNorm) * (1.0 - smoothstep(1.515, 1.528, rNorm));
          float bRing = smoothstep(1.525, 1.54, rNorm) * (1.0 - smoothstep(1.944, 1.953, rNorm));
          float cassini = smoothstep(1.946, 1.956, rNorm) * (1.0 - smoothstep(2.018, 2.028, rNorm));
          float aRing = smoothstep(2.022, 2.032, rNorm) * (1.0 - smoothstep(2.260, 2.270, rNorm));
          float enckeGap = smoothstep(2.203, 2.208, rNorm) * (1.0 - smoothstep(2.216, 2.221, rNorm));
          float fRing = exp(-pow((rNorm - 2.302) / 0.008, 2.0));

          float ripple = 0.88 + 0.12 * sin(rNorm * 145.0) * cos(rNorm * 62.0);
          float density =
            cRing * 0.24 * ripple +
            bRing * 0.86 * (0.90 + 0.10 * sin(rNorm * 190.0)) +
            cassini * 0.04 +
            aRing * (0.58 * ripple) * (1.0 - enckeGap * 0.85) +
            fRing * 0.28;
          return clamp(density, 0.0, 0.94);
        }

        void main() {
          vec3 p = normalize(vLocalPos);

          // Sample photographic albedos
          vec3 earthCol = sampleSeamFree(uEarthMap, vUv);
          vec3 marsCol = sampleMarsTriplanar(p);
          vec3 moonCol = sampleSeamFree(uMoonMap, vUv);
          vec3 saturnCol = sampleSeamFree(uSaturnMap, vUv);
          vec3 uranusCol = sampleSeamFree(uUranusMap, vUv);
          vec3 neptuneCol = sampleSeamFree(uNeptuneMap, vUv);

          // Saturn north polar hexagon jet + subtle longitudinal ammonia cloud eddies for clear smooth rotation
          float saturnPolar = smoothstep(0.84, 0.985, abs(p.y));
          saturnCol = mix(saturnCol, saturnCol * vec3(0.76, 0.78, 0.84), saturnPolar * 0.55);
          float saturnEddies = noise3(vec3(p.x * 5.2, p.y * 16.0, p.z * 5.2));
          saturnCol *= mix(0.92, 1.08, saturnEddies);

          // Uranus gentle seasonal polar haze + subtle rotating methane cloud wisps
          float uranusPolar = smoothstep(0.68, 0.98, abs(p.y));
          uranusCol = mix(uranusCol, uranusCol * vec3(1.06, 1.09, 1.07) + vec3(0.04, 0.07, 0.07), uranusPolar * 0.45);
          float uranusWisp = smoothstep(0.56, 0.86, noise3(vec3(p.x * 4.5, p.y * 11.0, p.z * 4.5)));
          uranusCol = mix(uranusCol, uranusCol + vec3(0.08, 0.13, 0.14), uranusWisp * 0.42);

          // Detect Earth oceans vs continents/ice from photographic Blue Marble colors
          float isBlueWater = smoothstep(0.02, 0.14, earthCol.b - max(earthCol.r, earthCol.g * 0.92));
          float isCoastalTeal = smoothstep(0.03, 0.16, earthCol.g - earthCol.r * 1.15) * smoothstep(0.25, 0.55, earthCol.b);
          float isIce = smoothstep(0.76, 0.90, min(earthCol.r, min(earthCol.g, earthCol.b)));
          float earthOceanMask = clamp(max(isBlueWater, isCoastalTeal) * (1.0 - isIce), 0.0, 1.0);

          vec3 albedo =
            earthCol * uWeightsA.x +
            marsCol * uWeightsA.y +
            moonCol * uWeightsA.z +
            saturnCol * uWeightsB.x +
            uranusCol * uWeightsB.y +
            neptuneCol * uWeightsB.z;

          // Derive topographic / cloud-deck bump normals
          float du = 0.0018;
          float dv = 0.0022;
          float eC = luma(earthCol);
          float eR = luma(sampleSeamFree(uEarthMap, vec2(fract(vUv.x + du), vUv.y)));
          float eU = luma(sampleSeamFree(uEarthMap, vec2(vUv.x, clamp(vUv.y + dv, 0.0, 1.0))));

          float mC = luma(marsCol);
          float mR = luma(sampleMarsTriplanar(normalize(p + vec3(0.003, 0.0, 0.0))));
          float mU = luma(sampleMarsTriplanar(normalize(p + vec3(0.0, 0.003, 0.0))));

          float lC = luma(moonCol);
          float lR = luma(sampleSeamFree(uMoonMap, vec2(fract(vUv.x + du), vUv.y)));
          float lU = luma(sampleSeamFree(uMoonMap, vec2(vUv.x, clamp(vUv.y + dv, 0.0, 1.0))));

          float nC = luma(neptuneCol);
          float nR = luma(sampleSeamFree(uNeptuneMap, vec2(fract(vUv.x + du), vUv.y)));
          float nU = luma(sampleSeamFree(uNeptuneMap, vec2(vUv.x, clamp(vUv.y + dv, 0.0, 1.0))));

          float earthLandBump = (1.0 - earthOceanMask) * 2.2 + earthOceanMask * 0.18;
          float neptuneCirrusBump = smoothstep(0.42, 0.82, nC) * 0.65 + 0.12;
          float dHx =
            (eC - eR) * earthLandBump * uWeightsA.x +
            (mC - mR) * 3.8 * uWeightsA.y +
            (lC - lR) * 4.4 * uWeightsA.z +
            (nC - nR) * neptuneCirrusBump * uWeightsB.z;
          float dHy =
            (eC - eU) * earthLandBump * uWeightsA.x +
            (mC - mU) * 3.8 * uWeightsA.y +
            (lC - lU) * 4.4 * uWeightsA.z +
            (nC - nU) * neptuneCirrusBump * uWeightsB.z;

          vec3 n = normalize(vWorldNormal + vTangent * dHx + vBitangent * dHy);

          vec3 sunDir = normalize(uSunDir);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float ndlRaw = dot(n, sunDir);
          float ndlGeom = dot(vWorldNormal, sunDir);

          // Soft atmospheric terminator (Earth/Mars/Gas Giants vs crisp vacuum terminator on Moon)
          float giantWeight = uWeightsB.x + uWeightsB.y + uWeightsB.z;
          float termSoft = mix(-0.02, -0.18, clamp(uWeightsA.x + uWeightsA.y * 0.65 + giantWeight * 1.15, 0.0, 1.0));
          float diffuse = smoothstep(termSoft, 0.92, ndlRaw);

          // Authentic Lommel-Seeliger lunar regolith photometric response
          float ndv = max(dot(vWorldNormal, viewDir), 0.08);
          float lommel = max(ndlRaw, 0.0) / (max(ndlRaw, 0.0) + ndv * 0.52 + 0.01);
          float moonTerm = smoothstep(-0.02, 0.07, ndlGeom);
          float finalDiffuse = mix(diffuse, mix(diffuse, lommel * 1.32 * moonTerm, 0.65), uWeightsA.z);

          // Real Earth cloud shadows projected onto oceans and continents
          vec2 cloudShadowUv = vec2(fract(vUv.x - uCloudOffset + 0.004), clamp(vUv.y - 0.003, 0.0, 1.0));
          float cloudCover = luma(sampleSeamFree(uCloudsMap, cloudShadowUv));
          float cloudShadow = smoothstep(0.18, 0.85, cloudCover) * uWeightsA.x * 0.34;

          // Real-time Saturn ring shadow cast onto Saturn's globe
          float ringShadowAtten = 1.0;
          if (uWeightsB.x > 0.01) {
            vec3 tiltUp = normalize(uTiltUp);
            float denom = dot(sunDir, tiltUp);
            if (abs(denom) > 0.001) {
              vec3 relWorld = vWorldPos / max(uPlanetScale, 0.05);
              float tHit = -dot(relWorld, tiltUp) / denom;
              if (tHit > 0.0) {
                vec3 hitPoint = relWorld + tHit * sunDir;
                float rNorm = length(hitPoint) / 1.72;
                float ringOcc = saturnRingOpticalDepth(rNorm);
                ringShadowAtten = mix(1.0, 1.0 - ringOcc * 0.86, uWeightsB.x);
              }
            }
          }

          float ambient =
            0.028 * uWeightsA.x +
            0.022 * uWeightsA.y +
            0.010 * uWeightsA.z +
            0.036 * uWeightsB.x +
            0.044 * uWeightsB.y +
            0.032 * uWeightsB.z;

          // Ocean micro-wave specular solar reflection on Earth
          vec3 halfVec = normalize(sunDir + viewDir);
          float waveMicro = (noise3(p * 120.0) - 0.5) * 0.06;
          vec3 oceanNormal = normalize(n + (vTangent + vBitangent) * waveMicro);
          float oceanSpec = pow(max(dot(oceanNormal, halfVec), 0.0), 46.0)
            * earthOceanMask * uWeightsA.x * 0.72
            * smoothstep(0.0, 0.25, ndlGeom)
            * (1.0 - cloudShadow * 2.0);

          // Warm golden-amber / indigo twilight scattering along atmospheric terminators
          float twilightBand = exp(-pow((ndlGeom + 0.03) * 7.8, 2.0));
          vec3 twilightCol = (
            vec3(0.95, 0.42, 0.14) * uWeightsA.x +
            vec3(0.90, 0.38, 0.14) * uWeightsA.y +
            vec3(0.84, 0.54, 0.22) * uWeightsB.x +
            vec3(0.26, 0.74, 0.86) * uWeightsB.y +
            vec3(0.24, 0.42, 0.96) * uWeightsB.z
          ) * twilightBand * 0.18;

          // Subtle night-side coastal city lights on Earth dark hemisphere
          float nightMask = smoothstep(0.04, -0.22, ndlGeom) * uWeightsA.x;
          float landMask = (1.0 - earthOceanMask) * (1.0 - isIce);
          float latBand = 1.0 - smoothstep(0.45, 0.76, abs(p.y));
          float cityCluster = step(0.77, hash31(floor(p * 115.0))) * step(0.52, hash31(floor(p * 32.0)));
          vec3 cityLights = vec3(1.0, 0.76, 0.38) * cityCluster * landMask * latBand * nightMask * 0.65;

          // Inner Rayleigh atmospheric horizon haze
          float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), 3.6);
          vec3 limbTint =
            vec3(0.24, 0.64, 1.0) * uWeightsA.x +
            vec3(0.92, 0.48, 0.22) * uWeightsA.y +
            vec3(0.95, 0.78, 0.44) * uWeightsB.x +
            vec3(0.45, 0.92, 0.98) * uWeightsB.y +
            vec3(0.22, 0.60, 1.0) * uWeightsB.z;
          float limbStrength = (
            0.72 * uWeightsA.x +
            0.34 * uWeightsA.y +
            0.46 * uWeightsB.x +
            0.62 * uWeightsB.y +
            0.68 * uWeightsB.z
          ) * smoothstep(-0.24, 0.52, ndlGeom);

          vec3 color = albedo * (ambient + finalDiffuse * 1.15 * (1.0 - cloudShadow) * ringShadowAtten)
            + vec3(0.95, 0.98, 1.0) * oceanSpec
            + twilightCol
            + cityLights
            + limbTint * fresnel * limbStrength;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.scale.y = initialPhys.oblateY;
    tiltGroup.add(surfaceMesh);

    // Part 2: Photographic Earth Cloud Shell (smoothly fades out for other bodies)
    const cloudGeo = new THREE.SphereGeometry(1.744, 84, 56);
    const cloudMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uCloudsMap: { value: cloudsTex },
        uWeightsA: {
          value: new THREE.Vector3(
            initialPhys.weightsA[0],
            initialPhys.weightsA[1],
            initialPhys.weightsA[2]
          ),
        },
        uSunDir: { value: _sunDir.clone() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        void main() {
          vUv = uv;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uCloudsMap;
        uniform vec3 uWeightsA;
        uniform vec3 uSunDir;
        varying vec2 vUv;
        varying vec3 vWorldNormal;

        float sampleCloudSeamFree(vec2 uv) {
          vec3 c1 = texture2D(uCloudsMap, uv).rgb;
          float d1 = dot(c1, vec3(0.299, 0.587, 0.114));
          float seamEdge = min(uv.x, 1.0 - uv.x);
          float blend = smoothstep(0.045, 0.0, seamEdge);
          if (blend <= 0.001) return d1;
          vec3 c2 = texture2D(uCloudsMap, vec2(1.0 - uv.x, uv.y)).rgb;
          float d2 = dot(c2, vec3(0.299, 0.587, 0.114));
          return mix(d1, d2, blend * 0.5);
        }

        void main() {
          if (uWeightsA.x + uWeightsA.y < 0.002) discard;
          float cloudDensity = sampleCloudSeamFree(vUv);
          float poleFade = smoothstep(0.0, 0.10, vUv.y) * smoothstep(1.0, 0.90, vUv.y);
          cloudDensity *= mix(0.35, 1.0, poleFade);

          float ndl = dot(vWorldNormal, normalize(uSunDir));
          float lit = smoothstep(-0.14, 0.72, ndl);
          float twilight = exp(-pow((ndl + 0.03) * 7.2, 2.0));

          float earthAlpha = smoothstep(0.14, 0.88, cloudDensity) * 0.88 * uWeightsA.x;
          float marsAlpha = smoothstep(0.62, 0.96, cloudDensity) * 0.10 * uWeightsA.y;
          float alpha = (earthAlpha + marsAlpha) * (0.03 + 0.97 * lit);

          vec3 earthCloudCol = mix(vec3(0.97, 0.99, 1.0), vec3(1.0, 0.66, 0.42), twilight * 0.52);
          vec3 marsDustCol = vec3(0.90, 0.58, 0.36);
          float denom = max(earthAlpha + marsAlpha, 0.0001);
          vec3 col = (earthCloudCol * earthAlpha + marsDustCol * marsAlpha) / denom;

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.scale.y = initialPhys.oblateY;
    tiltGroup.add(cloudMesh);

    // Part 3: Atmospheric Rayleigh / Mie Limb Halo
    const atmoGeo = new THREE.SphereGeometry(1.87, 64, 48);
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uWeightsA: {
          value: new THREE.Vector3(
            initialPhys.weightsA[0],
            initialPhys.weightsA[1],
            initialPhys.weightsA[2]
          ),
        },
        uWeightsB: {
          value: new THREE.Vector3(
            initialPhys.weightsB[0],
            initialPhys.weightsB[1],
            initialPhys.weightsB[2]
          ),
        },
        uSunDir: { value: _sunDir.clone() },
      },
      vertexShader: `
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uWeightsA;
        uniform vec3 uWeightsB;
        uniform vec3 uSunDir;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float rim = clamp(0.64 - dot(-vWorldNormal, viewDir), 0.0, 1.0);
          float glow = pow(rim, 3.6);
          float ndl = dot(vWorldNormal, normalize(uSunDir));
          float sunSide = smoothstep(-0.32, 0.62, ndl);
          float sunset = exp(-pow((ndl + 0.08) * 5.0, 2.0));

          vec3 earthGlow = mix(vec3(0.24, 0.66, 1.0), vec3(0.98, 0.52, 0.24), sunset * 0.38) * 0.96 * uWeightsA.x;
          vec3 marsGlow = vec3(0.92, 0.46, 0.20) * 0.44 * uWeightsA.y;
          vec3 saturnGlow = vec3(0.95, 0.78, 0.44) * 0.56 * uWeightsB.x;
          vec3 uranusGlow = vec3(0.42, 0.92, 0.98) * 0.74 * uWeightsB.y;
          vec3 neptuneGlow = vec3(0.22, 0.58, 1.0) * 0.84 * uWeightsB.z;

          vec3 col = (earthGlow + marsGlow + saturnGlow + uranusGlow + neptuneGlow) * glow * (0.16 + 0.84 * sunSide);
          float alphaScale =
            uWeightsA.x * 0.94 +
            uWeightsA.y * 0.44 +
            uWeightsB.x * 0.56 +
            uWeightsB.y * 0.72 +
            uWeightsB.z * 0.82;
          gl_FragColor = vec4(col, glow * alphaScale);
        }
      `,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    atmoMesh.scale.y = initialPhys.oblateY;
    tiltGroup.add(atmoMesh);

    // Part 4: Planetary Ring System (Saturn concentric icy rings + Uranus narrow dark-ice rings)
    const ringGeo = new THREE.RingGeometry(PLANET_RADIUS * 1.24, PLANET_RADIUS * 2.34, 180, 1);
    ringGeo.rotateX(-Math.PI / 2);

    const ringMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uWeightsB: {
          value: new THREE.Vector3(
            initialPhys.weightsB[0],
            initialPhys.weightsB[1],
            initialPhys.weightsB[2]
          ),
        },
        uSunDir: { value: _sunDir.clone() },
        uTiltUp: { value: new THREE.Vector3(0, 1, 0) },
        uPlanetScale: { value: initialScale },
        uOblateY: { value: initialPhys.oblateY },
      },
      vertexShader: `
        varying float vRadiusNorm;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        void main() {
          vRadiusNorm = length(position.xz) / 1.72;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 uWeightsB;
        uniform vec3 uSunDir;
        uniform vec3 uTiltUp;
        uniform float uPlanetScale;
        uniform float uOblateY;

        varying float vRadiusNorm;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        void main() {
          float ringWeight = uWeightsB.x + uWeightsB.y;
          if (ringWeight < 0.002) discard;

          float r = vRadiusNorm;

          // --- Saturn concentric ring architecture (C, B, Cassini Division, A, Encke Gap, F) ---
          float cRing = smoothstep(1.245, 1.27, r) * (1.0 - smoothstep(1.515, 1.528, r));
          float bRing = smoothstep(1.525, 1.54, r) * (1.0 - smoothstep(1.944, 1.953, r));
          float cassini = smoothstep(1.946, 1.956, r) * (1.0 - smoothstep(2.018, 2.028, r));
          float aRing = smoothstep(2.022, 2.032, r) * (1.0 - smoothstep(2.260, 2.270, r));
          float enckeGap = smoothstep(2.203, 2.208, r) * (1.0 - smoothstep(2.216, 2.221, r));
          float keelerGap = smoothstep(2.253, 2.256, r) * (1.0 - smoothstep(2.260, 2.263, r));
          float fRing = exp(-pow((r - 2.302) / 0.0085, 2.0));

          float fineWaves = 0.88 + 0.08 * sin(r * 165.0) + 0.04 * cos(r * 340.0);
          float bWaves = 0.86 + 0.09 * sin(r * 210.0) + 0.05 * sin(r * 460.0);

          float saturnAlpha =
            cRing * 0.25 * fineWaves +
            bRing * 0.88 * bWaves +
            cassini * 0.035 +
            aRing * 0.58 * fineWaves * (1.0 - enckeGap * 0.88) * (1.0 - keelerGap * 0.72) +
            fRing * 0.30;

          vec3 cCol = vec3(0.56, 0.51, 0.46);
          vec3 bCol = mix(vec3(0.84, 0.76, 0.62), vec3(0.96, 0.90, 0.78), 0.5 + 0.5 * sin(r * 95.0));
          vec3 aCol = mix(vec3(0.76, 0.72, 0.65), vec3(0.87, 0.82, 0.73), 0.5 + 0.5 * cos(r * 130.0));
          vec3 fCol = vec3(0.88, 0.84, 0.76);

          float sDenom = max(cRing + bRing + aRing + fRing + cassini, 0.001);
          vec3 saturnCol = (cCol * cRing + bCol * bRing + aCol * aRing + fCol * fRing + vec3(0.28, 0.26, 0.24) * cassini) / sDenom;

          // --- Uranus narrow razor-sharp dark-ice rings (Epsilon + inner ringlets) ---
          float uEpsilon = exp(-pow((r - 1.655) / 0.011, 2.0)) * 0.56;
          float uDelta = exp(-pow((r - 1.585) / 0.0055, 2.0)) * 0.25;
          float uGamma = exp(-pow((r - 1.555) / 0.005, 2.0)) * 0.21;
          float uEta = exp(-pow((r - 1.515) / 0.005, 2.0)) * 0.17;
          float uBeta = exp(-pow((r - 1.475) / 0.0055, 2.0)) * 0.23;
          float uAlpha = exp(-pow((r - 1.435) / 0.0055, 2.0)) * 0.21;
          float uInner = exp(-pow((r - 1.375) / 0.008, 2.0)) * 0.12;
          float uranusAlpha = clamp(uEpsilon + uDelta + uGamma + uEta + uBeta + uAlpha + uInner, 0.0, 0.64);
          vec3 uranusCol = mix(vec3(0.56, 0.76, 0.82), vec3(0.76, 0.92, 0.96), uEpsilon * 1.4);

          float alpha = saturnAlpha * uWeightsB.x + uranusAlpha * uWeightsB.y;
          if (alpha < 0.003) discard;

          vec3 baseCol = (saturnCol * saturnAlpha * uWeightsB.x + uranusCol * uranusAlpha * uWeightsB.y) / max(alpha, 0.0001);

          // Real-time planet-on-ring shadow (corrected for oblate polar flattening)
          vec3 sunDir = normalize(uSunDir);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 tiltUp = normalize(uTiltUp);
          vec3 relNorm = vWorldPos / (1.72 * max(uPlanetScale, 0.05));
          float stretchFactor = (1.0 / max(uOblateY, 0.82)) - 1.0;
          vec3 relStretch = relNorm + tiltUp * dot(relNorm, tiltUp) * stretchFactor;
          vec3 sunStretch = normalize(sunDir + tiltUp * dot(sunDir, tiltUp) * stretchFactor);

          float proj = dot(relStretch, sunStretch);
          float planetShadow = 1.0;
          if (proj < 0.0) {
            float distAxis = sqrt(max(dot(relStretch, relStretch) - proj * proj, 0.0));
            planetShadow = smoothstep(0.955, 1.028, distAxis);
          }

          // Subtle ring phase illumination & icy forward/back scatter
          float sunIncidence = 0.78 + 0.22 * abs(dot(vWorldNormal, sunDir));
          float phaseScatter = 0.82 + 0.24 * pow(abs(dot(sunDir, viewDir)), 1.6);
          float illumination = mix(0.055, sunIncidence * phaseScatter, planetShadow);

          gl_FragColor = vec4(baseCol * illumination, alpha);
        }
      `,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    tiltGroup.add(ringMesh);

    // 6. Natural Multi-Temperature Deep-Space Starfield
    const starCount = 540;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 20 + Math.random() * 16;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 8;

      const temp = Math.random();
      const brightness = 0.42 + Math.random() * 0.58;
      if (temp < 0.25) {
        starColors[i * 3] = 0.78 * brightness;
        starColors[i * 3 + 1] = 0.88 * brightness;
        starColors[i * 3 + 2] = 1.0 * brightness;
      } else if (temp > 0.8) {
        starColors[i * 3] = 1.0 * brightness;
        starColors[i * 3 + 1] = 0.9 * brightness;
        starColors[i * 3 + 2] = 0.74 * brightness;
      } else {
        starColors[i * 3] = brightness;
        starColors[i * 3 + 1] = brightness;
        starColors[i * 3 + 2] = brightness;
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Interactive Drag & Horizontal Swipe on Canvas
    let isDragging = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let dragStartTime = 0;
    let velYaw = 0;
    let velPitch = 0;
    let userPitchOffset = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      dragStartTime = performance.now();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      velYaw = dx * 0.008;
      velPitch = dy * 0.005;
      surfaceMesh.rotation.y += velYaw;
      userPitchOffset = THREE.MathUtils.clamp(userPitchOffset + velPitch, -0.45, 0.45);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      const totalDx = e.clientX - pointerStartX;
      const totalDy = e.clientY - pointerStartY;
      const elapsed = performance.now() - dragStartTime;
      if (elapsed < 450 && Math.abs(totalDx) > 72 && Math.abs(totalDx) > Math.abs(totalDy) * 1.4) {
        onSwipeRef.current('left');
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('pointercancel', onPointerUp);

    // 8. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 9. Animation Loop with software WebGL pacing & butter-smooth rotation
    let frameId = 0;
    let disposed = false;
    let prevTime = performance.now();
    let smoothDelta = 1 / 60;
    let currentSpinRate = initialPhys.spinRate;
    let precessionPhase = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick(rafTimestamp?: number) {
      if (disposed) return;
      const now = typeof rafTimestamp === 'number' ? rafTimestamp : performance.now();
      const rawDelta = Math.min(Math.max((now - prevTime) / 1000, 0.001), 0.05);
      prevTime = now;
      smoothDelta = THREE.MathUtils.lerp(smoothDelta, rawDelta, 0.35);
      const delta = smoothDelta;

      const currentPlanet = activePlanetRef.current;
      const phys = PLANET_PHYSICAL[currentPlanet];

      // Smooth morphing of planet textures, atmosphere, clouds, and rings
      _targetWeightsA.set(phys.weightsA[0], phys.weightsA[1], phys.weightsA[2]);
      _targetWeightsB.set(phys.weightsB[0], phys.weightsB[1], phys.weightsB[2]);

      const currA = surfaceMat.uniforms.uWeightsA.value as THREE.Vector3;
      const currB = surfaceMat.uniforms.uWeightsB.value as THREE.Vector3;
      currA.x = THREE.MathUtils.damp(currA.x, _targetWeightsA.x, 2.2, delta);
      currA.y = THREE.MathUtils.damp(currA.y, _targetWeightsA.y, 2.2, delta);
      currA.z = THREE.MathUtils.damp(currA.z, _targetWeightsA.z, 2.2, delta);
      currB.x = THREE.MathUtils.damp(currB.x, _targetWeightsB.x, 2.2, delta);
      currB.y = THREE.MathUtils.damp(currB.y, _targetWeightsB.y, 2.2, delta);
      currB.z = THREE.MathUtils.damp(currB.z, _targetWeightsB.z, 2.2, delta);

      (cloudMat.uniforms.uWeightsA.value as THREE.Vector3).copy(currA);
      (atmoMat.uniforms.uWeightsA.value as THREE.Vector3).copy(currA);
      (atmoMat.uniforms.uWeightsB.value as THREE.Vector3).copy(currB);
      (ringMat.uniforms.uWeightsB.value as THREE.Vector3).copy(currB);

      // Smooth oblate spheroid polar flattening (rings stay circular inside tiltGroup)
      const nextOblateY = THREE.MathUtils.damp(surfaceMesh.scale.y, phys.oblateY, 2.6, delta);
      surfaceMesh.scale.y = nextOblateY;
      cloudMesh.scale.y = nextOblateY;
      atmoMesh.scale.y = nextOblateY;
      ringMat.uniforms.uOblateY.value = nextOblateY;

      // Smooth scale adaptation so Page 2 planets maximize screen presence without clipping
      const targetScale = computeResponsiveScale(
        currentPlanet,
        pageModeRef.current,
        camera.aspect
      );
      const nextScale = THREE.MathUtils.damp(planetRoot.scale.x, targetScale, 2.6, delta);
      planetRoot.scale.setScalar(nextScale);
      surfaceMat.uniforms.uPlanetScale.value = nextScale;
      ringMat.uniforms.uPlanetScale.value = nextScale;

      // Smooth axial tilt interpolation
      const targetTilt = THREE.MathUtils.degToRad(PLANETS[currentPlanet].axialTiltDeg);
      tiltGroup.rotation.z = THREE.MathUtils.damp(tiltGroup.rotation.z, targetTilt, 2.4, delta);

      // Smoothly damped continuous axial rotation + pointer inertia + gentle ring revolution
      currentSpinRate = THREE.MathUtils.damp(currentSpinRate, phys.spinRate, 3.2, delta);
      if (!isDragging) {
        surfaceMesh.rotation.y += delta * currentSpinRate + velYaw * (delta * 60);
        velYaw *= Math.exp(-5.0 * delta);
        velPitch *= Math.exp(-5.0 * delta);
      }
      ringMesh.rotation.y += delta * 0.06;

      const cloudDelta = surfaceMesh.rotation.y * 0.12 + now * 0.000018;
      cloudMesh.rotation.y = surfaceMesh.rotation.y + cloudDelta;
      surfaceMat.uniforms.uCloudOffset.value = (cloudDelta / (Math.PI * 2)) % 1;

      // Subtle 3D orbital gyroscopic sway on Page 2 for fluid spatial presence
      if (pageModeRef.current === 'connect' && !isDragging) {
        precessionPhase += delta * 0.55;
      }
      const targetYawSway =
        pageModeRef.current === 'connect' ? Math.sin(precessionPhase) * 0.12 : 0;
      const targetPitchSway =
        pageModeRef.current === 'connect' ? Math.cos(precessionPhase * 0.7) * 0.045 : 0;
      planetRoot.rotation.y = THREE.MathUtils.damp(planetRoot.rotation.y, targetYawSway, 2.4, delta);

      const targetPitch = THREE.MathUtils.clamp(
        phys.viewPitch + targetPitchSway + userPitchOffset,
        -0.55,
        0.65
      );
      planetRoot.rotation.x = THREE.MathUtils.damp(planetRoot.rotation.x, targetPitch, 4.2, delta);

      // Update world matrices before extracting tiltGroup's ring-plane normal for shadows
      planetRoot.updateMatrixWorld(true);
      _tiltUp.set(0, 1, 0).transformDirection(tiltGroup.matrixWorld);
      (surfaceMat.uniforms.uTiltUp.value as THREE.Vector3).copy(_tiltUp);
      (ringMat.uniforms.uTiltUp.value as THREE.Vector3).copy(_tiltUp);

      stars.rotation.y = now * 0.00001;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(() => tick());
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('pointercancel', onPointerUp);
      domEl.removeEventListener('webglcontextlost', handleContextLost);
      domEl.removeEventListener('webglcontextrestored', handleContextRestored);

      surfaceGeo.dispose();
      surfaceMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      earthTex.dispose();
      marsTex.dispose();
      moonTex.dispose();
      cloudsTex.dispose();
      saturnTex.dispose();
      uranusTex.dispose();
      neptuneTex.dispose();
      renderer.dispose();

      if (domEl.parentNode === container) {
        container.removeChild(domEl);
      }
    };
  }, []);

  if (contextLost) {
    const planet = PLANETS[activePlanet];
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="h-64 w-64 rounded-full border border-white/20 shadow-2xl"
          style={{
            background: `radial-gradient(circle at 32% 32%, ${planet.accentHex}, #0f172a 75%)`,
          }}
          aria-label={`${planet.name} 3D fallback preview`}
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="h-full w-full cursor-grab active:cursor-grabbing select-none touch-pan-y"
      aria-label={`Interactive 3D rotating ${PLANETS[activePlanet].name} globe. Drag to rotate or swipe to switch celestial bodies.`}
    />
  );
}
