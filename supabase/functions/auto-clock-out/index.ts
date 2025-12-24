import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find all active timesheets that have been running for more than 12 hours
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    
    console.log('Checking for timesheets older than:', twelveHoursAgo)

    const { data: overdueTimesheets, error: fetchError } = await supabase
      .from('timesheets')
      .select('id, employee_id, clock_in, business_id')
      .eq('status', 'active')
      .lt('clock_in', twelveHoursAgo)

    if (fetchError) {
      console.error('Error fetching overdue timesheets:', fetchError)
      throw fetchError
    }

    console.log('Found overdue timesheets:', overdueTimesheets?.length || 0)

    if (!overdueTimesheets || overdueTimesheets.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No overdue timesheets found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auto clock out each overdue timesheet
    const results = []
    for (const timesheet of overdueTimesheets) {
      // Set clock_out to exactly 12 hours after clock_in
      const clockInTime = new Date(timesheet.clock_in)
      const autoClockOutTime = new Date(clockInTime.getTime() + 12 * 60 * 60 * 1000)

      const { error: updateError } = await supabase
        .from('timesheets')
        .update({
          clock_out: autoClockOutTime.toISOString(),
          status: 'completed',
          auto_clocked_out: true,
          notes: 'Auto clocked out after 12 hours'
        })
        .eq('id', timesheet.id)

      if (updateError) {
        console.error('Error updating timesheet:', timesheet.id, updateError)
        results.push({ id: timesheet.id, success: false, error: updateError.message })
      } else {
        console.log('Auto clocked out timesheet:', timesheet.id)
        results.push({ id: timesheet.id, success: true, employee_id: timesheet.employee_id })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Auto clock-out completed', 
        count: overdueTimesheets.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Auto clock-out error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
