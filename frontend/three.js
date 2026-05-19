import * as THREE from 'three';

let scene, camera, renderer, points, velocities;
const POINT_COUNT = 1500;

export function init() {
    const container = document.getElementById('three-container');
    
    // Scene
    scene = new THREE.Scene();
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Create points in a sphere
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(POINT_COUNT * 3);
    velocities = new Float32Array(POINT_COUNT * 3);
    
    for (let i = 0; i < POINT_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 60 + Math.random() * 20;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Initial velocity based on position (tangential)
        velocities[i * 3] = (-positions[i * 3 + 1] * 0.001);
        velocities[i * 3 + 1] = (positions[i * 3] * 0.001);
        velocities[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Material with purple color
    const material = new THREE.PointsMaterial({
        color: 0x8B5CF6,
        size: 1.5,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    points = new THREE.Points(geometry, material);
    scene.add(points);
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function updateSpeed(wpm) {
    if (!velocities || !points) return;
    
    const baseSpeed = wpm / 200;
    const positions = points.geometry.attributes.position.array;
    
    for (let i = 0; i < POINT_COUNT; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Tangential velocity scaled by WPM
        velocities[i * 3] = -y * baseSpeed * 0.01;
        velocities[i * 3 + 1] = x * baseSpeed * 0.01;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * baseSpeed * 0.005;
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (points && velocities) {
        const positions = points.geometry.attributes.position.array;
        
        for (let i = 0; i < POINT_COUNT; i++) {
            positions[i * 3] += velocities[i * 3];
            positions[i * 3 + 1] += velocities[i * 3 + 1];
            positions[i * 3 + 2] += velocities[i * 3 + 2];
            
            // Keep points within sphere bounds
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            const dist = Math.sqrt(x * x + y * y + z * z);
            
            if (dist > 80) {
                positions[i * 3] *= 0.99;
                positions[i * 3 + 1] *= 0.99;
                positions[i * 3 + 2] *= 0.99;
            } else if (dist < 40) {
                positions[i * 3] *= 1.01;
                positions[i * 3 + 1] *= 1.01;
                positions[i * 3 + 2] *= 1.01;
            }
        }
        
        points.geometry.attributes.position.needsUpdate = true;
        
        // Slow rotation
        points.rotation.y += 0.001;
        points.rotation.x += 0.0005;
    }
    
    renderer.render(scene, camera);
}
