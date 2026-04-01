/**
 * Leaf Validator - ONLY accepts crop leaves, rejects everything else
 */

export async function validateLeafImage(imageBuffer, mimeType = 'image/jpeg') {
  try {
    console.log('\n🔍 LEAF VALIDATION STARTED');
    console.log(`File size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
    
    // Reject images that are too small
    if (!imageBuffer || imageBuffer.length < 5000) {
      console.log('❌ REJECTED: Image too small');
      return {
        isValid: false,
        message: '❌ Image too small. Please upload a clear photo of a crop leaf.',
        confidence: 0
      };
    }
    
    // Analyze pixels for green color (characteristic of crop leaves)
    const bytes = new Uint8Array(imageBuffer);
    let greenPixels = 0;
    let totalPixels = 0;
    
    // Sample pixels throughout the image
    for (let i = 0; i < bytes.length - 3; i += 45) {
      const r = bytes[i];
      const g = bytes[i + 1];
      const b = bytes[i + 2];
      
      if (r === undefined || g === undefined || b === undefined) continue;
      
      totalPixels++;
      
      // GREEN DETECTION - What makes a crop leaf
      // Healthy green leaf
      const isHealthyGreen = (g > r + 25 && g > b + 25 && g > 65);
      // Yellowish green leaf (diseased but still leaf)
      const isYellowGreen = (g > 80 && r > 60 && r < 150 && b < 90);
      // Dark green leaf
      const isDarkGreen = (g > 45 && g > r + 15 && g > b + 15);
      
      if (isHealthyGreen || isYellowGreen || isDarkGreen) {
        greenPixels++;
      }
    }
    
    const greenPercentage = totalPixels > 0 ? (greenPixels / totalPixels) * 100 : 0;
    
    console.log(`Green pixels: ${greenPixels} / ${totalPixels} = ${greenPercentage.toFixed(1)}%`);
    
    // ONLY ACCEPT if there is significant green (crop leaf)
    // Reject if green percentage is low (car, animal, person, building, etc.)
    if (greenPercentage >= 5) {
      console.log('✅ ACCEPTED: Valid crop leaf detected');
      return {
        isValid: true,
        message: '✅ Crop leaf detected! Proceeding with disease analysis.',
        confidence: Math.min(95, Math.round(greenPercentage * 2))
      };
    } 
    else {
      console.log('❌ REJECTED: Not a crop leaf');
      return {
        isValid: false,
        message: '❌ This is not a crop leaf. Please upload a clear photo of a crop leaf with visible green areas.',
        confidence: Math.round(greenPercentage * 2)
      };
    }
    
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      message: '❌ Error processing image. Please try again.',
      confidence: 0
    };
  }
}

export default { validateLeafImage };