import { Camera, Brain, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: Camera,
    title: 'Scan Your Crop',
    description: 'Take a photo of the affected leaf or plant using your smartphone camera.',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop&q=80',
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our AI model processes the image and identifies diseases, pests, or nutrient deficiencies.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&q=80',
  },
  {
    icon: CheckCircle,
    title: 'Get Solutions',
    description: 'Receive instant treatment recommendations and recovery plans tailored to your crop.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop&q=80',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Three simple steps to protect your crops and boost your harvest
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23d1fae5" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20" fill="%2310b981"%3E' + step.title + '%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 rounded-full p-4 shadow-lg">
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
                <div className="mt-8">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold mb-3">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
