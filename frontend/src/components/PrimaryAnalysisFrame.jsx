import { useRef, useState } from 'react'
import { Camera, Target, TrendingUp, Clock, Leaf, AlertCircle } from 'lucide-react'
import { useTranslation } from '../contexts/AppSettingsContext'

export default function PrimaryAnalysisFrame({
  imagePreview,
  result,
  loading,
  onLoadOrTake,
  onCapture,
  onAnalyze,
  fileInputRef,
  onFileChange,
  hasImage,
}) {
  const inputRef = fileInputRef || useRef(null)
  const t = useTranslation()

  // ✅ store real file
  const [selectedFile, setSelectedFile] = useState(null)

  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState(null)

  // ✅ FIXED FILE HANDLER (keeps original + preview)
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setSelectedFile(file)

    // keep your existing preview logic
    onFileChange(e)
  }

  // ✅ Convert file → base64 (ONLY for Claude)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = () => {
        const result = reader.result
        const matches = result.match(/^data:(.+);base64,(.+)$/)

        if (matches && matches.length === 3) {
          resolve({
            mime: matches[1],
            data: matches[2],
          })
        } else {
          reject("Invalid format")
        }
      }

      reader.onerror = reject
    })
  }

  // ✅ Claude verification
  const verifyWithClaude = async (imgData) => {
    const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

    const SYSTEM_MESSAGE =
      'You are a plant identification assistant. ' +
      'Respond ONLY with JSON: {"isPlant": true/false, "reason": "text"}'

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          system: SYSTEM_MESSAGE,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: imgData.mime,
                    data: imgData.data,
                  },
                },
                { type: "text", text: "Verify this image." }
              ]
            }
          ]
        })
      })

      const data = await response.json()
      const rawText = data.content[0].text
      const clean = rawText.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      return parsed.isPlant
        ? { isValid: true }
        : { isValid: false, reason: parsed.reason }

    } catch (err) {
      return { isValid: false, reason: "Verification failed." }
    }
  }

  // ✅ MAIN FLOW (verification → analysis)
  const handleVerifyAndAnalyze = async () => {
    if (!selectedFile) {
      setVerificationError("Please upload an image first.")
      return
    }

    setIsVerifying(true)
    setVerificationError(null)

    try {
      // convert for Claude
      const imgData = await fileToBase64(selectedFile)

      const verification = await verifyWithClaude(imgData)

      if (verification.isValid) {
        // ✅ send ORIGINAL FILE to your model
        onAnalyze(selectedFile)
      } else {
        setVerificationError(
          verification.reason || "Not a valid plant image."
        )
      }

    } catch (err) {
      setVerificationError("Invalid image data format.")
    }

    setIsVerifying(false)
  }

  return (
    <section className="glass-modal dark:glass-modal-dark rounded-2xl p-6">
      <div className="space-y-6">

        {/* 🔹 UPLOAD SECTION */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Camera size={20} />
            {t('loadPlantImage')}
          </h3>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange} // ✅ FIXED
            className="sr-only"
          />

          <div className="flex gap-3 flex-wrap">

            <button onClick={onLoadOrTake}>
              Upload Image
            </button>

            {onCapture && (
              <button onClick={onCapture}>
                Take Photo
              </button>
            )}

            {imagePreview && (
              <img
                src={imagePreview}
                className="w-28 h-28 object-cover rounded"
              />
            )}
          </div>

          {/* ❌ ERROR */}
          {verificationError && (
            <div className="mt-2 text-red-500 flex gap-2">
              <AlertCircle size={16} />
              {verificationError}
            </div>
          )}

          {/* 🔹 ANALYZE BUTTON */}
          {hasImage && (
            <button
              onClick={handleVerifyAndAnalyze}
              disabled={loading || isVerifying}
              className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded"
            >
              {isVerifying ? 'Verifying...' : loading ? 'Analyzing...' : 'Analyze'}
            </button>
          )}
        </div>

        {/* 🔹 RESULTS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <div>
            <Clock size={16} />
            <p>{result.timeTaken ? `${result.timeTaken}s` : '-'}</p>
          </div>

          <div>
            <Target size={16} />
            <p>{result.accuracyRate ? `${result.accuracyRate}%` : '-'}</p>
          </div>

          <div>
            <TrendingUp size={16} />
            <p>{result.recoveryRate ? `${result.recoveryRate}%` : '-'}</p>
          </div>

          <div>
            <Leaf size={16} />
            <p>{result.cropType || '-'}</p>
          </div>

        </div>
      </div>
    </section>
  )
}