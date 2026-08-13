import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Reminder {
  id: string
  scholarship_id: string
  user_id: string
  days_before: number
  scheduled_for: string
  is_sent: boolean
  scholarships: {
    title: string
    organization: string | null
    deadline: string
    reference_links: string[]
  }
  profiles: {
    telegram_chat_id: string | null
  }
}

async function sendTelegramMessage(chatId: string, message: string) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  })
  
  return response.json()
}

function formatReminderMessage(reminder: Reminder): string {
  const { scholarships } = reminder
  const deadline = new Date(scholarships.deadline)
  const formattedDeadline = deadline.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  
  let message = `🎓 *Rappel de bourse d'études*\n\n`
  message += `📚 *Titre:* ${scholarships.title}\n`
  
  if (scholarships.organization) {
    message += `🏢 *Organisme:* ${scholarships.organization}\n`
  }
  
  message += `📅 *Deadline:* ${formattedDeadline}\n`
  message += `⏰ *Rappel:* ${reminder.days_before} jour${reminder.days_before > 1 ? 's' : ''} avant\n`
  
  if (scholarships.reference_links.length > 0) {
    message += `\n🔗 *Liens:*\n`
    scholarships.reference_links.forEach((link, index) => {
      message += `${index + 1}. [Lien ${index + 1}](${link})\n`
    })
  }
  
  return message
}

Deno.serve(async (req) => {
  try {
    // Get pending reminders
    const { data: reminders, error: fetchError } = await supabase
      .from('reminders')
      .select(`
        *,
        scholarships (
          title,
          organization,
          deadline,
          reference_links
        ),
        profiles (
          telegram_chat_id
        )
      `)
      .eq('is_sent', false)
      .lte('scheduled_for', new Date().toISOString())
    
    if (fetchError) {
      throw fetchError
    }
    
    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending reminders' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const results = []
    
    for (const reminder of reminders as Reminder[]) {
      const chatId = reminder.profiles.telegram_chat_id
      
      if (!chatId) {
        results.push({
          id: reminder.id,
          status: 'skipped',
          reason: 'No Telegram chat ID',
        })
        continue
      }
      
      try {
        const message = formatReminderMessage(reminder)
        await sendTelegramMessage(chatId, message)
        
        // Mark as sent
        const { error: updateError } = await supabase
          .from('reminders')
          .update({ is_sent: true })
          .eq('id', reminder.id)
        
        if (updateError) {
          throw updateError
        }
        
        results.push({
          id: reminder.id,
          status: 'sent',
        })
      } catch (error) {
        results.push({
          id: reminder.id,
          status: 'error',
          error: error.message,
        })
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Processed ${reminders.length} reminders`,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
