// Animación de confetti profesional para eventos de éxito
window.mostrarConfetti = function mostrarConfetti({duration = 2200, colors = ['#1976d2','#43a047','#e53935','#fbc02d','#8e24aa','#00bcd4'], particleCount = 80} = {}) {
	// Crear el canvas de confetti
	let canvas = document.getElementById('confetti-canvas');
	if (!canvas) {
		canvas = document.createElement('canvas');
		canvas.id = 'confetti-canvas';
		canvas.style.position = 'fixed';
		canvas.style.top = 0;
		canvas.style.left = 0;
		canvas.style.width = '100vw';
		canvas.style.height = '100vh';
		canvas.style.pointerEvents = 'none';
		canvas.style.zIndex = 9999;
		document.body.appendChild(canvas);
	}
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Generar partículas
	const ctx = canvas.getContext('2d');
	const particles = [];
						// Eliminado bucle for duplicado, ahora el confetti aparece progresivamente
	const spawnInterval = 60; // ms entre cada "lluvia" de confetti
	const totalDuration = 4000; // 4 segundos
	particleCount = 300;
	const confettiPerSpawn = Math.ceil(particleCount / (totalDuration / spawnInterval));
	let elapsed = 0;
	let spawnTimer = setInterval(() => {
		for (let i = 0; i < confettiPerSpawn; i++) {
			const startX = Math.random() * canvas.width;
			const startY = Math.random() * (canvas.height * 0.05); // 5% superior (arriba del todo)
			const angle = (Math.random() * Math.PI) - (Math.PI / 2); // -90° a 90°
			const speed = 1.5 + Math.random() * 2.5;
			particles.push({
				x: startX,
				y: startY,
				r: 6 + Math.random() * 8,
				d: Math.random() * totalDuration,
				color: colors[Math.floor(Math.random() * colors.length)],
				tilt: Math.random() * 10 - 5,
				tiltAngle: 0,
				tiltAngleInc: (Math.random() * 0.07) + 0.05,
				vx: Math.sin(angle) * speed,
				vy: Math.abs(Math.cos(angle) * speed) + 2
			});
		}
		elapsed += spawnInterval;
		if (elapsed >= totalDuration) {
			clearInterval(spawnTimer);
		}
	}, spawnInterval);
	let start = null;
	function drawConfetti(ts) {
		if (!start) start = ts;
		const elapsed = ts - start;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		particles.forEach(p => {
			p.x += p.vx;
			p.y += p.vy;
			p.vy += 0.18; // gravedad
			p.tiltAngle += p.tiltAngleInc;
			p.tilt = Math.sin(p.tiltAngle) * 12;
			ctx.beginPath();
			ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r/2, Math.PI/4, 0, 2 * Math.PI);
			ctx.fillStyle = p.color;
			ctx.globalAlpha = 0.85;
			ctx.fill();
		});
		// Mientras haya partículas en pantalla, sigue animando
		if (elapsed < totalDuration || particles.some(p => p.y < canvas.height + 30)) {
			requestAnimationFrame(drawConfetti);
		} else {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			canvas.remove();
		}
	}
	requestAnimationFrame(drawConfetti);
}
