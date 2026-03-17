import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateCompletion } from '@/lib/ai'
import { getUserId } from '@/lib/api-auth'
import { logAudit } from '@/lib/audit'
import { indexKnowledgeNode } from '@/lib/second-brain'

// Mock data for professional contexts
const MOCK_CONTEXTS = [
  {
    id: 'ctx-001',
    name: 'City General Hospital',
    type: 'healthcare',
    location: '123 Medical Center Dr',
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 200,
    isActive: true,
    color: '#10B981',
    icon: 'heart-pulse'
  },
  {
    id: 'ctx-002',
    name: 'Construction Site - Downtown',
    type: 'electrical',
    location: '456 Main Street',
    latitude: 40.7580,
    longitude: -73.9855,
    radius: 150,
    isActive: false,
    color: '#F59E0B',
    icon: 'zap'
  },
  {
    id: 'ctx-003',
    name: 'Home Office',
    type: 'development',
    location: 'Home',
    latitude: 40.7306,
    longitude: -73.9352,
    radius: 50,
    isActive: false,
    color: '#8B5CF6',
    icon: 'code'
  },
  {
    id: 'ctx-004',
    name: 'Malawi Farm Plot A',
    type: 'farming',
    location: 'Mwomboshi Valley',
    latitude: -13.9626,
    longitude: 33.7741,
    radius: 500,
    isActive: false,
    color: '#84cc16',
    icon: 'leaf'
  }
]

const MOCK_VOICE_NOTES = [
  {
    id: 'vn-001',
    transcript: 'Patient in room 302 showing signs of improvement. Vitals stable. Need to follow up on medication adjustment with Dr. Smith tomorrow morning.',
    category: 'patient_obs',
    workContext: 'healthcare',
    duration: 15,
    tags: JSON.stringify(['patient-care', 'follow-up']),
    processed: true,
    summary: 'Patient 302 improving, follow-up needed with Dr. Smith'
  },
  {
    id: 'vn-002',
    transcript: 'Junction box 4 has wiring issue. Red wire showing copper, needs to be replaced. Order part number JB-4500. Check circuit breaker on panel B.',
    category: 'electrical',
    workContext: 'electrical',
    duration: 22,
    tags: JSON.stringify(['wiring', 'repair', 'parts-needed']),
    processed: true,
    summary: 'JB4 wiring issue - need JB-4500 part, check panel B breaker'
  },
  {
    id: 'vn-003',
    transcript: 'Idea for the dashboard: implement a context switcher that uses geofencing. When I arrive at hospital, hide code snippets and show patient protocols instead.',
    category: 'code_idea',
    workContext: 'development',
    duration: 18,
    tags: JSON.stringify(['feature', 'geofencing', 'ux']),
    processed: true,
    summary: 'Context switcher with geofencing for location-based UI'
  }
]

const MOCK_INVENTORY = [
  { id: 'inv-001', name: 'Circuit Breaker 20A', category: 'electrical_parts', partNumber: 'CB-20A', quantity: 5, minQuantity: 3, unit: 'each', cost: 12.99, needsRestock: false },
  { id: 'inv-002', name: 'Wire Connectors (Box)', category: 'electrical_parts', partNumber: 'WC-100PK', quantity: 2, minQuantity: 5, unit: 'box', cost: 24.99, needsRestock: true },
  { id: 'inv-003', name: 'Nitrile Gloves (Box)', category: 'medical_supplies', partNumber: 'NG-100', quantity: 8, minQuantity: 3, unit: 'box', cost: 15.99, needsRestock: false },
  { id: 'inv-004', name: 'Digital Multimeter', category: 'electrical_parts', partNumber: 'DM-500', quantity: 2, minQuantity: 1, unit: 'each', cost: 89.99, needsRestock: false },
  { id: 'inv-005', name: 'Hand Sanitizer (Large)', category: 'medical_supplies', partNumber: 'HS-32OZ', quantity: 1, minQuantity: 2, unit: 'each', cost: 8.99, needsRestock: true },
  { id: 'inv-006', name: 'USB-C Cables', category: 'dev_equipment', partNumber: 'USB-C-6FT', quantity: 4, minQuantity: 2, unit: 'each', cost: 12.99, needsRestock: false }
]

const MOCK_CERTIFICATIONS = [
  { id: 'cert-001', name: 'Journeyman Electrician License', type: 'electrical', licenseNumber: 'JE-2024-12345', issueDate: new Date('2022-01-15'), expiryDate: new Date('2025-01-15'), status: 'active', cpdHours: 24, requiredHours: 30 },
  { id: 'cert-002', name: 'CPR/BLS Certification', type: 'healthcare', licenseNumber: 'BLS-98765', issueDate: new Date('2023-06-01'), expiryDate: new Date('2024-06-01'), status: 'expiring', cpdHours: 8, requiredHours: 8 },
  { id: 'cert-003', name: 'AWS Cloud Practitioner', type: 'development', licenseNumber: 'AWS-CP-54321', issueDate: new Date('2023-03-20'), expiryDate: new Date('2026-03-20'), status: 'active', cpdHours: 0, requiredHours: 0 },
  { id: 'cert-004', name: 'OSHA 10-Hour Construction', type: 'electrical', licenseNumber: 'OSHA-10-11111', issueDate: new Date('2023-09-01'), expiryDate: new Date('2025-09-01'), status: 'active', cpdHours: 10, requiredHours: 10 }
]

const MOCK_EMERGENCY_PROTOCOLS = [
  {
    id: 'ep-001',
    title: 'Electrical Shock Response',
    type: 'electrical',
    description: 'Steps to take when someone receives an electrical shock',
    steps: JSON.stringify([
      'Do NOT touch the person if still in contact with electrical source',
      'Cut power at the main breaker if safely accessible',
      'Call 911 immediately',
      'If safe to touch, check for breathing and pulse',
      'Begin CPR if no pulse/breathing',
      'Treat burns with cool water, cover with clean cloth',
      'Keep victim warm and calm until help arrives'
    ]),
    contacts: JSON.stringify([
      { name: 'Emergency', number: '911' },
      { name: 'Poison Control', number: '1-800-222-1222' }
    ]),
    isQuickAccess: true,
    priority: 1
  },
  {
    id: 'ep-002',
    title: 'Code Blue - Cardiac Arrest',
    type: 'healthcare',
    description: 'Response protocol for cardiac arrest',
    steps: JSON.stringify([
      'Verify unresponsiveness - tap shoulders, shout',
      'Call for help / activate emergency response',
      'Check for breathing and pulse (max 10 seconds)',
      'If no pulse: Begin CPR (30 compressions, 2 breaths)',
      'Apply AED as soon as available',
      'Continue CPR until advanced help arrives',
      'Document time of collapse and interventions'
    ]),
    contacts: JSON.stringify([
      { name: 'Code Team', number: 'Ext. 5555' },
      { name: 'Charge Nurse', number: 'Ext. 5001' }
    ]),
    isQuickAccess: true,
    priority: 1
  },
  {
    id: 'ep-003',
    title: 'Server Outage - Critical',
    type: 'development',
    description: 'Steps for handling critical server downtime',
    steps: JSON.stringify([
      'Check server status dashboard',
      'Attempt SSH connection to affected servers',
      'Check recent deployments/changes',
      'Review logs for error patterns',
      'Restart affected services if safe',
      'Scale up resources if needed',
      'Notify stakeholders via status page',
      'Document incident and timeline'
    ]),
    contacts: JSON.stringify([
      { name: 'DevOps Team', number: 'Slack: #incidents' },
      { name: 'AWS Support', number: '1-800-XXX-XXXX' }
    ]),
    isQuickAccess: true,
    priority: 2
  }
]

const MOCK_CODE_SNIPPETS = [
  {
    id: 'cs-001',
    title: 'Context Switcher Hook',
    description: 'React hook for switching contexts based on geolocation',
    code: `const useWorkContext = () => {
  const [context, setContext] = useState<WorkContext | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => checkContexts(position.coords),
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return context;
};`,
    language: 'typescript',
    tags: JSON.stringify(['react', 'hooks', 'geolocation']),
    source: 'typed',
    isFavorite: true
  },
  {
    id: 'cs-002',
    title: 'Voice Note Processor',
    description: 'NLP categorization for voice notes',
    code: `async function categorizeVoiceNote(transcript: string) {
  const keywords = {
    electrical: ['wire', 'circuit', 'breaker', 'junction', 'voltage'],
    healthcare: ['patient', 'vitals', 'medication', 'nurse', 'doctor'],
    development: ['function', 'component', 'API', 'database', 'feature']
  };

  // Match keywords and return category
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(w => transcript.toLowerCase().includes(w))) {
      return category;
    }
  }
  return 'general';
}`,
    language: 'typescript',
    tags: JSON.stringify(['nlp', 'voice', 'categorization']),
    source: 'voice',
    isFavorite: false
  }
]

export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')

  try {
    if (type === 'contexts') {
      let contexts = await db.workContext.findMany({
        where: { userId }
      })

      if (contexts.length === 0) {
        for (const ctx of MOCK_CONTEXTS) {
          await db.workContext.create({
            data: { ...ctx, userId }
          })
        }
        contexts = await db.workContext.findMany({
          where: { userId }
        })
      }
      return NextResponse.json({ contexts, success: true })
    }

    if (type === 'voice-notes') {
      let notes = await db.voiceNote.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (notes.length === 0) {
        for (const note of MOCK_VOICE_NOTES) {
          await db.voiceNote.create({
            data: { ...note, userId }
          })
        }
        notes = await db.voiceNote.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })
      }
      return NextResponse.json({ voiceNotes: notes, success: true })
    }

    if (type === 'inventory') {
      let items = await db.inventoryItem.findMany({
        where: { userId }
      })

      if (items.length === 0) {
        for (const item of MOCK_INVENTORY) {
          await db.inventoryItem.create({
            data: { ...item, userId }
          })
        }
        items = await db.inventoryItem.findMany({
          where: { userId }
        })
      }
      return NextResponse.json({ inventory: items, success: true })
    }

    if (type === 'certifications') {
      let certs = await db.certification.findMany({
        where: { userId },
        orderBy: { expiryDate: 'asc' }
      })

      if (certs.length === 0) {
        for (const cert of MOCK_CERTIFICATIONS) {
          await db.certification.create({
            data: { ...cert, userId }
          })
        }
        certs = await db.certification.findMany({
          where: { userId },
          orderBy: { expiryDate: 'asc' }
        })
      }
      return NextResponse.json({ certifications: certs, success: true })
    }

    if (type === 'emergency-protocols') {
      let protocols = await db.emergencyProtocol.findMany({
        where: { userId },
        orderBy: { priority: 'asc' }
      })

      if (protocols.length === 0) {
        for (const protocol of MOCK_EMERGENCY_PROTOCOLS) {
          await db.emergencyProtocol.create({
            data: { ...protocol, userId }
          })
        }
        protocols = await db.emergencyProtocol.findMany({
          where: { userId },
          orderBy: { priority: 'asc' }
        })
      }
      return NextResponse.json({ protocols, success: true })
    }

    if (type === 'code-snippets') {
      let snippets = await db.codeSnippet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (snippets.length === 0) {
        for (const snippet of MOCK_CODE_SNIPPETS) {
          await db.codeSnippet.create({
            data: { ...snippet, userId }
          })
        }
        snippets = await db.codeSnippet.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })
      }
      return NextResponse.json({ snippets, success: true })
    }

    // Return all professional data
    const [contexts, voiceNotes, inventory, certifications, protocols, snippets] = await Promise.all([
      db.workContext.findMany({ where: { userId } }),
      db.voiceNote.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      db.inventoryItem.findMany({ where: { userId } }),
      db.certification.findMany({ where: { userId } }),
      db.emergencyProtocol.findMany({ where: { userId } }),
      db.codeSnippet.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    ])

    return NextResponse.json({
      contexts,
      voiceNotes,
      inventory,
      certifications,
      protocols,
      snippets,
      success: true
    })
  } catch (error) {
    console.error('Failed to fetch professional data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', success: false },
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
    const data = await request.json()
    const { action, ...payload } = data

    // Voice note with NLP categorization
    if (action === 'create-voice-note') {
      const categorization = await generateCompletion([
        {
          role: 'system',
          content: `You are an NLP classifier. Analyze the voice transcript and determine:
1. Category: one of "patient_obs", "electrical", "code_idea", "general"
2. Tags: 3-5 relevant tags
3. Summary: a brief 1-sentence summary
4. IsSmartNote: boolean (true if the transcript contains phrases like "take a note", "remember this", or strongly implies taking a permanent note)
5. SmartNoteTitle: A concise title for the note if IsSmartNote is true
6. SmartNoteFolder: An appropriate folder name (e.g., "Work", "Ideas", "Personal")

Return JSON: { "category": "...", "tags": [...], "summary": "...", "isSmartNote": false, "smartNoteTitle": "...", "smartNoteFolder": "..." }`
        },
        { role: 'user', content: payload.transcript }
      ], {
        temperature: 0.3,
        max_tokens: 250
      })

      let nlpResult = { category: 'general', tags: [], summary: '', isSmartNote: false, smartNoteTitle: 'Voice Note', smartNoteFolder: 'Voice Notes' }
      try {
        nlpResult = JSON.parse(categorization.text || '{}')
      } catch (e) {
        console.error('Failed to parse NLP result')
      }

      const note = await db.voiceNote.create({
        data: {
          transcript: payload.transcript,
          category: nlpResult.category,
          workContext: nlpResult.category === 'patient_obs' ? 'healthcare' :
            nlpResult.category === 'electrical' ? 'electrical' :
              nlpResult.category === 'code_idea' ? 'development' : null,
          duration: payload.duration,
          audioUrl: payload.audioUrl,
          tags: JSON.stringify(nlpResult.tags),
          processed: true,
          summary: nlpResult.summary,
          userId
        }
      })

      // Hook into the Semantic Brain for Voice Note
      try {
        await indexKnowledgeNode({
          userId,
          nodeType: 'VoiceNote',
          referenceId: note.id,
          content: `Voice Note Category: ${note.category}. Summary: ${note.summary}. Transcript: ${note.transcript}`
        })
      } catch (embErr) {
        console.error('Failed to index VoiceNote:', embErr)
      }

      // Automatically create a Smart Note if triggered
      if (nlpResult.isSmartNote) {
         try {
           // Ensure we have a valid Subfolder to place this Voice Note into
           let targetSubfolder = await db.smartSubfolder.findFirst({
             where: { name: 'Voice Notes', userId }
           })
           
           if (!targetSubfolder) {
             let parentFolder = await db.smartFolder.findFirst({
               where: { name: 'Inbox', userId }
             })
             if (!parentFolder) {
               parentFolder = await db.smartFolder.create({
                 data: { name: 'Inbox', userId }
               })
             }
             targetSubfolder = await db.smartSubfolder.create({
               data: { name: 'Voice Notes', folderId: parentFolder.id, userId }
             })
           }

           const smartNote = await db.smartNote.create({
             data: {
               title: nlpResult.smartNoteTitle || 'Voice Note',
               content: payload.transcript + (nlpResult.summary ? `\n\n**AI Summary:** ${nlpResult.summary}` : ''),
               subfolderId: targetSubfolder.id,
               userId
             }
           })

           // Index the new Smart Note to the knowledge graph
           await indexKnowledgeNode({
             userId,
             nodeType: 'SmartNote',
             referenceId: smartNote.id,
             content: `Smart Note Title: ${smartNote.title}\nContent: ${smartNote.content}`
           })
         } catch (snErr) {
           console.error("Failed to create associated Smart Note:", snErr)
         }
      }

      return NextResponse.json({ note, nlpResult, success: true })
    }

    // Code snippet creation
    if (action === 'code-snippet') {
      const snippet = await db.codeSnippet.create({
        data: {
          title: payload.title,
          description: payload.description,
          code: payload.code,
          language: payload.language || 'javascript',
          tags: JSON.stringify(payload.tags || []),
          source: payload.source || 'typed',
          userId
        }
      })
      return NextResponse.json({ snippet, success: true })
    }

    // Inventory update
    if (action === 'inventory-use') {
      const item = await db.inventoryItem.update({
        where: { id: payload.id },
        data: {
          quantity: { decrement: payload.quantity || 1 },
          needsRestock: false
        }
      })

      if (item.quantity <= item.minQuantity) {
        await db.inventoryItem.update({
          where: { id: payload.id },
          data: { needsRestock: true }
        })
      }

      return NextResponse.json({ item, success: true })
    }

    // Energy log
    if (action === 'energy-log') {
      const log = await db.energyLog.create({
        data: {
          level: payload.level,
          energyType: payload.energyType,
          workContext: payload.workContext,
          activity: payload.activity,
          notes: payload.notes,
          tags: JSON.stringify(payload.tags || []),
          userId
        }
      })
      return NextResponse.json({ log, success: true })
    }

    // Shift logging with project impact
    if (action === 'log-shift') {
      const impactAnalysis = await generateCompletion([
        {
          role: 'system',
          content: `You are a project management assistant. Given shift details, suggest which project deadlines might need adjustment.
Return JSON: { "affectedProjects": [{ "name": "...", "delay": "X hours/days", "reason": "..." }] }`
        },
        { role: 'user', content: JSON.stringify(payload) }
      ], {
        temperature: 0.5,
        max_tokens: 300
      })

      let projectImpact = {}
      try {
        projectImpact = JSON.parse(impactAnalysis.text || '{}')
      } catch (e) { }

      const shift = await db.shift.create({
        data: {
          type: payload.type,
          location: payload.location,
          startTime: new Date(payload.startTime),
          endTime: payload.endTime ? new Date(payload.endTime) : null,
          duration: payload.duration,
          isOvertime: payload.isOvertime || false,
          notes: payload.notes,
          energyAfter: payload.energyAfter,
          impactOnProjects: JSON.stringify(projectImpact),
          userId
        }
      })

      return NextResponse.json({ shift, projectImpact, success: true })
    }

    // Unified search
    if (action === 'search') {
      const query = payload.query.toLowerCase()

      const results = await Promise.all([
        db.clientLog.findMany({
          where: {
            userId,
            OR: [
              { name: { contains: query } },
              { notes: { contains: query } }
            ]
          }
        }),
        db.voiceNote.findMany({
          where: {
            userId,
            OR: [
              { transcript: { contains: query } },
              { summary: { contains: query } }
            ]
          }
        }),
        db.codeSnippet.findMany({
          where: {
            userId,
            OR: [
              { title: { contains: query } },
              { code: { contains: query } },
              { description: { contains: query } }
            ]
          }
        })
      ])

      return NextResponse.json({
        results: {
          clients: results[0],
          voiceNotes: results[1],
          codeSnippets: results[2]
        },
        success: true
      })
    }

    return NextResponse.json({ error: 'Unknown action', success: false }, { status: 400 })
  } catch (error) {
    console.error('Professional API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', success: false },
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
    const data = await request.json()
    const { type, id, ...updateData } = data

    if (type === 'context') {
      await db.workContext.updateMany({
        where: { userId },
        data: { isActive: false }
      })

      const context = await db.workContext.update({
        where: { id },
        data: { isActive: true }
      })
      await logAudit(userId, 'context_switch', { contextId: id, contextType: context.type })
      return NextResponse.json({ context, success: true })
    }

    if (type === 'inventory') {
      const item = await db.inventoryItem.update({
        where: { id },
        data: updateData
      })
      return NextResponse.json({ item, success: true })
    }

    return NextResponse.json({ error: 'Unknown update type', success: false }, { status: 400 })
  } catch (error) {
    console.error('Failed to update:', error)
    return NextResponse.json(
      { error: 'Failed to update', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
  }
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    
    if (type === 'voice-note' && id) {
      await db.voiceNote.delete({
        where: { id, userId }
      })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Unknown delete type', success: false }, { status: 400 })
  } catch (error) {
    console.error('Failed to delete:', error)
    return NextResponse.json({ error: 'Failed to delete', success: false }, { status: 500 })
  }
}
