import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_ROUTES, canAccessPage, landingPage, routePermission } from '../src/utils/pageAccess.js';
import { passwordError, employeePayload } from '../src/utils/employeeForm.js';
test('employee access is deny by default and uses account role only', () => {
 assert.equal(landingPage({role:'employee'}), '/access-not-assigned');
 assert.equal(canAccessPage({role:'user',organization_role:'employee',page_permissions:['users']},'users'), false);
 assert.equal(canAccessPage({role:'employee',page_permissions:['users']},routePermission('/admin/employees')),false);
 for (const [key,,route] of PAGE_ROUTES) {
  const employee={role:'employee',page_permissions:[key]};
  assert.equal(landingPage(employee),route);
  assert.equal(canAccessPage(employee,routePermission(route)),true);
  assert.equal(canAccessPage({role:'admin'},key),true);
 }
 assert.equal(landingPage({role:'user'}),'/calculate-rate');
});
test('nested routes require the underlying permission', () => {
 assert.equal(routePermission('/admin/users/42/orders'),'user_orders');
 assert.equal(routePermission('/admin/orders/42'),'user_orders');
 assert.equal(routePermission('/admin/kyc/requests/42'),'kyc_requests');
 assert.equal(routePermission('/orders/manual'),'create_order');
 assert.equal(routePermission('/orders/list'),undefined);
});
test('password limits use characters and UTF-8 bytes', () => {
 assert.notEqual(passwordError('1234567'),'');
 assert.equal(passwordError('12345678'),'');
 assert.equal(passwordError('a'.repeat(72)),'');
 assert.notEqual(passwordError('a'.repeat(73)),'');
 assert.equal(passwordError('\u00e9'.repeat(36)),'');
 assert.notEqual(passwordError('\u00e9'.repeat(37)),'');
 assert.notEqual(passwordError('\u{1f600}'.repeat(7)),'');
 assert.equal(passwordError('\u{1f600}'.repeat(18)),'');
 assert.notEqual(passwordError('\u{1f600}'.repeat(19)),'');
});
test('PATCH omits unchanged fields, permits full revocation and excludes unsupported fields', () => {
 const original={name:'Alex',email:'a@example.com',company_name:'',page_permissions:['home','users']};
 const form={...original,password:'',role:'admin',page_permissions:['users','home']};
 assert.deepEqual(employeePayload(form,original),{});
 assert.deepEqual(employeePayload({...form,page_permissions:[]},original),{page_permissions:[]});
 assert.deepEqual(employeePayload({...form,password:'new-password'},original),{password:'new-password'});
 assert.deepEqual(employeePayload({...form,name:'New'},original),{name:'New'});
 assert.deepEqual(employeePayload({...form,page_permissions:[],password:'initial-password'},null),{name:'Alex',email:'a@example.com',company_name:'',password:'initial-password',page_permissions:[]});
});
