(function () {
  const FRAME_SIZE = 32; // عدّليها حسب حجم الصورة الفعلي بالبكسل
  const BASE_PATH = "/My-Blog/assets/bat/"; // عدّلي المسار حسب اسم الريبو بتاعك

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

  // Preload كل الصور عشان مفيش وميض لما تتغير
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
  bat.style.imageRendering = "pixelated"; // يخلي البيكسل آرت واضح مش مموّه
  bat.src = idleFrames[0];
  document.body.appendChild(bat);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let batX = mouseX;
  let batY = mouseY;
  let facingLeft = false;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // إدارة الفريمات
  let frameIndex = 0;
  let frameTimer = 0;
  const FRAME_INTERVAL = 120; // مللي ثانية بين كل فريم
  let lastFrameTime = performance.now();

  function animate(now) {
    const dx = mouseX - batX;
    const dy = mouseY - batY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // حركة ناعمة (lag)
    batX += dx * 0.004;
    batY += dy * 0.004;

    if (dx !== 0) {
      facingLeft = dx < 0;
    }

    const isMoving = distance > 4;

    // تحديث الفريم كل FRAME_INTERVAL
    const delta = now - lastFrameTime;
    if (delta > FRAME_INTERVAL) {
      frameIndex++;
      lastFrameTime = now;
    }

    const frames = isMoving ? flyFrames : idleFrames;
    const currentFrame = frames[frameIndex % frames.length];
    if (bat.src !== location.origin + currentFrame) {
      bat.src = currentFrame;
    }

    bat.style.left = batX - FRAME_SIZE / 2 + "px";
    bat.style.top = batY - FRAME_SIZE / 2 + "px";
    bat.style.transform = facingLeft ? "scaleX(-1)" : "scaleX(1)";

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();