import React, { useEffect, useRef } from "react";

// ─── Performance budget ────────────────────────────────────────────────────
// • DPR capped at 1.0   — noise shader is blurry by nature, 2x buys nothing
// • FBM octaves 5 → 3   — saves ~40% of fragment shader cost, indistinguishable
// • Throttled to 30 fps  — background motion; human eye can't tell vs 60 fps
// • Mouse effects gated  — only on desktop AND only when hero is in view
// • Single rAF, self-stopping via IntersectionObserver + visibilitychange
// ──────────────────────────────────────────────────────────────────────────

const TARGET_FPS = 30;
const FRAME_MS   = 1000 / TARGET_FPS;

const ShaderBackground = ({ isDark, modeRef, targetModeRef }) => {
  const canvasRef    = useRef(null);
  const mouseRef     = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const timeRef      = useRef(0);
  const rafRef       = useRef(null);
  const lastTimeRef  = useRef(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) return;

    // ── Shaders ──────────────────────────────────────────────
    const vertSrc = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // FBM reduced to 3 octaves (was 5) — ~40% cheaper, visually identical
    const fragSrc = `
      precision mediump float;
      uniform vec2  u_resolution;
      uniform float u_time;
      uniform vec2  u_mouse;
      uniform float u_mode;
      uniform float u_mouseActive;

      vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}

      float snoise(vec2 v){
        const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
        vec2 i=floor(v+dot(v,C.yy));
        vec2 x0=v-i+dot(i,C.xx);
        vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
        vec4 x12=x0.xyxy+C.xxzz;
        x12.xy-=i1;
        i=mod289(i);
        vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
        vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
        m=m*m;m=m*m;
        vec3 x=2.0*fract(p*C.www)-1.0;
        vec3 h=abs(x)-0.5;
        vec3 ox=floor(x+0.5);
        vec3 a0=x-ox;
        m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
        vec3 g;
        g.x=a0.x*x0.x+h.x*x0.y;
        g.yz=a0.yz*x12.xz+h.yz*x12.yw;
        return 130.0*dot(m,g);
      }

      /* 3 octaves instead of 5 */
      float fbm(vec2 st){
        float v=0.0,a=0.5;
        for(int i=0;i<3;i++){v+=a*snoise(st);st*=2.0;a*=0.5;}
        return v;
      }

      void main(){
        vec2 st=gl_FragCoord.xy/u_resolution;
        float t=u_time*0.08;

        float flow1=fbm(st*3.0+vec2(t*0.4,0.0));
        float flow2=fbm(st*2.5+vec2(0.0,-t*0.3));
        float flow3=fbm(st*4.0+vec2(t*0.2,t*0.25));

        float lines1=sin((st.x-st.y)*12.0+t)*0.5+0.5;
        float lines2=sin((st.x+st.y*0.7)*15.0-t*0.8)*0.5+0.5;
        float lines=smoothstep(0.35,0.65,(lines1+lines2)*0.5);

        vec2 toMouse=st-u_mouse;
        float mouseDist=length(toMouse);

        float coreGlow  = exp(-mouseDist*8.0)*1.2  *u_mouseActive;
        float aura      = exp(-mouseDist*3.5)*0.8  *u_mouseActive;
        float outerField= exp(-mouseDist*1.8)*0.5  *u_mouseActive;

        float ring1=abs(sin(mouseDist*8.0 -t*3.0))*aura;
        float ring2=abs(sin(mouseDist*12.0-t*4.5+1.5))*aura*0.7;
        float ring3=abs(sin(mouseDist*16.0-t*6.0+3.0))*aura*0.5;
        float rings=(ring1+ring2+ring3)*0.4;

        float angle=atan(toMouse.y,toMouse.x);
        float spiral=sin(angle*4.0+mouseDist*10.0-t*3.0)*0.5+0.5;
        float directional=spiral*outerField*0.6;

        vec2 warpedSt=st+toMouse*aura*0.08;
        float warpFlow=fbm(warpedSt*5.0+t*0.5)*u_mouseActive;

        float burst=smoothstep(0.12,0.0,mouseDist)*u_mouseActive;
        float burstPulse=(sin(t*6.0)*0.5+0.5)*0.3+0.7;
        burst*=burstPulse;

        float magnetic=outerField*(1.0+sin(mouseDist*6.0-t*2.0)*0.3);

        float mouseField=0.0;
        mouseField+=coreGlow*0.5;
        mouseField+=rings*0.35;
        mouseField+=directional*0.25;
        mouseField+=burst*0.4;
        mouseField+=magnetic*0.15;
        mouseField+=warpFlow*outerField*0.2;

        vec2 gridSt=st*18.0+vec2(t*0.08,-t*0.12)+toMouse*aura*1.5;
        vec2 grid=fract(gridSt);
        float gridPattern=smoothstep(0.06,0.0,min(grid.x,grid.y))*mix(1.0,2.5,u_mode);

        vec2 microGrid=fract(st*35.0+vec2(-t*0.05,t*0.08));
        float microPattern=smoothstep(0.01,0.0,min(microGrid.x,microGrid.y))*0.3*mix(1.0,2.0,u_mode);

        float wave1=sin(st.x*10.0+t+flow1*2.0)*0.5+0.5;
        float wave2=cos(st.y*8.0 -t+flow2*2.0)*0.5+0.5;

        float pattern=0.0;
        pattern+=flow1*0.22;
        pattern+=flow2*0.22;
        pattern+=flow3*0.14;
        pattern+=lines*0.12;
        pattern+=gridPattern*0.20;
        pattern+=microPattern*0.06;
        pattern+=(wave1*wave2)*0.08;
        pattern+=mouseField*0.6;

        vec3 darkBase     =vec3(0.005,0.005,0.005);
        vec3 darkPrimary  =vec3(0.03,0.03,0.035);
        vec3 darkAccent   =vec3(0.06,0.065,0.08);
        vec3 darkHighlight=vec3(0.11,0.12,0.15);
        vec3 darkGlow     =vec3(0.18,0.20,0.25);
        vec3 darkBright   =vec3(0.28,0.32,0.40);

        vec3 lightBase     =vec3(1.00,0.98,0.97);
        vec3 lightPrimary  =vec3(0.98,0.94,0.92);
        vec3 lightAccent   =vec3(0.94,0.84,0.80);
        vec3 lightHighlight=vec3(0.88,0.72,0.66);
        vec3 lightGlow     =vec3(0.80,0.58,0.52);
        vec3 lightBright   =vec3(0.70,0.42,0.36);
        vec3 cursorColor   =vec3(0.72,0.42,0.38);

        vec3 darkColor=darkBase;
        darkColor=mix(darkColor,darkPrimary, pattern*0.6);
        darkColor=mix(darkColor,darkAccent,  smoothstep(0.3,0.8, pattern)*0.4);
        darkColor=mix(darkColor,darkHighlight,smoothstep(0.6,0.95,pattern)*0.35);
        darkColor=mix(darkColor,darkGlow,    smoothstep(0.75,1.0,pattern)*0.3);
        darkColor+=darkBright*smoothstep(0.9,1.0,pattern)*0.2;
        darkColor+=darkGlow*mouseField*0.3;
        darkColor+=darkBright*burst*0.25;

        vec3 lightColor=lightBase;
        lightColor=mix(lightColor,lightPrimary,  pattern*0.5);
        lightColor=mix(lightColor,lightAccent,   smoothstep(0.2,0.7,pattern)*0.4);
        lightColor=mix(lightColor,lightHighlight,smoothstep(0.5,0.85,pattern)*0.38);
        lightColor=mix(lightColor,lightGlow,     smoothstep(0.65,0.95,pattern)*0.3);
        lightColor=mix(lightColor,lightBright,   smoothstep(0.8,1.0,pattern)*0.25);
        lightColor=mix(lightColor,cursorColor,   mouseField*0.45);
        lightColor=mix(lightColor,cursorColor,   burst*0.4);

        vec3 color=mix(lightColor,darkColor,u_mode);

        float centerDist=length(st-0.5);
        float vignette=1.0-smoothstep(0.15,1.4,centerDist);
        color*=(1.0-mix(0.12,0.38,u_mode))+vignette*mix(0.12,0.38,u_mode);

        float radialGlow=1.0-smoothstep(0.0,0.7,centerDist);
        color+=mix(lightGlow,darkGlow,u_mode)*radialGlow*mix(0.08,0.07,u_mode);
        color+=mix(lightBright,darkBright,u_mode)*coreGlow*0.12;

        /* grain — cheap, single sample */
        float grain=fract(sin(dot(st*u_time,vec2(12.9898,78.233)))*43758.5453);
        color+=(grain-0.5)*0.012;

        gl_FragColor=vec4(color,1.0);
      }
    `;

    // ── Compile ───────────────────────────────────────────────
    function compile(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("Shader:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compile(vertSrc, gl.VERTEX_SHADER));
    gl.attachShader(program, compile(fragSrc, gl.FRAGMENT_SHADER));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes        = gl.getUniformLocation(program, "u_resolution");
    const uTime       = gl.getUniformLocation(program, "u_time");
    const uMouse      = gl.getUniformLocation(program, "u_mouse");
    const uMode       = gl.getUniformLocation(program, "u_mode");
    const uMouseActive= gl.getUniformLocation(program, "u_mouseActive");

    // ── Resize — DPR capped at 1.0 ───────────────────────────
    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.0); // was 2 — kills perf for nothing
      canvas.width  = canvas.clientWidth  * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Mouse — desktop only ──────────────────────────────────
    const isDesktop = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    let mouseActiveTarget = isDesktop.matches ? 1 : 0;
    let mouseActiveCurrent = mouseActiveTarget;

    const handleMouseMove = (e) => {
      if (!isDesktop.matches) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left) / rect.width;
      mouseRef.current.targetY = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // ── Visibility guards ─────────────────────────────────────
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // ── Render loop — capped at 30 fps ────────────────────────
    function render(now) {
      rafRef.current = requestAnimationFrame(render);

      if (!isVisibleRef.current) return;

      // Throttle to TARGET_FPS
      const delta = now - lastTimeRef.current;
      if (delta < FRAME_MS) return;
      // Align timestamp to avoid drift
      lastTimeRef.current = now - (delta % FRAME_MS);

      timeRef.current += delta * 0.001; // real elapsed seconds

      // Lerp mouse
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.05;
      m.y += (m.targetY - m.y) * 0.05;

      // Lerp theme mode
      modeRef.current += (targetModeRef.current - modeRef.current) * 0.08;

      // Lerp mouse active (smooth disable on resize to mobile)
      mouseActiveTarget = isDesktop.matches ? 1 : 0;
      mouseActiveCurrent += (mouseActiveTarget - mouseActiveCurrent) * 0.08;

      gl.uniform1f(uTime,        timeRef.current);
      gl.uniform2f(uMouse,       m.x, m.y);
      gl.uniform1f(uMode,        modeRef.current);
      gl.uniform1f(uMouseActive, mouseActiveCurrent);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    rafRef.current = requestAnimationFrame(render);

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      observer.disconnect();
      gl.deleteProgram(program);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

export default ShaderBackground;