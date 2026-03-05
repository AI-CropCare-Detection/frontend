const MAX_DIMENSION = 400
const JPEG_QUALITY = 0.88

/**
 * Resize and compress an image file for fast upload. Returns a JPEG Blob.
 * @param {File} file - Image file
 * @returns {Promise<Blob>} Compressed image blob
 */
export function resizeImageForAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      let w = width
      let h = height
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          w = MAX_DIMENSION
          h = Math.round((height * MAX_DIMENSION) / width)
        } else {
          h = MAX_DIMENSION
          w = Math.round((width * MAX_DIMENSION) / height)
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to compress image'))
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}
