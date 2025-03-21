import { promises as fs } from 'fs';
import path from 'path';
import { authenticateAdmin, jsonResponse } from '../src/api/utils';

export default async function handler(request: Request) {
  // Only allow PUT requests
  if (request.method !== 'PUT') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  // Verify admin authentication
  const isAdmin = await authenticateAdmin(request);
  if (!isAdmin) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    // Get submission data from request
    const submission = await request.json();
    
    // Path to games.ts file
    const gamesFilePath = path.join(process.cwd(), 'src', 'data', 'games.ts');
    
    // Read the current games.ts file
    let gamesFileContent = await fs.readFile(gamesFilePath, 'utf8');
    
    // Generate a unique ID for the new game based on the title
    const gameId = submission.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Convert hex colors to numbers (0xffffff format)
    const hexToNumber = (hex: string) => parseInt(hex.replace('#', ''), 16);
    
    // Determine an icon based on some logic (simplified here)
    // In production, you might want to allow uploading icons or choosing from a preset
    const icon = "FaGamepad"; // Default icon - from "react-icons/fa6"
    
    // Generate the new game entry
    const newGameEntry = `
  {
    id: '${gameId}',
    title: '${submission.title.replace(/'/g, "\\'")}',
    description: '${submission.description.replace(/'/g, "\\'")}',
    url: '${submission.url.replace(/'/g, "\\'")}',
    icon: React.createElement(FaGamepad, { size: 36, className: "mb-4" }),
    enabled: true,
    
    // 3D world properties
    position: new THREE.Vector3(${submission.position_x}, ${submission.position_y}, ${submission.position_z}),
    radius: ${submission.radius},
    color: 0x${submission.color.replace('#', '')},
    glowColor: 0x${submission.glow_color.replace('#', '')},
    coreColor: 0x${submission.core_color.replace('#', '')},
    collisionRadius: ${submission.radius}
  },`;
    
    // Find the position to insert the new entry (right after the array opening or before the last comment)
    const insertPosition = gamesFileContent.indexOf('// Add more games here as needed');
    
    if (insertPosition !== -1) {
      // Insert before the comment
      gamesFileContent = gamesFileContent.slice(0, insertPosition) + newGameEntry + '\n  ' + gamesFileContent.slice(insertPosition);
    } else {
      // If comment not found, insert at the end of the array
      const arrayEndPosition = gamesFileContent.lastIndexOf('];');
      gamesFileContent = gamesFileContent.slice(0, arrayEndPosition) + newGameEntry + gamesFileContent.slice(arrayEndPosition);
    }
    
    // Write back to the file
    await fs.writeFile(gamesFilePath, gamesFileContent);
    
    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error updating games.ts:', error);
    return jsonResponse({ success: false, error: 'Failed to update games file' }, 500);
  }
}