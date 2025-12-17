export function formatDateToISO(d = new Date()){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export function formatTimeToSQLTime(d = new Date()){
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  const ss = String(d.getSeconds()).padStart(2,'0');
  return `${hh}:${mm}:${ss}`; // 24h -> Postgres time
}

export function displayTimeFromSQL(sqlTime: string|null){
  if(!sqlTime) return '-';
  try {
    // sqlTime usually 'HH:MM:SS'
    const [h,m] = sqlTime.split(':');
    const date = new Date();
    date.setHours(Number(h), Number(m), 0, 0);
    if(isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  } catch (e) {
    return 'Invalid Date';
  }
}
