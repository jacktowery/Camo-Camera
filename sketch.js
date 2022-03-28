// ** p5.js **

// Global Variables
var canvas;
var capture;
var visionMode = 0;
var environmentMode = 0;
var avgCaptureColor = [0, 0, 0];

var environmentColors = {
	jungle: { r: 40, g: 124, b: 52 },
	desert: { r: 230, g: 195, b: 131 },
	tundra: { r: 175, g: 178, b: 188 },
	ocean: { r: 28, g: 70, b: 103 },
	forest: { r: 116, g: 105, b: 75 },
};

var currentBG = [environmentColors.jungle.r, environmentColors.jungle.g, environmentColors.jungle.b];

updateEnvironment();

function setup() {
	canvas = createCanvas(640, 480);
	pixelDensity(1);
	background(255);

	capture = createCapture(VIDEO);
	capture.size(640, 480);
	capture.hide();

	// SETUP OUTPUTS
	/*
	// Average Color Text
	textSize(16);
	textAlign(LEFT, TOP);
	fill(0, 0, 0);
	text("Average Color of Webcam Feed", 650, 0);

	// Average Color Rectangle
	fill(avgCaptureColor[0], avgCaptureColor[1], avgCaptureColor[2]);
	noStroke();
	rect(650, 20, 300, 50);

	// Comparing Color Text
	textSize(16);
	textAlign(LEFT, TOP);
	fill(0, 0, 0);
	text("Color to Compare To", 650, 80);

	// Comparing Color Rectangle
	fill(rainforest[0], rainforest[1], rainforest[2]);
	noStroke();
	rect(650, 100, 300, 50);

	// Percent Difference Title Text
	textSize(16);
	textAlign(LEFT, TOP);
	fill(0, 0, 0);
	text("Difference:", 650, 160);

	// Percent Difference Value Text1
	textSize(16);
	textAlign(LEFT, TOP);
	fill(0, 0, 0);
	text("100%", 650, 190);

	// Percent Difference Value Text2
	textSize(16);
	textAlign(LEFT, TOP);
	fill(0, 0, 0);
	text("100%", 650, 210);
    */
}

function draw() {
	// Flip Webcam Image
	//translate(640,0);
	//scale(-1, 1);
	// Capture Webcam Frame
	var capimg = capture.get();

	// Image Processing
	if (capimg.width > 0) {
		capimg.loadPixels(); // Load pixel array

		for (var i = 0; i < capimg.pixels.length; i += 4) {
			// Retrieve original values for manipulation
			var r = capimg.pixels[i + 0];
			var g = capimg.pixels[i + 1];
			var b = capimg.pixels[i + 2];
			var a = capimg.pixels[i + 3];

			// Apply Vision Filters
			/* 
				R' = r1*R + r2*G + r3*B + r4*A + r5
				G' = g1*R + g2*G + g3*B + g4*A + g5
				B' = b1*R + b2*G + b3*B + b4*A + b5
				A' = a1*R + a2*G + a3*B + a4*A + a5
			*/
			if (visionMode == 0) {
				capimg.pixels[i + 0] = r;
				capimg.pixels[i + 1] = g;
				capimg.pixels[i + 2] = b;
				capimg.pixels[i + 3] = a;
			} else if (visionMode == 1) {
				// Protanopia
				var newColors = toProtanopia(r, g, b, a);
				capimg.pixels[i + 0] = newColors[0];
				capimg.pixels[i + 1] = newColors[1];
				capimg.pixels[i + 2] = newColors[2];
				capimg.pixels[i + 3] = newColors[3];
			} else if (visionMode == 2) {
				// Deuteranopia
				var newColors = toDeuteranopia(r, g, b, a);
				capimg.pixels[i + 0] = newColors[0];
				capimg.pixels[i + 1] = newColors[1];
				capimg.pixels[i + 2] = newColors[2];
				capimg.pixels[i + 3] = newColors[3];
			} else if (visionMode == 3) {
				// Tritanopia
				var newColors = toTritanopia(r, g, b, a);
				capimg.pixels[i + 0] = newColors[0];
				capimg.pixels[i + 1] = newColors[1];
				capimg.pixels[i + 2] = newColors[2];
				capimg.pixels[i + 3] = newColors[3];
			} else if (visionMode == 4) {
				// Achromatopsia
				var newColors = toAchromatopsia(r, g, b, a);
				capimg.pixels[i + 0] = newColors[0];
				capimg.pixels[i + 1] = newColors[1];
				capimg.pixels[i + 2] = newColors[2];
				capimg.pixels[i + 3] = newColors[3];
			}

			// Add colors to averages
			avgCaptureColor[0] += capimg.pixels[i + 0];
			avgCaptureColor[1] += capimg.pixels[i + 1];
			avgCaptureColor[2] += capimg.pixels[i + 2];
		}

		// Update Image on Canvas
		capimg.updatePixels();
		image(capimg, 0, 0, 640, 480);
	}
	// Calculate Average Colors
	var numPixels = capimg.width * capimg.height;
	avgCaptureColor[0] /= numPixels;
	avgCaptureColor[1] /= numPixels;
	avgCaptureColor[2] /= numPixels;

	// Compare Average Webcam Color to Background Color
	var webcamHSB = RGBToHSB(avgCaptureColor[0], avgCaptureColor[1], avgCaptureColor[2]);
	var sampleHSB = RGBToHSB(currentBG[0], currentBG[1], currentBG[2]);

	// Difference Value
	var vDiffH = Math.abs(sampleHSB[0] - webcamHSB[0]);
	var vDiffS = Math.abs(sampleHSB[1] - webcamHSB[1]);
	var vDiffB = Math.abs(sampleHSB[2] - webcamHSB[2]);

	// Difference Percentage
	var vDiffHper = Math.round((vDiffH / 360) * 100);
	var vDiffSper = Math.round((vDiffS / 100) * 100);
	var vDiffBper = Math.round((vDiffB / 100) * 100);

	// Update Differences on Page
	$("#hDiffP").html(vDiffHper + "%");
	$("#sDiffP").html(vDiffSper + "%");
	$("#bDiffP").html(vDiffBper + "%");

	// Calculate & Update Overall Score on Page
	var camoScore = 100 - Math.max(vDiffHper, vDiffSper, vDiffBper);
	var scoreElem = $("#camoScore");
	scoreElem.html(camoScore + "/100");
	if (camoScore >= 80) {
		scoreElem.addClass("has-text-success");
		scoreElem.removeClass("has-text-warning");
		scoreElem.removeClass("has-text-danger");
	} else if (camoScore > 50 && camoScore < 80) {
		scoreElem.removeClass("has-text-success");
		scoreElem.addClass("has-text-warning");
		scoreElem.removeClass("has-text-danger");
	} else {
		scoreElem.removeClass("has-text-success");
		scoreElem.removeClass("has-text-warning");
		scoreElem.addClass("has-text-danger");
	}

	// Reset Average Color (for next calculation)
	avgCaptureColor[0] = 0;
	avgCaptureColor[1] = 0;
	avgCaptureColor[2] = 0;
}

// ** EVENT LISTENER FUNCTIONS **
function updateVision() {
	// Update mode value used in p5.js code
	visionMode = $("#visionSelector").val();

	// Call to update environment
	updateEnvironment();
}

function updateEnvironment() {
	// Update mode value used in p5.js code
	environmentMode = $("#environmentSelector").val();

	// Update color values used in p5.js code
	if (environmentMode == 0) {
		currentBG = [environmentColors.jungle.r, environmentColors.jungle.g, environmentColors.jungle.b];
	} else if (environmentMode == 1) {
		currentBG = [environmentColors.desert.r, environmentColors.desert.g, environmentColors.desert.b];
	} else if (environmentMode == 2) {
		currentBG = [environmentColors.tundra.r, environmentColors.tundra.g, environmentColors.tundra.b];
	} else if (environmentMode == 3) {
		currentBG = [environmentColors.ocean.r, environmentColors.ocean.g, environmentColors.ocean.b];
	} else if (environmentMode == 4) {
		currentBG = [environmentColors.forest.r, environmentColors.forest.g, environmentColors.forest.b];
	} else {
		currentBG = [255, 0, 0];
	}

	// TODO: Update currentBG to include vision adjustments
	if (visionMode == 1) {
		currentBG = toProtanopia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	} else if (visionMode == 2) {
		currentBG = toDeuteranopia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	} else if (visionMode == 3) {
		currentBG = toTritanopia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	} else if (visionMode == 4) {
		currentBG = toAchromatopsia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	}

	// Update background color behind webcam view
	let bgStr = "rgb(" + currentBG[0] + "," + currentBG[1] + "," + currentBG[2] + ")";
	$("html").css("background-color", bgStr);
}

// ** COLOR VISION TRANSFORMATION FUNCTIONS **

function toProtanopia(r, g, b, a) {
	/*  0.567, 0.433, 0,     0, 0
			0.558, 0.558, 0,     0, 0
			0,     0.242, 0.758, 0, 0
			0,     0,     0,     1, 0
	*/
	var rPrime = 0.567 * r + 0.433 * g + 0 * b + 0 * a + 0;
	var gPrime = 0.558 * r + 0.558 * g + 0 * b + 0 * a + 0;
	var bPrime = 0 * r + 0.242 * g + 0.758 * b + 0 * a + 0;
	var aPrime = 0 * r + 0 * g + 0 * b + 1 * a + 0;

	return [rPrime, gPrime, bPrime, aPrime];
}

function toDeuteranopia(r, g, b, a) {
	/*  0.625, 0.375, 0,   0, 0
			0.7,   0.3,   0,   0, 0
			0,     0.3,   0.7, 0, 0
			0,     0,     0,   1, 0
	*/

	var rPrime = 0.625 * r + 0.375 * g + 0 * b + 0 * a + 0;
	var gPrime = 0.7 * r + 0.3 * g + 0 * b + 0 * a + 0;
	var bPrime = 0 * r + 0.3 * g + 0.7 * b + 0 * a + 0;
	var aPrime = 0 * r + 0 * g + 0 * b + 1 * a + 0;

	return [rPrime, gPrime, bPrime, aPrime];
}

function toTritanopia(r, g, b, a) {
	/*  0.95, 0.05,  0,     0, 0
			0,    0.433, 0.567, 0, 0
			0,    0.475, 0.525, 0, 0
			0,    0,     0,     1, 0
	*/

	var rPrime = 0.95 * r + 0.05 * g + 0 * b + 0 * a + 0;
	var gPrime = 0 * r + 0.433 * g + 0.567 * b + 0 * a + 0;
	var bPrime = 0 * r + 0.475 * g + 0.525 * b + 0 * a + 0;
	var aPrime = 0 * r + 0 * g + 0 * b + 1 * a + 0;

	return [rPrime, gPrime, bPrime, aPrime];
}

function toAchromatopsia(r, b, g, a) {
	/*  0.299, 0.587, 0.114, 0, 0
			0.299, 0.587, 0.114, 0, 0
			0.299, 0.587, 0.114, 0, 0
			0,     0,     0,     1, 0
	*/

	var rPrime = 0.299 * r + 0.587 * g + 0.114 * b + 0 * a + 0;
	var gPrime = 0.299 * r + 0.587 * g + 0.114 * b + 0 * a + 0;
	var bPrime = 0.299 * r + 0.587 * g + 0.114 * b + 0 * a + 0;
	var aPrime = 0 * r + 0 * g + 0 * b + 1 * a + 0;

	return [rPrime, gPrime, bPrime, aPrime];
}

// ** HELPER FUNCTIONS **

// Convert RGB colors to HSB colorspace
function RGBToHSB(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	const v = Math.max(r, g, b),
		n = v - Math.min(r, g, b);
	const h = n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
	return [60 * (h < 0 ? h + 6 : h), v && (n / v) * 100, v * 100];
}
