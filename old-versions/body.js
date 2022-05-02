/* p5.js */

// Global Variables
var canvas;
var capture;
var capimg;

function setup() {
	canvas = createCanvas(640,480);
	canvas.id('p5Output');
	pixelDensity(1);
	background(255,255,255);

	capture = createCapture(VIDEO);
	capture.size(640,480);
	capture.hide();

	$('video:first').attr('id','webcamFeed');
}

function draw() {
	//Capture Webcam Frame
	capimg = capture.get();

	// Load Pixel Array
	capimg.loadPixels();

	// Color Manipulation
	capimg.updatePixels();

	// Draw Image on Canvas
	image(capimg,0,0,640,480);

	//loadAndPredict();
}

//const img = document.getElementById("image");
var video = document.getElementById("webcamFeed");
var p5Canvas = document.getElementById("p5Output");
var canvas2 = document.getElementById("canvas2");

async function loadAndPredict() {
	// Load Plugin
	const net = await bodyPix.load();

	// Get Context??
	//const ctx = canvas2.getContext('2d');

	// Segmentation
	video = document.getElementById("webcamFeed");
	const segmentation = await net.segmentPerson(capimg);

	// Parameters
	const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
	const backgroundColor = { r: 255, g: 0, b: 255, a: 255 };
	const opacity = 1;
	const maskBlurAmount = 0;
	const flipHorizontal = false;

	// Convert the segmentation into a mask to darken the background.
	const mask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);

	// Draw Mask
	bodyPix.drawMask(canvas2, capimg, mask, opacity, maskBlurAmount, flipHorizontal);

	/*
	const ctx = canvas2.getContext('2d');
	const segmentation = await net.segmentPerson(p5Canvas);

	const maskBackground = true;
	// Convert the segmentation into a mask to darken the background.
	const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
	const backgroundColor = { r: 255, g: 0, b: 255, a: 255 };
	const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);

	const opacity = 1;
	const maskBlurAmount = 0;
	const flipHorizontal = false;
	// Draw the mask onto the image on a canvas.  With opacity set to 0.7 and
	// maskBlurAmount set to 3, this will darken the background and blur the
	// darkened background's edge.
	bodyPix.drawMask(canvas2, p5Canvas, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);
  console.log(segmentation);
	*/
}

//loadAndPredict();
