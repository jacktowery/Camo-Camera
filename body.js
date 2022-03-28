const img = document.getElementById("image");

async function loadAndPredict() {
	const net = await bodyPix.load();
	const segmentation = await net.segmentPerson(img);

	const maskBackground = true;
	// Convert the segmentation into a mask to darken the background.
	const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
	const backgroundColor = { r: 255, g: 0, b: 255, a: 255 };
	const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);

	const opacity = 1;
	const maskBlurAmount = 0;
	const flipHorizontal = false;
	const canvas = document.getElementById("canvas");
	// Draw the mask onto the image on a canvas.  With opacity set to 0.7 and
	// maskBlurAmount set to 3, this will darken the background and blur the
	// darkened background's edge.
	bodyPix.drawMask(canvas, img, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);
  console.log(segmentation);
}

loadAndPredict();
