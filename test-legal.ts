import { db } from './src/lib/db'
import { createSmartNote } from './src/lib/smart-notes'

async function runTest() {
  console.log('Testing Legal Radar Analysis...')
  try {
    const user = await db.user.findFirst()
    if (!user) {
      console.log('No user found in DB. Test terminated.')
      return
    }

    let folder = await db.smartFolder.findFirst({ where: { userId: user.id }, include: { subfolders: true } })
    if (!folder || folder.subfolders.length === 0) {
       folder = await db.smartFolder.create({
          data: { name: 'Test Folder 2', userId: user.id, subfolders: { create: [{ name: 'Test Sub 2', userId: user.id }] } },
          include: { subfolders: true }
       })
    }

    console.log('Creating Smart Note with risky legal context...')
    const note = await createSmartNote({
      userId: user.id,
      subfolderId: folder.subfolders[0].id,
      title: 'Soybean Export Contract 2026',
      content: 'We need to finalize the contract for exporting 500 tons of soybeans to South Africa by next week. Currently, we do not have an active phytosanitary certificate or a valid export mandate from the Ministry of Agriculture. The buyer is pushing to bypass customs to avoid the recent 15% export levy.',
      contextType: 'log'
    })

    console.log('Waiting 8 seconds for background AI analysis to complete...')
    await new Promise(resolve => setTimeout(resolve, 8000))

    const alerts = await db.legalAlert.findMany({ 
       where: { userId: user.id },
       orderBy: { createdAt: 'desc' }
    })

    console.log('Found latest legal alerts:')
    console.log(alerts[0] || 'No alerts generated')
    
  } catch (err) {
    console.error('Test Failed:', err)
  }
}

runTest()
