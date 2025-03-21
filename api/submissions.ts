import { submitPortal, getSubmissions, updateSubmissionStatus } from '../src/api/portal-submissions';
import { jsonResponse, authenticateAdmin } from '../src/api/utils';

export default async function handler(request: Request) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  // POST: Submit a new portal
  if (request.method === 'POST') {
    try {
      const data = await request.json();
      const result = await submitPortal(data);
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({ success: false, error: 'Invalid request' }, 400);
    }
  }
  
  // GET: Get submissions (requires admin authentication)
  if (request.method === 'GET') {
    const isAdmin = await authenticateAdmin(request);
    
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Get status query parameter
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    
    const result = await getSubmissions(status);
    return jsonResponse(result);
  }
  
  // PUT: Update submission status (requires admin authentication)
  if (request.method === 'PUT') {
    const isAdmin = await authenticateAdmin(request);
    
    if (!isAdmin) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    try {
      const data = await request.json();
      
      if (!data.id || !['approved', 'rejected'].includes(data.status)) {
        return jsonResponse({ success: false, error: 'Invalid request' }, 400);
      }
      
      const result = await updateSubmissionStatus(data.id, data.status);
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({ success: false, error: 'Invalid request' }, 400);
    }
  }
  
  return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
}