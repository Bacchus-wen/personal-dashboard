"use client";

import { useState } from "react";

export function PageAction({ label = "编辑" }: { label?: string }) {
  const [text, setText] = useState(label);
  return <button className="page-action" onClick={() => setText(label === "导入密钥" ? "等待密钥" : "已进入编辑")}>{text}</button>;
}
