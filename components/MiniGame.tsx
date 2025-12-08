import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlanetName } from '../types';

interface MiniGameProps {
  planet: PlanetName;
  onGameOver: (won: boolean, score: number) => void;
}

export const MiniGame: React.FC<MiniGameProps> = ({ planet, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Game State Refs
  const gameState = useRef({
    playing: true,
    score: 0,
    time: 0,
    lastTime: 0,
    // Physics entities (generic buckets)
    player: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, fuel: 100, grounded: false, radius: 10 },
    items: [] as any[],
    particles: [] as any[],
    environment: { offset: 0, gravityVector: 0, wind: 0, difficulty: 1 }
  });

  const handleInput = useCallback((type: 'start' | 'end' | 'move', x?: number, y?: number) => {
    if (!gameState.current.playing) return;
    const state = gameState.current;

    switch (planet) {
      case PlanetName.Mercury: // Top-down movement
        if (x !== undefined && y !== undefined) {
           state.player.x = x;
           state.player.y = y;
        }
        break;

      case PlanetName.Venus: // Hold to thrust
        if (type === 'start') state.player.grounded = true; // reusing 'grounded' as 'thrusting' flag
        if (type === 'end') state.player.grounded = false;
        if (x !== undefined) state.player.x = x; // Horizontal control
        break;

      case PlanetName.Earth: // Rotate Shield
        if (x !== undefined && y !== undefined) {
           const cx = 200; // Canvas center
           const cy = 250; 
           state.player.angle = Math.atan2(y - cy, x - cx);
        }
        break;

      case PlanetName.Mars: // Steer Rover (Mouse relative to center steers)
        if (x !== undefined) {
           // x is 0-400. Center 200.
           // Map 0-400 to -1 to 1 steering
           state.player.angle = (x - 200) / 100; // Steering torque
        }
        break;

      case PlanetName.Jupiter: // Hold to boost (widen orbit)
        if (type === 'start') state.player.grounded = true; // Boosting
        if (type === 'end') state.player.grounded = false;
        break;

      case PlanetName.Saturn: // X movement
        if (x !== undefined) state.player.x = x;
        break;
        
      case PlanetName.Uranus: // Horizontal movement for Catcher game
        if (x !== undefined) state.player.x = x;
        break;

      case PlanetName.Neptune: // Hold to fight wind
        if (type === 'start') state.player.grounded = true;
        if (type === 'end') state.player.grounded = false;
        if (y !== undefined) state.player.y = y;
        break;
    }
  }, [planet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- INITIALIZATION ---
    gameState.current = {
      playing: true,
      score: 0,
      time: 30, // Default duration
      lastTime: performance.now(),
      player: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, fuel: 100, grounded: false, radius: 10 },
      items: [],
      particles: [],
      environment: { offset: 0, gravityVector: 0, wind: 0, difficulty: 1 }
    };

    const state = gameState.current;

    // Specific Init
    if (planet === PlanetName.Mercury) {
      state.player.x = 200; 
      state.player.y = 250;
      state.time = 30; 
    } else if (planet === PlanetName.Venus) {
       state.player.x = 200;
       state.player.y = 400;
       state.time = 40; 
    } else if (planet === PlanetName.Earth) {
       state.player.angle = 0;
       state.time = 45;
    } else if (planet === PlanetName.Mars) {
       state.player.x = 200;
       state.player.y = 200;
       state.time = 40;
    } else if (planet === PlanetName.Jupiter) {
       state.player.radius = 100; // Orbital radius
       state.player.angle = 0;
       state.time = 60;
    } else if (planet === PlanetName.Saturn) {
       state.player.x = 200;
       state.player.y = 400;
       state.time = 40;
    } else if (planet === PlanetName.Uranus) {
       state.player.x = 200;
       state.player.y = 450; // Bottom of screen
       state.time = 40;
    } else if (planet === PlanetName.Neptune) {
       state.player.x = 50;
       state.player.y = 250;
       state.time = 40;
    }

    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (!state.playing) return;
      const dt = Math.min((timestamp - state.lastTime) / 1000, 0.1); // Cap dt
      state.lastTime = timestamp;
      
      state.time -= dt;
      setTimeLeft(Math.ceil(state.time));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- LOGIC & RENDER SWITCH ---
      switch (planet) {
        // ================= MERCURY: SOLAR FLARE SURVIVAL =================
        case PlanetName.Mercury: {
           // Bullet Hell
           const cx = 200; const cy = 250;
           // Reduced difficulty ramp speed (was 0.05)
           state.environment.difficulty += dt * 0.02;
           
           // Spawn Flares
           // Reduced spawn rate base (was 0.1)
           if (Math.random() < 0.08 * state.environment.difficulty) {
              const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
              let startX = 0, startY = 0;
              if (side === 0) { startX = Math.random() * 400; startY = -20; }
              if (side === 1) { startX = 420; startY = Math.random() * 500; }
              if (side === 2) { startX = Math.random() * 400; startY = 520; }
              if (side === 3) { startX = -20; startY = Math.random() * 500; }
              
              // Target slightly randomized near center to force movement
              const targetX = Math.random() * 200 + 100;
              const targetY = Math.random() * 200 + 150;
              
              const angle = Math.atan2(targetY - startY, targetX - startX);
              // Reduced speed (was 200 + 100)
              const speed = 100 + Math.random() * 100;
              
              state.items.push({
                 x: startX, y: startY,
                 vx: Math.cos(angle) * speed,
                 vy: Math.sin(angle) * speed,
                 size: 8 + Math.random() * 8
              });
           }

           // Update Flares
           state.items.forEach(item => {
              item.x += item.vx * dt;
              item.y += item.vy * dt;
              
              // Collision
              const dist = Math.hypot(item.x - state.player.x, item.y - state.player.y);
              if (dist < item.size + 8) { // Player radius approx 8
                 state.playing = false;
                 onGameOver(false, state.score);
              }
           });
           
           // Cleanup
           state.items = state.items.filter(i => i.x > -50 && i.x < 450 && i.y > -50 && i.y < 550);
           
           state.score += 20 * dt;
           setScore(state.score);

           // Draw Background (Intense Sun)
           const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
           grad.addColorStop(0, '#fef08a'); // Light yellow
           grad.addColorStop(0.5, '#ef4444'); // Red
           grad.addColorStop(1, '#7f1d1d'); // Dark Red
           ctx.fillStyle = grad;
           ctx.fillRect(0,0,400,500);

           // Flares
           ctx.fillStyle = '#fff';
           state.items.forEach(item => {
              ctx.beginPath(); ctx.arc(item.x, item.y, item.size, 0, Math.PI*2); ctx.fill();
              // Trail
              ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
              ctx.lineWidth = item.size;
              ctx.beginPath(); ctx.moveTo(item.x, item.y); ctx.lineTo(item.x - item.vx * 0.1, item.y - item.vy * 0.1); ctx.stroke();
           });

           // Player
           ctx.shadowColor = 'black';
           ctx.shadowBlur = 10;
           ctx.fillStyle = '#38bdf8'; // Blue coolant shield
           ctx.beginPath(); ctx.arc(state.player.x, state.player.y, 8, 0, Math.PI*2); ctx.fill();
           ctx.shadowBlur = 0;
           break;
        }

        // ================= VENUS: ASCENSION =================
        case PlanetName.Venus: {
           // Physics
           const gravity = 200;
           const thrust = -500;
           state.player.vy += gravity * dt;
           
           if (state.player.grounded) { // Thrusting
             state.player.vy += thrust * dt;
             // Particles
             state.particles.push({x: state.player.x, y: state.player.y + 10, life: 0.5});
           }
           state.player.y += state.player.vy * dt;

           // Bounds
           if (state.player.y > 500) { state.playing = false; onGameOver(false, state.score); }
           if (state.player.y < 0) state.player.y = 0; // Ceiling

           // Spawn items
           if (Math.random() < 0.05) {
              state.items.push({ 
                x: Math.random() < 0.5 ? -20 : 420, 
                y: Math.random() * 400, 
                vx: (Math.random() < 0.5 ? 1 : -1) * (100 + Math.random() * 100),
                type: 'acid'
              });
           }

           state.items.forEach(item => {
              item.x += item.vx * dt;
              // Collision
              const dist = Math.hypot(item.x - state.player.x, item.y - state.player.y);
              if (dist < 20) {
                 state.playing = false;
                 onGameOver(false, state.score);
              }
           });

           // Score
           state.score += 5 * dt;
           setScore(state.score);

           // Draw
           ctx.fillStyle = '#facc15'; // Yellow haze
           ctx.globalAlpha = 0.2;
           ctx.fillRect(0,0,400,500);
           ctx.globalAlpha = 1.0;

           // Particles
           ctx.fillStyle = '#fff';
           state.particles.forEach((p, i) => {
              p.life -= dt;
              ctx.fillRect(p.x, p.y, 2, 2);
           });
           state.particles = state.particles.filter(p => p.life > 0);

           // Player
           ctx.fillStyle = '#fff';
           ctx.beginPath();
           ctx.moveTo(state.player.x, state.player.y - 10);
           ctx.lineTo(state.player.x - 10, state.player.y + 10);
           ctx.lineTo(state.player.x + 10, state.player.y + 10);
           ctx.fill();

           // Clouds
           ctx.fillStyle = '#a16207';
           state.items.forEach(item => {
              ctx.beginPath();
              ctx.arc(item.x, item.y, 15, 0, Math.PI*2);
              ctx.fill();
           });
           break;
        }

        // ================= EARTH: ORBITAL DEFENSE =================
        case PlanetName.Earth: {
           // Shield is at angle state.player.angle
           const cx = 200, cy = 250;
           const radius = 60;

           // Spawn
           if (Math.random() < 0.03) {
              const spawnAngle = Math.random() * Math.PI * 2;
              state.items.push({
                 x: cx + Math.cos(spawnAngle) * 300,
                 y: cy + Math.sin(spawnAngle) * 300,
                 vx: -Math.cos(spawnAngle) * 100,
                 vy: -Math.sin(spawnAngle) * 100,
                 type: Math.random() > 0.7 ? 'friend' : 'foe'
              });
           }

           // Update Items
           state.items.forEach((item, i) => {
              item.x += item.vx * dt;
              item.y += item.vy * dt;
              
              const dist = Math.hypot(item.x - cx, item.y - cy);
              
              // Hit Shield range
              if (dist < radius + 10 && dist > radius - 10) {
                 const itemAngle = Math.atan2(item.y - cy, item.x - cx);
                 let diff = Math.abs(itemAngle - state.player.angle);
                 if (diff > Math.PI) diff = Math.PI * 2 - diff; // Wrap logic

                 if (diff < 0.5) { // Shield Blocked
                    if (item.type === 'friend') {
                       state.score -= 50; // Killed friend
                       item.dead = true;
                    } else {
                       state.score += 10; // Blocked junk
                       item.dead = true;
                       // Spark
                       state.particles.push({x: item.x, y: item.y, life: 0.2});
                    }
                 }
              }

              if (dist < 20 && !item.dead) { // Hit station
                 if (item.type === 'foe') {
                    state.playing = false;
                    onGameOver(false, state.score);
                 } else {
                    state.score += 50; // Saved friend
                    item.dead = true;
                 }
              }
           });
           state.items = state.items.filter(i => !i.dead);
           setScore(state.score);

           // Draw
           // Station
           ctx.fillStyle = '#3b82f6';
           ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2); ctx.fill();
           
           // Shield
           ctx.strokeStyle = '#60a5fa';
           ctx.lineWidth = 5;
           ctx.beginPath();
           ctx.arc(cx, cy, radius, state.player.angle - 0.5, state.player.angle + 0.5);
           ctx.stroke();

           // Items
           state.items.forEach(item => {
              ctx.fillStyle = item.type === 'friend' ? '#4ade80' : '#94a3b8';
              ctx.beginPath(); ctx.arc(item.x, item.y, 5, 0, Math.PI*2); ctx.fill();
           });

           // Particles
           ctx.fillStyle = 'orange';
           state.particles.forEach(p => { p.life -= dt; ctx.fillRect(p.x, p.y, 3, 3); });
           break;
        }

        // ================= MARS: RED ROVER DRIFT =================
        case PlanetName.Mars: {
           // Player is fixed in center. World moves (camera follow)
           const speed = 150;
           // Steering (angle stores turn rate)
           const turnRate = state.player.angle * 2; // -2 to 2 rad/s
           state.player.vx += (Math.cos(state.player.vy) * speed - state.player.vx) * 2 * dt; // Using vy as heading
           state.player.vy += turnRate * dt; // vy is Heading angle here

           // World generation
           if (Math.random() < 0.05) {
              // Spawn rock or sample relative to heading
              const dist = 300;
              const spawnAngle = state.player.vy + (Math.random() - 0.5) * 1.5;
              state.items.push({
                 x: 200 + Math.cos(spawnAngle) * dist,
                 y: 200 + Math.sin(spawnAngle) * dist,
                 type: Math.random() > 0.2 ? 'rock' : 'sample'
              });
           }

           // Update Items relative to drift
           const fwdX = Math.cos(state.player.vy) * speed * dt;
           const fwdY = Math.sin(state.player.vy) * speed * dt;
           
           state.items.forEach((item, i) => {
              item.x -= fwdX;
              item.y -= fwdY;
              
              const dist = Math.hypot(item.x - 200, item.y - 200);
              if (dist < 20) {
                 if (item.type === 'rock') {
                    state.score -= 20;
                    // Screen shake?
                    item.dead = true;
                 } else {
                    state.score += 50;
                    item.dead = true;
                 }
              }
           });
           state.items = state.items.filter(i => !i.dead && Math.hypot(i.x-200, i.y-200) < 400);
           setScore(state.score);

           // Draw
           // Ground
           ctx.fillStyle = '#7f1d1d';
           ctx.fillRect(0,0,400,500);
           
           // Tracks
           state.particles.push({x: 200, y: 200, life: 1, angle: state.player.vy});
           ctx.fillStyle = '#450a0a';
           state.particles.forEach(p => {
              p.life -= dt;
              p.x -= fwdX; p.y -= fwdY;
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.angle);
              ctx.fillRect(-10, -5, 5, 2);
              ctx.fillRect(-10, 5, 5, 2);
              ctx.restore();
           });
           state.particles = state.particles.filter(p => p.life > 0);

           // Items
           state.items.forEach(item => {
              ctx.fillStyle = item.type === 'rock' ? '#1c1917' : '#3b82f6';
              ctx.beginPath();
              if (item.type === 'rock') {
                 ctx.fillRect(item.x - 10, item.y - 10, 20, 20);
              } else {
                 ctx.arc(item.x, item.y, 8, 0, Math.PI*2);
                 ctx.fill();
              }
           });

           // Rover
           ctx.save();
           ctx.translate(200, 200);
           ctx.rotate(state.player.vy);
           ctx.fillStyle = '#e2e8f0';
           ctx.fillRect(-15, -10, 30, 20); // Body
           ctx.fillStyle = '#000';
           ctx.fillRect(10, -8, 5, 16); // Windshield
           ctx.restore();

           // Dust
           ctx.fillStyle = `rgba(220, 38, 38, ${0.1 + Math.random() * 0.1})`;
           ctx.fillRect(0,0,400,500);
           break;
        }

        // ================= JUPITER: GRAVITY WELL =================
        case PlanetName.Jupiter: {
           const cx = 200, cy = 250;
           // Player state: radius, angle
           // Grounded = Thrusting (Increasing Radius)
           
           // Physics
           const gravity = -50 * dt; // Pulls in
           const thrust = 100 * dt; // Pushes out
           
           if (state.player.grounded) state.player.radius += thrust;
           else state.player.radius += gravity;
           
           // Conservation of angular momentum approx: closer = faster
           const orbitalSpeed = (200 / state.player.radius) * dt; 
           state.player.angle += orbitalSpeed;

           // Bounds
           if (state.player.radius < 40 || state.player.radius > 190) {
              state.playing = false;
              onGameOver(false, state.score);
           }

           // Moons spawn
           if (Math.random() < 0.02) {
              state.items.push({
                 angle: Math.random() * Math.PI * 2,
                 dist: 50 + Math.random() * 130,
                 life: 5
              });
           }

           // Collect Moons
           state.items.forEach(item => {
               // Check if player angle crosses item angle
               // Simple distance check in polar is hard, convert to cartesian
               const ix = cx + Math.cos(item.angle) * item.dist;
               const iy = cy + Math.sin(item.angle) * item.dist;
               const px = cx + Math.cos(state.player.angle) * state.player.radius;
               const py = cy + Math.sin(state.player.angle) * state.player.radius;
               
               if (Math.hypot(ix-px, iy-py) < 20) {
                  state.score += 50;
                  item.dead = true;
                  // Effect
                  state.particles.push({x: ix, y: iy, life: 0.5});
               }
           });
           state.items = state.items.filter(i => !i.dead);
           setScore(state.score);

           // Draw
           ctx.fillStyle = '#000'; ctx.fillRect(0,0,400,500);
           
           // Jupiter
           const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 40);
           grad.addColorStop(0, '#fdba74');
           grad.addColorStop(1, '#9a3412');
           ctx.fillStyle = grad;
           ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI*2); ctx.fill();

           // Orbit Path (Player)
           ctx.strokeStyle = 'rgba(255,255,255,0.1)';
           ctx.beginPath(); ctx.arc(cx, cy, state.player.radius, 0, Math.PI*2); ctx.stroke();

           // Moons
           ctx.fillStyle = '#94a3b8';
           state.items.forEach(item => {
              const x = cx + Math.cos(item.angle) * item.dist;
              const y = cy + Math.sin(item.angle) * item.dist;
              ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill();
           });

           // Player
           const px = cx + Math.cos(state.player.angle) * state.player.radius;
           const py = cy + Math.sin(state.player.angle) * state.player.radius;
           ctx.fillStyle = '#38bdf8';
           ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2); ctx.fill();
           // Thruster
           if (state.player.grounded) {
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI*2); ctx.fill();
           }
           break;
        }

        // ================= SATURN: RING RACER =================
        case PlanetName.Saturn: {
           // Vertical Scroller
           const speed = 400;
           
           // Spawn Asteroids
           if (Math.random() < 0.1) {
              state.items.push({
                 x: Math.random() * 400,
                 y: -50,
                 size: 10 + Math.random() * 30,
                 color: Math.random() > 0.5 ? '#d6d3d1' : '#a8a29e'
              });
           }

           // Update
           state.items.forEach(item => {
              item.y += speed * dt;
              
              // Collision
              const dist = Math.hypot(item.x - state.player.x, item.y - state.player.y);
              if (dist < item.size/2 + 10) {
                 state.playing = false;
                 onGameOver(false, state.score);
              }
           });
           state.items = state.items.filter(i => i.y < 550);
           
           state.score += 10 * dt;
           setScore(state.score);

           // Draw
           ctx.fillStyle = '#0c0a09'; ctx.fillRect(0,0,400,500); // Dark BG

           // Speed lines
           ctx.strokeStyle = 'rgba(255,255,255,0.1)';
           ctx.beginPath();
           for(let i=0; i<5; i++) {
              const x = (state.time * 100 + i * 80) % 400;
              ctx.moveTo(x, 0); ctx.lineTo(x, 500);
           }
           ctx.stroke();

           // Rocks
           state.items.forEach(item => {
              ctx.fillStyle = item.color;
              ctx.beginPath(); ctx.arc(item.x, item.y, item.size/2, 0, Math.PI*2); ctx.fill();
           });

           // Ship
           ctx.fillStyle = '#d8b4fe';
           ctx.beginPath();
           ctx.moveTo(state.player.x, state.player.y - 15);
           ctx.lineTo(state.player.x - 10, state.player.y + 10);
           ctx.lineTo(state.player.x + 10, state.player.y + 10);
           ctx.fill();
           // Engine
           ctx.fillStyle = '#22d3ee';
           ctx.fillRect(state.player.x - 5, state.player.y + 10, 10, 5);
           break;
        }

        // ================= URANUS: ATMOSPHERE HARVESTER =================
        case PlanetName.Uranus: {
           // Catcher Game
           // Player at bottom y=450, x controlled by mouse
           // Items fall from top

           state.environment.difficulty += dt * 0.05;

           // Spawn
           if (Math.random() < 0.05 * state.environment.difficulty) {
              state.items.push({
                 x: Math.random() * 380 + 10,
                 y: -20,
                 vy: 150 + Math.random() * 100 + (state.environment.difficulty * 20), // Falling speed
                 type: Math.random() > 0.6 ? 'bad' : 'good' // 40% bad, 60% good
              });
           }

           // Update Items
           state.items.forEach(item => {
              item.y += item.vy * dt;
              
              // Collision
              // Box collision for player bucket (40x20)
              const hitX = item.x > state.player.x - 25 && item.x < state.player.x + 25;
              const hitY = item.y > state.player.y - 15 && item.y < state.player.y + 15;
              
              if (hitX && hitY && !item.dead) {
                  if (item.type === 'good') {
                      state.score += 50;
                      item.dead = true;
                      state.particles.push({x: item.x, y: item.y, life: 0.3, color: '#22d3ee'});
                  } else {
                      state.playing = false;
                      onGameOver(false, state.score);
                  }
              }
           });
           
           state.items = state.items.filter(i => i.y < 550 && !i.dead);
           state.score += 5 * dt; // Survival points
           setScore(state.score);
           
           // Particles
           state.particles.forEach(p => p.life -= dt);
           state.particles = state.particles.filter(p => p.life > 0);

           // Draw
           // Bg
           ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,400,500);
           const grad = ctx.createLinearGradient(0,0,0,500);
           grad.addColorStop(0, '#0e7490');
           grad.addColorStop(1, '#083344');
           ctx.fillStyle = grad;
           ctx.fillRect(0,0,400,500);

           // Player (Bucket/Ship)
           ctx.fillStyle = '#cbd5e1';
           ctx.shadowColor = 'cyan';
           ctx.shadowBlur = 10;
           ctx.fillRect(state.player.x - 25, state.player.y - 10, 50, 20);
           ctx.fillStyle = '#22d3ee'; // Inner glow
           ctx.fillRect(state.player.x - 20, state.player.y - 10, 40, 5);
           ctx.shadowBlur = 0;
           
           // Items
           state.items.forEach(item => {
               if (item.type === 'good') {
                   ctx.fillStyle = '#22d3ee';
                   ctx.beginPath(); ctx.arc(item.x, item.y, 8, 0, Math.PI*2); ctx.fill();
                   ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 5; ctx.fill(); ctx.shadowBlur=0;
               } else {
                   ctx.fillStyle = '#fff';
                   ctx.beginPath(); 
                   // Draw spike/rock
                   ctx.moveTo(item.x, item.y-10);
                   ctx.lineTo(item.x+8, item.y+8);
                   ctx.lineTo(item.x-8, item.y+8);
                   ctx.fill();
               }
           });

           // Particles
           state.particles.forEach(p => {
              ctx.fillStyle = p.color;
              ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI*2); ctx.fill();
           });

           break;
        }

        // ================= NEPTUNE: DIAMOND RAIN =================
        case PlanetName.Neptune: {
           // Wind force pushes left constantly
           const wind = -150 * dt;
           // Hold click to surge forward (right)
           const thrust = state.player.grounded ? 350 * dt : 0;
           
           state.player.vx = wind + thrust;
           state.player.x += state.player.vx;
           state.player.x = Math.max(20, Math.min(380, state.player.x)); // Clamp X

           // Vertical movement follows mouse smoothly (stored in state.player.y via input)
           // But let's interpolate for smoothness if we wanted, for now direct set in input is fine.

           // Spawn Diamonds
           if (Math.random() < 0.05) {
              state.items.push({
                 x: 420,
                 y: Math.random() * 450 + 25,
                 vx: -(200 + Math.random() * 100), // Fast
                 type: 'diamond'
              });
           }

           state.items.forEach((item, i) => {
              item.x += item.vx * dt;
              
              // Collect
              const dist = Math.hypot(item.x - state.player.x, item.y - state.player.y);
              if (dist < 20) {
                 state.score += 100;
                 state.particles.push({x: item.x, y: item.y, life: 0.3});
                 item.dead = true;
              }
           });
           state.items = state.items.filter(i => !i.dead && i.x > -50);
           setScore(state.score);

           // Draw
           // Wind streaks
           ctx.fillStyle = 'rgba(255,255,255,0.05)';
           for(let i=0; i<10; i++) ctx.fillRect(Math.random()*400, Math.random()*500, 50, 2);

           // Player Drone
           ctx.fillStyle = '#e2e8f0';
           ctx.beginPath(); 
           ctx.arc(state.player.x, state.player.y, 10, 0, Math.PI*2); 
           ctx.fill();
           // Thruster
           if (state.player.grounded) {
              ctx.fillStyle = '#3b82f6';
              ctx.beginPath(); ctx.moveTo(state.player.x-10, state.player.y); ctx.lineTo(state.player.x-20, state.player.y-5); ctx.lineTo(state.player.x-20, state.player.y+5); ctx.fill();
           }

           // Diamonds
           ctx.fillStyle = '#a5f3fc';
           state.items.forEach(item => {
              ctx.save();
              ctx.translate(item.x, item.y);
              ctx.rotate(Math.PI / 4);
              ctx.fillRect(-5, -5, 10, 10);
              ctx.restore();
           });

           // Particle Sparkle
           ctx.fillStyle = '#fff';
           state.particles.forEach(p => { p.life -= dt; ctx.fillRect(p.x + (Math.random()-0.5)*10, p.y + (Math.random()-0.5)*10, 2, 2); });
           state.particles = state.particles.filter(p => p.life > 0);
           break;
        }
      }

      // Time Check
      if (state.time <= 0 && state.playing) {
         state.playing = false;
         onGameOver(true, state.score);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [planet, onGameOver]);

  // Handle Input Events
  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); // Prevent scrolling
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 400; // Scale to internal 400 width
    const y = ((clientY - rect.top) / rect.height) * 500; // Scale to internal 500 height
    
    // Detect start vs move vs end
    let type: 'start' | 'move' | 'end' = 'move';
    if (e.type === 'mousedown' || e.type === 'touchstart') type = 'start';
    if (e.type === 'mouseup' || e.type === 'touchend') type = 'end';
    
    handleInput(type, x, y);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      <div className="flex justify-between w-full max-w-md mb-4 text-cyan-400 font-display text-xl">
        <span>TIME: {timeLeft}s</span>
        <span>SCORE: {Math.floor(score)}</span>
      </div>
      
      <canvas
        ref={canvasRef}
        width={400}
        height={500}
        className="bg-slate-900 rounded-xl border-2 border-slate-600 shadow-[0_0_20px_rgba(34,211,238,0.2)] touch-none cursor-crosshair w-full max-w-md h-[60vh] object-contain"
        onMouseDown={handleTouch}
        onMouseMove={handleTouch}
        onMouseUp={() => handleInput('end')}
        onMouseLeave={() => handleInput('end')}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        onTouchEnd={() => handleInput('end')}
      />
    </div>
  );
};