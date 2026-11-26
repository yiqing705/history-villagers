const canvas = document.querySelector("#island");
const gl = canvas.getContext("webgl", { antialias: true }) || canvas.getContext("experimental-webgl", { antialias: true });
const message = document.querySelector("#game-message");
const coinsLabel = document.querySelector("#coins");
const flowersLabel = document.querySelector("#flowers");
const shopItems = document.querySelector("#shop-items");
const residentQuiz = document.querySelector("#resident-quiz");
const residentQuestion = document.querySelector("#resident-question");
const residentOptions = document.querySelector("#resident-options");
const residentFeedback = document.querySelector("#resident-feedback");
const residentSolution = document.querySelector("#resident-solution");
const residentReset = document.querySelector("#resident-reset");
const worldLabels = document.querySelector("#world-labels");
const question = window.demoQuestion;
const keysDown = new Set();

const player = { x: -4.7, z: 2.8, speed: 5, color: [0.8, 0.42, 0.3], shirt: [0.94, 0.78, 0.53], name: "你" };
const shop = { x: 8, z: -5, radius: 3.15 };
const residents = [
  { id: "su-shi", x: -5, z: 1.2, name: "蘇軾", speed: 1.05, color: [0.38, 0.44, 0.64], shirt: [0.94, 0.89, 0.77], tx: -5, tz: 1.2, wait: 3.5, greeting: "林間清風正好，散步時也能想起好多故事。" },
  { id: "xiao-he", x: 4, z: 2.3, name: "小禾", speed: 1.2, color: [0.68, 0.4, 0.28], shirt: [0.94, 0.79, 0.39], tx: 4, tz: 2.3, wait: 2, greeting: "我剛剛在海邊看到一朵小花，你也去小店看看吧！" },
  { id: "sima-qian", x: -13, z: -3, name: "司馬遷", speed: 0.9, color: [0.54, 0.42, 0.31], shirt: [0.84, 0.75, 0.57], tx: -13, tz: -3, wait: 2.4, greeting: "讀到一段記載時，先看看它留下了什麼線索。" },
  { id: "galileo-galilei", x: -11, z: 4, name: "伽利略", speed: 1.0, color: [0.47, 0.52, 0.65], shirt: [0.78, 0.82, 0.86], tx: -11, tz: 4, wait: 2.8, greeting: "先想想可以量些什麼，再看看結果怎麼說。" },
  { id: "antoine-lavoisier", x: -9, z: -6, name: "拉瓦節", speed: 0.85, color: [0.63, 0.42, 0.35], shirt: [0.87, 0.85, 0.77], tx: -9, tz: -6, wait: 3.1, greeting: "把反應前後的觀察都記下來吧。" },
  { id: "gregor-mendel", x: 3, z: -6, name: "孟德爾", speed: 0.9, color: [0.5, 0.48, 0.37], shirt: [0.78, 0.76, 0.62], tx: 3, tz: -6, wait: 3.3, greeting: "慢慢記下每次觀察，規律就會浮現。" },
  { id: "alfred-wegener", x: 13, z: -2, name: "魏格納", speed: 1.0, color: [0.36, 0.5, 0.57], shirt: [0.76, 0.82, 0.75], tx: 13, tz: -2, wait: 3.6, greeting: "把不同線索放在同一張圖上看看吧。" },
];
const colliders = [
  { x: shop.x, z: shop.z, halfX: 1.95, halfZ: 1.5 },
  ...[[-13,-8,1.1],[-12,6,.9],[-9,-8,.95],[-8,9,1.1],[11,8,1.1],[14,4,.9],[14,-8,1.1],[2,-9,.8],[-2,-9,.9]]
    .map(([x, z, size]) => ({ x, z, halfX: 0.2 * size, halfZ: 0.2 * size })),
];
const CHARACTER_COLLISION_DISTANCE = 1.45;
const WORLD_COLLISION_RADIUS = 0.48;
let coins = 10;
let flowers = 0;
let lastFrame = 0;
let projection = new Float32Array(16);
let view = new Float32Array(16);
let program;
let buffers;
let uniforms;
let attributes;

const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform vec3 uNormalScale;
varying vec3 vNormal;
void main() {
  vNormal = normalize(mat3(uModel) * (aNormal / uNormalScale));
  gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}`;
const fragmentShader = `
precision mediump float;
uniform vec3 uColor;
varying vec3 vNormal;
void main() {
  vec3 lightDirection = normalize(vec3(-0.4, 1.0, 0.55));
  float light = 0.54 + 0.46 * max(dot(normalize(vNormal), lightDirection), 0.0);
  gl_FragColor = vec4(uColor * light, 1.0);
}`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createProgram() {
  const built = gl.createProgram();
  gl.attachShader(built, compileShader(gl.VERTEX_SHADER, vertexShader));
  gl.attachShader(built, compileShader(gl.FRAGMENT_SHADER, fragmentShader));
  gl.linkProgram(built);
  if (!gl.getProgramParameter(built, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(built));
  return built;
}

function makeMesh(positions, normals) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  return { positionBuffer, normalBuffer, count: positions.length / 3 };
}

function makeBox() {
  const positions = [];
  const normals = [];
  const faces = [
    [[0, 0, 1], [[-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5]]],
    [[0, 0,-1], [[0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5,0.5,-0.5],[0.5,0.5,-0.5]]],
    [[1, 0, 0], [[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[0.5,0.5,0.5]]],
    [[-1,0, 0], [[-0.5,-0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5]]],
    [[0, 1, 0], [[-0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5]]],
    [[0,-1, 0], [[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,-0.5,0.5],[-0.5,-0.5,0.5]]],
  ];
  for (const [normal, corners] of faces) {
    for (const index of [0, 1, 2, 0, 2, 3]) {
      positions.push(...corners[index]); normals.push(...normal);
    }
  }
  return makeMesh(positions, normals);
}

function makeSphere() {
  const positions = [];
  const normals = [];
  const rows = 9; const columns = 12;
  for (let row = 0; row < rows; row++) {
    const phi0 = Math.PI * row / rows; const phi1 = Math.PI * (row + 1) / rows;
    for (let column = 0; column < columns; column++) {
      const theta0 = Math.PI * 2 * column / columns; const theta1 = Math.PI * 2 * (column + 1) / columns;
      const point = (phi, theta) => [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
      const a = point(phi0, theta0); const b = point(phi1, theta0); const c = point(phi1, theta1); const d = point(phi0, theta1);
      for (const vertex of [a, b, c, a, c, d]) { positions.push(...vertex); normals.push(...vertex); }
    }
  }
  return makeMesh(positions, normals);
}

function makeCone() {
  const positions = [];
  const normals = [];
  const sides = 8;
  for (let side = 0; side < sides; side++) {
    const a = Math.PI * 2 * side / sides; const b = Math.PI * 2 * (side + 1) / sides;
    const baseA = [Math.cos(a) * 0.5, -0.5, Math.sin(a) * 0.5];
    const baseB = [Math.cos(b) * 0.5, -0.5, Math.sin(b) * 0.5];
    const top = [0, 0.5, 0];
    const normal = (point) => { const length = Math.hypot(point[0], point[1], point[2]); return point.map((value) => value / length); };
    const topNormalA = normal([Math.cos(a), 0.5, Math.sin(a)]);
    const topNormalB = normal([Math.cos(b), 0.5, Math.sin(b)]);
    positions.push(...baseA, ...baseB, ...top); normals.push(...topNormalA, ...topNormalB, ...topNormalA);
    positions.push(0, -0.5, 0, ...baseB, ...baseA); normals.push(0,-1,0, 0,-1,0, 0,-1,0);
  }
  return makeMesh(positions, normals);
}

function makePerspective(out, fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  out.fill(0);
  out[0] = f / aspect; out[5] = f; out[10] = (far + near) / (near - far); out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
}

function makeLookAt(out, eye, target) {
  let zx = eye[0] - target[0]; let zy = eye[1] - target[1]; let zz = eye[2] - target[2];
  let length = Math.hypot(zx, zy, zz); zx /= length; zy /= length; zz /= length;
  let xx = zz; let xy = 0; let xz = -zx;
  length = Math.hypot(xx, xy, xz); xx /= length; xy /= length; xz /= length;
  const yx = zy * xz - zz * xy; const yy = zz * xx - zx * xz; const yz = zx * xy - zy * xx;
  out.set([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1,
  ]);
}

function makeModel(x, y, z, sx, sy, sz) {
  return new Float32Array([sx,0,0,0, 0,sy,0,0, 0,0,sz,0, x,y,z,1]);
}

function draw(mesh, x, y, z, sx, sy, sz, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
  gl.enableVertexAttribArray(attributes.position);
  gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
  gl.enableVertexAttribArray(attributes.normal);
  gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(uniforms.model, false, makeModel(x, y, z, sx, sy, sz));
  gl.uniform3f(uniforms.normalScale, sx, sy, sz);
  gl.uniform3fv(uniforms.color, color);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
}

function drawTree(x, z, size = 1) {
  draw(buffers.box, x, 0.55 * size, z, 0.24 * size, 1.1 * size, 0.24 * size, [0.48, 0.33, 0.2]);
  draw(buffers.sphere, x, 1.55 * size, z, 1.12 * size, 1.32 * size, 1.12 * size, [0.3, 0.5, 0.31]);
  draw(buffers.sphere, x - 0.42 * size, 1.38 * size, z + 0.22 * size, 0.76 * size, 0.86 * size, 0.76 * size, [0.4, 0.59, 0.37]);
}

function drawCharacter(character, isPlayer = false) {
  draw(buffers.box, character.x, 0.57, character.z, 0.82, 0.92, 0.58, character.shirt);
  draw(buffers.sphere, character.x, 1.35, character.z, 0.69, 0.68, 0.67, [0.95, 0.79, 0.62]);
  draw(buffers.sphere, character.x, 1.64, character.z + 0.02, 0.73, 0.36, 0.72, character.color);
  if (isPlayer) {
    draw(buffers.box, character.x, 2.18, character.z, 0.08, 0.16, 0.08, [1, 0.91, 0.6]);
  }
}

function drawIsland() {
  gl.clearColor(0.51, 0.74, 0.8, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniformMatrix4fv(uniforms.projection, false, projection);
  makeLookAt(view, [player.x, 9, player.z + 12], [player.x, 0.5, player.z - 2]);
  gl.uniformMatrix4fv(uniforms.view, false, view);

  draw(buffers.box, 0, -0.45, 0, 36, 0.5, 26, [0.38, 0.6, 0.37]);
  draw(buffers.box, -1, -0.17, 8, 3, 0.05, 10, [0.89, 0.81, 0.62]);
  draw(buffers.box, 2.3, -0.15, 2.9, 9.7, 0.05, 2.6, [0.89, 0.81, 0.62]);
  draw(buffers.box, 7.2, -0.14, -1.5, 2.5, 0.05, 6.4, [0.89, 0.81, 0.62]);

  [[-13,-8,1.1],[-12,6,.9],[-9,-8,.95],[-8,9,1.1],[11,8,1.1],[14,4,.9],[14,-8,1.1],[2,-9,.8],[-2,-9,.9]].forEach(([x,z,size]) => drawTree(x,z,size));
  [[-10,-2],[-7,7],[10,5],[12,-2],[1,-7],[-3,-5],[5,8]].forEach(([x,z], index) => {
    draw(buffers.box, x, 0.19, z, 0.045, 0.38, 0.045, [0.31,0.49,0.31]);
    draw(buffers.sphere, x - 0.1, 0.43, z, 0.22, 0.12, 0.18, index % 2 ? [0.91,0.53,0.45] : [0.97,0.88,0.63]);
    draw(buffers.sphere, x + 0.1, 0.43, z, 0.22, 0.12, 0.18, [0.97,0.88,0.63]);
  });

  draw(buffers.box, shop.x, 0.8, shop.z, 3.7, 1.7, 2.8, [0.94, 0.79, 0.53]);
  draw(buffers.cone, shop.x, 2.15, shop.z, 4.3, 1.1, 3.4, [0.68, 0.36, 0.28]);
  draw(buffers.box, shop.x, 1.03, shop.z + 1.43, 0.78, 1.08, 0.08, [0.35,0.46,0.36]);
  draw(buffers.box, shop.x - 1.15, 1.2, shop.z + 1.45, 0.65, 0.55, 0.1, [0.68,0.83,0.78]);
  draw(buffers.box, shop.x + 1.15, 1.2, shop.z + 1.45, 0.65, 0.55, 0.1, [0.68,0.83,0.78]);
  draw(buffers.box, shop.x, 1.74, shop.z + 1.53, 2.35, 0.34, 0.16, [0.95,0.62,0.38]);

  residents.forEach((resident) => drawCharacter(resident));
  drawCharacter(player, true);
  updateWorldLabels();
}

function createWorldLabels() {
  residents.forEach((resident) => {
    const label = document.createElement("span");
    label.className = "world-label";
    label.textContent = resident.name;
    worldLabels.append(label);
    resident.labelElement = label;
  });
}

function updateWorldLabels() {
  const canvasRect = canvas.getBoundingClientRect();
  const frameRect = canvas.parentElement.getBoundingClientRect();
  const width = canvasRect.width;
  const height = canvasRect.height;
  residents.forEach((resident) => {
    const x = resident.x;
    const y = 2.45;
    const z = resident.z;
    const viewX = view[0] * x + view[4] * y + view[8] * z + view[12];
    const viewY = view[1] * x + view[5] * y + view[9] * z + view[13];
    const viewZ = view[2] * x + view[6] * y + view[10] * z + view[14];
    const clipX = projection[0] * viewX + projection[4] * viewY + projection[8] * viewZ + projection[12];
    const clipY = projection[1] * viewX + projection[5] * viewY + projection[9] * viewZ + projection[13];
    const clipW = projection[3] * viewX + projection[7] * viewY + projection[11] * viewZ + projection[15];
    if (clipW <= 0) { resident.labelElement.hidden = true; return; }
    const screenX = (clipX / clipW + 1) * 0.5 * width;
    const screenY = (1 - clipY / clipW) * 0.5 * height;
    resident.labelElement.hidden = screenX < -40 || screenX > width + 40 || screenY < -30 || screenY > height + 20;
    resident.labelElement.style.left = `${canvasRect.left - frameRect.left + screenX}px`;
    resident.labelElement.style.top = `${canvasRect.top - frameRect.top + screenY}px`;
  });
}

function resize() {
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  gl.viewport(0, 0, canvas.width, canvas.height);
  makePerspective(projection, Math.PI / 3, canvas.width / canvas.height, 0.1, 100);
}

function chooseResidentTarget(resident) {
  resident.tx = -10 + Math.random() * 20;
  resident.tz = -7 + Math.random() * 15;
  resident.wait = 1.5 + Math.random() * 3;
}

function collidesWithWorld(x, z, actor) {
  const hitsStatic = colliders.some((obstacle) => {
    const closestX = Math.max(obstacle.x - obstacle.halfX, Math.min(x, obstacle.x + obstacle.halfX));
    const closestZ = Math.max(obstacle.z - obstacle.halfZ, Math.min(z, obstacle.z + obstacle.halfZ));
    return Math.hypot(x - closestX, z - closestZ) < WORLD_COLLISION_RADIUS;
  });
  if (hitsStatic) return true;
  if (actor !== player && Math.hypot(x - player.x, z - player.z) < CHARACTER_COLLISION_DISTANCE) return true;
  return residents.some((resident) => resident !== actor && Math.hypot(x - resident.x, z - resident.z) < CHARACTER_COLLISION_DISTANCE);
}

function moveWithoutPenetrating(actor, dx, dz) {
  const nextX = actor.x + dx;
  if (!collidesWithWorld(nextX, actor.z, actor)) actor.x = nextX;
  const nextZ = actor.z + dz;
  if (!collidesWithWorld(actor.x, nextZ, actor)) actor.z = nextZ;
}

function updateResidents(delta) {
  residents.forEach((resident) => {
    resident.wait -= delta;
    if (resident.wait <= 0) chooseResidentTarget(resident);
    const dx = resident.tx - resident.x; const dz = resident.tz - resident.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0.1) {
      const step = Math.min(distance, resident.speed * delta);
      moveWithoutPenetrating(resident, dx / distance * step, dz / distance * step);
    }
  });
}

function updatePlayer(delta) {
  let dx = Number(keysDown.has("ArrowRight") || keysDown.has("d")) - Number(keysDown.has("ArrowLeft") || keysDown.has("a"));
  let dz = Number(keysDown.has("ArrowDown") || keysDown.has("s")) - Number(keysDown.has("ArrowUp") || keysDown.has("w"));
  if (!dx && !dz) return;
  const length = Math.hypot(dx, dz); dx /= length; dz /= length;
  const moveX = Math.max(-16, Math.min(16, player.x + dx * player.speed * delta)) - player.x;
  const moveZ = Math.max(-11, Math.min(11, player.z + dz * player.speed * delta)) - player.z;
  moveWithoutPenetrating(player, moveX, moveZ);
  if (!shopItems.hidden && Math.hypot(player.x - shop.x, player.z - shop.z) > shop.radius + 1) shopItems.hidden = true;
}

function frame(timestamp) {
  const delta = Math.min((timestamp - lastFrame) / 1000 || 0, 0.05);
  lastFrame = timestamp;
  updatePlayer(delta);
  updateResidents(delta);
  drawIsland();
  requestAnimationFrame(frame);
}

function interact() {
  const shopDistance = Math.hypot(player.x - shop.x, player.z - shop.z);
  if (shopDistance < shop.radius) {
    shopItems.hidden = !shopItems.hidden;
    message.textContent = shopItems.hidden ? "店主揮揮手說：有空再來逛逛喔。" : "歡迎來海邊小店！今天的小花種子一朵 5 枚橡實。";
    return;
  }
  const nearest = residents.map((resident) => ({ resident, distance: Math.hypot(player.x - resident.x, player.z - resident.z) })).sort((a, b) => a.distance - b.distance)[0];
  if (nearest && nearest.distance < 1.75) {
    if (nearest.resident.name === "蘇軾") {
      message.textContent = `${nearest.resident.name}笑著說：「${nearest.resident.greeting}」（遊戲創作對話）`;
      openResidentQuiz();
    } else {
      message.textContent = `${nearest.resident.name}和你打招呼：「${nearest.resident.greeting}」（遊戲創作對話；候選知識主題待審。）`;
    }
  } else {
    message.textContent = "靠近居民或海邊小店，再按 E 就可以互動。";
  }
}

function resetResidentQuiz() {
  residentQuestion.textContent = question.stem;
  residentOptions.replaceChildren();
  Object.entries(question.options).forEach(([key, text]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.answer = key;
    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = key.toUpperCase();
    const label = document.createElement("span");
    label.textContent = text;
    button.append(letter, label);
    button.addEventListener("click", answerResidentQuestion);
    residentOptions.append(button);
  });
  residentFeedback.textContent = "選一個你覺得最合適的答案吧。";
  residentFeedback.className = "resident-feedback";
  residentSolution.hidden = true;
  residentSolution.setAttribute("aria-expanded", "false");
  residentSolution.textContent = "看看完整解題思路 ↗";
  residentReset.hidden = true;
}

function openResidentQuiz() {
  resetResidentQuiz();
  residentQuiz.hidden = false;
}

function answerResidentQuestion(event) {
  const selected = event.currentTarget.dataset.answer;
  const correct = selected === question.answer;
  residentOptions.querySelectorAll("button").forEach((button) => { button.disabled = true; });
  event.currentTarget.classList.add(correct ? "correct" : "incorrect");
  residentReset.hidden = false;
  if (correct) {
    residentFeedback.textContent = `答對了！${question.solution} ${question.extension}`;
    residentFeedback.className = "resident-feedback is-correct";
    return;
  }
  residentFeedback.textContent = question.distractors[selected];
  residentFeedback.className = "resident-feedback is-incorrect";
  residentSolution.hidden = false;
  residentSolution.dataset.hint = question.distractors[selected];
}

residentSolution.addEventListener("click", () => {
  const expanded = residentSolution.getAttribute("aria-expanded") === "true";
  if (expanded) {
    residentFeedback.textContent = residentSolution.dataset.hint;
    residentSolution.setAttribute("aria-expanded", "false");
    residentSolution.textContent = "看看完整解題思路 ↗";
    return;
  }
  residentFeedback.textContent = `${residentSolution.dataset.hint} 解題思路：${question.solution} 正確選項是「${question.options[question.answer]}」`;
  residentSolution.setAttribute("aria-expanded", "true");
  residentSolution.textContent = "收起完整解題思路 ↑";
});
residentReset.addEventListener("click", resetResidentQuiz);
document.querySelector("#resident-close").addEventListener("click", () => { residentQuiz.hidden = true; });

function setDirection(direction, active) {
  const keyByDirection = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
  const key = keyByDirection[direction];
  if (active) keysDown.add(key); else keysDown.delete(key);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "e", "Enter"].includes(key)) {
    event.preventDefault();
    if ((key === "e" || key === "Enter") && !event.repeat) interact();
    else keysDown.add(key);
  }
});
document.addEventListener("keyup", (event) => keysDown.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
window.addEventListener("blur", () => keysDown.clear());
window.addEventListener("resize", resize);

document.querySelectorAll("[data-move]").forEach((button) => {
  const direction = button.dataset.move;
  button.addEventListener("pointerdown", (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); setDirection(direction, true); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => button.addEventListener(type, () => setDirection(direction, false)));
});

document.querySelector("#interact-button").addEventListener("click", interact);
document.querySelector("#shop-button").addEventListener("click", () => {
  if (Math.hypot(player.x - shop.x, player.z - shop.z) < shop.radius) interact();
  else message.textContent = "海邊小店在小島北側，走近房子再按「打開海邊小店」就能進去逛逛。";
});
document.querySelector("#buy-flower").addEventListener("click", () => {
  if (coins < 5) { message.textContent = "橡實不太夠呢。再來逛逛時，說不定會有新的收集機會。"; return; }
  coins -= 5; flowers += 1;
  coinsLabel.textContent = String(coins); flowersLabel.textContent = String(flowers);
  message.textContent = "買到一朵小花了！今天的島上又多了一點色彩。";
});

if (!gl) {
  message.textContent = "這個瀏覽器目前沒有開啟 WebGL，暫時無法顯示 3D 小島。可以改用較新的瀏覽器再試一次。";
  document.querySelectorAll("button").forEach((button) => { button.disabled = true; });
} else {
  try {
    program = createProgram();
    attributes = { position: gl.getAttribLocation(program, "aPosition"), normal: gl.getAttribLocation(program, "aNormal") };
    uniforms = {
      model: gl.getUniformLocation(program, "uModel"), view: gl.getUniformLocation(program, "uView"),
      projection: gl.getUniformLocation(program, "uProjection"), color: gl.getUniformLocation(program, "uColor"),
      normalScale: gl.getUniformLocation(program, "uNormalScale"),
    };
    buffers = { box: makeBox(), sphere: makeSphere(), cone: makeCone() };
    createWorldLabels();
    gl.enable(gl.DEPTH_TEST);
    resize();
    requestAnimationFrame(frame);
  } catch (error) {
    message.textContent = "3D 場景啟動失敗，請重新整理或換一個瀏覽器試試。";
    console.error("Unable to start the 3D island", error);
  }
}
