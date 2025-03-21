import sql from './db';
import { FormData } from '../components/CreatePortalModal';

export async function submitPortal(data: FormData) {
  try {
    const result = await sql`
      INSERT INTO portal_submissions (
        title, description, url, color, glow_color, core_color, 
        position_x, position_y, position_z, radius, status
      ) VALUES (
        ${data.title}, ${data.description}, ${data.url}, 
        ${data.color}, ${data.glowColor}, ${data.coreColor}, 
        ${data.position.x}, ${data.position.y}, ${data.position.z}, 
        ${data.radius}, 'pending'
      ) RETURNING id
    `;
    return { success: true, id: result[0].id };
  } catch (error) {
    console.error('Error submitting portal:', error);
    return { success: false, error };
  }
}

export async function getSubmissions(status = 'all') {
  try {
    let query = sql`SELECT * FROM portal_submissions`;
    
    if (status !== 'all') {
      query = sql`SELECT * FROM portal_submissions WHERE status = ${status}`;
    }
    
    query = sql`${query} ORDER BY created_at DESC`;
    
    const submissions = await query;
    return { success: true, submissions };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return { success: false, error };
  }
}

export async function updateSubmissionStatus(id: number, status: 'approved' | 'rejected') {
  try {
    await sql`
      UPDATE portal_submissions 
      SET status = ${status}, updated_at = NOW() 
      WHERE id = ${id}
    `;
    return { success: true };
  } catch (error) {
    console.error('Error updating submission status:', error);
    return { success: false, error };
  }
}