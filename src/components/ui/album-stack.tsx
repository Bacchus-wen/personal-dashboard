"use client";

import { useState } from "react";

export function AlbumStack() {
  const [layers, setLayers] = useState([1, 2, 3, 4, 5, 6]);
  const raise = (index: number) => setLayers((current) => current.map((layer, itemIndex) => itemIndex === index ? Math.max(...current) + 1 : layer));
  return <section className="album-stage" aria-label="拍立得照片墙">{layers.map((layer, index) => <button className="polaroid" style={{ zIndex: layer }} onClick={() => raise(index)} aria-label={`照片 ${index + 1}`} key={index} />)}</section>;
}
