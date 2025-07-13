import { db, auth } from "@/firebase/config"
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore"
import axios from "axios"

export interface Job {
  id: string
  userId: string
  title: string
  companyName: string
  photos: string[]
  city: string
  jobType: string
  location?: {
    lat: number
    lng: number
  }
  salary: string
  description: string
  requirements: string
  timestamp: any
  isActive: boolean
}

export const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Hyderabad",
  "Gujranwala",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
  "Larkana",
]

export const jobTypes = ["Full-time", "Part-time", "Contract", "Freelance", "Internship", "Remote", "Hybrid", "On-site"]

// Upload image to ImgBB
export async function uploadImageToImgbb(file: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("key", "1c68955746294f27f97d3aee877488ea") // ImgBB API Key

    const response = await axios.post("https://api.imgbb.com/1/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    if (response.data.success) {
      return response.data.data.url
    } else {
      throw new Error("Image upload failed")
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

// Save job to Firebase
export async function saveJobToFirebase(jobData: Omit<Job, "id" | "userId" | "timestamp">) {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("You must be logged in to post a job")
    }

    const jobDoc = {
      userId: currentUser.uid,
      ...jobData,
      timestamp: serverTimestamp(),
      isActive: true,
    }

    const docRef = await addDoc(collection(db, "jobs"), jobDoc)
    return docRef.id
  } catch (error) {
    console.error("Error saving job:", error)
    throw error
  }
}

// Get all jobs
export async function getAllJobs(): Promise<Job[]> {
  try {
    const jobsQuery = query(collection(db, "jobs"), orderBy("timestamp", "desc"))
    const jobsSnapshot = await getDocs(jobsQuery)

    return jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Job[]
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return []
  }
}

// Get user's jobs
export async function getUserJobs(): Promise<Job[]> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("You must be logged in to view your jobs")
    }

    const jobsQuery = query(
      collection(db, "jobs"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc"),
    )

    const jobsSnapshot = await getDocs(jobsQuery)

    return jobsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Job[]
  } catch (error) {
    console.error("Error fetching user jobs:", error)
    return []
  }
}
