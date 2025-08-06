'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface AnalysisResult {
  summary: string
  highlights: string[]
  what_to_do: string[]
  important_dates: string[]
  email_prompt?: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const analyzeLetter = async () => {
    if (!file) return

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('https://letter-analyzer-app.onrender.com/analyze-letter', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze letter')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Letter Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload a letter image and get instant AI-powered analysis with summaries, 
            highlights, and action items.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Upload Your Letter
              </h2>
              <p className="text-gray-600">
                Take a photo or upload an image of your letter
              </p>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload or drag and drop
                </span>
                <span className="text-sm text-gray-500">
                  PNG, JPG, JPEG up to 10MB
                </span>
              </label>
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Preview:</h3>
                <div className="max-w-md mx-auto">
                  <img
                    src={preview}
                    alt="Letter preview"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              </div>
            )}

            {/* Analyze Button */}
            {file && (
              <div className="mt-6 text-center">
                <button
                  onClick={analyzeLetter}
                  disabled={isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center justify-center mx-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Analyze Letter
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Analysis Results
              </h2>

              {/* Summary */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {result.summary}
                </p>
              </div>

              {/* Highlights */}
              {result.highlights.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Highlights</h3>
                  <ul className="space-y-2">
                    {result.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What To Do */}
              {result.what_to_do.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">What To Do</h3>
                  <ul className="space-y-2">
                    {result.what_to_do.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Dates */}
              {result.important_dates.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Important Dates</h3>
                  <ul className="space-y-2">
                    {result.important_dates.map((date, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Email Prompt */}
              {result.email_prompt && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Email Response</h3>
                  <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                    {result.email_prompt}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 