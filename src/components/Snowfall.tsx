import { useEffect, useRef, useState, useCallback } from "react";

interface Snowflake {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
}

export default function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // 初始化雪花
  const initSnowflakes = useCallback((width: number, height: number) => {
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 80; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 2,
        speed: Math.random() * 0.8 + 0.4,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    snowflakesRef.current = flakes;
  }, []);

  // 检查开关状态并自动切换到深色模式
  useEffect(() => {
    const checkActive = () => {
      const saved = localStorage.getItem("snow-toggle");
      const now = new Date();
      const isWinter = now.getMonth() >= 11 || now.getMonth() <= 1;
      const active = saved === "true" || (saved === null && isWinter);
      setIsVisible(active);

      if (active && !document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        window.dispatchEvent(new CustomEvent("theme-change", { detail: { isDark: true } }));
      }
    };

    checkActive();

    const handleToggle = () => checkActive();
    window.addEventListener("snow-toggle", handleToggle);
    return () => window.removeEventListener("snow-toggle", handleToggle);
  }, []);

  // 绘制和更新
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    snowflakesRef.current.forEach((flake) => {
      flake.y += flake.speed;
      flake.wobble += flake.wobbleSpeed;
      flake.x += Math.sin(flake.wobble) * 0.3;

      if (flake.y > height) {
        flake.y = -10;
        flake.x = Math.random() * width;
      }
      if (flake.x > width + 10) flake.x = -10;
      else if (flake.x < -10) flake.x = width + 10;

      // 白色带光晕
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.size + 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  // Canvas 初始化和动画
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSnowflakes(canvas.width, canvas.height);

    const timer = setTimeout(() => {
      animationRef.current = requestAnimationFrame(draw);
    }, 100);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initSnowflakes(canvas.width, canvas.height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isVisible, initSnowflakes, draw]);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}
