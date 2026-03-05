import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import unhealthyCropLeavesImage from '../assets/unhealthy-crop-leaves.png'
import healthyCropImage from '../assets/healthy-crop.png'
import cropScanningImage from '../assets/crop-scanning.png'

const images = [
  {
    url: healthyCropImage,
    alt: 'Healthy crop with vibrant green leaves showing excellent growth and vitality',
    title: 'Healthy Crop',
  },
  {
    url: unhealthyCropLeavesImage,
    alt: 'Unhealthy crop leaves with disease symptoms showing yellowing, brown spots, and signs of distress',
    title: 'Unhealthy Crop Leaves',
  },
  {
    url: cropScanningImage,
    alt: 'Hand holding smartphone over garden bed with AR overlay for plant scanning and analysis',
    title: 'Scanning & Analysis',
  },
]

export default function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
      <div className="relative h-[400px] md:h-[500px]">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23d1fae5" width="800" height="600"/%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24" fill="%2310b981"%3E${encodeURIComponent(image.title)}%3C/text%3E%3C/svg%3E`
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <p className="text-white font-semibold text-lg">{image.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Previous image"
      >
        <ChevronLeft className="text-slate-800" size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label="Next image"
      >
        <ChevronRight className="text-slate-800" size={24} />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
