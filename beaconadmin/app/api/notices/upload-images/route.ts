import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/auth/auth-utils'

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
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseAdminClient()
    const uploadedUrls: string[] = []

    // Upload each image to Supabase Storage
    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `notices/${admin.id}/${fileName}`

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('notice-images')
        .upload(filePath, buffer, {
          contentType: file.type,
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('notice-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: 'Failed to upload any images' },
        { status: 500 }
      )
    }

    return NextResponse.json({ urls: uploadedUrls })
  } catch (error) {
    console.error('Upload images error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}