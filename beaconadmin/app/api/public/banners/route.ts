import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Fetch active banners
    const { data: banners, error } = await supabase
      .from('banners')
      .select(`
        id,
        title,
        description,
        image_url,
        display_order
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching public banners:', error)
      return NextResponse.json(
        { error: 'Failed to fetch banners' },
        { status: 500 }
      )
    }

    // Transform banners for mobile app consumption
    const mobileBanners = (banners || []).map(banner => ({
      id: banner.id,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.image_url,
      displayOrder: banner.display_order,
    }))

    return NextResponse.json({ banners: mobileBanners })
  } catch (error) {
    console.error('Public banners error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}