import earthBg from '../assets/images/earth_closeup_bg_1794655884855.jpg';
import marsBg from '../assets/images/mars_closeup_bg_1794655885439.jpg';
import moonBg from '../assets/images/moon_closeup_bg_1794655886254.jpg';
import neptuneBg from '../assets/images/neptune_closeup_bg_1794742637267.jpg';
import saturnBg from '../assets/images/saturn_closeup_bg_1794742635804.jpg';
import uranusBg from '../assets/images/uranus_closeup_bg_1794742636629.jpg';

export type PlanetId = 'earth' | 'mars' | 'moon' | 'saturn' | 'uranus' | 'neptune';

export interface PlanetProfile {
  id: PlanetId;
  indexLabel: string;
  name: string;
  classification: string;
  accentHex: string;
  atmosphereHex: string;
  meteorGlowHex: string;
  backgroundImage: string;
  backgroundAlt: string;
  axialTiltDeg: number;
  telemetry: {
    meanRadius: string;
    surfaceGravity: string;
    rotationPeriod: string;
    atmosphere: string;
  };
  markdownDescription: string;
}

export const PLANET_ORDER: PlanetId[] = ['earth', 'mars', 'moon'];
export const OUTER_PLANET_ORDER: PlanetId[] = ['saturn', 'uranus', 'neptune'];
export const ALL_PLANET_IDS: PlanetId[] = [...PLANET_ORDER, ...OUTER_PLANET_ORDER];

export const PLANETS: Record<PlanetId, PlanetProfile> = {
  earth: {
    id: 'earth',
    indexLabel: '01',
    name: 'Earth',
    classification: 'Terrestrial Hydrosphere Planet',
    accentHex: '#38BDF8',
    atmosphereHex: '#2563EB',
    meteorGlowHex: '#60A5FA',
    backgroundImage: earthBg,
    backgroundAlt: 'Close-up orbital photograph of Earth curvature with deep blue oceans, cloud swirls, and cerulean atmospheric limb',
    axialTiltDeg: 23.44,
    telemetry: {
      meanRadius: '6,371.0 km',
      surfaceGravity: '9.81 m/s²',
      rotationPeriod: '23h 56m 04s',
      atmosphere: 'N₂ 78.1% · O₂ 20.9%',
    },
    markdownDescription: `### 1. Subterranean Hydrous Reservoirs in the Mantle Transition Zone

At depths between 410 and 660 kilometers—a region defined as the **mantle transition zone**—extreme lithostatic pressures ($14\\text{ to }24\\text{ GPa}$) transform the abundant upper-mantle mineral olivine into its high-pressure polymorph, **ringwoodite** ($\\gamma\\text{-(Mg,Fe)}_2\\text{SiO}_4$). Seismological tomography and high-pressure diamond-anvil cell experiments indicate that ringwoodite possesses a spinel crystal structure capable of incorporating up to $1.5\\%\\text{ to }2.5\\%$ of its weight as hydroxide ions ($\\text{OH}^-$) within lattice defects. Consequently, this zone functions as a solid-state geochemical reservoir, sequestering an estimated volume of bound water equivalent to **one to three times the total mass of Earth’s surface hydrosphere**.

### 2. Paleobiological Phototrophy and the "Purple Earth" Hypothesis

Prior to the evolutionary dominance of oxygenic photosynthesis via chlorophyll, Archean and early Proterozoic marine ecosystems were likely dominated by haloarchaea utilizing **bacteriorhodopsin**—a transmembrane proton-pump protein bound to the chromophore **retinal**. Whereas chlorophyll exhibits peak photon absorption in the blue ($\\sim 430\\text{ nm}$) and red ($\\sim 660\\text{ nm}$) wavelengths while reflecting green light, retinal demonstrates maximal absorbance in the green-yellow spectrum ($\\sim 568\\text{ nm}$). Under this primitive bioenergetic regime, high concentrations of surface phototrophs would have backscattered red and blue wavelengths, imparting a distinct **violet-magenta spectral signature** to early terrestrial oceans.

### 3. Continuous Microseismic Free Oscillations

Earth exhibits persistent, low-amplitude background seismic oscillations—commonly termed the **Earth's hum**—occurring at frequencies below $10\\text{ mHz}$ (periods of $100\\text{ to }300\\text{ seconds}$). Broadband seismometer arrays reveal that these spheroidal and toroidal free oscillations persist independently of discrete tectonic earthquakes. Spectral modeling attributes this continuous mechanical excitation primarily to **infragravity ocean waves** interacting with bathymetric topography along continental shelves, which transfers acoustic pressure fluctuations directly into the lithosphere and drives global elastic resonance.

### 4. Terrestrial Analogues for Extraterrestrial Astrobiology and Geomorphology

Specific hyper-arid and cryospheric regions on Earth serve as empirical testing grounds for planetary science due to their close geochemical and climatic parallels to extraterrestrial bodies:

* **The Atacama Desert (Chile):** Hyper-arid core regions experience precipitation rates below $1\\text{ mm/year}$, leading to the accumulation of **perchlorates** and nitrates in regolith soils that closely replicate the oxidizing surface chemistry observed on Mars.
* **The McMurdo Dry Valleys (Antarctica):** Katabatic winds descending from the polar plateau reach velocities exceeding $300\\text{ km/h}$, driving sublimation rates that exceed precipitation. This results in an ice-free, cryotic desert environment utilized to model subsurface ice stability and endolithic microbial survival on Mars and icy moons.

### 5. Secular Variation and Advection in the Geodynamo

Earth’s geomagnetic field is sustained by convective fluid dynamics within the liquid iron-nickel **outer core**, a process governed by magnetohydrodynamic equations. Because turbulent core flow is non-uniform, the geomagnetic dipole axis undergoes continuous **secular variation**. Over the past three decades, satellite magnetometry has documented a rapid acceleration in the drift velocity of the magnetic north pole—increasing from $\\sim 15\\text{ km/year}$ to roughly $45\\text{–}55\\text{ km/year}$ toward Siberia—driven by competing high-latitude flux lobes at the core-mantle boundary.

### 6. Tidal Dissipation and Secular Rotational Deceleration

Gravitational interactions within the Earth–Moon–Sun system induce tidal bulges in both the hydrosphere and the solid lithosphere. Because Earth's axial rotation outpaces the Moon's orbital angular velocity, viscous friction carries the tidal bulge slightly ahead of the Earth–Moon axis. This asymmetric mass distribution exerts a net braking torque on Earth's rotation while transferring angular momentum to the Moon—causing the lunar semi-major axis to expand by **$3.8\\text{ cm/year}$** (verified via Lunar Laser Ranging) and increasing the length of the terrestrial solar day by approximately **$1.7\\text{ to }2.3\\text{ milliseconds per century}$**.`,
  },
  mars: {
    id: 'mars',
    indexLabel: '02',
    name: 'Mars',
    classification: 'Arid Terrestrial Cryosphere Planet',
    accentHex: '#F97316',
    atmosphereHex: '#EA580C',
    meteorGlowHex: '#FB923C',
    backgroundImage: marsBg,
    backgroundAlt: 'Close-up orbital photograph of Mars surface with rusted iron oxide canyon terrain and thin amber atmospheric haze',
    axialTiltDeg: 25.19,
    telemetry: {
      meanRadius: '3,389.5 km',
      surfaceGravity: '3.72 m/s²',
      rotationPeriod: '24h 39m 35s',
      atmosphere: 'CO₂ 95.3% · N₂ 2.7%',
    },
    markdownDescription: `### 1. Planetary Structure and Geochemical Composition

Mars is a differentiated terrestrial planet with a mean radius of approximately $3,389.5\\text{ km}$ (roughly $0.53\\ R_{\\oplus}$) and a surface gravitational acceleration of $3.72\\text{ m/s}^2$. Its interior consists of a dense, liquid iron-nickel-sulfur **core** ($r \\approx 1,830\\text{ km}$), a silicate **mantle**, and a basaltic **crust** averaging $24\\text{ to }72\\text{ km}$ in thickness. The planet's characteristic reddish albedo derives from pervasive **iron(III) oxide** ($\\text{Fe}_2\\text{O}_3$, hematite) dust covering its regolith, generated through ancient aqueous oxidation and ongoing mechanical weathering.

### 2. Atmospheric Dynamics and Barometric Extremes

The Martian atmosphere is hyper-tenuous, exhibiting a mean surface pressure of **$610\\text{ Pa}$** ($0.6\\%$ of Earth's sea-level pressure), which sits right near the **triple point of water** ($611.657\\text{ Pa}$ at $273.16\\text{ K}$). Consequently, pure liquid water is thermodynamically unstable on the surface, rapidly sublimating or boiling away. The atmospheric composition is dominated by:

* **Carbon Dioxide ($\\text{CO}_2$):** $95.32\\%$
* **Molecular Nitrogen ($\\text{N}_2$):** $2.7\\%$
* **Argon ($\\text{Ar}$):** $1.6\\%$
* **Trace Gases ($\\text{O}_2$, $\\text{CO}$, $\\text{H}_2\\text{O}$, $\\text{CH}_4$):** $<0.4\\%$

Seasonal temperature fluctuations drive up to $25\\%\\text{ to }30\\%$ of the atmospheric $\\text{CO}_2$ to condense onto the winter polar ice caps as dry ice, creating massive global barometric pressure cycles and baroclinic dust storms that can envelop the entire planet.

### 3. Crustal Dichotomy and Extreme Geomorphology

Mars displays a striking global **crustal dichotomy** separating the heavily cratered, high-elevation southern highlands from the smooth, low-elevation northern plains (such as Vastitas Borealis). Without active plate tectonics, stationary mantle plumes built colossal volcanic provinces over billions of years:

* **Olympus Mons:** The largest known shield volcano in the solar system, rising **$21.9\\text{ km}$** above the Martian datum with a basal diameter of $\\sim 600\\text{ km}$.
* **Valles Marineris:** A tectonic rift and erosional canyon system spanning **$4,000\\text{ km}$** in length and reaching depths of up to **$7\\text{ km}$**, formed primarily by lithospheric fracturing associated with the uplift of the adjacent Tharsis volcanic bulge.

### 4. Magnetospheric Loss and Paleoclimate Evolution

Seismic and orbital magnetometry data indicate that Mars lost its global intrinsic **geodynamo** approximately $4.0\\text{ to }4.1\\text{ billion years ago}$ as its core cooled and convective heat flux dropped below the critical threshold. Deprived of a magnetospheric shield, the early Martian atmosphere was stripped away by **solar wind sputtering** and extreme ultraviolet (EUV) photoionization. This atmospheric escape transformed Mars from a Noachian-era world capable of sustaining persistent liquid surface water—evidenced by phyllosilicate clays, dendritic valley networks, and lacustrine delta deposits (e.g., Jezero Crater)—into the hyper-arid, cryotic desert observed today.

### 5. Cryospheric Reservoirs and Regolith Chemistry

While liquid surface water is absent, Mars retains substantial water reserves locked within its **cryosphere**. Radar sounding confirms vast deposits of water ice beneath layered $\\text{CO}_2$ ice at the polar caps, alongside extensive mid-latitude subsurface ice sheets buried beneath protective regolith. Geochemically, the Martian topsoil contains high concentrations ($0.5\\%\\text{ to }1\\%$) of **perchlorate salts** ($\\text{ClO}_4^-$), which act as potent freezing-point depressants capable of forming transient, microscopic liquid brines under specific diurnal temperature and humidity conditions.

### 6. Orbital Mechanics and Axial Obliquity

Mars orbits the Sun at a semi-major axis of $1.524\\text{ AU}$ with a high orbital eccentricity ($e = 0.0934$), resulting in pronounced seasonal asymmetry between the northern and southern hemispheres. Its sidereal rotation period (**sol**) is **$24\\text{ hours, }39\\text{ minutes, and }35\\text{ seconds}$**, closely matching Earth's diurnal cycle. However, lacking a large stabilizing moon, Mars experiences chaotic oscillations in its **axial obliquity**—varying between $15^\\circ$ and $35^\\circ$ (and potentially up to $60^\\circ$) over million-year timescales—which periodically triggers dramatic climate shifts and equatorial glaciation.`,
  },
  moon: {
    id: 'moon',
    indexLabel: '03',
    name: 'Moon',
    classification: 'Differentiated Natural Satellite',
    accentHex: '#CBD5E1',
    atmosphereHex: '#94A3B8',
    meteorGlowHex: '#E2E8F0',
    backgroundImage: moonBg,
    backgroundAlt: 'Close-up orbital photograph of the Moon featuring dark basalt maria plains and silver-gray cratered highlands',
    axialTiltDeg: 6.68,
    telemetry: {
      meanRadius: '1,737.4 km',
      surfaceGravity: '1.62 m/s²',
      rotationPeriod: '27.32 days (sync)',
      atmosphere: 'Surface Exosphere (<10 t)',
    },
    markdownDescription: `### 1. Formation and Impact Origin (The Giant-Impact Hypothesis)

The prevailing scientific consensus posits that the Moon formed approximately $4.51\\text{ billion years ago}$, shortly after the accretion of the solar system, via the **Giant-Impact Hypothesis**. A Mars-sized protoplanet, commonly designated **Theia**, made an oblique impact with the proto-Earth. The resulting high-energy collision ejected vaporized and molten silicate mantles of both bodies into a circumterrestrial disc, which rapidly accreted via gravitational instability to form the Earth-Moon system. This violent genesis accounts for the Moon's depleted volatile inventory and its relatively small metallic core compared to Earth.

### 2. Orbital Mechanics, Synchronous Rotation, and Libration

The Moon orbits Earth at a mean semi-major axis of approximately $384,400\\text{ km}$ with an orbital eccentricity of $0.0549$. Due to billions of years of **tidal dissipation** and gravitational locking by Earth, the Moon has achieved **synchronous rotation**: its rotational period ($27.32\\text{ days}$) precisely matches its orbital period around Earth. Consequently, a single hemisphere faces Earth permanently (the near side), while the far side remained entirely unobserved until spacecraft imaging in 1959. However, due to orbital eccentricity and axial tilt variations, observers on Earth experience **libration**, permitting up to $\\sim 59\\%$ of the lunar surface to be viewed from Earth over time.

### 3. Topographical and Geological Dichotomy

The lunar surface exhibits a pronounced structural dichotomy between two primary geological terranes:

* **The Maria (Dark Plains):** Vast basaltic plains covering roughly $16\\%$ of the lunar surface, formed by ancient quiet effusions of low-viscosity volcanic lava flooding impact basins between $3.1\\text{ and }3.8\\text{ billion years ago}$. They are rich in iron and magnesium (mafic silicates).
* **The Highlands (Terrae):** Highly cratered, mountainous terrain composed predominantly of **anorthosite**—a calcium- and aluminum-rich silicate rock that floated to the surface of the primordial lunar magma ocean.

### 4. Absence of Atmosphere and Exospheric Dynamics

The Moon possesses no substantive atmosphere; instead, it is enveloped by an extremely tenuous **surface-boundary exosphere** with a total mass estimated at less than $10\\text{ metric tons}$. Gas molecules in the exosphere (including helium, neon, argon, and sodium) originate from solar wind implantation, micrometeoroid impact vaporization, and radioactive outgassing from the lunar interior. Because it lacks a dynamic atmosphere or a global dipole magnetic field, the surface is directly exposed to unattenuated solar radiation, galactic cosmic rays, and hypervelocity micrometeoroid bombardment, which continuously pulverizes surface rock into a fine fragmental layer known as **regolith**.

### 5. Volatiles, Polar Craters, and Water Ice

For decades, the Moon was characterized as completely anhydrous. However, orbital spectroscopy and impact-probe data (such as NASA's LCROSS mission) have confirmed the presence of significant **water ice ($\\text{H}_2\\text{O}$) and hydroxyl ($\\text{OH}^-$)** deposits. These volatiles are predominantly sequestered within permanently shadowed regions (PSRs) inside deep impact craters near the lunar north and south poles—such as Shackleton and Cabeus craters—where temperatures remain below $-150^\\circ\\text{C}$ to $-240^\\circ\\text{C}$, acting as ultra-cold cryogenic traps.

### 6. Internal Structure and Seismicity

Geophysical data gathered by Apollo-era seismometer networks indicate that the Moon is differentiated into concentric internal layers:

* **Metallic Core:** A small, partially molten iron-rich core with a radius of approximately $330\\text{ to }360\\text{ km}$, containing a small liquid outer zone and a denser solid inner core.
* **Mantle:** A thick silicate mantle composed largely of olivine and pyroxene, where deep moonquakes originate due to Earth-induced tidal stresses.
* **Crust:** A globally asymmetric crust averaging roughly $30\\text{ to }50\\text{ km}$ thick on the near side, but extending up to $60\\text{ to }100\\text{ km}$ thick on the rugged far side.`,
  },
  saturn: {
    id: 'saturn',
    indexLabel: '01',
    name: 'Saturn',
    classification: 'Ringed Gas Giant Planet',
    accentHex: '#FACC15',
    atmosphereHex: '#D97706',
    meteorGlowHex: '#FDE047',
    backgroundImage: saturnBg,
    backgroundAlt: 'Close-up Cassini orbital photograph of Saturn golden cloud belts and translucent icy rings',
    axialTiltDeg: 26.73,
    telemetry: {
      meanRadius: '58,232 km',
      surfaceGravity: '10.44 m/s²',
      rotationPeriod: '10h 33m 38s',
      atmosphere: 'H₂ 96.3% · He 3.25%',
    },
    markdownDescription: '',
  },
  uranus: {
    id: 'uranus',
    indexLabel: '02',
    name: 'Uranus',
    classification: 'Tilted Ice Giant Planet',
    accentHex: '#67E8F9',
    atmosphereHex: '#06B6D4',
    meteorGlowHex: '#A5F3FC',
    backgroundImage: uranusBg,
    backgroundAlt: 'Close-up Voyager orbital photograph of Uranus pale cyan methane atmosphere and tilted faint rings',
    axialTiltDeg: 97.77,
    telemetry: {
      meanRadius: '25,362 km',
      surfaceGravity: '8.69 m/s²',
      rotationPeriod: '17h 14m 24s',
      atmosphere: 'H₂ 82.5% · He 15.2% · CH₄ 2.3%',
    },
    markdownDescription: '',
  },
  neptune: {
    id: 'neptune',
    indexLabel: '03',
    name: 'Neptune',
    classification: 'Dynamic Ice Giant Planet',
    accentHex: '#3B82F6',
    atmosphereHex: '#1D4ED8',
    meteorGlowHex: '#60A5FA',
    backgroundImage: neptuneBg,
    backgroundAlt: 'Close-up Voyager 2 orbital photograph of Neptune deep azure cloud bands and white methane cirrus streaks',
    axialTiltDeg: 28.32,
    telemetry: {
      meanRadius: '24,622 km',
      surfaceGravity: '11.15 m/s²',
      rotationPeriod: '16h 06m 36s',
      atmosphere: 'H₂ 80.0% · He 19.0% · CH₄ 1.5%',
    },
    markdownDescription: '',
  },
};

export function getNextPlanetId(
  current: PlanetId,
  _direction: 'left' | 'right' = 'right',
  order: PlanetId[] = PLANET_ORDER
): PlanetId {
  const idx = order.indexOf(current);
  if (idx === -1) return order[0];
  return order[(idx + 1) % order.length];
}
