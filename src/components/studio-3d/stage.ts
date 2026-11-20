// The stage with baked light. Nothing is lit at runtime: Cycles baked one
// lightmap per light source (studio-3d/bake.py) and a scenario is a mix of
// those maps. The model is shown as a grey card maquette; light is the only
// thing that changes.
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  Box3,
  BoxGeometry,
  BufferAttribute,
  Color,
  ConeGeometry,
  DoubleSide,
  FrontSide,
  HalfFloatType,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NoColorSpace,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {
  type Channels,
  type Pose,
  type ScenarioId,
  scenarioById,
} from "./scenarios";

const base = "/studio-3d/baked/";
const layers = [
  "sky",
  "fill",
  "sun",
  "evening",
  "tubes",
  "spot",
  "set",
] as const;
type Layer = (typeof layers)[number];

interface BakeMeta {
  groundExtent: number;
  layers: Record<Layer, { scale: number; groundScale: number }>;
  floor: { x: number; z: number; u: number; v: number }[];
}

// How strongly each baked map counts at full channel value. Tuned by eye.
const gain: Record<Layer, number> = {
  sky: 2.1,
  fill: 0.2,
  sun: 11,
  evening: 6,
  tubes: 1.5,
  spot: 3.2,
  set: 0.14,
};
// What the daylight maps read on open ground far from the model.
const far: Record<Layer, number> = {
  sky: 1,
  fill: 1,
  sun: Math.sin(MathUtils.degToRad(34)) / Math.PI,
  evening: Math.sin(MathUtils.degToRad(11)) / Math.PI,
  tubes: 0,
  spot: 0,
  set: 0,
};

// The maquette: grey card, black cloth, one wood. Matched on the Blender material names.
const card: [string, string][] = [
  ["Mineral white", "#e2e2de"],
  ["Painted parapet", "#d6d6d1"],
  ["Acoustic panel", "#dcdcd7"],
  ["Exposed ceiling", "#96968f"],
  ["Truss aluminium", "#b9b9b5"],
  ["Chrome", "#b0b0ac"],
  ["Moving head", "#232322"],
  ["Powder coat", "#d2d2ce"],
  ["Opal", "#e8e8e4"],
  ["Drawing paper", "#ecece8"],
  ["Polished aggregate", "#b4b4b0"],
  ["Cast concrete", "#96968f"],
  ["Window aluminium", "#b9b9b5"],
  ["Stainless", "#b0b0ac"],
  ["Petrol enamel", "#55585a"],
  ["Power line", "#55585a"],
  ["Oxblood", "#6a6a67"],
  ["Honey beech", "#c9a276"],
  ["Black molton", "#161615"],
  ["Graphite", "#232322"],
  ["Rubber", "#1a1a19"],
  ["Milk crate", "#8a8a86"],
  ["Terracotta", "#8f8f8a"],
  ["Soil", "#2a2a28"],
  ["Leaf", "#4d544c"],
];

// The same surfaces as they are in the hero photo. The way in from the
// homepage starts in these colours and turns to card as the camera leaves.
const real: [string, string][] = [
  ["Mineral white", "#d0dbd8"],
  ["Painted parapet", "#a3aba3"],
  ["Acoustic panel", "#e4ecdf"],
  ["Exposed ceiling", "#f0f4e4"],
  ["Polished aggregate", "#a1ada7"],
  ["Cast concrete", "#b3b4ae"],
  ["Window aluminium", "#c4cbc8"],
  ["Truss aluminium", "#b9c0b4"],
  ["Chrome", "#c9cdc9"],
  ["Moving head", "#0a0e0d"],
  ["Powder coat", "#dfe2dd"],
  ["Oxblood", "#a03a20"],
  ["Petrol enamel", "#123a52"],
  ["Power line", "#b08a10"],
  ["Black molton", "#0a0f14"],
  ["Honey beech", "#dcb777"],
];

const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const samplers = layers.map((l) => `uniform sampler2D ${l}Map;`).join("\n");
const sum = (uv: string) =>
  layers
    .map(
      (l, i) => `weights[${i}] * pow(texture2D(${l}Map, ${uv}).rgb, vec3(2.0))`,
    )
    .join(" + ");
const fogChunk = `
  float haze = smoothstep(fogNear, fogFar, length(vView));
  colour = mix(colour, fogColour, haze);`;

const cardShader = {
  vertexShader: `varying vec2 vUv; varying vec3 vView;
    void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vView = mv.xyz; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `${samplers}
    uniform vec3 weights[7]; uniform vec3 albedo; uniform vec3 photo; uniform float look; uniform vec3 glow; uniform float opacity;
    uniform vec3 fogColour; uniform float fogNear; uniform float fogFar;
    varying vec2 vUv; varying vec3 vView;
    void main(){
      vec3 light = ${sum("vUv")};
      vec3 colour = mix(albedo, photo, look) * light + glow;
      ${fogChunk}
      gl_FragColor = vec4(colour, opacity);
    }`,
};

// The ground is the haze itself, darkened where the model shades it and
// lit where lamps spill out of it.
const groundShader = {
  vertexShader: `varying vec2 vUv; varying vec3 vView; uniform float extent;
    void main(){ vec4 world = modelMatrix * vec4(position, 1.0); vUv = vec2(world.x / extent + 0.5, world.z / extent + 0.5);
      vec4 mv = viewMatrix * world; vView = mv.xyz; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `${samplers}
    uniform vec3 weights[7]; uniform vec3 open; uniform float daylight;
    uniform vec3 fogColour; uniform float fogNear; uniform float fogFar;
    varying vec2 vUv; varying vec3 vView;
    void main(){
      vec3 day = weights[0] * pow(texture2D(skyMap, vUv).rgb, vec3(2.0)) + weights[1] * pow(texture2D(fillMap, vUv).rgb, vec3(2.0))
        + weights[2] * pow(texture2D(sunMap, vUv).rgb, vec3(2.0)) + weights[3] * pow(texture2D(eveningMap, vUv).rgb, vec3(2.0));
      vec3 lamps = weights[4] * pow(texture2D(tubesMap, vUv).rgb, vec3(2.0)) + weights[5] * pow(texture2D(spotMap, vUv).rgb, vec3(2.0))
        + weights[6] * pow(texture2D(setMap, vUv).rgb, vec3(2.0));
      vec3 shade = mix(vec3(1.0), clamp(day / max(open, vec3(0.0001)), 0.0, 1.6), daylight);
      // Fade the map out towards its edge so the plane has no border.
      float edge = smoothstep(0.5, 0.36, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
      vec3 colour = fogColour * mix(vec3(1.0), shade, edge) + 0.5 * lamps * edge;
      ${fogChunk}
      gl_FragColor = vec4(colour, 1.0);
    }`,
};

const grain = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 46.32); return fract(p.x * p.y); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = vec4(c.rgb + (hash(gl_FragCoord.xy) - 0.5) * 0.04, c.a); }`,
};

const beamMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { strength: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float strength; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float rim = pow(abs(dot(normalize(vN), normalize(vV))), 2.2); float along = pow(clamp(vY, 0.0, 1.0), 1.6);
        gl_FragColor = vec4(vec3(1.0, 0.96, 0.9) * rim * along * strength, 1.0); }`,
  });

export interface StageOptions {
  signal: AbortSignal;
  scenario: ScenarioId;
  view: Pose;
  /** Called whenever the rendered haze colour changes, with a CSS colour that matches the canvas edge. */
  onHaze?: (css: string) => void;
}

export interface Stage {
  /** Fade to a scenario. */
  setScenario(id: ScenarioId, ms?: number): void;
  /** Move the camera. */
  setView(pose: Pose, ms?: number): void;
  /** How far the model wears the hero photo's colours and daylight instead of grey card: 1 photo, 0 card. */
  setLook(amount: number): void;
  dispose(): void;
}

export async function createStage(
  host: HTMLElement,
  options: StageOptions,
): Promise<Stage> {
  const { signal } = options;
  signal.throwIfAborted();
  const still = reduced();

  const loader = new TextureLoader();
  const lightmap = async (name: string) => {
    const texture = await loader.loadAsync(`${base}${name}.webp`);
    texture.flipY = false;
    texture.colorSpace = NoColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = LinearFilter;
    return texture;
  };
  const [gltf, meta, maps, groundMaps] = await Promise.all([
    new GLTFLoader().loadAsync(`${base}studio-baked.glb`),
    fetch(`${base}bake.json`, { signal }).then(
      (r) => r.json() as Promise<BakeMeta>,
    ),
    Promise.all(layers.map((l) => lightmap(l))),
    Promise.all(layers.map((l) => lightmap(`ground-${l}`))),
  ]);
  signal.throwIfAborted();

  const renderer = new WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
  });
  const ratio = Math.min(
    window.devicePixelRatio,
    host.clientWidth < 700 ? 1.5 : 2,
  );
  renderer.setPixelRatio(ratio);
  renderer.toneMapping = ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Schnittmodell des Studios mit Shooting-Fläche, Fensterfront, Besprechungstisch und Küche.",
  );
  canvas.style.cssText =
    "display:block;width:100%;height:100%;touch-action:pan-y";

  const scene = new Scene();
  const fogColour = new Color("#a9a9a6");
  scene.background = fogColour;
  const camera = new PerspectiveCamera(12, 1, 0.1, 600);
  const target = new Vector3();

  // Uniforms shared by every card material.
  const weights = layers.map(() => new Vector3());
  const groundWeights = layers.map(() => new Vector3());
  const fog = {
    fogColour: { value: fogColour },
    fogNear: { value: 60 },
    fogFar: { value: 150 },
  };
  const mapUniforms = (textures: Texture[]) =>
    Object.fromEntries(
      layers.map((l, i) => [`${l}Map`, { value: textures[i] }]),
    );
  const look = { value: 0 };
  const cardUniforms = {
    ...mapUniforms(maps),
    weights: { value: weights },
    look,
  };

  const tubeGlow = new Color(0, 0, 0);
  const softboxGlow = new Color(0, 0, 0);
  // The film set fades in and out as one, so its parts have their own materials.
  const setOpacity = { value: 0 };
  const cards = new Map<string, ShaderMaterial>();
  function cardMaterial(name: string, prop = false) {
    const key = prop ? `set ${name}` : name;
    let material = cards.get(key);
    if (!material) {
      // The set's black gear is mid grey card: as black it is only a
      // silhouette against the lit wall.
      const colour =
        prop && name.startsWith("Graphite")
          ? "#77777a"
          : (card.find(([key]) => name.startsWith(key))?.[1] ?? "#a0a09c");
      const lit = name.startsWith("Opal");
      material = new ShaderMaterial({
        ...cardShader,
        transparent: prop,
        // The curtains are single sheets, seen from both sides.
        side: name.startsWith("Black molton") ? DoubleSide : FrontSide,
        uniforms: {
          ...cardUniforms,
          ...fog,
          albedo: { value: new Color(colour) },
          photo: {
            value: new Color(
              real.find(([key]) => name.startsWith(key))?.[1] ?? colour,
            ),
          },
          glow: {
            value: lit ? (prop ? softboxGlow : tubeGlow) : new Color(0),
          },
          opacity: prop ? setOpacity : { value: 1 },
        },
      });
      cards.set(key, material);
    }
    return material;
  }

  // ── The model ──────────────────────────────────────────────────────────
  const model = gltf.scene;
  const glass = new MeshBasicMaterial({
    color: "#f4f6f6",
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    fog: false,
  });
  const props = model.children.filter((node) =>
    node.name.startsWith("Film_set"),
  );
  for (const node of model.children) {
    const prop = props.includes(node);
    node.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      const name = (mesh.material as MeshBasicMaterial).name;
      mesh.material = name.startsWith("Clear")
        ? glass
        : cardMaterial(name, prop);
    });
  }
  const curtains: { node: Object3D; x: number; width: number }[] = [];
  const kitchenCurtains: Object3D[] = [];
  for (const node of model.children) {
    if (node.name.startsWith("Kitchen_molton")) kitchenCurtains.push(node);
    else if (node.name.includes("molton")) {
      const box = new Box3().setFromObject(node);
      const centre = box.getCenter(new Vector3());
      node.traverse((object) => {
        const mesh = object as Mesh;
        if (mesh.isMesh) mesh.geometry.translate(-centre.x, 0, 0);
      });
      node.position.x = centre.x;
      curtains.push({ node, x: centre.x, width: box.max.x - box.min.x });
    }
  }
  curtains.sort((a, b) => a.x - b.x);
  const stool = model.children.find((node) => node.name.startsWith("Stool"));
  scene.add(model);

  // Loose furniture borrows the floor's light: its UVs point into the floor's part of the atlas.
  const [a, b, , d] = meta.floor;
  const along = (p: typeof a, q: typeof a, x: number, z: number) =>
    Math.abs(q.x - p.x) > 0.01
      ? (x - p.x) / (q.x - p.x)
      : (z - p.z) / (q.z - p.z);
  const floorUv = (x: number, z: number) => {
    const s = along(a, b, x, z);
    const t = along(a, d, x, z);
    return [
      a.u + s * (b.u - a.u) + t * (d.u - a.u),
      1 - (a.v + s * (b.v - a.v) + t * (d.v - a.v)),
    ];
  };
  // The event: one long table with twelve seats on the shooting floor, and
  // five lamps along it. The furniture borrows the floor's light.
  const eventOpacity = { value: 0 };
  const furniture = (colour: string) =>
    new ShaderMaterial({
      ...cardShader,
      transparent: true,
      uniforms: {
        ...cardUniforms,
        ...fog,
        albedo: { value: new Color(colour) },
        photo: { value: new Color(colour) },
        glow: { value: new Color(0) },
        opacity: eventOpacity,
      },
    });
  const cloth = furniture("#ecece8");
  const seat = furniture("#3a3a38");
  const event = new Object3D();
  function piece(
    size: [number, number, number],
    at: [number, number, number],
    material: ShaderMaterial,
  ) {
    const geometry = new BoxGeometry(...size);
    const position = geometry.getAttribute("position");
    const uv = new Float32Array(position.count * 2);
    for (let i = 0; i < position.count; i++)
      uv.set(
        floorUv(at[0] + position.getX(i), at[2] + position.getZ(i)),
        i * 2,
      );
    geometry.setAttribute("uv", new BufferAttribute(uv, 2));
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...at);
    event.add(mesh);
  }
  const table = { x: -3.5, z: 0.1, length: 5.6, width: 0.9, height: 0.74 };
  piece(
    [table.length, 0.04, table.width],
    [table.x, table.height, table.z],
    cloth,
  );
  for (const side of [-1, 1])
    piece(
      [0.06, table.height - 0.04, table.width * 0.7],
      [
        table.x + side * table.length * 0.42,
        (table.height - 0.04) / 2,
        table.z,
      ],
      seat,
    );
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const x = table.x - table.length / 2 + ((i + 0.5) * table.length) / 6;
      const z = table.z + side * (table.width / 2 + 0.3);
      piece([0.42, 0.45, 0.42], [x, 0.225, z], seat);
      piece([0.42, 0.4, 0.05], [x, 0.65, z + side * 0.2], seat);
    }
  scene.add(event);

  // The lamps on the table: a glowing globe and its pool of warm light, on
  // the cloth and on the floor around the table.
  const lanterns = new Object3D();
  const lanternMaterial = new MeshBasicMaterial({
    color: "#000000",
    fog: false,
  });
  const poolMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { strength: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float strength; varying vec2 vUv;
      void main(){ float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0); float fall = pow(1.0 - d, 2.4);
        gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * fall * strength, 1.0); }`,
  });
  for (let i = 0; i < 5; i++) {
    const x = table.x - table.length / 2 + ((i + 0.5) * table.length) / 5;
    const globe = new Mesh(new SphereGeometry(0.09, 20, 12), lanternMaterial);
    globe.position.set(x, table.height + 0.13, table.z);
    for (const [size, y] of [
      [1.5, table.height + 0.024],
      [4.2, 0.022],
    ]) {
      const pool = new Mesh(new PlaneGeometry(size, size), poolMaterial);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x, y, table.z);
      lanterns.add(pool);
    }
    lanterns.add(globe);
  }
  scene.add(lanterns);

  const groundMaterial = new ShaderMaterial({
    ...groundShader,
    uniforms: {
      ...mapUniforms(groundMaps),
      ...fog,
      weights: { value: groundWeights },
      open: { value: new Vector3(1, 1, 1) },
      daylight: { value: 1 },
      extent: { value: meta.groundExtent },
    },
  });
  const ground = new Mesh(new PlaneGeometry(900, 900), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.24;
  scene.add(ground);

  // The spot's visible cone.
  const spotFrom = new Vector3(-1.2, 5.12, 2.2);
  const spotAt = new Vector3(-5.6, 0.9, -0.6);
  const reach = spotFrom.distanceTo(spotAt) + 0.6;
  const beamGeometry = new ConeGeometry(
    Math.tan(0.36) * reach,
    reach,
    48,
    1,
    true,
  );
  beamGeometry.translate(0, -reach / 2, 0);
  const beam = new Mesh(beamGeometry, beamMaterial());
  beam.position.copy(spotFrom);
  beam.quaternion.setFromUnitVectors(
    new Vector3(0, -1, 0),
    spotAt.clone().sub(spotFrom).normalize(),
  );
  scene.add(beam);

  // Bright haze behind the glass.
  const glowMaterial = new MeshBasicMaterial({ fog: false, side: BackSide });
  const glows = [
    [7.2, 5.7, -3.6, 2.85],
    [7.2, 2.7, 3.6, 1.35],
  ].map(([w, h, x, y]) => {
    const glow = new Mesh(new PlaneGeometry(w, h), glowMaterial);
    glow.rotation.y = Math.PI;
    glow.position.set(x, y, -4.3);
    scene.add(glow);
    return glow;
  });

  // ── Post ───────────────────────────────────────────────────────────────
  const composer = new EffectComposer(
    renderer,
    new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 }),
  );
  composer.setPixelRatio(ratio);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.3, 0.8, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass(grain));

  // ── State and fades: every channel fades on its own ────────────────────
  const now: Channels = { ...scenarioById(options.scenario).channels };
  const goal: Channels = { ...now };
  type Fade = { from: number; to: number; start: number; ms: number };
  const fades = new Map<keyof Channels, Fade>();
  const fogFrom = new Color();
  const fogTo = new Color(now.fog);
  let fogFade: null | { start: number; ms: number } = null;
  fogColour.set(now.fog);

  let pose: Pose = options.view;
  const from = {
    position: new Vector3(),
    target: new Vector3(),
    fov: 12,
    roll: 0,
  };
  let move: null | { to: Pose; start: number; ms: number } = null;
  let glowStrength = 0.3;
  let dirty = true;
  let lastHaze = "";

  const vec = (v: [number, number, number]) => new Vector3(...v);

  function placeCamera(position: Vector3, at: Vector3, fov: number, roll = 0) {
    camera.position.copy(position);
    target.copy(at);
    camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    if (roll) camera.rotateZ(MathUtils.degToRad(roll));
  }

  const tints: Record<Layer, [Color, Color]> = {
    sky: [new Color("#f3f5f6"), new Color("#ffd2ad")],
    fill: [new Color("#f3f5f6"), new Color("#ffd2ad")],
    sun: [new Color("#fff1dc"), new Color("#fff1dc")],
    evening: [new Color("#ff8f3d"), new Color("#ff8f3d")],
    tubes: [new Color("#ffd9ad"), new Color("#ffd9ad")],
    spot: [new Color("#fff1dc"), new Color("#fff1dc")],
    set: [new Color("#ffe6c4"), new Color("#ffe6c4")],
  };
  // The photo's daylight: a cool sky, a sun close to white.
  const photoTints = {
    sky: new Color("#e3f1ee"),
    sun: new Color("#fff8ee"),
  };
  const photoSky = new Color(0.7, 0.78, 0.98);
  const tint = new Color();
  const openLight = new Vector3();

  function applyLight() {
    const day = 1 - now.molton;
    const amount: Record<Layer, number> = {
      sky: now.sky * day,
      // The open-model fill is the haze itself: it is always there and takes
      // the haze colour, so every scene is bathed in one colour field.
      fill: 1,
      sun: now.sun * (1 - now.warm) * day,
      evening: now.sun * now.warm * day,
      tubes: now.tubes,
      spot: now.spot,
      set: now.set,
    };
    openLight.set(0, 0, 0);
    layers.forEach((layer, index) => {
      if (layer === "fill") tint.copy(fogColour).multiplyScalar(4.2);
      else {
        tint.copy(tints[layer][0]).lerp(tints[layer][1], now.warm);
        if (layer === "sky" || layer === "sun")
          tint.lerp(photoTints[layer], look.value);
      }
      const k = amount[layer] * gain[layer];
      weights[index]
        .set(tint.r, tint.g, tint.b)
        .multiplyScalar(k * meta.layers[layer].scale);
      groundWeights[index]
        .set(tint.r, tint.g, tint.b)
        .multiplyScalar(k * meta.layers[layer].groundScale);
      openLight.addScaledVector(
        new Vector3(tint.r, tint.g, tint.b),
        k * far[layer],
      );
    });
    // The ground only follows the daylight's own ratio of shade to open light.
    // Without the roofless fill it would read the closed room as a black box.
    groundMaterial.uniforms.open.value.copy(openLight);
    groundMaterial.uniforms.daylight.value = Math.min(
      1,
      openLight.length() * 4,
    );
    tubeGlow.set("#ffe2b8").multiplyScalar(0.03 + 5 * now.tubes);
    softboxGlow.set("#ffe6c4").multiplyScalar(6 * now.set);
    setOpacity.value = now.set;
    for (const node of props) node.visible = now.set > 0.004;
    lanterns.visible = now.event > 0.01;
    lanternMaterial.color.set("#ffb060").multiplyScalar(7 * now.event);
    poolMaterial.uniforms.strength.value = 0.9 * now.event;
    beam.visible = now.spot > 0.002;
    glowMaterial.color
      .copy(fogColour)
      .lerp(
        new Color(1.0, 1.02, 1.04).lerp(new Color(1.9, 1.0, 0.5), now.warm),
        now.back,
      )
      .lerp(photoSky, look.value);
    for (const glow of glows)
      glow.visible = now.back > 0.002 || look.value > 0.002;
    curtains.forEach(({ node, x, width }, index) => {
      const shutWidth = 6.9 / curtains.length;
      const shutX = -6.95 + shutWidth * (index + 0.5);
      node.position.x = MathUtils.lerp(x, shutX, now.molton);
      node.scale.x = MathUtils.lerp(1, shutWidth / width, now.molton);
    });
    for (const node of kitchenCurtains) {
      node.visible = now.molton > 0.01;
      node.scale.x = Math.max(0.02, now.molton);
    }
    eventOpacity.value = now.event;
    event.visible = now.event > 0.01;
    // The stool stands where the set and the table go.
    if (stool) stool.visible = Math.max(now.event, now.set) < 0.5;
    glowStrength =
      0.3 +
      0.45 *
        Math.max(now.tubes, now.spot, now.set, now.event, now.warm * now.sun);
  }

  function step(time: number) {
    if (fades.size || fogFade) {
      for (const [key, fade] of fades) {
        const t = fade.ms ? Math.min(1, (time - fade.start) / fade.ms) : 1;
        (now[key] as number) = MathUtils.lerp(fade.from, fade.to, ease(t));
        if (t === 1) fades.delete(key);
      }
      if (fogFade) {
        const t = fogFade.ms
          ? Math.min(1, (time - fogFade.start) / fogFade.ms)
          : 1;
        fogColour.copy(fogFrom).lerp(fogTo, ease(t));
        if (t === 1) fogFade = null;
      }
      applyLight();
      dirty = true;
    }
    if (move) {
      const t = move.ms ? Math.min(1, (time - move.start) / move.ms) : 1;
      const k = ease(t);
      placeCamera(
        from.position.clone().lerp(vec(move.to.position), k),
        from.target.clone().lerp(vec(move.to.target), k),
        MathUtils.lerp(from.fov, move.to.fov, k),
        MathUtils.lerp(from.roll, move.to.roll ?? 0, k),
      );
      if (t === 1) move = null;
      dirty = true;
    }
  }
  // Reading the canvas back waits for the GPU, so it is not done on every
  // frame of a drag or a flight: at most every 150 ms, and once more when
  // the picture has settled.
  let hazeRead = 0;
  let hazeStale = false;
  function render(time: number) {
    const distance = camera.position.distanceTo(target);
    fog.fogNear.value = Math.max(0.1, distance - 10);
    fog.fogFar.value = distance + 75;
    // Standing inside, the lamps are close: hold exposure and glow back so
    // the room does not wash out.
    const inside = 1 - MathUtils.smoothstep(distance, 14, 30);
    renderer.toneMappingExposure =
      now.exposure * (1 - 0.5 * inside * Math.max(now.tubes, now.spot));
    // The photo has no glow of its own, and seen from inside its cone the
    // spot's beam is only a veil over the picture.
    bloom.strength = glowStrength * (1 - 0.95 * inside) * (1 - look.value);
    beam.material.uniforms.strength.value =
      0.22 * now.spot * (1 - 0.85 * inside);
    composer.render();
    // On the way from the photo the top edge is the room's ceiling, not haze.
    const due = time - hazeRead >= 150;
    hazeStale = !due;
    if (options.onHaze && due && look.value < 0.02) {
      hazeRead = time;
      // Read a strip of the top edge back, so the page takes the exact
      // rendered colour. A strip, because single pixels carry grain.
      const gl = renderer.getContext();
      const strip = Math.min(256, gl.drawingBufferWidth);
      const pixels = new Uint8Array(strip * 4);
      gl.readPixels(
        Math.floor((gl.drawingBufferWidth - strip) / 2),
        gl.drawingBufferHeight - 2,
        strip,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
      );
      const mean = [0, 1, 2].map((channel) => {
        let total = 0;
        for (let i = 0; i < strip; i++) total += pixels[i * 4 + channel];
        return Math.round(total / strip);
      });
      const css = `rgb(${mean.join(" ")})`;
      if (css !== lastHaze) options.onHaze((lastHaze = css));
    }
  }

  let visible = true;
  let frame = 0;
  function loop(time: number) {
    if (signal.aborted) return;
    frame = requestAnimationFrame(loop);
    if (!visible) return;
    step(time);
    if (!dirty && hazeStale && time - hazeRead >= 150) dirty = true;
    if (!dirty) return;
    dirty = false;
    render(time);
  }

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    if (!move)
      placeCamera(vec(pose.position), vec(pose.target), pose.fov, pose.roll);
    dirty = true;
  }

  host.append(canvas);
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  const watcher = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    dirty = true;
  });
  watcher.observe(host);
  canvas.addEventListener(
    "webglcontextlost",
    (event) => event.preventDefault(),
    { signal },
  );
  // A restored context comes back empty, and a settled scene draws nothing
  // on its own.
  canvas.addEventListener("webglcontextrestored", () => (dirty = true), {
    signal,
  });
  resize();
  applyLight();
  frame = requestAnimationFrame(loop);

  // Starts every channel the scenario changes on its own fade.
  function setChannels(partial: Partial<Channels>, ms: number) {
    const start = performance.now();
    const duration = still ? 0 : ms;
    for (const key of Object.keys(partial) as (keyof Channels)[]) {
      const value = partial[key];
      if (value === undefined || value === goal[key]) continue;
      (goal[key] as Channels[typeof key]) = value;
      if (key === "fog") {
        fogFrom.copy(fogColour);
        fogTo.set(value as string);
        fogFade = { start, ms: duration };
        now.fog = value as string;
      } else {
        fades.set(key, {
          from: now[key] as number,
          to: value as number,
          start,
          ms: duration,
        });
      }
    }
  }

  return {
    setScenario(id, ms = 1400) {
      setChannels(scenarioById(id).channels, ms);
    },
    setLook(amount) {
      const next = MathUtils.clamp(amount, 0, 1);
      if (next === look.value) return;
      look.value = next;
      applyLight();
      dirty = true;
    },
    setView(next, ms = 1000) {
      from.position.copy(camera.position);
      from.target.copy(target);
      from.fov = camera.fov;
      from.roll = pose.roll ?? 0;
      pose = next;
      move = { to: next, start: performance.now(), ms: still ? 0 : ms };
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      watcher.disconnect();
      composer.dispose();
      for (const texture of [...maps, ...groundMaps]) texture.dispose();
      scene.traverse((object) => {
        const mesh = object as Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
