import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for main image
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024 // 5MB for thumbnail
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'image' or 'thumbnail'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type || !['image', 'thumbnail'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be "image" or "thumbnail"' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_THUMBNAIL_SIZE
    if (file.size > maxSize) {
      const maxSizeMB = type === 'image' ? '10MB' : '5MB'
      return NextResponse.json(
        { error: `File too large. Maximum size for ${type} is ${maxSizeMB}.` },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `newsletters/${randomString}.${fileExtension}`

    // Determine bucket based on type
    const bucketName = type === 'image' ? 'newsletter-images' : 'newsletter-thumbnails'

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(buffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error(`Error uploading newsletter ${type}:`, uploadError)
      return NextResponse.json(
        { error: `Failed to upload ${type}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    if (!urlData.publicUrl) {
      return NextResponse.json(
        { error: `Failed to get ${type} URL` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('Upload newsletter file error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}