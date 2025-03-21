// Helper function to handle API responses
export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Helper function for API authentication - works in both frontend and serverless environments
export async function authenticateAdmin(request: Request) {
  // Get the authorization header
  const authHeader = request.headers.get('Authorization');
  
  // Check if auth header exists and has the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  // Extract the token
  const token = authHeader.replace('Bearer ', '');
  
  // Check environment - use process.env for serverless functions, import.meta.env for frontend
  const adminKey = typeof process !== 'undefined' && process.env 
    ? process.env.ADMIN_API_KEY 
    : import.meta.env.VITE_ADMIN_API_KEY;
  
  // Check if the token matches the expected admin token
  return token === adminKey;
}