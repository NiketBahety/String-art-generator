var img = new Image();
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var canvas2 = document.getElementById("canvas2");
var ctx2 = canvas2.getContext("2d");

let CANVAS_WIDTH = 800;
let CANVAS_HEIGHT = 800;
let NUMBER_OF_PINS = 288;
let NUMBER_OF_LINES = 7000;
let LINE_COLOR = 0;
let PINS_BUFFER = 0;
let DRAW_INTERVAL = 100;
let MIN_PIN_GAP = 0;
let LINE_WEIGHT = 0.1;
let LIGHTENING_FACTOR = 1.3 + LINE_WEIGHT;
let IMAGE_NAME = "";
let SEE_ANIMATION = true;

canvas.width = 0;
canvas.height = 0;
canvas2.width = 0;
canvas2.height = 0;

CANVAS_HEIGHT = Math.min(window.innerHeight, window.innerWidth) - 20;
CANVAS_WIDTH = Math.min(window.innerHeight, window.innerWidth) - 20;

let statusText = document.getElementById("status");

document.getElementById("generate").addEventListener("click", () => {
  if (IMAGE_NAME) {
    img.src = IMAGE_NAME;

    statusText.innerText = "Loading image....";

    img.onload = function () {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      canvas2.width = CANVAS_WIDTH;
      canvas2.height = CANVAS_HEIGHT;

      canvas.scrollIntoView();

      statusText.innerText = "Cropping image....";

      cropImage(ctx);
      cropImage(ctx2);

      statusText.innerText = "Converting image to grayscale....";

      imageData = convertIntoGrayScale();

      statusText.innerText = "Enhancing image contrast....";

      imageData = contrastImage(imageData, 50);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx2.putImageData(imageData, 0, 0);

      statusText.innerText = "Generating pins....";

      pinLocations = generatePins();
      lines = generateLines();
      let startingPin = 0;

      statusText.innerText = "Drawing....";

      solve(startingPin, startingPin);

      statusText.innerText = "Ready!✅";
    };
  } else {
    statusText.innerText = "Please upload a file!";
  }
});

document.getElementById("file").addEventListener("input", (e) => {
  let file = e.target.files[0];
  let reader = new FileReader();

  reader.addEventListener(
    "load",
    () => {
      IMAGE_NAME = reader.result;
    },
    false
  );

  if (file) {
    reader.readAsDataURL(file);
  }
});

document.getElementById("number_of_lines").addEventListener("input", (e) => {
  NUMBER_OF_LINES = e.target.value;
});

document.getElementById("line_weight").addEventListener("input", (e) => {
  LINE_WEIGHT = e.target.value;
  LIGHTENING_FACTOR = 1.3 + parseFloat(LINE_WEIGHT);
});

document.getElementById("number_of_pins").addEventListener("input", (e) => {
  NUMBER_OF_PINS = e.target.value;
});

document.getElementById("see_steps").addEventListener("input", (e) => {
  SEE_ANIMATION = e.target.checked;
});

let imageData, pinLocations, lines, artData;

function contrastImage(imgData, contrast) {
  //input range [-100..100]
  var d = imgData.data;
  contrast = contrast / 100 + 1; //convert to decimal & shift range: [0..2]
  var intercept = 128 * (1 - contrast);
  for (var i = 0; i < d.length; i += 4) {
    //r,g,b,a
    d[i] = d[i] * contrast + intercept;
    d[i + 1] = d[i + 1] * contrast + intercept;
    d[i + 2] = d[i + 2] * contrast + intercept;
  }
  return imgData;
}

const cropImage = (ctx) => {
  ctx.beginPath();
  ctx.arc(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_WIDTH / 2,
    0,
    2 * Math.PI
  );
  ctx.clip();

  let selectedHeight = img.height,
    selectedWidth = img.width;

  let xOffset = 0,
    yOffset = 0;

  if (img.height > img.width) {
    selectedWidth = img.width;
    selectedHeight = img.width;
    yOffset = Math.floor((img.height - img.width) / 2);
  } else if (img.width > img.height) {
    selectedWidth = img.height;
    selectedHeight = img.height;
    xOffset = Math.floor((img.width - img.height) / 2);
  }

  ctx.drawImage(
    img,
    xOffset,
    yOffset,
    selectedWidth,
    selectedHeight,
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );
};
const convertIntoGrayScale = () => {
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;

  // Loop through each pixel and convert it to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    // Calculate the grayscale value using the formula: 0.299*R + 0.587*G + 0.114*B
    const grayscale = 0.299 * red + 0.587 * green + 0.114 * blue;

    // Set the pixel values to the grayscale value
    data[i] = grayscale;
    data[i + 1] = grayscale;
    data[i + 2] = grayscale;
  }

  imageData.data = data;

  // Put the modified pixel data back on the canvas
  ctx.putImageData(imageData, 0, 0);
  ctx2.putImageData(imageData, 0, 0);

  return imageData;
};
const generatePins = () => {
  const pins = [];
  for (let i = 0; i < NUMBER_OF_PINS; i++) {
    pins.push([
      Math.round(
        (CANVAS_WIDTH / 2) * Math.cos(((2 * Math.PI) / NUMBER_OF_PINS) * i)
      ) +
        CANVAS_WIDTH / 2,
      Math.round(
        (CANVAS_HEIGHT / 2) * Math.sin(((2 * Math.PI) / NUMBER_OF_PINS) * i)
      ) +
        CANVAS_HEIGHT / 2,
    ]);
    // if (i < 288) {
    //   ctx.fillStyle = "blue";
    //   ctx.fillRect(pins[i][0], pins[i][1], 10, 10);
    // }
  }
  // console.log(pins);
  return pins;
};
const generateLines = () => {
  let lines = new Array(pinLocations.length);
  for (let i = 0; i < pinLocations.length; i++) {
    let x1 = pinLocations[i][0];
    let y1 = pinLocations[i][1];
    lines[i] = new Array(pinLocations.length);
    for (let j = 0; j < pinLocations.length; j++) {
      let x2 = pinLocations[j][0];
      let y2 = pinLocations[j][1];
      lines[i][j] = bresenham(x1, y1, x2, y2);
    }
  }
  return lines;
};
const bresenham = (x0, y0, x1, y1) => {
  let arr = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x00 = x0,
    y00 = y0;

  while (true) {
    // Draw the pixel at (x0, y0) here (you can use any drawing function of your choice)
    // For example, in HTML canvas:
    // ctx.fillRect(x0, y0, 1, 1);
    arr.push([
      x0,
      y0,
      LINE_COLOR + Math.round(100 * distanceFromLine(x0, y0, x00, y00, x1, y1)),
    ]);
    if (x0 === x1 && y0 === y1) {
      break;
    }

    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }

    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return arr;
};

const distanceFromLine = (x, y, x1, y1, x2, y2) => {
  // Calculate coefficients A, B, and C
  const A = y2 - y1;
  const B = x1 - x2;
  const C = x2 * y1 - x1 * y2;

  // Calculate the distance using the formula
  const distance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
  return distance;
};
const drawLine = (x, y) => {
  // for (let i = 0; i < lines[x][y].length; i++) {
  //   ctx.fillStyle = `rgb(${lines[x][y][i][2]}, ${lines[x][y][i][2]}, ${lines[x][y][i][2]}
  //   )`;
  //   ctx.fillRect(lines[x][y][i][0], lines[x][y][i][1], 1, 1);
  // }
  ctx.beginPath();
  ctx.lineWidth = LINE_WEIGHT;
  ctx.moveTo(pinLocations[x][0], pinLocations[x][1]);
  ctx.lineTo(pinLocations[y][0], pinLocations[y][1]);
  ctx.stroke();
};
const solve = (a, b) => {
  let currPin = a,
    prevPin = a;
  let solution = [0];
  let lastPins = [];
  for (let cnt = 0; cnt < NUMBER_OF_LINES; cnt++) {
    if (SEE_ANIMATION) {
      setTimeout(() => {
        let minError = 9999999;
        let bestPin;
        for (let i = 0; i < NUMBER_OF_PINS; i++) {
          if (
            i != prevPin &&
            i != currPin &&
            Math.abs(currPin - i) > MIN_PIN_GAP &&
            Math.abs(currPin - i) < NUMBER_OF_PINS - MIN_PIN_GAP &&
            !lastPins.includes(i)
          ) {
            let tempError = getError(lines[currPin][i]);
            // console.log(currPin, i, tempError);
            if (tempError <= minError) {
              minError = tempError;
              bestPin = i;
            }
          }
        }
        solution.push(bestPin);
        lastPins.push(bestPin);
        if (lastPins.length > PINS_BUFFER) lastPins.shift();
        drawLine(currPin, bestPin);
        removeLine(lines[currPin][bestPin]);
        prevPin = currPin;
        currPin = bestPin;
      }, DRAW_INTERVAL);
    } else {
      let minError = 9999999;
      let bestPin;
      for (let i = 0; i < NUMBER_OF_PINS; i++) {
        if (
          i != prevPin &&
          i != currPin &&
          Math.abs(currPin - i) > MIN_PIN_GAP &&
          Math.abs(currPin - i) < NUMBER_OF_PINS - MIN_PIN_GAP &&
          !lastPins.includes(i)
        ) {
          let tempError = getError(lines[currPin][i]);
          // console.log(currPin, i, tempError);
          if (tempError <= minError) {
            minError = tempError;
            bestPin = i;
          }
        }
      }
      solution.push(bestPin);
      lastPins.push(bestPin);
      if (lastPins.length > PINS_BUFFER) lastPins.shift();
      drawLine(currPin, bestPin);
      removeLine(lines[currPin][bestPin]);
      prevPin = currPin;
      currPin = bestPin;
    }
  }

  console.log(solution);
};
const getError = (line) => {
  // console.log(line);
  let totalError = 0;
  // let temp = [];
  for (let i = 0; i < line.length; i++) {
    let index = (line[i][1] * CANVAS_WIDTH + line[i][0]) * 4;
    totalError += imageData.data[index];
    // totalError += imageData.data[index] * (255 - line[i][2]);
    // temp.push(imageData.data[index]);
  }
  // console.log(temp);
  totalError = totalError / line.length;
  return totalError;
};

const removeLine = (line) => {
  for (let i = 0; i < line.length; i++) {
    let index = (line[i][1] * CANVAS_WIDTH + line[i][0]) * 4;
    imageData.data[index] = Math.min(
      255,
      (imageData.data[index] + 1) * LIGHTENING_FACTOR
    );
    imageData.data[index + 1] = Math.min(
      255,
      (imageData.data[index + 1] + 1) * LIGHTENING_FACTOR
    );
    imageData.data[index + 2] = Math.min(
      255,
      (imageData.data[index + 2] + 1) * LIGHTENING_FACTOR
    );
    imageData.data[index + 3] = Math.min(
      255,
      (imageData.data[index + 3] + 1) * LIGHTENING_FACTOR
    );
    // imageData.data[index] = 255;
    // imageData.data[index + 1] = 0;
    // imageData.data[index + 2] = 0;
    // imageData.data[index + 3] = 255;
  }
  // ctx2.putImageData(imageData, 0, 0);
  // ctx2.fillStyle = "red";
  // for (let i = 0; i < line.length; i++) {
  //   ctx2.fillRect(line[i][0], lines[i][1], 1, 1);
  // }
};
