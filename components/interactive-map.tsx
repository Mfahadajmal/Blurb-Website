"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Navigation, ExternalLink, Map } from "lucide-react"

interface Billboard {
  id: string
  title: string
  city: string
  price: number
  photos: string[]
  location?: {
    lat: number
    lng: number
  }
  type?: string
}

interface InteractiveMapProps {
  billboards: Billboard[]
  height?: string
  className?: string
}

declare global {
  interface Window {
    google: any
    initGoogleMaps?: () => void
  }
}

export default function InteractiveMap({ billboards, height = "400px", className = "" }: InteractiveMapProps) {
  const [map, setMap] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const markersRef = useRef<any[]>([])
  const mapRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const retryCountRef = useRef(0)

  // Check if Google Maps API key is available
  const hasGoogleMapsKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== "undefined" &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim() !== ""

  // Initialize Google Maps
  useEffect(() => {
    // If no API key, show fallback immediately
    if (!hasGoogleMapsKey) {
      console.log("No Google Maps API key found, showing fallback")
      setShowFallback(true)
      setLoading(false)
      return
    }

    const initializeMap = () => {
      console.log("Attempting to initialize map...")

      if (!mapRef.current) {
        console.log("Map ref not available, retrying...")
        setTimeout(initializeMap, 100)
        return
      }

      if (!window.google?.maps) {
        console.log("Google Maps not loaded yet, retrying...")
        if (retryCountRef.current < 10) {
          retryCountRef.current++
          setTimeout(initializeMap, 1000)
        } else {
          console.log("Google Maps failed to load after retries, showing fallback")
          setShowFallback(true)
          setLoading(false)
        }
        return
      }

      const defaultCenter = { lat: 31.5204, lng: 74.3587 } // Lahore, Pakistan

      try {
        console.log("Creating map instance...")
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
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

        console.log("Map instance created successfully")
        setMap(mapInstance)
        setLoading(false)
        setShowFallback(false)
      } catch (err) {
        console.error("Error initializing map:", err)
        setError("Failed to load map")
        setShowFallback(true)
        setLoading(false)
      }
    }

    const loadGoogleMaps = () => {
      // Check if script is already loaded
      if (window.google?.maps) {
        console.log("Google Maps already loaded")
        initializeMap()
        return
      }

      // Check if script is already being loaded
      if (scriptLoadedRef.current) {
        console.log("Google Maps script already loading...")
        return
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        console.log("Google Maps script tag already exists")
        scriptLoadedRef.current = true
        existingScript.addEventListener("load", initializeMap)
        existingScript.addEventListener("error", () => {
          console.error("Google Maps script failed to load")
          setShowFallback(true)
          setLoading(false)
        })
        return
      }

      console.log("Loading Google Maps script...")
      scriptLoadedRef.current = true

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
      script.async = true
      script.defer = true

      // Set up global callback
      window.initGoogleMaps = initializeMap

      script.onerror = () => {
        console.error("Failed to load Google Maps script")
        setError("Failed to load Google Maps")
        setShowFallback(true)
        setLoading(false)
        scriptLoadedRef.current = false
      }

      script.onload = () => {
        console.log("Google Maps script loaded successfully")
      }

      document.head.appendChild(script)
    }

    // Small delay to ensure component is mounted
    const timer = setTimeout(loadGoogleMaps, 100)

    return () => {
      clearTimeout(timer)
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps
      }
    }
  }, [hasGoogleMapsKey])

  // Add markers for billboards
  useEffect(() => {
    if (!map || !window.google || billboards.length === 0 || showFallback) return

    console.log(`Adding ${billboards.length} billboard markers...`)

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    billboards.forEach((billboard, index) => {
      if (billboard.location?.lat && billboard.location?.lng) {
        console.log(`Adding marker ${index + 1}: ${billboard.title}`)

        const marker = new window.google.maps.Marker({
          position: { lat: billboard.location.lat, lng: billboard.location.lng },
          map: map,
          title: billboard.title,
          icon: {
            url:
              billboard.type === "Digital Billboard"
                ? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMzQjgyRjYiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMiIgeT0iMyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE0IiByeD0iMiIgcnk9IjIiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIGZpbGw9IiMzQjgyRjYiLz4KPC9zdmc+Cjwvc3ZnPgo="
                : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFRjQ0NDQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE2IiByeD0iMiIgcnk9IjIiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjciIHk9IjgiIHdpZHRoPSIxMCIgaGVpZ2h0PSI4IiBmaWxsPSIjRUY0NDQ0Ii8+Cjwvc3ZnPgo8L3N2Zz4K",
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32),
          },
        })

        // Add click listener to marker
        marker.addListener("click", () => {
          console.log(`Marker clicked: ${billboard.title}`)
          setSelectedBillboard(billboard)
        })

        markersRef.current.push(marker)
      }
    })

    console.log(`Added ${markersRef.current.length} markers successfully`)
  }, [map, billboards, showFallback])

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported")
      return
    }

    console.log("Getting current location...")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        console.log("Current location obtained:", location)
        setUserLocation(location)

        if (map && !showFallback) {
          // Add user location marker
          new window.google.maps.Marker({
            position: location,
            map: map,
            title: "Your Location",
            icon: {
              url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxMEI5ODEiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iOCIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNCIgZmlsbD0iIzEwQjk4MSIvPgo8L3N2Zz4K",
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 12),
            },
          })

          map.setCenter(location)
          map.setZoom(14)
        }
      },
      (error) => {
        console.error("Error getting location:", error)
      },
    )
  }

  // Get directions to billboard
  const getDirections = (billboard: Billboard) => {
    if (!billboard.location) {
      alert("Billboard location not available")
      return
    }

    if (!userLocation) {
      // If user location is not available, get it first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude
          const userLng = position.coords.longitude
          const origin = `${userLat},${userLng}`
          const destination = `${billboard.location!.lat},${billboard.location!.lng}`
          const url = `https://www.google.com/maps/dir/${origin}/${destination}`
          window.open(url, "_blank")
        },
        (error) => {
          console.error("Error getting location:", error)
          // Fallback: open Google Maps with just the destination
          const destination = `${billboard.location!.lat},${billboard.location!.lng}`
          const url = `https://www.google.com/maps/search/${destination}`
          window.open(url, "_blank")
        },
      )
    } else {
      const origin = `${userLocation.lat},${userLocation.lng}`
      const destination = `${billboard.location.lat},${billboard.location.lng}`
      const url = `https://www.google.com/maps/dir/${origin}/${destination}`
      window.open(url, "_blank")
    }
  }

  // Navigate to billboard detail page
  const viewBillboardDetails = (billboard: Billboard) => {
    window.location.href = `/billboard/${billboard.id}`
  }

  // Retry loading Google Maps
  const retryGoogleMaps = () => {
    setLoading(true)
    setError(null)
    setShowFallback(false)
    retryCountRef.current = 0
    scriptLoadedRef.current = false

    // Remove existing script if any
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Reload the component
    window.location.reload()
  }

  // Fallback Map Component
  const FallbackMap = () => (
    <div className={`relative ${className}`}>
      <div
        className="relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-blue-50 to-green-50"
        style={{ height }}
      >
        {/* Map Header */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">{billboards.length} Billboard Locations</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/billboards+advertising`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View on Google Maps
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Billboard Markers Simulation */}
        <div className="absolute inset-0 p-8">
          {billboards.slice(0, 8).map((billboard, index) => (
            <div
              key={billboard.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${20 + (index % 4) * 20}%`,
                top: `${30 + Math.floor(index / 4) * 25}%`,
              }}
              onClick={() => setSelectedBillboard(billboard)}
            >
              {/* Marker */}
              <div className="relative">
                <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="h-4 w-4 text-white" />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px] border">
                    <div className="flex items-start gap-3">
                      <img
                        src={billboard.photos[0] || "/placeholder.svg?height=60&width=80"}
                        alt={billboard.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{billboard.title}</h4>
                        <p className="text-xs text-gray-600 mb-1">{billboard.city}</p>
                        <p className="text-sm font-bold text-blue-600">${billboard.price.toLocaleString()}/mo</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          viewBillboardDetails(billboard)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Center Message */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-md">
            <Map className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Billboard Map</h3>
            <p className="text-gray-600 text-sm mb-4">
              Explore billboard locations across the city. Click markers to view details or use Google Maps for full
              functionality.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={getCurrentLocation}
                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Navigation className="h-3 w-3" />
                Get My Location
              </button>
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Current Location Button */}
        <button
          onClick={getCurrentLocation}
          className="absolute top-4 right-4 bg-white hover:bg-gray-50 p-3 rounded-lg shadow-lg transition-colors"
          title="Get Current Location"
        >
          <Navigation className="h-5 w-5 text-blue-600" />
        </button>

        {/* Legend */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Billboard Location</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Digital Screen</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Your Location</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billboard Info Popup */}
      {selectedBillboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg">{selectedBillboard.title}</h3>
              <button onClick={() => setSelectedBillboard(null)} className="text-gray-400 hover:text-gray-600 text-xl">
                ×
              </button>
            </div>

            {selectedBillboard.photos?.[0] && (
              <img
                src={selectedBillboard.photos[0] || "/placeholder.svg"}
                alt={selectedBillboard.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{selectedBillboard.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-600">${selectedBillboard.price?.toLocaleString()}/month</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {selectedBillboard.type || "Billboard"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => getDirections(selectedBillboard)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Navigation className="h-4 w-4" />
                Directions
              </button>
              <button
                onClick={() => viewBillboardDetails(selectedBillboard)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Show fallback if Google Maps failed to load or no API key
  if (showFallback || !hasGoogleMapsKey) {
    return <FallbackMap />
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden rounded-xl shadow-lg">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interactive map...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
            <div className="text-center">
              <div className="bg-red-100 text-red-600 p-6 rounded-lg max-w-sm">
                <Map className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <h3 className="font-semibold mb-2">Failed to load Google Maps</h3>
                <p className="text-sm mb-4">
                  Unable to load the interactive map. You can still view billboard locations using the fallback map.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={retryGoogleMaps}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setShowFallback(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Use Fallback Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={mapRef} style={{ height }} className="w-full"></div>

        {/* Current Location Button */}
        {!loading && !error && (
          <button
            onClick={getCurrentLocation}
            className="absolute top-4 right-4 bg-white hover:bg-gray-50 p-3 rounded-lg shadow-lg transition-colors"
            title="Get Current Location"
          >
            <Navigation className="h-5 w-5 text-blue-600" />
          </button>
        )}

        {/* Map Legend */}
        {!loading && !error && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
            <div className="text-sm font-medium mb-2">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Ad Location </span>
              </div>
            
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Your Location</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billboard Info Popup for Google Maps */}
      {selectedBillboard && !showFallback && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-20">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg">{selectedBillboard.title}</h3>
            <button onClick={() => setSelectedBillboard(null)} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          {selectedBillboard.photos?.[0] && (
            <img
              src={selectedBillboard.photos[0] || "/placeholder.svg"}
              alt={selectedBillboard.title}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{selectedBillboard.city}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-green-600">${selectedBillboard.price?.toLocaleString()}/month</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {selectedBillboard.type || "Billboard"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => getDirections(selectedBillboard)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              <Navigation className="h-4 w-4" />
              Directions
            </button>
            <button
              onClick={() => viewBillboardDetails(selectedBillboard)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
