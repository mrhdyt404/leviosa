import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BackgroundSceneProps {
  theme?: 'night' | 'winter';
}

export const BackgroundScene: React.FC<BackgroundSceneProps> = ({ theme = 'night' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Starry Particles & Golden Embers
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    const goldPalette = [
      new THREE.Color('#ffd700'),
      new THREE.Color('#fff2a3'),
      new THREE.Color('#d4af37'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#f59e0b')
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;

      const col = goldPalette[Math.floor(Math.random() * goldPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = Math.random() * 2.5 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Particle Material with Soft Glow
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
      gradient.addColorStop(0.7, 'rgba(212, 175, 55, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.PointsMaterial({
      size: 1.2,
      map: texture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse Parallax Interaction
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      camera.position.x = currentMouseX * 1.5;
      camera.position.y = -currentMouseY * 1.5;
      camera.lookAt(scene.position);

      // Gentle floating swirl of magical particles
      const posArr = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Upward floating motion with subtle wave
        posArr[i * 3 + 1] += 0.02 * (scales[i] * 0.5);
        posArr[i * 3] += Math.sin(elapsedTime * 0.5 + i) * 0.01;

        // Reset if reached top
        if (posArr[i * 3 + 1] > 20) {
          posArr[i * 3 + 1] = -20;
          posArr[i * 3] = (Math.random() - 0.5) * 60;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      particles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  const bgImage = theme === 'winter' ? '/assets/hogwarts_winter_bg.jpg' : '/assets/hogwarts_night_bg.jpg';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Hogwarts Castle Background Image with Smooth Blend */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{
          backgroundImage: `url(${bgImage})`,
          filter: 'brightness(0.68) contrast(1.15) saturate(1.1)'
        }}
      />

      {/* Atmospheric Vignette & Color Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-[#080d1e]/50 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-[#04060c]/85" />

      {/* Three.js WebGL Particle Layer */}
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
};
