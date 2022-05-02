// Setup Variables
var camWidth = 1280;
let camHeight = 720;
var canvasTF;
var canvasC;
var videoElement;
var CtxTF;


var visionMode = 0;
var environmentMode = 0;
var avgCaptureColor = [0, 0, 0];

var environmentColors = {
	jungle: { r: 17, g: 27, b: 12 },
	desert: { r: 140, g: 122, b: 111 },
	tundra: { r: 176, g: 183, b: 194 },
	ocean: { r: 43, g: 101, b: 115 },
	forest: { r: 95, g: 89, b: 70 },
};

var currentBG = [environmentColors.jungle.r, environmentColors.jungle.g, environmentColors.jungle.b];

// * ----- Canvas Setup ----- *

// Identify DOM Elements
videoElement = document.getElementsByClassName("input_video")[0];
canvasTF = document.getElementById("canvasTF");
CtxTF = canvasTF.getContext("2d");
canvasC = document.getElementById("canvasC");
CtxC = canvasC.getContext("2d");

// Setup Segmentation Functions
const selfieSegmentation = new SelfieSegmentation({
	locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
	},
});

selfieSegmentation.setOptions({
	modelSelection: 1,
});

selfieSegmentation.onResults(onResults);

// Setup Webcam Feed
const camera = new Camera(videoElement, {
	onFrame: async () => {
		await selfieSegmentation.send({ image: videoElement });
	},
	width: camWidth,
	height: camHeight,
});

camera.start();

// Processes background removal results, then applies color processing
function onResults(results) {
	// -- DRAW WITH REMOVED BACKGROUND --

	CtxTF.clearRect(0, 0, canvasTF.width, canvasTF.height);
	CtxTF.drawImage(results.segmentationMask, 0, 0, canvasTF.width, canvasTF.height);
	CtxTF.globalCompositeOperation = "source-out";
	CtxTF.fillStyle = "#000000";
	CtxTF.fillRect(0, 0, canvasTF.width, canvasTF.height);

	CtxTF.globalCompositeOperation = "source-out";
	CtxTF.drawImage(results.image, 0, 0, canvasTF.width, canvasTF.height);

	// -- DRAW WITH COLOR PROCESSING --

  var frame = CtxTF.getImageData(0,0,camWidth,camHeight)
  for(var i = 0; i< frame.data.length; i += 4) {
    // Capture
    var r = frame.data[i + 0] * 0.85;
    var g = frame.data[i + 1] * 0.85;
    var b = frame.data[i + 2] * 0.85;
    var a = frame.data[i + 3];

    // Manipulate
    if (visionMode == 0) {
      // Colors do not change.
    } else if (visionMode == 1) {
      // Protanopia
      var newColors = toProtanopia(r, g, b, a);
      r = newColors[0];
      g = newColors[1];
      b = newColors[2];
      a = newColors[3];
    } else if (visionMode == 2) {
      // Deuteranopia
      var newColors = toDeuteranopia(r, g, b, a);
      r = newColors[0];
      g = newColors[1];
      b = newColors[2];
      a = newColors[3];
    } else if (visionMode == 3) {
      // Tritanopia
      var newColors = toTritanopia(r, g, b, a);
      r = newColors[0];
      g = newColors[1];
      b = newColors[2];
      a = newColors[3];
    } else if (visionMode == 4) {
      // Achromatopsia
      var newColors = toAchromatopsia(r, g, b, a);
      r = newColors[0];
      g = newColors[1];
      b = newColors[2];
      a = newColors[3];
    }

    // Add colors to averages
    avgCaptureColor[0] += r;
    avgCaptureColor[1] += g;
    avgCaptureColor[2] += b;

    // Update
    frame.data[i + 0] = r;
    frame.data[i + 1] = g;
    frame.data[i + 2] = b;
    frame.data[i + 3] = a;
    
  }

  // Update Canvas
  CtxC.clearRect(0, 0, canvasC.width, canvasC.height);
  CtxC.putImageData(frame, 0, 0);

  // Calculate Average Colors
	var numPixels = camWidth * camHeight;
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

	// Calculate & Update Overall Score on Page
	var camoScore = 100 - Math.max(vDiffHper, vDiffSper, vDiffBper);
	var scoreElem = $("#camoScore");
	var scoreIcon = $("#camoScoreIcon");
	var scoreNumber = $("#camoScoreNum")

	scoreNumber.html(camoScore + "%");

	if(camoScore >= 80) {
		scoreElem.html("Camouflaged")
		scoreElem.addClass("has-text-success");
		scoreElem.removeClass("has-text-warning");
		scoreElem.removeClass("has-text-danger");

		scoreNumber.addClass("has-text-success");
		scoreNumber.removeClass("has-text-warning");
		scoreNumber.removeClass("has-text-danger");

		scoreIcon.addClass("fa-circle-check");
		scoreIcon.removeClass("fa-triangle-exclamation");
		scoreIcon.removeClass("fa-circle-xmark");
		scoreIcon.addClass("has-text-success");
		scoreIcon.removeClass("has-text-warning");
		scoreIcon.removeClass("has-text-danger");
	} else if(camoScore > 50 && camoScore < 80) {
		scoreElem.html("Almost Hidden")
		scoreElem.removeClass("has-text-success");
		scoreElem.addClass("has-text-warning");
		scoreElem.removeClass("has-text-danger");

		scoreNumber.removeClass("has-text-success");
		scoreNumber.addClass("has-text-warning");
		scoreNumber.removeClass("has-text-danger");

		scoreIcon.removeClass("fa-circle-check");
		scoreIcon.addClass("fa-triangle-exclamation");
		scoreIcon.removeClass("fa-circle-xmark");
		scoreIcon.removeClass("has-text-success");
		scoreIcon.addClass("has-text-warning");
		scoreIcon.removeClass("has-text-danger");
	} else {
		scoreElem.html("Not Hidden")
		scoreElem.removeClass("has-text-success");
		scoreElem.removeClass("has-text-warning");
		scoreElem.addClass("has-text-danger");

		scoreNumber.removeClass("has-text-success");
		scoreNumber.removeClass("has-text-warning");
		scoreNumber.addClass("has-text-danger");

		scoreIcon.removeClass("fa-circle-check");
		scoreIcon.removeClass("fa-triangle-exclamation");
		scoreIcon.addClass("fa-circle-xmark");
		scoreIcon.removeClass("has-text-success");
		scoreIcon.removeClass("has-text-warning");
		scoreIcon.addClass("has-text-danger");
	}

	// Reset Average Color (for next calculation)
	avgCaptureColor[0] = 0;
	avgCaptureColor[1] = 0;
	avgCaptureColor[2] = 0;

}

// * ----- CAMO CAMERA FUNCTIONS ----- *

setEnvironmentAndVision(0, 0);

function setEnvironmentAndVision(env, vis) {
	environmentMode = env;
	visionMode = vis;

	// Update Vision Mode Title
	let visionTitle = $("#visionTitle")

	if (visionMode == 0) {
		visionTitle.html("Human");
	} else if (visionMode == 1) {
		visionTitle.html("Squirrel");
	} else if (visionMode == 2) {
		visionTitle.html("Dog");
	} else if (visionMode == 3) {
		visionTitle.html("Crustaceans");
	} else if (visionMode == 4) {
		visionTitle.html("Owl");
	}

	// Update Current Environment Background
	let htmlElem = $("body");

	if (environmentMode == 0) {
		currentBG = [environmentColors.jungle.r, environmentColors.jungle.g, environmentColors.jungle.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/jungle.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/jungle.jpg")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/jungle.jpg")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/jungle.jpg")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/jungle.jpg")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 1) {
		currentBG = [environmentColors.desert.r, environmentColors.desert.g, environmentColors.desert.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/desert.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/desert.jpg")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/desert.jpg")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/desert.jpg")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/desert.jpg")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 2) {
		currentBG = [environmentColors.tundra.r, environmentColors.tundra.g, environmentColors.tundra.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/tundra.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/tundra.jpg")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/tundra.jpg")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/tundra.jpg")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/tundra.jpg")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 3) {
		currentBG = [environmentColors.ocean.r, environmentColors.ocean.g, environmentColors.ocean.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/ocean.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/ocean.jpg")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/ocean.jpg")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/ocean.jpg")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/ocean.jpg")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else if (environmentMode == 4) {
		currentBG = [environmentColors.forest.r, environmentColors.forest.g, environmentColors.forest.b];
		// Change Background
		if (visionMode == 0) {
			htmlElem.css("background-image", 'url("images/human/gapines.jpg")');
		} else if (visionMode == 1) {
			htmlElem.css("background-image", 'url("images/squirrel/gapines.jpg")');
		} else if (visionMode == 2) {
			htmlElem.css("background-image", 'url("images/dog/gapines.jpg")');
		} else if (visionMode == 3) {
			htmlElem.css("background-image", 'url("images/crustaceans/gapines.jpg")');
		} else if (visionMode == 4) {
			htmlElem.css("background-image", 'url("images/owls/gapines.jpg")');
		} else {
			htmlElem.css("background-image", 'url("images/dwayne.jpeg")');
		}
	} else {
		currentBG = [255, 0, 0];
	}

	if (visionMode == 1) {
		// Transform BG
		currentBG = toProtanopia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	} else if (visionMode == 2) {
		currentBG = toDeuteranopia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	} else if (visionMode == 3) {
		currentBG = toTritanopia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	} else if (visionMode == 4) {
		currentBG = toAchromatopsia(currentBG[0], currentBG[1], currentBG[2], 1.0);
	}

}

function updateVision(mode) {
	setEnvironmentAndVision(environmentMode, mode);
	hideVisionModal();
	hideEnvModal();
}

function updateEnvironment(mode) {
	setEnvironmentAndVision(mode, visionMode);
	hideVisionModal();
	hideEnvModal();
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

// Open/Close Vision Modal
function showVisionModal() {
	$('#visionModal').addClass('is-active');
}
function hideVisionModal() {
	$('#visionModal').removeClass('is-active');
}
function showEnvModal() {
	$('#envModal').addClass('is-active');
}
function hideEnvModal() {
	$('#envModal').removeClass('is-active');
}

// ** KEYSTROKE LISTENERS **

document.addEventListener('keypress', function(event) {
	if(event.key === 'q') {
		console.log("Vision: Humans");
		updateVision(0)
	}
	else if(event.key === 'w') {
		console.log("Vision: Squirrels");
		updateVision(1);
	}
	else if(event.key === 'e') {
		console.log("Vision: Dogs");
		updateVision(2);
	}
	else if(event.key === 'r') {
		console.log("Vision: Crustaceans");
		updateVision(3);
	}
	else if(event.key === 't') {
		console.log("Vision: Owls");
		updateVision(4);
	}
	else if(event.key === 'a') {
		console.log("Environment: Jungle");
		updateEnvironment(0);
	}
	else if(event.key === 's') {
		console.log("Environment: Desert");
		updateEnvironment(1);
	}
	else if(event.key === 'd') {
		console.log("Environment: Tundra");
		updateEnvironment(2);
	}
	else if(event.key === 'f') {
		console.log("Environment: Ocean");
		updateEnvironment(3);
	}
	else if(event.key === 'g') {
		console.log("Environment: Pine Forest");
		updateEnvironment(4);
	}
});