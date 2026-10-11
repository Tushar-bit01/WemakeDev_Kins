import React, { useEffect, useRef } from 'react';
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { vertexShader, fragmentShader } from "./DissolveShader";
import { useTheme } from "../../../context/ThemeContext";

// ─── IMPORTANT ────────────────────────────────────────────────────────────
// DissolveCanvas no longer owns a Lenis instance.
// Create Lenis ONCE at your app root (main.jsx / App.jsx) and wire it to
// ScrollTrigger there. Example at the bottom of this file.
// ──────────────────────────────────────────────────────────────────────────

gsap.registerPlugin(ScrollTrigger, SplitText);

const DissolveCanvas = () => {
  const { isDark } = useTheme();
  const canvasRef        = useRef(null);
  const rafRef           = useRef(null);
  const scrollProgressRef= useRef(0);
  const materialRef      = useRef(null);
  const currentColorRef  = useRef({ r: 0, g: 0, b: 0 });
  const targetColorRef   = useRef({ r: 0, g: 0, b: 0 });
  const isPageVisibleRef = useRef(true);
  const isInViewRef      = useRef(true);

  useEffect(() => {
    const CONFIG = { spread: 0.5, speed: 2 };

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
        : { r: 0.89, g: 0.89, b: 0.89 };
    }

    const canvas = canvasRef.current;
    const hero   = document.querySelector(".hero");
    if (!canvas || !hero) return;

    // ── Three.js ──────────────────────────────────────────────
    const scene    = new THREE.Scene();
    const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    function resize() {
      const w = hero.offsetWidth;
      const h = hero.offsetHeight;
      renderer.setSize(w, h);
      if (materialRef.current) materialRef.current.uniforms.uResolution.value.set(w, h);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const rgb = hexToRgb(isDark ? "#ebf5df" : "#0d4735");
    currentColorRef.current = { ...rgb };
    targetColorRef.current  = { ...rgb };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress:   { value: 0 },
        uResolution: { value: new THREE.Vector2(hero.offsetWidth, hero.offsetHeight) },
        uColor:      { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
        uSpread:     { value: CONFIG.spread },
      },
      transparent: true,
    });
    materialRef.current = material;
    scene.add(new THREE.Mesh(geometry, material));

    // ── Scroll progress via ScrollTrigger only (no second Lenis) ──
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        scrollProgressRef.current = Math.min(self.progress * CONFIG.speed * 1.1, 1.1);
      },
    });

    // ── Visibility guards ─────────────────────────────────────
    const observer = new IntersectionObserver(
      ([entry]) => { isInViewRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const handleVisibility = () => { isPageVisibleRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", handleVisibility);

    // ── Single render loop ────────────────────────────────────
    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      if (!isPageVisibleRef.current || !isInViewRef.current) return;

      const cr = currentColorRef.current;
      const tr = targetColorRef.current;
      const dr = tr.r - cr.r, dg = tr.g - cr.g, db = tr.b - cr.b;
      if (Math.abs(dr) + Math.abs(dg) + Math.abs(db) > 0.001) {
        cr.r += dr * 0.08; cr.g += dg * 0.08; cr.b += db * 0.08;
        material.uniforms.uColor.value.set(cr.r, cr.g, cr.b);
      }

      material.uniforms.uProgress.value = scrollProgressRef.current;
      renderer.render(scene, camera);
    }
    rafRef.current = requestAnimationFrame(loop);

    // ── Text reveal ───────────────────────────────────────────
    const heroH2 = document.querySelector(".hero-content h2");
    if (heroH2) {
      const split = new SplitText(heroH2, { type: "words" });
      const words = split.words;
      gsap.set(words, { opacity: 0 });
      ScrollTrigger.create({
        trigger: ".hero-content",
        start: "top 25%",
        end: "bottom 100%",
        onUpdate: (self) => {
          const progress = self.progress;
          const total = words.length;
          words.forEach((word, i) => {
            const wp = i / total, nwp = (i + 1) / total;
            const opacity =
              progress >= nwp ? 1 :
              progress >= wp  ? (progress - wp) / (nwp - wp) : 0;
            gsap.to(word, { opacity, duration: 0.1, overwrite: true });
          });
        },
      });
    }

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? { r: parseInt(result[1], 16) / 255, g: parseInt(result[2], 16) / 255, b: parseInt(result[3], 16) / 255 }
        : { r: 0.89, g: 0.89, b: 0.89 };
    }
    targetColorRef.current = hexToRgb(isDark ? "#ebf5df" : "#0d4735");
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="hero-canvas absolute w-full h-full bottom-0 pointer-events-none z-20"
    />
  );
};

export default DissolveCanvas;

/*
─── App-root Lenis setup (main.jsx or App.jsx) ───────────────────────────────

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();

// Wire Lenis → ScrollTrigger so ST reads smooth-scroll positions
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// That's it — every ScrollTrigger in the app (including DissolveCanvas)
// will now use Lenis positions automatically.
─────────────────────────────────────────────────────────────────────────────
*/