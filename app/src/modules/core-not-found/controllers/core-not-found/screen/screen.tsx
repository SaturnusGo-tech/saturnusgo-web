"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./styles.module.css";

function useSnow(enabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let particles: Particle[] = [];

    class Particle {
      x = 0;
      y = 0;
      dx = 0;
      dy = 0;

      constructor() {
        this.reset();
      }

      reset() {
        this.y = Math.random() * height;
        this.x = Math.random() * width;
        this.dx = Math.random() * 1 - 0.5;
        this.dy = Math.random() * 0.5 + 0.5;
      }
    }

    const createParticles = (count: number) => {
      if (count === particles.length) {
        return;
      }

      particles = [];

      for (let index = 0; index < count; index += 1) {
        particles.push(new Particle());
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      createParticles((width * height) / 10000);
    };

    const update = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#f6f9fa";

      particles.forEach((particle) => {
        particle.y += particle.dy;
        particle.x += particle.dx;

        if (particle.y > height) {
          particle.y = 0;
        }

        if (particle.x > width) {
          particle.reset();
          particle.y = 0;
        }

        context.beginPath();
        context.arc(particle.x, particle.y, 5, 0, Math.PI * 2, false);
        context.fill();
      });

      animationFrame = window.requestAnimationFrame(update);
    };

    resize();
    update();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [enabled]);

  return canvasRef;
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const snowRef = useSnow(mounted);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scene = (
    <main className={styles.content} aria-labelledby="not-found-title">
      <canvas ref={snowRef} className={styles.snow} aria-hidden="true" />
      <div className={styles.mainText}>
        <h1 id="not-found-title">
          Oops.
          <br />
          That page has gone missing.
        </h1>
        <a className={styles.homeLink} href="/">
          Hitch a ride back home.
        </a>
      </div>
      <div className={styles.ground} aria-hidden="true">
        <div className={styles.mound}>
          <div className={styles.moundText}>404</div>
          <div className={styles.moundSpade} />
        </div>
      </div>
    </main>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(scene, document.body);
}
