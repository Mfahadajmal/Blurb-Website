"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, MapPin, Crosshair, AlertCircle, RotateCcw } from "lucide-react"

interface SelectLocationProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: { lat: number; lng: number }) => void
  initialLocation?: { lat: number; lng: number } | null
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function SelectLocation({ isOpen, onClose, onLocationSelect, initialLocation }: SelectLocationProps) {
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const maxRetries = 20

  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !window.google?.maps) {
      if (retryAttempt < maxRetries) {
        setTimeout(() => {
          setRetryAttempt((prev) => prev + 1)
        }, 500)
      } else {
        setError("Failed to load Google Maps. Please check your internet connection.")
        setIsLoading(false)
      }
      return
    }

    try {
      const defaultLocation = initialLocation || { lat: 24.8607, lng: 67.0011 } // Karachi, Pakistan

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      })

      const markerInstance = new window.google.maps.Marker({
        position: defaultLocation,
        map: mapInstance,
        draggable: true,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      })

      // Click to place marker
      mapInstance.addListener("click", (event: any) => {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        }
        markerInstance.setPosition(location)
        setSelectedLocation(location)
      })

      // Drag marker
      markerInstance.addListener("dragend", (event: any) => {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        }
        setSelectedLocation(location)
      })

      setMap(mapInstance)
      setMarker(markerInstance)
      setSelectedLocation(defaultLocation)
      setIsLoading(false)
      setError(null)
    } catch (err) {
      console.error("Error initializing map:", err)
      setError("Failed to initialize map")
      setIsLoading(false)
    }
  }, [initialLocation, retryAttempt, maxRetries])

  useEffect(() => {
    if (!isOpen) return

    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initializeMap()
        return
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkGoogle = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkGoogle)
            initializeMap()
          }
        }, 100)
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      script.onerror = () => {
        setError("Failed to load Google Maps API")
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    setIsLoading(true)
    setError(null)
    setRetryAttempt(0)
    loadGoogleMaps()
  }, [isOpen, initializeMap])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser")
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        if (map && marker) {
          map.setCenter(location)
          marker.setPosition(location)
          setSelectedLocation(location)
        }
        setIsLoading(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Unable to get your current location")
        setIsLoading(false)
      },
      { timeout: 10000 },
    )
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation)
    }
  }

  const handleRetry = () => {
    setError(null)
    setRetryAttempt(0)
    setIsLoading(true)
    initializeMap()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl mx-4 bg-white rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Select Billboard Location</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Click on the map or drag the marker to select location</p>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
                {retryAttempt > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Attempt {retryAttempt}/{maxRetries}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center max-w-md mx-auto p-6">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Error</h4>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <RotateCcw size={16} />
                  Retry
                </button>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-96" />

          {/* Current Location Button */}
          {!isLoading && !error && (
            <button
              onClick={getCurrentLocation}
              className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
              title="Get current location"
            >
              <Crosshair size={20} className="text-gray-600" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedLocation ? (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-green-600" />
                  <span>
                    Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </span>
                </div>
              ) : (
                <span>No location selected</span>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedLocation}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
