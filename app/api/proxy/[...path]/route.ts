import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://astrolabe-feature-management-711061180499.europe-west1.run.app/api/v1'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const url = `${API_BASE_URL}/${path}${queryString ? `?${queryString}` : ''}`
    
    console.log('Proxying request to:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error response:', errorText)
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Response data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const body = await request.text()
    const url = `${API_BASE_URL}/${path}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const body = await request.text()
    const url = `${API_BASE_URL}/${path}`
    
    console.log('Proxying PATCH request to:', url)
    console.log('Request body:', body)
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    })

    console.log('PATCH Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PATCH API error response:', errorText)
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('PATCH Response data:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('PATCH Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
