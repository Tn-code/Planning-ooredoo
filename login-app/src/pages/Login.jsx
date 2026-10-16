import { useState, useEffect, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import OoredooLogo from "../components/OoredooLogo";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
} from "lucide-react";

// ============================================
// 🎨 COULEURS OFFICIELLES OOREDOO
// ============================================
const OOREDOO = {
  red: "#ED1C24",       // Rouge Ooredoo officiel
  redDark: "#B8141A",   // Rouge foncé (hover/dégradé)
  redLight: "#FF4D54",  // Rouge clair (highlights)
  white: "#FFFFFF",
  black: "#1A1A1A",
  gray: "#2C2C2C",
  grayLight: "#F5F5F5",
  gold: "#FFB800",      // Accent premium
};

// ============================================
// 🌊 SHADER WEBGL — Couleurs Ooredoo
// ============================================
function FluidShader() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vs = `
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const fs = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                          -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
              + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 3.0;
        float t = u_time * 0.15;

        float n1 = snoise(p + vec2(t, t * 0.5));
        float n2 = snoise(p * 1.5 - vec2(t * 0.7, t));
        float n3 = snoise(p * 0.8 + vec2(t * 0.3, -t * 0.4));

        float dist = distance(uv, u_mouse);
        float mouseInfluence = smoothstep(0.5, 0.0, dist);

        // Couleurs Ooredoo
        vec3 ooredooRed    = vec3(0.929, 0.110, 0.141); // #ED1C24
        vec3 ooredooDark   = vec3(0.722, 0.078, 0.102); // #B8141A
        vec3 ooredooGold   = vec3(1.0,   0.722, 0.0);   // #FFB800
        vec3 deepBlack     = vec3(0.078, 0.078, 0.086); // #141416

        vec3 col = mix(deepBlack, ooredooRed, n1 * 0.5 + 0.5);
        col = mix(col, ooredooDark, n2 * 0.4 + 0.4);
        col = mix(col, ooredooGold, pow(n3 * 0.5 + 0.5, 3.0) * 0.25);
        col += ooredooRed * mouseInfluence * 0.35;

        float vig = 1.0 - length(uv - 0.5) * 1.3;
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let start = Date.now();
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    const render = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (Date.now() - start) / 1000);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}

// ============================================
// ✨ ÉTOILES FILANTES Ooredoo
// ============================================
function ShootingStars() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight * 0.5;
      setStars((prev) => [...prev, { id, x: startX, y: startY }]);
      setTimeout(() => {
        setStars((prev) => prev.filter((s) => s.id !== id));
      }, 1500);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {stars.map((s) => (
        <motion.div
          key={s.id}
          initial={{ x: s.x, y: s.y, opacity: 0 }}
          animate={{
            x: s.x + 300,
            y: s.y + 300,
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{
            position: "fixed",
            width: 2,
            height: 2,
            background: OOREDOO.red,
            borderRadius: "50%",
            boxShadow: `0 0 12px 2px ${OOREDOO.red}, 0 0 40px 4px rgba(237,28,36,0.5)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
}

// ============================================
// 🌈 CURSEUR PERSONNALISÉ Ooredoo
// ============================================
function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState([]);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      setTrail((prev) => [
        ...prev.slice(-8),
        { x: e.clientX, y: e.clientY, id: Date.now() },
      ]);
    };
    const onDown = () => setClicked(true);
    const onUp = () => setClicked(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      {trail.map((p, i) => (
        <div
          key={p.id}
          style={{
            position: "fixed",
            left: p.x,
            top: p.y,
            width: 8 - i * 0.7,
            height: 8 - i * 0.7,
            background: `rgba(237, 28, 36, ${0.5 - i * 0.05})`,
            borderRadius: "50%",
            pointerEvents: "none",
            transform: "translate(-50%,-50%)",
            zIndex: 9998,
          }}
        />
      ))}
      <motion.div
        animate={{ scale: clicked ? 0.7 : 1 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: 32,
          height: 32,
          border: `2px solid ${OOREDOO.red}`,
          borderRadius: "50%",
          pointerEvents: "none",
          transform: "translate(-50%,-50%)",
          zIndex: 9999,
        }}
      />
    </>
  );
}

// ============================================
// 🔤 TYPING
// ============================================
function TypingText({ text, delay = 0 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayed(text.slice(0, i));
          i++;
        } else {
          setDone(true);
          clearInterval(interval);
        }
      }, 60);
    }, delay);
    return () => clearTimeout(start);
  }, [text, delay]);

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: OOREDOO.red }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// ============================================
// 🔮 TILT CARD
// ============================================
function TiltCard({ children }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(1200px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`,
      transition: "transform 0.1s ease-out",
    });
  };

  const onLeave = () => {
    setStyle({
      transform: "perspective(1200px) rotateY(0deg) rotateX(0deg)",
      transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ ...style, transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// ============================================
// 🧲 MAGNETIC BUTTON
// ============================================
function MagneticButton({ children, onClick, style, disabled, ...props }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPos({ x: x * 0.25, y: y * 0.25 });
  };

  const onLeave = () => setPos({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      disabled={disabled}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      style={style}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ============================================
// 📊 PASSWORD STRENGTH
// ============================================
function PasswordStrength({ password }) {
  const getStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const labels = ["Très faible", "Faible", "Moyen", "Bon", "Fort", "Excellent"];
  const colors = ["#ED1C24", "#FF6B6B", "#FFB800", "#FFD966", "#88CC00", "#22c55e"];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      style={{ marginTop: -10 }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i < strength ? colors[strength] : "rgba(255,255,255,0.1)",
            }}
            style={{ flex: 1, height: 4, borderRadius: 2 }}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 11,
          color: colors[strength],
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        {labels[strength]}
      </div>
    </motion.div>
  );
}

// ============================================
// 🏠 COMPOSANT PRINCIPAL
// ============================================
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const emailValid = email === "" ? null : isValidEmail(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (resetMode) {
        await sendPasswordResetEmail(auth, email);
        setSuccess("Email de réinitialisation envoyé !");
        setLoading(false);
        return;
      }

      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      // 🎉 Confetti couleurs Ooredoo
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: [OOREDOO.red, OOREDOO.white, OOREDOO.redDark, OOREDOO.gold],
      });

      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(
        err.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, "")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: [OOREDOO.red, OOREDOO.white, OOREDOO.redDark, OOREDOO.gold],
      });
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setResetMode(false);
    setError("");
    setSuccess("");
    setPassword("");
  };

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <>
      <CustomCursor />
      <FluidShader />
      <ShootingStars />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 2,
        }}
      >
        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setDarkMode(!darkMode)}
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `1px solid ${OOREDOO.red}`,
            background: "rgba(237,28,36,0.15)",
            backdropFilter: "blur(10px)",
            color: OOREDOO.white,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: mounted ? 1 : 0, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          style={{ perspective: 1200 }}
        >
          <TiltCard>
            <div
              style={{
                ...theme.card,
                padding: "44px 40px 36px",
                borderRadius: 24,
                width: "100%",
                maxWidth: 440,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow border Ooredoo */}
              <motion.div
                animate={{
                  background: [
                    `linear-gradient(0deg, ${OOREDOO.red}, ${OOREDOO.gold}, ${OOREDOO.red})`,
                    `linear-gradient(360deg, ${OOREDOO.red}, ${OOREDOO.gold}, ${OOREDOO.red})`,
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  inset: -2,
                  borderRadius: 26,
                  zIndex: -1,
                  opacity: 0.5,
                  filter: "blur(8px)",
                }}
              />

              {/* Logo Ooredoo (SVG stylisé) */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <motion.div
                  animate={{
                    rotateY: [0, 360],
                    boxShadow: [
                      `0 0 20px ${OOREDOO.red}80`,
                      `0 0 40px ${OOREDOO.red}CC`,
                      `0 0 20px ${OOREDOO.red}80`,
                    ],
                  }}
                  transition={{
                    rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                    boxShadow: { duration: 2, repeat: Infinity },
                  }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${OOREDOO.red} 0%, ${OOREDOO.redDark} 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Logo Ooredoo — cercles rouges stylisés */}
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="14" cy="14" r="5" fill={OOREDOO.white} />
                    <circle cx="26" cy="14" r="5" fill={OOREDOO.white} opacity="0.7" />
                    <circle cx="14" cy="26" r="5" fill={OOREDOO.white} opacity="0.7" />
                    <circle cx="26" cy="26" r="5" fill={OOREDOO.white} opacity="0.4" />
                  </svg>
                </motion.div>
              </div>

              {/* Brand Ooredoo */}
              <motion.p
                initial={{ opacity: 0, letterSpacing: "0em" }}
                animate={{ opacity: 1, letterSpacing: "0.3em" }}
                transition={{ delay: 0.5, duration: 1 }}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: OOREDOO.red,
                  margin: "0 0 12px",
                  textTransform: "uppercase",
                }}
              >
                OOREDOO
              </motion.p>

              <h1
                style={{
                  ...theme.title,
                  fontSize: 26,
                  fontWeight: 800,
                  textAlign: "center",
                  margin: 0,
                  letterSpacing: -0.5,
                }}
              >
                {resetMode ? (
                  <TypingText text="Réinitialisation" delay={200} />
                ) : isSignup ? (
                  <TypingText text="Créer un compte" delay={200} />
                ) : (
                  <TypingText text="Bon retour 👋" delay={200} />
                )}
              </h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                style={{
                  ...theme.subtitle,
                  textAlign: "center",
                  fontSize: 14,
                  margin: "8px 0 28px",
                }}
              >
                {resetMode
                  ? "Entre ton email pour réinitialiser"
                  : isSignup
                  ? "Rejoins l'espace Planning Ooredoo"
                  : "Connecte-toi pour continuer"}
              </motion.p>

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <InputField
                  icon={<Mail size={18} />}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  focused={focusedField === "email"}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  valid={emailValid}
                  theme={theme}
                />

                {!resetMode && (
                  <InputField
                    icon={<Lock size={18} />}
                    label="Mot de passe"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    focused={focusedField === "password"}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    theme={theme}
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: theme.text,
                          opacity: 0.6,
                          padding: 4,
                          display: "flex",
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />
                )}

                {isSignup && !resetMode && (
                  <PasswordStrength password={password} />
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(237,28,36,0.12)",
                        border: `1px solid ${OOREDOO.red}66`,
                        color: OOREDOO.redLight,
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontSize: 13,
                      }}
                    >
                      <AlertCircle size={16} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.4)",
                        color: "#22c55e",
                        padding: "10px 14px",
                        borderRadius: 10,
                        fontSize: 13,
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isSignup && !resetMode && (
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: OOREDOO.red,
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "right",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    Mot de passe oublié ?
                  </button>
                )}

                {/* Bouton principal Ooredoo */}
                <MagneticButton
                  type="submit"
                  disabled={loading}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    padding: "16px",
                    background: `linear-gradient(135deg, ${OOREDOO.red} 0%, ${OOREDOO.redDark} 100%)`,
                    color: OOREDOO.white,
                    border: "none",
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.8 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow: `0 12px 30px ${OOREDOO.red}66`,
                    minHeight: 54,
                    fontFamily: "inherit",
                  }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 20,
                        height: 20,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: OOREDOO.white,
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <>
                      {resetMode
                        ? "Envoyer le lien"
                        : isSignup
                        ? "Créer mon compte"
                        : "Se connecter"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </MagneticButton>

                {!resetMode && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        margin: "4px 0",
                      }}
                    >
                      <div style={{ flex: 1, height: 1, background: theme.divider }} />
                      <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>
                        OU
                      </span>
                      <div style={{ flex: 1, height: 1, background: theme.divider }} />
                    </div>

                    <MagneticButton
                      type="button"
                      onClick={handleGoogle}
                      disabled={loading}
                      style={{
                        padding: 14,
                        background: theme.googleBg,
                        color: theme.text,
                        border: `1px solid ${theme.divider}`,
                        borderRadius: 14,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        fontFamily: "inherit",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z"/>
                      </svg>
                      Continuer avec Google
                    </MagneticButton>
                  </>
                )}

                {resetMode && (
                  <button
                    type="button"
                    onClick={() => setResetMode(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: OOREDOO.red,
                      fontSize: 13,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ← Retour à la connexion
                  </button>
                )}
              </form>

              {!resetMode && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: theme.muted,
                    marginTop: 20,
                    marginBottom: 0,
                  }}
                >
                  {isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
                  <span
                    onClick={toggleMode}
                    style={{
                      color: OOREDOO.red,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {isSignup ? "Se connecter" : "S'inscrire"}
                  </span>
                </p>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 20,
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: `1px solid ${theme.divider}`,
                }}
              >
                <Badge icon={<Shield size={12} />} text="Sécurisé" theme={theme} />
                <Badge icon={<Zap size={12} />} text="Rapide" theme={theme} />
                <Badge icon={<Sparkles size={12} />} text="Ooredoo" theme={theme} />
              </motion.div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </>
  );
}

// ============================================
// 🔧 SOUS-COMPOSANTS
// ============================================
function InputField({
  icon,
  label,
  type,
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  valid,
  right,
  theme,
}) {
  const borderColor = focused
    ? OOREDOO.red
    : valid === false
    ? "#FF4D54"
    : valid === true
    ? "#22c55e"
    : theme.divider;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          color: focused ? OOREDOO.red : theme.muted,
          zIndex: 2,
          transition: "color 0.2s",
          display: "flex",
        }}
      >
        {icon}
      </div>

      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={label}
        required
        style={{
          width: "100%",
          padding: "16px 46px 16px 46px",
          borderRadius: 14,
          border: `2px solid ${borderColor}`,
          background: theme.inputBg,
          color: theme.text,
          fontSize: 15,
          outline: "none",
          transition: "all 0.25s ease",
          boxShadow: focused ? `0 0 0 4px ${OOREDOO.red}26` : "none",
          fontFamily: "inherit",
        }}
      />

      {right && (
        <div
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
          }}
        >
          {right}
        </div>
      )}

      {valid === true && !right && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#22c55e",
            display: "flex",
          }}
        >
          <CheckCircle2 size={18} />
        </motion.div>
      )}
    </div>
  );
}

function Badge({ icon, text, theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: theme.muted,
        fontWeight: 600,
      }}
    >
      {icon}
      {text}
    </div>
  );
}

// ============================================
// 🎨 THEMES OOREDOO
// ============================================
const darkTheme = {
  card: {
    background: "linear-gradient(135deg, rgba(25,25,30,0.95) 0%, rgba(15,15,20,0.98) 100%)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px ${OOREDOO.red}33 inset`,
    color: OOREDOO.white,
  },
  title: { color: OOREDOO.white },
  subtitle: { color: "rgba(255,255,255,0.6)" },
  text: OOREDOO.white,
  muted: "rgba(255,255,255,0.5)",
  link: OOREDOO.red,
  divider: "rgba(255,255,255,0.1)",
  inputBg: "rgba(255,255,255,0.05)",
  googleBg: "rgba(255,255,255,0.95)",
};

const lightTheme = {
  card: {
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    boxShadow: `0 30px 80px ${OOREDOO.red}33, 0 0 0 1px rgba(255,255,255,0.6) inset`,
    color: OOREDOO.black,
  },
  title: { color: OOREDOO.black },
  subtitle: { color: "#666" },
  text: OOREDOO.black,
  muted: "#888",
  link: OOREDOO.red,
  divider: "rgba(0,0,0,0.1)",
  inputBg: "rgba(255,255,255,0.7)",
  googleBg: "#ffffff",
};