// ** p5.js **

// Global Variables
var canvas;
var capture;
var visionMode = 0;
var environmentMode = 0;
var avgCaptureColor = [0, 0, 0];

var webcam;
var bgColorPreview = $("#bgColorPreview");
var avgColorPreview = $("#avgColorPreview");

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
	canvas = createCanvas(960, 540);
	canvas.id("webcam");
	pixelDensity(1);
	background(255);

	capture = createCapture(VIDEO);
	capture.size(960, 540);
	capture.hide();

	webcam = document.getElementById("webcam");
}

function draw() {
	// Capture Webcam Frame
	var capimg = capture.get();

	// Camera Image Processing
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
		image(capimg, 0, 0, 960, 540);
	}
	// Calculate Average Colors
	var numPixels = capimg.width * capimg.height;
	avgCaptureColor[0] /= numPixels;
	avgCaptureColor[1] /= numPixels;
	avgCaptureColor[2] /= numPixels;

	// Update People Average Color Preview in Scoreboard
	let avgStr = "rgb(" + avgCaptureColor[0] + "," + avgCaptureColor[1] + "," + avgCaptureColor[2] + ")";
	avgColorPreview.css("color", avgStr);

	// ? Could accessability contrast standards be used to calculate score??

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
	scoreElem.html(camoScore + "%");
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

	if(visionMode == 0) {
		$('#map-squirrel').css("filter", "grayscale(0%)")
		$('#map-dog').css("filter", "grayscale(0%)")
		$('#map-shrimp').css("filter", "grayscale(0%)")
		$('#map-owl').css("filter", "grayscale(0%)")
	}
	else if(visionMode == 1) {
		$('#map-squirrel').css("filter", "grayscale(0%)")
		$('#map-dog').css("filter", "grayscale(100%)")
		$('#map-shrimp').css("filter", "grayscale(100%)")
		$('#map-owl').css("filter", "grayscale(100%)")
	}
	else if(visionMode == 2) {
		$('#map-squirrel').css("filter", "grayscale(100%)")
		$('#map-dog').css("filter", "grayscale(0%)")
		$('#map-shrimp').css("filter", "grayscale(100%)")
		$('#map-owl').css("filter", "grayscale(100%)")
	}
	else if(visionMode == 3) {
		$('#map-squirrel').css("filter", "grayscale(100%)")
		$('#map-dog').css("filter", "grayscale(100%)")
		$('#map-shrimp').css("filter", "grayscale(0%)")
		$('#map-owl').css("filter", "grayscale(100%)")
	}
	else if(visionMode == 4) {
		$('#map-squirrel').css("filter", "grayscale(100%)")
		$('#map-dog').css("filter", "grayscale(100%)")
		$('#map-shrimp').css("filter", "grayscale(100%)")
		$('#map-owl').css("filter", "grayscale(0%)")
	}

	// Call to update environment
	updateEnvironment();
}

function updateEnvironment() {
	let htmlElem = $("html");

	// Update mode value used in p5.js code
	environmentMode = $("#environmentSelector").val();

	// Update color values used in p5.js code
	if (environmentMode == 0) {
		currentBG = [environmentColors.jungle.r, environmentColors.jungle.g, environmentColors.jungle.b];
		// Change Background
		console.log("visionMode = " + visionMode);

		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/jungle.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/jungle.png")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/jungle.png")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/jungle.png")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/jungle.png")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 1) {
		currentBG = [environmentColors.desert.r, environmentColors.desert.g, environmentColors.desert.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/desert.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/desert.png")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/desert.png")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/desert.png")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/desert.png")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 2) {
		currentBG = [environmentColors.tundra.r, environmentColors.tundra.g, environmentColors.tundra.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/tundra.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/tundra.png")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/tundra.png")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/tundra.png")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/tundra.png")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 3) {
		currentBG = [environmentColors.ocean.r, environmentColors.ocean.g, environmentColors.ocean.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/ocean.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/ocean.png")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/ocean.png")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/ocean.png")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/ocean.png")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 4) {
		currentBG = [environmentColors.forest.r, environmentColors.forest.g, environmentColors.forest.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/gapines.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/gapines.png")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/gapines.png")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/gapines.png")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/gapines.png")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
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

	// Update Background Color Preview in Scoreboard
	let bgStr = "rgb(" + currentBG[0] + "," + currentBG[1] + "," + currentBG[2] + ")";
	bgColorPreview.css("background-color", bgStr);
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

function tapSquirrel() {
	visionMode = 1
	$("#visionSelector").val(1);
	updateEnvironment()

	$('#map-owl').css("filter", "grayscale(100%)")
	$('#map-dog').css("filter", "grayscale(100%)")
	$('#map-squirrel').css("filter", "grayscale(0%)")
	$('#map-shrimp').css("filter", "grayscale(100%)")
}

function tapDog() {
	visionMode = 2
	$("#visionSelector").val(2);
	updateEnvironment()

	$('#map-owl').css("filter", "grayscale(100%)")
	$('#map-dog').css("filter", "grayscale(0%)")
	$('#map-squirrel').css("filter", "grayscale(100%)")
	$('#map-shrimp').css("filter", "grayscale(100%)")
}

function tapShrimp() {
	visionMode = 3
	$("#visionSelector").val(3);
	updateEnvironment()

	$('#map-owl').css("filter", "grayscale(100%)")
	$('#map-dog').css("filter", "grayscale(100%)")
	$('#map-squirrel').css("filter", "grayscale(100%)")
	$('#map-shrimp').css("filter", "grayscale(0%)")
}

function tapOwl() {
	visionMode = 4
	$("#visionSelector").val(4);
	updateEnvironment()

	$('#map-owl').css("filter", "grayscale(0%)")
	$('#map-dog').css("filter", "grayscale(100%)")
	$('#map-squirrel').css("filter", "grayscale(100%)")
	$('#map-shrimp').css("filter", "grayscale(100%)")
}