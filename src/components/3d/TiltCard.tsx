'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  href: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  bgImage: string;
  accentColor?: string;
  stats: string;
}

export default function TiltCard({
  href,
  title,
  subtitle,
  badge,
  icon,
  bgImage,
  accentColor = '#E50914',
  stats,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for 3D tilt
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14]);

  const glareX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }

  return (
    <Link href={href} className="group block perspective-[1000px] w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative h-[380px] sm:h-[420px] rounded-2xl overflow-hidden border border-white/10 bg-surface-card transition-shadow duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_35px_rgba(229,9,20,0.35)]"
      >
        {/* Background Image with Parallax Zoom */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110 filter brightness-[0.45] group-hover:brightness-[0.6]"
          style={{ backgroundImage: `url(${bgImage})` }}
        />

        {/* Ambient Dark-Red Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80 pointer-events-none" />

        {/* Glare specular overlay */}
        {isHovered && (
          <motion.div
            style={{
              left: glareX,
              top: glareY,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"
          />
        )}

        {/* Content Layers with 3D Depth */}
        <div
          style={{ transform: 'translateZ(40px)' }}
          className="relative h-full p-7 flex flex-col justify-between z-10"
        >
          {/* Top Row: Badge & Icon */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-black/60 border border-primary/40 text-primary-light text-red-400 backdrop-blur-md">
              {badge}
            </span>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-lg">
              {icon}
            </div>
          </div>

          {/* Bottom Row: Title, Subtitle & Arrow */}
          <div className="space-y-3">
            <div className="text-xs tracking-wider uppercase text-gray-400 font-mono">
              {stats}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white group-hover:text-red-400 transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
              {subtitle}
            </p>

            <div className="pt-2 flex items-center text-sm font-medium text-white group-hover:text-primary transition-colors">
              <span>Explore 4 Industries</span>
              <svg
                className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Red Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    </Link>
  );
}
