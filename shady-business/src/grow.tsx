import * as React from "react";

interface Size {
  width: number;
  height: number;
}

export const Grow: React.FC<{
  onMouseDown: () => void;
  onResize: (size: Size) => void;
}> = ({ onMouseDown, onResize, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const onWindowResize = React.useCallback(() => {
    if (!ref.current) {
      return;
    }
    const bounds = ref.current.getBoundingClientRect();
    onResize(bounds);
  }, [ref, onResize]);

  React.useEffect(() => {
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, [onWindowResize]);

  React.useEffect(() => {
    onWindowResize();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid black",
        boxSizing: "border-box",
        flexGrow: 1,
        height: "100%",
        width: "100%",
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
};
