import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
// Use the service role key to bypass RLS when injecting data locally.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Check .env: You need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function seed() {
    try {
        console.log('🔄 Reading client.json...')
        const dataPath = resolve(__dirname, '../src/client.json')
        const raw = readFileSync(dataPath, 'utf8')
        const data = JSON.parse(raw)
        const clientData = data

        if (!clientData) {
            throw new Error(`Client data not found.`)
        }

        console.log(`\n🚀 Seeding Supabase for ✨ ${clientData.brand?.name || 'Live Site'} ✨\n`)

        // 1. Seed Testimonials
        const testimonials = clientData.testimonials?.items || []
        if (testimonials.length > 0) {
            console.log(`Writing ${testimonials.length} testimonials...`)
            for (let i = 0; i < testimonials.length; i++) {
                const item = testimonials[i]
                const { error } = await supabase.from('testimonials').insert([{
                    name: item.name,
                    initial: item.initial || item.name?.[0] || '?',
                    service: item.service,
                    quote: item.quote,
                    order: i
                }])
                if (error) throw error
            }
        }

        // 2. Seed Services (Prices)
        const services = clientData.services?.items || []
        if (services.length > 0) {
            console.log(`Writing ${services.length} services...`)
            for (let i = 0; i < services.length; i++) {
                const item = services[i]
                const { error } = await supabase.from('services').insert([{
                    title: item.title,
                    price: item.price,
                    unit: item.unit,
                    icon: item.icon,
                    imageUrl: item.image,
                    description: item.description,
                    features: item.features || [],
                    order: i
                }])
                if (error) throw error
            }
        }

        // 3. Seed Gallery
        const gallery = clientData.gallery?.items || []
        if (gallery.length > 0) {
            console.log(`Writing ${gallery.length} photos...`)
            for (let i = 0; i < gallery.length; i++) {
                const item = gallery[i]
                // Supabase wants standard image names instead of Vite imports for DB layer usually, but we will keep as is for legacy UI resolver compat.
                const { error } = await supabase.from('gallery').insert([{
                    label: item.label,
                    alt: item.alt || item.label,
                    imageUrl: item.image, // The vite path "gallery-livesession.png" or full URL
                    order: i
                }])
                if (error) throw error
            }
        }

        // 4. Seed Videos
        if (clientData.videos?.length > 0) {
            console.log(`Writing ${clientData.videos.length} videos...`)
            for (let i = 0; i < clientData.videos.length; i++) {
                const item = clientData.videos[i]
                const { error } = await supabase.from('videos').insert([{
                    title: item.title,
                    description: item.description,
                    videoUrl: item.videoUrl,
                    thumbnailUrl: item.thumbnailUrl,
                    order: i
                }])
                if (error) throw error
            }
        }

        console.log('\n✅ Database successfully seeded!')
        console.log("If any errors occurred about 'Row Level Security' (RLS), temporarily disable RLS on all tables, re-run this script, and then re-enable it. Or just use your Service Role Key in .env!")

    } catch (err) {
        console.error('\n❌ Seeding failed:', err.message)
    }
}

seed()
