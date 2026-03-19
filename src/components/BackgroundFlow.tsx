import { motion } from "framer-motion";

const C = ["#C4A882", "#A8C8B5", "#E4D9CC"];
const FRAGMENTS = [
  { kind: "symbol", char: "§", color: C[0] },
  { kind: "pill", color: C[1] },
  { kind: "dash", color: C[2] },
  { kind: "symbol", char: "©", color: C[0] },
  { kind: "pill", color: C[2] },
  { kind: "dash", color: C[1] },
  { kind: "symbol", char: "?", color: C[1] },
  { kind: "pill", color: C[0] },
  { kind: "dash", color: C[2] },
  { kind: "symbol", char: "i", color: C[2] },
  { kind: "pill", color: C[1] },
  { kind: "dash", color: C[0] },
];

const PATH = "M 50 0 C 85 15, 20 30, 50 45 C 80 60, 15 75, 50 90 C 68 100, 108 76, 132 42";

export default function BackgroundFlow() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 1, pointerEvents: "none" }}>
      <svg style={{ visibility: "hidden", position: "absolute" }} viewBox="0 0 100 100">
        <path id="motionPath" d={PATH} />
      </svg>

      {FRAGMENTS.map((frag, i) => (
        <FragmentNode key={i} index={i} frag={frag} />
      ))}
    </div>
  );
}

function FragmentNode({ index, frag }: { index: number; frag: any }) {
  // We offset each fragment so they follow in a line
  const delay = index * 0.8; 

  return (
    <motion.div
      initial={{ offsetDistance: "0%", opacity: 0 }}
      animate={{ 
        offsetDistance: "100%", 
        opacity: [0, 0.48, 0.48, 0], // Fades in, stays, then fades out at tail
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "linear",
        delay: delay,
      }}
      style={{
        position: "absolute",
        width: frag.kind === "pill" ? 28 : 14,
        height: frag.kind === "pill" ? 7 : 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: frag.color,
        background: frag.kind === "symbol" ? "none" : frag.color,
        borderRadius: 100,
        fontSize: 13,
        fontWeight: 400,
        // MAGIC CSS PROPERTY:
        offsetPath: `path('${PATH}')`,
        willChange: "transform, opacity",
      }}
    >
      {frag.kind === "symbol" ? frag.char : null}
      
      {/* Organic Jitter Layer */}
      <motion.div
        animate={{ 
          x: [0, 2, -2, 0], 
          y: [0, -2, 2, 0],
          rotate: [0, 10, -10, 0] 
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* This empty div just provides the jitter to the parent content */}
      </motion.div>
    </motion.div>
  );
}
