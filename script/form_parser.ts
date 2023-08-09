export function formParser(obj: Record<string, string | File>) {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const match = key.match(/^(\w+)\[(\d+)\]\[(.+)\]$/);
    if (match) {
      const prefix = match[1];
      const index = parseInt(match[2], 10);
      const prop = match[3];
      result[prefix] = result[prefix] || [];
      result[prefix][index] = result[prefix][index] || { name: '', hometown: '' };
      result[prefix][index][prop] = obj[key];
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}