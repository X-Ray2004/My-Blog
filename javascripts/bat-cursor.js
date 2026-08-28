(function () {
  const FRAME_SIZE = 45; // عدّليها لو مقاس صورك مختلف
  const BASE_PATH = "/My-Blog/assets/bat/";

  const idleFrames = [
    BASE_PATH + "Bat_Idle_0.png",
    BASE_PATH + "Bat_Idle_1.png",
  ];
  const flyFrames = [
    BASE_PATH + "Bat_Fly_0.png",
    BASE_PATH + "Bat_Fly_1.png",
    BASE_PATH + "Bat_Fly_2.png",
    BASE_PATH + "Bat_Fly_3.png",
  ];

  [...idleFrames, ...flyFrames].forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  const bat = document.createElement("img");
  bat.style.position = "fixed";
  bat.style.width = FRAME_SIZE + "px";
  bat.style.height = FRAME_SIZE + "px";
  bat.style.pointerEvents = "none";
  bat.style.zIndex = "9999";
  bat.style.imageRendering = "pixelated";
  bat.src = idleFrames[0];
  document.body.appendChild(bat);

  // إعدادات الحركة - زي oneko بالظبط
  const STEP_SIZE = 8;          // مسافة كل "خطوة طيران" بالبكسل - أقل = حركة أنعم لكن لسه بالقطعة
  const TICK_INTERVAL = 110;    // كل قد إيه (مللي ثانية) بتتحرك خطوة - أكبر = أهدأ وأبطأ
  const STOP_DISTANCE = 45;     // يوقف لما يكون على بعد المسافة دي من المؤشر
  const OFFSET_X = -30;         // يقف على بعد المسافة دي يمين/شمال المؤشر (مش فوقه)
  const OFFSET_Y = 10;          // يقف تحت المؤشر شوية

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let batX = mouseX;
  let batY = mouseY;
  let facingLeft = false;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  let frameIndex = 0;
  let lastTick = 0;
  let isFlying = false;

  function tick(now) {
    if (now - lastTick < TICK_INTERVAL) {
      requestAnimationFrame(tick);
      return;
    }
    lastTick = now;

    // الهدف: نقطة جنب المؤشر مش عليه
    const targetX = mouseX + OFFSET_X;
    const targetY = mouseY + OFFSET_Y;

    const dx = targetX - batX;
    const dy = targetY - batY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > STOP_DISTANCE) {
      isFlying = true;

      // خطوة واحدة في اتجاه الهدف (مش انزلاق ناعم - قفزة بحجم ثابت)
      const step = Math.min(STEP_SIZE, distance);
      const angle = Math.atan2(dy, dx);
      batX += Math.cos(angle) * step;
      batY += Math.sin(angle) * step;

      if (Math.abs(dx) > 2) {
        facingLeft = dx > 0;
      }

      frameIndex = (frameIndex + 1) % flyFrames.length;
      bat.src = flyFrames[frameIndex];
    } else {
      isFlying = false;
      // فريم idle بيتغير أبطأ من الطيران
      frameIndex = (frameIndex + 1) % (idleFrames.length * 3);
      bat.src = idleFrames[Math.floor(frameIndex / 3)];
    }

    bat.style.left = batX - FRAME_SIZE / 2 + "px";
    bat.style.top = batY - FRAME_SIZE / 2 + "px";
    bat.style.transform = facingLeft ? "scaleX(-1)" : "scaleX(1)";

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();