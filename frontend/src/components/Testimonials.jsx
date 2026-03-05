import { Star } from 'lucide-react'
import peterOchiengImage from '../assets/peter-ochieng.png'
import fatumaAliImage from '../assets/fatuma-ali.png'

const testimonials = [
  {
    name: 'James Kariuki',
    region: 'Western Kenya',
    rating: 5,
    quote: 'CropCare saved my maize harvest from a devastating disease. The AI detected it early and the treatment plan worked perfectly!',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
  },
  {
    name: 'Amina Hassan',
    region: 'Nigeria',
    rating: 5,
    quote: 'As a smallholder farmer, I never had access to expert advice. Now CropCare gives me professional crop diagnosis right on my phone.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80',
  },
  {
    name: 'Peter Ochieng',
    region: 'Eastern Kenya',
    rating: 5,
    quote: 'The offline mode is a game-changer! I can scan my crops even in remote areas without internet. Highly recommend!',
    image: peterOchiengImage,
  },
  {
    name: 'Fatuma Ali',
    region: 'Tanzania',
    rating: 5,
    quote: 'My tomato yield increased by 40% after following CropCare recommendations. The AI insights are incredibly accurate.',
    image: fatumaAliImage,
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 bg-gradient-to-b from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">Happy Farmers</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">See how CropCare is helping farmers across Africa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Ccircle fill="%23d1fae5" cx="32" cy="32" r="32"/%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24" fill="%2310b981"%3E' + testimonial.name.charAt(0) + '%3C/text%3E%3C/svg%3E'
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{testimonial.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.region}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-yellow-400 dark:text-yellow-500 dark:fill-yellow-500" size={16} />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 italic">&quot;{testimonial.quote}&quot;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
