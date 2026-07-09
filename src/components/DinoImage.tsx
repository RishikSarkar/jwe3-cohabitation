"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string | null | undefined;
  video?: string | null;
  name: string;
  variant?: "row" | "thumb";
};

const variantClass = {
  row: "h-[112px] w-[112px]",
  thumb: "h-16 w-16",
};

export function DinoImage({ src, video, name, variant = "row" }: Props) {
  const [failed, setFailed] = useState(!src);
  const videoRef = useRef<HTMLVideoElement>(null);
  const box = `${variantClass[variant]} dino-media shrink-0`;

  useEffect(() => {
    const row = videoRef.current?.closest(".group");
    if (!row || !video) return;

    const play = () => {
      const el = videoRef.current;
      if (!el) return;
      el.currentTime = 0;
      void el.play().catch(() => undefined);
    };
    const stop = () => {
      const el = videoRef.current;
      if (!el) return;
      el.pause();
      el.currentTime = 0;
    };

    row.addEventListener("mouseenter", play);
    row.addEventListener("mouseleave", stop);
    return () => {
      row.removeEventListener("mouseenter", play);
      row.removeEventListener("mouseleave", stop);
    };
  }, [video]);

  if (failed || !src) {
    return (
      <div className={box} title={name}>
        <figure className="dino-media-figure">
          <div className="flex h-full items-end justify-center px-2 pb-2">
            <div className="font-display text-2xl font-bold text-jwe-brand/30">
              {name.charAt(0)}
            </div>
          </div>
        </figure>
      </div>
    );
  }

  return (
    <div className={box}>
      <figure className="dino-media-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className={video ? "dino-media-static" : undefined}
          onError={() => setFailed(true)}
        />
        {video && (
          <video
            ref={videoRef}
            className="dino-media-video"
            muted
            loop
            playsInline
            preload="none"
          >
            <source src={video} type="video/webm" />
          </video>
        )}
      </figure>
    </div>
  );
}
