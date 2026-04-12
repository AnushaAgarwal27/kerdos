"use client";

import Silk from "./Silk";

export default function SilkBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
    >
      <Silk speed={5} scale={1} color="#364f44" noiseIntensity={1.5} rotation={0} />
    </div>
  );
}
