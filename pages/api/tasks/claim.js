import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { taskId } = req.body || {};
  if (!taskId) return res.status(400).json({ error: 'Missing taskId' });

  try {
    // Verify user by decoding token using Supabase Admin
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token' });
    const user = userData.user;

    // Fetch task and ensure it's assigned to this user and open
    const { data: task, error: taskErr } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) return res.status(404).json({ error: 'Task not found' });
    if (task.assigned_to !== user.id) return res.status(403).json({ error: 'Not your task' });
    if (task.status !== 'open') return res.status(400).json({ error: 'Task not open' });

    // Mark task done and credit points inside a transaction
    const { error: updErr } = await supabaseAdmin
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', taskId);

    if (updErr) return res.status(500).json({ error: 'Failed to update task' });

    // Credit points to profile
    const { error: creditErr } = await supabaseAdmin.rpc('increment_points', { userid: user.id, add_points: task.points });

    if (creditErr) return res.status(500).json({ error: 'Failed to credit points' });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
  
