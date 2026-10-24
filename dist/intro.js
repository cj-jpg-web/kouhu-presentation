import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const intro = document.getElementById('geoIntro');
const canvas = document.getElementById('earthCanvas');

intro?.classList.add('runtime-ready');
const skip = document.getElementById('skipIntro');
const mapStage = intro?.querySelector('.geo-map');
const campus = intro?.querySelector('.geo-campus');
const title = intro?.querySelector('.geo-title');
const orbitCopy = intro?.querySelector('.geo-orbit-copy');
const progress = intro?.querySelector('.geo-progress i');
const crumbs = intro ? [...intro.querySelectorAll('.geo-crumbs span')] : [];
const dividers = intro ? [...intro.querySelectorAll('.geo-crumbs i')] : [];
const target = intro?.querySelector('.geo-target');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
let frame;
let completed = false;

if (!intro || location.hash && location.hash !== '#1') {
  intro?.classList.add('complete');
} else {
  document.body.classList.add('intro-active');
  startIntro();
}

function makeAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vNormal;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
    fragmentShader: `
      varying vec3 vNormal;
      void main(){
        float intensity = pow(0.68 - dot(vNormal, vec3(0.0,0.0,1.0)), 2.2);
        gl_FragColor = vec4(0.12,0.58,0.86,1.0) * intensity;
      }`
  });
}

function taiwanVector(radius = 1.012) {
  const lat = THREE.MathUtils.degToRad(23.58);
  const lon = THREE.MathUtils.degToRad(120.18);
  return new THREE.Vector3(
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon)
  );
}

function startIntro() {
  const gsap = window.gsap;
  if (!gsap) {
    completeIntro();
    return;
  }

  let earth;
  let earthGroup;
  const cameraState = { z: 4.55 };

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(1600, 900, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1600 / 900, 0.1, 100);
    camera.position.set(0, 0, cameraState.z);

    earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const texture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/r186/examples/textures/planets/earth_atmos_2048.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      new THREE.MeshPhongMaterial({ map: texture, shininess: 8, specular: new THREE.Color('#244b64') })
    );
    earthGroup.add(earth);

    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.06, 96, 96), makeAtmosphereMaterial());
    earthGroup.add(atmosphere);

    const markerPosition = taiwanVector();
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(.025, 24, 24),
      new THREE.MeshBasicMaterial({ color: '#dfff4f' })
    );
    marker.position.copy(markerPosition);
    earthGroup.add(marker);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(.04, .055, 48),
      new THREE.MeshBasicMaterial({ color: '#dfff4f', transparent: true, opacity: .85, side: THREE.DoubleSide })
    );
    ring.position.copy(markerPosition.clone().multiplyScalar(1.006));
    ring.lookAt(markerPosition.clone().multiplyScalar(2));
    earthGroup.add(ring);

    earthGroup.rotation.y = -THREE.MathUtils.degToRad(120.18);
    earthGroup.rotation.x = -THREE.MathUtils.degToRad(8);

    scene.add(new THREE.HemisphereLight(0x99d9ff, 0x02060a, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 3.2);
    sun.position.set(-3, 2.4, 4);
    scene.add(sun);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 650; i++) {
      const radius = 8 + Math.random() * 13;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions.push(radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xbfdde8, size: .018, transparent: true, opacity: .72 }));
    scene.add(stars);

    const render = () => {
      frame = requestAnimationFrame(render);
      camera.position.z = cameraState.z;
      earth.rotation.y += .00045;
      stars.rotation.y -= .00006;
      renderer.render(scene, camera);
    };
    render();

    window.addEventListener('resize', () => {
      renderer?.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer?.setSize(1600, 900, false);
    });
  } catch (error) {
    canvas.style.display = 'none';
  }

  gsap.set([mapStage, campus, title], { opacity: 0 });
  gsap.set(orbitCopy, { opacity: 0, y: 16 });
  gsap.set(progress, { width: 0 });
  gsap.set('.taiwan-map', { scale: 1.18, x: 80, transformOrigin: '50% 50%' });
  gsap.set('.geo-route path', { strokeDasharray: 1700, strokeDashoffset: 1700 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: completeIntro });
  window.kouhuIntroTimeline = tl;

  tl.to(progress, { width: '100%', duration: 11.5, ease: 'none' }, 0)
    .to(orbitCopy, { opacity: 1, y: 0, duration: .8 }, .4)
    .to(cameraState, { z: 2.12, duration: 4.6, ease: 'power2.inOut' }, .5)
    .to(earthGroup?.rotation || {}, { x: THREE.MathUtils.degToRad(-18), duration: 4.6 }, .5)
    .to(orbitCopy, { opacity: 0, y: -12, duration: .5 }, 4.15)
    .to(canvas, { opacity: 0, scale: 1.16, duration: 1.15 }, 4.35)
    .to(mapStage, { opacity: 1, duration: .9 }, 4.25)
    .to('.taiwan-map', { scale: 1, x: 0, duration: 2.1 }, 4.3)
    .to('.geo-route path', { strokeDashoffset: 0, duration: 2.8, ease: 'power2.inOut' }, 4.75)
    .to(crumbs, { opacity: 1, y: 0, duration: .45, stagger: .42 }, 4.75)
    .to(dividers, { scaleX: 1, duration: .4, stagger: .42 }, 5.05)
    .to(target, { opacity: 1, y: -8, duration: .7 }, 6.3)
    .to(mapStage, { scale: 1.12, opacity: 0, duration: 1.55 }, 7.15)
    .to(campus, { opacity: 1, scale: 1, duration: 1.8 }, 6.95)
    .fromTo(title, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 1.05 }, 8.65)
    .fromTo('.geo-title h1', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.15 }, 8.8)
    .to(skip, { opacity: 0, duration: .35 }, 10.35)
    .to(intro, { opacity: 0, duration: .75 }, 10.75);

  if (reduceMotion) tl.timeScale(2.4);
}

function completeIntro() {
  if (completed) return;
  completed = true;
  window.kouhuIntroTimeline?.progress(1).pause();
  intro.classList.add('complete');
  intro.style.opacity = '';
  document.body.classList.remove('intro-active');
  cancelAnimationFrame(frame);
  renderer?.dispose();
  window.dispatchEvent(new CustomEvent('kouhu:intro-complete'));
}

function skipIntro(event) {
  event?.preventDefault();
  event?.stopPropagation();
  completeIntro();
}

skip?.addEventListener('click', skipIntro);
document.addEventListener('keydown', event => {
  if (completed) {
    if (event.key.toLowerCase() === 'r' && location.hash === '#1') location.reload();
    return;
  }
  if (['Escape', 'Enter', ' ', 'ArrowRight', 'PageDown'].includes(event.key)) skipIntro(event);
}, true);

window.replayKouhuIntro = () => location.assign('#1');

