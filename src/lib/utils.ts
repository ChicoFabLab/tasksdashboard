export function getVolunteerName(v: any) {
  if (!v) return 'Volunteer';
  
  // Check if we have a username that looks like an email (from previous syncs)
  // or if it's a placeholder like "undefined" or empty
  const hasValidUsername = v.username && 
                          v.username !== '' && 
                          v.username !== 'Volunteer' && 
                          v.username !== 'undefined';

  // If we have a valid human-readable username, use it.
  if (hasValidUsername) return v.username;

  // Otherwise, fallback to other fields
  if (v.name && v.name !== '') return v.name;
  
  if (v.email && v.email !== '') {
      // If it's a placeholder discord email, parse the ID if possible, else fallback
      if (v.email.endsWith('@discord.user')) {
          // Try to get ID from email if discord_id field is missing
          const idPart = v.email.split('@')[0];
          return v.discord_id ? `Discord: ${v.discord_id}` : `Discord: ${idPart}`;
      }
      // Return the part before @ for regular emails
      return v.email.split('@')[0];
  }
  
  if (v.discord_id && v.discord_id !== '') return `Discord: ${v.discord_id}`;
  
  return 'Volunteer';
}


/**
 * Format minutes into a human-readable time string
 * @param minutes - Number of minutes
 * @returns Formatted string (e.g., "2h 30min", "45min", "3h")
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}min`;
  }
}
