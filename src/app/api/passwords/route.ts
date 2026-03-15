import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserId } from '@/lib/api-auth'
import { encrypt, decrypt } from '@/lib/encryption'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const entries = await db.passwordEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
    const passwords = entries.map((e) => ({
      id: e.id,
      website: e.website,
      username: e.username,
      password: decrypt(e.encryptedPassword),
      url: e.url,
      notes: e.notes,
      category: e.category,
      createdAt: e.createdAt,
      lastUsed: e.lastUsed,
    }))
    return NextResponse.json({ passwords, success: true })
  } catch (error) {
    console.error('Passwords GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch passwords', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { website, username, password, url, notes, category } = body
    if (!website || !username || !password) {
      return NextResponse.json(
        { error: 'website, username, and password are required', success: false },
        { status: 400 }
      )
    }
    const entry = await db.passwordEntry.create({
      data: {
        userId,
        website,
        username,
        encryptedPassword: encrypt(password),
        url: url || null,
        notes: notes || null,
        category: category || 'Personal',
      },
    })
    await logAudit(userId, 'password_added', { entryId: entry.id, website: entry.website })
    return NextResponse.json({
      password: {
        id: entry.id,
        website: entry.website,
        username: entry.username,
        password,
        url: entry.url,
        notes: entry.notes,
        category: entry.category,
        createdAt: entry.createdAt,
        lastUsed: entry.lastUsed,
      },
      success: true,
    })
  } catch (error) {
    console.error('Passwords POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create password entry', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { id, website, username, password, url, notes, category } = body
    if (!id) {
      return NextResponse.json({ error: 'id is required', success: false }, { status: 400 })
    }
    const existing = await db.passwordEntry.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found', success: false }, { status: 404 })
    }
    const updateData: Record<string, unknown> = {}
    if (website !== undefined) updateData.website = website
    if (username !== undefined) updateData.username = username
    if (password !== undefined) updateData.encryptedPassword = encrypt(password)
    if (url !== undefined) updateData.url = url
    if (notes !== undefined) updateData.notes = notes
    if (category !== undefined) updateData.category = category
    const entry = await db.passwordEntry.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json({
      password: {
        id: entry.id,
        website: entry.website,
        username: entry.username,
        password: password !== undefined ? password : decrypt(entry.encryptedPassword),
        url: entry.url,
        notes: entry.notes,
        category: entry.category,
        createdAt: entry.createdAt,
        lastUsed: entry.lastUsed,
      },
      success: true,
    })
  } catch (error) {
    console.error('Passwords PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update password entry', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id is required', success: false }, { status: 400 })
  }
  try {
    const existing = await db.passwordEntry.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found', success: false }, { status: 404 })
    }
    await db.passwordEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Passwords DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete password entry', success: false },
      { status: 500 }
    )
  }
}
