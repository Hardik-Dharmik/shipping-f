export function passwordError(password) {
 if ([...password].length < 8) return 'Password must be at least 8 characters.';
 if (new TextEncoder().encode(password).length > 72) return 'Password must be at most 72 UTF-8 bytes.';
 return '';
}
export function employeePayload(form, original) {
 const body = {};
 for (const key of ['name','email','company_name']) {
  const value = form[key].trim();
  if (!original || value !== (original[key] || '')) body[key] = value;
 }
 if (form.password) body.password = form.password;
 const permissions = [...form.page_permissions].sort();
 if (!original || JSON.stringify(permissions) !== JSON.stringify([...(original.page_permissions || [])].sort())) body.page_permissions = permissions;
 return body;
}
