// Publication checks deliberately report categories, never matched private values.
export function privacyIssues(text, id='') {
 const issues=[];
 const checks=[
  ['локальный путь пользователя', /\/(?:Users|home)\/[a-zA-Z][^\s/]+\//],
  ['личный DDNS', /(?:[a-z0-9-]+\.)+crazedns\.ru/i],
  ['идентификатор устройства', /\b[0-9a-f]{32}\b|0x[0-9a-f]{12,}|[0-9a-f]{2}(?:_[0-9a-f]{2}){5}/i],
  ['закрытый ключ или токен', /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|\b(?:ghp_|github_pat_)[a-zA-Z0-9_]{20,}|\beyJ[a-zA-Z0-9_-]{20,}\./],
  ['похожее на секрет значение', /\b(?=[A-Za-z0-9]{28,}={0,2}\b)(?=[A-Za-z0-9]*[A-Z])(?=[A-Za-z0-9]*[a-z])(?=[A-Za-z0-9]*[0-9])[A-Za-z0-9]{28,}={0,2}/]
 ];
 for(const [label,pattern] of checks)if(pattern.test(text))issues.push(label);
 const emails=text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g)||[];
 if(emails.some(x=>!/@example\.(?:com|org|net)$/.test(x)))issues.push('адрес электронной почты');
 const ips=text.match(/\b(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/g)||[];
 // The W610 factory setup address is documented hardware information.
 if(ips.some(ip=>!(id==='rinnai-field'&&ip==='10.10.100.254')))issues.push('адрес частной сети');
 const macs=text.match(/\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/gi)||[];
 if(macs.some(x=>x.toUpperCase()!=='AA:BB:CC:DD:EE:FF'))issues.push('MAC-адрес');
 for(const match of text.matchAll(/["']?\b(?:password|privatekey|api_key|access_token)["']?\s*[:=]\s*["']?([^\n"'`,]+)/gi)){
  const value=match[1].trim();
  if(value&&!/^(?:!secret\b|REPLACE_|YOUR_|<|\[|твой|ваш|my_password\b)/i.test(value))issues.push('явно заданный пароль или ключ');
 }
 return [...new Set(issues)];
}
export function assertPublicContent(text,id){
 const issues=privacyIssues(text,id);
 if(issues.length)throw new Error(`Проверка публикации: ${id}: ${issues.join(', ')}`);
}
